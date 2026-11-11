import dynamic from 'next/dynamic'
import Split from 'react-split'
import { useSnapshot } from 'valtio'
import { Box, Container, Flex, Tab, Tabs } from '../../components'
import Transaction from '../../components/Transaction'
import state, { renameTxState } from '../../state'
import { getSplit, saveSplit } from '../../state/actions/persistSplits'
import { transactionsState, modifyTxState } from '../../state'
import { useEffect, useState } from 'react'
import { FileJs } from 'phosphor-react'
import RunScript from '../../components/RunScript'

const DebugStream = dynamic(() => import('../../components/DebugStream'), {
  ssr: false
})

const LogBox = dynamic(() => import('../../components/LogBox'), {
  ssr: false
})
const Accounts = dynamic(() => import('../../components/Accounts'), {
  ssr: false
})

const Test = () => {
  // This and useEffect is here to prevent useLayoutEffect warnings from react-split
  const [showComponent, setShowComponent] = useState(false)
  const { transactionLogs } = useSnapshot(state)
  const { transactions, activeHeader } = useSnapshot(transactionsState)
  const snap = useSnapshot(state)
  useEffect(() => {
    setShowComponent(true)
  }, [])
  if (!showComponent) {
    return null
  }
  const hasScripts = Boolean(snap.files.filter(f => f.name.toLowerCase()?.endsWith('.js')).length)

  const renderNav = () => (
    <Flex css={{ gap: '$3' }}>
      {snap.files
        .filter(f => f.name.endsWith('.js'))
        .map(file => (
          <RunScript file={file} key={file.name} />
        ))}
    </Flex>
  )

  return (
    <Container css={{ px: 0 }}>
      <Split
        direction="vertical"
        sizes={
          hasScripts && getSplit('testVertical')?.length === 2
            ? [50, 20, 30]
            : hasScripts
              ? [50, 20, 50]
              : [50, 50]
        }
        gutterSize={4}
        gutterAlign="center"
        style={{ height: 'calc(100vh - 60px)' }}
        onDragEnd={e => saveSplit('testVertical', e)}
      >
        <Flex
          row
          fluid
          css={{
            justifyContent: 'center',
            p: '$3 $2'
          }}
        >
          <Split
            direction="horizontal"
            sizes={getSplit('testHorizontal') || [50, 50]}
            minSize={[180, 320]}
            gutterSize={4}
            gutterAlign="center"
            style={{
              display: 'flex',
              flexDirection: 'row',
              width: '100%',
              height: '100%'
            }}
            onDragEnd={e => saveSplit('testHorizontal', e)}
          >
            <Box css={{ width: '55%', px: '$2' }}>
              <Tabs
                label="Transaction"
                activeHeader={activeHeader}
                // TODO make header a required field
                onChangeActive={(idx, header) => {
                  if (header) transactionsState.activeHeader = header
                }}
                keepAllAlive
                defaultExtension="json"
                allowedExtensions={['json']}
                onCreateNewTab={header => modifyTxState(header, {})}
                onRenameTab={(idx, nwName, oldName = '') => renameTxState(oldName, nwName)}
                onCloseTab={(idx, header) => header && modifyTxState(header, undefined)}
              >
                {transactions.map(({ header, state }) => (
                  <Tab key={header} header={header}>
                    <Transaction state={state} header={header} />
                  </Tab>
                ))}
              </Tabs>
            </Box>
            <Box css={{ width: '45%', mx: '$2', height: '100%' }}>
              <Accounts card hideDeployBtn showHookStats />
            </Box>
          </Split>
        </Flex>
        {hasScripts ? (
          <Flex
            as="div"
            css={{
              borderTop: '1px solid $mauve6',
              background: '$mauve1',
              flexDirection: 'column'
            }}
          >
            <LogBox
              Icon={FileJs}
              title="Helper scripts"
              logs={snap.scriptLogs}
              clearLog={() => (state.scriptLogs = [])}
              renderNav={renderNav}
            />
          </Flex>
        ) : null}
        <Flex>
          <Split
            direction="horizontal"
            sizes={[50, 50]}
            minSize={[320, 160]}
            gutterSize={4}
            gutterAlign="center"
            style={{
              display: 'flex',
              flexDirection: 'row',
              width: '100%',
              height: '100%'
            }}
          >
            <Box
              css={{
                borderRight: '1px solid $mauve8',
                height: '100%'
              }}
            >
              <LogBox
                title="Development Log"
                logs={transactionLogs}
                clearLog={() => (state.transactionLogs = [])}
              />
            </Box>
            <Box css={{ height: '100%' }}>
              <DebugStream />
            </Box>
          </Split>
        </Flex>
      </Split>
    </Container>
  )
}

export default Test
