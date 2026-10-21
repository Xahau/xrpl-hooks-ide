import { styled } from '../stitches.config'

const StyledLink = styled('a', {
  color: 'CurrentColor',
  textDecoration: 'underline',
  cursor: 'pointer',
  variants: {
    highlighted: {
      true: {
        color: '$blue9'
      }
    }
  }
})

export default StyledLink
