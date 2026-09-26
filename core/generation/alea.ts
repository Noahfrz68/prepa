/**
 * Tirage aléatoire reproductible.
 *
 * Le générateur doit pouvoir être rejoué à l'identique : sans graine, une
 * question fausse découverte à l'usage serait introuvable, et une régression
 * du générateur passerait inaperçue. Mulberry32 suffit largement ici — on tire
 * des énoncés, pas des clés.
 */
export interface Alea {
  /** Entier dans [min, max], bornes comprises. */
  entier(min: number, max: number): number
  /** Un élément au hasard. */
  choix<T>(liste: readonly T[]): T
  /** Copie mélangée, l'original est laissé intact. */
  melanger<T>(liste: readonly T[]): T[]
  /** Vrai avec la probabilité donnée. */
  chance(p: number): boolean
}

export function aleaDepuis(graine: number): Alea {
  let etat = graine >>> 0

  const suivant = () => {
    etat = (etat + 0x6d2b79f5) >>> 0
    let t = etat
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }

  const entier = (min: number, max: number) => min + Math.floor(suivant() * (max - min + 1))

  return {
    entier,
    choix: (liste) => liste[entier(0, liste.length - 1)],
    melanger: (liste) => {
      const copie = [...liste]
      for (let i = copie.length - 1; i > 0; i--) {
        const j = entier(0, i)
        ;[copie[i], copie[j]] = [copie[j], copie[i]]
      }
      return copie
    },
    chance: (p) => suivant() < p,
  }
}

/* --------------------------------------------------------- mise en forme -- */

/** Nombre à la française : espace aux milliers, virgule décimale. */
export function nombre(n: number, decimales = 0): string {
  const arrondi = Number(n.toFixed(decimales))
  const [entiere, frac] = Math.abs(arrondi).toFixed(decimales).split('.')
  const groupes = entiere.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  const signe = arrondi < 0 ? '−' : ''
  return frac ? `${signe}${groupes},${frac}` : `${signe}${groupes}`
}

/** Euros, sans décimale quand le montant est rond. */
export function euros(n: number): string {
  return `${nombre(n, Number.isInteger(n) ? 0 : 2)} €`
}

export function pourcent(n: number): string {
  return `${nombre(n, Number.isInteger(n) ? 0 : 1)} %`
}

/** Fraction réduite, présentée « a/b ». */
export function fraction(numerateur: number, denominateur: number): string {
  const d = pgcd(Math.abs(numerateur), Math.abs(denominateur))
  const n = numerateur / d
  const q = denominateur / d
  return q === 1 ? String(n) : `${n}/${q}`
}

export function pgcd(a: number, b: number): number {
  while (b) [a, b] = [b, a % b]
  return a || 1
}

export function ppcm(a: number, b: number): number {
  return (a * b) / pgcd(a, b)
}

/* ------------------------------------------------------------ alphabet -- */

export const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

/** Rang dans l'alphabet, de 1 à 26. */
export function rang(lettre: string): number {
  return ALPHABET.indexOf(lettre.toUpperCase()) + 1
}

/** Lettre de rang donné, en repliant modulo 26 : le rang 27 revient à A. */
export function lettre(rang: number): string {
  const i = (((rang - 1) % 26) + 26) % 26
  return ALPHABET[i]
}

/* ------------------------------------------------------------ français -- */

const VOYELLES = /^[AEIOUYÀÂÄÉÈÊËÎÏÔÖÙÛÜaeiouyàâäéèêëîïôöùûü]/

/** « de Marc » mais « d'Élodie » : l'élision se voit tout de suite à l'écran. */
export function de(nom: string): string {
  return VOYELLES.test(nom) ? `d'${nom}` : `de ${nom}`
}

/** Accord du nom qui suit un nombre : « 1 an », « 4 ans ». */
export function pluriel(n: number, singulier: string, pluriel = `${singulier}s`): string {
  return `${nombre(n)} ${Math.abs(n) < 2 ? singulier : pluriel}`
}

/** Majuscule initiale, pour un fragment réutilisé en tête de phrase. */
export function capitale(texte: string): string {
  return texte.charAt(0).toUpperCase() + texte.slice(1)
}

/**
 * Une majuscule en tête de CHAQUE phrase. Un scénario assemble plusieurs
 * phrases dont certaines commencent par un fragment en minuscule (« la
 * limitation de vitesse… est donc efficace ») : `capitale` ne corrigeait que
 * la première, et 37 énoncés portaient « …d'un tiers. la limitation… ».
 * Ne touche qu'une lettre qui suit un point final, d'exclamation ou
 * d'interrogation et une espace ; une variable (« x³ ») ou une abréviation
 * (« cf. ») n'apparaissent pas dans les scénarios où on l'applique.
 */
export function capitaliserPhrases(texte: string): string {
  return capitale(texte).replace(
    /([.!?][\s\u00a0]+)([a-zàâäéèêëîïôöûùüÿç])/g,
    (_, fin: string, lettre: string) => fin + lettre.toUpperCase(),
  )
}
