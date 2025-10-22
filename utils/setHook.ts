import { Parameter, ParameterType, ParameterValue, Function as XRPLFunction } from '@transia/xrpl'
import { getTags } from './comment-parser'

export type DeployContractData = {
  Fee: string
  Functions: XRPLFunction[]
  InstanceParameters: {
    InstanceParameter: {
      ParameterFlag?: number
      ParameterName?: string
      ParameterType?: ParameterType
    }
    $metaData?: any
  }[]
}

export const getParameters = (content?: string) => {
  const fieldTags = ['field', 'param', 'arg', 'argument']
  const tags = getTags(content)
    .filter(tag => fieldTags.includes(tag.tag))
    .filter(tag => !!tag.name)

  const parameters: DeployContractData['InstanceParameters'] = tags.map(tag => ({
    InstanceParameter: {
      ParameterFlag: tag.flag,
      ParameterName: tag.name || '',
      ParameterType: { type: tag.type || '' }
    },
    $metaData: {
      description: tag.description,
      required: !tag.optional
    }
  }))

  return parameters
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