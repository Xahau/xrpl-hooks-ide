import { FC } from 'react'
import { Link } from '.'

interface Props {
  result?: string
}

const ResultLink: FC<Props> = ({ result }) => {
  if (!result) return null
  // Going shortcut here because of url structure, if that changes we will do it manually
  const href = `https://xahau.network/docs/protocol-reference/transactions/transaction-results/${result.slice(0, 3)}-codes/`
  return (
    <Link as="a" href={href} target="_blank" rel="noopener noreferrer">
      {result}
    </Link>
  )
}

export default ResultLink
