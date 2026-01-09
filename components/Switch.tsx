import React from 'react'
import { styled } from '../stitches.config'
import * as SwitchPrimitive from '@radix-ui/react-switch'
import * as styles from './Switch.css'

const SwitchRootBase = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitive.Root
    {...props}
    ref={ref}
    className={`${styles.switchRoot} ${className || ''}`}
  />
))

SwitchRootBase.displayName = 'SwitchRootBase'

const SwitchThumbBase = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitive.Thumb>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Thumb>
>(({ className, ...props }, ref) => (
  <SwitchPrimitive.Thumb
    {...props}
    ref={ref}
    className={`${styles.switchThumb} ${className || ''}`}
  />
))

SwitchThumbBase.displayName = 'SwitchThumbBase'

// Wrap with Stitches styled() for backward compatibility with css prop
export const Switch = styled(SwitchRootBase, {})
export const SwitchThumb = styled(SwitchThumbBase, {})
