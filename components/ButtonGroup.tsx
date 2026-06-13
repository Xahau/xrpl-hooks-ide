import React from 'react'
import { styled } from '../stitches.config'
import * as styles from './ButtonGroup.css'

interface ButtonGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  as?: React.ElementType
}

const ButtonGroupBase = React.forwardRef<HTMLDivElement, ButtonGroupProps>(
  ({ as: Component = 'div', className, ...props }, ref) => {
    return (
      <Component
        ref={ref}
        className={`${styles.buttonGroup} ${className || ''}`}
        {...props}
      />
    )
  }
)

ButtonGroupBase.displayName = 'ButtonGroupBase'

// Wrap with Stitches styled() for backward compatibility with css prop
const ButtonGroup = styled(ButtonGroupBase, {})

export default ButtonGroup
