import { Label } from '@radix-ui/react-label'
import type { NextPage } from 'next'
import dynamic from 'next/dynamic'
import { FileJs, Gear, Play } from 'phosphor-react'
import Hotkeys from 'react-hot-keys'
import Split from 'react-split'
import { useSnapshot } from 'valtio'
import { ButtonGroup, Flex } from '../../components'
import Box from '../../components/Box'
import Button from '../../components/Button'
import Popover from '../../components/Popover'
import RunScript from '../../components/RunScript'
import state, { IFile } from '../../state'
import { compileCode } from '../../state/actions'
import { getSplit, saveSplit } from '../../state/actions/persistSplits'
import { styled } from '../../stitches.config'
import { getFileExtention } from '../../utils/helpers'

const HooksEditor = dynamic(() => import('../../components/HooksEditor'), {
  ssr: false
})

const LogBox = dynamic(() => import('../../components/LogBox'), {
  ssr: false
})

const OptimizationText = () => (
  <span>
    Specify which optimization level to use for compiling. For example -O0 means “no optimization”:
    this level compiles the fastest and generates the most debuggable code. -O2 means moderate level
    of optimization which enables most optimizations. Read more about the options from{' '}
    <a
      className="link"
      rel="noopener noreferrer"
      target="_blank"
      href="https://clang.llvm.org/docs/CommandGuide/clang.html#cmdoption-o0"
    >
      clang documentation
    </a>
    .
  </span>
)

const StyledOptimizationText = styled(OptimizationText, {
  color: '$mauve12 !important',
  fontSize: '200px',
  'span a.link': {
    color: 'red'
  }
})

const CompilerSettings = () => {
  const snap = useSnapshot(state)
  return (
    <Flex css={{ minWidth: 200, flexDirection: 'column', gap: '$5' }}>
      <Box>
        <Label
          style={{
            flexDirection: 'row',
            display: 'flex'
          }}
        >
          Optimization level{' '}
          <Popover
            css={{
              maxWidth: '240px',
              lineHeight: '1.3',
              a: {
                color: '$purple11'
              },
              '.dark &': {
                backgroundColor: '$black !important',

                '.arrow': {
                  fill: '$colors$black'
                }
              }
            }}
            content={<StyledOptimizationText />}
          >
            <Flex
              css={{
                position: 'relative',
                top: '-1px',
                ml: '$1',
                backgroundColor: '$mauve8',
                borderRadius: '$full',
                cursor: 'pointer',
                width: '16px',
                height: '16px',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              ?
            </Flex>
          </Popover>
        </Label>
        <ButtonGroup css={{ mt: '$2', fontFamily: '$monospace' }}>
          <Button
            css={{ fontFamily: '$monospace' }}
            outline={snap.compileOptions.optimizationLevel !== '-O0'}
            onClick={() => (state.compileOptions.optimizationLevel = '-O0')}
          >
            -O0
          </Button>
          <Button
            css={{ fontFamily: '$monospace' }}
            outline={snap.compileOptions.optimizationLevel !== '-O1'}
            onClick={() => (state.compileOptions.optimizationLevel = '-O1')}
          >
            -O1
          </Button>
          <Button
            css={{ fontFamily: '$monospace' }}
            outline={snap.compileOptions.optimizationLevel !== '-O2'}
            onClick={() => (state.compileOptions.optimizationLevel = '-O2')}
          >
            -O2
          </Button>
          <Button
            css={{ fontFamily: '$monospace' }}
            outline={snap.compileOptions.optimizationLevel !== '-O3'}
            onClick={() => (state.compileOptions.optimizationLevel = '-O3')}
          >
            -O3
          </Button>
          <Button
            css={{ fontFamily: '$monospace' }}
            outline={snap.compileOptions.optimizationLevel !== '-O4'}
            onClick={() => (state.compileOptions.optimizationLevel = '-O4')}
          >
            -O4
          </Button>
          <Button
            css={{ fontFamily: '$monospace' }}
            outline={snap.compileOptions.optimizationLevel !== '-Os'}
            onClick={() => (state.compileOptions.optimizationLevel = '-Os')}
          >
            -Os
          </Button>
        </ButtonGroup>
      </Box>
    </Flex>
  )
}

const Home: NextPage = () => {
  const snap = useSnapshot(state)

  const activeFile = snap.files[snap.active] as IFile | undefined
  const activeFileExt = getFileExtention(activeFile?.name)
  const canCompile = ['c', 'wat', 'js', 'ts'].includes(activeFileExt || '')
  return (
    <Split
      direction="vertical"
      sizes={getSplit('developVertical') || [70, 30]}
      minSize={[100, 100]}
      gutterAlign="center"
      gutterSize={4}
      style={{ height: 'calc(100vh - 60px)' }}
      onDragEnd={e => saveSplit('developVertical', e)}
    >
      <main style={{ display: 'flex', flex: 1, position: 'relative' }}>
        <HooksEditor />
        <Flex
          css={{
            position: 'absolute',
            bottom: '$4',
            left: '$4',
            alignItems: 'center',
            display: 'flex',
            cursor: 'pointer',
            gap: '$2'
          }}
        >
          {canCompile && (
            <Hotkeys
              keyName="command+b,ctrl+b"
              onKeyDown={() => !snap.compiling && snap.files.length && compileCode(snap.active)}
            >
                <Button
                  variant="primary"
                  uppercase
                  disabled={!snap.files.length}
                  isLoading={snap.compiling}
                  onClick={() => compileCode(snap.active)}
                >
                  <Play weight="bold" size="16px" />
                  {activeFileExt === 'js' || activeFileExt === 'ts' ? 'Compile' : 'Compile to Wasm'}
                </Button>
                {activeFileExt === 'js' || activeFileExt === 'ts' && (
                  <Popover content={<CompilerSettings />}>
                    <Button variant="primary" css={{ px: '10px' }}>
                      <Gear size="16px" />
                    </Button>
                  </Popover>
                )}
            </Hotkeys>
          )}
          {activeFileExt === 'js' && (
            <Hotkeys
              keyName="command+b,ctrl+b"
              onKeyDown={() => !snap.compiling && snap.files.length && compileCode(snap.active)}
            >
                <RunScript file={activeFile as IFile} />
            </Hotkeys>
          )}
        </Flex>
      </main>
      <Flex css={{ width: '100%' }}>
        <Flex
          css={{
            flex: 1,
            background: '$mauve1',
            position: 'relative',
            borderRight: '1px solid $mauve8'
          }}
        >
          <LogBox title="Development Log" clearLog={() => (state.logs = [])} logs={snap.logs} />
        </Flex>
        {activeFileExt === 'js' && (
          <Flex
            css={{
              flex: 1
            }}
          >
            <LogBox
              Icon={FileJs}
              title="Script Log"
              logs={snap.scriptLogs}
              clearLog={() => (state.scriptLogs = [])}
            />
          </Flex>
        )}
      </Flex>
    </Split>
  )
}

export default Home
