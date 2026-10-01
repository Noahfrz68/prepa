import { lettre, rang } from '@/core/generation/alea'
import type { Jeu, Question } from '../types'

/**
 * Jeu 5 — le rang des lettres.
 *
 * Toute la logique alphanumérique passe par la conversion lettre ↔ rang ; la
 * compter sur ses doigts depuis A coûte cinq secondes à chaque fois. Trois
 * gestes : lettre → rang, rang → lettre, et le rang à rebours (Z = 1), qui
 * sert aux suites miroir.
 */

const TABLE = 'Repères d’alphabet'

/** Le repère le plus proche (E, J, O, T, Y), d'où l'on compte. */
function repere(r: number): string {
  const reperes = [1, 5, 10, 15, 20, 25, 26]
  const proche = reperes.reduce((m, x) => (Math.abs(x - r) < Math.abs(m - r) ? x : m))
  if (proche === r) return `${lettre(r)} est un repère : ${r}.`
  const ecart = r - proche
  const sens = ecart > 0 ? `+ ${ecart}` : `− ${-ecart}`
  return `Repère ${lettre(proche)} = ${proche}, puis ${sens} → ${lettre(r)} = ${r}. Repères : E 5, J 10, O 15, T 20, Y 25.`
}

export const lettres: Jeu = {
  id: 'lettres',
  nom: 'Rang des lettres',
  description: 'A = 1 … Z = 26, dans les deux sens, et à rebours.',
  seuilLentMs: 5000,
  produire(a): Question {
    const r = a.entier(1, 26)
    const l = lettre(r)
    const genre = a.entier(0, 4)

    if (genre <= 1) {
      return {
        jeu: 'lettres',
        cle: `rang:${l}`,
        enonce: `Rang de ${l} ?`,
        attendu: { genre: 'nombre', valeur: r },
        saisie: 'nombre',
        reponse: String(r),
        solution: `${l} = ${r}`,
        astuce: repere(r),
        table: TABLE,
      }
    }
    if (genre <= 3) {
      return {
        jeu: 'lettres',
        cle: `lettre:${r}`,
        enonce: `Lettre de rang ${r} ?`,
        attendu: { genre: 'lettre', valeur: l },
        saisie: 'texte',
        reponse: l,
        solution: `${r} = ${l}`,
        astuce: repere(r),
        table: TABLE,
      }
    }
    const inverse = 27 - r
    return {
      jeu: 'lettres',
      cle: `rebours:${l}`,
      enonce: `Rang de ${l} à rebours (Z = 1) ?`,
      attendu: { genre: 'nombre', valeur: inverse },
      saisie: 'nombre',
      reponse: String(inverse),
      solution: `${l} à rebours = ${inverse}`,
      astuce: `À rebours, rang → 27 − rang : ${l} = ${rang(l)}, donc 27 − ${rang(l)} = ${inverse}. C'est aussi le rang de sa symétrique, ${lettre(inverse)}.`,
      table: TABLE,
    }
  },
}
