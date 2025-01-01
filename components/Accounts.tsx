import toast from 'react-hot-toast'
import { useSnapshot } from 'valtio'
import { ArrowSquareOut, Copy, Trash, Wallet, X } from 'phosphor-react'
import React, { useEffect, useState, FC } from 'react'
import Dinero from 'dinero.js'

import Button from './Button'
import { addFaucetAccount, importAccount } from '../state/actions'
import state from '../state'
import Box from './Box'
import { Container, Heading, Stack, Text, Flex } from '.'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
  DialogTrigger
} from './Dialog'
import { css } from '../stitches.config'
import { Input, Label } from './Input'
import truncate from '../utils/truncate'

const labelStyle = css({
  color: '$mauve10',
  textTransform: 'uppercase',
  fontSize: '10px',
  mb: '$0.5'
})
import transactionsData from '../content/transactions.json'
import { SetHookDialog } from './SetHookDialog'
import { addFunds } from '../state/actions/addFaucetAccount'
import { deleteHook } from '../state/actions/deployHook'
import { capitalize } from '../utils/helpers'
import { deleteAccount } from '../state/actions/deleteAccount'
import { xrplSend } from '../state/actions/xrpl-client'

export const AccountDialog = ({
  activeAccountAddress,
  setActiveAccountAddress
}: {
  activeAccountAddress: string | null
  setActiveAccountAddress: React.Dispatch<React.SetStateAction<string | null>>
}) => {
  const snap = useSnapshot(state)
  const [showSecret, setShowSecret] = useState(false)
  const activeAccount = snap.accounts.find(account => account.address === activeAccountAddress)
  return (
    <Dialog
      open={Boolean(activeAccountAddress)}
      onOpenChange={open => {
        setShowSecret(false)
        !open && setActiveAccountAddress(null)
      }}
    >
      <DialogContent
        css={{
          backgroundColor: '$mauve1 !important',
          border: '1px solid $mauve2',
          '.dark &': {
            // backgroundColor: "$black !important",
          },
          p: '$3',
          '&:before': {
            content: ' ',
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            opacity: 0.2,
            '.dark &': {
              opacity: 1
            },
            zIndex: 0,
            pointerEvents: 'none',
            backgroundImage: `url('/pattern-dark.svg'), url('/pattern-dark-2.svg')`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'bottom left, top right'
          }
        }}
      >
        <DialogTitle
          css={{
            display: 'flex',
            width: '100%',
            alignItems: 'center',
            borderBottom: '1px solid $mauve6',
            pb: '$3',
            gap: '$3',
            fontSize: '$md'
          }}
        >
          <Wallet size="15px" /> {activeAccount?.name}
          <DialogClose asChild>
            <Button
              size="xs"
              outline
              css={{ ml: 'auto', mr: '$9' }}
              tabIndex={-1}
              onClick={() => {
                deleteAccount(activeAccount?.address)
              }}
            >
              Delete Account <Trash size="15px" />
            </Button>
          </DialogClose>
        </DialogTitle>
        <DialogDescription as="div" css={{ fontFamily: '$monospace' }}>
          <Stack css={{ display: 'flex', flexDirection: 'column', gap: '$3' }}>
            <Flex css={{ alignItems: 'center' }}>
              <Flex css={{ flexDirection: 'column' }}>
                <Text className={labelStyle()}>Account Address</Text>
                <Text
                  css={{
                    fontFamily: '$monospace',
                    a: { '&:hover': { textDecoration: 'underline' } }
                  }}
                >
                  <a
                    href={`https://${process.env.NEXT_PUBLIC_EXPLORER_URL}/${activeAccount?.address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {activeAccount?.address}
                  </a>
                </Text>
              </Flex>
              <Flex css={{ marginLeft: 'auto', color: '$mauve12' }}>
                <Button
                  size="sm"
                  ghost
                  css={{ mt: '$3' }}
                  onClick={() => {
                    navigator.clipboard.writeText(activeAccount?.address || '')
                    toast.success('Copied address to clipboard')
                  }}
                >
                  <Copy size="15px" />
                </Button>
              </Flex>
            </Flex>
            <Flex css={{ alignItems: 'center' }}>
              <Flex css={{ flexDirection: 'column' }}>
                <Text className={labelStyle()}>Secret</Text>
                <Text
                  as="div"
                  css={{
                    fontFamily: '$monospace',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  {showSecret
                    ? activeAccount?.secret
                    : '•'.repeat(activeAccount?.secret.length || 16)}{' '}
                  <Button
                    css={{
                      fontFamily: '$monospace',
                      lineHeight: 2,
                      mt: '2px',
                      ml: '$3'
                    }}
                    ghost
                    size="xs"
                    onClick={() => setShowSecret(curr => !curr)}
                  >
                    {showSecret ? 'Hide' : 'Show'}
                  </Button>
                </Text>
              </Flex>
              <Flex css={{ marginLeft: 'auto', color: '$mauve12' }}>
                <Button
                  size="sm"
                  ghost
                  onClick={() => {
                    navigator.clipboard.writeText(activeAccount?.secret || '')
                    toast.success('Copied secret to clipboard')
                  }}
                  css={{ mt: '$3' }}
                >
                  <Copy size="15px" />
                </Button>
              </Flex>
            </Flex>
            <Flex css={{ alignItems: 'center' }}>
              <Flex css={{ flexDirection: 'column' }}>
                <Text className={labelStyle()}>Balances & Objects</Text>
                <Text
                  css={{
                    fontFamily: '$monospace',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  {Dinero({
                    amount: Number(activeAccount?.xrp || '0'),
                    precision: 6
                  })
                    .toUnit()
                    .toLocaleString(undefined, {
                      style: 'currency',
                      currency: 'XAH',
                      currencyDisplay: 'name'
                    })}
                  <Button
                    css={{
                      fontFamily: '$monospace',
                      lineHeight: 2,
                      mt: '2px',
                      ml: '$3'
                    }}
                    ghost
                    size="xs"
                    onClick={() => {
                      addFunds(activeAccount?.address || '')
                    }}
                  >
                    Add Funds
                  </Button>
                </Text>
              </Flex>
              <Flex
                css={{
                  marginLeft: 'auto'
                }}
              >
                <a
                  href={`https://${process.env.NEXT_PUBLIC_EXPLORER_URL}/${activeAccount?.address}`}
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  <Button size="sm" ghost css={{ color: '$grass11 !important', mt: '$3' }}>
                    <ArrowSquareOut size="15px" />
                  </Button>
                </a>
              </Flex>
            </Flex>
            <Flex css={{ alignItems: 'center' }}>
              <Flex css={{ flexDirection: 'column' }}>
                <Text className={labelStyle()}>Installed Hooks</Text>
                <Text
                  css={{
                    fontFamily: '$monospace',
                    a: { '&:hover': { textDecoration: 'underline' } }
                  }}
                >
                  {activeAccount && activeAccount.hooks.length > 0
                    ? activeAccount.hooks.map(i => {
                        return (
                          <a
                            key={i}
                            href={`https://${process.env.NEXT_PUBLIC_EXPLORER_URL}/${i}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {truncate(i, 12)}
                          </a>
                        )
                      })
                    : '–'}
                </Text>
              </Flex>
              {activeAccount && activeAccount?.hooks?.length > 0 && (
                <Flex css={{ marginLeft: 'auto' }}>
                  <Button
                    size="xs"
                    outline
                    disabled={activeAccount.isLoading}
                    css={{ mt: '$3', mr: '$1', ml: 'auto' }}
                    onClick={() => {
                      deleteHook(activeAccount)
                    }}
                  >
                    Delete Hook <Trash size="15px" />
                  </Button>
                </Flex>
              )}
            </Flex>
          </Stack>
        </DialogDescription>
        <DialogClose asChild>
          <Box css={{ position: 'absolute', top: '$3', right: '$3' }}>
            <X size="20px" />
          </Box>
        </DialogClose>
      </DialogContent>
    </Dialog>
  )
}

interface AccountProps {
  card?: boolean
  hideDeployBtn?: boolean
  showHookStats?: boolean
}

const Accounts: FC<AccountProps> = props => {
  const snap = useSnapshot(state)
  const [activeAccountAddress, setActiveAccountAddress] = useState<string | null>(null)
  useEffect(() => {
    const fetchAccInfo = async () => {
      if (snap.clientStatus === 'online') {
        const requests = snap.accounts.map(acc =>
          xrplSend({
            id: `hooks-builder-req-info-${acc.address}`,
            command: 'account_info',
            account: acc.address
          })
        )
        const responses = await Promise.all(requests)
        responses.forEach((res: any) => {
          const address = res?.account_data?.Account as string
          const balance = res?.account_data?.Balance as string
          const sequence = res?.account_data?.Sequence as number
          const accountToUpdate = state.accounts.find(acc => acc.address === address)
          if (accountToUpdate) {
            accountToUpdate.xrp = balance
            accountToUpdate.sequence = sequence
            accountToUpdate.error = null
          } else {
            const oldAccount = state.accounts.find(acc => acc.address === res?.account)
            if (oldAccount) {
              oldAccount.xrp = '0'
              oldAccount.error = {
                code: res?.error,
                message: res?.error_message
              }
            }
          }
        })
        const objectRequests = snap.accounts.map(acc => {
          return xrplSend({
            id: `hooks-builder-req-objects-${acc.address}`,
            command: 'account_objects',
            account: acc.address
          })
        })
        const objectResponses = await Promise.all(objectRequests)
        objectResponses.forEach((res: any) => {
          const address = res?.account as string
          const accountToUpdate = state.accounts.find(acc => acc.address === address)
          if (accountToUpdate) {
            accountToUpdate.hooks =
              res.account_objects
                .find((ac: any) => ac?.LedgerEntryType === 'Hook')
                ?.Hooks?.map((oo: any) => oo.Hook.HookHash) || []
          }
        })
      }
    }

    let fetchAccountInfoInterval: NodeJS.Timer
    if (snap.clientStatus === 'online') {
      fetchAccInfo()
      fetchAccountInfoInterval = setInterval(() => fetchAccInfo(), 10000)
    }

    return () => {
      if (snap.accounts.length > 0) {
        if (fetchAccountInfoInterval) {
          clearInterval(fetchAccountInfoInterval)
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snap.accounts.length, snap.clientStatus])
  return (
    <Box
      as="div"
      css={{
        display: 'flex',
        backgroundColor: props.card ? '$deep' : '$mauve1',
        position: 'relative',
        flex: '1',
        height: '100%',
        border: '1px solid $mauve6',
        borderRadius: props.card ? '$md' : undefined
      }}
    >
      <Container css={{ p: 0, flexShrink: 1, height: '100%' }}>
        <Flex
          css={{
            py: '$3',
            borderBottom: props.card ? '1px solid $mauve6' : undefined
          }}
        >
          <Heading
            as="h3"
            css={{
              fontWeight: 300,
              m: 0,
              fontSize: '11px',
              color: '$mauve12',
              px: '$3',
              textTransform: 'uppercase',
              alignItems: 'center',
              display: 'inline-flex',
              gap: '$3'
            }}
          >
            <Wallet size="15px" /> <Text css={{ lineHeight: 1 }}>Accounts</Text>
          </Heading>
          <Flex css={{ ml: 'auto', gap: '$3', marginRight: '$3' }}>
            <ImportAccountDialog type="create" />
            <ImportAccountDialog />
          </Flex>
        </Flex>
        <Stack
          css={{
            flexDirection: 'column',
            width: '100%',
            fontSize: '13px',
            wordWrap: 'break-word',
            fontWeight: '$body',
            gap: 0,
            height: 'calc(100% - 52px)',
            flexWrap: 'nowrap',
            overflowY: 'auto'
          }}
        >
          {snap.accounts.map(account => (
            <Flex
              column
              key={account.address + account.name}
              onClick={() => setActiveAccountAddress(account.address)}
              css={{
                px: '$3',
                py: props.card ? '$3' : '$2',
                cursor: 'pointer',
                borderBottom: props.card ? '1px solid $mauve6' : undefined,
                '@hover': {
                  '&:hover': {
                    background: '$backgroundAlt'
                  }
                }
              }}
            >
              <Flex
                row
                css={{
                  justifyContent: 'space-between'
                }}
              >
                <Box>
                  <Text>{account.name} </Text>
                  <Text
                    css={{
                      color: '$textMuted',
                      wordBreak: 'break-word'
                    }}
                  >
                    {account.address}{' '}
                    {!account?.error ? (
                      `(${Dinero({
                        amount: Number(account?.xrp || '0'),
                        precision: 6
                      })
                        .toUnit()
                        .toLocaleString(undefined, {
                          style: 'currency',
                          currency: 'XAH',
                          currencyDisplay: 'name'
                        })})`
                    ) : (
                      <Box css={{ color: '$red11' }}>
                        (Account not found, request funds to activate account)
                      </Box>
                    )}
                  </Text>
                </Box>
                {!props.hideDeployBtn && (
                  <div
                    className="hook-deploy-button"
                    onClick={e => {
                      e.stopPropagation()
                    }}
                  >
                    <SetHookDialog accountAddress={account.address} />
                  </div>
                )}
              </Flex>
              {props.showHookStats && (
                <Text muted small css={{ mt: '$2' }}>
                  {account.hooks.length} hook
                  {account.hooks.length === 1 ? '' : 's'} installed
                </Text>
              )}
            </Flex>
          ))}
        </Stack>
      </Container>
      <AccountDialog
        activeAccountAddress={activeAccountAddress}
        setActiveAccountAddress={setActiveAccountAddress}
      />
    </Box>
  )
}

export const transactionsOptions = transactionsData.map(tx => ({
  value: tx.TransactionType,
  label: tx.TransactionType
}))

const ImportAccountDialog = ({ type = 'import' }: { type?: 'import' | 'create' }) => {
  const [secret, setSecret] = useState('')
  const [name, setName] = useState('')

  const btnText = type === 'import' ? 'Import' : 'Create'
  const title = type === 'import' ? 'Import Account' : 'Create Account'

  const handleSubmit = async () => {
    if (type === 'create') {
      const value = capitalize(name)
      await addFaucetAccount(value, true)
      setName('')
      setSecret('')
      return
    }
    importAccount(secret, name)
    setName('')
    setSecret('')
  }
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button ghost size="sm">
          {btnText}
        </Button>
      </DialogTrigger>
      <DialogContent aria-describedby={undefined}>
        <DialogTitle css={{ mb: '$4' }}>{title}</DialogTitle>
        <Flex column>
          <Box css={{ mb: '$2' }}>
            <Label>
              Account name <Text muted>(optional)</Text>
            </Label>
            <Input
              name="name"
              type="text"
              autoComplete="off"
              autoCapitalize="on"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </Box>
          {type === 'import' && (
            <Box>
              <Label>Account secret</Label>
              <Input
                required
                name="secret"
                type="password"
                autoComplete="new-password"
                value={secret}
                onChange={e => setSecret(e.target.value)}
              />
            </Box>
          )}
        </Flex>

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
          <DialogClose asChild>
            <Button type="submit" variant="primary" onClick={handleSubmit}>
              {title}
            </Button>
          </DialogClose>
        </Flex>
        <DialogClose asChild>
          <Box css={{ position: 'absolute', top: '$3', right: '$3' }}>
            <X size="20px" />
          </Box>
        </DialogClose>
      </DialogContent>
    </Dialog>
  )
}

export default Accounts
