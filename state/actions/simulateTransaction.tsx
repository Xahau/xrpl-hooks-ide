import state, { networkIdField } from '..'
import type { IAccount } from '..'
import ResultLink from '../../components/ResultLink'
import { ref } from 'valtio'
import { xrplSend } from './xrpl-client'
import { sendTransaction } from './sendTransaction'

type TransactionOptions = Parameters<typeof sendTransaction>[1]
type OtherOptions = Parameters<typeof sendTransaction>[2]

// hook::ExitType in xahaud
const hookResultNames = ['UNSET', 'WASM_ERROR', 'ROLLBACK', 'ACCEPT']

const hexToUtf8 = (hex: string) =>
  new TextDecoder().decode(Uint8Array.from(hex.match(/../g) ?? [], h => parseInt(h, 16)))

export const simulateTransaction = async (
  account: IAccount,
  txOptions: TransactionOptions,
  options?: OtherOptions
) => {
  const { Fee = '1000', ...opts } = txOptions
  // Sequence is left out on purpose: the node autofills it, so a stale local sequence can't fail the dry run
  const tx: TransactionOptions = {
    Account: account.address,
    Fee,
    ...networkIdField(),
    ...opts
  }
  const { logPrefix = '' } = options || {}
  state.transactionLogs.push({
    type: 'log',
    message: `${logPrefix}simulate: ${JSON.stringify(tx, null, 2)}`
  })
  try {
    const response = await xrplSend({
      command: 'simulate',
      tx_json: tx
    })

    if (response.engine_result) {
      const resultMsg = ref(
        <>
          {logPrefix}Simulated: [<ResultLink result={response.engine_result} />]{' '}
          {response.engine_result_message}
        </>
      )
      state.transactionLogs.push({
        type: response.engine_result === 'tesSUCCESS' ? 'success' : 'error',
        message: resultMsg,
        jsonData: JSON.stringify(response.meta, null, 2),
        defaultCollapsed: true
      })
      response.meta?.HookExecutions?.forEach(({ HookExecution: he }: any) => {
        state.transactionLogs.push({
          type: 'log',
          message: `${logPrefix}Hook ${String(he.HookHash).slice(0, 12)}: ${
            hookResultNames[he.HookResult] ?? he.HookResult
          } (return code ${he.HookReturnCode}) ${hexToUtf8(he.HookReturnString || '')}`
        })
      })
    } else if (response.error === 'unknownCmd' || response.error === 'notSupported') {
      state.transactionLogs.push({
        type: 'error',
        message: `${logPrefix}This node does not support the simulate command.`
      })
    } else {
      state.transactionLogs.push({
        type: 'error',
        message: `${logPrefix}[${response.error}] ${
          response.error_message || response.error_exception
        }`
      })
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
