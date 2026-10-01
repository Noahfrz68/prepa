import { estPremier } from '@/core/generation/logique/outils'
import { chiffreExposant } from './ecriture'
import type { Attendu } from './types'

/**
 * Lire une réponse tapée vite, sans chicaner sur la forme.
 *
 * Le jeu mesure si le fait est su, pas si on a tapé la virgule réglementaire :
 * « 12,5 », « 12.5 », « 12,5 % » et « 12 , 5 » sont la même réponse. En
 * revanche le signe compte (« −4 » n'est pas « 4 ») et une fraction demandée
 * doit être écrite en fraction : taper 0,375 pour 3/8, c'est justement ne pas
 * avoir le réflexe.
 */

function normaliser(saisie: string): string {
  return saisie
    .trim()
    .replace(/[\s  ]+/g, '')
    .replace(/[−–]/g, '-')
    .replace(/,/g, '.')
}

/** Un nombre : entier, décimal (virgule ou point), ou fraction « a/b ». */
export function lireNombre(saisie: string): number | null {
  // « 12π » : les réponses en nombre de π se tapent avec ou sans le symbole.
  const s = normaliser(saisie).replace(/[%π]$/, '')
  const f = /^([+-]?\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?)$/.exec(s)
  if (f) {
    const d = Number(f[2])
    return d === 0 ? null : Number(f[1]) / d
  }
  return /^[+-]?(\d+\.?\d*|\.\d+)$/.test(s) ? Number(s) : null
}

/** Une fraction écrite comme telle, « a/b » en entiers. */
export function lireFraction(saisie: string): { numerateur: number; denominateur: number } | null {
  const f = /^([+-]?\d+)\/(\d+)$/.exec(normaliser(saisie))
  if (!f || Number(f[2]) === 0) return null
  return { numerateur: Number(f[1]), denominateur: Number(f[2]) }
}

export function lireOuiNon(saisie: string): boolean | null {
  const s = normaliser(saisie).toLowerCase()
  if (['o', 'oui', 'y', 'yes', 'v', 'vrai', '1'].includes(s)) return true
  if (['n', 'non', 'no', 'f', 'faux', '0'].includes(s)) return false
  return null
}

/**
 * Une décomposition en facteurs premiers : « 2³ × 3² × 5 », « 2^3*3^2*5 »,
 * « 2 2 2 3 3 5 ». Rend le produit, ou null si un facteur n'est pas premier —
 * « 4 × 9 × 10 » vaut bien 360, mais ce n'est pas une décomposition.
 */
export function lireFacteurs(saisie: string): number | null {
  const s = saisie
    .trim()
    .replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]+/g, (e) => '^' + [...e].map(chiffreExposant).join(''))
  const morceaux = s.split(/[\s  ×xX*·.]+/).filter(Boolean)
  if (morceaux.length === 0) return null
  let produit = 1
  for (const m of morceaux) {
    const f = /^(\d+)(?:\^(\d+))?$/.exec(m)
    if (!f) return null
    const base = Number(f[1])
    if (!estPremier(base)) return null
    produit *= base ** Number(f[2] ?? 1)
  }
  return produit
}

/** Vrai si la saisie donne la réponse attendue. Une saisie illisible est fausse. */
export function verifier(attendu: Attendu, saisie: string): boolean {
  switch (attendu.genre) {
    case 'nombre': {
      const n = lireNombre(saisie)
      return n !== null && Math.abs(n - attendu.valeur) <= (attendu.tolerance ?? 1e-9)
    }
    case 'fraction': {
      const f = lireFraction(saisie)
      return f !== null && f.numerateur * attendu.denominateur === f.denominateur * attendu.numerateur
    }
    case 'lettre':
      return normaliser(saisie).toUpperCase() === attendu.valeur
    case 'ouinon':
      return lireOuiNon(saisie) === attendu.valeur
    case 'facteurs':
      return lireFacteurs(saisie) === attendu.valeur
    case 'choix':
      return saisie.trim() === String(attendu.valeur)
  }
}
