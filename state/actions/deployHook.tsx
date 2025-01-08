import { derive, sign } from 'xrpl-accountlib'
import toast from 'react-hot-toast'

import state, { IAccount } from '../index'
import calculateHookOn, { TTS } from '../../utils/hookOnCalculator'
import { Link } from '../../components'
import { ref } from 'valtio'
import estimateFee from '../../utils/estimateFee'
import { SetHookData, toHex } from '../../utils/setHook'
import ResultLink from '../../components/ResultLink'
import { xrplSend } from './xrpl-client'

export const sha256 = async (string: string) => {
  const utf8 = new TextEncoder().encode(string)
  const hashBuffer = await crypto.subtle.digest('SHA-256', utf8)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map(bytes => bytes.toString(16).padStart(2, '0')).join('')
  return hashHex
}


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
  data: SetHookData
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
  const HookNamespace = (await sha256(data.HookNamespace)).toUpperCase()
  const hookOnValues: (keyof TTS)[] = data.Invoke.map(tt => tt.value)
  const { HookParameters } = data
  const filteredHookParameters = HookParameters.filter(
    hp => hp.HookParameter.HookParameterName && hp.HookParameter.HookParameterValue
  )?.map(aa => ({
    HookParameter: {
      HookParameterName: toHex(aa.HookParameter.HookParameterName || ''),
      HookParameterValue: aa.HookParameter.HookParameterValue || ''
    }
  }))
  // const filteredHookGrants = HookGrants.filter(hg => hg.HookGrant.Authorize || hg.HookGrant.HookHash).map(hg => {
  //   return {
  //     HookGrant: {
  //       ...(hg.HookGrant.Authorize && { Authorize: hg.HookGrant.Authorize }),
  //       // HookHash: hg.HookGrant.HookHash || undefined
  //       ...(hg.HookGrant.HookHash && { HookHash: hg.HookGrant.HookHash })
  //     }
  //   }
  // });
  if (typeof window === 'undefined') return
  const tx = {
    Account: account.address,
    TransactionType: 'SetHook',
    Sequence: account.sequence,
    Fee: data.Fee,
    NetworkID: process.env.NEXT_PUBLIC_NETWORK_ID,
    Hooks: [
      {
        Hook: {
          CreateCode: arrayBufferToHex(activeFile?.compiledContent).toUpperCase(),
          HookOn: calculateHookOn(hookOnValues),
          HookNamespace,
          HookApiVersion: activeFile.language === 'javascript' ? 1 : 0,
          Flags: 1,
          Fee: data.JSHookFee,
          // ...(filteredHookGrants.length > 0 && { HookGrants: filteredHookGrants }),
          ...(filteredHookParameters.length > 0 && {
            HookParameters: filteredHookParameters
          })
        }
      }
    ]
  }
  return tx
}

/*
 * Turns the wasm binary into hex string, signs the transaction and deploys it to Hooks testnet.
 */
export const deployHook = async (account: IAccount & { name?: string }, data: SetHookData) => {
  const activeFile = state.files[state.active]?.compiledContent
    ? state.files[state.active]
    : state.files.filter(file => file.compiledContent)[0]
  state.deployValues[activeFile.name] = data

  const tx = await prepareDeployHookTx(account, data)
  if (!tx) {
    return
  }
  const keypair = derive.familySeed(account.secret)
  const { signedTransaction } = sign(tx, keypair)

  const currentAccount = state.accounts.find(acc => acc.address === account.address)
  if (currentAccount) {
    currentAccount.isLoading = true
  }

  let submitRes
  try {
    submitRes = await xrplSend({
      command: 'submit',
      tx_blob: signedTransaction
    })

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
    submitRes = await xrplSend({
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
        message: `[${submitRes.engine_result || submitRes.error}] ${submitRes.engine_result_message || submitRes.error_exception
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
