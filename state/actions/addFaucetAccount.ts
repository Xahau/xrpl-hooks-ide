import toast from 'react-hot-toast'
import state, { FaucetAccountRes } from '../index'
import fetchAccountInfo from '../../utils/accountInfo'

export const names = [
  'Alice',
  'Bob',
  'Carol',
  'Carlos',
  'Charlie',
  'Dan',
  'Dave',
  'David',
  'Faythe',
  'Frank',
  'Grace',
  'Heidi',
  'Judy',
  'Olive',
  'Peggy',
  'Walter'
]

/* Adds a faucet account to the global state using the selected network's faucet.
 * 'newcreds' faucets have no CORS, so they go through our /api/faucet proxy;
 * 'accounts' faucets allow CORS and are called directly.
 */
const requestFaucet = async (account?: string): Promise<FaucetAccountRes | { error: string }> => {
  const faucet = state.network.faucet
  if (!faucet) return { error: 'This network has no faucet' }
  if (faucet.kind === 'accounts') {
    const res = await fetch(faucet.url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{}'
    })
    const json = await res.json()
    if (!res.ok || !json?.account) {
      return { error: json?.error || json?.message || 'Faucet request failed' }
    }
    return {
      address: json.account.address,
      secret: json.account.secret,
      xrp: Number(json.amount) || 0,
      hash: '',
      code: ''
    }
  }
  const params = new URLSearchParams({ url: faucet.url })
  if (account) params.set('account', account)
  const res = await fetch(`${window.location.origin}/api/faucet?${params}`, { method: 'POST' })
  return res.json()
}

export const addFaucetAccount = async (name?: string, showToast: boolean = false) => {
  if (typeof window === 'undefined') return
  if (!state.network.faucet) {
    if (showToast) toast.error('This network has no faucet')
    return
  }

  const toastId = showToast ? toast.loading('Creating account') : ''
  let json: FaucetAccountRes | { error: string }
  try {
    json = await requestFaucet()
  } catch (err) {
    console.error(err)
    json = { error: 'Faucet request failed' }
  }
  if ('error' in json) {
    if (!showToast) return
    return toast.error(json.error, { id: toastId })
  }
  const currNames = state.accounts.map(acc => acc.name)
  const info = await fetchAccountInfo(json.address, { silent: true })
  state.accounts.push({
    name: name || names.filter(name => !currNames.includes(name))[0],
    xrp: (json.xrp * 1000000 || 0).toString(),
    address: json.address,
    secret: json.secret,
    sequence: info?.Sequence || 1,
    hooks: [],
    isLoading: false,
    version: '2'
  })
  if (showToast) {
    toast.success('New account created', { id: toastId })
  }
}

// fetch initial faucets
;(async function fetchFaucets() {
  if (typeof window !== 'undefined') {
    if (state.accounts.length === 0) {
      await addFaucetAccount()
      // setTimeout(() => {
      //   addFaucetAccount();
      // }, 10000);
    }
  }
})()

export const addFunds = async (address: string) => {
  if (state.network.faucet?.kind !== 'newcreds') {
    return toast.error('Adding funds is not supported on this network')
  }
  const toastId = toast.loading('Requesting funds')
  let json: FaucetAccountRes | { error: string }
  try {
    json = await requestFaucet(address)
  } catch (err) {
    console.error(err)
    json = { error: 'Faucet request failed' }
  }
  if ('error' in json) {
    return toast.error(json.error, { id: toastId })
  } else {
    toast.success(`Funds added (${json.xrp} XAH)`, { id: toastId })
    const currAccount = state.accounts.find(acc => acc.address === address)
    if (currAccount) {
      currAccount.xrp = (Number(currAccount.xrp) + json.xrp * 1000000).toString()
    }
  }
}
