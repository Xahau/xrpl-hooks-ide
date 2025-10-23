import { useEffect } from 'react'
import ReconnectingWebSocket, { CloseEvent } from 'reconnecting-websocket'
import { proxy, ref, useSnapshot } from 'valtio'
import { subscribeKey } from 'valtio/utils'
import { Select } from '.'
import state, { ILog, transactionsState } from '../state'
import { extractJSON } from '../utils/json'
import EnrichLog from './EnrichLog'
import LogBox from './LogBox'

interface ISelect<T = string> {
  label: string
  value: T
}

export interface IStreamState {
  selectedAccount: ISelect | null
  contractId: ISelect | null
  txId: ISelect | null
  status: 'idle' | 'opened' | 'closed'
  statusChangeTimestamp?: number
  logs: ILog[]
  socket?: ReconnectingWebSocket
}

export const streamState = proxy<IStreamState>({
  selectedAccount: null as ISelect | null,
  contractId: null as ISelect | null,
  txId: null as ISelect | null,
  status: 'idle',
  logs: [] as ILog[]
})

const onOpen = (account: ISelect | null) => {
  if (!account) {
    return
  }
  // streamState.logs = [];
  streamState.status = 'opened'
  streamState.statusChangeTimestamp = Date.now()

  pushLog(`Debug stream opened for account ${account?.value}`, {
    type: 'success'
  })
}
const onError = () => {
  pushLog('Something went wrong! Check your connection and try again.', {
    type: 'error'
  })
}
const onClose = (e: CloseEvent) => {
  // 999 = closed websocket connection by switching account
  if (e.code !== 4999) {
    pushLog(`Connection was closed. [code: ${e.code}]`, {
      type: 'error'
    })
  }
  streamState.status = 'closed'
  streamState.statusChangeTimestamp = Date.now()
}
const onMessage = (event: any) => {
  // Ping returns just account address, if we get that
  // response we don't need to log anything
  if (event.data !== streamState.selectedAccount?.value) {
    pushLog(event.data)
  }
}

let interval: NodeJS.Timer | null = null

const addListeners = (account: ISelect | null) => {
  if (account?.value && streamState.socket?.url.endsWith(account?.value)) {
    return
  }
  streamState.logs = []
  if (account?.value) {
    if (interval) {
      clearInterval(interval)
    }
    if (streamState.socket) {
      streamState.socket?.removeEventListener('open', () => onOpen(account))
      streamState.socket?.removeEventListener('close', onClose)
      streamState.socket?.removeEventListener('error', onError)
      streamState.socket?.removeEventListener('message', onMessage)
    }

    streamState.socket = ref(
      new ReconnectingWebSocket(
        `ws://${process.env.NEXT_PUBLIC_DEBUG_STREAM_URL}/${account?.value}`
      )
    )
    if (streamState.socket) {
      interval = setInterval(() => {
        streamState.socket?.send('')
      }, 45000)
    }

    streamState.socket.addEventListener('open', () => onOpen(account))
    streamState.socket.addEventListener('close', onClose)
    streamState.socket.addEventListener('error', onError)
    streamState.socket.addEventListener('message', onMessage)
  }
}

subscribeKey(streamState, 'selectedAccount', addListeners)

const clearLog = () => {
  streamState.logs = []
  streamState.statusChangeTimestamp = Date.now()
}

const DebugStream = () => {
  const { selectedAccount, logs } = useSnapshot(streamState)
  const { activeHeader: activeTxTab } = useSnapshot(transactionsState)
  const { accounts } = useSnapshot(state)

  const accountOptions = accounts.map(acc => ({
    label: acc.name,
    value: acc.address
  }))

  const renderNav = () => (
    <>
      <Select
        instanceId="DSAccount"
        placeholder="Select account"
        options={accountOptions}
        hideSelectedOptions
        value={selectedAccount}
        onChange={acc => {
          streamState.socket?.close(4999, 'Old connection closed because user switched account')
          streamState.selectedAccount = acc as any
        }}
        css={{ width: '100%' }}
      />
    </>
  )

  useEffect(() => {
    const account = transactionsState.transactions.find(tx => tx.header === activeTxTab)?.state
      .selectedAccount

    if (account && account.value !== streamState.selectedAccount?.value)
      streamState.selectedAccount = account
  }, [activeTxTab])

  return (
    <LogBox enhanced renderNav={renderNav} title="Debug stream" logs={logs} clearLog={clearLog} />
  )
}

export default DebugStream

export const pushLog = (str: any, opts: Partial<Pick<ILog, 'type'>> = {}): ILog | undefined => {
  if (!str) return
  if (typeof str !== 'string') throw Error('Unrecognized debug log stream!')

  const match = str.match(/([\s\S]+(?:UTC|ISO|GMT[+|-]\d+))?\ ?([\s\S]*)/m)
  const [_, tm, msg] = match || []

  const timestamp = Date.parse(tm || '') || undefined
  const timestring = !timestamp ? tm : new Date(timestamp).toLocaleTimeString()

  const extracted = extractJSON(msg)
  const _message = !extracted ? msg : msg.slice(0, extracted.start) + msg.slice(extracted.end + 1)
  const message = ref(<EnrichLog str={_message} />)

  const _jsonData = extracted ? JSON.stringify(extracted.result, null, 2) : undefined
  const jsonData = _jsonData ? ref(<EnrichLog str={_jsonData} />) : undefined

  if (extracted?.result?.id?._Request?.includes('hooks-builder-req')) {
    return
  }

  const { type = 'log' } = opts
  const log: ILog = {
    type,
    message,
    timestring,
    jsonData,
    defaultCollapsed: true
  }

  if (log) streamState.logs.push(log)
  return log
}
