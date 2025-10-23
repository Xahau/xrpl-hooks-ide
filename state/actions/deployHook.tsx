import toast from 'react-hot-toast'

import state, { IAccount } from '../index'
import { Link } from '../../components'
import { ref } from 'valtio'
import { estimateDeployFee } from '../../utils/estimateFee'
import { DeployContractData, toHex } from '../../utils/setHook'
import ResultLink from '../../components/ResultLink'
import { SubmitResponse, SubmittableTransaction, Transaction, TransactionMetadata, TxResponse, Wallet } from '@transia/xrpl'
import { rpc} from './xrpl-client'

function arrayBufferToHex(arrayBuffer?: ArrayBuffer | null) {
  if (!arrayBuffer) {
    return ''
  }
  if (
    typeof arrayBuffer !== 'object' ||
    arrayBuffer === null ||
    typeof arrayBuffer.byteLength !== 'number'
  ) {
    throw new TypeError('Expected input to be an ArrayBuffer')
  }

  var view = new Uint8Array(arrayBuffer)
  var result = ''
  var value

  for (var i = 0; i < view.length; i++) {
    value = view[i].toString(16)
    result += value.length === 1 ? '0' + value : value
  }

  return result
}

export const prepareDeployHookTx = async (
  account: IAccount & { name?: string },
  data: DeployContractData
) => {
  const activeFile = state.files[state.active]?.compiledContent
    ? state.files[state.active]
    : state.files.filter(file => file.compiledContent)[0]

  if (!state.files || state.files.length === 0) {
    return
  }

  if (!activeFile?.compiledContent) {
    return
  }

  const { InstanceParameters, Functions } = data
  const filteredInstanceParameters = InstanceParameters.filter(
    hp => hp.InstanceParameter.ParameterFlag !== undefined && hp.InstanceParameter.ParameterName && hp.InstanceParameter.ParameterType
  )?.map(aa => ({
    InstanceParameter: {
      ParameterFlag: aa.InstanceParameter.ParameterFlag || 0,
      ParameterName: toHex(aa.InstanceParameter.ParameterName || ''),
      ParameterType: aa.InstanceParameter.ParameterType || { type: '' },
    }
  }))

  if (typeof window === 'undefined') return
  const tx = {
    Account: account.address,
    TransactionType: 'ContractCreate',
    Sequence: account.sequence,
    Fee: data.Fee,
    ContractCode: arrayBufferToHex(activeFile?.compiledContent).toUpperCase(),
    NetworkID: Number(process.env.NEXT_PUBLIC_NETWORK_ID),
    Flags: 0,
    ...(filteredInstanceParameters.length > 0 && {
      InstanceParameters: filteredInstanceParameters
    }),
    ...(Functions && Functions.length > 0 && {
      Functions: Functions
    })
  }
  return tx
}

/*
 * Turns the wasm binary into hex string, signs the transaction and deploys it to Hooks testnet.
 */
