import { decimal } from '@/app/_composants/nombres'
import type { FormatPartie } from '@/core/automatismes'
import type { Conseil, FormatEnregistre, MeilleurScore } from '@/core/db/automatismes'

/** « 3,4 s » sous la minute, « 1 min 12 s » au-delà. */
export function chronoLisible(ms: number): string {
  if (ms < 60_000) return `${decimal(ms / 1000, 1)} s`
  const s = Math.round(ms / 1000)
  return `${Math.floor(s / 60)} min ${String(s % 60).padStart(2, '0')} s`
}

/** « 23 justes » au chrono, « 19/20 en 1 min 12 s » en série et au défi. */
export function scoreLisible(format: FormatEnregistre, r: Pick<MeilleurScore, 'justes' | 'nb' | 'dureeMs'>): string {
  return format === 'chrono'
    ? `${r.justes} juste${r.justes > 1 ? 's' : ''}`
    : `${r.justes}/${r.nb} en ${chronoLisible(r.dureeMs)}`
}

export function lienJeu(jeu: string, format: FormatPartie): string {
  return `/tagemage/automatismes/jouer?jeu=${jeu}&format=${format}`
}

export const LIEN_DEFI = '/tagemage/automatismes/jouer?defi=1'

/** « 4 erreurs récentes en pourcentages et variations » */
export function motifConseil(c: Conseil): string {
  const n = c.motif.erreurs
  return `${n} erreur${n > 1 ? 's' : ''} récente${n > 1 ? 's' : ''} en ${c.motif.libelle}`
}
