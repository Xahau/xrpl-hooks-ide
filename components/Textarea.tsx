import { styled } from '../stitches.config'

export const Textarea = styled('textarea', {
  // Reset
  appearance: 'none',
  borderWidth: '0',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
  outline: 'none',
  width: '100%',
  flex: '1',
  backgroundColor: '$mauve4',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '$sm',
  p: '$2',
  fontSize: '$md',
  lineHeight: 1,
  color: '$mauve12',
  boxShadow: `0 0 0 1px $colors$mauve8`,
  WebkitTapHighlightColor: 'rgba(0,0,0,0)',
  '&::before': {
    boxSizing: 'border-box'
  },
  '&::after': {
    boxSizing: 'border-box'
  },
  fontVariantNumeric: 'tabular-nums',

  '&:-webkit-autofill': {
    boxShadow: 'inset 0 0 0 1px $colors$blue6, inset 0 0 0 100px $colors$blue3'
  },

  '&:-webkit-autofill::first-line': {
    fontFamily: '$untitled',
    color: '$mauve12'
  },

  '&:focus': {
    boxShadow: `0 0 0 1px $colors$mauve10`,
    '&:-webkit-autofill': {
      boxShadow: `0 0 0 1px $colors$mauve10`
    }
  },
  '&::placeholder': {
    color: '$mauve9'
  },
  '&:disabled': {
    pointerEvents: 'none',
    backgroundColor: '$mauve2',
    color: '$mauve8',
    cursor: 'not-allowed',
    '&::placeholder': {
      color: '$mauve7'
    }
  },

  variants: {
    variant: {
      ghost: {
        boxShadow: 'none',
        backgroundColor: 'transparent',
        '@hover': {
          '&:hover': {
            boxShadow: 'inset 0 0 0 1px $colors$mauve7'
          }
        },
        '&:focus': {
          backgroundColor: '$loContrast',
          boxShadow: `0 0 0 1px $colors$mauve10`
        },
        '&:disabled': {
          backgroundColor: 'transparent'
        },
        '&:read-only': {
          backgroundColor: 'transparent'
        }
      },
      deep: {
        backgroundColor: '$deep',
        boxShadow: 'none'
      }
    },
    state: {
      invalid: {
        boxShadow: 'inset 0 0 0 1px $colors$crimson7',
        '&:focus': {
          boxShadow: 'inset 0px 0px 0px 1px $colors$crimson8, 0px 0px 0px 1px $colors$crimson8'
        }
      },
      valid: {
        boxShadow: 'inset 0 0 0 1px $colors$grass7',
        '&:focus': {
          boxShadow: 'inset 0px 0px 0px 1px $colors$grass8, 0px 0px 0px 1px $colors$grass8'
        }
      }
    },
    cursor: {
      default: {
        cursor: 'default',
        '&:focus': {
          cursor: 'text'
        }
      },
      text: {
        cursor: 'text'
      }
    }
  }
})

export default Textarea
