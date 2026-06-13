import { recipe } from '@vanilla-extract/recipes'
import { vars } from '../styles/theme.css'

export const text = recipe({
  base: {
    fontFamily: vars.font.body,
    lineHeight: vars.lineHeight.body,
    color: vars.color.text,
  },
  variants: {
    small: {
      true: {
        fontSize: vars.fontSize.xs,
      },
    },
    muted: {
      true: {
        color: vars.color.mauve9,
      },
    },
    error: {
      true: {
        color: vars.color.error,
      },
    },
    warning: {
      true: {
        color: vars.color.warning,
      },
    },
    monospace: {
      true: {
        fontFamily: vars.font.monospace,
      },
    },
    block: {
      true: {
        display: 'block',
      },
    },
  },
})
