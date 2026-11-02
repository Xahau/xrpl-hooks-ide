import toast from 'react-hot-toast'

import state from '../index'
import { defaultHookHeaders } from '../constants'
import { generateHookHeaders, ServerDefinitions } from '../../utils/generateHookHeaders'

/* updateHeaders fetches server_definitions from the connected network and
 * regenerates the Hook C headers in state.files from it.
 */
export const updateHeaders = async () => {
  try {
    const client = state.client
    const defs = await client.send({ command: 'server_definitions' }, { timeoutSeconds: 15 })
    if (client !== state.client) throw Error('Network changed while updating header files')
    if (defs?.error || !defs?.FIELDS) {
      throw Error(defs?.error_message || 'server_definitions failed')
    }
    const headers = generateHookHeaders(defs as unknown as ServerDefinitions, defaultHookHeaders)
    const models = state.editorCtx?.getModels()
    for (const [name, content] of Object.entries(headers)) {
      const file = state.files.find(f => f.name === name)
      if (file) {
        file.content = content
      } else {
        state.files.push({ name, language: 'c', content })
      }
      // keep an already open editor model in sync
      models?.find(m => m.uri.path.endsWith('/' + name))?.setValue(content)
    }
    state.logs.push({ type: 'success', message: `Header files updated from ${state.network.name}` })
    if (!defs.HOOK) {
      state.logs.push({
        type: 'warning',
        message: `${state.network.name} does not expose Hook API definitions (server_definitions has no HOOK section); extern.h, error.h and hookapi.h use the bundled xahaud defaults.`
      })
    }
    toast.success('Header files updated')
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to update header files'
    state.logs.push({ type: 'error', message })
    toast.error(message)
  }
}
