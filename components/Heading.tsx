import React from 'react'
import { styled } from '../stitches.config'
import * as styles from './Heading.css'

interface HeadingProps extends React.HTMLAttributes<HTMLSpanElement> {
  as?: React.ElementType
  uppercase?: boolean
}

const HeadingBase = React.forwardRef<HTMLSpanElement, HeadingProps>(
  ({ as: Component = 'span', uppercase, className, ...props }, ref) => (
    <Component
      {...props}
      ref={ref}
      className={`${styles.heading({ uppercase })} ${className || ''}`}
    />
  )
)

HeadingBase.displayName = 'HeadingBase'

// Wrap with Stitches styled() for backward compatibility with css prop
const Heading = styled(HeadingBase, {})

export default Heading
