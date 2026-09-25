import AtelierClient from './AtelierClient'
import { doublons, etatAtelier, fileRelecture } from '@/core/db/contenu'
import { etatGeneration } from '@/core/db/generation'

export const dynamic = 'force-dynamic'

export default function PageAtelier() {
  return (
    <AtelierClient
      fileInitiale={fileRelecture(20)}
      etat={etatAtelier()}
      generationInitiale={etatGeneration()}
      doublons={doublons(20).map((d) => ({
        enonce: d.enonce,
        sectionLibelle: d.sectionLibelle,
        ids: d.ids,
      }))}
    />
  )
}
