import { style } from '@vanilla-extract/css'
import { vars } from '../styles/theme.css'

export const container = style({
  width: '100%',
  marginLeft: 'auto',
  marginRight: 'auto',
  paddingLeft: vars.space[4],
  paddingRight: vars.space[4],
  maxWidth: '100%',
})
