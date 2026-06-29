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
  fee: string
  hookParameters: HookParameters
  memos: Memos
  txIsLoading: boolean
  txIsDisabled: boolean
  txFields: TxFields
  optionalFields: TxFields
  viewType: 'json' | 'ui'
  editorValue?: string
  editorIsSaved: boolean
  estimatedFee?: string
}

const commonFields = [
  'TransactionType',
  'Account',
  'Flags',
  'Fee',
  'Sequence',
  'HookParameters'
] as const

export type TxFields = Omit<
  Partial<(typeof transactionsData)[number]>,
  (typeof commonFields)[number]
>

export const defaultTransaction: TransactionState = {
  selectedTransaction: null,
  selectedAccount: null,
  selectedFlags: null,
  fee: '12',
  hookParameters: {},
  memos: {},
  editorIsSaved: true,
  txIsLoading: false,
  txIsDisabled: false,
  txFields: {},
  optionalFields: {},
  viewType: 'ui'
}

const normalizeFieldName = (field: string) => field.replace(/\?$/, '')

const isOptionalFieldName = (field: string) => field.endsWith('?')

const unwrapTypedValue = (value: any): any => {
  if (!typeIs(value, 'object')) return value

  if (value.$type === 'amount.xrp') {
    if (value.$value) return +value.$value * 1000000 + ''
    return ''
  }

  if (value.$type === 'amount.token') {
    if (typeIs(value.$value, 'string')) return parseJSON(value.$value)
    if (typeIs(value.$value, 'object')) return value.$value
    return undefined
  }

  if (value.$type === 'account') {
    return value.$value?.toString() || ''
  }

  if (value.$type === 'issue') {
    return value.$value
  }

  if (value.$type === 'object') {
    return normalizeObjectValue(value.$value)
  }

  if (value.$type === 'array') {
    return Array.isArray(value.$value) ? value.$value.map(normalizeObjectValue) : []
  }

  if (value.$type === 'vec256') {
    return Array.isArray(value.$value) ? value.$value.map(v => v?.toString() || '') : []
  }

  // Backward compatibility for locally saved transaction state created before
  // json fields were split into object, array, and vec256.
  if (value.$type === 'json') {
    const val = value.$value
    const parsed = typeIs(val, 'string') ? parseJSON(val) : undefined
    return parsed || val
  }

  if (!('$type' in value)) return normalizeObjectValue(value)

  return value
}

const normalizeObjectValue = (obj: any): any => {
  if (!typeIs(obj, 'object')) return unwrapTypedValue(obj)

  return Object.keys(obj).reduce((acc, field) => {
    if (isOptionalFieldName(field)) return acc

    const normalizedField = normalizeFieldName(field)
    acc[normalizedField] = unwrapTypedValue(obj[field])
    return acc
  }, {} as Record<string, any>)
}

const getStructuredType = (value: any): 'object' | 'array' | 'vec256' | undefined => {
  if (Array.isArray(value)) {
    return value.every(item => typeof item === 'string') ? 'vec256' : 'array'
  }
  if (typeIs(value, 'object')) return 'object'
}

const cloneValue = (value: any): any => {
  if (Array.isArray(value)) return value.map(cloneValue)
  if (typeIs(value, 'object')) {
    return Object.entries(value).reduce((acc, [key, val]) => {
      acc[key] = cloneValue(val)
      return acc
    }, {} as Record<string, any>)
  }
  return value
}

const isTypedSchemaValue = (value: any, typePrefix?: string) =>
  typeIs(value, 'object') &&
  typeIs(value.$type, 'string') &&
  (!typePrefix || value.$type.startsWith(typePrefix))

const scoreSchemaMatch = (value: any, schemaValue: any): number => {
  if (!isTypedSchemaValue(schemaValue)) {
    if (!typeIs(schemaValue, 'object') || !typeIs(value, 'object')) return 0

    return Object.keys(value).reduce((score, key) => {
      const schemaKey = schemaValue[key] !== undefined ? key : `${key}?`
      return score + scoreSchemaMatch(value[key], schemaValue[schemaKey])
    }, 1)
  }

  if (schemaValue.$type === 'amount.token') return typeIs(value, 'object') ? 3 : 0
  if (schemaValue.$type === 'amount.xrp') return typeIs(value, ['string', 'number']) ? 3 : 0
  if (schemaValue.$type === 'account') return typeIs(value, 'string') ? 2 : 0
  if (schemaValue.$type === 'issue') return typeIs(value, 'object') ? 2 : 0
  if (schemaValue.$type === 'object') return typeIs(value, 'object') ? 2 : 0
  if (schemaValue.$type === 'array') return Array.isArray(value) ? 2 : 0
  if (schemaValue.$type === 'vec256') return Array.isArray(value) ? 2 : 0
  return 0
}

