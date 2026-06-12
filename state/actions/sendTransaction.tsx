import { derive, sign } from 'xrpl-accountlib'

import state from '..'
import type { IAccount } from '..'
import ResultLink from '../../components/ResultLink'
import { ref } from 'valtio'
import { xrplSend } from './xrpl-client'
import { XrplDefinitions } from 'xrpl-accountlib'
import definitions from 'ripple-binary-codec/dist/enums/definitions.json'

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
    NetworkID: process.env.NEXT_PUBLIC_NETWORK_ID,
    ...opts
  }
  const { logPrefix = '' } = options || {}
  state.transactionLogs.push({
    type: 'log',
    message: `${logPrefix}${JSON.stringify(tx, null, 2)}`
  })
  try {
    const signedAccount = derive.familySeed(account.secret)
    const { signedTransaction } = sign(tx, signedAccount, new XrplDefinitions(definitions as any))
    const response = await xrplSend({
      command: 'submit',
      tx_blob: signedTransaction
    })

    const resultMsg = ref(
      <>
        {logPrefix}[<ResultLink result={response.engine_result} />] {response.engine_result_message}
      </>
    )
    if (response.engine_result === 'tesSUCCESS') {
      state.transactionLogs.push({
        type: 'success',
        message: resultMsg
      })
    } else if (response.engine_result) {
      state.transactionLogs.push({
        type: 'error',
        message: resultMsg
      })
    } else {
      state.transactionLogs.push({
        type: 'error',
        message: `${logPrefix}[${response.error}] ${response.error_exception}`
      })
    }
    const currAcc = state.accounts.find(acc => acc.address === account.address)
    if (currAcc && response.account_sequence_next) {
      currAcc.sequence = response.account_sequence_next
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
