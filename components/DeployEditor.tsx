import React, { useState } from 'react'
import { useSnapshot } from 'valtio'

import { useTheme } from 'next-themes'
import { useRouter } from 'next/router'
import NextLink from 'next/link'
import ReactTimeAgo from 'react-time-ago'
import filesize from 'filesize'

import Box from './Box'
import Container from './Container'
import state from '../state'
import wat from '../utils/wat-highlight'

import EditorNavigation from './EditorNavigation'
import { Button, Text, Link, Flex, Tabs, Tab } from '.'
import Monaco from './Monaco'

const FILESIZE_BREAKPOINTS: [number, number] = [2 * 1024, 5 * 1024]

const DeployEditor = () => {
  const snap = useSnapshot(state)
  const router = useRouter()
  const { theme } = useTheme()

  const [showContent, setShowContent] = useState(false)

  const compiledFiles = snap.files.filter(file => file.compiledContent)
  const activeFile = compiledFiles[snap.activeWat]

  const renderNav = () => (
    <Tabs activeIndex={snap.activeWat} onChangeActive={idx => (state.activeWat = idx)}>
      {compiledFiles.map((file, index) => {
        const compiledViewableExtension = file.compiledExtension === 'wasm' ? 'wat' : 'js'
        return <Tab key={file.name} header={`${file.name.split('.')[0]}.${compiledViewableExtension}`} />
      })}
    </Tabs>
  )

  const compiledSize = activeFile?.compiledContent?.byteLength || 0
  const color =
    compiledSize > FILESIZE_BREAKPOINTS[1]
      ? '$error'
      : compiledSize > FILESIZE_BREAKPOINTS[0]
        ? '$warning'
        : '$success'

  const isContentChanged = activeFile && activeFile.compiledValueSnapshot !== activeFile.content
  // const hasDeployErrors = activeFile && activeFile.containsErrors;

  const CompiledStatView = activeFile && (
    <Flex
      column
      align="center"
      css={{
        fontSize: '$sm',
        fontFamily: '$monospace',
        textAlign: 'center'
      }}
    >
      <Flex row align="center">
        <Text css={{ mr: '$1' }}>Compiled {activeFile.name.split('.')[0] + '.' + activeFile.compiledExtension}</Text>
        {activeFile?.lastCompiled && <ReactTimeAgo date={activeFile.lastCompiled} locale="en-US" />}

        {activeFile.compiledContent?.byteLength && (
          <Text css={{ ml: '$2', color }}>({filesize(activeFile.compiledContent.byteLength)})</Text>
        )}
      </Flex>
      {activeFile.compiledContent?.byteLength && activeFile.compiledContent?.byteLength >= 64000 && (
        <Flex css={{ flexDirection: 'column', py: '$3', pb: '$1' }}>
          <Text css={{ ml: '$2', color: '$error' }}>
            File size is larger than 64kB, cannot set hook!
          </Text>
        </Flex>
      )}
      <Button variant="link" onClick={() => setShowContent(true)}>
        {activeFile.compiledExtension === 'wasm' ? 'View as WAT-file' : 'View as JS-file'}
      </Button>
      {isContentChanged && (
        <Text warning>
          File contents were changed after last compile, compile again to incorporate your latest
          changes in the build.
        </Text>
      )}
    </Flex>
  )
  const NoContentView = !snap.loading && router.isReady && (
    <Text
      css={{
        mt: '-60px',
        fontSize: '$sm',
        fontFamily: '$monospace',
        maxWidth: '300px',
        textAlign: 'center'
      }}
    >
      {`You haven't compiled any files yet, compile files on `}
      <NextLink shallow href={`/develop/${router.query.slug}`} passHref>
        <Link as="a">develop view</Link>
      </NextLink>
    </Text>
  )

  const isContent = snap.files?.filter(file => file.compiledWatContent).length > 0 && router.isReady
  return (
    <Box
      css={{
        flex: 1,
        display: 'flex',
        position: 'relative',
        flexDirection: 'column',
        backgroundColor: '$mauve2',
        width: '100%'
      }}
    >
      <EditorNavigation renderNav={renderNav} />
      <Container
        css={{
          display: 'flex',
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center'
        }}
      >
        {!isContent ? (
          NoContentView
        ) : !showContent ? (
          CompiledStatView
        ) : (
          <Monaco
            className="hooks-editor"
            defaultLanguage={activeFile?.compiledExtension === 'wasm' ? 'wat' : 'javascript'}
            language={activeFile?.compiledExtension === 'wasm' ? 'wat' : 'javascript'}
            path={`file://tmp/c/${activeFile?.name}.${activeFile?.language}`}
            value={activeFile?.compiledWatContent || ''}
            beforeMount={monaco => {
              monaco.languages.register({ id: activeFile.language })
              monaco.languages.setLanguageConfiguration(activeFile.language, wat.config)
              monaco.languages.setMonarchTokensProvider(activeFile.language, wat.tokens)
            }}
            onMount={editor => {
              editor.updateOptions({
                glyphMargin: true,
                readOnly: true
              })
            }}
            theme={theme === 'dark' ? 'dark' : 'light'}
            overlay={
              <Flex
                css={{
                  m: '$1',
                  ml: 'auto',
                  fontSize: '$sm',
                  color: '$textMuted'
                }}
              >
                <Link onClick={() => setShowContent(false)}>Exit editor mode</Link>
              </Flex>
            }
          />
        )}
      </Container>
    </Box>
  )
}

export default DeployEditor
