import { Play, X } from 'phosphor-react'
import { HTMLInputTypeAttribute, useCallback, useEffect, useState } from 'react'
import state, { IAccount, IFile, ILog } from '../../state'
import Button from '../Button'
import Box from '../Box'
import Input, { Label } from '../Input'
import Stack from '../Stack'
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose
} from '../Dialog'
import Flex from '../Flex'
import { useSnapshot } from 'valtio'
import Select from '../Select'
import Text from '../Text'
import { saveFile } from '../../state/actions/saveFile'
import { getErrors, getTags } from '../../utils/comment-parser'
import toast from 'react-hot-toast'

const generateHtmlTemplate = async (code: string, data?: Record<string, any>) => {
  let processString: string | undefined
  const process = { env: { NODE_ENV: 'production' } } as any
  if (data) {
    Object.keys(data).forEach(key => {
      process.env[key] = data[key]
    })
  }

  processString = JSON.stringify(process)

  const libs = (await import("xrpl-accountlib/dist/browser.hook-bundle.js")).default;
  return `
  <html>
  <head>
    <script>
      var log = console.log;
      var errorLog = console.error;
      var infoLog = console.info;
      var warnLog = console.warn
      console.log = function(){
        var args = Array.from(arguments);
        parent.window.postMessage({ type: 'log', args: args || [] }, '*');
        log.apply(console, args);
      }
      console.error = function(){
        var args = Array.from(arguments);
        parent.window.postMessage({ type: 'error', args: args || [] }, '*');
        errorLog.apply(console, args);
      }
      console.info = function(){
        var args = Array.from(arguments);
        parent.window.postMessage({ type: 'info', args: args || [] }, '*');
        infoLog.apply(console, args);
      }
      console.warn = function(){
        var args = Array.from(arguments);
        parent.window.postMessage({ type: 'warning', args: args || [] }, '*');
        warnLog.apply(console, args);
      }

     
      var process = '${processString || '{}'}';
      process = JSON.parse(process);
      window.process = process

      function windowErrorHandler(event) {
        event.preventDefault() // to prevent automatically logging to console
        console.error(event.error?.toString())
      }

      window.addEventListener('error', windowErrorHandler);
    </script>
    <script>
      ${libs}
    </script>
    <script type="module">
      ${code}
    </script>
  </head>
  <body>
  </body>
  </html>
  `
}

type Fields = Record<
  string,
  {
    name: string
    value: string
    type?: 'Account' | `Account.${keyof IAccount}` | HTMLInputTypeAttribute
    description?: string
    required?: boolean
  }
>

