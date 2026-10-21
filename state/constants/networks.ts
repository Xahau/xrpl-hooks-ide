import type { INetwork } from '../index'

export const presetNetworks: INetwork[] = [
  {
    name: 'Xahau Testnet',
    ws: 'wss://xahau-test.net',
    explorer: 'https://explorer.xahau-test.net',
    faucet: { url: 'https://xahau-test.net/newcreds', kind: 'newcreds' },
    debugStream: 'wss://xahau-test.net/debugstream/{address}',
    networkId: 21338
  }
]

/** Published network list; served with `Access-Control-Allow-Origin: *`, so fetched directly */
export const remoteNetworksUrl = 'https://xahau-dev.net/networks.json'

export const defaultNetwork = presetNetworks[0]

// Hosts the /api/faucet proxy may forward to.
export const allowedFaucetHosts = presetNetworks
  .filter(n => n.faucet?.kind === 'newcreds')
  .map(n => new URL(n.faucet!.url).host)
