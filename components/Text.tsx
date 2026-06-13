import React from 'react'
import { styled } from '../stitches.config'
import * as styles from './Text.css'

interface TextProps extends React.HTMLAttributes<HTMLSpanElement> {
  as?: React.ElementType
  small?: boolean
  muted?: boolean
  error?: boolean
  warning?: boolean
  monospace?: boolean
  block?: boolean
}

const TextBase = React.forwardRef<HTMLSpanElement, TextProps>(
  ({ as: Component = 'span', small, muted, error, warning, monospace, block, className, ...props }, ref) => {
    return (
      <Component
        ref={ref}
        className={`${styles.text({ small, muted, error, warning, monospace, block })} ${className || ''}`}
        {...props}
      />
    )
  }
)

TextBase.displayName = 'TextBase'

// Wrap with Stitches styled() for backward compatibility with css prop
const Text = styled(TextBase, {})

export default Text
