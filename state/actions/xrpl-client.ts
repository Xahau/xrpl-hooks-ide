import { XrplClient } from 'xrpl-client'
import state from '..'

export const xrplSend = async (...params: Parameters<XrplClient['send']>) => {
  const client = await state.client.ready()
  return client.send(...params)
}
