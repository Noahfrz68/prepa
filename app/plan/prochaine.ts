import type { TacheEnregistree } from '@/core/db/semaine'
import { lienTache } from './liens'

export interface Seance {
  libelle: string
  detail: string
  href: string
}

/**
 * La première tâche du plan qui n'est pas faite : c'est l'ordre du plan qui
 * décide. Partagé par l'accueil et le hub TAGE MAGE, pour qu'ils désignent
 * toujours la même séance.
 */
export function prochaineSeance(taches: TacheEnregistree[]): Seance | null {
  const t = taches.find((x) => !x.fait)
  if (!t) return null
  const unite = Math.round(t.minutes / Math.max(1, t.quantite))
  const reste =
    t.quantite > 1
      ? ` · ${t.quantite} ${t.type === 'cours' ? 'leçons' : 'séries'} prévues cette semaine`
      : ''
  return {
    libelle: t.libelle.replace(/^[0-9]+ séries? — /, 'Série — '),
    detail: `TAGE MAGE · ${unite} min${reste}`,
    href: lienTache(t),
  }
}
