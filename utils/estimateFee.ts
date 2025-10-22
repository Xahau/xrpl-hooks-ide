import toast from 'react-hot-toast'
import { derive, sign } from 'xrpl-accountlib'
import { IAccount } from '../state'
import { rpc } from '../state/actions/xrpl-client'

const estimateFee = async (
  tx: Record<string, unknown>,
  account: IAccount,
  opts: { silent?: boolean } = {}
): Promise<null | {
  base_fee: string
  median_fee: string
  minimum_fee: string
  open_ledger_fee: string
}> => {
  try {
    return null
    const copyTx = JSON.parse(JSON.stringify(tx))
    delete copyTx['SigningPubKey']
    if (!copyTx.Fee) {
      copyTx.Fee = '1000'
    }

    const keypair = derive.familySeed(account.secret)
    const { signedTransaction } = sign(copyTx, keypair)

    const res = await rpc({ command: 'fee', tx_blob: signedTransaction })
    if (res.error) {
      throw new Error(`[${res.error}] ${res.error_exception}.`);
    }
    if (res && res.drops) {
      return res.drops
    }
    return null
  } catch (err) {
    if (!opts.silent) {
      console.error(err)
      const msg = err instanceof Error ? err.message : 'Error estimating fee!';
      toast.error(msg);
    }
    return null
  }
}

export default estimateFee
