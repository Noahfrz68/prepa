import ObjectifsClient from './ObjectifsClient'
import { etatExamens, profil } from '@/core/db/queries'

export const dynamic = 'force-dynamic'

const MAX: Record<string, number> = { tagemage: 600, toeic_lr: 990 }

export default function PageObjectifs() {
  const examens = etatExamens()
  const { heuresDispoSemaine } = profil()

  return (
    <ObjectifsClient
      initial={examens.map((e) => ({
        examId: e.examId,
        libelle: e.libelle,
        max: MAX[e.examId] ?? 600,
        dateExamen: e.dateExamen,
        dateProvisoire: e.dateProvisoire,
        scoreCible: e.scoreCible,
        motif: e.motif,
      }))}
      heuresInitiales={heuresDispoSemaine}
    />
  )
}
