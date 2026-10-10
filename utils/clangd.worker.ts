/// <reference lib="webworker" />
import { BrowserMessageReader, BrowserMessageWriter } from 'vscode-jsonrpc/browser'

declare const self: DedicatedWorkerGlobalScope

const QUOT = 34
const LBRACE = 123
const RBRACE = 125
const BACKSLASH = 92

// Extracts complete JSON objects from clangd's stdout, byte by byte
class JsonStream {
  private inJson = false
  private rawText: number[] = []
  private unbalancedBraces = 0
  private inString = false
  private inEscape = 0
  private readonly textDecoder = new TextDecoder()

  insert(charCode: number): string | null {
    if (!this.inJson && charCode === LBRACE) {
      this.inJson = true
      this.rawText = []
    }
    if (!this.inJson) {
      return null
    }
    this.rawText.push(charCode)
    if (this.inString) {
      if (this.inEscape) {
        if (charCode === 117) {
          // u of \uxxxx
          this.inEscape += 4
        }
        this.inEscape--
      } else if (charCode === BACKSLASH) {
        this.inEscape = 1
      } else if (charCode === QUOT) {
        this.inString = false
      }
    } else if (charCode === LBRACE) {
      this.unbalancedBraces++
    } else if (charCode === RBRACE) {
      this.unbalancedBraces--
      if (this.unbalancedBraces === 0) {
        this.inJson = false
        return this.textDecoder.decode(new Uint8Array(this.rawText))
      }
    } else if (charCode === QUOT) {
      this.inString = true
    }
    return null
  }
}

async function main() {
  // non-literal specifier: the file is served from public/ and has no type declarations
  const wasmJs = '/wasm/clangd.js'
  const { default: Clangd } = await import(/* webpackIgnore: true */ wasmJs)

  const reader = new BrowserMessageReader(self)
  const writer = new BrowserMessageWriter(self)

  const textEncoder = new TextEncoder()
  let resolveStdinReady = () => {}
  const stdinChunks: string[] = []
  const currentStdinChunk: (number | null)[] = []

  const stdin = (): number | null => {
    if (currentStdinChunk.length === 0) {
      if (stdinChunks.length === 0) {
        console.error('Try to fetch exhausted stdin')
        return null
      }
      const nextChunk = stdinChunks.shift()!
      currentStdinChunk.push(...Array.from(textEncoder.encode(nextChunk)), null)
    }
    return currentStdinChunk.shift()!
  }

  const jsonStream = new JsonStream()
  const stdout = (charCode: number) => {
    const jsonOrNull = jsonStream.insert(charCode)
    if (jsonOrNull !== null) {
      writer.write(JSON.parse(jsonOrNull))
    }
  }

  const stderr = () => {}

  const stdinReady = async () => {
    if (stdinChunks.length === 0) {
      return new Promise<void>(r => (resolveStdinReady = r))
    }
  }

  const onAbort = () => {
    writer.end()
    self.reportError('clangd aborted')
  }

  const clangd = await (Clangd as any)({
    thisProgram: '/usr/bin/clangd',
    stdinReady,
    stdin,
    stdout,
    stderr,
    onExit: onAbort,
    onAbort
  })

  const flags = [
    '-xc',
    '--target=wasm32-wasi',
    '-isystem/usr/include',
    '-isystem/usr/include/wasm32-wasi',
    '-I/work/c'
  ]
  clangd.FS.mkdirTree('/work/c')
  clangd.FS.writeFile('/work/c/.clangd', JSON.stringify({ CompileFlags: { Add: flags } }))

  clangd.callMain([])
  self.postMessage({ type: 'ready' })

  reader.listen((data: any) => {
    if (data?.type === 'writeFile') {
      clangd.FS.writeFile(data.path, data.content)
      return
    }
    // non-ASCII characters cause bad Content-Length. Just escape them.
    const body = JSON.stringify(data).replace(/[\u007F-\uFFFF]/g, ch => {
      return '\\u' + ch.codePointAt(0)!.toString(16).padStart(4, '0')
    })
    stdinChunks.push(`Content-Length: ${body.length}\r\n`, '\r\n', body)
    resolveStdinReady()
  })
}

main().catch(err => self.reportError(err))
