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

export const templateFileIds: Record<string, Template> = {
  starter: {
    id: '93079dde7e7376fe7e1102409b696e0c', // Forked
    name: 'Starter',
    description:
      'Just a basic starter with essential imports, just accepts any transaction coming through',
    headerId: '028e8ce6d6d674776970caf8acc77ecc',
    icon: Starter
  },
}

export const apiHeaderFiles = []
