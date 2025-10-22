// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'

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
  const { account } = req.query
  const ip = Array.isArray(req?.headers?.['x-real-ip'])
    ? req?.headers?.['x-real-ip'][0]
    : req?.headers?.['x-real-ip']
  try {    
    const response = await fetch(
      `https://batch.faucet.nerdnest.xyz/accounts`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': ip || ''
        },
        body: JSON.stringify({ destination: account })
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
