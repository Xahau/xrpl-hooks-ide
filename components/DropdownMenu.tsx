import React from 'react'
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu'

import { styled } from '../stitches.config'
import {
  slideDownAndFade,
  slideLeftAndFade,
  slideRightAndFade,
  slideUpAndFade
} from '../styles/keyframes'

const StyledContent = styled(DropdownMenuPrimitive.Content, {
  minWidth: 220,
  backgroundColor: '$mauve2',
  borderRadius: 6,
  padding: 5,
  boxShadow:
    '0px 10px 38px -10px rgba(22, 23, 24, 0.35), 0px 10px 20px -15px rgba(22, 23, 24, 0.2)',
  '@media (prefers-reduced-motion: no-preference)': {
    animationDuration: '400ms',
    animationTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
    willChange: 'transform, opacity',
    '&[data-state="open"]': {
      '&[data-side="top"]': { animationName: slideDownAndFade },
      '&[data-side="right"]': { animationName: slideLeftAndFade },
      '&[data-side="bottom"]': { animationName: slideUpAndFade },
      '&[data-side="left"]': { animationName: slideRightAndFade }
    }
  },
  '.dark &': {
    backgroundColor: '$mauve5',
    boxShadow:
      '0px 10px 38px -10px rgba(22, 23, 24, 0.85), 0px 10px 20px -15px rgba(22, 23, 24, 0.6)'
  }
})

const itemStyles = {
  all: 'unset',
  fontSize: 13,
  lineHeight: 1,
  color: '$mauve12',
  borderRadius: 3,
  display: 'flex',
  alignItems: 'center',
  height: 32,
  padding: '0 5px',
  position: 'relative',
  paddingLeft: '5px',
  userSelect: 'none',
  py: '$0.5',
  pr: '$2',
  gap: '$2',

  '&[data-disabled]': {
    color: '$mauve9',
    pointerEvents: 'none'
  },

  '&:focus': {
    backgroundColor: '$purple9',
    color: '$white'
  }
}

const StyledItem = styled(DropdownMenuPrimitive.Item, { ...itemStyles })
const StyledCheckboxItem = styled(DropdownMenuPrimitive.CheckboxItem, {
  ...itemStyles
})
const StyledRadioItem = styled(DropdownMenuPrimitive.RadioItem, {
  ...itemStyles
})
const StyledTriggerItem = styled(DropdownMenuPrimitive.SubTrigger, {
  '&[data-state="open"]': {
    backgroundColor: '$purple9',
    color: '$purple9'
  },
  ...itemStyles
})

const StyledLabel = styled(DropdownMenuPrimitive.Label, {
  paddingLeft: 25,
  fontSize: 12,
  lineHeight: '25px',
  color: '$mauve11'
})

const StyledSeparator = styled(DropdownMenuPrimitive.Separator, {
  height: 1,
  backgroundColor: '$mauve7',
  margin: 5
})

const StyledItemIndicator = styled(DropdownMenuPrimitive.ItemIndicator, {
  position: 'absolute',
  left: 0,
  width: 25,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center'
})

const StyledArrow = styled(DropdownMenuPrimitive.Arrow, {
  fill: '$mauve2',
  '.dark &': {
    fill: '$mauve5'
  }
})

// Wrap Content with Portal for Radix UI v2
const ContentWithPortal: React.FC<React.ComponentProps<typeof StyledContent> & { children?: React.ReactNode }> = ({ children, ...props }) => (
  <DropdownMenuPrimitive.Portal>
    <StyledContent {...props}>{children}</StyledContent>
  </DropdownMenuPrimitive.Portal>
)

// Exports
export const DropdownMenu = DropdownMenuPrimitive.Root
export const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger
export const DropdownMenuContent = ContentWithPortal
export const DropdownMenuItem = StyledItem
export const DropdownMenuCheckboxItem = StyledCheckboxItem
export const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup
export const DropdownMenuRadioItem = StyledRadioItem
export const DropdownMenuItemIndicator = StyledItemIndicator
export const DropdownMenuTriggerItem = StyledTriggerItem
export const DropdownMenuLabel = StyledLabel
export const DropdownMenuSeparator = StyledSeparator
export const DropdownMenuArrow = StyledArrow
