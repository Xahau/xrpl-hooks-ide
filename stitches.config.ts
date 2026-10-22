// Minimal stitches-compatible styling layer on top of @emotion/css (framework-agnostic, no css prop magic).
import * as React from 'react'
import { css as emotionCss, cx, keyframes as emotionKeyframes, injectGlobal } from '@emotion/css'

import {
  gray,
  blue,
  crimson,
  grass,
  mauve,
  mauveA,
  amber,
  purple,
  green,
  grayDark,
  blueDark,
  crimsonDark,
  grassDark,
  mauveDark,
  mauveDarkA,
  amberDark,
  purpleDark,
  greenDark,
  red,
  redDark
} from '@radix-ui/colors'

export type CSS = { [key: string]: string | number | boolean | null | undefined | CSS }

// ---------------------------------------------------------------- theme data
export const theme = {
  colors: {
    ...gray,
    ...blue,
    ...crimson,
    ...grass,
    ...mauve,
    ...mauveA,
    ...amber,
    ...purple,
    ...green,
    ...red,
    accent: '#9D2DFF',
    background: '$gray1',
    backgroundAlt: '$gray4',
    backgroundOverlay: '$mauve2',
    text: '$gray12',
    textMuted: '$gray10',
    error: '$red9',
    warning: '$amber11',
    success: '$grass11',
    white: 'white',
    black: 'black',
    deep: 'rgb(244, 244, 244)'
  },
  fonts: {
    body: 'Work Sans, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
    heading: 'Work Sans, sans-serif',
    monospace: 'Roboto Mono, monospace'
  },
  fontSizes: {
    xs: '0.6875rem',
    sm: '0.875rem',
    md: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
    '4xl': '2.25rem',
    '5xl': '3rem',
    '6xl': '3.75rem',
    '7xl': '4.5rem',
    '8xl': '6rem',
    '9xl': '8rem',
    default: '$md'
  },
  space: {
    px: '1px',
    0.5: '0.125rem',
    1: '0.25rem',
    1.5: '0.375rem',
    2: '0.5rem',
    2.5: '0.625rem',
    3: '0.75rem',
    3.5: '0.875rem',
    4: '1rem',
    5: '1.25rem',
    6: '1.5rem',
    7: '1.75rem',
    8: '2rem',
    9: '2.25rem',
    10: '2.5rem',
    12: '3rem',
    14: '3.5rem',
    16: '4rem',
    20: '5rem',
    24: '6rem',
    28: '7rem',
    32: '8rem',
    36: '9rem',
    40: '10rem',
    44: '11rem',
    48: '12rem',
    52: '13rem',
    56: '14rem',
    60: '15rem',
    64: '16rem',
    72: '18rem',
    80: '20rem',
    96: '24rem',
    widePlus: '2048px',
    wide: '1536px',
    layoutPlus: '1260px',
    layout: '1024px',
    copyUltra: '980px',
    copyPlus: '768px',
    copy: '680px',
    narrowPlus: '600px',
    narrow: '512px',
    xs: '20rem',
    sm: '24rem',
    md: '28rem',
    lg: '32rem',
    xl: '36rem',
    '2xl': '42rem',
    '3xl': '48rem',
    '4xl': '56rem',
    '5xl': '64rem',
    '6xl': '72rem',
    '7xl': '80rem',
    '8xl': '90rem'
  },
  sizes: {
    px: '1px',
    0.5: '0.125rem',
    1: '0.25rem',
    1.5: '0.375rem',
    2: '0.5rem',
    2.5: '0.625rem',
    3: '0.75rem',
    3.5: '0.875rem',
    4: '1rem',
    5: '1.25rem',
    6: '1.5rem',
    7: '1.75rem',
    8: '2rem',
    9: '2.25rem',
    10: '2.5rem',
    12: '3rem',
    14: '3.5rem',
    16: '4rem',
    20: '5rem',
    24: '6rem',
    28: '7rem',
    32: '8rem',
    36: '9rem',
    40: '10rem',
    44: '11rem',
    48: '12rem',
    52: '13rem',
    56: '14rem',
    60: '15rem',
    64: '16rem',
    72: '18rem',
    80: '20rem',
    96: '24rem',
    max: 'max-content',
    min: 'min-content',
    full: '100%',
    '3xs': '14rem',
    '2xs': '16rem',
    xs: '20rem',
    sm: '24rem',
    md: '28rem',
    lg: '32rem',
    xl: '36rem',
    '2xl': '42rem',
    '3xl': '48rem',
    '4xl': '56rem',
    '5xl': '64rem',
    '6xl': '72rem',
    '7xl': '80rem',
    '8xl': '90rem'
  },
  radii: {
    none: '0',
    sm: '0.2rem',
    base: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    '2xl': '1rem',
    '3xl': '1.5rem',
    full: '9999px'
  },
  fontWeights: {
    body: 400,
    heading: 700,
    bold: 700
  },
  lineHeights: {
    one: 1,
    body: 1.5,
    heading: 0.85
  }
}

