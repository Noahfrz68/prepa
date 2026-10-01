import { notFound } from 'next/navigation'
import { estFormat, estJeuPartie, MELANGE } from '@/core/automatismes'
import { etatDefi, etatsFaits, jeuxConseilles, recordDe } from '@/core/db/automatismes'
import JeuClient from './JeuClient'

export const dynamic = 'force-dynamic'

export default async function PageJouer({
  searchParams,
}: {
  searchParams: Promise<{ jeu?: string; format?: string; defi?: string }>
}) {
  const { jeu, format, defi } = await searchParams

  if (defi === '1') {
    // Le jour du calendrier de l'appareil : sur le PC, celui du serveur local ;
    // sur l'iPhone, celui du navigateur — les deux sont l'heure de l'utilisateur.
    const etat = etatDefi()
    return (
      <JeuClient
        key={`defi-${etat.jour}`}
        jeuId={MELANGE.id}
        format="defi"
        record={etat.meilleur}
        etats={{}}
        defi={{ jour: etat.jour, dejaFait: etat.aujourdhui }}
      />
    )
  }

  if (!estJeuPartie(jeu) || !estFormat(format)) notFound()

  // Le Mélange penche vers les jeux que désignent les erreurs réelles.
  const poidsJeux = jeu === MELANGE.id ? Object.fromEntries(jeuxConseilles().map((c) => [c.jeu, 2])) : undefined

  return (
    <JeuClient
      key={`${jeu}-${format}`}
      jeuId={jeu}
      format={format}
      record={recordDe(jeu, format)}
      etats={etatsFaits()}
      poidsJeux={poidsJeux}
    />
  )
}
