import ImportClient from './ImportClient'
import { SECTIONS, skillsTageMage } from '@/exams/tagemage'
import { PARTS, skillsToeic } from '@/exams/toeic'

export const dynamic = 'force-dynamic'

export default async function PageImport({
  searchParams,
}: {
  searchParams: Promise<{ exam?: string; section?: string }>
}) {
  const { exam, section } = await searchParams
  const examId = exam === 'toeic_lr' ? 'toeic_lr' : 'tagemage'

  const sections =
    examId === 'toeic_lr'
      ? PARTS.map((p) => ({ id: p.id, libelle: `Part ${p.numero} — ${p.libelle}` }))
      : SECTIONS.map((s) => ({ id: s.id, libelle: `${s.numero}. ${s.libelle}` }))

  const skills = (examId === 'toeic_lr' ? skillsToeic() : skillsTageMage()).map((s) => ({
    id: s.id,
    section: s.section,
    libelle: s.libelle,
  }))

  return (
    <ImportClient
      examId={examId}
      sections={sections}
      skills={skills}
      sectionInitiale={section}
    />
  )
}