export const deployHook = async (account: IAccount & { name?: string }, data: DeployContractData) => {
  const activeFile = state.files[state.active]?.compiledContent
    ? state.files[state.active]
    : state.files.filter(file => file.compiledContent)[0]
  state.deployValues[activeFile.name] = data

  const tx = await prepareDeployHookTx(account, data) as Transaction
  if (!tx) {
    return
  }
  const ledgerResponse = await rpc({
    command: "ledger",
  }) as any;
  tx.LastLedgerSequence = ledgerResponse.result.closed.ledger.ledger_index + 3
  const wallet = Wallet.fromSeed(account.secret)
  const { tx_blob } = wallet.sign(tx as Transaction)

  const currentAccount = state.accounts.find(acc => acc.address === account.address)
  if (currentAccount) {
    currentAccount.isLoading = true
  }

  let submitResponse
  let txResponse
  let contractId: string | undefined
  let contractAccount: string | undefined
  try {
    submitResponse = await rpc({
      command: 'submit',
      tx_blob: tx_blob
    }) as SubmitResponse;
    
    const txHash = submitResponse.result.tx_json?.hash
    const resultMsg = ref(
      <>
        [<ResultLink result={submitResponse.result.engine_result} />] {submitResponse.result.engine_result_message}{' '}
        {txHash && (
          <>
            Transaction hash:{' '}
            <Link
              as="a"
              href={`https://${process.env.NEXT_PUBLIC_EXPLORER_URL}/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {txHash}
            </Link>
          </>
        )}
      </>
    )
    if (submitResponse.result.engine_result === 'tesSUCCESS') {
      // wait 5 seconds for the transaction to be validated
      await new Promise(resolve => setTimeout(resolve, 5000));
      // get the transaction result
      txResponse = await rpc({
        command: 'tx',
        transaction: submitResponse.result.tx_json.hash
      }) as TxResponse;
      const validated = txResponse.result.validated;
      if (validated) {
        const result = txResponse.result
        const meta = result.meta as TransactionMetadata
        if (typeof meta === 'object' && meta !== null && 'AffectedNodes' in meta) {
          const affectedNodes = (meta as any).AffectedNodes as any[]
          for (const node of affectedNodes) {
            if (node.CreatedNode) {
              const created = node.CreatedNode
              if (created.LedgerEntryType === 'Contract') {
                contractId = created.LedgerIndex
                contractAccount = created.NewFields.ContractAccount
              }
            }
          }
        }
      }
      state.deployLogs.push({
        type: 'success',
        message: 'Contract deployed successfully ✅'
      })
      state.deployLogs.push({
        type: 'success',
        message: resultMsg
      })
    } else if (submitResponse.result.engine_result) {
      state.deployLogs.push({
        type: 'error',
        message: resultMsg
      })
    } else {
      state.deployLogs.push({
        type: 'error',
        // @ts-ignore -- todo
        message: `[${submitResponse.result.error}] ${submitResponse.result.error_exception}`
      })
    }
  } catch (err) {
    state.deployLogs.push({
      type: 'error',
      message: 'Error occurred while deploying'
    })
  }
  if (currentAccount) {
    currentAccount.isLoading = false
  }

  if (contractId && contractAccount) {
    state.accounts.push({
      name: `SC-${contractId?.substring(0, 6)}`,
      xrp: "0",
      address: contractAccount as string,
      secret: "none",
      sequence: 1,
      contract: contractId as string,
      isLoading: false,
      version: '0'
    })
  }
  return {
    validated: txResponse?.result.validated,
    // @ts-ignore -- todo
    finalResult: txResponse?.result.meta?.TransactionResult,
    errorMessage: txResponse?.result.validated ? undefined : submitResponse?.result.engine_result_message
  }
}

export const deleteContract = async (account: IAccount & { name?: string }) => {
  const contractAccount = state.accounts.find(acc => acc.address === account.address)
  if (contractAccount?.isLoading || !contractAccount?.contract) {
    return
  }
  const submitAccount = state.accounts.find(acc => acc.contract === null) as IAccount
  const tx = {
    Account: submitAccount?.address,
    TransactionType: 'ContractDelete',
    ContractAccount: contractAccount.address,
    Sequence: submitAccount?.sequence,
    Fee: '200000000',
    NetworkID: Number(process.env.NEXT_PUBLIC_NETWORK_ID),
  }
  const wallet = Wallet.fromSeed(submitAccount?.secret)
  
  try {
    // Update tx Fee value with network estimation
    const fee = await estimateDeployFee(tx)
    tx['Fee'] = String(fee)
  } catch (err) {
    console.error(err)
  }
  const { tx_blob } = wallet.sign(tx as SubmittableTransaction)
  if (contractAccount) {
    contractAccount.isLoading = true
  }
  let submitRes
  const toastId = toast.loading('Deleting hook...')
  try {
    submitRes = await rpc({
      command: 'submit',
      tx_blob: tx_blob
    }) as SubmitResponse

    submitRes = submitRes.result
    if (submitRes.engine_result === 'tesSUCCESS') {
      toast.success('Hook deleted successfully ✅', { id: toastId })
      state.deployLogs.push({
        type: 'success',
        message: 'Hook deleted successfully ✅'
      })
      state.deployLogs.push({
        type: 'success',
        message: `[${submitRes.engine_result}] ${submitRes.engine_result_message} Validated ledger index: ${submitRes.validated_ledger_index}`
      })
      contractAccount.contract = null
    } else {
      // @ts-ignore -- todo
      toast.error(`${submitRes.engine_result_message || submitRes.error_exception}`, {
        id: toastId
      })
      state.deployLogs.push({
        type: 'error',
        // @ts-ignore -- todo
        message: `[${submitRes.engine_result || submitRes.error}] ${
          // @ts-ignore -- todo
          submitRes.engine_result_message || submitRes.error_exception
        }`
      })
    }
  } catch (err) {
    console.log(err)
    toast.error('Error occurred while deleting hook', { id: toastId })
    state.deployLogs.push({
      type: 'error',
      message: 'Error occurred while deleting hook'
    })
  }
  if (contractAccount) {
    contractAccount.isLoading = false
  }
  return submitRes
}