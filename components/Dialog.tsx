import React from 'react'
import { cx } from '@emotion/css'
import { Dialog as ThemesDialog } from '@radix-ui/themes'
import { css, styled, type CSS } from '../stitches.config'

// Themes' Trigger and Close always render their child (no `asChild` prop needed)
export const Dialog = ThemesDialog.Root
export const DialogTrigger = ThemesDialog.Trigger
export const DialogClose = ThemesDialog.Close
export const DialogContent = styled(ThemesDialog.Content, { maxWidth: '450px' })
export const DialogTitle = styled(ThemesDialog.Title, {})

// not `styled()`: its `as` would replace the Description element, while Themes' `Text` takes `as` itself
export const DialogDescription = React.forwardRef<
  HTMLParagraphElement,
  React.ComponentProps<typeof ThemesDialog.Description> & { css?: CSS; as?: 'p' | 'div' | 'span' }
>(({ css: cssProp, className, ...rest }, ref) => (
  <ThemesDialog.Description {...rest} ref={ref} className={cx(cssProp && css(cssProp)(), className)} />
))
DialogDescription.displayName = 'DialogDescription'
