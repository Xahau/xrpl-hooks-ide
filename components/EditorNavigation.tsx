import React, { useState, useEffect, useRef, ReactNode } from 'react'
import {
  Share,
  DownloadSimple,
  Gear,
  X,
  GithubLogo,
  SignOut,
  ArrowSquareOut,
  CloudArrowUp,
  CaretDown,
  User,
  FilePlus
} from 'phosphor-react'
import Image from 'next/image'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuArrow,
  DropdownMenuSeparator
} from './DropdownMenu'
import NewWindow from 'react-new-window'
import { signOut, useSession } from 'next-auth/react'
import { useSnapshot } from 'valtio'
import toast from 'react-hot-toast'

import { syncToGist, updateEditorSettings, downloadAsZip } from '../state/actions'
import state from '../state'
import Box from './Box'
import Button from './Button'
import Container from './Container'
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose
} from './Dialog'
import Flex from './Flex'
import Stack from './Stack'
import { Input, Label } from './Input'
import Tooltip from './Tooltip'
import { showAlert } from '../state/actions/showAlert'

const EditorNavigation = ({ renderNav }: { renderNav?: () => ReactNode }) => {
  const snap = useSnapshot(state)
  const [editorSettingsOpen, setEditorSettingsOpen] = useState(false)
  const { data: session, status } = useSession()
  const [popup, setPopUp] = useState(false)
  const [editorSettings, setEditorSettings] = useState(snap.editorSettings)

  useEffect(() => {
    if (session && session.user && popup) {
      setPopUp(false)
    }
  }, [session, popup])

  const showNewGistAlert = () => {
    showAlert('Are you sure?', {
      body: (
        <>
          This action will create new <strong>public</strong> Github Gist from your current saved
          files. You can delete gist anytime from your GitHub Gists page.
        </>
      ),
      cancelText: 'Cancel',
      confirmText: 'Create new Gist',
      confirmPrefix: <FilePlus size="15px" />,
      onConfirm: () => syncToGist(session, true)
    })
  }

  const scrollRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  return (
    <Flex css={{ flexShrink: 0, gap: '$0' }}>
      <Flex
        id="kissa"
        ref={scrollRef}
        css={{
          overflowX: 'scroll',
          overflowY: 'hidden',
          py: '$3',
          pb: '$0',
          flex: 1,
          '&::-webkit-scrollbar': {
            height: '0.3em',
            background: 'rgba(0,0,0,.0)'
          },
          '&::-webkit-scrollbar-gutter': 'stable',
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: 'rgba(0,0,0,.2)',
            outline: '0px',
            borderRadius: '9999px'
          },
          scrollbarColor: 'rgba(0,0,0,.2) rgba(0,0,0,0)',
          scrollbarGutter: 'stable',
          scrollbarWidth: 'thin',
          '.dark &': {
            '&::-webkit-scrollbar': {
              background: 'rgba(0,0,0,.0)'
            },
            '&::-webkit-scrollbar-gutter': 'stable',
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: 'rgba(255,255,255,.2)',
              outline: '0px',
              borderRadius: '9999px'
            },
            scrollbarColor: 'rgba(255,255,255,.2) rgba(0,0,0,0)',
            scrollbarGutter: 'stable',
            scrollbarWidth: 'thin'
          }
        }}
        onWheelCapture={e => {
          if (scrollRef.current) {
            scrollRef.current.scrollLeft += e.deltaY
          }
        }}
      >
        <Container css={{ flex: 1 }} ref={containerRef}>
          {renderNav?.()}
        </Container>
      </Flex>
      <Flex
        css={{
          py: '$3',
          backgroundColor: '$mauve2',
          zIndex: 1
        }}
      >
        <Container css={{ width: 'unset', display: 'flex', alignItems: 'center' }}>
          {status === 'authenticated' ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Box
                  css={{
                    display: 'flex',
                    borderRadius: '$full',
                    overflow: 'hidden',
                    width: '$6',
                    height: '$6',
                    boxShadow: '0px 0px 0px 1px $colors$mauve11',
                    position: 'relative',
                    mr: '$3',
                    '@hover': {
                      '&:hover': {
                        cursor: 'pointer',
                        boxShadow: '0px 0px 0px 1px $colors$mauve12'
                      }
                    }
                  }}
                >
                  <Image
                    src={session?.user?.image || ''}
                    width={30}
                    height={30}
                    style={{ objectFit: 'cover' }}
                    alt="User avatar"
                  />
                </Box>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem disabled onClick={() => signOut()}>
                  <User size="16px" /> {session?.user?.username} ({session?.user.name})
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => window.open(`http://gist.github.com/${session?.user.username}`)}
                >
                  <ArrowSquareOut size="16px" />
                  Go to your Gist
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut({ callbackUrl: '/' })}>
                  <SignOut size="16px" /> Log out
                </DropdownMenuItem>

                <DropdownMenuArrow offset={10} />
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button outline size="sm" css={{ mr: '$3' }} onClick={() => setPopUp(true)}>
              <GithubLogo size="16px" /> Login
            </Button>
          )}

          <Stack
            css={{
              display: 'inline-flex',
              marginLeft: 'auto',
              flexShrink: 0,
              gap: '$0',
              borderRadius: '$sm',
              boxShadow: 'inset 0px 0px 0px 1px $colors$mauve10',
              zIndex: 9,
              position: 'relative',
              button: {
                borderRadius: 0,
                px: '$2',
                alignSelf: 'flex-start',
                boxShadow: 'none'
              },
              'button:not(:first-child):not(:last-child)': {
                borderRight: 0,
                borderLeft: 0
              },
              'button:first-child': {
                borderTopLeftRadius: '$sm',
                borderBottomLeftRadius: '$sm'
              },
              'button:last-child': {
                borderTopRightRadius: '$sm',
                borderBottomRightRadius: '$sm',
                boxShadow: 'inset 0px 0px 0px 1px $colors$mauve10',
                '&:hover': {
                  boxShadow: 'inset 0px 0px 0px 1px $colors$mauve12'
                }
              }
            }}
          >
            <Tooltip content="Download as ZIP">
              <Button
                isLoading={snap.zipLoading}
                onClick={downloadAsZip}
                outline
                size="sm"
                css={{ alignItems: 'center' }}
              >
                <DownloadSimple size="16px" />
              </Button>
            </Tooltip>
            <Tooltip content="Copy share link to clipboard">
              <Button
                outline
                size="sm"
                css={{ alignItems: 'center' }}
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/develop/${snap.gistId}`)
                  toast.success('Copied share link to clipboard!')
                }}
              >
                <Share size="16px" />
              </Button>
            </Tooltip>
            <Tooltip
              content={
                session && session.user
                  ? snap.gistOwner === session?.user.username
                    ? 'Sync to Gist'
                    : 'Create as a new Gist'
                  : 'You need to be logged in to sync with Gist'
              }
            >
              <Button
                outline
                size="sm"
                isDisabled={!session || !session.user}
                isLoading={snap.gistLoading}
                css={{ alignItems: 'center' }}
                onClick={() => {
                  if (!session || !session.user) {
                    return
                  }
                  if (snap.gistOwner === session?.user.username) {
                    syncToGist(session)
                  } else {
                    showNewGistAlert()
                  }
                }}
              >
                {snap.gistOwner === session?.user.username ? (
                  <CloudArrowUp size="16px" />
                ) : (
                  <FilePlus size="16px" />
                )}
              </Button>
            </Tooltip>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button outline size="sm">
                  <CaretDown size="16px" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem disabled={snap.zipLoading} onClick={downloadAsZip}>
                  <DownloadSimple size="16px" /> Download as ZIP
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    navigator.clipboard.writeText(
                      `${window.location.origin}/develop/${snap.gistId}`
                    )
                    toast.success('Copied share link to clipboard!')
                  }}
                >
                  <Share size="16px" />
                  Copy share link to clipboard
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={session?.user.username !== snap.gistOwner || !snap.gistId}
                  onClick={() => {
                    syncToGist(session)
                  }}
                >
                  <CloudArrowUp size="16px" /> Push to Gist
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  disabled={status !== 'authenticated'}
                  onClick={() => {
                    showNewGistAlert()
                  }}
                >
                  <FilePlus size="16px" /> Create as a new Gist
                </DropdownMenuItem>

                <DropdownMenuItem onClick={() => setEditorSettingsOpen(true)}>
                  <Gear size="16px" /> Editor Settings
                </DropdownMenuItem>

                <DropdownMenuArrow offset={10} />
              </DropdownMenuContent>
            </DropdownMenu>
          </Stack>

          {popup && !session ? <NewWindow center="parent" url="/sign-in" /> : null}
        </Container>
      </Flex>

      <Dialog open={editorSettingsOpen} onOpenChange={setEditorSettingsOpen}>
        <DialogTrigger asChild>
          {/* <Button outline size="sm" css={{ alignItems: "center" }}>
                  <Gear size="16px" />
                </Button> */}
        </DialogTrigger>
        <DialogContent>
          <DialogTitle>Editor settings</DialogTitle>
          <DialogDescription>
            <Label>Tab size</Label>
            <Input
              type="number"
              min="1"
              value={editorSettings.tabSize}
              onChange={e =>
                setEditorSettings(curr => ({
                  ...curr,
                  tabSize: Number(e.target.value)
                }))
              }
            />
          </DialogDescription>

          <Flex css={{ marginTop: 25, justifyContent: 'flex-end', gap: '$3' }}>
            <DialogClose asChild>
              <Button outline onClick={() => updateEditorSettings(editorSettings)}>
                Cancel
              </Button>
            </DialogClose>
            <DialogClose asChild>
              <Button variant="primary" onClick={() => updateEditorSettings(editorSettings)}>
                Save changes
              </Button>
            </DialogClose>
          </Flex>
          <DialogClose asChild>
            <Box css={{ position: 'absolute', top: '$3', right: '$3' }}>
              <X size="20px" />
            </Box>
          </DialogClose>
        </DialogContent>
      </Dialog>
    </Flex>
  )
}

export default EditorNavigation
