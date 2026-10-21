import { typeIs, typeOf } from './helpers'

export const extractSchemaProps = <O extends object>(obj: O) =>
  Object.entries(obj).reduce((prev, [key, val]) => {
    const normalizedKey = key.replace(/\?$/, '')
    const value = typeIs(val, "object") && '$type' in val && '$value' in val ? val?.$value : val
    const type = typeOf(value)

    let schema: any = {
      title: normalizedKey,
      type,
      default: value
    }

    if (typeIs(value, "array")) {
      const item = value[0] // TODO merge other item schema's into one
      if (typeIs(item, "object")) {
        schema.items = {
          type: 'object',
          properties: extractSchemaProps(item),
          default: item
        }
      }
      // TODO primitive-value arrays
    }

    if (typeIs(value, "object")) {
      schema.properties = extractSchemaProps(value)
    }
    return {
      ...prev,
      [normalizedKey]: schema
    }
  }, {} as any)
