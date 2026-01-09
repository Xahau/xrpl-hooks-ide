import { recipe } from '@vanilla-extract/recipes'
import { vars } from '../styles/theme.css'

export const textarea = recipe({
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
    padding: vars.space[2],
    fontSize: vars.fontSize.md,
    lineHeight: 1,
    color: vars.color.mauve12,
    boxShadow: `0 0 0 1px ${vars.color.mauve8}`,
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
})
