import { style } from '@vanilla-extract/css'
import { vars } from '../styles/theme.css'

export const stack = style({
  display: 'flex',
  flexWrap: 'wrap',
  flexDirection: 'row',
  gap: vars.space[4],
})
