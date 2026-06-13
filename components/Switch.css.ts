import { style } from '@vanilla-extract/css'
import { vars } from '../styles/theme.css'

export const switchRoot = style({
  all: 'unset',
  width: 42,
  height: 25,
  backgroundColor: vars.color.mauve9,
  borderRadius: '9999px',
  position: 'relative',
  boxShadow: `0 2px 10px ${vars.color.mauve2}`,
  WebkitTapHighlightColor: 'rgba(0, 0, 0, 0)',
  selectors: {
    '&:focus': {
      boxShadow: `0 0 0 2px ${vars.color.mauveA2}`,
    },
    '&[data-state="checked"]': {
      backgroundColor: vars.color.green11,
    },
  },
})

export const switchThumb = style({
  display: 'block',
  width: 21,
  height: 21,
  backgroundColor: 'white',
  borderRadius: '9999px',
  boxShadow: `0 2px 2px ${vars.color.mauveA6}`,
  transition: 'transform 100ms',
  transform: 'translateX(2px)',
  willChange: 'transform',
  selectors: {
    '&[data-state="checked"]': {
      transform: 'translateX(19px)',
    },
  },
})
