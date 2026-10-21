import { styled } from '../stitches.config'
import * as SwitchPrimitive from '@radix-ui/react-switch'

const StyledSwitch = styled(SwitchPrimitive.Root, {
  all: 'unset',
  width: 42,
  height: 25,
  backgroundColor: '$mauve9',
  borderRadius: '9999px',
  position: 'relative',
  boxShadow: `0 2px 10px $colors$mauve2`,
  WebkitTapHighlightColor: 'rgba(0, 0, 0, 0)',
  '&:focus': { boxShadow: `0 0 0 2px $colors$mauveA2` },
  '&[data-state="checked"]': { backgroundColor: '$green11' }
})

const StyledThumb = styled(SwitchPrimitive.Thumb, {
  display: 'block',
  width: 21,
  height: 21,
  backgroundColor: 'white',
  borderRadius: '9999px',
  boxShadow: `0 2px 2px $colors$mauveA6`,
  transition: 'transform 100ms',
  transform: 'translateX(2px)',
  willChange: 'transform',
  '&[data-state="checked"]': { transform: 'translateX(19px)' }
})

// Exports
export const Switch = StyledSwitch
export const SwitchThumb = StyledThumb
