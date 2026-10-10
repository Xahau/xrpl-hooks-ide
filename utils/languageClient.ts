import { MessageConnection, listen } from '@codingame/monaco-jsonrpc'
import {
  MonacoLanguageClient,
  ErrorAction,
  CloseAction,
  createConnection
} from '@codingame/monaco-languageclient'
import normalizeUrl from 'normalize-url'
import ReconnectingWebSocket from 'reconnecting-websocket'
import { subscribe } from 'valtio'
import {
  createMessageConnection,
  BrowserMessageReader,
  BrowserMessageWriter
} from 'vscode-jsonrpc/browser'
import state from '../state'

export function createLanguageClient(connection: MessageConnection): MonacoLanguageClient {
  return new MonacoLanguageClient({
    name: 'Clangd Language Client',
    clientOptions: {
      // use a language id as a document selector
      documentSelector: ['c', 'h'],
      // disable the default error handler
      errorHandler: {
        error: () => ErrorAction.Continue,
        closed: () => {
          return CloseAction.DoNotRestart
        }
      }
    },
    // create a language client connection from the JSON RPC connection on demand
    connectionProvider: {
      get: (errorHandler, closeHandler) => {
        return Promise.resolve(createConnection(connection, errorHandler, closeHandler))
      }
    }
  })
}

export function createUrl(path: string): string {
  const protocol = location.protocol === 'https:' ? 'wss' : 'ws'
  return normalizeUrl(`${protocol}://${location.host}${location.pathname}${path}`)
}

function createWebSocket(url: string) {
  const socketOptions = {
    maxReconnectionDelay: 10000,
    minReconnectionDelay: 1000,
    reconnectionDelayGrowFactor: 1.3,
    connectionTimeout: 10000,
    maxRetries: Infinity,
    debug: false
  }
  return new ReconnectingWebSocket(url, [], socketOptions)
}

function waitForReady(worker: Worker) {
  // the reader must not see the 'ready' message, so wait for it before creating the connection
  return new Promise<void>((resolve, reject) => {
    const onMessage = (e: MessageEvent) => {
      if (e.data?.type !== 'ready') return
      worker.removeEventListener('message', onMessage)
      worker.removeEventListener('error', onError)
      resolve()
    }
    const onError = (e: ErrorEvent) => {
      worker.removeEventListener('message', onMessage)
      worker.removeEventListener('error', onError)
      reject(e.error || new Error(e.message))
    }
    worker.addEventListener('message', onMessage)
    worker.addEventListener('error', onError)
  })
}

export function startRemoteClangd(endpoint: string): { close: () => void } {
  const webSocket = createWebSocket(endpoint)
  // listen when the web socket is opened
  listen({
    webSocket: webSocket as WebSocket,
    onConnection: connection => {
      // create and start the language client
      const languageClient = createLanguageClient(connection)
      const disposable = languageClient.start()

      connection.onClose(() => {
        try {
          disposable.dispose()
        } catch (err) {
          console.log('err', err)
        }
      })
    }
  })
  return { close: () => webSocket.close() }
}

export function startClangdWorker(onReady?: () => void): {
  close: () => void
  reparse: () => void
} {
  const worker = new Worker(new URL('./clangd.worker.ts', import.meta.url))
  let closed = false
  const disposables: { dispose: () => void }[] = []
  let client: MonacoLanguageClient | undefined

  waitForReady(worker)
    .then(() => {
      if (closed) return
      onReady?.()
      // keep header files in the worker's filesystem in sync with the state
      const sent = new Map<string, string>()
      const syncHeaders = () => {
        state.files.forEach(({ name, content }) => {
          if (!name.endsWith('.h') || sent.get(name) === content) return
          sent.set(name, content)
          worker.postMessage({ type: 'writeFile', path: `/work/c/${name}`, content })
        })
        sent.forEach((_, name) => {
          if (state.files.some(f => f.name === name)) return
          sent.delete(name)
          worker.postMessage({ type: 'deleteFile', path: `/work/c/${name}` })
        })
      }
      syncHeaders()
      disposables.push({ dispose: subscribe(state.files, syncHeaders) })

      const connection = createMessageConnection(
        new BrowserMessageReader(worker),
        new BrowserMessageWriter(worker)
      ) as unknown as MessageConnection
      client = createLanguageClient(connection)
      disposables.push(client.start())
    })
    .catch(err => console.warn('clangd worker failed to start', err))

  const reparse = () => {
    // any open document works: clangd re-validates all open files on didSave
    const uri = state.editorCtx
      ?.getModels()
      .find(m => m.uri.path.startsWith('/work/c/'))
      ?.uri.toString()
    if (client?.initializeResult && uri) {
      client.sendNotification('textDocument/didSave', { textDocument: { uri } })
    }
  }

  return {
    close: () => {
      closed = true
      disposables.forEach(d => d.dispose())
      worker.terminate()
    },
    reparse
  }
}
