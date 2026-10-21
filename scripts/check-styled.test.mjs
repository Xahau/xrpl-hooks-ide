// Run: node --experimental-strip-types scripts/check-styled.test.mjs
import assert from 'node:assert/strict'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { cache } from '@emotion/css'
import { styled, css } from '../stitches.config.ts'

const inserted = () =>
  Object.values(cache.inserted)
    .filter(v => typeof v === 'string')
    .join('\n')
const render = (C, props) => renderToStaticMarkup(React.createElement(C, props))
const cls = html => html.match(/class="([^"]*)"/)[1].split(' ')

// tokens, utils, media
const Probe = styled('div', {
  color: '$mauve12',
  border: '1px solid $colors$mauve6',
  px: '$3',
  '@hover': { '&:hover': { color: '$mauve1' } },
  variants: {
    small: { true: { fontSize: '$xs' } },
    tone: { a: { opacity: 0.5 }, b: { opacity: 0.25 } }
  }
})
const base = cls(render(Probe, { className: 'user' }))
let all = inserted()
assert.match(all, /color:var\(--hb-colors-mauve12\)/)
assert.match(all, /border:1px solid var\(--hb-colors-mauve6\)/)
assert.match(all, /padding-left:var\(--hb-space-3\)/)
assert.match(all, /padding-right:var\(--hb-space-3\)/)
assert.match(all, /@media \(any-hover: hover\)/)
assert.match(all, /--hb-colors-gray1:/)
assert.match(all, /\.dark\{[^}]*--hb-colors-backgroundOverlay:var\(--hb-colors-mauve5\)/)

// marker + user className
assert.ok(base.includes(String(Probe).slice(1)), 'marker present')
assert.equal(base.at(-1), 'user')

// boolean + string variants
const off = cls(render(Probe, {}))
const on = cls(render(Probe, { small: true }))
assert.notEqual(off[1], on[1], 'small=true changes the class')
const rule = c => inserted().match(new RegExp(`\\.${c}\\{[^}]*\\}`))?.[0] ?? ''
assert.ok(rule(off[1]) && !/font-size/.test(rule(off[1])))
assert.match(rule(on[1]), /font-size:var\(--hb-fontSizes-xs\)/)
assert.match(rule(cls(render(Probe, { tone: 'b' }))[1]), /opacity:0\.25/)
assert.ok(!render(Probe, { small: true }).includes('small='), 'variant props are not forwarded')

// markers: stable for identical definitions (Fast Refresh), distinct for different styles; child inherits parent's
assert.equal(String(styled('span', {})), String(styled('span', {})))
assert.notEqual(String(styled('span', { color: 'red' })), String(styled('span', { color: 'blue' })))
const Child = styled(Probe, { color: 'red' })
const childCls = cls(render(Child, { small: true, as: 'section' }))
assert.ok(childCls.includes(String(Probe).slice(1)) && childCls.includes(String(Child).slice(1)))
assert.match(rule(childCls[2]), /font-size:var\(--hb-fontSizes-xs\)/)
assert.ok(render(Child, { as: 'section' }).startsWith('<section'))

// css() returns a class name, and a registered class passed as className wins over the component's own styles
assert.match(css({ color: '$mauve10' })(), /^css-/)
const merged = cls(render(Probe, { className: css({ color: 'blue' })() }))
assert.ok(
  merged.some(c => /^sc-/.test(c)) && merged.length === 2,
  'marker + one merged emotion class'
)
assert.match(rule(merged[1]), /color:var\(--hb-colors-mauve12\);[^}]*color:blue;\}/)
// nested selectors without `&` are descendants, as in stitches
render(
  styled('div', { svg: { ':not(.angle)': { stroke: '$text' }, '.angle, &.x': { fill: 'red' } } }),
  {}
)
assert.match(inserted(), /svg :not\(\.angle\)\{stroke:var\(--hb-colors-text\);\}/)
assert.match(inserted(), /svg \.angle,[^{]*svg\.x\{fill:red;\}/)
console.log('check-styled: ok')
