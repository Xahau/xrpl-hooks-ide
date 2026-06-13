import React from 'react'
import { styled } from '../stitches.config'
import Box from './Box'
import * as styles from './Stack.css'

interface StackProps extends React.HTMLAttributes<HTMLDivElement> {
  as?: React.ElementType
}

const StackBase = React.forwardRef<HTMLDivElement, StackProps>(
  ({ className, ...props }, ref) => {
    return (
      <Box
        ref={ref}
        className={`${styles.stack} ${className || ''}`}
        {...props}
      />
    )
  }
)

StackBase.displayName = 'StackBase'

// Wrap with Stitches styled() for backward compatibility with css prop
const Stack = styled(StackBase, {})

export default Stack
