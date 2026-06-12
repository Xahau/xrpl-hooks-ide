import { proxy } from 'valtio'
import { deepEqual } from '../utils/object'
import transactionsData from '../content/transactions.json'
import state from '.'
import { showAlert } from '../state/actions/showAlert'
import { parseJSON } from '../utils/json'
import { extractFlags, getFlags } from './constants/flags'
import { fromHex } from '../utils/setHook'
import { typeIs } from '../utils/helpers'

export type SelectOption = {
  value: string
  label: string
}

export type HookParameters = {
  [key: string]: SelectOption
}

export type Memos = {
  [key: string]: {
    type: string
    format: string
    data: string
  }
}

export interface TransactionState {
  selectedTransaction: SelectOption | null
  selectedAccount: SelectOption | null
  selectedFlags: SelectOption[] | null
  hookParameters: HookParameters
  memos: Memos
  txIsLoading: boolean
  txIsDisabled: boolean
  txFields: TxFields
  viewType: 'json' | 'ui'
  editorValue?: string
  editorIsSaved: boolean
  estimatedFee?: string
}

const commonFields = ['TransactionType', 'Account', 'Sequence', "HookParameters"] as const;

export type TxFields = Omit<
  Partial<(typeof transactionsData)[number]>,
  typeof commonFields[number]
>

export const defaultTransaction: TransactionState = {
  selectedTransaction: null,
  selectedAccount: null,
  selectedFlags: null,
  hookParameters: {},
  memos: {},
  editorIsSaved: true,
  txIsLoading: false,
  txIsDisabled: false,
  txFields: {},
  viewType: 'ui'
}

export const transactionsState = proxy({
  transactions: [
    {
      header: 'test1.json',
      state: { ...defaultTransaction }
    }
  ],
  activeHeader: 'test1.json'
})

export const renameTxState = (oldName: string, nwName: string) => {
  const tx = transactionsState.transactions.find(tx => tx.header === oldName)

  if (!tx) throw Error(`No transaction state exists with given header name ${oldName}`)

  tx.header = nwName
}

/**
 * Simple transaction state changer
 * @param header Unique key and tab name for the transaction tab
 * @param partialTx partial transaction state, `undefined` deletes the transaction
 *
 */
export const modifyTxState = (
  header: string,
  partialTx?: Partial<TransactionState>,
  opts: { replaceState?: boolean } = {}
) => {
  const tx = transactionsState.transactions.find(tx => tx.header === header)

  if (partialTx === undefined) {
    transactionsState.transactions = transactionsState.transactions.filter(
      tx => tx.header !== header
    )
    return
  }

  if (!tx) {
    const state = {
      ...defaultTransaction,
      ...partialTx
    }
    transactionsState.transactions.push({
      header,
      state
    })
    return state
  }

  if (opts.replaceState) {
    const repTx: TransactionState = {
      ...defaultTransaction,
      ...partialTx
    }
    tx.state = repTx
    return repTx
  }

  Object.keys(partialTx).forEach(k => {
    // Typescript mess here, but is definitely safe!
    const s = tx.state as any
    const p = partialTx as any // ? Make copy
    if (!deepEqual(s[k], p[k])) s[k] = p[k]
  })

  return tx.state
}

export const prepareTransaction = (data: any) => {
  let options = { ...data }

  Object.keys(options).forEach(field => {
    let _value = options[field]
    if (!typeIs(_value, 'object')) return
    // amount.xrp
    if (_value.$type === 'amount.xrp') {
      if (_value.$value) {
        options[field] = (+(_value as any).$value * 1000000 + '')
      } else {
        options[field] = ""
      }
    }
    // amount.token
    if (_value.$type === 'amount.token') {
      if (typeIs(_value.$value, 'string')) {
        options[field] = parseJSON(_value.$value)
      } else if (typeIs(_value.$value, 'object')) {
        options[field] = _value.$value
      } else {
        options[field] = undefined
      }
    }
    // account
    if (_value.$type === 'account') {
      options[field] = (_value.$value as any)?.toString() || ""
    }
    // json
    if (_value.$type === 'json') {
      const val = _value.$value;
      let res: any = val;
      if (typeIs(val, ["object", "array"])) {
        options[field] = res
      } else if (typeIs(val, "string") && (res = parseJSON(val))) {
        options[field] = res;
      } else {
        options[field] = res;
      }
    }
  })

  return options
}

