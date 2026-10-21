import type monaco from 'monaco-editor'
import { proxy, ref, subscribe } from 'valtio'
import { devtools, subscribeKey } from 'valtio/utils'
import { XrplClient } from 'xrpl-client'
import { SplitSize } from './actions/persistSplits'
import { defaultNetwork, presetNetworks } from './constants/networks'

declare module 'valtio' {
  function useSnapshot<T extends object>(p: T): T
  function snapshot<T extends object>(p: T): T
}

export interface IFile {
  name: string
  language: string
  content: string
  compiledValueSnapshot?: string
  compiledContent?: ArrayBuffer | null
  compiledWatContent?: string | null
  lastCompiled?: Date
  containsErrors?: boolean
}

export interface INetwork {
  name: string
  /** wss://host */
  ws: string
  /** https://host, links are `${explorer}/${hash|address}` */
  explorer?: string
  faucet?: { url: string; kind: 'newcreds' | 'accounts' }
  /** template with {address} */
  debugStream?: string
  /** override; otherwise taken from server_info */
  networkId?: number
}

export interface FaucetAccountRes {
  address: string
  secret: string
  xrp: number
  hash: string
  code: string
}

export interface IAccount {
  name: string
  address: string
  secret: string
  xrp: string
  sequence: number
  hooks: string[]
  isLoading: boolean
  version?: string
  error?: {
    message: string
    code: string
  } | null
}

export interface ILog {
  type: 'error' | 'warning' | 'log' | 'success'
  message: string | JSX.Element
  key?: string
  jsonData?: any
  timestring?: string
  link?: string
  linkText?: string
  defaultCollapsed?: boolean
}

export type DeployValue = Record<IFile['name'], any>

export interface IState {
  network: INetwork
  remoteNetworks: INetwork[]
  customNetworks: INetwork[]
  networkId?: number
  files: IFile[]
  gistId?: string | null
  gistOwner?: string | null
  gistName?: string | null
  active: number
  activeWat: number
  loading: boolean
  gistLoading: boolean
  zipLoading: boolean
  compiling: boolean
  logs: ILog[]
  deployLogs: ILog[]
  transactionLogs: ILog[]
  scriptLogs: ILog[]
  editorCtx?: typeof monaco.editor
  editorSettings: {
    tabSize: number
  }
  splits: {
    [id: string]: SplitSize
  }
  client: XrplClient
  clientStatus: 'offline' | 'online'
  mainModalOpen: boolean
  mainModalShowed: boolean
  accounts: IAccount[]
  compileOptions: {
    optimizationLevel: '-O0' | '-O1' | '-O2' | '-O3' | '-O4' | '-Os'
    strip: boolean
  }
  deployValues: DeployValue
}

// let localStorageState: null | string = null;
let initialState: IState = {
  network: defaultNetwork,
  remoteNetworks: [],
  customNetworks: [],
  networkId: defaultNetwork.networkId,
  files: [],
  // active file index on the Develop page editor
  active: 0,
  // Active file index on the Deploy page editor
  activeWat: 0,
  loading: false,
  compiling: false,
  logs: [],
  deployLogs: [],
  transactionLogs: [],
  scriptLogs: [],
  editorCtx: undefined,
  gistId: undefined,
  gistOwner: undefined,
  gistName: undefined,
  gistLoading: false,
  zipLoading: false,
  editorSettings: {
    tabSize: 2
  },
  splits: {},
  client: undefined!, // set below only.
  clientStatus: 'offline' as 'offline',
  mainModalOpen: false,
  mainModalShowed: false,
  accounts: [],
  compileOptions: {
    optimizationLevel: '-O2',
    strip: true
  },
  deployValues: {}
}

let localStorageAccounts: string | null = null
let initialAccounts: IAccount[] = []

// TODO: What exactly should we store in localStorage? editorSettings, splits, accounts?

// Check if there's a persited accounts in localStorage
if (typeof window !== 'undefined') {
  try {
    localStorageAccounts = localStorage.getItem('hooksIdeAccounts')
  } catch (err) {
    console.log(`localStorage state broken`)
    localStorage.removeItem('hooksIdeAccounts')
  }
  if (localStorageAccounts) {
    initialAccounts = JSON.parse(localStorageAccounts)
  }
  // filter out old accounts (they do not have version property at all)
  // initialAccounts = initialAccounts.filter(acc => acc.version === '2');
}

let initialCustomNetworks: INetwork[] = []
let initialRemoteNetworks: INetwork[] = []
let initialNetwork = defaultNetwork
if (typeof window !== 'undefined') {
  try {
    initialCustomNetworks = JSON.parse(localStorage.getItem('hooksIdeCustomNetworks') || '[]')
    // last fetched copy, so a saved remote network connects before the list is refreshed
    initialRemoteNetworks = JSON.parse(localStorage.getItem('hooksIdeRemoteNetworks') || '[]')
    const name = localStorage.getItem('hooksIdeNetwork')
    initialNetwork =
      [...presetNetworks, ...initialRemoteNetworks, ...initialCustomNetworks].find(
        n => n.name === name
      ) || defaultNetwork
  } catch (err) {
    console.log(`localStorage network state broken`)
  }
}

// Initialize state
const state = proxy<IState>({
  ...initialState,
  network: initialNetwork,
  remoteNetworks: initialRemoteNetworks,
  customNetworks: initialCustomNetworks,
  networkId: initialNetwork.networkId,
  accounts: initialAccounts.length > 0 ? initialAccounts : [],
  logs: []
})
// Initialize socket connection
export const connectClient = (network: INetwork) => {
  const client = new XrplClient(network.ws)
  state.client = ref(client)
  state.clientStatus = 'offline'
  state.networkId = network.networkId
  client.on('online', () => {
    if (state.client !== client) return
    state.clientStatus = 'online'
    if (network.networkId === undefined) {
      client
        .send({ command: 'server_info' })
        .then((res: any) => {
          const id = res?.info?.network_id
          if (state.client === client && typeof id === 'number') state.networkId = id
        })
        .catch(console.error)
    }
  })
  client.on('offline', () => {
    if (state.client === client) state.clientStatus = 'offline'
  })
  return client
}
connectClient(state.network)

if (process.env.NODE_ENV !== 'production') {
  devtools(state, { name: 'Files State' })
}

if (typeof window !== 'undefined') {
  subscribe(state.accounts, () => {
    const { accounts } = state
    const accountsNoLoading = accounts.map(acc => ({ ...acc, isLoading: false }))
    localStorage.setItem('hooksIdeAccounts', JSON.stringify(accountsNoLoading))
  })

  const updateActiveWat = () => {
    const filename = state.files[state.active]?.name

    const compiledFiles = state.files.filter(file => file.compiledContent)
    const idx = compiledFiles.findIndex(file => file.name === filename)

    if (idx !== -1) state.activeWat = idx
  }
  subscribeKey(state, 'active', updateActiveWat)
  subscribeKey(state, 'files', updateActiveWat)
}
/** `NetworkID` field for transactions: only networks with id > 1024 accept (and require) it. */
export const networkIdField = () =>
  state.networkId !== undefined && state.networkId > 1024 ? { NetworkID: state.networkId } : {}

export default state

export * from './transactions'
