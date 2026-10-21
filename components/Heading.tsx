import { styled } from '../stitches.config'

const Heading = styled('span', {
  fontFamily: '$heading',
  lineHeight: '$heading',
  fontWeight: '$heading',
  variants: {
    uppercase: {
      true: {
        textTransform: 'uppercase'
      }
    }
  }
})

export default Heading
