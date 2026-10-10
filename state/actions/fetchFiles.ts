import { Octokit } from '@octokit/core'
import state, { IFile } from '../index'
import { templateFileIds } from '../constants'

const octokit = new Octokit()

const defaultIndexFile: IFile = {
  name: 'index.c',
  language: 'c',
  content: `/**
 * This hook just accepts any transaction coming through it
 */
#include "hookapi.h"

int64_t hook(uint32_t reserved) {

  TRACESTR("index.c: Called.");
  accept(SBUF("accept"), __LINE__);

  GUARD(1);
  // unreachable
  return 0;
}`
}

const headerFileFromEntry = ([key, value]: [string, unknown]) => {
  const filename = key.endsWith('.h') ? key : `${key}.h`
  return {
    name: filename,
    language: 'c',
    content: typeof value === 'string' ? value : ''
  }
}

const fetchApiHeaderFiles = async (): Promise<IFile[]> => {
  const headerRes = await fetch(
    `${process.env.NEXT_PUBLIC_COMPILE_API_BASE_URL}/api/header-files`
  )
  if (!headerRes.ok) throw Error('Failed to fetch headers')

  const headerJson = (await headerRes.json()) as Record<string, unknown>
  return Object.entries(headerJson).map(headerFileFromEntry)
}

export const fetchHeaderFiles = async () => {
  if (state.files.some(file => file.name.endsWith('.h'))) return 0

  state.loading = true
  state.logs.push({
    type: 'log',
    message: 'Fetching header files'
  })
  try {
    const headerFiles = await fetchApiHeaderFiles()
    const existingFileNames = new Set(state.files.map(file => file.name))
    const newHeaderFiles = headerFiles.filter(file => !existingFileNames.has(file.name))

    if (!state.files.some(file => file.name.endsWith('.c'))) {
      state.files.push({ ...defaultIndexFile })
    }
    state.files.push(...newHeaderFiles)
    state.logs.push({
      type: 'success',
      message: 'Header files downloaded successfully ✅'
    })
    return newHeaderFiles.length
  } catch (err) {
    console.error(err)
    const message = err instanceof Error ? err.message : 'Something went wrong, try again later!'
    state.logs.push({
      type: 'error',
      message: `Error: ${message}`
    })
    throw err
  } finally {
    state.loading = false
  }
}

/**
 * Fetches files from Github Gists based on gistId and stores them in global state
 */
export const fetchFiles = async (gistId: string) => {
  if (!gistId || state.files.length) return

  state.loading = true
  state.logs.push({
    type: 'log',
    message: `Fetching Gist with id: ${gistId}`
  })
  try {
    const res = await octokit.request('GET /gists/{gist_id}', { gist_id: gistId })

    const isTemplate = (id: string) =>
      Object.values(templateFileIds)
        .map(v => v.id)
        .includes(id)

    if (isTemplate(gistId)) {
      const template = Object.values(templateFileIds).find(tmp => tmp.id === gistId)
      let headerFiles: Record<string, { filename: string; content: string; language: string }> =
        {}
      if (template?.headerId) {
        const resHeader = await octokit.request('GET /gists/{gist_id}', {
          gist_id: template.headerId
        })
        if (!resHeader.data.files) {
          throw new Error('No header files could be fetched from given gist id!')
        }
        headerFiles = resHeader.data.files as any
      } else {
        const apiHeaderFiles = await fetchApiHeaderFiles()
        headerFiles = apiHeaderFiles.reduce<
          Record<string, { filename: string; content: string; language: string }>
        >((files, file) => {
          files[file.name] = { filename: file.name, content: file.content, language: 'C' }
          return files
        }, {})
      }
      const files = {
        ...res.data.files,
        ...headerFiles
      }
      res.data.files = files
    }

    if (!res.data.files) throw Error('No files could be fetched from given gist id!')

    const files: IFile[] = Object.keys(res.data.files).map(filename => ({
      name: res.data.files?.[filename]?.filename || 'untitled.c',
      language: res.data.files?.[filename]?.language?.toLowerCase() || '',
      content: res.data.files?.[filename]?.content || ''
    }))

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
    state.gistOwner = res.data.owner?.login

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