const darkColors = {
  ...grayDark,
  ...blueDark,
  ...crimsonDark,
  ...grassDark,
  ...mauveDark,
  ...mauveDarkA,
  ...amberDark,
  ...purpleDark,
  ...greenDark,
  ...redDark,
  deep: 'rgb(10, 10, 10)',
  backgroundOverlay: '$mauve5'
}

// only the media keys call sites use
const media: Record<string, string> = {
  md: '(min-width: 48em)',
  lg: '(min-width: 62em)',
  hover: '(any-hover: hover)'
}

const utils: Record<string, (v: any) => CSS> = {
  m: v => ({ margin: v }),
  mt: v => ({ marginTop: v }),
  mr: v => ({ marginRight: v }),
  mb: v => ({ marginBottom: v }),
  ml: v => ({ marginLeft: v }),
  mx: v => ({ marginLeft: v, marginRight: v }),
  my: v => ({ marginTop: v, marginBottom: v }),
  p: v => ({ padding: v }),
  pt: v => ({ paddingTop: v }),
  pr: v => ({ paddingRight: v }),
  pb: v => ({ paddingBottom: v }),
  pl: v => ({ paddingLeft: v }),
  px: v => ({ paddingLeft: v, paddingRight: v }),
  py: v => ({ paddingTop: v, paddingBottom: v }),
  size: v => ({ width: v, height: v })
}

// ---------------------------------------------------------------- token resolution
// property -> theme scale, same as the stitches default themeMap
const themeMap: Record<string, string> = {}
const scaleProps: Record<string, string> = {
  space:
    'gap gridGap columnGap gridColumnGap rowGap gridRowGap inset insetBlock insetBlockEnd insetBlockStart insetInline insetInlineEnd insetInlineStart margin marginTop marginRight marginBottom marginLeft marginBlock marginBlockEnd marginBlockStart marginInline marginInlineEnd marginInlineStart padding paddingTop paddingRight paddingBottom paddingLeft paddingBlock paddingBlockEnd paddingBlockStart paddingInline paddingInlineEnd paddingInlineStart top right bottom left scrollMargin scrollMarginTop scrollMarginRight scrollMarginBottom scrollMarginLeft scrollMarginX scrollMarginY scrollMarginBlock scrollMarginBlockEnd scrollMarginBlockStart scrollMarginInline scrollMarginInlineEnd scrollMarginInlineStart scrollPadding scrollPaddingTop scrollPaddingRight scrollPaddingBottom scrollPaddingLeft scrollPaddingX scrollPaddingY scrollPaddingBlock scrollPaddingBlockEnd scrollPaddingBlockStart scrollPaddingInline scrollPaddingInlineEnd scrollPaddingInlineStart',
  fontSizes: 'fontSize',
  colors:
    'background backgroundColor backgroundImage borderImage border borderBlock borderBlockEnd borderBlockStart borderBottom borderBottomColor borderColor borderInline borderInlineEnd borderInlineStart borderLeft borderLeftColor borderRight borderRightColor borderTop borderTopColor caretColor color columnRuleColor fill outline outlineColor stroke textDecorationColor',
  fonts: 'fontFamily',
  fontWeights: 'fontWeight',
  lineHeights: 'lineHeight',
  letterSpacings: 'letterSpacing',
  sizes:
    'blockSize minBlockSize maxBlockSize inlineSize minInlineSize maxInlineSize width minWidth maxWidth height minHeight maxHeight flexBasis gridTemplateColumns gridTemplateRows',
  borderWidths: 'borderWidth borderTopWidth borderRightWidth borderBottomWidth borderLeftWidth',
  borderStyles: 'borderStyle borderTopStyle borderRightStyle borderBottomStyle borderLeftStyle',
  radii:
    'borderRadius borderTopLeftRadius borderTopRightRadius borderBottomRightRadius borderBottomLeftRadius',
  shadows: 'boxShadow textShadow',
  transitions: 'transition',
  zIndices: 'zIndex'
}
for (const [scale, props] of Object.entries(scaleProps)) {
  for (const p of props.split(' ')) themeMap[p] = scale
}

