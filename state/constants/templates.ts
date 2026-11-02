import Carbon from '../../components/icons/Carbon'
import Firewall from '../../components/icons/Firewall'
import Notary from '../../components/icons/Notary'
import Peggy from '../../components/icons/Peggy'
import Starter from '../../components/icons/Starter'

/** Repository that holds templates/<id>/ for every template below; the IDE adds its bundled headers. */
export const templatesRepo = { owner: 'tequdev', repo: 'hooks-ide-templates', ref: 'main' }

type Template = {
  /** Directory name under templates/ in the repository, also the /develop/<id> route. */
  id: string
  name: string
  description: string
  icon: () => JSX.Element
}

export const templateFileIds: Record<string, Template> = {
  starter: {
    id: 'starter',
    name: 'Starter',
    description:
      'Just a basic starter with essential imports, just accepts any transaction coming through',
    icon: Starter
  },
  firewall: {
    id: 'firewall',
    name: 'Firewall',
    description: 'This Hook essentially checks a blacklist of accounts',
    icon: Firewall
  },
  notary: {
    id: 'notary',
    name: 'Notary',
    description: 'Collecting signatures for multi-sign transactions',
    icon: Notary
  },
  carbon: {
    id: 'carbon',
    name: 'Carbon',
    description: 'Send a percentage of sum to an address',
    icon: Carbon
  },
  peggy: {
    id: 'peggy',
    name: 'Peggy',
    description: 'An oracle based stable coin hook',
    icon: Peggy
  }
}

export const apiHeaderFiles = [
  'hookapi.h',
  'sfcodes.h',
  'macro.h',
  'extern.h',
  'error.h',
  'tts.h',
  'ls_flags.h',
  'tx_flags.h'
]
