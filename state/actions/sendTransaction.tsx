import state from '..'
import type { IAccount } from '..'
import ResultLink from '../../components/ResultLink'
import { ref } from 'valtio'
import { rpc } from './xrpl-client'
import { SubmittableTransaction, Wallet } from '@transia/xrpl'
// import { hashes } from '@transia/xrpl'
// import { streamState } from '../../components/DebugStream'

interface TransactionOptions {
  TransactionType: string
  Account?: string
  Fee?: string
  [index: string]: any
}
interface OtherOptions {
  logPrefix?: string
}

export const sendTransaction = async (
  account: IAccount,
  txOptions: TransactionOptions,
  options?: OtherOptions
) => {
  const { Fee = '1000', ...opts } = txOptions
  const tx: TransactionOptions = {
    Account: account.address,
    Sequence: account.sequence,
    Fee,
    NetworkID: Number(process.env.NEXT_PUBLIC_NETWORK_ID),
    ...opts
  }
  
  const { logPrefix = '' } = options || {}
  state.transactionLogs.push({
    type: 'log',
    message: `${logPrefix}${JSON.stringify(tx, null, 2)}`
  })
  try {
    const wallet = Wallet.fromSeed(account.secret)
    const { tx_blob } = wallet.sign(tx as SubmittableTransaction)

    // streamState.txId = {
    //   label: 'sfParentBatchId',
    //   value: hashes.hashSignedTx(tx_blob),
    // }

    const response = await rpc({
      command: 'submit',
      tx_blob: tx_blob
    })

    const result = response?.result

    // @ts-ignore -- todo
    const txResult = result.engine_result
    // @ts-ignore -- todo
    const txResultMessage = result.engine_result_message
    
    const resultMsg = ref(
      <>
        {logPrefix}[<ResultLink result={txResult} />] {txResultMessage}
      </>
    )
    // @ts-ignore -- todo
    if (txResult === 'tesSUCCESS') {
      state.transactionLogs.push({
        type: 'success',
        message: resultMsg
      })
      // @ts-ignore -- todo
    } else if (result.engine_result) {
      state.transactionLogs.push({
        type: 'error',
        message: resultMsg
      })
    } else {
      state.transactionLogs.push({
        type: 'error',
        // @ts-ignore -- todo
        message: `${logPrefix}[${result.error}] ${result.error_exception}`
      })
    }
    const currAcc = state.accounts.find(acc => acc.address === account.address)
    // @ts-ignore -- todo
    if (currAcc && result.account_sequence_next) {
      // @ts-ignore -- todo
      currAcc.sequence = result.account_sequence_next
    }
  } catch (err) {
    console.error(err)
    state.transactionLogs.push({
      type: 'error',
      message:
        err instanceof Error
          ? `${logPrefix}Error: ${err.message}`
          : `${logPrefix}Something went wrong, try again later`
    })
  }
}
