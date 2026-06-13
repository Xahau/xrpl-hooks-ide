import React, { ReactNode } from 'react'
import * as PopoverPrimitive from '@radix-ui/react-popover'
import { styled, keyframes } from '../stitches.config'

const slideUpAndFade = keyframes({
  '0%': { opacity: 0, transform: 'translateY(2px)' },
  '100%': { opacity: 1, transform: 'translateY(0)' }
})

const slideRightAndFade = keyframes({
  '0%': { opacity: 0, transform: 'translateX(-2px)' },
  '100%': { opacity: 1, transform: 'translateX(0)' }
})

const slideDownAndFade = keyframes({
  '0%': { opacity: 0, transform: 'translateY(-2px)' },
  '100%': { opacity: 1, transform: 'translateY(0)' }
})

const slideLeftAndFade = keyframes({
  '0%': { opacity: 0, transform: 'translateX(2px)' },
  '100%': { opacity: 1, transform: 'translateX(0)' }
})
const StyledContent = styled(PopoverPrimitive.Content, {
  borderRadius: 4,
  padding: '$3 $3',
  fontSize: 12,
  lineHeight: 1,
  color: '$text',
  backgroundColor: '$background',
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
    boxShadow: '0px 5px 38px -2px rgba(22, 23, 24, 1), 0px 10px 20px 0px rgba(22, 23, 24, 1)'
  }
})

const StyledArrow = styled(PopoverPrimitive.Arrow, {
  fill: '$colors$mauve2',
  '.dark &': {
    fill: '$mauve5'
  }
})

const StyledClose = styled(PopoverPrimitive.Close, {
  all: 'unset',
  fontFamily: 'inherit',
  borderRadius: '100%',
  height: 25,
  width: 25,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '$text',
  position: 'absolute',
  top: 5,
  right: 5
})

// Exports
export const PopoverRoot = PopoverPrimitive.Root
export const PopoverTrigger = PopoverPrimitive.Trigger
export const PopoverContent = StyledContent
export const PopoverArrow = StyledArrow
export const PopoverClose = StyledClose

interface IPopover {
  content: string | React.ReactElement
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  children?: ReactNode
}

const Popover: React.FC<IPopover & React.ComponentProps<typeof PopoverContent>> = ({
  children,
  content,
  open,
  defaultOpen = false,
  onOpenChange,
  ...rest
}) => (
  <PopoverRoot open={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange}>
    <PopoverTrigger asChild>{children}</PopoverTrigger>
    <PopoverPrimitive.Portal>
      <PopoverContent sideOffset={5} {...rest}>
        {content} <PopoverArrow offset={5} className="arrow" />
      </PopoverContent>
    </PopoverPrimitive.Portal>
  </PopoverRoot>
)

export default Popover
