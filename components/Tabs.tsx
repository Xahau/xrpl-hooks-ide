import React, { useEffect, useState, Fragment, isValidElement, useCallback } from 'react'
import type { ReactNode, ReactElement } from 'react'
import { Box, Button, Flex, Input, Label, Pre, Stack, Text } from '.'
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose
} from './Dialog'
import { Plus, X } from 'phosphor-react'
import { styled } from '../stitches.config'
import { capitalize, getFileExtention } from '../utils/helpers'
import ContextMenu, { ContentMenuOption } from './ContextMenu'

const ErrorText = styled(Text, {
  color: '$error',
  mt: '$1',
  display: 'block'
})

type Nullable<T> = T | null | undefined | false

interface TabProps {
  header: string
  children?: ReactNode
  renameDisabled?: boolean
}

// TODO customize messages shown
interface Props {
  label?: string
  activeIndex?: number
  activeHeader?: string
  headless?: boolean
  children: ReactElement<TabProps>[]
  keepAllAlive?: boolean
  defaultExtension?: string
  extensionRequired?: boolean
  allowedExtensions?: string[]
  headerExtraValidation?: {
    regex: string | RegExp
    error: string
  }
  css?: Record<string, any>
  onCreateNewTab?: (name: string) => any
  onRenameTab?: (index: number, nwName: string, oldName?: string) => any
  onCloseTab?: (index: number, header?: string) => any
  onChangeActive?: (index: number, header?: string) => any
}

export const Tab = (props: TabProps) => null

