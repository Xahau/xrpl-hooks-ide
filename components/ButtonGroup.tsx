import { styled } from '../stitches.config'
import Button from './Button'

const ButtonGroup = styled('div', {
  display: 'flex',
  marginLeft: '1px',
  [`& ${Button}`]: {
    marginLeft: '-1px',
    px: '$4',
    zIndex: 2,
    position: 'relative',
    '&:hover, &:focus': {
      zIndex: 200
    }
  },
  [`& ${Button}:not(:only-of-type):not(:first-child):not(:last-child)`]: {
    borderRadius: 0
  },
  [`& ${Button}:first-child:not(:only-of-type)`]: {
    borderBottomRightRadius: 0,
    borderTopRightRadius: 0
  },
  [`& ${Button}:last-child:not(:only-of-type)`]: {
    borderBottomLeftRadius: 0,
    borderTopLeftRadius: 0
  }
})

export default ButtonGroup
