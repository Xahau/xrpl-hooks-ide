import { styled } from '../stitches.config'

const Text = styled('span', {
  fontFamily: '$body',
  lineHeight: '$body',
  color: '$text',
  variants: {
    small: {
      true: {
        fontSize: '$xs'
      }
    },
    muted: {
      true: {
        color: '$mauve9'
      }
    },
    error: {
      true: {
        color: '$error'
      }
    },
    warning: {
      true: {
        color: '$warning'
      }
    },
    monospace: {
      true: {
        fontFamily: '$monospace'
      }
    },
    block: {
      true: {
        display: 'block'
      }
    }
  }
})

export default Text
