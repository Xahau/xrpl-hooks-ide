import { FC, ReactNode, useCallback, useEffect, useState } from 'react'
import Container from '../Container'
import Flex from '../Flex'
import Input from '../Input'
import Select, { CreatableSelect } from '../Select'
import Text from '../Text'
import {
  SelectOption,
  TransactionState,
  transactionsOptions,
  transactionsData,
  TxFields,
  defaultTransactionType,
  commonFields
} from '../../state/transactions'
import { useSnapshot } from 'valtio'
import state from '../../state'
import { streamState } from '../DebugStream'
import { Box, Button } from '..'
import { getFlags } from '../../state/constants/flags'
import { Plus, Trash } from 'phosphor-react'
import AccountSequence from '../Sequence'
import { capitalize, typeIs } from '../../utils/helpers'

interface PriceDataEntry {
  PriceData: {
    BaseAsset: string
    QuoteAsset: string
    AssetPrice: string
    Scale: number
  }
}

interface UIProps {
  setState: (pTx?: Partial<TransactionState> | undefined) => TransactionState | undefined
  resetState: (tt?: SelectOption) => TransactionState | undefined
  state: TransactionState
  estimateFee?: (...arg: any) => Promise<string | undefined>
  switchToJson: () => void
}

interface AccountField {
  $type: 'account'
  $value: string
}

interface XrpAmountField {
  $type: 'amount.xrp'
  $value: string
}

interface TokenAmountField {
  $type: 'amount.token'
  $value: { value: string; currency: string; issuer: string }
}

interface IssueField {
  $type: 'issue'
  $value: { currency: string, issuer: string }
}

interface ObjectField {
  $type: 'object'
  $value: Record<string, any>
}

interface ArrayField {
  $type: 'array'
  $value: Record<string, any>[]
}

interface Vec256Field {
  $type: 'vec256'
  $value: string[]
}

type StructuredField = ObjectField | ArrayField | Vec256Field

const normalizeFieldName = (field: string) => field.replace(/\?$/, '')

