import state from '../state'
import { xrplSend } from '../state/actions/xrpl-client'

/** Refresh balance, sequence and installed hooks of every account from the connected node. */
export const refreshAccounts = async () => {
  const accounts = [...state.accounts]
  const responses = await Promise.all(
    accounts.map(acc =>
      xrplSend({
        id: `hooks-builder-req-info-${acc.address}`,
        command: 'account_info',
        account: acc.address
      })
    )
  )
  responses.forEach((res: any) => {
    const address = res?.account_data?.Account as string
    const accountToUpdate = state.accounts.find(acc => acc.address === address)
    if (accountToUpdate) {
      accountToUpdate.xrp = res.account_data.Balance as string
      accountToUpdate.sequence = res.account_data.Sequence as number
      accountToUpdate.error = null
    } else {
      const oldAccount = state.accounts.find(acc => acc.address === res?.account)
      if (oldAccount) {
        oldAccount.xrp = '0'
        oldAccount.error = { code: res?.error, message: res?.error_message }
      }
    }
  })
  const objectResponses = await Promise.all(
    accounts.map(acc =>
      xrplSend({
        id: `hooks-builder-req-objects-${acc.address}`,
        command: 'account_objects',
        account: acc.address
      })
    )
  )
  objectResponses.forEach((res: any) => {
    const accountToUpdate = state.accounts.find(acc => acc.address === res?.account)
    if (accountToUpdate) {
      accountToUpdate.hooks =
        res.account_objects
          ?.find((ac: any) => ac?.LedgerEntryType === 'Hook')
          ?.Hooks?.map((oo: any) => oo.Hook?.HookHash || '') || []
    }
  })
}