// `$token` / `$scale$token` / `-$token`; names are [\w-]+ exactly like stitches (so `$0.5` is as broken as before)
const resolveTokens = (value: string, scale?: string) =>
  value.replace(/(-?)\$(?:(\w+)\$)?([\w-]+)/g, (_, neg, explicit, token) => {
    const s = explicit ?? scale
    const ref = `var(--${s ? `${s}-` : ''}${token})`
    return neg ? `calc(${ref}*-1)` : ref
  })

// styleObject -> plain emotion object: utils expanded, `@media` keys mapped, tokens turned into css variables
// stitches treats a nested selector without `&` as a descendant: `svg` -> `& svg`, `:not(.x)` -> `& :not(.x)`
const nestKey = (key: string) =>
  key[0] === '@'
    ? key
    : key
        .split(',')
        .map(s => (s.includes('&') ? s.trim() : `& ${s.trim()}`))
        .join(', ')

function resolve(styles: CSS | undefined, out: CSS = {}, nest = true): CSS {
  for (const [key, value] of Object.entries(styles ?? {})) {
    if (value != null && typeof value === 'object') {
      const at = key[0] === '@' && media[key.slice(1)]
      out[at ? `@media ${at}` : nest ? nestKey(key) : key] = resolve(value)
    } else if (utils[key]) resolve(utils[key](value), out)
    else out[key] = typeof value === 'string' ? resolveTokens(value, themeMap[key]) : value
  }
  return out
}

const cssVars = (tokens: Record<string, Record<string, string | number>>): CSS => {
  const out: CSS = {}
  for (const [scale, values] of Object.entries(tokens)) {
    for (const [token, value] of Object.entries(values)) {
      out[`--${scale}-${token}`] =
        typeof value === 'string' ? resolveTokens(value, scale) : String(value)
    }
  }
  return out
}

injectGlobal({ ':root': cssVars(theme), '.dark': cssVars({ colors: darkColors }) })

// next-themes adds this class to <html>; the `.dark &` selectors in components rely on it
export const darkTheme = { className: 'dark' }

export const keyframes = (styles: CSS) => emotionKeyframes(resolve(styles, {}, false))

// call sites use the stitches form `css({...})()`
export const css = (styles: CSS) => {
  const className = emotionCss(resolve(styles))
  return () => className
}

// emotion skips global styles it has already inserted, so calling this per request is fine
export const globalStyles = () =>
  injectGlobal(
    resolve(
      {
        // body: { backgroundColor: '$background', color: '$text', fontFamily: 'Helvetica' },
        'html, body': {
          backgroundColor: '$mauve2',
          color: '$mauve12',
          fontFamily: '$body',
          fontSize: '$md',
          '-webkit-font-smoothing': 'antialiased',
          '-moz-osx-font-smoothing': 'grayscale'
        },
        a: {
          color: 'inherit',
          textDecoration: 'none'
        }
      },
      {},
      false
    )
  )

// ---------------------------------------------------------------- styled
type Variants = Record<string, Record<string, any>>
type VariantProps<V> = {
  [K in keyof V]?: [keyof V[K]] extends ['true' | 'false'] ? boolean : keyof V[K]
}
type StyleDef<V> = {
  variants?: V
  defaultVariants?: VariantProps<V>
  compoundVariants?: Array<VariantProps<V> & { css: CSS }>
  [key: string]: any
}
type OwnProps<V> = VariantProps<V> & { css?: CSS | null }

