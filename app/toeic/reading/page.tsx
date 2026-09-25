import { notFound } from 'next/navigation'
import ReadingClient from './ReadingClient'
import { PARTS_READING } from '@/exams/toeic/epreuve'

export const dynamic = 'force-dynamic'

export default async function PageReading({
  searchParams,
}: {
  searchParams: Promise<{ part?: string; taille?: string }>
}) {
  const { part, taille } = await searchParams

  if (!part || !PARTS_READING.some((p) => p.id === part)) notFound()

  const n = Math.max(1, Math.min(100, Number(taille) || 15))

  return <ReadingClient part={part} taille={n} />
}
