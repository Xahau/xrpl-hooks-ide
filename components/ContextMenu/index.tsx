import { FC, Fragment, ReactNode } from 'react'
import {
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuRoot,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuSeparator,
  ContextMenuTrigger
} from './primitive'

export type TextOption = {
  type: 'text'
  label: ReactNode
  onSelect?: () => any
  children?: ContentMenuOption[]
}
export type SeparatorOption = { type: 'separator' }
export type CheckboxOption = {
  type: 'checkbox'
  label: ReactNode
  checked?: boolean
  onCheckedChange?: (isChecked: boolean) => any
}
export type RadioOption<T extends string = string> = {
  type: 'radio'
  label: ReactNode
  onValueChange?: (value: string) => any
  value: T
  options?: { value: T; label?: ReactNode }[]
}

type WithCommons = { key: string; disabled?: boolean }

export type ContentMenuOption = (TextOption | SeparatorOption | CheckboxOption | RadioOption) &
  WithCommons

export interface IContextMenu {
  options?: ContentMenuOption[]
  isNested?: boolean
  children?: React.ReactNode
}
export const ContextMenu: FC<IContextMenu> = ({ children, options, isNested }) => {
  // nested menus are a Sub with a SubTrigger item and their own SubContent
  const Root = isNested ? ContextMenuSub : ContextMenuRoot
  const Trigger = isNested ? ContextMenuSubTrigger : ContextMenuTrigger
  const Content = isNested ? ContextMenuSubContent : ContextMenuContent
  return (
    <Root>
      <Trigger>{children}</Trigger>
      {options && !!options.length && (
        <Content>
          {options.map(({ key, ...option }) => {
            if (option.type === 'text') {
              const { children, label, onSelect } = option
              if (children)
                return (
                  <ContextMenu isNested key={key} options={children}>
                    {label}
                  </ContextMenu>
                )
              return (
                <ContextMenuItem key={key} onSelect={onSelect}>
                  {label}
                </ContextMenuItem>
              )
            }
            if (option.type === 'checkbox') {
              const { label, checked, onCheckedChange } = option
              return (
                <ContextMenuCheckboxItem
                  key={key}
                  checked={checked}
                  onCheckedChange={onCheckedChange}
                >
                  {label}
                </ContextMenuCheckboxItem>
              )
            }
            if (option.type === 'radio') {
              const { label, options, onValueChange, value } = option
              return (
                <Fragment key={key}>
                  <ContextMenuLabel>{label}</ContextMenuLabel>
                  <ContextMenuRadioGroup value={value} onValueChange={onValueChange}>
                    {options?.map(({ value: v, label }) => (
                      <ContextMenuRadioItem key={v} value={v}>
                        {label}
                      </ContextMenuRadioItem>
                    ))}
                  </ContextMenuRadioGroup>
                </Fragment>
              )
            }
            return <ContextMenuSeparator key={key} />
          })}
        </Content>
      )}
    </Root>
  )
}

export default ContextMenu