export type StyledComponent<T extends React.ElementType, V = {}> = {
  <C extends React.ElementType>(
    props: { as: C } & Omit<React.ComponentPropsWithoutRef<C>, keyof OwnProps<V> | 'as'> &
      OwnProps<V> &
      React.RefAttributes<React.ComponentRef<C>>
  ): React.ReactElement | null
  (
    props: Omit<React.ComponentPropsWithoutRef<T>, keyof OwnProps<V> | 'as'> &
      OwnProps<V> & { as?: React.ElementType } & React.RefAttributes<React.ComponentRef<T>>
  ): React.ReactElement | null
  displayName?: string
  toString(): string
}

interface Layer {
  base: CSS
  variants: Record<string, Record<string, CSS>>
  defaults: Record<string, any>
  compound: Array<{ css: CSS; [key: string]: any }>
}
interface Chain {
  root: React.ElementType
  markers: string[]
  layers: Layer[]
}

// stable per-styled() class used by `${Component}` selectors; derived from label + styles (no counter, so a
// module re-evaluated by Fast Refresh keeps the same marker, as stitches' hashed class did)
function makeMarker(label: string, styles: object) {
  let h = 5381
  for (const c of JSON.stringify(styles)) h = (h * 33) ^ c.charCodeAt(0)
  return `sc-${label}-${(h >>> 0).toString(36)}`
}

export function styled<T extends React.ElementType, V extends Variants = {}>(
  target: T,
  styles?: StyleDef<V>
): StyledComponent<T, V>
export function styled(target: any, styles: StyleDef<Variants> = {}): any {
  const { variants = {}, defaultVariants = {}, compoundVariants = [], ...base } = styles
  const parent: Chain | undefined = target?.__chain
  // function names are mangled differently on server and client; only use names that survive minification
  const label = typeof target === 'string' ? target : String(target?.displayName ?? 'c')
  const marker = makeMarker(label.replace(/[^\w-]/g, ''), styles)
  const chain: Chain = {
    root: parent?.root ?? target ?? 'span',
    markers: [...(parent?.markers ?? []), marker],
    layers: [
      ...(parent?.layers ?? []),
      {
        base: resolve(base),
        variants: Object.fromEntries(
          Object.entries(variants).map(([name, options]) => [
            name,
            Object.fromEntries(Object.entries(options).map(([k, v]) => [k, resolve(v)]))
          ])
        ),
        defaults: defaultVariants,
        compound: compoundVariants.map(c => ({ ...c, css: resolve(c.css) }))
      }
    ]
  }
  const defaults = Object.assign({}, ...chain.layers.map(l => l.defaults))
  const names = Array.from(new Set(chain.layers.flatMap(l => Object.keys(l.variants))))

  const Styled = React.forwardRef<unknown, any>(
    ({ as, css: cssProp, className, ...props }, ref) => {
      const value: Record<string, string> = {}
      for (const name of names) {
        const v = props[name] ?? defaults[name]
        if (v != null) value[name] = String(v)
        delete props[name]
      }
      // same layering as stitches: all bases, then all variants, then compound variants, then the css prop
      const parts = [
        ...chain.layers.map(l => l.base),
        ...chain.layers.flatMap(l =>
          Object.entries(l.variants).map(([name, options]) => options[value[name]])
        ),
        ...chain.layers
          .flatMap(l =>
            l.compound.filter(({ css: _, ...match }) =>
              Object.entries(match).every(([name, v]) => value[name] === String(v))
            )
          )
          .map(c => c.css),
        resolve(cssProp)
      ]
      // cx merges emotion classes passed via className (e.g. `className={css({...})()}`) after the component's own
      // styles, so they win like stitches' later-injected rules did; markers and plain class names pass through
      const cls = cx(...chain.markers, emotionCss(...parts.filter(Boolean)), className)
      return React.createElement(as ?? chain.root, { ...props, className: cls, ref })
    }
  )
  Styled.displayName = `Styled(${label})`
  return Object.assign(Styled, { __chain: chain, toString: () => `.${marker}` })
}
