import toast from 'react-hot-toast'
import Router from 'next/router'

import state from '../index'
import { saveFile } from './saveFile'
import { compileFiles } from '../../utils/compilerWorker'
import { ref } from 'valtio'
import { xrplSend } from './xrpl-client'

interface ValidateResult {
  valid?: boolean
  instruction_count_hook?: string
  instruction_count_cbak?: string
  log?: string[]
  vm_error?: string
  error?: string
  error_message?: string
}

/* Asks the connected node to run its guard/gas checks on the wasm.
 * Throws (with a message) when the node cannot answer, so callers can warn and continue.
 */
const validateHook = async (wasm: Uint8Array): Promise<ValidateResult> => {
  const code = Array.from(wasm, b => b.toString(16).padStart(2, '0')).join('').toUpperCase()
  let timer: number | undefined
  const timeout = new Promise<never>((_, reject) => {
    timer = window.setTimeout(() => reject(new Error('timed out after 15s')), 15000)
  })
  try {
    const res = (await Promise.race([xrplSend({ command: 'hook_validate', code }), timeout])) as ValidateResult
    if (res?.error) throw new Error(['unknownCmd', 'notSupported'].includes(res.error) ? '' : res.error_message || res.error)
    return res
  } finally {
    clearTimeout(timer)
  }
}

/* compileCode sends the code of the active file to compile endpoint
 * If all goes well you will get base64 encoded wasm file back with
 * some extra logging information if we can provide it. This function
 * also decodes the returned wasm and creates human readable WAT file
 * out of it and store both in global state.
 */
export const compileCode = async (activeId: number) => {
  // Save the file to global state
  saveFile(false, activeId)
  const file = state.files[activeId]
  if (file.name.endsWith('.wat')) {
    return compileWat(activeId)
  }

  // Bail out if we're already compiling
  if (state.compiling) return

  const files: Record<string, string> = {}
  state.files.forEach(f => {
    if (f.name.endsWith('.c') || f.name.endsWith('.h')) files[f.name] = f.content
  })
  const level = state.compileOptions.optimizationLevel
  const opt = level === '-O4' ? '-O3' : level || '-O2'

  state.compiling = true
  state.logs = []
  file.containsErrors = false
  const toastId = toast.loading('Compiling…', { position: 'bottom-center' })
  try {
    const result = await compileFiles(files, file.name, opt, (done, total) => {
      const pct = total ? Math.floor((done / total) * 100) : 0
      toast.loading(`Loading compiler ${pct}%…`, { id: toastId, position: 'bottom-center' })
    })
    // copy into a plain ArrayBuffer of exactly the wasm bytes
    const buffer = result.wasm.buffer.slice(
      result.wasm.byteOffset,
      result.wasm.byteOffset + result.wasm.byteLength
    ) as ArrayBuffer
    // xahaud's HookHash is the first 32 bytes of SHA-512 over the CreateCode
    const hookHash = Array.from(
      new Uint8Array(await crypto.subtle.digest('SHA-512', buffer)).subarray(0, 32),
      x => x.toString(16).padStart(2, '0')
    )
      .join('')
      .toUpperCase()
    if (result.logs.length) {
      state.logs.push({ type: 'log', message: result.logs.join('\n'), defaultCollapsed: true })
    }

    toast.loading('Validating…', { id: toastId, position: 'bottom-center' })
    let validation: ValidateResult | undefined
    try {
      validation = await validateHook(result.wasm)
    } catch (e) {
      const reason = (e instanceof Error && e.message) || 'the connected node does not support hook_validate'
      state.logs.push({
        type: 'warning',
        message: `Guard check skipped: ${reason}. SetHook may still reject this hook.`
      })
    }
    if (validation && validation.valid === false) {
      ;(validation.log || []).forEach(l => state.logs.push({ type: 'error', message: l }))
      if (validation.vm_error) state.logs.push({ type: 'error', message: validation.vm_error })
      toast.error('Hook validation failed!', { id: toastId, position: 'bottom-center' })
      file.containsErrors = true
      state.compiling = false
      return
    }

    file.compiledContent = ref(buffer)
    file.lastCompiled = new Date()
    file.compiledValueSnapshot = file.content
    file.compiledWatContent = result.wat

    toast.success('Compiled successfully!', { id: toastId, position: 'bottom-center' })
    const name = file.name.replace(/\.c$/, '.wasm')
    state.logs.push({
      type: 'success',
      message:
        `Compiled ${name}: ${result.finalSize} bytes (raw ${result.rawSize}, wasm-opt ${result.optimizedSize})` +
        (validation?.valid
          ? ` · worst-case instruction count hook ${validation.instruction_count_hook}, cbak ${validation.instruction_count_cbak}`
          : '') +
        ` · HookHash ${hookHash}`,
      link: Router.asPath.replace('develop', 'deploy'),
      linkText: 'Go to deploy'
    })
  } catch (err) {
    console.log(err)
    const message = err instanceof Error ? err.message : 'Something went wrong, come back later!'
    message
      .split('\n')
      .filter(l => l.trim())
      .forEach(l => state.logs.push({ type: 'error', message: l }))
    toast.error('Error occurred while compiling!', { id: toastId, position: 'bottom-center' })
    file.containsErrors = true
  }
  state.compiling = false
}

export const compileWat = async (activeId: number) => {
  if (state.compiling) return
  const file = state.files[activeId]
  state.compiling = true
  state.logs = []
  try {
    const wabt = await (await import('wabt')).default()
    const module = wabt.parseWat(file.name, file.content)
    module.resolveNames()
    module.validate()
    const { buffer } = module.toBinary({
      log: false,
      write_debug_names: true
    })

    file.compiledContent = ref(buffer)
    file.lastCompiled = new Date()
    file.compiledValueSnapshot = file.content
    file.compiledWatContent = file.content

    toast.success('Compiled successfully!', { position: 'bottom-center' })
    state.logs.push({
      type: 'success',
      message: `File ${state.files?.[activeId]?.name} compiled successfully. Ready to deploy.`,
      link: Router.asPath.replace('develop', 'deploy'),
      linkText: 'Go to deploy'
    })
  } catch (err) {
    console.log(err)
    let message = 'Error compiling WAT file!'
    if (err instanceof Error) {
      message = err.message
    }
    state.logs.push({
      type: 'error',
      message
    })
    toast.error(`Error occurred while compiling!`, { position: 'bottom-center' })
    file.containsErrors = true
  }
  state.compiling = false
}
