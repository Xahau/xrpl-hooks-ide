import { globalStyle } from '@vanilla-extract/css'
import { vars } from './theme.css'

globalStyle('html, body', {
  backgroundColor: vars.color.backgroundOverlay,
  color: vars.color.text,
  fontFamily: vars.font.body,
  fontSize: vars.fontSize.md,
  WebkitFontSmoothing: 'antialiased',
  MozOsxFontSmoothing: 'grayscale',
})

globalStyle('a', {
  color: 'inherit',
  textDecoration: 'none',
})

globalStyle('*', {
  boxSizing: 'border-box',
})
