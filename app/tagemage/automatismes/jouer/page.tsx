import { notFound } from 'next/navigation'
import { estFormat, jeu } from '@/core/automatismes'
import { recordDe } from '@/core/db/automatismes'
import JeuClient from './JeuClient'

export const dynamic = 'force-dynamic'

export default async function PageJouer({
  searchParams,
}: {
  searchParams: Promise<{ jeu?: string; format?: string }>
}) {
  const { jeu: id, format } = await searchParams
  const j = id ? jeu(id) : undefined
  if (!j || !estFormat(format)) notFound()

  return <JeuClient key={`${j.id}-${format}`} jeuId={j.id} format={format} record={recordDe(j.id, format)} />
}
