import { aleaDepuis } from '@/core/generation/alea'
import { JEUX } from './index'
import type { Question } from './types'

/**
 * Le défi du jour : dix questions, les mêmes pour tout le monde un jour donné
 * — sur le PC comme sur l'iPhone, sans qu'ils se parlent. La graine est la
 * date ; la répétition n'y entre pas (elle dépend de l'appareil), sinon les
 * deux défis divergeraient.
 *
 * Seule la première partie du jour compte, pour le score comme pour la série
 * de jours : on peut le rejouer pour s'entraîner, pas pour l'améliorer.
 */

export const QUESTIONS_DEFI = 10
/** Au moins autant de jeux différents dans un défi. */
export const JEUX_MIN_DEFI = 5

const JOUR = /^\d{4}-\d{2}-\d{2}$/

export function estJour(j: unknown): j is string {
  return typeof j === 'string' && JOUR.test(j) && !Number.isNaN(Date.parse(`${j}T00:00:00Z`))
}

/** « 2026-10-01 » : le jour du calendrier local, celui de l'utilisateur. */
export function jourLocal(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Le jour d'avant ou d'après, en restant sur le calendrier (pas d'heure, pas de fuseau). */
export function jourDecale(jour: string, n: number): string {
  const t = Date.parse(`${jour}T00:00:00Z`) + n * 86_400_000
  return new Date(t).toISOString().slice(0, 10)
}

export function defiDuJour(jour: string): Question[] {
  // La date en nombre (20261001), brassée pour que deux jours voisins ne
  // donnent pas des tirages voisins.
  const a = aleaDepuis(Math.imul(Number(jour.replace(/-/g, '')), 2654435761) >>> 0)
  // Un jeu n'entre dans le défi qu'à sa date : les défis d'avant restent ceux qui ont été joués.
  const disponibles = JEUX.filter((j) => !j.defiDepuis || j.defiDepuis <= jour)
  const jeux = [...a.melanger(disponibles).slice(0, JEUX_MIN_DEFI)]
  // Deux questions au plus par jeu : au-delà, un jeu à peu de faits (le
  // calendrier en a trois) reposerait le même.
  while (jeux.length < QUESTIONS_DEFI) {
    const j = a.choix(disponibles)
    if (jeux.filter((x) => x === j).length < 2) jeux.push(j)
  }

  const questions: Question[] = []
  for (const j of a.melanger(jeux)) {
    let q = j.produire(a)
    for (let essai = 0; essai < 50 && questions.some((x) => x.cle === q.cle); essai++) q = j.produire(a)
    questions.push(q)
  }
  return questions
}
