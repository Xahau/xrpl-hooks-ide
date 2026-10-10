import React, { useState } from 'react'
import { useSnapshot } from 'valtio'
import { Trash, X } from 'phosphor-react'
import toast from 'react-hot-toast'

import state, { INetwork } from '../state'
import { presetNetworks } from '../state/constants/networks'
import { addCustomNetwork, removeCustomNetwork, setNetwork } from '../state/actions/setNetwork'
import Box from './Box'
import Button from './Button'
import Flex from './Flex'
import Text from './Text'
import Select from './Select'
import { Input, Label } from './Input'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from './Dialog'

const ADD = '__add__'
const emptyForm = {
  name: '',
  ws: '',
  explorer: '',
  faucetUrl: '',
  faucetKind: 'newcreds' as 'newcreds' | 'accounts',
  debugStream: '',
  networkId: ''
}

const NetworkSelector = () => {
  const snap = useSnapshot(state)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const set = (key: keyof typeof emptyForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [key]: e.target.value })

  const options = [
    ...[...presetNetworks, ...snap.customNetworks].map(n => ({ label: n.name, value: n.name })),
    { label: 'Add network…', value: ADD }
  ]

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const net: INetwork = {
      name: form.name.trim(),
      ws: form.ws.trim(),
      ...(form.explorer.trim() && { explorer: form.explorer.trim().replace(/\/$/, '') }),
      ...(form.faucetUrl.trim() && {
        faucet: { url: form.faucetUrl.trim(), kind: form.faucetKind }
      }),
      ...(form.debugStream.trim() && { debugStream: form.debugStream.trim() }),
      ...(form.networkId.trim() && { networkId: Number(form.networkId) })
    }
    if (!/^wss?:\/\//.test(net.ws))
      return toast.error('WebSocket URL must start with ws:// or wss://')
    if (net.networkId !== undefined && !Number.isInteger(net.networkId))
      return toast.error('Network ID must be an integer')
    try {
      addCustomNetwork(net)
    } catch (err) {
      return toast.error((err as Error).message)
    }
    setForm(emptyForm)
    setOpen(false)
    setNetwork(net.name)
  }

  const value = options.find(o => o.value === snap.network.name)

  return (
    <Flex css={{ alignItems: 'center', gap: '$2', width: '220px', mr: '$2' }}>
      <Box
        title={snap.clientStatus}
        css={{
          flexShrink: 0,
          width: 8,
          height: 8,
          borderRadius: '$full',
          backgroundColor: snap.clientStatus === 'online' ? '$grass9' : '$tomato9'
        }}
      />
      <Select
        instanceId="NetworkSelect"
        aria-label="Network"
        options={options}
        value={value}
        isSearchable={false}
        onChange={(o: any) => (o.value === ADD ? setOpen(true) : setNetwork(o.value))}
      />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogTitle>Add network</DialogTitle>
          <DialogDescription as="div">
            <form onSubmit={submit}>
              <Flex css={{ flexDirection: 'column', gap: '$2' }}>
                {(
                  [
                    ['name', 'Name', 'My Net'],
                    ['ws', 'WebSocket URL', 'wss://xahau-test.net'],
                    ['explorer', 'Explorer URL (optional)', 'https://explorer.xahau-test.net'],
                    ['faucetUrl', 'Faucet URL (optional)', 'https://example.net/accounts'],
                    ['debugStream', 'Debug stream (optional)', 'wss://host/debugstream/{address}'],
                    ['networkId', 'Network ID (optional)', '21338']
                  ] as const
                ).map(([key, label, placeholder]) => (
                  <React.Fragment key={key}>
                    <Label>{label}</Label>
                    <Input
                      name={key}
                      value={form[key]}
                      onChange={set(key)}
                      placeholder={placeholder}
                      required={key === 'name' || key === 'ws'}
                    />
                    {key === 'faucetUrl' && form.faucetUrl && (
                      <Select
                        instanceId="FaucetKind"
                        aria-label="Faucet kind"
                        options={[
                          { label: 'newcreds (proxied, preset hosts only)', value: 'newcreds' },
                          {
                            label: 'accounts (called from the browser, needs CORS)',
                            value: 'accounts'
                          }
                        ]}
                        defaultValue={{
                          label: 'newcreds (proxied, preset hosts only)',
                          value: 'newcreds'
                        }}
                        onChange={(o: any) => setForm({ ...form, faucetKind: o.value })}
                      />
                    )}
                  </React.Fragment>
                ))}
                <Button type="submit" uppercase css={{ mt: '$3', alignSelf: 'flex-end' }}>
                  Add network
                </Button>
              </Flex>
            </form>
            {snap.customNetworks.length > 0 && (
              <Flex css={{ flexDirection: 'column', gap: '$1', mt: '$5' }}>
                <Label>Custom networks</Label>
                {snap.customNetworks.map(n => (
                  <Flex key={n.name} css={{ alignItems: 'center' }}>
                    <Text css={{ flex: 1 }}>
                      {n.name} <Text css={{ color: '$mauve10' }}>{n.ws}</Text>
                    </Text>
                    <Button
                      size="xs"
                      outline
                      aria-label={`Remove ${n.name}`}
                      onClick={() => removeCustomNetwork(n.name)}
                    >
                      <Trash size="15px" />
                    </Button>
                  </Flex>
                ))}
              </Flex>
            )}
          </DialogDescription>
          <DialogClose asChild>
            <Box
              css={{
                position: 'absolute',
                top: '$1',
                right: '$1',
                cursor: 'pointer',
                display: 'flex',
                borderRadius: '$full',
                p: '$1'
              }}
            >
              <X size="20px" />
            </Box>
          </DialogClose>
        </DialogContent>
      </Dialog>
    </Flex>
  )
}

export default NetworkSelector
