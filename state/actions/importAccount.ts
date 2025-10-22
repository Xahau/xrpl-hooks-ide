import toast from 'react-hot-toast'
import { derive, XRPL_Account } from 'xrpl-accountlib'

import state from '../index'
import { names } from './addFaucetAccount'

// Adds test account to global state with secret key
export const importAccount = (secret: string, name?: string) => {
  if (!secret) {
    return toast.error('You need to add secret!')
  }
  if (state.accounts.find(acc => acc.secret === secret)) {
    return toast.error('Account already added!')
  }
  let account: XRPL_Account | null = null
  try {
    account = derive.familySeed(secret)
  } catch (err: any) {
    if (err?.message) {
      toast.error(err.message)
    } else {
      toast.error('Error occurred while importing account')
    }
    return
  }
  if (!account || !account.secret.familySeed) {
    return toast.error(`Couldn't create account!`)
  }
  state.accounts.push({
    name: name || names[state.accounts.length],
    address: account.address || '',
    secret: account.secret.familySeed || '',
    xrp: '0',
    sequence: 1,
    contract: null,
    isLoading: false,
    version: '2'
  })
  return toast.success('Account imported successfully!')
}
