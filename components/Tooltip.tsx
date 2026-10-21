import React from 'react'
import { Tooltip as ThemesTooltip } from '@radix-ui/themes'

// string content may be HTML (see EnrichLog)
const Tooltip = ({ content, ...rest }: React.ComponentProps<typeof ThemesTooltip>) => (
  <ThemesTooltip
    delayDuration={100}
    side="bottom"
    {...rest}
    content={typeof content === 'string' ? <span dangerouslySetInnerHTML={{ __html: content }} /> : content}
  />
)

export default Tooltip
