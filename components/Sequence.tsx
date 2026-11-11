import { FC, useCallback, useState } from 'react'
import state from '../state'
import { Flex, Input, Button } from '.'
import fetchAccountInfo from '../utils/accountInfo'
import { useSnapshot } from 'valtio'

interface AccountSequenceProps {
  address?: string
}
const AccountSequence: FC<AccountSequenceProps> = ({ address }) => {
  const { accounts } = useSnapshot(state)
  const account = accounts.find(acc => acc.address === address)
  const [isLoading, setIsLoading] = useState(false)
  const setSequence = useCallback(
    (sequence: number) => {
      const acc = state.accounts.find(acc => acc.address == address)
      if (!acc) return
      acc.sequence = sequence
    },
    [address]
  )
  const handleUpdateSequence = useCallback(
    async (silent?: boolean) => {
      if (!account) return
      setIsLoading(true)

      const info = await fetchAccountInfo(account.address, { silent })
      if (info) {
        setSequence(info.Sequence)
      }

      setIsLoading(false)
    },
    [account, setSequence]
  )
  const disabled = !account
  return (
    <Flex row align="center" fluid>
      <Input
        placeholder="Account sequence"
        value={account?.sequence || ''}
        disabled={!account}
        type="number"
        readOnly={true}
      />
      <Button
        size="xs"
        variant="primary"
        type="button"
        outline
        disabled={disabled}
        isDisabled={disabled}
        isLoading={isLoading}
        css={{
          background: '$backgroundAlt',
          position: 'absolute',
          right: '$2',
          fontSize: '$xs',
          cursor: 'pointer',
          alignContent: 'center',
          display: 'flex'
        }}
        onClick={() => handleUpdateSequence()}
      >
        Update
      </Button>
    </Flex>
  )
}

export default AccountSequence
