/**
 * Une case, dite en français.
 *
 * Trois usages, et ils imposent tous la même exigence : être FIDÈLE. La
 * description sert de texte de repli quand le dessin ne peut pas s'afficher,
 * elle peuple le champ `options` en base — donc la signature qui empêche les
 * doublons — et elle se retrouve dans le carnet d'erreurs à côté de la réponse
 * cochée. Deux cases différentes qui se décriraient pareil feraient taire le
 * détecteur de doublons et rendraient une correction incompréhensible.
 */

import type { Ancre, Case, Forme, Trait } from './types'

const NOM_FORME: Record<Forme, string> = {
  carre: 'carré',
  rectangle: 'rectangle',
  cercle: 'cercle',
  ovale: 'ovale',
  triangle: 'triangle',
  losange: 'losange',
  pentagone: 'pentagone',
  hexagone: 'hexagone',
  heptagone: 'heptagone',
  octogone: 'octogone',
  etoile: 'étoile',
  fleche: 'flèche',
  croix: 'croix',
}

const NOM_ANCRE: Record<Ancre, string> = {
  hg: 'en haut à gauche',
  hd: 'en haut à droite',
  bg: 'en bas à gauche',
  bd: 'en bas à droite',
  h: 'en haut',
  b: 'en bas',
  g: 'à gauche',
  d: 'à droite',
  c: 'au centre',
}

const NOM_TRAIT: Record<Trait, string> = {
  montante: 'diagonale montante',
  descendante: 'diagonale descendante',
  verticale: 'trait vertical',
  horizontale: 'trait horizontal',
}

const NOM_ENSEIGNE = { pique: 'pique', coeur: 'cœur', carreau: 'carreau', trefle: 'trèfle' }

/** Description d'une case, en une ligne. */
export function decrireCase(c: Case): string {
  if (c.inconnue) return '?'

  const morceaux: string[] = []

  if (c.domino) morceaux.push(`domino ${c.domino[0]}|${c.domino[1]}`)
  if (c.carte) morceaux.push(`${c.carte.valeur} de ${NOM_ENSEIGNE[c.carte.enseigne]}`)

  if (c.forme) {
    const rot = c.rotation ? `, tourné de ${c.rotation}°` : ''
    morceaux.push(`${NOM_FORME[c.forme]}${rot}`)
  }

  if (c.lettre) morceaux.push(`portant « ${c.lettre} »`)

  if (c.quartiers) {
    const q: string[] = []
    if (c.quartiers.h !== undefined) q.push(`${c.quartiers.h} en haut`)
    if (c.quartiers.g !== undefined) q.push(`${c.quartiers.g} à gauche`)
    if (c.quartiers.d !== undefined) q.push(`${c.quartiers.d} à droite`)
    if (c.quartiers.b !== undefined) q.push(`${c.quartiers.b} en bas`)
    morceaux.push(`case barrée : ${q.join(', ')}`)
  }

  if (c.texte !== undefined && c.texte !== '') {
    const ou = c.position && c.position !== 'c' ? ` ${NOM_ANCRE[c.position]}` : ''
    morceaux.push(`${c.texte}${ou}`)
  }

  if (c.traits && c.traits.length > 0) {
    morceaux.push(c.traits.map((t) => NOM_TRAIT[t]).join(' + '))
  }

  if (c.pastilles && c.pastilles.length > 0) {
    morceaux.push(`point ${c.pastilles.map((p) => NOM_ANCRE[p]).join(' et ')}`)
  }

  // Une case vide se décrit : elle est parfois la bonne réponse.
  return morceaux.length > 0 ? morceaux.join(', ') : 'case vide'
}

/** Une série de cases, séparées par des tirets longs. */
export function decrireCases(cases: Case[]): string {
  return cases.map(decrireCase).join(' — ')
}
