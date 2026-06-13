import React from 'react'
import { styled } from '../stitches.config'
import * as styles from './Textarea.css'

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  variant?: 'ghost' | 'deep'
  state?: 'invalid' | 'valid'
  cursor?: 'default' | 'text'
}

const TextareaBase = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ variant, state, cursor, className, ...props }, ref) => (
    <textarea
      {...props}
      ref={ref}
      className={`${styles.textarea({ variant, state, cursor })} ${className || ''}`}
    />
  )
)

TextareaBase.displayName = 'TextareaBase'

// Wrap with Stitches styled() for backward compatibility with css prop
const Textarea = styled(TextareaBase, {})

export default Textarea
export { Textarea }
