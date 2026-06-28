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
  TxFields,
  defaultTransactionType
} from '../../state/transactions'
import { useSnapshot } from 'valtio'
import state from '../../state'
import { streamState } from '../DebugStream'
import { Box, Button } from '..'
import Textarea from '../Textarea'
import { getFlags } from '../../state/constants/flags'
import { Plus, Trash } from 'phosphor-react'
import AccountSequence from '../Sequence'
import { capitalize, typeIs } from '../../utils/helpers'

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
  $value: { value: string, currency: string, issuer: string }
}

// interface IssueField {
//   $type: 'issue'
//   $value: { currency: string, issuer: string }
// }

interface JsonField {
  $type: 'json'
  $value: any
}

export const TxUI: FC<UIProps> = ({
  state: txState,
  setState,
  resetState,
  estimateFee,
  switchToJson
}) => {
  const { accounts } = useSnapshot(state)
  const { selectedAccount, selectedTransaction, txFields, selectedFlags, hookParameters, memos } =
    txState

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

  const handleEstimateFee = useCallback(
    async (state?: TransactionState, silent?: boolean) => {
      setFeeLoading(true)

      const fee = await estimateFee?.(state, { silent })
      if (fee) handleSetField('Fee', fee, state?.txFields)

      setFeeLoading(false)
    },
    [estimateFee, handleSetField]
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

  const otherFields = Object.keys(txFields).filter(k => !richFields.includes(k)) as [keyof TxFields]
  const amountOptions = [
    { label: 'XAH', value: 'xah' },
    { label: 'Token', value: 'token' }
  ] as const

  const defaultTokenAmount = {
    value: '0',
    currency: '',
    issuer: ''
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
              onChange={flags => setState({ selectedFlags: flags as any })}
              closeMenuOnSelect={
                selectedFlags ? selectedFlags.length >= flagsOptions.length - 1 : false
              }
            />
          </TxField>
        )}
        {otherFields.map(field => {
          let _value = txFields[field]

          const isAccount = (value: any): value is AccountField => typeIs(value, 'object') && value.$type === 'account'
          const isXrpAmount = (value: any): value is XrpAmountField => typeIs(value, 'object') && value.$type === 'amount.xrp'
          const isTokenAmount = (value: any): value is TokenAmountField => typeIs(value, 'object') && value.$type === 'amount.token'
          // const isIssue = (value: any): value is IssueField => typeIs(value, 'object') && value.$type === 'issue'
          const isJson = (value:any): value is JsonField => typeIs(value, 'object') && value.$type === 'json'
          const isFee = field === 'Fee'
          let rows = isJson(_value) ? (JSON.stringify(_value.$value, null, 2).match(/\n/gm)?.length || 0) + 1 : undefined
          if (rows && rows > 5) rows = 5
          let tokenAmount = defaultTokenAmount

          // if (isIssue(_value)) {
          //   const value = _value.$value

          //   return (
          //     <TxField key={field} label={field}>
          //       <Flex row fluid css={{ gap: '$1' }}>
          //         <Input
          //           placeholder="Currency (e.g. USD)"
          //           value={value.currency}
          //           css={{ flex: '0 0 30%' }}
          //           onChange={e => setRawField(field, 'issue', { ...value, currency: e.target.value })}
          //         />
          //         <Box css={{ flex: 1 }}>
          //           <CreatableAccount
          //             value={value.issuer}
          //             field={'Issuer' as any}
          //             placeholder="Issuer account"
          //             setField={(_, v = '') => setRawField(field, 'issue', { ...value, issuer: v })}
          //           />
          //         </Box>
          //       </Flex>
          //     </TxField>
          //   )
          // }

          // Amount
          if (isTokenAmount(_value)) {
            tokenAmount = {
              value: _value.$value.value,
              currency: _value.$value.currency,
              issuer: _value.$value.issuer
            }
          }

          if (isXrpAmount(_value) || isTokenAmount(_value)) {
            return (
              <TxField key={field} label={field}>
                <Flex fluid css={{ alignItems: 'center' }}>
                  {isTokenAmount(_value) ? (
                    <Flex
                      fluid
                      row
                      align="center"
                      justify="space-between"
                      css={{ position: 'relative' }}
                    >
                      {/*  <Input
                        type="text"
                        placeholder="Issuer"
                        value={tokenAmount.issuer}
                        onChange={e =>
                          setRawField(field, 'amount.token', {
                            ...tokenAmount,
                            issuer: e.target.value
                          })
                        }
                      /> */}
                      <Input
                        type="text"
                        value={tokenAmount.currency}
                        placeholder="Currency"
                        onChange={e => {
                          setRawField(field, 'amount.token', {
                            ...tokenAmount,
                            currency: e.target.value
                          })
                        }}
                      />
                      <Input
                        css={{ mx: '$1' }}
                        type="number"
                        value={tokenAmount.value}
                        placeholder="Value"
                        onChange={e => {
                          setRawField(field, 'amount.token', {
                            ...tokenAmount,
                            value: e.target.value
                          })
                        }}
                      />
                      <Box css={{ width: '50%' }}>
                        <CreatableAccount
                          value={tokenAmount.issuer}
                          field={'Issuer' as any}
                          placeholder="Issuer"
                          setField={(_, value = '') => {
                            setRawField(field, 'amount.token', {
                              ...tokenAmount,
                              issuer: value
                            })
                          }}
                        />
                      </Box>
                    </Flex>
                  ) : (
                    <Input
                      css={{ flex: 'inherit' }}
                      type="number"
                      value={_value.$value?.toString()}
                      onChange={e => handleSetField(field, e.target.value)}
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
                      value={isXrpAmount(_value) ? amountOptions['0'] : amountOptions['1']}
                      onChange={(e: any) => {
                        const opt = e as typeof amountOptions[number]
                        if (opt.value === 'xah') {
                          setRawField(field, 'amount.xrp', '0')
                        } else {
                          setRawField(field, 'amount.token', defaultTokenAmount)
                        }
                      }}
                    />
                  </Box>
                </Flex>
              </TxField>
            )
          }
          if (isAccount(_value)) {
            return (
              <TxField key={field} label={field}>
                <CreatableAccount value={_value.$value} field={field} setField={handleSetField} />
              </TxField>
            )
          }
          return (
            <TxField key={field} label={field}>
              {isJson(_value) ? (
                <Textarea
                  rows={rows}
                  value={JSON.stringify(_value.$value, null, 2)}
                  spellCheck={false}
                  onChange={switchToJson}
                  css={{
                    flex: 'inherit',
                    resize: 'vertical'
                  }}
                />
              ) : (
                <Input
                  type={isFee ? 'number' : 'text'}
                  value={typeof _value === 'object' ? _value.$value?.toString() : _value?.toString()}
                  onChange={e => {
                    if (isFee) {
                      const val = e.target.value.replaceAll('.', '').replaceAll(',', '')
                      handleSetField(field, val)
                    } else {
                      handleSetField(field, e.target.value)
                    }
                  }}
                  onKeyPress={
                    isFee
                      ? e => {
                          if (e.key === '.' || e.key === ',') {
                            e.preventDefault()
                          }
                        }
                      : undefined
                  }
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
              )}
              {isFee && (
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
              )}
            </TxField>
          )
        })}
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
