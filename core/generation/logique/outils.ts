/**
 * Ce que partagent les seize familles de logique.
 *
 * Rien ici ne produit de question : ce sont les gestes que chaque famille
 * refait — convertir une lettre en rang, poser une case, décrire une série en
 * clair pour la correction.
 */

import { ALPHABET, lettre, rang, type Alea } from '../alea'
import { qcmTexte, type Diagnostics, type LeurreTexte } from '../qcm'
import type { Lettre } from '../types'
import { decrireCase } from '@/core/figures/decrire'
import type { Case, Forme } from '@/core/figures/types'

export { ALPHABET, lettre, rang }

/** Groupe de lettres décalé de `pas` rangs, chaque lettre indépendamment. */
export function decaler(groupe: string, pas: number): string {
  return [...groupe].map((c) => lettre(rang(c) + pas)).join('')
}

export function groupeAleatoire(a: Alea, taille: number): string {
  return Array.from({ length: taille }, () => ALPHABET[a.entier(0, 25)]).join('')
}

/** Somme des chiffres d'un entier. */
export function sommeChiffres(n: number): number {
  return [...String(Math.abs(n))].reduce((s, c) => s + Number(c), 0)
}

/** Produit des chiffres d'un entier. */
export function produitChiffres(n: number): number {
  return [...String(Math.abs(n))].reduce((p, c) => p * Number(c), 1)
}

export function estCarre(n: number): boolean {
  if (n < 0) return false
  const r = Math.round(Math.sqrt(n))
  return r * r === n
}

export function estCube(n: number): boolean {
  const r = Math.round(Math.cbrt(n))
  return r * r * r === n
}

export function estPremier(n: number): boolean {
  if (n < 2) return false
  for (let d = 2; d * d <= n; d++) if (n % d === 0) return false
  return true
}

/** Un groupe de lettres écrit avec ses rangs, pour la correction. */
export function enRangs(groupe: string): string {
  return [...groupe].map((c) => `${c} = ${rang(c)}`).join(', ')
}

/** Une case de texte nu, sans cadre — comme les séries de l'épreuve. */
export function texte(v: string | number): Case {
  return { texte: String(v) }
}

/** La case cherchée. */
export const INCONNUE: Case = { inconnue: true }

/** Une rangée de cases de texte. */
export function rangee(valeurs: Array<string | number>, iInconnue = -1): Case[] {
  return valeurs.map((v, i) => (i === iInconnue ? INCONNUE : texte(v)))
}

export const FORMES: Forme[] = [
  'carre',
  'cercle',
  'triangle',
  'losange',
  'pentagone',
  'hexagone',
  'heptagone',
  'octogone',
  'etoile',
  'ovale',
  'fleche',
  'croix',
]

/** Nombre de côtés d'une forme. Zéro pour les formes rondes. */
export const COTES: Record<Forme, number> = {
  cercle: 0,
  ovale: 0,
  triangle: 3,
  carre: 4,
  losange: 4,
  rectangle: 4,
  pentagone: 5,
  hexagone: 6,
  heptagone: 7,
  octogone: 8,
  etoile: 10,
  fleche: 7,
  croix: 12,
}

/** Les formes à n côtés, pour les règles qui comptent les côtés. */
export function formesA(n: number): Forme[] {
  return FORMES.filter((f) => COTES[f] === n)
}

export const COINS = ['hg', 'hd', 'bd', 'bg'] as const
export type CoinFigure = (typeof COINS)[number]

/** Le coin obtenu après `q` quarts de tour dans le sens des aiguilles. */
export function tournerCoin(c: CoinFigure, q: number): CoinFigure {
  return COINS[(COINS.indexOf(c) + ((q % 4) + 4) % 4) % 4]
}

/* ------------------------------------------------- QCM à propositions dessinées -- */

/**
 * Cinq propositions dessinées, et leur texte.
 *
 * Le mélange se fait sur les DESCRIPTIONS, pas sur les cases : c'est la
 * description qui sert de clé pour la déduplication et pour la signature en
 * base. Les cases sont ensuite remises dans l'ordre tiré. Deux cases qui se
 * décriraient identiquement sont le même dessin — `decrireCase` est écrit pour
 * qu'elles ne le soient que si elles le sont vraiment.
 */
export function qcmFigure(
  a: Alea,
  bonne: Case,
  leurres: Array<[Case, string]>,
  secours?: () => Case,
): {
  options: string[]
  optionsFigure: Case[]
  bonneReponse: Lettre
  diagnostics: Diagnostics
} {
  const table = new Map<string, Case>()
  const enregistrer = (c: Case) => {
    const d = decrireCase(c)
    if (!table.has(d)) table.set(d, c)
    return d
  }

  const bonneD = enregistrer(bonne)
  const leurresT = leurres.map(([c, motif]): LeurreTexte => [enregistrer(c), motif])
  const r = qcmTexte(a, bonneD, leurresT, secours ? () => enregistrer(secours()) : undefined)

  return { ...r, optionsFigure: r.options.map((o) => table.get(o) as Case) }
}
