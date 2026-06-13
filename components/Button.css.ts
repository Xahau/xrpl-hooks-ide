import { recipe } from '@vanilla-extract/recipes'
import { style } from '@vanilla-extract/css'
import { vars } from '../styles/theme.css'

export const button = recipe({
  base: {
    // Reset
    all: 'unset',
    position: 'relative',
    appearance: 'none',
    fontFamily: vars.font.body,
    alignItems: 'center',
    boxSizing: 'border-box',
    userSelect: 'none',
    selectors: {
      '&::before': {
        boxSizing: 'border-box',
      },
      '&::after': {
        boxSizing: 'border-box',
      },
    },
    // Custom reset
    display: 'inline-flex',
    flexShrink: 0,
    justifyContent: 'center',
    lineHeight: '1',
    gap: '5px',
    WebkitTapHighlightColor: 'rgba(0,0,0,0)',
    // Custom
    height: vars.space[6],
    paddingLeft: vars.space[2],
    paddingRight: vars.space[2],
    fontSize: vars.fontSize.sm,
    fontWeight: 500,
    fontVariantNumeric: 'tabular-nums',
    cursor: 'pointer',
    width: 'max-content',
    ':disabled': {
      opacity: 0.6,
      pointerEvents: 'none',
      cursor: 'not-allowed',
    },
  },
  variants: {
    size: {
      xs: {
        borderRadius: vars.radius.sm,
        height: vars.space[5],
        paddingLeft: vars.space[2],
        paddingRight: vars.space[2],
        fontSize: vars.fontSize.xs,
      },
      sm: {
        borderRadius: vars.radius.sm,
        height: vars.space[7],
        paddingLeft: vars.space[3],
        paddingRight: vars.space[3],
        fontSize: vars.fontSize.xs,
      },
      md: {
        borderRadius: vars.radius.sm,
        height: vars.space[8],
        paddingLeft: vars.space[3],
        paddingRight: vars.space[3],
        fontSize: vars.fontSize.xs,
      },
      lg: {
        borderRadius: vars.radius.sm,
        height: vars.space[10],
        paddingLeft: vars.space[4],
        paddingRight: vars.space[4],
        fontSize: vars.fontSize.xs,
      },
    },
    variant: {
      link: {
        textDecoration: 'underline',
        fontSize: 'inherit',
        color: vars.color.textMuted,
        textUnderlineOffset: '2px',
      },
      default: {
        backgroundColor: vars.color.mauve12,
        boxShadow: `inset 0 0 0 1px ${vars.color.mauve12}`,
        color: vars.color.mauve1,
        ':hover': {
          backgroundColor: vars.color.mauve12,
          boxShadow: `inset 0 0 0 1px ${vars.color.mauve12}`,
        },
        ':active': {
          backgroundColor: vars.color.mauve10,
          boxShadow: `inset 0 0 0 1px ${vars.color.mauve11}`,
        },
        ':focus': {
          boxShadow: `inset 0 0 0 1px ${vars.color.mauve12}, inset 0 0 0 2px ${vars.color.mauve12}`,
        },
        selectors: {
          '&[data-radix-popover-trigger][data-state="open"], &[data-radix-dropdown-menu-trigger][data-state="open"]': {
            backgroundColor: vars.color.mauve4,
            boxShadow: `inset 0 0 0 1px ${vars.color.mauve8}`,
          },
        },
      },
      primary: {
        backgroundColor: vars.color.accent,
        boxShadow: `inset 0 0 0 1px ${vars.color.purple9}`,
        color: vars.color.white,
        ':hover': {
          backgroundColor: vars.color.purple10,
          boxShadow: `inset 0 0 0 1px ${vars.color.purple11}`,
        },
        ':active': {
          backgroundColor: vars.color.purple8,
          boxShadow: `inset 0 0 0 1px ${vars.color.purple8}`,
        },
        ':focus': {
          boxShadow: `inset 0 0 0 2px ${vars.color.purple12}`,
        },
        selectors: {
          '&[data-radix-popover-trigger][data-state="open"], &[data-radix-dropdown-menu-trigger][data-state="open"]': {
            backgroundColor: vars.color.mauve4,
            boxShadow: `inset 0 0 0 1px ${vars.color.purple8}`,
          },
        },
      },
      secondary: {
        backgroundColor: vars.color.purple9,
        boxShadow: `inset 0 0 0 1px ${vars.color.purple9}`,
        color: vars.color.white,
        ':hover': {
          backgroundColor: vars.color.purple10,
          boxShadow: `inset 0 0 0 1px ${vars.color.purple11}`,
        },
        ':active': {
          backgroundColor: vars.color.purple8,
          boxShadow: `inset 0 0 0 1px ${vars.color.purple8}`,
        },
        ':focus': {
          boxShadow: `inset 0 0 0 2px ${vars.color.purple12}`,
        },
        selectors: {
          '&[data-radix-popover-trigger][data-state="open"], &[data-radix-dropdown-menu-trigger][data-state="open"]': {
            backgroundColor: vars.color.mauve4,
            boxShadow: `inset 0 0 0 1px ${vars.color.purple8}`,
          },
        },
      },
      destroy: {
        backgroundColor: vars.color.red9,
        boxShadow: `inset 0 0 0 1px ${vars.color.red9}`,
        color: vars.color.white,
        ':hover': {
          backgroundColor: vars.color.red10,
          boxShadow: `inset 0 0 0 1px ${vars.color.red11}`,
        },
        ':active': {
          backgroundColor: vars.color.red8,
          boxShadow: `inset 0 0 0 1px ${vars.color.red8}`,
        },
        ':focus': {
          boxShadow: `inset 0 0 0 2px ${vars.color.red12}`,
        },
        selectors: {
          '&[data-radix-popover-trigger][data-state="open"], &[data-radix-dropdown-menu-trigger][data-state="open"]': {
            backgroundColor: vars.color.mauve4,
            boxShadow: `inset 0 0 0 1px ${vars.color.red8}`,
          },
        },
      },
    },
    muted: {
      true: {
        color: vars.color.textMuted,
      },
    },
    isDisabled: {
      true: {
        opacity: 0.6,
        cursor: 'auto',
        ':hover': {
          boxShadow: 'inherit',
        },
      },
    },
    outline: {
      true: {
        backgroundColor: 'transparent',
      },
    },
    uppercase: {
      true: {
        textTransform: 'uppercase',
      },
    },
    fullWidth: {
      true: {
        width: '100%',
      },
    },
    ghost: {
      true: {
        boxShadow: 'none',
        background: 'transparent',
        color: vars.color.mauve12,
        ':hover': {
          backgroundColor: vars.color.mauve6,
          boxShadow: 'none',
        },
        ':active': {
          backgroundColor: vars.color.mauve8,
          boxShadow: 'none',
        },
        ':focus': {
          boxShadow: 'none',
        },
      },
    },
    isLoading: {
      true: {
        pointerEvents: 'none',
      },
    },
  },
  compoundVariants: [
    {
      variants: { outline: true, variant: 'default' },
      style: {
        background: 'transparent',
        color: vars.color.mauve12,
        boxShadow: `inset 0 0 0 1px ${vars.color.mauve10}`,
        ':hover': {
          color: vars.color.mauve12,
          background: vars.color.mauve5,
        },
      },
    },
    {
      variants: { outline: true, variant: 'primary' },
      style: {
        background: 'transparent',
        color: vars.color.mauve12,
        ':hover': {
          color: vars.color.mauve12,
          background: vars.color.mauve5,
        },
      },
    },
    {
      variants: { outline: true, variant: 'secondary' },
      style: {
        background: 'transparent',
        color: vars.color.mauve12,
        ':hover': {
          color: vars.color.mauve12,
          background: vars.color.mauve5,
        },
      },
    },
  ],
  defaultVariants: {
    size: 'md',
    variant: 'default',
  },
})

export const buttonContent = style({
  display: 'flex',
  gap: vars.space[2],
  alignItems: 'center',
  selectors: {
    [`${button.classNames.variants.isLoading.true} &`]: {
      visibility: 'hidden',
    },
  },
})

export const buttonSpinner = style({
  position: 'absolute',
})
