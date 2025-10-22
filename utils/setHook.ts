import { Parameter } from '@transia/xrpl'
import { getTags } from './comment-parser'

export interface DeployContractData {
  Account: string
  Fee: string
  Functions: {
    Function: {
      FunctionName: string
      Parameters?: Parameter[]
    }
  }[]
  InstanceParameters: {
    InstanceParameter: {
      ParameterFlag?: number
      ParameterName?: string
      ParameterType?: { type: string }
      ParameterValue?: { value: string }
    }
    $metaData?: any
  }[]
  InstanceParameterValues?: {
    InstanceParameterValue: {
      ParameterFlag?: number | string
      ParameterValue: {
        type: string
        value: string
      }
    }
  }[]
}


export const getParameters = (content?: string) => {
  const fieldTags = ['field', 'param', 'arg', 'argument']
  const tags = getTags(content)
    .filter(tag => fieldTags.includes(tag.tag))
    .filter(tag => !!tag.name)

  const parameters: DeployContractData['InstanceParameters'] = tags.map(tag => ({
    InstanceParameter: {
      // @ts-ignore -- todo
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