import { nombre } from '@/core/generation/alea'

/**
 * Écrire les nombres des corrections : à la française, sans zéros inutiles.
 *
 * `pourcent` de alea.ts arrondit au dixième, ce qui convient aux énoncés mais
 * pas à une table à apprendre : 1/16 vaut 6,25 %, pas 6,3 %.
 */

const EXPOSANTS = '⁰¹²³⁴⁵⁶⁷⁸⁹'

/** « 2³ » : l'exposant en chiffres supérieurs. */
export function exposant(n: number): string {
  return [...String(n)].map((c) => EXPOSANTS[Number(c)]).join('')
}

/** Rang d'un chiffre supérieur, −1 s'il n'en est pas un. */
export function chiffreExposant(c: string): number {
  return EXPOSANTS.indexOf(c)
}

/** 1,2 et non 1,20 ; 12 et non 12,0 ; 6,25 gardé entier. */
export function court(x: number, decimales = 2): string {
  return nombre(x, decimales).replace(/(,\d*?)0+$/, '$1').replace(/,$/, '')
}

export function pc(x: number, decimales = 2): string {
  return `${court(x, decimales)} %`
}

/** « +20 % », « −4 % », « 0 % ». */
export function variation(t: number, decimales = 2): string {
  if (t === 0) return '0 %'
  return t > 0 ? `+${pc(t, decimales)}` : `−${pc(-t, decimales)}`
}
