import { Octokit } from '@octokit/core'
import state, { IFile } from '../index'
import { templateFileIds, templatesRepo } from '../constants'
import { getFileExtention } from '../../utils/helpers'
import { languageMapping } from './createNewFile'

const octokit = new Octokit()

const languageOf = (name: string) => languageMapping[getFileExtention(name) || ''] || 'text'

/** The Hook API headers bundled with the IDE (public/headers), added to every template. */
const fetchBundledHeaders = async (): Promise<IFile[]> => {
  const idx = await fetch('/headers/index.json')
  if (!idx.ok) throw Error('Failed to fetch bundled headers')
  const names: string[] = await idx.json()
  return Promise.all(
    names.map(async name => {
      const r = await fetch(`/headers/${name}`)
      if (!r.ok) throw Error(`Failed to fetch header ${name}`)
      return { name, language: 'c', content: await r.text() }
    })
  )
}

/** templates/<id>/ of the templates repository, listed through the GitHub contents API and read raw. */
const fetchTemplateFiles = async (id: string): Promise<IFile[]> => {
  const { owner, repo, ref } = templatesRepo
  const dir = await octokit.request('GET /repos/{owner}/{repo}/contents/{path}', {
    owner,
    repo,
    ref,
    path: `templates/${id}`
  })
  if (!Array.isArray(dir.data)) throw Error(`Template ${id} not found in ${owner}/${repo}`)
  const files = await Promise.all(
    dir.data
      .filter(entry => entry.type === 'file' && entry.download_url)
      .map(async entry => {
        const r = await fetch(entry.download_url as string)
        if (!r.ok) throw Error(`Failed to fetch ${entry.path}`)
        return { name: entry.name, language: languageOf(entry.name), content: await r.text() }
      })
  )
  return files.concat(await fetchBundledHeaders())
}

const fetchGistFiles = async (gistId: string) => {
  const res = await octokit.request('GET /gists/{gist_id}', { gist_id: gistId })
  if (!res.data.files) throw Error('No files could be fetched from given gist id!')
  const files: IFile[] = Object.keys(res.data.files).map(filename => ({
    name: res.data.files?.[filename]?.filename || 'untitled.c',
    language: res.data.files?.[filename]?.language?.toLowerCase() || '',
    content: res.data.files?.[filename]?.content || ''
  }))
  return { files, owner: res.data.owner?.login }
}

/**
 * Fetches the files of a template (by its id) or of a GitHub Gist (by its id) into global state
 */
export const fetchFiles = async (gistId: string) => {
  if (!gistId || state.files.length) return

  const template = Object.values(templateFileIds).find(tmp => tmp.id === gistId)

  state.loading = true
  state.logs.push({
    type: 'log',
    message: template ? `Fetching template: ${template.name}` : `Fetching Gist with id: ${gistId}`
  })
  try {
    const { files, owner } = template
      ? { files: await fetchTemplateFiles(template.id), owner: undefined }
      : await fetchGistFiles(gistId)

    files.sort((a, b) => {
      const aBasename = a.name.split('.')?.[0]
      const aExt = a.name.split('.').pop() || ''
      const bBasename = b.name.split('.')?.[0]
      const bExt = b.name.split('.').pop() || ''

      // default priority is undefined == 0
      const extPriority: Record<string, number> = {
        c: 3,
        wat: 3,
        md: 2,
        h: -1
      }

      // Sort based on extention priorities
      const comp = (extPriority[bExt] || 0) - (extPriority[aExt] || 0)
      if (comp !== 0) return comp

      // Otherwise fallback to alphabetical sorting
      return aBasename.localeCompare(bBasename)
    })

    state.logs.push({
      type: 'success',
      message: 'Fetched successfully ✅'
    })
    state.files = files
    state.gistId = gistId
    state.gistOwner = owner

    const gistName =
      files.find(file => file.language === 'c' || file.language === 'javascript')?.name ||
      'untitled'
    state.gistName = gistName
  } catch (err) {
    console.error(err)
    let message: string
    if (err instanceof Error) message = err.message
    else message = `Something went wrong, try again later!`
    state.logs.push({
      type: 'error',
      message: `Error: ${message}`
    })
  }
  state.loading = false
}
