import VocabClient from './VocabClient'
import { cartesDues, etatVocabulaire, toutesLesCartes } from '@/core/db/vocabulaire'

export const dynamic = 'force-dynamic'

export default function PageVocabulaire() {
  return (
    <VocabClient
      etat={etatVocabulaire()}
      dues={cartesDues(undefined, 20)}
      toutes={toutesLesCartes()}
    />
  )
}
