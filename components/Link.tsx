import React from 'react'
import { styled } from '../stitches.config'
import * as styles from './Link.css'

interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  as?: React.ElementType
  highlighted?: boolean
}

const LinkBase = React.forwardRef<HTMLAnchorElement, LinkProps>(
  ({ as: Component = 'a', highlighted, className, ...props }, ref) => (
    <Component
      {...props}
      ref={ref}
      className={`${styles.link({ highlighted })} ${className || ''}`}
    />
  )
)

LinkBase.displayName = 'LinkBase'

// Wrap with Stitches styled() for backward compatibility with css prop
const Link = styled(LinkBase, {})

export default Link
