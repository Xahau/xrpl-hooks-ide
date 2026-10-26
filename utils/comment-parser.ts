import { Spec, parse, Problem } from 'comment-parser'

/**
 * JSDoc tags the IDE reads from a source file's comment blocks.
 * Values are the documented form; space-separated lists accept several values per tag.
 */
export const commentTags = {
  // Hook parameters (SetHook dialog) and script inputs (Run Script)
  param: '@param [name=default] description  -> HookParameter',
  field: 'alias of @param',
  arg: 'alias of @param',
  argument: 'alias of @param',
  input: '@input [name=default] description  -> Run Script field',
  // HookOn
  on: '@on ttPAYMENT ttINVOKE  -> HookOn',
  invoke: 'alias of @on',
  'invoke-on': 'alias of @on',
  on_incoming: '@on_incoming ttPAYMENT  -> HookOn (incoming only, overrides @on)',
  on_outgoing: '@on_outgoing ttPAYMENT  -> HookOn (outgoing only, overrides @on)',
  // Other SetHook fields
  emit: '@emit ttPAYMENT  -> HookCanEmit',
  name: '@name My Hook  -> HookName',
  flag: '@flag hsfOVERRIDE hsfCOLLECT  -> SetHook Flags'
} as const

export type CommentTag = keyof typeof commentTags

export type Tag = Omit<Spec, 'tag'> & { tag: CommentTag }

export const getTags = (source: string | undefined, names: readonly CommentTag[]): Tag[] => {
  if (!source) return []
  return parse(source).flatMap(block => block.tags as Tag[]).filter(tag => names.includes(tag.tag))
}

/** Whitespace-separated values of the matching tags, e.g. `@invoke ttPAYMENT ttINVOKE` -> ['ttPAYMENT', 'ttINVOKE']. */
export const getTagValues = (source: string | undefined, names: readonly CommentTag[]): string[] =>
  getTags(source, names).flatMap(tag =>
    [tag.type, tag.name, tag.description].join(' ').split(/\s+/).filter(Boolean)
  )

export const getErrors = (source?: string): Error | undefined => {
  if (!source) return undefined
  const blocks = parse(source)
  const probs = blocks.reduce((acc, block) => acc.concat(block.problems), [] as Problem[])
  if (!probs.length) return undefined
  const errors = probs.map(prob => `[${prob.code}] on line ${prob.line}: ${prob.message}`)
  const error = new Error(
    `The following error(s) occurred while parsing JSDOC: \n${errors.join('\n')}`
  )
  return error
}
