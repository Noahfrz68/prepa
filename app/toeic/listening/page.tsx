import { notFound } from 'next/navigation'
import ListeningClient from './ListeningClient'
import { PARTS_LISTENING_PAR_ID } from '@/exams/toeic/listening'

export const dynamic = 'force-dynamic'

export default async function PageListening({
  searchParams,
}: {
  searchParams: Promise<{ part?: string; groupes?: string }>
}) {
  const { part, groupes } = await searchParams

  if (!part || !PARTS_LISTENING_PAR_ID.has(part)) notFound()

  const n = Math.max(1, Math.min(20, Number(groupes) || 5))

  return <ListeningClient part={part} groupes={n} />
}
