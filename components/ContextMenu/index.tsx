import { CaretRight, Check, Circle } from 'phosphor-react'
import { FC, Fragment, ReactNode } from 'react'
import { Flex, Text } from '../'
import {
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuItemIndicator,
  ContextMenuLabel,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuRoot,
  ContextMenuSeparator,
  ContextMenuTrigger,
  ContextMenuTriggerItem
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
  return (
    <ContextMenuRoot>
      {isNested ? (
        <ContextMenuTriggerItem>{children}</ContextMenuTriggerItem>
      ) : (
        <ContextMenuTrigger>{children}</ContextMenuTrigger>
      )}
      {options && !!options.length && (
        <ContextMenuContent>
          {options.map(({ key, ...option }) => {
            if (option.type === 'text') {
              const { children, label, onSelect } = option
              if (children)
                return (
                  <ContextMenu isNested key={key} options={children}>
                    <Flex fluid row justify="space-between" align="center">
                      <Text>{label}</Text>
                      <CaretRight />
                    </Flex>
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
                  <Flex row align="center">
                    <ContextMenuItemIndicator>
                      <Check />
                    </ContextMenuItemIndicator>
                    <Text css={{ ml: checked ? '$4' : undefined }}>{label}</Text>
                  </Flex>
                </ContextMenuCheckboxItem>
              )
            }
            if (option.type === 'radio') {
              const { label, options, onValueChange, value } = option
              return (
                <Fragment key={key}>
                  <ContextMenuLabel>{label}</ContextMenuLabel>
                  <ContextMenuRadioGroup value={value} onValueChange={onValueChange}>
                    {options?.map(({ value: v, label }) => {
                      return (
                        <ContextMenuRadioItem key={v} value={v}>
                          <ContextMenuItemIndicator>
                            <Circle weight="fill" />
                          </ContextMenuItemIndicator>
                          <Text css={{ ml: '$4' }}>{label}</Text>
                        </ContextMenuRadioItem>
                      )
                    })}
                  </ContextMenuRadioGroup>
                </Fragment>
              )
            }
            return <ContextMenuSeparator key={key} />
          })}
        </ContextMenuContent>
      )}
    </ContextMenuRoot>
  )
}

export default ContextMenu