export const Tabs = ({
  label = 'Tab',
  children,
  activeIndex,
  activeHeader,
  headless,
  keepAllAlive = false,
  onCreateNewTab,
  onCloseTab,
  onChangeActive,
  onRenameTab,
  headerExtraValidation,
  extensionRequired,
  defaultExtension = '',
  allowedExtensions,
  css
}: Props) => {
  const [active, setActive] = useState(activeIndex || 0)
  const tabs: TabProps[] = children.map(elem => elem.props)

  const [isNewtabDialogOpen, setIsNewtabDialogOpen] = useState(false)
  const [renamingTab, setRenamingTab] = useState<number | null>(null)
  const [tabname, setTabname] = useState('')
  const [tabnameError, setTabnameError] = useState<string | null>(null)

  useEffect(() => {
    if (activeIndex) setActive(activeIndex)
  }, [activeIndex])

  useEffect(() => {
    if (activeHeader) {
      const idx = tabs.findIndex(tab => tab.header === activeHeader)
      if (idx !== -1) setActive(idx)
      else setActive(0)
    }
  }, [activeHeader, tabs])

  // when filename changes, reset error
  useEffect(() => {
    setTabnameError(null)
  }, [tabname, setTabnameError])

  const validateTabname = useCallback(
    (tabname: string): { error?: string; result?: string } => {
      if (!tabname) {
        return { error: `Please enter ${label.toLocaleLowerCase()} name.` }
      }
      let ext = getFileExtention(tabname)

      if (!ext && defaultExtension) {
        ext = defaultExtension
        tabname = `${tabname}.${defaultExtension}`
      }
      if (tabs.find(tab => tab.header === tabname)) {
        return { error: `${capitalize(label)} name already exists.` }
      }
      if (extensionRequired && !ext) {
        return { error: 'File extension is required!' }
      }
      if (allowedExtensions && ext && !allowedExtensions.includes(ext)) {
        return { error: 'This file extension is not allowed!' }
      }
      if (headerExtraValidation && !tabname.match(headerExtraValidation.regex)) {
        return { error: headerExtraValidation.error }
      }
      return { result: tabname }
    },
    [allowedExtensions, defaultExtension, extensionRequired, headerExtraValidation, label, tabs]
  )

  const handleActiveChange = useCallback(
    (idx: number, header?: string) => {
      setActive(idx)
      onChangeActive?.(idx, header)
    },
    [onChangeActive]
  )

  const handleRenameTab = useCallback(() => {
    if (renamingTab === null) return

    const res = validateTabname(tabname)
    if (res.error) {
      setTabnameError(`Error: ${res.error}`)
      return
    }

    const { result: nwName = tabname } = res

    setRenamingTab(null)
    setTabname('')

    const oldName = tabs[renamingTab]?.header
    onRenameTab?.(renamingTab, nwName, oldName)

    handleActiveChange(renamingTab, nwName)
  }, [handleActiveChange, onRenameTab, renamingTab, tabname, tabs, validateTabname])

  const handleCreateTab = useCallback(() => {
    const res = validateTabname(tabname)
    if (res.error) {
      setTabnameError(`Error: ${res.error}`)
      return
    }
    const { result: _tabname = tabname } = res

    setIsNewtabDialogOpen(false)
    setTabname('')

    onCreateNewTab?.(_tabname)

    handleActiveChange(tabs.length, _tabname)
  }, [validateTabname, tabname, onCreateNewTab, handleActiveChange, tabs.length])

  const handleCloseTab = useCallback(
    (idx: number) => {
      onCloseTab?.(idx, tabs[idx].header)

      if (idx <= active && active !== 0) {
        const nwActive = active - 1
        handleActiveChange(nwActive, tabs[nwActive].header)
      }
    },
    [active, handleActiveChange, onCloseTab, tabs]
  )

  const closeOption = (idx: number): Nullable<ContentMenuOption> =>
    onCloseTab && {
      type: 'text',
      label: 'Close',
      key: 'close',
      onSelect: () => handleCloseTab(idx)
    }
  const renameOption = (idx: number, tab: TabProps): Nullable<ContentMenuOption> => {
    return (
      onRenameTab &&
      !tab.renameDisabled && {
        type: 'text',
        label: 'Rename',
        key: 'rename',
        onSelect: () => setRenamingTab(idx)
      }
    )
  }

  return (
    <>
      {!headless && (
        <Stack
          css={{
            gap: '$3',
            flex: 1,
            flexWrap: 'nowrap',
            marginBottom: '$2',
            width: '100%',
            overflow: 'auto',
            ...css
          }}
        >
          {tabs.map((tab, idx) => (
            <ContextMenu
              key={tab.header}
              options={
                [closeOption(idx), renameOption(idx, tab)].filter(Boolean) as ContentMenuOption[]
              }
            >
              <Button
                role="tab"
                tabIndex={idx}
                onClick={() => handleActiveChange(idx, tab.header)}
                onKeyPress={() => handleActiveChange(idx, tab.header)}
                outline={active !== idx}
                size="sm"
                css={{
                  '&:hover': {
                    span: {
                      visibility: 'visible'
                    }
                  }
                }}
              >
                {tab.header || idx}
                {onCloseTab && (
                  <Box
                    as="span"
                    css={{
                      display: 'flex',
                      p: '2px',
                      borderRadius: '$full',
                      mr: '-4px',
                      '&:hover': {
                        // boxSizing: "0px 0px 1px",
                        backgroundColor: '$mauve2',
                        color: '$mauve12'
                      }
                    }}
                    onClick={(ev: React.MouseEvent<HTMLElement>) => {
                      ev.stopPropagation()
                      handleCloseTab(idx)
                    }}
                  >
                    <X size="9px" weight="bold" />
                  </Box>
                )}
              </Button>
            </ContextMenu>
          ))}
          {onCreateNewTab && (
            <Dialog open={isNewtabDialogOpen} onOpenChange={setIsNewtabDialogOpen}>
              <DialogTrigger asChild>
                <Button ghost size="sm" css={{ alignItems: 'center', px: '$2', mr: '$3' }}>
                  <Plus size="16px" /> {tabs.length === 0 && `Add new ${label.toLocaleLowerCase()}`}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogTitle>Create new {label.toLocaleLowerCase()}</DialogTitle>
                <DialogDescription>
                  <Label>{label} name</Label>
                  <Input
                    value={tabname}
                    onChange={e => setTabname(e.target.value)}
                    onKeyPress={e => {
                      if (e.key === 'Enter') {
                        handleCreateTab()
                      }
                    }}
                  />
                  <ErrorText>{tabnameError}</ErrorText>
                </DialogDescription>

                <Flex
                  css={{
                    marginTop: 25,
                    justifyContent: 'flex-end',
                    gap: '$3'
                  }}
                >
                  <DialogClose asChild>
                    <Button outline>Cancel</Button>
                  </DialogClose>
                  <Button variant="primary" onClick={handleCreateTab}>
                    Create
                  </Button>
                </Flex>
                <DialogClose asChild>
                  <Box css={{ position: 'absolute', top: '$3', right: '$3' }}>
                    <X size="20px" />
                  </Box>
                </DialogClose>
              </DialogContent>
            </Dialog>
          )}
          {onRenameTab && (
            <Dialog open={renamingTab !== null} onOpenChange={() => setRenamingTab(null)}>
              <DialogContent>
                <DialogTitle>
                  Rename <Pre>{tabs[renamingTab || 0]?.header}</Pre>
                </DialogTitle>
                <DialogDescription>
                  <Label>Enter new name</Label>
                  <Input
                    value={tabname}
                    onChange={e => setTabname(e.target.value)}
                    onKeyPress={e => {
                      if (e.key === 'Enter') {
                        handleRenameTab()
                      }
                    }}
                  />
                  <ErrorText>{tabnameError}</ErrorText>
                </DialogDescription>

                <Flex
                  css={{
                    marginTop: 25,
                    justifyContent: 'flex-end',
                    gap: '$3'
                  }}
                >
                  <DialogClose asChild>
                    <Button outline>Cancel</Button>
                  </DialogClose>
                  <Button variant="primary" onClick={handleRenameTab}>
                    Confirm
                  </Button>
                </Flex>
                <DialogClose asChild>
                  <Box css={{ position: 'absolute', top: '$3', right: '$3' }}>
                    <X size="20px" />
                  </Box>
                </DialogClose>
              </DialogContent>
            </Dialog>
          )}
        </Stack>
      )}
      {keepAllAlive
        ? tabs.map((tab, idx) => {
          // TODO Maybe rule out fragments as children
          if (!isValidElement(tab.children)) {
            if (active !== idx) return null
            return tab.children
          }
          let key = tab.children.key || tab.header || idx
          let { children } = tab
          let { style, ...props } = children.props
          return (
            <children.type
              key={key}
              {...props}
              style={{
                ...style,
                display: active !== idx ? 'none' : undefined
              }}
            />
          )
        })
        : tabs[active] && (
          <Fragment key={tabs[active].header || active}>{tabs[active].children}</Fragment>
        )}
    </>
  )
}
