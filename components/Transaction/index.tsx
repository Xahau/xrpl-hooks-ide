import { Play } from 'phosphor-react'
import { FC, useCallback, useEffect } from 'react'
import { useSnapshot } from 'valtio'
import state from '../../state'
import {
  defaultTransactionType,
  getTxFields,
  modifyTxState,
  prepareState,
  prepareTransaction,
  SelectOption,
  TransactionState
} from '../../state/transactions'
import { sendTransaction } from '../../state/actions'
import Box from '../Box'
import Button from '../Button'
import Flex from '../Flex'
import { TxJson } from './json'
import { TxUI } from './ui'
import { default as _estimateFee } from '../../utils/estimateFee'
import toast from 'react-hot-toast'
import { combineFlags, extractFlags, transactionFlags } from '../../state/constants/flags'
import { SetHookData, toHex } from '../../utils/setHook'

export interface TransactionProps {
  header: string
  state: TransactionState
}

const Transaction: FC<TransactionProps> = ({ header, state: txState, ...props }) => {
  const { accounts, editorSettings } = useSnapshot(state)
  const { selectedAccount, selectedTransaction, txIsDisabled, txIsLoading, viewType, editorValue } =
    txState

  const setState = useCallback(
    (pTx?: Partial<TransactionState>) => {
      return modifyTxState(header, pTx)
    },
    [header]
  )

  const prepareOptions = useCallback(
    (state: Partial<TransactionState> = txState) => {
      const {
        selectedTransaction,
        selectedAccount,
        txFields,
        selectedFlags,
        hookParameters,
        memos
      } = state

      const TransactionType = selectedTransaction?.value || null
      const Account = selectedAccount?.value || null
      const Flags = combineFlags(selectedFlags?.map(flag => flag.value)) || txFields?.Flags
      const HookParameters = Object.entries(hookParameters || {}).reduce<
        SetHookData['HookParameters']
      >((acc, [_, { label, value }]) => {
        return acc.concat({
          HookParameter: { HookParameterName: toHex(label), HookParameterValue: value }
        })
      }, [])
      const Memos = memos
        ? Object.entries(memos).reduce<SetHookData['Memos']>((acc, [_, { format, data, type }]) => {
            return acc?.concat({
              Memo: { MemoData: data, MemoFormat: toHex(format), MemoType: toHex(type) }
            })
          }, [])
        : undefined

      const result = prepareTransaction({
        ...txFields,
        HookParameters,
        Flags,
        TransactionType,
        Account,
        Memos
      })
      if (result.ClaimCurrency && typeof result.ClaimCurrency === 'object') {
        const { currency, issuer } = result.ClaimCurrency
        if (!currency && !issuer) delete result.ClaimCurrency
      }
      return result
    },
    [txState]
  )

  useEffect(() => {
    const transactionType = selectedTransaction?.value
    const account = selectedAccount?.value
    if (!account || !transactionType || txIsLoading) {
      setState({ txIsDisabled: true })
    } else {
      setState({ txIsDisabled: false })
    }
  }, [selectedAccount?.value, selectedTransaction?.value, setState, txIsLoading])

  const getJsonString = useCallback(
    (state?: Partial<TransactionState>) =>
      JSON.stringify(prepareOptions?.(state) || {}, null, editorSettings.tabSize),
    [editorSettings.tabSize, prepareOptions]
  )

  const saveEditorState = useCallback(
    (value: string = '', transactionType?: string) => {
      const pTx = prepareState(value, transactionType)
      if (pTx) {
        pTx.editorValue = getJsonString(pTx)
        return setState(pTx)
      }
    },
    [getJsonString, setState]
  )

  const submitTest = useCallback(async () => {
    let st: TransactionState | undefined
    const tt = txState.selectedTransaction?.value
    if (viewType === 'json') {
      st = saveEditorState(editorValue, tt)
      if (!st) return
    }

    const account = accounts.find(acc => acc.address === selectedAccount?.value)
    if (txIsDisabled) return

    setState({ txIsLoading: true })
    const logPrefix = header ? `${header.split('.')[0]}: ` : undefined
    try {
      if (!account) {
        throw Error('Account must be selected from imported accounts!')
      }
      const options = prepareOptions(st)
      // delete unnecessary fields
      Object.keys(options).forEach(field => {
        if (!options[field] && field !== 'StartTime' && field !== 'LastUpdateTime') { // Can be 0
          delete options[field]
        }
      })

      await sendTransaction(account, options, { logPrefix })
    } catch (error) {
      console.error(error)
      if (error instanceof Error) {
        state.transactionLogs.push({
          type: 'error',
          message: `${logPrefix}${error.message}`
        })
      }
    }
    setState({ txIsLoading: false })
  }, [
    txState.selectedTransaction?.value,
    viewType,
    accounts,
    txIsDisabled,
    setState,
    header,
    saveEditorState,
    editorValue,
    selectedAccount?.value,
    prepareOptions
  ])

  const resetState = useCallback(
    (transactionType: SelectOption | undefined = defaultTransactionType) => {
      const fields = getTxFields(transactionType?.value)

      if ('LastUpdateTime' in fields) {
        fields.LastUpdateTime = Math.floor(Date.now() / 1000)
      }

      const nwState: Partial<TransactionState> = {
        viewType,
        selectedTransaction: transactionType
      }

      if (transactionType?.value && transactionFlags[transactionType?.value] && fields.Flags) {
        nwState.selectedFlags = extractFlags(transactionType.value, fields.Flags)
        fields.Flags = undefined
      }

      nwState.txFields = fields
      const state = modifyTxState(header, nwState, { replaceState: true })
      const editorValue = getJsonString(state)
      return setState({ editorValue })
    },
    [getJsonString, header, setState, viewType]
  )

  const estimateFee = useCallback(
    async (st?: TransactionState, opts?: { silent?: boolean }) => {
      const state = st || txState
      const ptx = prepareOptions(state)
      const account = accounts.find(acc => acc.address === state.selectedAccount?.value)
      if (!account) {
        if (!opts?.silent) {
          toast.error('Please select account from the list.')
        }
        return
      }

      ptx.Account = account.address
      ptx.Sequence = account.sequence

      const res = await _estimateFee(ptx, account, opts)
      const fee = res?.base_fee
      setState({ estimatedFee: fee })
      return fee
    },
    [accounts, prepareOptions, setState, txState]
  )

  const switchToJson = useCallback(() => {
    const editorValue = getJsonString()
    setState({ viewType: 'json', editorValue })
  }, [getJsonString, setState])

  const switchToUI = useCallback(() => {
    setState({ viewType: 'ui' })
  }, [setState])

  return (
    <Box css={{ position: 'relative', height: 'calc(100% - 28px)' }} {...props}>
      {viewType === 'json' ? (
        <TxJson
          getJsonString={getJsonString}
          saveEditorState={saveEditorState}
          header={header}
          state={txState}
          setState={setState}
          estimateFee={estimateFee}
        />
      ) : (
        <TxUI
          switchToJson={switchToJson}
          state={txState}
          resetState={resetState}
          setState={setState}
          estimateFee={estimateFee}
        />
      )}
      <Flex
        row
        css={{
          justifyContent: 'space-between',
          position: 'absolute',
          left: 0,
          bottom: 0,
          width: '100%',
          mb: '$1'
        }}
      >
        <Button
          onClick={() => {
            if (viewType === 'ui') {
              switchToJson()
            } else switchToUI()
          }}
          outline
        >
          {viewType === 'ui' ? 'EDIT AS JSON' : 'EXIT JSON MODE'}
        </Button>
        <Flex row>
          <Button onClick={() => resetState()} outline css={{ mr: '$3' }}>
            RESET
          </Button>
          <Button
            variant="primary"
            onClick={submitTest}
            isLoading={txIsLoading}
            disabled={txIsDisabled}
          >
            <Play weight="bold" size="16px" />
            RUN TEST
          </Button>
        </Flex>
      </Flex>
    </Box>
  )
}

export default Transaction
