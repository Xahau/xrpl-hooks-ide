import { recipe } from '@vanilla-extract/recipes'
import { vars } from '../styles/theme.css'

export const heading = recipe({
  base: {
    fontFamily: vars.font.heading,
    lineHeight: vars.lineHeight.heading,
    fontWeight: vars.fontWeight.heading,
  },
  variants: {
    uppercase: {
      true: {
        textTransform: 'uppercase',
      },
    },
  },
})
