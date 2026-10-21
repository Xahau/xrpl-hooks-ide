import * as LabelPrim from '@radix-ui/react-label'
import { TextField } from '@radix-ui/themes'
import { styled } from '../stitches.config'

// TextField.Root forwards its ref to the <input> (react-hook-form `register` relies on it)
export const Input = styled(TextField.Root, { width: '100%', flex: '1' })

export default Input

const LabelRoot = (props: LabelPrim.LabelProps) => <LabelPrim.Root {...props} />

export const Label = styled(LabelRoot, {
  display: 'inline-block',
  mb: '$1'
})
