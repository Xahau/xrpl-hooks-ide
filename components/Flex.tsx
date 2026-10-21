import { styled } from '../stitches.config'
import Box from './Box'

const Flex = styled(Box, {
  display: 'flex',
  variants: {
    row: {
      true: {
        flexDirection: 'row'
      }
    },
    column: {
      true: {
        flexDirection: 'column'
      }
    },
    fluid: {
      true: {
        width: '100%'
      }
    },
    align: {
      start: {
        alignItems: 'start'
      },
      center: {
        alignItems: 'center'
      },
      end: {
        alignItems: 'end'
      }
    },
    justify: {
      start: {
        justifyContent: 'start'
      },
      center: {
        justifyContent: 'center'
      },
      end: {
        justifyContent: 'end'
      },
      'space-between': {
        justifyContent: 'space-between'
      },
      'space-around': {
        justifyContent: 'space-around'
      }
    }
  }
})

export default Flex
