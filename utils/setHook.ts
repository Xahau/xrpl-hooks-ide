import { getTags } from './comment-parser'
import { tts, TTS } from './hookOnCalculator'

export const transactionOptions = Object.keys(tts).map(key => ({
  label: key,
  value: key as keyof TTS
}))

export type SetHookData = {
  Invoke: {
    value: keyof TTS
    label: string
  }[]
  JSHookFee?: string
  Fee: string
  HookNamespace: string
  HookParameters: {
    HookParameter: {
      HookParameterName: string
      HookParameterValue: string
    }
    $metaData?: any
  }[]
  Memos?: {
    Memo: {
      MemoType: string,
      MemoData: string
      MemoFormat: string
    }
  }[]
  // HookGrants: {
  //   HookGrant: {
  //     Authorize: string;
  //     HookHash: string;
  //   };
  // }[];
}

export const getParameters = (content?: string) => {
  const fieldTags = ['field', 'param', 'arg', 'argument']
  const tags = getTags(content)
    .filter(tag => fieldTags.includes(tag.tag))
    .filter(tag => !!tag.name)

  const paramters: SetHookData['HookParameters'] = tags.map(tag => ({
    HookParameter: {
      HookParameterName: tag.name,
      HookParameterValue: tag.default || ''
    },
    $metaData: {
      description: tag.description,
      required: !tag.optional
    }
  }))

  return paramters
}

export const getInvokeOptions = (content?: string) => {
  const invokeTags = ['invoke', 'invoke-on']

  const options = getTags(content)
    .filter(tag => invokeTags.includes(tag.tag))
    .reduce((cumm, curr) => {
      const combined = curr.type || `${curr.name} ${curr.description}`
      const opts = combined.split(' ')

      return cumm.concat(opts as any)
    }, [] as (keyof TTS)[])
    .filter(opt => Object.keys(tts).includes(opt))

  const invokeOptions: SetHookData['Invoke'] = options.map(opt => ({
    label: opt,
    value: opt
  }))
  return invokeOptions
}

export function toHex(str: string) {
  var result = ''
  for (var i = 0; i < str.length; i++) {
    const hex = str.charCodeAt(i).toString(16)
    result += hex.padStart(2, '0')
  }
  return result.toUpperCase()
}

export function fromHex(hex: string) {
  var str = ''
  for (var i = 0; i < hex.length; i += 2) {
    str += String.fromCharCode(parseInt(hex.substring(i, i + 2), 16))
  }
  return str
}