export const prepareState = (value: string, transactionType?: string) => {
  const options = parseJSON(value)
  if (!options) {
    showAlert('Error!', {
      body: 'Cannot save editor with malformed transaction.'
    })
    return
  }

  const { Account, TransactionType, HookParameters, Memos, ...rest } = options
  let tx: Partial<TransactionState> = {}
  const schema = getTxFields(transactionType)

  if (Account) {
    const acc = state.accounts.find(acc => acc.address === Account)
    if (acc) {
      tx.selectedAccount = {
        label: acc.name,
        value: acc.address
      }
    } else {
      tx.selectedAccount = {
        label: Account,
        value: Account
      }
    }
  } else {
    tx.selectedAccount = null
  }

  if (TransactionType) {
    tx.selectedTransaction = {
      label: TransactionType,
      value: TransactionType
    }
  } else {
    tx.selectedTransaction = null
  }

  if (HookParameters && HookParameters instanceof Array) {
    tx.hookParameters = HookParameters.reduce<TransactionState["hookParameters"]>((acc, cur, idx) => {
      const param = { label: fromHex(cur.HookParameter?.HookParameterName || ""), value: cur.HookParameter?.HookParameterValue || "" }
      acc[idx] = param;
      return acc;
    }, {})
  }

  if (Memos && Memos instanceof Array) {
    tx.memos = Memos.reduce<TransactionState["memos"]>((acc, cur, idx) => {
      const memo = { data: cur.Memo?.MemoData || "", type: fromHex(cur.Memo?.MemoType || ""), format: fromHex(cur.Memo?.MemoFormat || "") }
      acc[idx] = memo;
      return acc;
    }, {})
  }


  if (getFlags(TransactionType) && rest.Flags) {
    const flags = extractFlags(TransactionType, rest.Flags)

    rest.Flags = undefined
    tx.selectedFlags = flags
  }

  Object.keys(rest).forEach(field => {
    const value = rest[field]
    const schemaVal = schema[field as keyof TxFields]

    const isAmount = schemaVal &&
      typeIs(schemaVal, "object") &&
      schemaVal.$type.startsWith('amount.');
    const isAccount = schemaVal &&
      typeIs(schemaVal, "object") &&
      schemaVal.$type.startsWith("account");

    if (isAmount && ["number", "string"].includes(typeof value)) {
      rest[field] = {
        $type: 'amount.xrp', // TODO narrow typed $type.
        $value: +value / 1000000 // ! maybe use bigint?
      }
    } else if (isAmount && typeof value === 'object') {
      rest[field] = {
        $type: 'amount.token',
        $value: value
      }
    } else if (isAccount) {
      rest[field] = {
        $type: "account",
        $value: value?.toString() || ""
      }
    }
    else if (typeof value === 'object') {
      rest[field] = {
        $type: 'json',
        $value: value
      }
    }
  })

  tx.txFields = rest
  tx.editorIsSaved = true;

  return tx
}

export const getTxFields = (tt?: string) => {
  const txFields: TxFields | undefined = transactionsData.find(tx => tx.TransactionType === tt)

  if (!txFields) return {}

  let _txFields = (Object.keys(txFields) as (keyof typeof txFields)[])
    .filter(key => !commonFields.includes(key as any))
    .reduce<TxFields>((tf, key) => (((tf as any)[key] = (txFields as any)[key]), tf), {})
  return _txFields
}

export { transactionsData, commonFields }

export const transactionsOptions = transactionsData.map(tx => ({
  value: tx.TransactionType,
  label: tx.TransactionType
}))

export const defaultTransactionType = transactionsOptions.find(tt => tt.value === 'Payment')
