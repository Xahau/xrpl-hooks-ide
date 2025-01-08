import React, { useEffect, useRef, useState } from 'react'
import { useSnapshot, ref } from 'valtio'
import type monaco from 'monaco-editor'
import { ArrowBendLeftUp } from 'phosphor-react'
import { useTheme } from 'next-themes'
import { useRouter } from 'next/router'

import Box from './Box'
import Container from './Container'
import { createNewFile, saveFile } from '../state/actions'
import { apiHeaderFiles } from '../state/constants'
import state from '../state'

import EditorNavigation from './EditorNavigation'
import Text from './Text'
import { MonacoServices } from '@codingame/monaco-languageclient'
import { createLanguageClient, createWebSocket } from '../utils/languageClient'
import { listen } from '@codingame/monaco-jsonrpc'
import ReconnectingWebSocket from 'reconnecting-websocket'

import docs from '../xrpl-hooks-docs/docs'
import Monaco from './Monaco'
import { saveAllFiles } from '../state/actions/saveFile'
import { Tab, Tabs } from './Tabs'
import { renameFile } from '../state/actions/createNewFile'
import { Link } from '.'
import Markdown from './Markdown'

const checkWritable = (filename?: string): boolean => {
  if (apiHeaderFiles.find(file => file === filename)) {
    return false
  }
  return true
}

const validateWritability = (editor: monaco.editor.IStandaloneCodeEditor) => {
  const filename = editor.getModel()?.uri.path.split('/').pop()
  const isWritable = checkWritable(filename)
  editor.updateOptions({ readOnly: !isWritable })
}

let decorations: { [key: string]: string[] } = {}

const setMarkers = (monacoE: typeof monaco) => {
  // Get all the markers that are active at the moment,
  // Also if same error is there twice, we can show the content
  // only once (that's why we're using uniqBy)
  const markers = monacoE.editor
    .getModelMarkers({})
    // Filter out the markers that are hooks specific
    .filter(
      marker =>
        typeof marker?.code === 'string' &&
        // Take only markers that starts with "hooks-"
        marker?.code?.includes('hooks-')
    )

  // Get the active model (aka active file you're editing)
  // const model = monacoE.editor?.getModel(
  //   monacoE.Uri.parse(`file:///work/c/${state.files?.[state.active]?.name}`)
  // );
  // console.log(state.active);
  // Add decoration (aka extra hoverMessages) to markers in the
  // exact same range (location) where the markers are
  const models = monacoE.editor.getModels()
  models.forEach(model => {
    decorations[model.id] = model?.deltaDecorations(
      decorations?.[model.id] || [],
      markers
        .filter(marker =>
          marker?.resource.path.split('/').includes(`${state.files?.[state.active]?.name}`)
        )
        .map(marker => ({
          range: new monacoE.Range(
            marker.startLineNumber,
            marker.startColumn,
            marker.endLineNumber,
            marker.endColumn
          ),
          options: {
            hoverMessage: {
              value:
                // Find the related hover message markdown from the
                // /xrpl-hooks-docs/xrpl-hooks-docs-files.json file
                // which was generated from rst files

                (typeof marker.code === 'string' && docs[marker?.code]?.toString()) || '',
              supportHtml: true,
              isTrusted: true
            }
          }
        }))
    )
  })
}

