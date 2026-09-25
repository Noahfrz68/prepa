import type { Alea } from './alea'
import { LETTRES, type Lettre } from './types'

/**
 * Un leurre, éventuellement accompagné du diagnostic qui va avec.
 *
 * `[valeur, « les taux ont été additionnés au lieu d'être composés »]` : la
 * famille sait déjà cela au moment où elle pose ses leurres — c'est même le
 * critère qui les distingue du bruit numérique. Le dire ici plutôt que dans un
 * commentaire permet de le rendre à la correction, en face de la proposition
 * effectivement cochée.
 */
export type Leurre = number | [valeur: number, diagnostic: string]
export type LeurreTexte = string | [valeur: string, diagnostic: string]

/** Ce que signifie chaque mauvaise proposition, par lettre. */
export type Diagnostics = Partial<Record<Lettre, string>>

function separer<T>(l: T | [T, string]): [T, string | undefined] {
  return Array.isArray(l) ? [l[0], l[1]] : [l, undefined]
}

/**
 * Assemble cinq propositions autour d'une réponse calculée.
 *
 * Les leurres sont donnés dans l'ordre de leur plausibilité : ce sont des
 * erreurs de méthode nommées (taux additionnés au lieu d'être composés, moyenne
 * prise pour la médiane), pas du bruit numérique. Un leurre absurde ne teste
 * rien — l'élève l'écarte sans réfléchir, et la question devient un QCM à trois
 * propositions.
 *
 * Les leurres égaux à la bonne réponse, ou égaux entre eux, sont écartés ; le
 * complément est tiré autour de la réponse, faute de mieux. Ce complément-là
 * n'a pas de diagnostic, et c'est normal : il ne correspond à aucune erreur de
 * méthode, seulement au besoin d'avoir cinq lignes.
 *
 * `minimum` borne le domaine de la grandeur cherchée. Un effectif, une durée,
 * une aire, un prix ne descendent pas sous zéro : une proposition négative s'y
 * élimine sans réfléchir, et la question se joue alors à quatre propositions.
 * Le cas s'est présenté pour de bon — « combien d'entiers divisibles par 3 mais
 * pas par 2 » proposait −72, parce que la formule du leurre « retrancher tous
 * les multiples de 2 » passe sous zéro dès que le second diviseur est petit.
 * La borne filtre les leurres explicites ET le complément.
 *
 * Elle reste facultative : une racine, une variation en pourcentage ou un écart
 * peuvent légitimement être négatifs, et le leurre de signe y est l'un des
 * meilleurs du sous-test.
 */
export function qcm(
  a: Alea,
  bonne: number,
  leurres: Leurre[],
  formater: (n: number) => string,
  options: { minimum?: number } = {},
): { options: string[]; bonneReponse: Lettre; diagnostics: Diagnostics } {
  const { minimum } = options
  const acceptable = (v: number) =>
    Number.isFinite(v) && (minimum === undefined || v >= minimum)

  if (!acceptable(bonne)) {
    throw new Error(`Réponse ${bonne} hors du domaine annoncé (minimum ${minimum}).`)
  }

  const valeurs: number[] = [bonne]
  const vus = new Set([formater(bonne)])
  // Le diagnostic suit sa valeur formatée : c'est elle qui survit au mélange.
  const motifs = new Map<string, string>()

  const ajouter = (v: number, motif?: string) => {
    if (!acceptable(v)) return
    const t = formater(v)
    if (vus.has(t)) return
    vus.add(t)
    valeurs.push(v)
    if (motif) motifs.set(t, motif)
  }

  for (const l of leurres) {
    if (valeurs.length === 5) break
    const [v, motif] = separer(l)
    ajouter(v, motif)
  }

  // Complément : on s'écarte de la réponse par pas croissants, en restant du
  // même ordre de grandeur pour que le leurre reste crédible.
  let ecart = 1
  while (valeurs.length < 5 && ecart < 5000) {
    const pas = Math.max(1, Math.round(Math.abs(bonne) * 0.1 * ecart)) || ecart
    ajouter(bonne + pas)
    if (valeurs.length < 5) ajouter(bonne - pas)
    ecart++
  }

  const melange = a.melanger(valeurs)
  const textes = melange.map(formater)
  const index = textes.indexOf(formater(bonne))

  return {
    options: textes,
    bonneReponse: LETTRES[index],
    diagnostics: parLettre(textes, motifs),
  }
}

/**
 * Même chose pour des propositions déjà textuelles (séries, suites, fractions).
 *
 * `secours` fournit des candidats supplémentaires quand les leurres proposés se
 * révèlent trop peu nombreux après déduplication — ce qui arrive dès que deux
 * erreurs différentes mènent au même résultat. Sans lui, une question sur
 * cinquante échouerait au tirage.
 */
export function qcmTexte(
  a: Alea,
  bonne: string,
  leurres: LeurreTexte[],
  secours?: () => string,
): { options: string[]; bonneReponse: Lettre; diagnostics: Diagnostics } {
  const valeurs = [bonne]
  const vus = new Set([bonne])
  const motifs = new Map<string, string>()

  const ajouter = (l: string, motif?: string) => {
    if (valeurs.length === 5 || vus.has(l)) return
    vus.add(l)
    valeurs.push(l)
    if (motif) motifs.set(l, motif)
  }

  for (const l of leurres) {
    const [v, motif] = separer(l)
    ajouter(v, motif)
  }

  for (let essai = 0; secours && valeurs.length < 5 && essai < 200; essai++) {
    ajouter(secours())
  }

  if (valeurs.length < 5) {
    throw new Error(
      `Pas assez de leurres distincts pour « ${bonne} » : ${valeurs.length} proposition(s).`,
    )
  }

  const melange = a.melanger(valeurs)
  return {
    options: melange,
    bonneReponse: LETTRES[melange.indexOf(bonne)],
    diagnostics: parLettre(melange, motifs),
  }
}

function parLettre(propositions: string[], motifs: Map<string, string>): Diagnostics {
  const d: Diagnostics = {}
  propositions.forEach((texte, i) => {
    const motif = motifs.get(texte)
    if (motif) d[LETTRES[i]] = motif
  })
  return d
}
