import { connectClient, INetwork } from '../index'
import state from '../index'
import { presetNetworks } from '../constants/networks'
import { refreshAccounts } from '../../utils/refreshAccounts'

const save = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value)
  } catch (err) {
    console.error(err)
  }
}

export const setNetwork = async (name: string) => {
  const network = [...presetNetworks, ...state.customNetworks].find(n => n.name === name)
  if (!network || network.name === state.network.name) return
  const old = state.client as any
  state.network = network
  save('hooksIdeNetwork', network.name)
  const client = connectClient(network)
  old?.close?.()
  // accounts of the previous network are stale until the new node answers
  try {
    await client.ready()
    if (state.client === client) await refreshAccounts()
  } catch (err) {
    console.error(err)
  }
}

export const addCustomNetwork = (net: INetwork) => {
  if (
    [...presetNetworks, ...state.customNetworks].some(n => n.name === net.name) ||
    !net.name ||
    !net.ws
  ) {
    throw new Error(`Network name "${net.name}" is empty or already in use`)
  }
  state.customNetworks.push(net)
  save('hooksIdeCustomNetworks', JSON.stringify(state.customNetworks))
}

export const removeCustomNetwork = async (name: string) => {
  const wasActive = state.network.name === name
  state.customNetworks = state.customNetworks.filter(n => n.name !== name)
  save('hooksIdeCustomNetworks', JSON.stringify(state.customNetworks))
  if (wasActive) await setNetwork(presetNetworks[0].name)
}
