import React from 'react'
import * as ContextMenuPrimitive from '@radix-ui/react-context-menu'
import { styled } from '../../stitches.config'
import {
  slideDownAndFade,
  slideLeftAndFade,
  slideRightAndFade,
  slideUpAndFade
} from '../../styles/keyframes'

const StyledContent = styled(ContextMenuPrimitive.Content, {
  minWidth: 140,
  backgroundColor: '$backgroundOverlay',
  borderRadius: 6,
  overflow: 'hidden',
  padding: '5px',
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
    boxShadow:
      '0px 10px 38px -10px rgba(22, 23, 24, 0.85), 0px 10px 20px -15px rgba(22, 23, 24, 0.6)'
  }
})

const itemStyles = {
  all: 'unset',
  fontSize: 13,
  lineHeight: 1,
  color: '$text',
  borderRadius: 3,
  display: 'flex',
  alignItems: 'center',
  height: 28,
  padding: '0 7px',
  position: 'relative',
  paddingLeft: 10,
  userSelect: 'none',

  '&[data-disabled]': {
    color: '$textMuted',
    pointerEvents: 'none'
  },

  '&:focus': {
    backgroundColor: '$purple9',
    color: '$white'
  }
}

const StyledItem = styled(ContextMenuPrimitive.Item, { ...itemStyles })
const StyledCheckboxItem = styled(ContextMenuPrimitive.CheckboxItem, {
  ...itemStyles
})
const StyledRadioItem = styled(ContextMenuPrimitive.RadioItem, {
  ...itemStyles
})
const StyledTriggerItem = styled(ContextMenuPrimitive.SubTrigger, {
  '&[data-state="open"]': {
    backgroundColor: '$purple9',
    color: '$purple9'
  },
  ...itemStyles
})

const StyledLabel = styled(ContextMenuPrimitive.Label, {
  paddingLeft: 10,
  fontSize: 12,
  lineHeight: '25px',
  color: '$text'
})

const StyledSeparator = styled(ContextMenuPrimitive.Separator, {
  height: 1,
  backgroundColor: '$backgroundAlt',
  margin: 5
})

const StyledItemIndicator = styled(ContextMenuPrimitive.ItemIndicator, {
  position: 'absolute',
  left: 0,
  width: 25,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center'
})

// Wrap Content with Portal for Radix UI v2
const ContentWithPortal: React.FC<React.ComponentProps<typeof StyledContent> & { children?: React.ReactNode }> = ({ children, ...props }) => (
  <ContextMenuPrimitive.Portal>
    <StyledContent {...props}>{children}</StyledContent>
  </ContextMenuPrimitive.Portal>
)

export const ContextMenuRoot = ContextMenuPrimitive.Root
export const ContextMenuTrigger = ContextMenuPrimitive.Trigger
export const ContextMenuContent = ContentWithPortal
export const ContextMenuItem = StyledItem
export const ContextMenuCheckboxItem = StyledCheckboxItem
export const ContextMenuRadioGroup = ContextMenuPrimitive.RadioGroup
export const ContextMenuRadioItem = StyledRadioItem
export const ContextMenuItemIndicator = StyledItemIndicator
export const ContextMenuTriggerItem = StyledTriggerItem
export const ContextMenuLabel = StyledLabel
export const ContextMenuSeparator = StyledSeparator
