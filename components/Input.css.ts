import { recipe } from '@vanilla-extract/recipes'
import { style } from '@vanilla-extract/css'
import { vars } from '../styles/theme.css'

export const input = recipe({
  base: {
    // Reset
    appearance: 'none',
    borderWidth: '0',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
    outline: 'none',
    width: '100%',
    flex: '1',
    backgroundColor: vars.color.mauve4,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: vars.radius.sm,
    paddingLeft: vars.space[2],
    paddingRight: vars.space[2],
    fontSize: vars.fontSize.md,
    lineHeight: 1,
    color: vars.color.mauve12,
    boxShadow: `0 0 0 1px ${vars.color.mauve8}`,
    height: 35,
    WebkitTapHighlightColor: 'rgba(0,0,0,0)',
    fontVariantNumeric: 'tabular-nums',
    selectors: {
      '&::before': {
        boxSizing: 'border-box',
      },
      '&::after': {
        boxSizing: 'border-box',
      },
      '&:-webkit-autofill': {
        boxShadow: `inset 0 0 0 1px ${vars.color.blue6}, inset 0 0 0 100px ${vars.color.blue3}`,
      },
      '&:-webkit-autofill::first-line': {
        fontFamily: vars.font.body,
        color: vars.color.mauve12,
      },
      '&::placeholder': {
        color: vars.color.mauve9,
      },
    },
    ':focus': {
      boxShadow: `0 0 0 1px ${vars.color.mauve10}`,
    },
    ':disabled': {
      pointerEvents: 'none',
      backgroundColor: vars.color.mauve2,
      color: vars.color.mauve8,
      cursor: 'not-allowed',
    },
  },
  variants: {
    size: {
      sm: {
        height: vars.space[5],
        fontSize: vars.fontSize.xs,
        lineHeight: vars.space[4],
        selectors: {
          '&:-webkit-autofill::first-line': {
            fontSize: vars.fontSize.xs,
          },
        },
      },
      md: {
        height: vars.space[8],
        fontSize: vars.fontSize.sm,
        lineHeight: vars.space[5],
        selectors: {
          '&:-webkit-autofill::first-line': {
            fontSize: vars.fontSize.sm,
          },
        },
      },
      lg: {
        height: vars.space[12],
        fontSize: vars.fontSize.sm,
        lineHeight: vars.space[6],
        selectors: {
          '&:-webkit-autofill::first-line': {
            fontSize: vars.fontSize.md,
          },
        },
      },
    },
    variant: {
      ghost: {
        boxShadow: 'none',
        backgroundColor: 'transparent',
        ':hover': {
          boxShadow: `inset 0 0 0 1px ${vars.color.mauve7}`,
        },
        ':focus': {
          backgroundColor: vars.color.background,
          boxShadow: `0 0 0 1px ${vars.color.mauve10}`,
        },
        ':disabled': {
          backgroundColor: 'transparent',
        },
      },
      deep: {
        backgroundColor: vars.color.deep,
        boxShadow: 'none',
      },
    },
    state: {
      invalid: {
        boxShadow: `inset 0 0 0 1px ${vars.color.crimson7}`,
        ':focus': {
          boxShadow: `inset 0px 0px 0px 1px ${vars.color.crimson8}, 0px 0px 0px 1px ${vars.color.crimson8}`,
        },
      },
      valid: {
        boxShadow: `inset 0 0 0 1px ${vars.color.grass7}`,
        ':focus': {
          boxShadow: `inset 0px 0px 0px 1px ${vars.color.grass8}, 0px 0px 0px 1px ${vars.color.grass8}`,
        },
      },
    },
    cursor: {
      default: {
        cursor: 'default',
        ':focus': {
          cursor: 'text',
        },
      },
      text: {
        cursor: 'text',
      },
    },
  },
  defaultVariants: {
    size: 'md',
  },
})

export const label = style({
  display: 'inline-block',
  marginBottom: vars.space['1'],
})
