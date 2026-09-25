import WritingClient from './WritingClient'
import { estimationWriting, historiqueProductions, sujets } from '@/core/db/writing'
import { iaDisponible } from '@/core/ia/fournisseurs'

export const dynamic = 'force-dynamic'

export default function PageWriting() {
  return (
    <WritingClient
      sujets={sujets()}
      historique={historiqueProductions(15)}
      estimation={estimationWriting()}
      iaDisponible={iaDisponible()}
    />
  )
}
