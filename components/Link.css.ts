import { recipe } from '@vanilla-extract/recipes'
import { vars } from '../styles/theme.css'

export const link = recipe({
  base: {
    color: 'currentColor',
    textDecoration: 'underline',
    cursor: 'pointer',
  },
  variants: {
    highlighted: {
      true: {
        color: vars.color.blue9,
      },
    },
  },
})
