import { convertHexToString, convertStringToHex } from "@transia/xrpl"

export const toHex = (str: string): string => {
  return convertStringToHex(str)
}

export const fromHex = (hex: string): string => {
  return convertHexToString(hex)
}

export const isHex = (str: string): boolean => {
  return /^[0-9A-F]+$/i.test(str) && str.length % 2 === 0
}