import React from 'react'
import { styled } from '../stitches.config'
import * as styles from './Button.css'
import Spinner from './Spinner'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  as?: React.ElementType
  size?: 'xs' | 'sm' | 'md' | 'lg'
  variant?: 'link' | 'default' | 'primary' | 'secondary' | 'destroy'
  muted?: boolean
  isDisabled?: boolean
  outline?: boolean
  uppercase?: boolean
  fullWidth?: boolean
  ghost?: boolean
  isLoading?: boolean
  children?: React.ReactNode
}

const ButtonBase = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({
    children,
    as: Component = 'button',
    size,
    variant,
    muted,
    isDisabled,
    outline,
    uppercase,
    fullWidth,
    ghost,
    isLoading,
    className,
    ...rest
  }, ref) => (
    <Component
      {...rest}
      ref={ref}
      className={`${styles.button({
        size,
        variant,
        muted,
        isDisabled,
        outline,
        uppercase,
        fullWidth,
        ghost,
        isLoading
      })} ${className || ''}`}
    >
      <span className={styles.buttonContent}>
        {children}
      </span>
      {isLoading && <Spinner className={styles.buttonSpinner} />}
    </Component>
  )
)

ButtonBase.displayName = 'ButtonBase'

// Wrap with Stitches styled() for backward compatibility with css prop
const Button = styled(ButtonBase, {})

export default Button
