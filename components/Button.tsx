import React from 'react'
import { Button as ThemesButton } from '@radix-ui/themes'
import { styled } from '../stitches.config'

type ThemesProps = React.ComponentProps<typeof ThemesButton>
type ButtonProps = Omit<ThemesProps, 'variant' | 'size' | 'color' | 'highContrast' | 'loading'> & {
  variant?: 'default' | 'primary' | 'secondary' | 'destroy' | 'link'
  size?: 'xs' | 'sm' | 'md' | 'lg'
  outline?: boolean
  ghost?: boolean
  muted?: boolean
  isLoading?: boolean
}

const sizes = { xs: '1', sm: '1', md: '2', lg: '3' } as const

// maps the legacy call-site props onto Radix Themes; `as` is not supported, use `asChild` with a child element
const ThemesButtonMapped = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { variant = 'default', size = 'md', outline, ghost, muted, isLoading, disabled, ...rest },
    ref
  ) => (
    <ThemesButton
      {...rest}
      ref={ref}
      size={sizes[size]}
      variant={
        ghost || variant === 'link'
          ? 'ghost'
          : outline
          ? 'outline'
          : variant === 'secondary'
          ? 'soft'
          : 'solid'
      }
      color={
        variant === 'destroy'
          ? 'red'
          : muted || variant === 'default' || variant === 'link'
          ? 'gray'
          : undefined
      }
      highContrast={variant === 'default'}
      loading={isLoading}
      disabled={disabled || isLoading}
    />
  )
)
ThemesButtonMapped.displayName = 'Button'

const Button = styled(ThemesButtonMapped, {
  variants: {
    uppercase: { true: { textTransform: 'uppercase' } },
    fullWidth: { true: { width: '100%' } },
    // visual only, like the old variant: callers still handle clicks (tooltips, "fill in the fields" toasts)
    isDisabled: { true: { opacity: 0.6, cursor: 'auto' } }
  }
})

export default Button
