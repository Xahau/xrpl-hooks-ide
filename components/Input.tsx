import React from 'react'
import { styled } from '../stitches.config'
import * as LabelPrim from '@radix-ui/react-label'
import * as styles from './Input.css'

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  size?: 'sm' | 'md' | 'lg'
  variant?: 'ghost' | 'deep'
  state?: 'invalid' | 'valid'
  cursor?: 'default' | 'text'
}

const InputBase = React.forwardRef<HTMLInputElement, InputProps>(
  ({ size, variant, state, cursor, className, ...props }, ref) => (
    <input
      {...props}
      ref={ref}
      className={`${styles.input({ size, variant, state, cursor })} ${className || ''}`}
    />
  )
)

InputBase.displayName = 'InputBase'

// Wrap with Stitches styled() for backward compatibility with css prop
const Input = styled(InputBase, {})

export default Input
export { Input }

// Label component
interface LabelProps extends LabelPrim.LabelProps {
  className?: string
}

const LabelBase = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, ...props }, ref) => (
    <LabelPrim.Root {...props} ref={ref} className={`${styles.label} ${className || ''}`} />
  )
)

LabelBase.displayName = 'LabelBase'

export const Label = styled(LabelBase, {})
