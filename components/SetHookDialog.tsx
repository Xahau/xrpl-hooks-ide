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
import { prepareDeployHookTx, sha256 } from '../state/actions/deployHook'
import estimateFee from '../utils/estimateFee'
import { getParameters, getInvokeOptions, transactionOptions, SetHookData } from '../utils/setHook'
import { capitalize } from '../utils/helpers'
import AccountSequence from './Sequence'

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

    const getHookNamespace = useCallback(
      () =>
        (activeFile && snap.deployValues[activeFile.name]?.HookNamespace) ||
        activeFile?.name.split('.')[0] ||
        '',
      [activeFile, snap.deployValues]
    )

    const getDefaultValues = useCallback((): Partial<SetHookData> => {
      const content = activeFile?.compiledValueSnapshot
      return (
        (activeFile && snap.deployValues[activeFile.name]) || {
          HookNamespace: getHookNamespace(),
          Invoke: getInvokeOptions(content),
          HookParameters: getParameters(content)
        }
      )
    }, [activeFile, getHookNamespace, snap.deployValues])

    const {
      register,
      handleSubmit,
      control,
      watch,
      setValue,
      getValues,
      reset,
      formState: { errors }
    } = useForm<SetHookData>({
      defaultValues: getDefaultValues()
    })
    const { fields, append, remove } = useFieldArray({
      control,
      name: 'HookParameters' // unique name for your Field Array
    })

    const watchedFee = watch('Fee')

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
    // const {
    //   fields: grantFields,
    //   append: grantAppend,
    //   remove: grantRemove,
    // } = useFieldArray({
    //   control,
    //   name: "HookGrants", // unique name for your Field Array
    // });
    const [hashedNamespace, setHashedNamespace] = useState('')

    const namespace = watch('HookNamespace', getHookNamespace())

    const calculateHashedValue = useCallback(async () => {
      const hashedVal = await sha256(namespace)
      setHashedNamespace(hashedVal.toUpperCase())
    }, [namespace])

    useEffect(() => {
      calculateHashedValue()
    }, [namespace, calculateHashedValue])

    const calculateFee = useCallback(async () => {
      if (!account) return

      const formValues = getValues()
      const tx = await prepareDeployHookTx(account, formValues)
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

    const onSubmit: SubmitHandler<SetHookData> = async data => {
      const currAccount = state.accounts.find(acc => acc.address === account?.address)
      if (!account) return
      if (currAccount) currAccount.isLoading = true

      data.HookParameters.forEach(param => {
        delete param.$metaData
        return param
      })

      const res = await deployHook(account, data)
      if (currAccount) currAccount.isLoading = false

      if (res && res.engine_result === 'tesSUCCESS') {
        toast.success('Transaction succeeded!')
        return setIsSetHookDialogOpen(false)
      }
      toast.error(`Transaction failed! (${res?.engine_result_message})`)
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
            disabled={!account || account.isLoading || !activeFile || tooLargeFile()}
          >
            Set Hook
          </Button>
        </DialogTrigger>
        <DialogContent>
          <form onSubmit={handleSubmit(onSubmit)}>
            <DialogTitle>Deploy configuration</DialogTitle>
            <DialogDescription as="div">
              <Stack css={{ width: '100%', flex: 1 }}>
                <Box css={{ width: '100%' }}>
                  <Label>Account</Label>
                  <Select
                    instanceId="deploy-account"
                    placeholder="Select account"
                    options={accountOptions}
                    value={selectedAccount}
                    onChange={(acc: any) => setSelectedAccount(acc)}
                  />
                </Box>
                <Box css={{ width: '100%', position: 'relative' }}>
                  <Label>Sequence</Label>
                  <AccountSequence address={selectedAccount?.value} />
                </Box>
                <Box css={{ width: '100%' }}>
                  <Label>Invoke on transactions</Label>
                  <Controller
                    name="Invoke"
                    control={control}
                    render={({ field }) => (
                      <Select
                        {...field}
                        closeMenuOnSelect={false}
                        isMulti
                        menuPosition="fixed"
                        options={transactionOptions}
                      />
                    )}
                  />
                </Box>
                <Box css={{ width: '100%' }}>
                  <Label>Hook Namespace Seed</Label>
                  <Input {...register('HookNamespace', { required: true })} autoComplete={'off'} />
                  {errors.HookNamespace?.type === 'required' && (
                    <Box css={{ display: 'inline', color: '$red11' }}>Namespace is required</Box>
                  )}
                  <Box css={{ mt: '$3' }}>
                    <Label>Hook Namespace (sha256)</Label>
                    <Input readOnly value={hashedNamespace} />
                  </Box>
                </Box>

                <Box css={{ width: '100%' }}>
                  <Label style={{ marginBottom: '10px', display: 'block' }}>Hook parameters</Label>
                  <Stack>
                    {fields.map((field, index) => (
                      <Stack key={field.id}>
                        <Flex column>
                          <Flex row>
                            <Input
                              // important to include key with field's id
                              placeholder="Parameter name"
                              readOnly={field.$metaData?.required}
                              {...register(
                                `HookParameters.${index}.HookParameter.HookParameterName`
                              )}
                            />
                            <Input
                              css={{ mx: '$2' }}
                              placeholder="Value (hex-quoted)"
                              {...register(
                                `HookParameters.${index}.HookParameter.HookParameterValue`,
                                { required: field.$metaData?.required }
                              )}
                            />
                            <Button onClick={() => remove(index)} variant="destroy">
                              <Trash weight="regular" size="16px" />
                            </Button>
                          </Flex>
                          {errors.HookParameters?.[index]?.HookParameter?.HookParameterValue
                            ?.type === 'required' && <Text error>This field is required</Text>}
                          <Label css={{ fontSize: '$sm', mt: '$1' }}>
                            {capitalize(field.$metaData?.description)}
                          </Label>
                        </Flex>
                      </Stack>
                    ))}
                    <Button
                      outline
                      fullWidth
                      type="button"
                      onClick={() =>
                        append({
                          HookParameter: {
                            HookParameterName: '',
                            HookParameterValue: ''
                          }
                        })
                      }
                    >
                      <Plus size="16px" />
                      Add Hook Parameter
                    </Button>
                  </Stack>
                </Box>
                {activeFile?.language === 'javascript' &&
                  <Box css={{ width: '100%', position: 'relative' }}>
                    <Label>Hook Fee</Label>
                    <Box css={{ display: 'flex', alignItems: 'center' }}>
                      <Input
                        type="number"
                        {...register('JSHookFee', { required: true })}
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
                    </Box>
                    {errors.JSHookFee?.type === 'required' && (
                      <Box css={{ display: 'inline', color: '$red11' }}>Hook Fee is required</Box>
                    )}
                  </Box>
                }
                <Box css={{ width: '100%', position: 'relative' }}>
                  <Label>SetHook Fee</Label>
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
                          const tx = await prepareDeployHookTx(account, formValues)
                          if (tx) {
                            const res = await estimateFee(tx, account)

                            if (res && res.base_fee) {
                              setValue('Fee', Math.round(Number(res.base_fee || '')).toString())
                            }
                          }
                        } catch (err) { }

                        setEstimateLoading(false)
                      }}
                    >
                      Suggest
                    </Button>
                  </Box>
                  {errors.Fee?.type === 'required' && (
                    <Box css={{ display: 'inline', color: '$red11' }}>SetHook Fee is required</Box>
                  )}
                </Box>
                {/* <Box css={{ width: "100%" }}>
                <label style={{ marginBottom: "10px", display: "block" }}>
                  Hook Grants
                </label>
                <Stack>
                  {grantFields.map((field, index) => (
                    <Stack key={field.id}>
                      <Input
                        // important to include key with field's id
                        placeholder="Authorize"
                        {...register(
                          `HookGrants.${index}.HookGrant.Authorize`,
                          { minLength: 5 }
                        )}
                      />
                      <Input
                        placeholder="HookHash"
                        {...register(`HookGrants.${index}.HookGrant.HookHash`, {
                          minLength: 64,
                          maxLength: 64,
                        })}
                      />
                      <Button
                        onClick={() => grantRemove(index)}
                        variant="destroy"
                      >
                        <Trash weight="regular" size="16px" />
                      </Button>
                    </Stack>
                  ))}
                  <Button
                    outline
                    fullWidth
                    type="button"
                    onClick={() =>
                      grantAppend({
                        HookGrant: {
                          Authorize: "",
                          HookHash: "",
                        },
                      })
                    }
                  >
                    <Plus size="16px" />
                    Add Hook Grant
                  </Button>
                </Stack>
              </Box> */}
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
              {/* <DialogClose asChild> */}
              <Button variant="primary" type="submit" isLoading={account?.isLoading}>
                Set Hook
              </Button>
              {/* </DialogClose> */}
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
