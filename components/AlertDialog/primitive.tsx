import React from 'react'
import { blackA } from '@radix-ui/colors'
import * as AlertDialogPrimitive from '@radix-ui/react-alert-dialog'
import { styled, keyframes } from '../../stitches.config'

const overlayShow = keyframes({
  '0%': { opacity: 0 },
  '100%': { opacity: 1 }
})

const contentShow = keyframes({
  '0%': { opacity: 0, transform: 'translate(-50%, -48%) scale(.96)' },
  '100%': { opacity: 1, transform: 'translate(-50%, -50%) scale(1)' }
})

const StyledOverlay = styled(AlertDialogPrimitive.Overlay, {
  zIndex: 1000,
  backgroundColor: blackA.blackA9,
  position: 'fixed',
  inset: 0,
  '@media (prefers-reduced-motion: no-preference)': {
    animation: `${overlayShow} 150ms cubic-bezier(0.16, 1, 0.3, 1)`
  },
  '.dark &': {
    backgroundColor: blackA.blackA11
  }
})

const Root: React.FC<AlertDialogPrimitive.AlertDialogProps> = ({ children, ...rest }) => {
  return (
    <AlertDialogPrimitive.Root {...rest}>
      <AlertDialogPrimitive.Portal>
        <StyledOverlay />
        {children}
      </AlertDialogPrimitive.Portal>
    </AlertDialogPrimitive.Root>
  )
}

const StyledContent = styled(AlertDialogPrimitive.Content, {
  zIndex: 1000,
  backgroundColor: '$mauve2',
  color: '$mauve12',
  borderRadius: '$md',
  boxShadow: '0px 10px 38px -5px rgba(22, 23, 24, 0.25), 0px 10px 20px -5px rgba(22, 23, 24, 0.2)',
  position: 'fixed',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '90vw',
  maxWidth: '450px',
  maxHeight: '85vh',
  padding: 25,
  '@media (prefers-reduced-motion: no-preference)': {
    animation: `${contentShow} 150ms cubic-bezier(0.16, 1, 0.3, 1)`
  },
  '&:focus': { outline: 'none' },
  '.dark &': {
    backgroundColor: '$mauve5',
    boxShadow: '0px 10px 38px 0px rgba(0, 0, 0, 0.85), 0px 10px 20px 0px rgba(0, 0, 0, 0.6)'
  }
})

const StyledTitle = styled(AlertDialogPrimitive.Title, {
  margin: 0,
  color: '$mauve12',
  fontWeight: 500,
  fontSize: '$lg'
})

const StyledDescription = styled(AlertDialogPrimitive.Description, {
  marginBottom: 20,
  color: '$mauve11',
  lineHeight: 1.5,
  fontSize: '$md'
})

// Exports
export const AlertDialog = Root
export const AlertDialogTrigger = AlertDialogPrimitive.Trigger
export const AlertDialogContent = StyledContent
export const AlertDialogTitle = StyledTitle
export const AlertDialogDescription = StyledDescription
export const AlertDialogAction = AlertDialogPrimitive.Action
export const AlertDialogCancel = AlertDialogPrimitive.Cancel
