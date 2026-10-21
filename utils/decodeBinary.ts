import { decodeRestrictedBase64ToBytes } from './decodeRestrictedBase64ToBytes'
import { isZlibData, decompressZlib } from './zlib'
import { fromByteArray } from 'base64-js'

export async function decodeBinary(input: string): Promise<ArrayBuffer> {
  let data = decodeRestrictedBase64ToBytes(input)
  if (isZlibData(data)) {
    data = await decompressZlib(data) as any
  }
  return data.buffer as ArrayBuffer
}

export function encodeBinary(input: ArrayBuffer): string {
  return fromByteArray(new Uint8Array(input))
}
