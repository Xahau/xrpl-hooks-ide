import Carbon from '../../components/icons/Carbon'
import Firewall from '../../components/icons/Firewall'
import Notary from '../../components/icons/Notary'
import Peggy from '../../components/icons/Peggy'
import Starter from '../../components/icons/Starter'

type Template = {
  id: string
  name: string
  description: string
  headerId?: string
  icon: () => JSX.Element
}

export const templateCFileIds: Record<string, Template> = {
  starter: {
    id: '1f8109c80f504e6326db2735df2f0ad6', // Forked
    name: 'Starter',
    description:
      'Just a basic starter with essential imports, just accepts any transaction coming through',
    headerId: '028e8ce6d6d674776970caf8acc77ecc',
    icon: Starter
  },
  firewall: {
    id: '1cc30f39c8a0b9c55b88c312669ca45e', // Forked
    name: 'Firewall',
    description: 'This Hook essentially checks a blacklist of accounts',
    headerId: '028e8ce6d6d674776970caf8acc77ecc',
    icon: Firewall
  },
  notary: {
    id: '87b6f5a8c2f5038fb0f20b8b510efa10', // Forked
    name: 'Notary',
    description: 'Collecting signatures for multi-sign transactions',
    headerId: '028e8ce6d6d674776970caf8acc77ecc',
    icon: Notary
  },
  carbon: {
    id: '953662b22d065449f8ab6f69bc2afe41', // Forked
    name: 'Carbon',
    description: 'Send a percentage of sum to an address',
    headerId: '028e8ce6d6d674776970caf8acc77ecc',
    icon: Carbon
  },
  peggy: {
    id: '049784a83fa068faf7912f663f7b6471', // Forked
    name: 'Peggy',
    description: 'An oracle based stable coin hook',
    headerId: '028e8ce6d6d674776970caf8acc77ecc',
    icon: Peggy
  }
}

export const templateJSFileIds: Record<string, Template> = {
  starter: {
    id: '894137a0ebd67568c877237140f4586f',
    name: 'Starter',
    description:
      'Just a basic starter with essential imports, just accepts any transaction coming through',
    headerId: 'e64b8286f04b3ab84cab63ec3abd8771',
    icon: Starter
  },
  carbon: {
    id: '9fa48d4fba17b2bbe2148eb9c3f15914',
    name: 'Carbon',
    description: 'Send a percentage of sum to an address',
    headerId: 'e64b8286f04b3ab84cab63ec3abd8771',
    icon: Carbon
  }
}

export const apiHeaderFiles = ['hookapi.h', 'sfcodes.h', 'macro.h', 'extern.h', 'error.h']
