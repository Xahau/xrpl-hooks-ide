import { style, globalStyle } from '@vanilla-extract/css'
import { vars } from '../styles/theme.css'

export const buttonGroup = style({
  display: 'flex',
  marginLeft: '1px',
})

// Button styles within ButtonGroup
globalStyle(`${buttonGroup} button`, {
  marginLeft: '0px',
  paddingLeft: vars.space[4],
  paddingRight: vars.space[4],
  zIndex: 2,
  position: 'relative',
})

globalStyle(`${buttonGroup} button:hover, ${buttonGroup} button:focus`, {
  zIndex: 200,
})

// Direct button children - apply negative margin to overlap borders
globalStyle(`${buttonGroup} > button:not(:first-child)`, {
  marginLeft: '-1px',
})

// Direct button children
globalStyle(`${buttonGroup} > button:not(:only-child):not(:first-child):not(:last-child)`, {
  borderRadius: 0,
})

globalStyle(`${buttonGroup} > button:first-child:not(:only-child)`, {
  borderBottomRightRadius: 0,
  borderTopRightRadius: 0,
})

globalStyle(`${buttonGroup} > button:last-child:not(:only-child)`, {
  borderBottomLeftRadius: 0,
  borderTopLeftRadius: 0,
})

// Target buttons within wrapper elements (like Link components)
globalStyle(`${buttonGroup} > *:not(:only-child):not(:first-child):not(:last-child) button`, {
  borderRadius: 0,
})

globalStyle(`${buttonGroup} > *:first-child:not(:only-child) button`, {
  borderBottomRightRadius: 0,
  borderTopRightRadius: 0,
})

globalStyle(`${buttonGroup} > *:last-child:not(:only-child) button`, {
  borderBottomLeftRadius: 0,
  borderTopLeftRadius: 0,
})

// Link (a) styles within ButtonGroup - for direct a tag children
globalStyle(`${buttonGroup} > a`, {
  marginLeft: '-1px',
  zIndex: 2,
  position: 'relative',
})

globalStyle(`${buttonGroup} > a:hover, ${buttonGroup} > a:focus`, {
  zIndex: 200,
})

// Direct a tag children (when a is the button itself)
globalStyle(`${buttonGroup} > a:not(:only-child):not(:first-child):not(:last-child)`, {
  borderRadius: 0,
})

globalStyle(`${buttonGroup} > a:first-child:not(:only-child)`, {
  borderBottomRightRadius: 0,
  borderTopRightRadius: 0,
})

globalStyle(`${buttonGroup} > a:last-child:not(:only-child)`, {
  borderBottomLeftRadius: 0,
  borderTopLeftRadius: 0,
})

// a tags wrapping buttons
globalStyle(`${buttonGroup} > a:not(:only-child):not(:first-child):not(:last-child) button`, {
  borderRadius: 0,
})

globalStyle(`${buttonGroup} > a:first-child:not(:only-child) button`, {
  borderBottomRightRadius: 0,
  borderTopRightRadius: 0,
})

globalStyle(`${buttonGroup} > a:last-child:not(:only-child) button`, {
  borderBottomLeftRadius: 0,
  borderTopLeftRadius: 0,
})
