import React, { useCallback, useEffect, useState } from 'react'
import { Plus, Trash, X } from 'phosphor-react'
import { Button, Box, Text } from '.'
import { Stack, Flex, Select } from '.'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
  DialogTrigger
} from './Dialog'
import { Input, Label } from './Input'
import { Controller, SubmitHandler, useFieldArray, useForm } from 'react-hook-form'
import { deployHook } from '../state/actions'
import { useSnapshot } from 'valtio'
import state, { IFile, SelectOption } from '../state'
import toast from 'react-hot-toast'
import { prepareDeployHookTx } from '../state/actions/deployHook'
import estimateFee from '../utils/estimateFee'
import { getParameters, DeployContractData } from '../utils/setHook'
import { capitalize } from '../utils/helpers'
import AccountSequence from './Sequence'
import { Parameter } from '@transia/xrpl'

// Helper function to convert string to hex
const stringToHex = (str: string): string => {
  return Array.from(str)
    .map(char => char.charCodeAt(0).toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase()
}

const PARAMETER_TYPE_OPTIONS: SelectOption[] = [
  { label: 'UINT8', value: 'UINT8' },
  { label: 'UINT16', value: 'UINT16' },
  { label: 'UINT32', value: 'UINT32' },
  { label: 'UINT64', value: 'UINT64' },
  { label: 'UINT128', value: 'UINT128' },
  { label: 'UINT160', value: 'UINT160' },
  { label: 'UINT192', value: 'UINT192' },
  { label: 'UINT256', value: 'UINT256' },
  { label: 'VL', value: 'VL' },
  { label: 'ACCOUNT', value: 'ACCOUNT' },
  { label: 'AMOUNT', value: 'AMOUNT' },
  { label: 'ISSUE', value: 'ISSUE' },
  { label: 'CURRENCY', value: 'CURRENCY' },
  { label: 'NUMBER', value: 'NUMBER' }
]

const PARAMETER_FLAG_OPTIONS: SelectOption[] = [
  { label: 'tfSendAmount', value: '0x00010000' },
  { label: 'tfSendNFToken', value: '0x00020000' },
  { label: 'tfAuthorizeToken', value: '0x00040000' }
]

export const SetHookDialog: React.FC<{ accountAddress: string }> = React.memo(
  ({ accountAddress }) => {
    const snap = useSnapshot(state)

    const [estimateLoading, setEstimateLoading] = useState(false)
    const [isSetHookDialogOpen, setIsSetHookDialogOpen] = useState(false)

    const compiledFiles = snap.files.filter(file => file.compiledContent)
    const activeFile = compiledFiles[snap.activeWat] as IFile | undefined

    const accountOptions: SelectOption[] = snap.accounts.map(acc => ({
      label: acc.name,
      value: acc.address
    }))

    const [selectedAccount, setSelectedAccount] = useState(
      accountOptions.find(acc => acc.value === accountAddress)
    )
    const account = snap.accounts.find(acc => acc.address === selectedAccount?.value)

    const getDefaultValues = useCallback((): Partial<DeployContractData> => {
      const content = activeFile?.compiledValueSnapshot
      return (
        (activeFile && snap.deployValues[activeFile.name]) || {
          Functions: [],
          InstanceParameters: getParameters(content)
        }
      )
    }, [activeFile, snap.deployValues])

    const {
      register,
      handleSubmit,
      control,
      watch,
      setValue,
      getValues,
      reset,
      formState: { errors }
    } = useForm<DeployContractData>({
      defaultValues: getDefaultValues()
    })
    
    const { fields, append, remove } = useFieldArray({
      control,
      name: 'InstanceParameters'
    })

    const { fields: functionFields, append: appendFunction, remove: removeFunction } = useFieldArray({
      control,
      name: 'Functions'
    })

    const instanceParameters = watch('InstanceParameters')

    const watchedFee = watch('Fee')

    // Auto-generate InstanceParameterValues from InstanceParameters while preserving existing values
    useEffect(() => {
      if (!instanceParameters) return
      
      const currentValues = getValues().InstanceParameterValues || []
      
      const generatedValues = instanceParameters.map((param: any, index: number) => {
        const existingValue = currentValues[index]?.InstanceParameterValue?.ParameterValue?.value
        
        return {
          InstanceParameterValue: {
            ParameterFlag: param?.InstanceParameter?.ParameterFlag || '',
            ParameterValue: {
              type: param?.InstanceParameter?.ParameterType?.type || '',
              value: existingValue || ''
            }
          }
        }
      })
      
      setValue('InstanceParameterValues', generatedValues)
    }, [instanceParameters, setValue, getValues])

    // Reset form if activeFile changes
    useEffect(() => {
      if (!activeFile) return
      const defaultValues = getDefaultValues()

      reset(defaultValues)
    }, [activeFile, getDefaultValues, reset])

    useEffect(() => {
      if (watchedFee && (watchedFee.includes('.') || watchedFee.includes(','))) {
        setValue('Fee', watchedFee.replaceAll('.', '').replaceAll(',', ''))
      }
    }, [watchedFee, setValue])

    const calculateFee = useCallback(async () => {
      if (!account) return

      const formValues = getValues()
      const tx = await prepareDeployHookTx(account, formValues as any)
      if (!tx) {
        return
      }
      const res = await estimateFee(tx, account)
      if (res && res.base_fee) {
        setValue('Fee', Math.round(Number(res.base_fee || '')).toString())
      }
    }, [account, getValues, setValue])

    const tooLargeFile = () => {
      return Boolean(
        activeFile?.compiledContent?.byteLength && activeFile?.compiledContent?.byteLength >= 64000
      )
    }

    const onSubmit: SubmitHandler<DeployContractData> = async data => {
      const currAccount = state.accounts.find(acc => acc.address === account?.address)
      if (!account) return
      if (currAccount) currAccount.isLoading = true

      data.InstanceParameters.forEach(param => {
        delete param.$metaData
        return param
      })

      console.log(data);
      

      // Build InstanceParameterValues
      data.InstanceParameterValues = data.InstanceParameters.map(param => ({
        InstanceParameterValue: {
          ParameterFlag: param.InstanceParameter.ParameterFlag,
          ParameterValue: {
            type: param.InstanceParameter.ParameterType?.type ?? '',
            value: param.InstanceParameter.ParameterValue?.value || ''
          }
        }
      })) 

      // Convert Functions FunctionName to hex
      data.Functions = data.Functions.map(func => ({
        Function: {
          FunctionName: stringToHex(func.Function.FunctionName),
          Parameters: func.Function.Parameters || []
        }
      }))

      const res = await deployHook(account, data)
      if (currAccount) currAccount.isLoading = false

      if (res && res.validated && res.finalResult === 'tesSUCCESS') {
        toast.success('Transaction succeeded!')
        return setIsSetHookDialogOpen(false)
      }
      toast.error(`Transaction failed! (${res?.errorMessage})`)
    }

    const onOpenChange = useCallback(
      (open: boolean) => {
        setIsSetHookDialogOpen(open)

        if (open) calculateFee()
      },
      [calculateFee]
    )

    return (
      <Dialog open={isSetHookDialogOpen} onOpenChange={onOpenChange}>
        <DialogTrigger asChild>
          <Button
            ghost
            size="xs"
            uppercase
            variant={'secondary'}
            disabled={!account || account.isLoading || account.secret === "none" || !activeFile || tooLargeFile()}
          >
            Create Contract
          </Button>
        </DialogTrigger>
        <DialogContent>
          <form onSubmit={handleSubmit(onSubmit)}>
            <DialogTitle>Deploy configuration</DialogTitle>
            <DialogDescription as="div">
              <Stack css={{ width: '100%', flex: 1 }}>
                <Box css={{ width: '100%' }}>
                  <Label>Account</Label>
                  <Controller
                    control={control}
                    name={'Account'}
                    render={({ field: { onChange, value } }) => (
                      <Select
                        instanceId="account-select"
                        placeholder="Select account"
                        options={accountOptions}
                        value={selectedAccount}
                        onChange={(selected: any) => {
                          setSelectedAccount(selected)
                          onChange(selected?.value)
                        }}
                      />
                    )}
                  />
                </Box>
                <Box css={{ width: '100%', position: 'relative' }}>
                  <Label>Sequence</Label>
                  <AccountSequence address={selectedAccount?.value} />
                </Box>


                <Box css={{ width: '100%' }}>
                  <Label style={{ marginBottom: '10px', display: 'block' }}>Functions</Label>
                  <Stack>
                    {functionFields.map((functionField, functionIndex) => (
                      <Flex column key={functionField.id} css={{ mb: '$3' }}>
                        <Flex row css={{ gap: '$2', alignItems: 'flex-start', width: '100%' }}>
                          <Box css={{ flex: 1 }}>
                            <Input
                              placeholder="Function name"
                              css={{ width: '100%' }}
                              {...register(`Functions.${functionIndex}.Function.FunctionName`, { required: true })}
                            />
                            {errors.Functions?.[functionIndex]?.Function?.FunctionName && (
                              <Text error>Function name is required</Text>
                            )}
                          </Box>
                          <Button 
                            onClick={() => removeFunction(functionIndex)} 
                            variant="destroy"
                          >
                            <Trash weight="regular" size="16px" />
                          </Button>
                        </Flex>
                        
                        <Box css={{ mt: '$2', width: '100%' }}>
                          <Label style={{ marginBottom: '10px', display: 'block' }}>Function Parameters</Label>
                          <Controller
                            control={control}
                            name={`Functions.${functionIndex}.Function.Parameters`}
                            defaultValue={[]}
                            render={({ field: { value = [], onChange } }) => (
                              <Stack>
                                {(value as Parameter[]).map((param, paramIndex) => (
                                  <Stack key={paramIndex}>
                                    <Flex row css={{ gap: '$2', width: '100%' }}>
                                      <Box css={{ flex: 1 }}>
                                        <Select
                                          instanceId={`param-flag-${functionIndex}-${paramIndex}`}
                                          placeholder="Select flag"
                                          options={PARAMETER_FLAG_OPTIONS}
                                          value={PARAMETER_FLAG_OPTIONS.find(
                                            opt => opt.value === String(param?.Parameter?.ParameterFlag)
                                          )}
                                          onChange={(selected: any) => {
                                            const newParams = [...value]
                                            if (!newParams[paramIndex]) {
                                              newParams[paramIndex] = { Parameter: {} }
                                            }
                                            newParams[paramIndex].Parameter.ParameterFlag = selected?.value || ''
                                            onChange(newParams)
                                          }}
                                        />
                                      </Box>
                                      <Box css={{ flex: 1 }}>
                                        <Select
                                          instanceId={`param-type-${functionIndex}-${paramIndex}`}
                                          placeholder="Select type"
                                          options={PARAMETER_TYPE_OPTIONS}
                                          value={PARAMETER_TYPE_OPTIONS.find(
                                            opt => opt.value === param?.Parameter?.ParameterType?.type
                                          )}
                                          onChange={(selected: any) => {
                                            const newParams = [...value]
                                            if (!newParams[paramIndex]) {
                                              newParams[paramIndex] = { Parameter: {} }
                                            }
                                            if (!newParams[paramIndex].Parameter.ParameterType) {
                                              newParams[paramIndex].Parameter.ParameterType = { type: '' }
                                            }
                                            newParams[paramIndex].Parameter.ParameterType!.type = selected?.value || ''
                                            onChange(newParams)
                                          }}
                                        />
                                      </Box>
                                      <Button 
                                        onClick={() => {
                                          const newParams = value.filter((_: any, i: number) => i !== paramIndex)
                                          onChange(newParams)
                                        }} 
                                        variant="destroy"
                                      >
                                        <Trash weight="regular" size="16px" />
                                      </Button>
                                    </Flex>
                                    <Flex row css={{ mt: '$2', width: '100%' }}>
                                      <Input
                                        placeholder="Parameter name"
                                        css={{ width: '100%' }}
                                        value={param?.Parameter?.ParameterName || ''}
                                        onChange={(e) => {
                                          const newParams = [...value]
                                          if (!newParams[paramIndex]) {
                                            newParams[paramIndex] = { Parameter: {} }
                                          }
                                          newParams[paramIndex].Parameter.ParameterName = e.target.value
                                          onChange(newParams)
                                        }}
                                      />
                                    </Flex>
                                  </Stack>
                                ))}
                                <Button
                                  outline
                                  fullWidth
                                  type="button"
                                  onClick={() => {
                                    const newParams = [...value, { 
                                      Parameter: { 
                                        ParameterFlag: '',
                                        ParameterName: '',
                                        ParameterType: { type: '' }
                                      } 
                                    }]
                                    onChange(newParams)
                                  }}
                                >
                                  <Plus size="16px" />
                                  Add Parameter
                                </Button>
                              </Stack>
                            )}
                          />
                        </Box>
                      </Flex>
                    ))}
                    <Button
                      outline
                      fullWidth
                      type="button"
                      onClick={() =>
                        appendFunction({
                          Function: {
                            FunctionName: '',
                            Parameters: []
                          }
                        })
                      }
                    >
                      <Plus size="16px" />
                      Add Function
                    </Button>
                  </Stack>
                </Box>

                <Box css={{ width: '100%' }}>
                  <Label style={{ marginBottom: '10px', display: 'block' }}>Instance parameters</Label>
                  <Stack>
                    {fields.map((field, index) => (
                      <Stack key={field.id}>
                        <Flex row css={{ gap: '$2', width: '100%' }}>
                          <Controller
                            control={control}
                            name={`InstanceParameters.${index}.InstanceParameter.ParameterFlag`}
                            render={({ field: controllerField }) => (
                              <Box css={{ flex: 1 }}>
                                <Select
                                  {...controllerField}
                                  instanceId={`instance-param-flag-${index}`}
                                  placeholder="Select flag"
                                  options={PARAMETER_FLAG_OPTIONS}
                                  value={PARAMETER_FLAG_OPTIONS.find(
                                    opt => opt.value === String(controllerField.value)
                                  )}
                                  onChange={(selected: any) => controllerField.onChange(selected?.value || '')}
                                  isDisabled={field.$metaData?.required}
                                />
                              </Box>
                            )}
                          />
                          <Controller
                            control={control}
                            name={`InstanceParameters.${index}.InstanceParameter.ParameterType.type`}
                            rules={{ required: field.$metaData?.required }}
                            render={({ field: controllerField }) => (
                              <Box css={{ flex: 1 }}>
                                <Select
                                  {...controllerField}
                                  instanceId={`instance-param-type-${index}`}
                                  placeholder="Select type"
                                  options={PARAMETER_TYPE_OPTIONS}
                                  value={PARAMETER_TYPE_OPTIONS.find(
                                    opt => opt.value === controllerField.value
                                  )}
                                  onChange={(selected: any) => controllerField.onChange(selected?.value || '')}
                                  isDisabled={field.$metaData?.required}
                                />
                              </Box>
                            )}
                          />
                          <Button onClick={() => remove(index)} variant="destroy">
                            <Trash weight="regular" size="16px" />
                          </Button>
                        </Flex>
                        <Flex row css={{ mt: '$2', width: '100%' }}>
                          <Input
                            placeholder="Parameter name"
                            css={{ width: '100%' }}
                            readOnly={field.$metaData?.required}
                            {...register(
                              `InstanceParameters.${index}.InstanceParameter.ParameterName`
                            )}
                          />
                        </Flex>
                        {errors.InstanceParameters?.[index]?.InstanceParameter?.ParameterType && (
                          <Text error>This field is required</Text>
                        )}
                        <Label css={{ fontSize: '$sm', mt: '$1' }}>
                          {capitalize(field.$metaData?.description)}
                        </Label>
                      </Stack>
                    ))}
                    <Button
                      outline
                      fullWidth
                      type="button"
                      onClick={() =>
                        append({
                          InstanceParameter: {
                            ParameterFlag: 0,
                            ParameterName: '',
                            ParameterType: { type: '' }
                          }
                        })
                      }
                    >
                      <Plus size="16px" />
                      Add Instance Parameter
                    </Button>
                  </Stack>
                </Box>
                <Box css={{ width: '100%' }}>
                  <Label style={{ marginBottom: '10px', display: 'block' }}>Instance parameter values</Label>
                  <Stack>
                    {instanceParameters?.map((param: any, index: number) => (
                      <Flex key={index} column css={{ width: '100%' }}>
                        <Label css={{ fontSize: '$sm', mb: '$1' }}>
                          {param?.InstanceParameter?.ParameterName || 'Unnamed'} ({param?.InstanceParameter?.ParameterType?.type || 'No type'})
                        </Label>
                        <Input
                          placeholder="Parameter value"
                          css={{ width: '100%' }}
                          {...register(
                            `InstanceParameterValues.${index}.InstanceParameterValue.ParameterValue.value`
                          )}
                        />
                      </Flex>
                    ))}
                  </Stack>
                </Box>
                <Box css={{ width: '100%', position: 'relative' }}>
                  <Label>Fee</Label>
                  <Box css={{ display: 'flex', alignItems: 'center' }}>
                    <Input
                      type="number"
                      {...register('Fee', { required: true })}
                      autoComplete={'off'}
                      onKeyPress={e => {
                        if (e.key === '.' || e.key === ',') {
                          e.preventDefault()
                        }
                      }}
                      step="1"
                      defaultValue={10000}
                      css={{
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
                      isLoading={estimateLoading}
                      css={{
                        position: 'absolute',
                        right: '$2',
                        fontSize: '$xs',
                        cursor: 'pointer',
                        alignContent: 'center',
                        display: 'flex'
                      }}
                      onClick={async e => {
                        e.preventDefault()
                        if (!account) return
                        setEstimateLoading(true)
                        const formValues = getValues()
                        try {
                          const tx = await prepareDeployHookTx(account, formValues as any)
                          if (tx) {
                            const res = await estimateFee(tx, account)

                            if (res && res.base_fee) {
                              setValue('Fee', Math.round(Number(res.base_fee || '')).toString())
                            }
                          }
                        } catch (err) {}

                        setEstimateLoading(false)
                      }}
                    >
                      Suggest
                    </Button>
                  </Box>
                  {errors.Fee?.type === 'required' && (
                    <Box css={{ display: 'inline', color: '$red11' }}>Fee is required</Box>
                  )}
                </Box>
              </Stack>
            </DialogDescription>

            <Flex
              css={{
                marginTop: 25,
                justifyContent: 'flex-end',
                gap: '$3'
              }}
            >
              <DialogClose asChild>
                <Button outline>Cancel</Button>
              </DialogClose>
              <Button variant="primary" type="submit" isLoading={account?.isLoading}>
                Create Contract
              </Button>
            </Flex>
            <DialogClose asChild>
              <Box css={{ position: 'absolute', top: '$3', right: '$3' }}>
                <X size="20px" />
              </Box>
            </DialogClose>
          </form>
        </DialogContent>
      </Dialog>
    )
  }
)

SetHookDialog.displayName = 'SetHookDialog'

export default SetHookDialog