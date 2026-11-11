interface File {
  name: string
}

export const guessZipFileName = (files: File[]) => {
  let parts = (files.filter(f => f.name.endsWith('.c'))[0]?.name || 'hook').split('.')
  parts = parts.length > 1 ? parts.slice(0, -1) : parts
  return parts.join('')
}

export const capitalize = (value?: string) => {
  if (!value) return ''

  return value[0].toLocaleUpperCase() + value.slice(1)
}

export const getFileExtention = (filename?: string): string | undefined => {
  if (!filename) return
  const ext = (filename.includes('.') && filename.split('.').pop()) || undefined
  return ext
}

type Type =
  | 'array'
  | 'undefined'
  | 'object'
  | 'string'
  | 'number'
  | 'bigint'
  | 'boolean'
  | 'symbol'
  | 'function'
type obj = Record<string | number | symbol, unknown>
type arr = unknown[]

export const typeIs = <T extends Type>(
  arg: any,
  t: T | T[]
): arg is unknown &
  (T extends 'array'
    ? arr
    : T extends 'undefined'
      ? undefined | null
      : T extends 'object'
        ? obj
        : T extends 'string'
          ? string
          : T extends 'number'
            ? number
            : T extends 'bigint'
              ? bigint
              : T extends 'boolean'
                ? boolean
                : T extends 'symbol'
                  ? symbol
                  : T extends 'function'
                    ? Function
                    : never) => {
  const types = Array.isArray(t) ? t : [t]
  return types.includes(typeOf(arg) as T)
}

export const typeOf = (arg: any): Type => {
  const type = arg instanceof Array ? 'array' : arg === null ? 'undefined' : typeof arg
  return type
}
