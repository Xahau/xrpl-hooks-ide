// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
import { allowedFaucetHosts } from '../../state/constants/networks'

interface ErrorResponse {
  error: string
}

export interface Faucet {
  address: string
  secret: string
  xrp: number
  hash: string
  code: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Faucet | ErrorResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed!' })
  }
  const { account, url } = req.query
  let faucetUrl: URL
  try {
    faucetUrl = new URL(String(url))
  } catch (err) {
    return res.status(400).json({ error: 'Invalid faucet url' })
  }
  if (faucetUrl.protocol !== 'https:' || !allowedFaucetHosts.includes(faucetUrl.host)) {
    return res.status(400).json({ error: 'Faucet not allowed' })
  }
  const ip = Array.isArray(req?.headers?.['x-real-ip'])
    ? req?.headers?.['x-real-ip'][0]
    : req?.headers?.['x-real-ip']
  try {
    const response = await fetch(
      `${faucetUrl.origin}${faucetUrl.pathname}?account=${encodeURIComponent(
        String(account || '')
      )}`,
      {
        method: 'POST',
        headers: {
          'x-forwarded-for': ip || ''
        }
      }
    )
    const json: Faucet | ErrorResponse = await response.json()
    if ('error' in json) {
      return res.status(429).json(json)
    }
    return res.status(200).json(json)
  } catch (err) {
    console.log(err)
    return res.status(500).json({ error: 'Server error' })
  }
  return res.status(500).json({ error: 'Not able to create faucet, try again' })
}
