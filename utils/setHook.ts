import { getTags, getTagValues } from './comment-parser'
import { tts, TTS } from './hookOnCalculator'
import { hookSetFlags } from '../state/constants/flags'

export const transactionOptions = Object.keys(tts).map(key => ({
  label: key,
  value: key as keyof TTS
}))

export type SetHookData = {
  Invoke: {
    value: keyof TTS
    label: string
  }[]
  InvokeIncoming: {
    value: keyof TTS
    label: string
  }[]
  InvokeOutgoing: {
    value: keyof TTS
    label: string
  }[]
  HookCanEmit?: {
    value: keyof TTS
    label: string
  }[]
  Flags?: {
    value: string
    label: string
  }[]
  Fee: string
  HookName?: string
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
  const tags = getTags(content, ['field', 'param', 'arg', 'argument']).filter(tag => !!tag.name)

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

const toOptions = <T extends Record<string, unknown>>(values: string[], allowed: T) =>
  (Object.keys(allowed) as (keyof T & string)[])
    .filter(key => values.includes(key))
    .map(key => ({ label: key, value: key }))

const toTTOptions = (values: string[]): SetHookData['Invoke'] => toOptions(values, tts)

/** SetHook form defaults derived from the source comment tags (see commentTags). */
export const getSetHookDefaults = (content?: string): Partial<SetHookData> => {
  const incoming = toTTOptions(getTagValues(content, ['on_incoming']))
  const outgoing = toTTOptions(getTagValues(content, ['on_outgoing']))
  const flags = toOptions(getTagValues(content, ['flag']), hookSetFlags).map(f => ({
    label: f.label,
    value: hookSetFlags[f.label]
  }))
  const name = getTagValues(content, ['name']).join(' ')
  return {
    // incoming/outgoing take priority over @invoke when both are given
    Invoke:
      incoming.length || outgoing.length
        ? []
        : toTTOptions(getTagValues(content, ['invoke', 'invoke-on', 'on'])),
    InvokeIncoming: incoming,
    InvokeOutgoing: outgoing,
    HookCanEmit: toTTOptions(getTagValues(content, ['emit'])),
    Flags: flags.length ? flags : [{ label: 'hsfOVERRIDE', value: hookSetFlags.hsfOVERRIDE }],
    ...(name && { HookName: name }),
    HookParameters: getParameters(content)
  }
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
