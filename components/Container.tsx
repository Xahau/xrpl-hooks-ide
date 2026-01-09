import React from 'react'
import { styled } from '../stitches.config'
import Box from './Box'
import * as styles from './Container.css'

interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  as?: React.ElementType
}

const ContainerBase = React.forwardRef<HTMLDivElement, ContainerProps>(
  ({ className, ...props }, ref) => {
    return (
      <Box
        ref={ref}
        className={`${styles.container} ${className || ''}`}
        {...props}
      />
    )
  }
)

ContainerBase.displayName = 'ContainerBase'

// Wrap with Stitches styled() for backward compatibility with css prop
const Container = styled(ContainerBase, {})

export default Container
