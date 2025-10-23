import { FC, useState } from 'react'
import regexifyString from 'regexify-string'
import { useSnapshot } from 'valtio'
import { Link } from '.'
import state from '../state'
import { AccountDialog } from './Accounts'
import Tooltip from './Tooltip'
import hookSetCodes from '../content/hook-set-codes.json'
import { capitalize } from '../utils/helpers'

interface EnrichLogProps {
  str?: string
}

const EnrichLog: FC<EnrichLogProps> = ({ str }) => {
  const { accounts } = useSnapshot(state)
  const [dialogAccount, setDialogAccount] = useState<string | null>(null)
  if (!str || !accounts.length) return <>{str}</>

  const addrs = accounts.map(acc => acc.address)
  const regex = `(${addrs.join('|')}|HookSet\\(\\d+\\))`
  const res = regexifyString({
    pattern: new RegExp(regex, 'gim'),
    decorator: (match, idx) => {
      if (match.startsWith('r')) {
        // Account
        const name = accounts.find(acc => acc.address === match)?.name
        return (
          <Link
            key={match + idx}
            as="a"
            onClick={() => setDialogAccount(match)}
            title={match}
            highlighted
          >
            {name || match}
          </Link>
        )
      }
      if (match.startsWith('HookSet')) {
        const code = match.match(/^HookSet\((\d+)\)/)?.[1]
        const val = hookSetCodes.find(v => code && v.code === +code)
        if (!val) return match

        const content = capitalize(val.description) || 'No hint available!'
        return (
          <>
            HookSet(
            <Tooltip content={content}>
              <Link>{val.identifier}</Link>
            </Tooltip>
            )
          </>
        )
      }
      return match
    },
    input: str
  })

  return (
    <>
      {res}
      <AccountDialog
        setActiveAccountAddress={setDialogAccount}
        activeAccountAddress={dialogAccount}
      />
    </>
  )
}

export default EnrichLog