const RunScript: React.FC<{ file: IFile }> = ({ file: { content, name } }) => {
  const snap = useSnapshot(state)
  const [templateError, setTemplateError] = useState('')
  const [fields, setFields] = useState<Fields>({})
  const [iFrameCode, setIframeCode] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const getFields = useCallback(() => {
    const inputTags = ['input', 'param', 'arg', 'argument']
    const tags = getTags(content)
      .filter(tag => inputTags.includes(tag.tag))
      .filter(tag => !!tag.name)

    let _fields = tags.map(tag => ({
      name: tag.name,
      value: tag.default || '',
      type: tag.type,
      description: tag.description,
      required: !tag.optional
    }))

    const fields: Fields = _fields.reduce((acc, field) => {
      acc[field.name] = field
      return acc
    }, {} as Fields)

    const error = getErrors(content)
    if (error) setTemplateError(error.message)
    else setTemplateError('')

    return fields
  }, [content])

  const runScript = useCallback(async () => {
    setIsLoading(true);
    try {
      // Show loading toast only after 1 second, otherwise skip it.
      let loaded = false
      let toastId: string | undefined;
      setTimeout(() => {
        if (!loaded) {
          toastId = toast.loading('Loading packages, may take a few seconds...', {
            position: 'bottom-center',
          })
        }
      }, 1000)

      let data: any = {}
      Object.keys(fields).forEach(key => {
        data[key] = fields[key].value
      })
      const template = await generateHtmlTemplate(content, data)
      setIframeCode(template)

      loaded = true
      if (toastId) {
        toast.dismiss(toastId)
      }
      state.scriptLogs = [{ type: 'success', message: 'Started running...' }]
    } catch (err) {
      state.scriptLogs = [
        ...snap.scriptLogs,
        // @ts-expect-error
        { type: 'error', message: err?.message || 'Could not parse template' }
      ]
    }
    setIsLoading(false);
  }, [content, fields, snap.scriptLogs])

  useEffect(() => {
    const handleEvent = (e: any) => {
      if (e.data.type === 'log' || e.data.type === 'error') {
        const data: ILog[] = e.data.args.map((msg: any) => ({
          type: e.data.type,
          message: typeof msg === 'string' ? msg : JSON.stringify(msg, null, 2)
        }))
        state.scriptLogs = [...snap.scriptLogs, ...data]
      }
    }
    window.addEventListener('message', handleEvent)
    return () => window.removeEventListener('message', handleEvent)
  }, [snap.scriptLogs])

  useEffect(() => {
    const defaultFields = getFields() || {}
    setFields(defaultFields)
  }, [content, setFields, getFields])

  const accOptions = snap.accounts?.map(acc => ({
    ...acc,
    label: acc.name,
    value: acc.address
  }))

  const isDisabled = Object.values(fields).some(field => field.required && !field.value)

  const handleRun = useCallback(async () => {
    if (isDisabled) return toast.error('Please fill in all the required fields.')

    state.scriptLogs = []
    await runScript();
    setIsDialogOpen(false)
  }, [isDisabled, runScript])

  return (
    <>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button
            variant="primary"
            onClick={() => {
              saveFile(false)
              setIframeCode('')
            }}
          >
            <Play weight="bold" size="16px" /> Run Script
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogTitle>Run {name} script</DialogTitle>
          <DialogDescription>
            <Box>
              You are about to run scripts provided by the developer of the hook, make sure you
              trust the author before you continue.
            </Box>
            {templateError && (
              <Box
                as="span"
                css={{
                  display: 'block',
                  color: '$error',
                  mt: '$3',
                  whiteSpace: 'pre'
                }}
              >
                {templateError}
              </Box>
            )}
            {Object.keys(fields).length > 0 && (
              <Box css={{ mt: '$4', mb: 0 }}>
                Fill in the following parameters to run the script.
              </Box>
            )}
          </DialogDescription>

          <Stack css={{ width: '100%' }}>
            {Object.keys(fields).map(key => {
              const { name, value, type, description, required } = fields[key]

              const isAccount = type?.startsWith('Account')
              const isAccountSecret = type === 'Account.secret'

              const accountField = (isAccount && type?.split('.')[1]) || 'address'

              return (
                <Box key={name} css={{ width: '100%' }}>
                  <Label css={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>
                      {description || name} {required && <Text error>*</Text>}
                    </span>
                    {isAccountSecret && (
                      <Text error small css={{ alignSelf: 'end' }}>
                        can access account secret key
                      </Text>
                    )}
                  </Label>
                  {isAccount ? (
                    <Select
                      css={{ mt: '$1' }}
                      options={accOptions}
                      onChange={(val: any) => {
                        setFields({
                          ...fields,
                          [key]: {
                            ...fields[key],
                            value: val[accountField]
                          }
                        })
                      }}
                      value={accOptions.find((acc: any) => acc[accountField] === value)}
                    />
                  ) : (
                    <Input
                      type={type || 'text'}
                      value={value}
                      css={{ mt: '$1' }}
                      onChange={e => {
                        setFields({
                          ...fields,
                          [key]: { ...fields[key], value: e.target.value }
                        })
                      }}
                    />
                  )}
                </Box>
              )
            })}
            <Flex css={{ justifyContent: 'flex-end', width: '100%', gap: '$3' }}>
              <DialogClose asChild>
                <Button outline>Cancel</Button>
              </DialogClose>
              <Button variant="primary" isDisabled={isDisabled || isLoading} isLoading={isLoading} onClick={handleRun}>
                Run script
              </Button>
            </Flex>
          </Stack>
          <DialogClose asChild>
            <Box
              css={{
                position: 'absolute',
                top: '$1',
                right: '$1',
                cursor: 'pointer',
                background: '$mauve1',
                display: 'flex',
                borderRadius: '$full',
                p: '$1'
              }}
            >
              <X size="20px" />
            </Box>
          </DialogClose>
        </DialogContent>
      </Dialog>
      {iFrameCode && (
        <iframe style={{ display: 'none' }} srcDoc={iFrameCode} sandbox="allow-scripts" />
      )}
    </>
  )
}

export default RunScript