const applySchemaValue = (value: any, schemaValue: any): any => {
  if (!isTypedSchemaValue(schemaValue)) {
    if (typeIs(value, 'object') && typeIs(schemaValue, 'object')) {
      return applyObjectSchema(value, schemaValue)
    }
    return value
  }

  if (isTypedSchemaValue(schemaValue, 'amount.')) {
    return {
      $type: typeIs(value, 'object') ? 'amount.token' : 'amount.xrp',
      $value: typeIs(value, 'object') ? value : +value / 1000000
    }
  }

  if (schemaValue.$type === 'account') {
    return {
      $type: 'account',
      $value: value?.toString() || ''
    }
  }

  if (schemaValue.$type === 'issue') {
    return {
      $type: 'issue',
      $value: value
    }
  }

  if (schemaValue.$type === 'object') {
    return {
      $type: 'object',
      $value: applyObjectSchema(value, schemaValue.$value)
    }
  }

  if (schemaValue.$type === 'array') {
    const schemaItems: any[] = Array.isArray(schemaValue.$value) ? schemaValue.$value : []
    return {
      $type: 'array',
      $value: Array.isArray(value)
        ? value.map(item => {
            const itemSchema = schemaItems.reduce<{ score: number; value: any }>(
              (best: { score: number; value: any }, schemaItem: any) => {
                const score = scoreSchemaMatch(item, schemaItem)
                return score > best.score ? { score, value: schemaItem } : best
              },
              { score: -1, value: schemaItems[0] }
            ).value

            return itemSchema ? applySchemaValue(item, itemSchema) : item
          })
        : []
    }
  }

  if (schemaValue.$type === 'vec256') {
    return {
      $type: 'vec256',
      $value: Array.isArray(value) ? value.map(v => v?.toString() || '') : []
    }
  }

  return value
}

const applyObjectSchema = (value: any, schemaValue: any): any => {
  if (!typeIs(value, 'object') || !typeIs(schemaValue, 'object')) return value

  const nextValue = Object.keys(value).reduce((acc, key) => {
    const schemaKey = schemaValue[key] !== undefined ? key : `${key}?`
    acc[key] = applySchemaValue(value[key], schemaValue[schemaKey])
    return acc
  }, {} as Record<string, any>)

  Object.keys(schemaValue).forEach(key => {
    if (!isOptionalFieldName(key)) return

    const normalizedKey = normalizeFieldName(key)
    if (nextValue[normalizedKey] === undefined) {
      nextValue[key] = cloneValue(schemaValue[key])
    }
  })

  return nextValue
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
    const normalizedField = normalizeFieldName(field)
    if (normalizedField !== field) {
      // replace optional field name with normalized field name
      options[normalizedField] = options[field]
      delete options[field]
      field = normalizedField
    }

    options[field] = unwrapTypedValue(options[field])
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
  tx.optionalFields = getOptionalTxFields(transactionType)

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
    tx.hookParameters = HookParameters.reduce<TransactionState['hookParameters']>(
      (acc, cur, idx) => {
        const param = {
          label: fromHex(cur.HookParameter?.HookParameterName || ''),
          value: cur.HookParameter?.HookParameterValue || ''
        }
        acc[idx] = param
        return acc
      },
      {}
    )
  }

  if (Memos && Memos instanceof Array) {
    tx.memos = Memos.reduce<TransactionState['memos']>((acc, cur, idx) => {
      const memo = {
        data: cur.Memo?.MemoData || '',
        type: fromHex(cur.Memo?.MemoType || ''),
        format: fromHex(cur.Memo?.MemoFormat || '')
      }
      acc[idx] = memo
      return acc
    }, {})
  }

  if (getFlags(TransactionType) && rest.Flags) {
    const flags = extractFlags(TransactionType, rest.Flags)

    rest.Flags = undefined
    tx.selectedFlags = flags
  }

  Object.keys(rest).forEach(field => {
    const normalizedField = normalizeFieldName(field)
    if (normalizedField !== field) {
      rest[normalizedField] = rest[field]
      delete rest[field]
      field = normalizedField
    }

    const value = rest[field]
    const schemaVal =
      schema[field as keyof TxFields] || tx.optionalFields?.[field as keyof TxFields]

    if (schemaVal) {
      rest[field] = applySchemaValue(value, schemaVal)
    } else if (typeof value === 'object') {
      rest[field] = {
        $type: getStructuredType(value),
        $value: value
      }
    }
  })

  tx.txFields = rest
  tx.editorIsSaved = true

  return tx
}

export const getTxFields = (tt?: string) => {
  const txFields: TxFields | undefined = transactionsData.find(tx => tx.TransactionType === tt)

  if (!txFields) return {}

  let _txFields = (Object.keys(txFields) as (keyof TxFields)[])
    .filter(key => !commonFields.includes(key as any) && !isOptionalFieldName(key))
    .reduce<TxFields>(
      (tf, key) => (((tf as any)[normalizeFieldName(key)] = (txFields as any)[key]), tf),
      {}
    )
  return _txFields
}

export const getOptionalTxFields = (tt?: string) => {
  const txFields: TxFields | undefined = transactionsData.find(tx => tx.TransactionType === tt)

  if (!txFields) return {}

  return Object.keys(txFields)
    .filter(key => !commonFields.includes(key as any) && isOptionalFieldName(key))
    .reduce<TxFields>(
      (tf, key) => (((tf as any)[normalizeFieldName(key)] = (txFields as any)[key]), tf),
      {}
    )
}

export { transactionsData, commonFields }

export const transactionsOptions = transactionsData.map(tx => ({
  value: tx.TransactionType,
  label: tx.TransactionType
}))

export const defaultTransactionType = transactionsOptions.find(tt => tt.value === 'Payment')