export const TxUI: FC<UIProps> = ({ state: txState, setState, resetState, estimateFee }) => {
  const { accounts } = useSnapshot(state)
  const {
    selectedAccount,
    selectedTransaction,
    txFields,
    optionalFields = {},
    selectedFlags,
    fee,
    hookParameters,
    memos
  } = txState

  const accountOptions: SelectOption[] = accounts.map(acc => ({
    label: acc.name,
    value: acc.address
  }))

  const flagsOptions: SelectOption[] = Object.entries(
    getFlags(selectedTransaction?.value) || {}
  ).map(([label, value]) => ({
    label,
    value
  }))

  const [feeLoading, setFeeLoading] = useState(false)
  const [claimCurrencyVisible, setClaimCurrencyVisible] = useState(false)

  useEffect(() => {
    setClaimCurrencyVisible(false)
  }, [selectedTransaction?.value])

  const handleSetAccount = (acc: SelectOption) => {
    setState({ selectedAccount: acc })
    streamState.selectedAccount = acc
  }

  const handleSetField = useCallback(
    (field: keyof TxFields, value: string, opFields?: TxFields) => {
      const fields = opFields || txFields
      const obj = fields[field]
      setState({
        txFields: {
          ...fields,
          [field]: typeof obj === 'object' ? { ...obj, $value: value } : value
        }
      })
    },
    [setState, txFields]
  )

  const setRawField = useCallback(
    (field: keyof TxFields, type: string, value: any) => {
      // TODO $type should be a narrowed type
      setState({
        txFields: {
          ...txFields,
          [field]: {
            $type: type,
            $value: value
          }
        }
      })
    },
    [setState, txFields]
  )

  const handleAddOptionalField = useCallback(
    (field: keyof TxFields) => {
      setState({
        txFields: {
          ...txFields,
          [field]: optionalFields[field]
        }
      })
    },
    [optionalFields, setState, txFields]
  )

  const handleRemoveOptionalField = useCallback(
    (field: keyof TxFields) => {
      const { [field]: _, ...rest } = txFields
      setState({ txFields: rest })
    },
    [setState, txFields]
  )

  const handleEstimateFee = useCallback(
    async (state?: TransactionState, silent?: boolean) => {
      setFeeLoading(true)

      const fee = await estimateFee?.(state, { silent })
      if (fee) setState({ fee })

      setFeeLoading(false)
    },
    [estimateFee, setState]
  )

  const handleChangeTxType = useCallback(
    (tt: SelectOption) => {
      setState({ selectedTransaction: tt })

      const newState = resetState(tt)

      handleEstimateFee(newState, true)
    },
    [handleEstimateFee, resetState, setState]
  )

  // default tx
  useEffect(() => {
    if (selectedTransaction?.value) return

    if (defaultTransactionType) {
      handleChangeTxType(defaultTransactionType)
    }
  }, [handleChangeTxType, selectedTransaction?.value])

  const richFields = ['TransactionType', 'Account', 'HookParameters', 'Memos']

  if (flagsOptions.length) {
    richFields.push('Flags')
  }

  const txSchema = transactionsData.find(tx => tx.TransactionType === selectedTransaction?.value)
  const txSchemaFields = txSchema
    ? Object.keys(txSchema)
        .filter(field => !commonFields.includes(normalizeFieldName(field) as any))
        .map(normalizeFieldName)
    : []
  const displayFields = [
    ...txSchemaFields,
    ...Object.keys(txFields),
    ...Object.keys(optionalFields)
  ]
    .filter((field, index, fields) => fields.indexOf(field) === index)
    .filter(field => !richFields.includes(field)) as (keyof TxFields)[]
  const amountOptions = [
    { label: 'XAH', value: 'xah' },
    { label: 'Token', value: 'token' }
  ] as const

  const defaultTokenAmount = {
    value: '0',
    currency: '',
    issuer: ''
  }

  const isAccount = (value: any): value is AccountField =>
    typeIs(value, 'object') && value.$type === 'account'
  const isXrpAmount = (value: any): value is XrpAmountField =>
    typeIs(value, 'object') && value.$type === 'amount.xrp'
  const isTokenAmount = (value: any): value is TokenAmountField =>
    typeIs(value, 'object') && value.$type === 'amount.token'
  const isIssue = (value: any): value is IssueField =>
    typeIs(value, 'object') && value.$type === 'issue'
  const isObjectField = (value: any): value is ObjectField =>
    typeIs(value, 'object') && value.$type === 'object'
  const isArrayField = (value: any): value is ArrayField =>
    typeIs(value, 'object') && value.$type === 'array'
  const isVec256Field = (value: any): value is Vec256Field =>
    typeIs(value, 'object') && value.$type === 'vec256'
  const isStructuredField = (value: any): value is StructuredField =>
    isObjectField(value) || isArrayField(value) || isVec256Field(value)

  const getDefaultValue = (value: any) => {
    if (isObjectField(value)) return { ...value, $value: { ...value.$value } }
    if (isArrayField(value)) return { ...value, $value: [cloneValue(value.$value[0] || {})] }
    if (isVec256Field(value)) return { ...value, $value: [value.$value[0] || ''] }
    return cloneValue(value)
  }

  const cloneValue = (value: any): any => {
    if (Array.isArray(value)) return value.map(cloneValue)
    if (typeIs(value, 'object'))
      return Object.entries(value).reduce((acc, [key, val]) => {
        acc[key] = cloneValue(val)
        return acc
      }, {} as Record<string, any>)
    return value
  }

  const setNestedField = (field: keyof TxFields, updater: (value: any) => any) => {
    const current = txFields[field]
    const nextValue = updater(cloneValue(current))
    const { [field]: _, ...rest } = txFields

    setState({
      txFields: {
        ...(nextValue === undefined ? rest : txFields),
        ...(nextValue === undefined ? {} : { [field]: nextValue })
      }
    })
  }

  const renderPrimitiveField = (value: any, setValue: (value: any) => void, key?: string) => (
    <Input
      key={key}
      type="text"
      value={typeIs(value, 'object') ? value.$value?.toString() : value?.toString()}
      onChange={e => setValue(e.target.value)}
      css={{
        flex: 'inherit',
        '-moz-appearance': 'textfield',
        '&::-webkit-outer-spin-button': {
          '-webkit-appearance': 'none',
          margin: 0
        },
        '&::-webkit-inner-spin-button ': {
          '-webkit-appearance': 'none',
          margin: 0
        }
      }}
    />
  )

  const renderAmountField = (
    value: XrpAmountField | TokenAmountField,
    setValue: (value: XrpAmountField | TokenAmountField) => void
  ) => {
    const tokenAmount = isTokenAmount(value)
      ? {
          value: value.$value.value,
          currency: value.$value.currency,
          issuer: value.$value.issuer
        }
      : defaultTokenAmount

    return (
      <Flex fluid css={{ alignItems: 'center' }}>
        {isTokenAmount(value) ? (
          <Flex fluid row align="center" justify="space-between" css={{ position: 'relative' }}>
            <Input
              type="text"
              value={tokenAmount.currency}
              placeholder="Currency"
              onChange={e =>
                setValue({
                  ...value,
                  $value: {
                    ...tokenAmount,
                    currency: e.target.value
                  }
                })
              }
            />
            <Input
              css={{ mx: '$1' }}
              type="number"
              value={tokenAmount.value}
              placeholder="Value"
              onChange={e =>
                setValue({
                  ...value,
                  $value: {
                    ...tokenAmount,
                    value: e.target.value
                  }
                })
              }
            />
            <Box css={{ width: '50%' }}>
              <CreatableAccount
                value={tokenAmount.issuer}
                field={'Issuer' as any}
                placeholder="Issuer"
                setField={(_, issuer = '') =>
                  setValue({
                    ...value,
                    $value: {
                      ...tokenAmount,
                      issuer
                    }
                  })
                }
              />
            </Box>
          </Flex>
        ) : (
          <Input
            css={{ flex: 'inherit' }}
            type="number"
            value={value.$value?.toString()}
            onChange={e => setValue({ ...value, $value: e.target.value })}
          />
        )}
        <Box
          css={{
            ml: '$2',
            width: '150px'
          }}
        >
          <Select
            instanceId="currency-type"
            options={amountOptions}
            value={isXrpAmount(value) ? amountOptions['0'] : amountOptions['1']}
            onChange={(e: any) => {
              const opt = e as typeof amountOptions[number]
              if (opt.value === 'xah') {
                setValue({ $type: 'amount.xrp', $value: '0' })
              } else {
                setValue({ $type: 'amount.token', $value: defaultTokenAmount })
              }
            }}
          />
        </Box>
      </Flex>
    )
  }

  const renderAccountField = (
    value: AccountField,
    setValue: (value: AccountField) => void,
    field: keyof TxFields = 'Account' as keyof TxFields
  ) => (
    <CreatableAccount
      value={value.$value}
      field={field}
      setField={(_, nextValue = '') => setValue({ ...value, $value: nextValue })}
    />
  )

  const renderObjectFields = (
    value: Record<string, any>,
    setValue: (value: Record<string, any>) => void
  ) => {
    const fields = Object.keys(value)
      .map(normalizeFieldName)
      .filter((field, index, fields) => fields.indexOf(field) === index)

    return (
      <Flex column fluid css={{ gap: '$2' }}>
        {fields.map(childField => {
          const optionalKey = `${childField}?`
          const isOptional = value[optionalKey] !== undefined
          const childValue = value[childField]

          if (childValue === undefined && isOptional) {
            return (
              <Flex key={childField} row fluid css={{ alignItems: 'center', gap: '$2' }}>
                <Text muted css={{ flex: '0 0 25%' }}>
                  {childField}:{' '}
                </Text>
                <Box css={{ flex: 1 }}>
                  <Button
                    outline
                    fullWidth
                    type="button"
                    onClick={() =>
                      setValue({ ...value, [childField]: getDefaultValue(value[optionalKey]) })
                    }
                  >
                    <Plus size="16px" />
                    Add {childField}
                  </Button>
                </Box>
              </Flex>
            )
          }

          return (
            <Flex key={childField} row fluid css={{ alignItems: 'center', gap: '$2' }}>
              <Text muted css={{ flex: '0 0 25%' }}>
                {childField}:{' '}
              </Text>
              <Box css={{ flex: 1 }}>
                {renderNestedValue(childValue, nextValue => {
                  if (nextValue === undefined) {
                    const { [childField]: _, ...rest } = value
                    setValue(rest)
                    return
                  }
                  setValue({ ...value, [childField]: nextValue })
                })}
              </Box>
              {isOptional && !isArrayField(childValue) && !isVec256Field(childValue) && (
                <Button
                  onClick={() => {
                    const { [childField]: _, ...rest } = value
                    setValue(rest)
                  }}
                  variant="destroy"
                >
                  <Trash weight="regular" size="16px" />
                </Button>
              )}
            </Flex>
          )
        })}
      </Flex>
    )
  }

  const renderNestedValue = (value: any, setValue: (value: any) => void): ReactNode => {
    if (isXrpAmount(value) || isTokenAmount(value)) {
      return renderAmountField(value, nextValue => setValue(nextValue))
    }

    if (isAccount(value)) {
      return renderAccountField(value, nextValue => setValue(nextValue))
    }

    if (isObjectField(value)) {
      return renderObjectFields(value.$value, nextValue =>
        setValue({ ...value, $value: nextValue })
      )
    }

    if (isArrayField(value)) {
      const items = value.$value
      return (
        <Flex column fluid css={{ gap: '$2' }}>
          {items.map((item, index) => {
            const itemKeys = typeIs(item, 'object') ? Object.keys(item) : []
            const itemKey = itemKeys.length === 1 ? itemKeys[0] : undefined
            const itemValue = itemKey ? item[itemKey] : item
            const itemLabel = itemKey || 'Item'

            return (
              <Flex
                key={index}
                column
                fluid
                css={{ gap: '$2', p: '$2', backgroundColor: '$mauve2', borderRadius: '$sm' }}
              >
                <Flex row fluid css={{ justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text muted>
                    {itemLabel} {index + 1}
                  </Text>
                  <Button
                    onClick={() =>
                      items.length <= 1
                        ? setValue(undefined)
                        : setValue({
                            ...value,
                            $value: items.filter((_, itemIndex) => itemIndex !== index)
                          })
                    }
                    variant="destroy"
                  >
                    <Trash weight="regular" size="16px" />
                  </Button>
                </Flex>
                {renderNestedValue(itemValue, nextItemValue =>
                  setValue({
                    ...value,
                    $value: items.map((currentItem, itemIndex) => {
                      if (itemIndex !== index) return currentItem
                      return itemKey ? { ...item, [itemKey]: nextItemValue } : nextItemValue
                    })
                  })
                )}
              </Flex>
            )
          })}
          <Button
            outline
            fullWidth
            type="button"
            onClick={() =>
              setValue({
                ...value,
                $value: [...items, cloneValue(items[0] || {})]
              })
            }
          >
            <Plus size="16px" />
            Add Item
          </Button>
        </Flex>
      )
    }

    if (isVec256Field(value)) {
      const items = value.$value
      return (
        <Flex column fluid css={{ gap: '$2' }}>
          {items.map((item, index) => (
            <Flex key={index} row fluid css={{ alignItems: 'center', gap: '$2' }}>
              <Input
                type="text"
                value={item}
                onChange={e =>
                  setValue({
                    ...value,
                    $value: items.map((currentItem, itemIndex) =>
                      itemIndex === index ? e.target.value : currentItem
                    )
                  })
                }
              />
              <Button
                onClick={() =>
                  items.length <= 1
                    ? setValue(undefined)
                    : setValue({
                        ...value,
                        $value: items.filter((_, itemIndex) => itemIndex !== index)
                      })
                }
                variant="destroy"
              >
                <Trash weight="regular" size="16px" />
              </Button>
            </Flex>
          ))}
          <Button
            outline
            fullWidth
            type="button"
            onClick={() => setValue({ ...value, $value: [...items, ''] })}
          >
            <Plus size="16px" />
            Add Value
          </Button>
        </Flex>
      )
    }

    if (typeIs(value, 'object')) {
      return renderObjectFields(value, nextValue => setValue(nextValue))
    }

    return renderPrimitiveField(value, setValue)
  }

  return (
    <Container
      css={{
        p: '$3 01',
        fontSize: '$sm',
        height: 'calc(100% - 45px)'
      }}
    >
      <Flex column fluid css={{ height: '100%', overflowY: 'auto', pr: '$1' }}>
        <TxField label="Transaction type">
          <Select
            instanceId="transactionsType"
            placeholder="Select transaction type"
            options={transactionsOptions}
            hideSelectedOptions
            value={selectedTransaction}
            onChange={(tt: any) => handleChangeTxType(tt)}
          />
        </TxField>
        <TxField label="Account">
          <Select
            instanceId="from-account"
            placeholder="Select your account"
            options={accountOptions}
            value={selectedAccount}
            onChange={(acc: any) => handleSetAccount(acc)} // TODO make react-select have correct types for acc
          />
        </TxField>
        <TxField label="Sequence">
          <AccountSequence address={selectedAccount?.value} />
        </TxField>
        {richFields.includes('Flags') && (
          <TxField label="Flags">
            <Select
              isClearable
              instanceId="flags"
              placeholder="Select flags to apply"
              menuPosition="fixed"
              value={selectedFlags}
              isMulti
              options={flagsOptions}
              onChange={(flags: any) => setState({ selectedFlags: flags as any })}
              closeMenuOnSelect={
                selectedFlags ? selectedFlags.length >= flagsOptions.length - 1 : false
              }
            />
          </TxField>
        )}
        {displayFields.map(field => {
          if (txFields[field] === undefined && optionalFields[field] !== undefined) {
            return (
              <TxField multiLine key={field} label={field}>
                <Button
                  outline
                  fullWidth
                  type="button"
                  onClick={() => handleAddOptionalField(field)}
                >
                  <Plus size="16px" />
                  Add {field}
                </Button>
              </TxField>
            )
          }

          let _value = txFields[field]
          const isOptionalField = optionalFields[field] !== undefined
          if (_value === undefined) return null

          const optionalFieldDeleteButton =
            isOptionalField && !isArrayField(_value) && !isVec256Field(_value) ? (
              <Button
                css={{ ml: '$2' }}
                onClick={() => handleRemoveOptionalField(field)}
                variant="destroy"
              >
                <Trash weight="regular" size="16px" />
              </Button>
            ) : null

          if (isIssue(_value)) {
            const value = _value.$value

            return (
              <TxField key={field} label={field}>
                <Flex row fluid css={{ gap: '$1' }}>
                  <Input
                    placeholder="Currency (e.g. USD)"
                    value={value.currency}
                    css={{ flex: '0 0 30%' }}
                    onChange={e => setRawField(field, 'issue', { ...value, currency: e.target.value })}
                  />
                  <Box css={{ flex: 1 }}>
                    <CreatableAccount
                      value={value.issuer}
                      field={'Issuer' as any}
                      placeholder="Issuer account"
                      setField={(_, v = '') => setRawField(field, 'issue', { ...value, issuer: v })}
                    />
                  </Box>
                </Flex>
                {optionalFieldDeleteButton}
              </TxField>
            )
          }

          if (isXrpAmount(_value) || isTokenAmount(_value)) {
            return (
              <TxField key={field} label={field}>
                {renderAmountField(_value, nextValue =>
                  setRawField(field, nextValue.$type, nextValue.$value)
                )}
                {optionalFieldDeleteButton}
              </TxField>
            )
          }
          if (isAccount(_value)) {
            return (
              <TxField key={field} label={field}>
                {renderAccountField(_value, nextValue =>
                  setRawField(field, nextValue.$type, nextValue.$value)
                )}
                {optionalFieldDeleteButton}
              </TxField>
            )
          }
          if (isStructuredField(_value)) {
            return (
              <TxField multiLine key={field} label={field}>
                {renderNestedValue(_value, value => setNestedField(field, () => value))}
                {optionalFieldDeleteButton}
              </TxField>
            )
          }
          return (
            <TxField key={field} label={field}>
              {renderPrimitiveField(_value, value => handleSetField(field, value))}
              {optionalFieldDeleteButton}
            </TxField>
          )
        })}
        <TxField key="Fee" label="Fee">
          <Input
            type={'number'}
            value={fee}
            onChange={e => {
              const val = e.target.value.replaceAll('.', '').replaceAll(',', '')
              setState({ fee: val })
            }}
            onKeyPress={e => {
              if (e.key === '.' || e.key === ',') e.preventDefault()
            }}
            css={{
              flex: 'inherit',
              '-moz-appearance': 'textfield',
              '&::-webkit-outer-spin-button': {
                '-webkit-appearance': 'none',
                margin: 0
              },
              '&::-webkit-inner-spin-button ': {
                '-webkit-appearance': 'none',
                margin: 0
              }
            }}
          />
          <Button
            size="xs"
            variant="primary"
            outline
            disabled={txState.txIsDisabled}
            isDisabled={txState.txIsDisabled}
            isLoading={feeLoading}
            css={{
              position: 'absolute',
              right: '$2',
              fontSize: '$xs',
              cursor: 'pointer',
              alignContent: 'center',
              display: 'flex'
            }}
            onClick={() => handleEstimateFee()}
          >
            Suggest
          </Button>
        </TxField>
        <TxField multiLine label="Hook parameters">
          <Flex column fluid>
            {Object.entries(hookParameters).map(([id, { label, value }]) => (
              <Flex column key={id} css={{ mb: '$2' }}>
                <Flex row>
                  <Input
                    placeholder="Parameter name"
                    value={label}
                    onChange={e => {
                      setState({
                        hookParameters: {
                          ...hookParameters,
                          [id]: { label: e.target.value, value }
                        }
                      })
                    }}
                  />
                  <Input
                    css={{ mx: '$2' }}
                    placeholder="Value (hex-quoted)"
                    value={value}
                    onChange={e => {
                      setState({
                        hookParameters: {
                          ...hookParameters,
                          [id]: { label, value: e.target.value }
                        }
                      })
                    }}
                  />
                  <Button
                    onClick={() => {
                      const { [id]: _, ...rest } = hookParameters
                      setState({ hookParameters: rest })
                    }}
                    variant="destroy"
                  >
                    <Trash weight="regular" size="16px" />
                  </Button>
                </Flex>
              </Flex>
            ))}
            <Button
              outline
              fullWidth
              type="button"
              onClick={() => {
                const id = Object.keys(hookParameters).length
                setState({
                  hookParameters: { ...hookParameters, [id]: { label: '', value: '' } }
                })
              }}
            >
              <Plus size="16px" />
              Add Hook Parameter
            </Button>
          </Flex>
        </TxField>
        <TxField multiLine label="Memos">
          <Flex column fluid>
            {Object.entries(memos).map(([id, memo]) => (
              <Flex column key={id} css={{ mb: '$2' }}>
                <Flex
                  row
                  css={{
                    flexWrap: 'wrap',
                    width: '100%'
                  }}
                >
                  <Input
                    placeholder="Memo type"
                    value={memo.type}
                    onChange={e => {
                      setState({
                        memos: {
                          ...memos,
                          [id]: { ...memo, type: e.target.value }
                        }
                      })
                    }}
                  />
                  <Input
                    placeholder="Data (hex-quoted)"
                    css={{ mx: '$2' }}
                    value={memo.data}
                    onChange={e => {
                      setState({
                        memos: {
                          ...memos,
                          [id]: { ...memo, data: e.target.value }
                        }
                      })
                    }}
                  />
                  <Input
                    placeholder="Format"
                    value={memo.format}
                    onChange={e => {
                      setState({
                        memos: {
                          ...memos,
                          [id]: { ...memo, format: e.target.value }
                        }
                      })
                    }}
                  />
                  <Button
                    css={{ ml: '$2' }}
                    onClick={() => {
                      const { [id]: _, ...rest } = memos
                      setState({ memos: rest })
                    }}
                    variant="destroy"
                  >
                    <Trash weight="regular" size="16px" />
                  </Button>
                </Flex>
              </Flex>
            ))}
            <Button
              outline
              fullWidth
              type="button"
              onClick={() => {
                const id = Object.keys(memos).length
                setState({
                  memos: { ...memos, [id]: { data: '', format: '', type: '' } }
                })
              }}
            >
              <Plus size="16px" />
              Add Memo
            </Button>
          </Flex>
        </TxField>
      </Flex>
    </Container>
  )
}

export const CreatableAccount: FC<{
  value: string | undefined
  field: keyof TxFields
  placeholder?: string
  setField: (field: keyof TxFields, value: string, opFields?: TxFields) => void
}> = ({ value, field, setField, placeholder }) => {
  const { accounts } = useSnapshot(state)
  const accountOptions: SelectOption[] = accounts.map(acc => ({
    label: acc.name,
    value: acc.address
  }))
  const label = accountOptions.find(a => a.value === value)?.label || value
  const val = {
    value,
    label
  }
  placeholder = placeholder || `${capitalize(field)} account`
  return (
    <CreatableSelect
      isClearable
      instanceId={field}
      placeholder={placeholder}
      options={accountOptions}
      value={value ? val : undefined}
      onChange={(acc: any) => setField(field, acc?.value)}
    />
  )
}

export const TxField: FC<{ label: string; children: ReactNode; multiLine?: boolean }> = ({
  label,
  children,
  multiLine = false
}) => {
  return (
    <Flex
      row
      fluid
      css={{
        justifyContent: 'flex-end',
        alignItems: multiLine ? 'flex-start' : 'center',
        position: 'relative',
        mb: '$2',
        mt: '1px',
        pr: '1px'
      }}
    >
      <Text muted css={{ mr: '$3', mt: multiLine ? '$2' : 0 }}>
        {label}:{' '}
      </Text>
      <Flex css={{ width: '70%', alignItems: 'center' }}>{children}</Flex>
    </Flex>
  )
}
