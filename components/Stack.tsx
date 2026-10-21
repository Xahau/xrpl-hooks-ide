import Box from './Box'
import { styled } from '../stitches.config'

const StackComponent = styled(Box, {
  display: 'flex',
  flexWrap: 'wrap',
  flexDirection: 'row',
  gap: '$4'
})

export default StackComponent
