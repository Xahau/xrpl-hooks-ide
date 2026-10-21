import React from 'react'
import { Popover as ThemesPopover } from '@radix-ui/themes'
import { styled } from '../stitches.config'

export const PopoverRoot = ThemesPopover.Root
export const PopoverTrigger = ThemesPopover.Trigger
export const PopoverContent = styled(ThemesPopover.Content, {})
export const PopoverClose = ThemesPopover.Close

const Popover = ({
  children,
  content,
  open,
  defaultOpen = false,
  onOpenChange,
  ...rest
}: { content: React.ReactNode } & React.ComponentProps<typeof PopoverContent> &
  Pick<React.ComponentProps<typeof PopoverRoot>, 'open' | 'defaultOpen' | 'onOpenChange'>) => (
  <PopoverRoot open={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange}>
    <PopoverTrigger>{children}</PopoverTrigger>
    <PopoverContent sideOffset={5} {...rest}>
      {content}
    </PopoverContent>
  </PopoverRoot>
)

export default Popover
