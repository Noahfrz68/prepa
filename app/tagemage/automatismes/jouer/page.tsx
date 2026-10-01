import { notFound } from 'next/navigation'
import { estFormat, estJeuPartie } from '@/core/automatismes'
import { etatsFaits, recordDe } from '@/core/db/automatismes'
import JeuClient from './JeuClient'

export const dynamic = 'force-dynamic'

export default async function PageJouer({
  searchParams,
}: {
  searchParams: Promise<{ jeu?: string; format?: string }>
}) {
  const { jeu, format } = await searchParams
  if (!estJeuPartie(jeu) || !estFormat(format)) notFound()

  return (
    <JeuClient
      key={`${jeu}-${format}`}
      jeuId={jeu}
      format={format}
      record={recordDe(jeu, format)}
      etats={etatsFaits()}
    />
  )
}
