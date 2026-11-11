import toast from 'react-hot-toast'

import { xrplSend } from '../state/actions/xrpl-client'

interface AccountInfo {
  Account: string
  Sequence: number
  Flags: number
  Balance?: string
}

const fetchAccountInfo = async (
  address: string,
  opts: { silent?: boolean } = {}
): Promise<AccountInfo | undefined> => {
  try {
    const res = await xrplSend({
      id: `hooks-builder-req-info-${address}`,
      command: 'account_info',
      account: address
    })
    return res.account_data
  } catch (err) {
    if (!opts.silent) {
      console.error(err)
      toast.error('Could not fetch account info!')
    }
  }
}

export default fetchAccountInfo
