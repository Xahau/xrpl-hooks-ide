import toast from 'react-hot-toast'

import state, { IAccount } from '../index'
import { Link } from '../../components'
import { ref } from 'valtio'
import estimateFee from '../../utils/estimateFee'
import { DeployContractData, toHex } from '../../utils/setHook'
import ResultLink from '../../components/ResultLink'
import { Transaction, Wallet } from '@transia/xrpl'
import { rpc } from './xrpl-client'

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

  const tx = await prepareDeployHookTx(account, data)
  if (!tx) {
    return
  }
  const wallet = Wallet.fromSeed(account.secret)
  const { tx_blob } = wallet.sign(tx as Transaction)

  const currentAccount = state.accounts.find(acc => acc.address === account.address)
  if (currentAccount) {
    currentAccount.isLoading = true
  }

  let submitRes
  try {
    submitRes = await rpc({
      command: 'submit',
      tx_blob: tx_blob
    })

    console.log(submitRes);
    submitRes = submitRes.result;
    

    const txHash = submitRes.tx_json?.hash
    const resultMsg = ref(
      <>
        [<ResultLink result={submitRes.engine_result} />] {submitRes.engine_result_message}{' '}
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
    if (submitRes.engine_result === 'tesSUCCESS') {
      state.deployLogs.push({
        type: 'success',
        message: 'Hook deployed successfully ✅'
      })
      state.deployLogs.push({
        type: 'success',
        message: resultMsg
      })
    } else if (submitRes.engine_result) {
      state.deployLogs.push({
        type: 'error',
        message: resultMsg
      })
    } else {
      state.deployLogs.push({
        type: 'error',
        message: `[${submitRes.error}] ${submitRes.error_exception}`
      })
    }
  } catch (err) {
    console.error(err)
    state.deployLogs.push({
      type: 'error',
      message: 'Error occurred while deploying'
    })
  }
  if (currentAccount) {
    currentAccount.isLoading = false
  }

  const { id, psuedoId } = {
    id: `EBA39EEF9AB1F7060D344962CA5E4BAD19A3029769E2A44CBDCFFCB8B8DBC1AB`,
    psuedoId: "r4guGvSWLtNuZmaRG4xdApbqAdfW6dpU4F"
  }
  state.accounts.push({
    name: `SC-${id.substring(0, 6)}`,
    xrp: "0",
    address: psuedoId,
    secret: "none",
    sequence: 1,
    contract: id,
    isLoading: false,
    version: '0'
  })
  return submitRes
}

export const deleteHook = async (account: IAccount & { name?: string }) => {
  const currentAccount = state.accounts.find(acc => acc.address === account.address)
  if (currentAccount?.isLoading || !currentAccount?.hooks.length) {
    return
  }
  const tx = {
    Account: account.address,
    TransactionType: 'SetHook',
    Sequence: account.sequence,
    Fee: '100000',
    NetworkID: process.env.NEXT_PUBLIC_NETWORK_ID,
    Hooks: [
      {
        Hook: {
          CreateCode: '',
          Flags: 1
        }
      }
    ]
  }
  const keypair = derive.familySeed(account.secret)
  try {
    // Update tx Fee value with network estimation
    const res = await estimateFee(tx, account)
    tx['Fee'] = res?.base_fee || '1000'
  } catch (err) {
    console.error(err)
  }
  const { signedTransaction } = sign(tx, keypair)
  if (currentAccount) {
    currentAccount.isLoading = true
  }
  let submitRes
  const toastId = toast.loading('Deleting hook...')
  try {
    submitRes = await rpc({
      command: 'submit',
      tx_blob: signedTransaction
    })

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
      currentAccount.hooks = []
    } else {
      toast.error(`${submitRes.engine_result_message || submitRes.error_exception}`, {
        id: toastId
      })
      state.deployLogs.push({
        type: 'error',
        message: `[${submitRes.engine_result || submitRes.error}] ${
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
  if (currentAccount) {
    currentAccount.isLoading = false
  }
  return submitRes
}