const HooksEditor = () => {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor>()
  const monacoRef = useRef<typeof monaco>()
  const subscriptionRef = useRef<ReconnectingWebSocket | null>(null)
  const snap = useSnapshot(state)
  const router = useRouter()
  const { theme } = useTheme()
  const [isMdPreview, setIsMdPreview] = useState(true)

  useEffect(() => {
    if (editorRef.current) validateWritability(editorRef.current)
  }, [snap.active])

  useEffect(() => {
    return () => {
      subscriptionRef?.current?.close()
    }
  }, [])
  useEffect(() => {
    if (monacoRef.current) {
      setMarkers(monacoRef.current)
    }
  }, [snap.active])
  useEffect(() => {
    return () => {
      saveAllFiles()
    }
  }, [])

  const file = snap.files[snap.active]

  const renderNav = () => (
    <Tabs
      label="File"
      activeIndex={snap.active}
      onChangeActive={idx => (state.active = idx)}
      extensionRequired
      onCreateNewTab={createNewFile}
      onCloseTab={idx => state.files.splice(idx, 1)}
      onRenameTab={(idx, nwName, oldName = '') => renameFile(oldName, nwName)}
      headerExtraValidation={{
        regex: /^[A-Za-z0-9_-]+[.][A-Za-z0-9]{1,4}$/g,
        error: 'Filename can contain only characters from a-z, A-Z, 0-9, "_" and "-"'
      }}
    >
      {snap.files.map((file, index) => {
        return <Tab key={file.name} header={file.name} renameDisabled={!checkWritable(file.name)} />
      })}
    </Tabs>
  )
  const previewToggle = (
    <Link
      onClick={() => {
        if (!isMdPreview) {
          saveFile(false)
        }
        setIsMdPreview(!isMdPreview)
      }}
      css={{
        position: 'absolute',
        right: 0,
        bottom: 0,
        zIndex: 10,
        m: '$1',
        fontSize: '$sm'
      }}
    >
      {isMdPreview ? 'Exit Preview' : 'View Preview'}
    </Link>
  )
  return (
    <Box
      css={{
        flex: 1,
        flexShrink: 1,
        display: 'flex',
        position: 'relative',
        flexDirection: 'column',
        backgroundColor: '$mauve2',
        width: '100%'
      }}
    >
      <EditorNavigation renderNav={renderNav} />
      {file?.language === 'markdown' && previewToggle}
      {snap.files.length > 0 && router.isReady ? (
        isMdPreview && file?.language === 'markdown' ? (
          <Markdown
            components={{
              a: ({ href, children }) => (
                <Link target="_blank" rel="noopener noreferrer" href={href}>
                  {children}
                </Link>
              )
            }}
          >
            {file.content}
          </Markdown>
        ) : (
          <Monaco
            keepCurrentModel
            defaultLanguage={file?.language}
            language={file?.language}
            path={`file:///work/c/${file?.name}`}
            defaultValue={file?.content}
            // onChange={val => (state.files[snap.active].content = val)} // Auto save?
            beforeMount={monaco => {
              if (!snap.editorCtx) {
                snap.files.forEach(file =>
                  monaco.editor.createModel(
                    file.content,
                    file.language,
                    monaco.Uri.parse(`file:///work/c/${file.name}`)
                  )
                )
              }

              // create the web socket
              if (!subscriptionRef.current) {
                monaco.languages.register({
                  id: 'c',
                  extensions: ['.c', '.h'],
                  aliases: ['C', 'c', 'H', 'h'],
                  mimetypes: ['text/plain']
                })
                monaco.languages.register({
                  id: 'text',
                  extensions: ['.txt'],
                  mimetypes: ['text/plain'],
                })

                snap.files.filter(file => file.content.includes('declare global'))
                  .forEach(file => {
                    monaco.languages.typescript.javascriptDefaults.addExtraLib(
                      file.content
                    )
                  })

                MonacoServices.install(monaco)
                const webSocket = createWebSocket(
                  process.env.NEXT_PUBLIC_LANGUAGE_SERVER_API_ENDPOINT || ''
                )
                subscriptionRef.current = webSocket
                // listen when the web socket is opened
                listen({
                  webSocket: webSocket as WebSocket,
                  onConnection: connection => {
                    // create and start the language client
                    const languageClient = createLanguageClient(connection)
                    const disposable = languageClient.start()

                    connection.onClose(() => {
                      try {
                        disposable.dispose()
                      } catch (err) {
                        console.log('err', err)
                      }
                    })
                  }
                })
              }

              // editor.updateOptions({
              //   minimap: {
              //     enabled: false,
              //   },
              //   ...snap.editorSettings,
              // });
              if (!state.editorCtx) {
                state.editorCtx = ref(monaco.editor)
              }
            }}
            onMount={(editor, monaco) => {
              editorRef.current = editor
              monacoRef.current = monaco
              editor.updateOptions({
                glyphMargin: true,
                lightbulb: {
                  enabled: true
                }
              })
              editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
                saveFile()
              })
              // When the markers (errors/warnings from clangd language server) change
              // Lets improve the markers by adding extra content to them from related
              // md files
              monaco.editor.onDidChangeMarkers(() => {
                if (monacoRef.current) {
                  setMarkers(monacoRef.current)
                }
              })

              // Hacky way to hide Peek menu
              editor.onContextMenu(e => {
                const host = document.querySelector<HTMLElement>('.shadow-root-host')

                const contextMenuItems = host?.shadowRoot?.querySelectorAll('li.action-item')
                contextMenuItems?.forEach(k => {
                  // If menu item contains "Peek" lets hide it
                  if (k.querySelector('.action-label')?.textContent === 'Peek') {
                    // @ts-expect-error
                    k['style'].display = 'none'
                  }
                })
              })

              validateWritability(editor)
            }}
            theme={theme === 'dark' ? 'dark' : 'light'}
          />
        )
      ) : (
        <Container>
          {!snap.loading && router.isReady && (
            <Box
              css={{
                flexDirection: 'row',
                width: '$spaces$wide',
                gap: '$3',
                display: 'inline-flex'
              }}
            >
              <Box css={{ display: 'inline-flex', pl: '35px' }}>
                <ArrowBendLeftUp size={30} />
              </Box>
              <Box css={{ pl: '0px', pt: '15px', flex: 1, display: 'inline-flex' }}>
                <Text
                  css={{
                    fontSize: '14px',
                    maxWidth: '220px',
                    fontFamily: '$monospace'
                  }}
                >
                  Click the link above to create your file
                </Text>
              </Box>
            </Box>
          )}
        </Container>
      )}
    </Box>
  )
}

export default HooksEditor
