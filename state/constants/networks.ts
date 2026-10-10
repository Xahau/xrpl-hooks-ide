import type { INetwork } from '../index'

export const presetNetworks: INetwork[] = [
  {
    name: 'Xahau Testnet',
    ws: 'wss://xahau-test.net',
    explorer: 'https://explorer.xahau-test.net',
    faucet: { url: 'https://xahau-test.net/newcreds', kind: 'newcreds' },
    debugStream: 'wss://xahau-test.net/debugstream/{address}',
    networkId: 21338
  },
  {
    name: 'Xahau Dev Net',
    ws: 'wss://xahau-dev.net',
    explorer: 'https://explorer.xahau-dev.net',
    faucet: { url: 'https://faucet.xahau-dev.net/accounts', kind: 'accounts' },
    debugStream: 'wss://xahau-dev.net/{address}',
    networkId: 21339
  }
]

export const defaultNetwork = presetNetworks[0]

// Hosts the /api/faucet proxy may forward to.
export const allowedFaucetHosts = presetNetworks
  .filter(n => n.faucet?.kind === 'newcreds')
  .map(n => new URL(n.faucet!.url).host)
