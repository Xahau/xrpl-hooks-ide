export type Opt = '-O0' | '-O1' | '-O2' | '-O3' | '-Os'

export interface CompileResult {
  wasm: Uint8Array
  rawSize: number
  optimizedSize: number
  finalSize: number
  sha256: string
  imports: string[]
  exports: string[]
  wat: string
  logs: string[]
}

interface Job {
  kind: 'compile' | 'check'
  files: Record<string, string>
  entry: string
  opt?: Opt
  onProgress?: (done: number, total: number) => void
  resolve: (v: any) => void
  reject: (e: Error) => void
}

let worker: Worker | null = null
let current: Job | null = null
const pending: Job[] = []
let nextId = 1

const dropWorker = () => {
  worker?.terminate()
  worker = null
}

const finish = (fn: (job: Job) => void) => {
  const job = current
  current = null
  if (job) fn(job)
  pump()
}

const getWorker = () => {
  if (worker) return worker
  const w = new Worker('/compiler/worker.js', { type: 'module' })
  w.onmessage = ({ data }) => {
    if (!current || data.id !== nextId - 1) return
    if (data.progress) current.onProgress?.(data.progress.done, data.progress.total)
    else if (data.error !== undefined) finish(j => j.reject(new Error(data.error)))
    else if (data.result) finish(j => j.resolve(data.result))
    else if (data.lines) finish(j => j.resolve(data.lines))
  }
  w.onerror = e => {
    dropWorker()
    finish(j => j.reject(new Error(e.message || 'Compiler worker crashed')))
  }
  worker = w
  return w
}

const pump = () => {
  if (current || !pending.length) return
  current = pending.shift()!
  const { kind, files, entry, opt } = current
  getWorker().postMessage({ id: nextId++, type: kind, files, entry, opt })
}

const enqueue = <T>(job: Omit<Job, 'resolve' | 'reject'>) =>
  new Promise<T>((resolve, reject) => {
    if (job.kind === 'check') {
      // a newer pending check replaces an older pending one
      const i = pending.findIndex(j => j.kind === 'check')
      if (i >= 0) pending.splice(i, 1)[0].reject(new Error('superseded'))
    }
    pending.push({ ...job, resolve, reject })
    pump()
  })

export const compileFiles = (
  files: Record<string, string>,
  entry: string,
  opt: Opt = '-O2',
  onProgress?: (done: number, total: number) => void
) => enqueue<CompileResult>({ kind: 'compile', files, entry, opt, onProgress })
