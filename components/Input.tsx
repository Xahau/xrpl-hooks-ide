import React from 'react'
import { styled } from '../stitches.config'
import * as LabelPrim from '@radix-ui/react-label'

export const Input = styled('input', {
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
  px: '$2',
  fontSize: '$md',
  lineHeight: 1,
  color: '$mauve12',
  boxShadow: `0 0 0 1px $colors$mauve8`,
  height: 35,
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
  '&:read-only': {
    backgroundColor: '$mauve2',
    color: '$text',
    opacity: 0.8,
    '&:focus': {
      boxShadow: 'inset 0px 0px 0px 1px $colors$mauve7'
    }
  },

  variants: {
    size: {
      sm: {
        height: '$5',
        fontSize: '$1',
        lineHeight: '$sizes$4',
        '&:-webkit-autofill::first-line': {
          fontSize: '$1'
        }
      },
      md: {
        height: '$8',
        fontSize: '$1',
        lineHeight: '$sizes$5',
        '&:-webkit-autofill::first-line': {
          fontSize: '$1'
        }
      },
      lg: {
        height: '$12',
        fontSize: '$2',
        lineHeight: '$sizes$6',
        '&:-webkit-autofill::first-line': {
          fontSize: '$3'
        }
      }
    },
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
  },
  defaultVariants: {
    size: 'md'
  }
})

// eslint-disable-next-line react/display-name
const ReffedInput = React.forwardRef<HTMLInputElement, React.ComponentProps<typeof Input>>(
  (props, ref) => <Input {...props} ref={ref} />
)

export default ReffedInput

const LabelRoot = (props: LabelPrim.LabelProps) => <LabelPrim.Root {...props} />

export const Label = styled(LabelRoot, {
  display: 'inline-block',
  mb: '$1'
})
