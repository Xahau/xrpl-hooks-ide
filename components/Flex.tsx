import React from 'react'
import { styled } from '../stitches.config'
import Box from './Box'
import * as styles from './Flex.css'

interface FlexProps extends React.HTMLAttributes<HTMLDivElement> {
  as?: React.ElementType
  row?: boolean
  column?: boolean
  fluid?: boolean
  align?: 'start' | 'center' | 'end'
  justify?: 'start' | 'center' | 'end' | 'space-between' | 'space-around'
}

const FlexBase = React.forwardRef<HTMLDivElement, FlexProps>(
  ({ row, column, fluid, align, justify, className, ...props }, ref) => {
    return (
      <Box
        ref={ref}
        className={`${styles.flex({ row, column, fluid, align, justify })} ${className || ''}`}
        {...props}
      />
    )
  }
)

FlexBase.displayName = 'FlexBase'

// Wrap with Stitches styled() for backward compatibility with css prop
const Flex = styled(FlexBase, {})

export default Flex
