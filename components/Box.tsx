import React from 'react'
import { styled } from '../stitches.config'
import * as styles from './Box.css'

interface BoxProps extends React.HTMLAttributes<HTMLDivElement> {
  as?: React.ElementType
}

const BoxBase = React.forwardRef<HTMLDivElement, BoxProps>(
  ({ as: Component = 'div', className, children, ...props }, ref) => {
    return (
      <Component ref={ref} className={`${styles.box} ${className || ''}`} {...props}>
        {children}
      </Component>
    )
  }
)

BoxBase.displayName = 'BoxBase'

// Wrap with Stitches styled() for backward compatibility with css prop
const Box = styled(BoxBase, {})

export default Box
