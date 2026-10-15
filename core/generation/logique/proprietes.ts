/**
 * Logique — les familles au niveau des annales.
 *
 * Mesuré sur les mêmes épreuves : 87 % de réussite sur la logique générée,
 * 31 % sur les annales. Les annales classées « suites » sont en fait des
 * croix dont chaque série obéit à une PROPRIÉTÉ des chiffres ou des lettres du
 * groupe (« la somme des chiffres fait 18 », « les deux premiers chiffres
 * forment le carré du troisième ») ; leurs matrices relient deux attributs
 * d'une même case (« le rang de la lettre égale le nombre de côtés »). Le
 * générateur, lui, tirait des progressions et des matrices qui se lisent à
 * l'œil.
 *
 * Trois familles, un même principe :
 *
 *   — la règle est tirée dans un CATALOGUE de propriétés ;
 *   — les exemples affichés sont tirés au hasard parmi tous les groupes qui la
 *     vérifient (pas les plus petits : 4, 9, 16, 25 se reconnaissent d'un œil) ;
 *   — chaque leurre vérifie UNE des deux règles, jamais aucune : on ne peut
 *     pas l'éliminer sans tester la seconde ;
 *   — garde-fou : quatre exemples peuvent partager par hasard une AUTRE
 *     propriété du catalogue. On les induit toutes, et on exige qu'une seule
 *     proposition reste valable quelle que soit celle qu'on retient.
 */

import type { Famille, QuestionGeneree } from '../types'
import { qcmTexte, type LeurreTexte } from '../qcm'
import { nombre, type Alea } from '../alea'
import type { Case, Figure, Forme } from '@/core/figures/types'
import { COTES, estPremier, lettre, qcmFigure, rang, texte } from './outils'

const S = 'logique' as const

/** Une règle instanciée : un test, et sa phrase pour la correction. */
export interface Regle<T> {
  id: string
  /** `i` : rang de la case dans sa série, pour les règles qui progressent. */
  test(x: T, i: number): boolean
  texte: string
  /** La règle dépend du rang de la case (une progression). */
  positionnelle?: boolean
}

/**
 * Une entrée du catalogue : `tirer` choisit des paramètres au hasard pour
 * poser une question ; `induire` retrouve la règle à partir d'exemples, comme
 * le ferait un candidat — c'est lui qui sert au garde-fou.
 */
export interface Modele<T> {
  id: string
  /**
   * Faux pour une propriété trop rare pour remplir une série (n-2n-2n : 122,
   * 244, 366, 488) : on ne la tire pas, mais on la cherche quand même dans
   * les exemples — un candidat pourrait la voir.
   */
  tirable?: boolean
  tirer(a: Alea): Regle<T> | null
  induire(exemples: Array<{ x: T; i: number }>): Regle<T> | null
}

/** Toutes les règles du catalogue que vérifient les exemples. */
export function induites<T>(catalogue: Modele<T>[], exemples: Array<{ x: T; i: number }>): Regle<T>[] {
  return catalogue.map((m) => m.induire(exemples)).filter((r): r is Regle<T> => r !== null)
}

/** Un modèle à paramètre lu sur le premier exemple, puis vérifié sur tous. */
function parametre<T>(
  id: string,
  lire: (x: T) => number | null,
  tirer: (a: Alea) => number | null,
  phrase: (p: number) => string,
): Modele<T> {
  const regle = (p: number): Regle<T> => ({ id, test: (x) => lire(x) === p, texte: phrase(p) })
  return {
    id,
    tirer: (a) => {
      const p = tirer(a)
      return p === null ? null : regle(p)
    },
    induire: (ex) => {
      const p = lire(ex[0].x)
      return p !== null && ex.every((e) => lire(e.x) === p) ? regle(p) : null
    },
  }
}

/** Un modèle sans paramètre : une propriété que tous vérifient. */
function propriete<T>(id: string, test: (x: T) => boolean, phrase: string, tirable = true): Modele<T> {
  const regle: Regle<T> = { id, test: (x) => test(x), texte: phrase }
  return { id, tirable, tirer: () => regle, induire: (ex) => (ex.every((e) => test(e.x)) ? regle : null) }
}

/**
 * Un modèle qui progresse : la valeur lue vaut `depart + pas × i`, i étant le
 * rang de la case dans sa série. Le pas se lit sur deux exemples.
 */
function progression<T>(
  id: string,
  lire: (x: T) => number,
  bornes: [number, number],
  phrase: (pas: number) => string,
): Modele<T> {
  const regle = (depart: number, pas: number): Regle<T> => ({
    id,
    test: (x, i) => lire(x) === depart + pas * i,
    texte: phrase(pas),
    positionnelle: true,
  })
  return {
    id,
    tirer: (a) => {
      const pas = a.choix([-2, -1, 1, 2])
      // Les cinq cases restent dans les bornes.
      const [lo, hi] = bornes
      const min = pas > 0 ? lo : lo - 4 * pas
      const max = pas > 0 ? hi - 4 * pas : hi
      return min > max ? null : regle(a.entier(min, max), pas)
    },
    induire: (ex) => {
      if (ex.length < 2) return null
      const [e0, e1] = ex
      const pas = (lire(e1.x) - lire(e0.x)) / (e1.i - e0.i)
      if (!Number.isInteger(pas) || pas === 0) return null
      const depart = lire(e0.x) - pas * e0.i
      const r = regle(depart, pas)
      return ex.every((e) => r.test(e.x, e.i)) ? r : null
    },
  }
}

/* -------------------------------------------------------------- nombres -- */

const ch = (n: number) => [Math.floor(n / 100), Math.floor(n / 10) % 10, n % 10]
const tousNombres = Array.from({ length: 900 }, (_, i) => 100 + i)

export const CATALOGUE_NOMBRES: Modele<number>[] = [
  parametre('somme', (n) => ch(n).reduce((s, d) => s + d, 0), (a) => a.entier(8, 20), (p) => `la somme des chiffres vaut ${p}`),
  parametre(
    'produit',
    (n) => ch(n).reduce((s, d) => s * d, 1) || null,
    (a) => a.choix([12, 18, 24, 30, 36, 48, 60, 72]),
    (p) => `le produit des chiffres vaut ${p}`,
  ),
  parametre(
    'raison',
    (n) => {
      const [x, y, z] = ch(n)
      return y - x === z - y && y !== x ? y - x : null
    },
    (a) => a.choix([-3, -2, -1, 1, 2, 3]),
    (k) => (Math.abs(k) === 1 ? `les trois chiffres se suivent, ${k > 0 ? 'en montant' : 'en descendant'}` : `les chiffres progressent de ${k > 0 ? '+' : '−'}${Math.abs(k)} en ${k > 0 ? 'montant' : 'descendant'}`),
  ),
  propriete('pairs', (n) => ch(n).every((d) => d % 2 === 0), 'tous les chiffres sont pairs'),
  propriete('impairs', (n) => ch(n).every((d) => d % 2 === 1), 'tous les chiffres sont impairs'),
  propriete('somme12', (n) => ch(n)[0] + ch(n)[1] === ch(n)[2], 'le troisième chiffre est la somme des deux premiers'),
  propriete('produit12', (n) => ch(n)[0] * ch(n)[1] === ch(n)[2], 'le troisième chiffre est le produit des deux premiers'),
  propriete('carre', (n) => Math.floor(n / 10) === ch(n)[2] ** 2, 'le nombre formé des deux premiers chiffres est le carré du troisième'),
  propriete('double', (n) => ch(n)[1] === 2 * ch(n)[0] && ch(n)[2] === 2 * ch(n)[0], 'les deux derniers chiffres valent chacun le double du premier', false),
  propriete('palindrome', (n) => ch(n)[0] === ch(n)[2] && ch(n)[1] !== ch(n)[0], 'le nombre se lit pareil dans les deux sens'),
  propriete('premier', estPremier, 'ce sont des nombres premiers'),
  parametre('multiple', (n) => [7, 11, 13].find((k) => n % k === 0) ?? null, (a) => a.choix([7, 11, 13]), (k) => `ce sont des multiples de ${k}`),
  progression('centaines', (n) => ch(n)[0], [1, 9], (p) => `le premier chiffre ${p > 0 ? 'augmente' : 'diminue'} de ${Math.abs(p)} d’une case à la suivante`),
  progression('unites', (n) => ch(n)[2], [0, 9], (p) => `le dernier chiffre ${p > 0 ? 'augmente' : 'diminue'} de ${Math.abs(p)} d’une case à la suivante`),
]

/* --------------------------------------------------------------- lettres -- */

const VOYELLES = new Set(['A', 'E', 'I', 'O', 'U', 'Y'])
const rs = (g: string) => [...g].map(rang)
const tousGroupes: string[] = []
for (let i = 1; i <= 26; i++) for (let j = 1; j <= 26; j++) for (let k = 1; k <= 26; k++) tousGroupes.push(lettre(i) + lettre(j) + lettre(k))

const ecart = (p: number, q: number, nom: string): Modele<string> =>
  parametre(
    `ecart${p}${q}`,
    (g) => {
      const d = rs(g)[q] - rs(g)[p]
      return d === 0 ? null : d
    },
    (a) => a.choix([-3, -2, -1, 1, 2, 3, 4]),
    (k) =>
      Math.abs(k) === 1
        ? `${nom} se suivent${k < 0 ? ' à rebours' : ''}`
        : `${nom} ont ${Math.abs(k)} rangs d’écart${k < 0 ? ', à rebours' : ''}`,
  )

export const CATALOGUE_LETTRES: Modele<string>[] = [
  ecart(0, 1, 'les deux premières lettres'),
  ecart(1, 2, 'les deux dernières lettres'),
  ecart(0, 2, 'la première et la troisième lettre'),
  propriete('voyelles', (g) => [...g].every((l) => VOYELLES.has(l)), 'le groupe ne contient que des voyelles'),
  propriete('milieu', (g) => VOYELLES.has(g[1]) && !VOYELLES.has(g[0]) && !VOYELLES.has(g[2]), 'seule la lettre du milieu est une voyelle'),
  propriete('decroissant', (g) => rs(g)[0] > rs(g)[1] && rs(g)[1] > rs(g)[2], 'les lettres sont rangées dans l’ordre alphabétique inverse'),
  propriete('symetrie', (g) => rs(g)[0] + rs(g)[2] === 27, 'la première et la troisième lettre sont symétriques dans l’alphabet (A↔Z, B↔Y…)'),
  progression('l1', (g) => rs(g)[0], [1, 26], (p) => `la première lettre ${p > 0 ? 'avance' : 'recule'} de ${Math.abs(p)} rang${Math.abs(p) > 1 ? 's' : ''} d’une case à la suivante`),
  progression('l2', (g) => rs(g)[1], [1, 26], (p) => `la deuxième lettre ${p > 0 ? 'avance' : 'recule'} de ${Math.abs(p)} rang${Math.abs(p) > 1 ? 's' : ''} d’une case à la suivante`),
  progression('l3', (g) => rs(g)[2], [1, 26], (p) => `la troisième lettre ${p > 0 ? 'avance' : 'recule'} de ${Math.abs(p)} rang${Math.abs(p) > 1 ? 's' : ''} d’une case à la suivante`),
]

/* ---------------------------------------------------------------- croix -- */

interface Croix<T> {
  h: Regle<T>
  v: Regle<T>
  ligne: Array<T | null>
  colonne: Array<T | null>
  iLigne: number
  iColonne: number
  reponse: T
  leurres: Array<[T, 'h' | 'v']>
}

/**
 * Pose une croix : deux règles distinctes du catalogue, cinq cases par série,
 * la réponse au croisement, quatre leurres qui ne vérifient qu'une règle.
 * Null si le tirage ne donne pas une question à réponse unique.
 */
export function poserCroix<T>(a: Alea, catalogue: Modele<T>[], univers: readonly T[]): Croix<T> | null {
  const [mh, mv] = a.melanger(catalogue.filter((m) => m.tirable !== false)).slice(0, 2)
  const h = mh.tirer(a)
  const v = mv.tirer(a)
  if (!h || !v) return null
  const iLigne = a.entier(1, 3)
  const iColonne = a.entier(1, 3)

  const reponses = univers.filter((x) => h.test(x, iLigne) && v.test(x, iColonne))
  if (reponses.length === 0) return null
  const reponse = a.choix(reponses)

  // Les exemples d'une série vérifient sa règle et PAS l'autre : sinon la
  // seconde règle se lirait aussi sur la première série.
  const serie = (r: Regle<T>, autre: Regle<T>, iAutre: number, iTrou: number): Array<T | null> | null => {
    const cases: Array<T | null> = []
    const pris = new Set<T>([reponse])
    const fixe = r.positionnelle ? null : univers.filter((x) => r.test(x, 0) && !autre.test(x, iAutre))
    for (let i = 0; i < 5; i++) {
      if (i === iTrou) {
        cases.push(null)
        continue
      }
      const possibles = (fixe ?? univers.filter((x) => r.test(x, i) && !autre.test(x, iAutre))).filter((x) => !pris.has(x))
      if (possibles.length === 0) return null
      const x = a.choix(possibles)
      pris.add(x)
      cases.push(x)
    }
    return cases
  }
  const ligne = serie(h, v, iColonne, iLigne)
  const colonne = serie(v, h, iLigne, iColonne)
  if (!ligne || !colonne) return null

  // Garde-fou : toutes les règles que les exemples permettent de lire.
  const exemples = (s: Array<T | null>) =>
    s.flatMap((x, i) => (x === null ? [] : [{ x, i }]))
  const H = induites(catalogue, exemples(ligne))
  const V = induites(catalogue, exemples(colonne))
  const valable = (x: T) => H.some((r) => r.test(x, iLigne)) && V.some((r) => r.test(x, iColonne))

  const affiches = new Set([...ligne, ...colonne])
  const leurresDe = (r: Regle<T>, iR: number, cote: 'h' | 'v'): Array<[T, 'h' | 'v']> =>
    a
      .melanger(univers.filter((x) => r.test(x, iR) && !valable(x) && !affiches.has(x) && x !== reponse))
      .slice(0, 4)
      .map((x) => [x, cote])
  // Deux de chaque côté si possible ; une règle rare (six nombres en tout)
  // n'en fournit parfois qu'un, et l'autre côté complète.
  const cotH = leurresDe(h, iLigne, 'h')
  const cotV = leurresDe(v, iColonne, 'v')
  const nH = Math.min(cotH.length, Math.max(2, 4 - cotV.length))
  const leurres = [...cotH.slice(0, nH), ...cotV.slice(0, 4 - nH)]
  if (leurres.length < 4) return null

  return { h, v, ligne, colonne, iLigne, iColonne, reponse, leurres }
}

function croixVersQuestion<T>(
  a: Alea,
  c: Croix<T>,
  ecrire: (x: T) => string,
  skillId: string,
  enonce: string,
  conseil: string,
): QuestionGeneree {
  const leurres: LeurreTexte[] = c.leurres.map(([x, cote]) => [
    ecrire(x),
    cote === 'h'
      ? `il vérifie la règle horizontale (${c.h.texte}), mais pas la verticale`
      : `il vérifie la règle verticale (${c.v.texte}), mais pas l’horizontale`,
  ])
  const { options, bonneReponse, diagnostics } = qcmTexte(a, ecrire(c.reponse), leurres)
  const cases = (s: Array<T | null>): Case[] => s.map((x) => (x === null ? { inconnue: true } : texte(ecrire(x))))
  const figure: Figure = { type: 'croix', ligne: cases(c.ligne), colonne: cases(c.colonne), iLigne: c.iLigne, iColonne: c.iColonne }
  const liste = (s: Array<T | null>) => s.filter((x): x is T => x !== null).map(ecrire).join(', ')

  return {
    section: S,
    skillId,
    typeItem: 'qcm',
    enonce,
    figure,
    options,
    bonneReponse,
    diagnostics,
    rappel: `Horizontale : ${c.h.texte}. Verticale : ${c.v.texte}. ${ecrire(c.reponse)} vérifie les deux.`,
    explication:
      `1. Chaque série obéit à une propriété de ses groupes, pas à une suite de calculs. ${conseil}\n` +
      `2. Série horizontale : ${liste(c.ligne)}. Règle : ${c.h.texte}.\n` +
      `3. Série verticale : ${liste(c.colonne)}. Règle : ${c.v.texte}.\n` +
      `4. La case du croisement appartient aux deux séries : il lui faut les DEUX règles. ` +
      `${ecrire(c.reponse)} est la seule proposition qui les vérifie.\n` +
      `Chaque leurre en vérifie une : dès qu'une proposition colle à la première règle, on croit avoir fini. ` +
      `Tester la seconde sauve le point.`,
    difficulte: 5,
  }
}

const croixChiffres: Famille = {
  skillId: 'tm.logique.croix_de_nombres',
  nom: 'croix — propriétés des chiffres',
  produire(a) {
    for (let essai = 0; essai < 30; essai++) {
      const c = poserCroix(a, CATALOGUE_NOMBRES, tousNombres)
      if (!c) continue
      // Les annales rangent ces croix tantôt en « croix », tantôt en « suites ».
      const skill = a.chance(0.5) ? 'tm.logique.croix_de_nombres' : 'tm.logique.suites_numeriques'
      return croixVersQuestion(
        a,
        c,
        (n) => nombre(n),
        skill,
        'Deux séries se croisent. Quel nombre peut appartenir aux deux séries à la fois ?',
        'On teste, sur les chiffres : leur somme, leur produit, s’ils se suivent, s’ils sont tous pairs, le lien entre les deux premiers et le dernier, puis ce qui change d’une case à l’autre.',
      )
    }
    throw new Error('croix de chiffres : pas de tirage à réponse unique')
  },
}

const croixLettres: Famille = {
  skillId: 'tm.logique.croix_de_lettres',
  nom: 'croix — propriétés des lettres',
  produire(a) {
    for (let essai = 0; essai < 30; essai++) {
      const c = poserCroix(a, CATALOGUE_LETTRES, tousGroupes)
      if (!c) continue
      const skill = a.chance(0.5) ? 'tm.logique.croix_de_lettres' : 'tm.logique.suites_de_lettres'
      return croixVersQuestion(
        a,
        c,
        (g) => g,
        skill,
        'Deux séries se croisent. Quel groupe peut appartenir aux deux séries à la fois ?',
        'On passe en rangs (A = 1… Z = 26) et on compare, dans chaque groupe, les lettres deux à deux ; puis on regarde ce qui change d’une case à l’autre.',
      )
    }
    throw new Error('croix de lettres : pas de tirage à réponse unique')
  },
}

/* --------------------------------------------- série croisée figure ↔ code -- */

/** Les formes à côtés droits, et leur nombre de côtés. */
const FORMES_COTES: Forme[] = ['triangle', 'carre', 'losange', 'pentagone', 'hexagone', 'heptagone', 'octogone']

export interface Vignette {
  forme: Forme
  code: string
}

const cotes = (v: Vignette) => COTES[v.forme]
/** « E », « B2 », « 31 » : lettre seule, lettre + chiffre, ou deux chiffres. */
const lettreSeule = (c: string) => /^[A-Z]$/.test(c)
const lettreChiffre = (c: string) => /^[A-Z][1-9]$/.test(c)
const deuxChiffres = (c: string) => /^[1-9][0-9]$/.test(c)

export interface Relation {
  id: string
  texte: string
  /** Les codes qui vérifient la relation pour un nombre de côtés donné. */
  codes(n: number): string[]
  test(v: Vignette): boolean
}

export const RELATIONS: Relation[] = [
  {
    id: 'rang',
    texte: 'le rang de la lettre dans l’alphabet est égal au nombre de côtés de la figure',
    codes: (n) => [lettre(n)],
    test: (v) => lettreSeule(v.code) && rang(v.code) === cotes(v),
  },
  {
    id: 'rang_double',
    texte: 'le rang de la lettre est le double du nombre de côtés',
    codes: (n) => (2 * n <= 26 ? [lettre(2 * n)] : []),
    test: (v) => lettreSeule(v.code) && rang(v.code) === 2 * cotes(v),
  },
  {
    id: 'rang_plus',
    texte: 'le rang de la lettre plus le chiffre donne le nombre de côtés',
    codes: (n) => Array.from({ length: n - 1 }, (_, i) => `${lettre(n - 1 - i)}${i + 1}`).filter((c) => /[1-9]$/.test(c)),
    test: (v) => lettreChiffre(v.code) && rang(v.code[0]) + Number(v.code[1]) === cotes(v),
  },
  {
    id: 'rang_moins',
    texte: 'le rang de la lettre moins le chiffre donne le nombre de côtés',
    codes: (n) => Array.from({ length: 9 }, (_, i) => i + 1).filter((d) => n + d <= 26).map((d) => `${lettre(n + d)}${d}`),
    test: (v) => lettreChiffre(v.code) && rang(v.code[0]) - Number(v.code[1]) === cotes(v),
  },
  {
    id: 'somme',
    texte: 'la somme des deux chiffres est égale au nombre de côtés',
    codes: (n) => Array.from({ length: 90 }, (_, i) => String(10 + i)).filter((c) => Number(c[0]) + Number(c[1]) === n),
    test: (v) => deuxChiffres(v.code) && Number(v.code[0]) + Number(v.code[1]) === cotes(v),
  },
  {
    id: 'produit',
    texte: 'le produit des deux chiffres est égal au nombre de côtés',
    codes: (n) => Array.from({ length: 90 }, (_, i) => String(10 + i)).filter((c) => Number(c[0]) * Number(c[1]) === n),
    test: (v) => deuxChiffres(v.code) && Number(v.code[0]) * Number(v.code[1]) === cotes(v),
  },
]

const vignette = (v: Vignette): Case => ({ forme: v.forme, lettre: v.code })
const nomForme = (f: Forme) =>
  ({ triangle: 'triangle', carre: 'carré', losange: 'losange', pentagone: 'pentagone', hexagone: 'hexagone', heptagone: 'heptagone', octogone: 'octogone' })[f as string] ?? f
/** « un hexagone », « l’hexagone », « le carré » */
const un = (f: Forme) => `un ${nomForme(f)}`
const le = (f: Forme) => (/^[aeiouyh]/.test(nomForme(f)) ? `l’${nomForme(f)}` : `le ${nomForme(f)}`)

const serieCroisee: Famille = {
  skillId: 'tm.logique.matrices_de_figures',
  nom: 'série croisée figure ↔ code',
  produire(a) {
    for (let essai = 0; essai < 40; essai++) {
      const rel = a.choix(RELATIONS)
      const tirerVignette = (exclues: Forme[] = []): Vignette | null => {
        const formes = FORMES_COTES.filter((f) => !exclues.includes(f) && rel.codes(COTES[f]).length > 0)
        if (formes.length === 0) return null
        const forme = a.choix(formes)
        return { forme, code: a.choix(rel.codes(COTES[forme])) }
      }
      const montrees: Vignette[] = []
      for (let i = 0; i < 3; i++) {
        const v = tirerVignette(montrees.map((m) => m.forme))
        if (v) montrees.push(v)
      }
      const reponse = tirerVignette(montrees.map((m) => m.forme))
      if (montrees.length < 3 || !reponse) continue

      // Garde-fou : toutes les relations que les trois cases vérifient.
      const lues = RELATIONS.filter((r) => montrees.every(r.test))
      const valable = (v: Vignette) => lues.some((r) => r.test(v))

      // Leurres : la bonne forme avec un code décalé, un code valable sur une
      // autre forme, la forme d'à côté…
      const candidats: Array<[Vignette, string]> = []
      for (const f of FORMES_COTES) {
        for (const code of rel.codes(COTES[f])) {
          if (f !== reponse.forme) candidats.push([{ forme: reponse.forme, code }, `ce code irait avec ${un(f)}, pas avec ${un(reponse.forme)}`])
        }
        for (const code of rel.codes(COTES[reponse.forme])) {
          if (COTES[f] !== COTES[reponse.forme]) candidats.push([{ forme: f, code }, `ce code irait avec ${COTES[reponse.forme]} côtés ; ${le(f)} en a ${COTES[f]}`])
        }
      }
      const vus = new Set([`${reponse.forme}|${reponse.code}`, ...montrees.map((m) => `${m.forme}|${m.code}`)])
      const leurres = a
        .melanger(candidats)
        .filter(([v]) => {
          const k = `${v.forme}|${v.code}`
          if (vus.has(k) || valable(v)) return false
          vus.add(k)
          return true
        })
        .slice(0, 4)
        .map(([v, motif]): [Case, string] => [vignette(v), motif])
      if (leurres.length < 4) continue

      const { options, optionsFigure, bonneReponse, diagnostics } = qcmFigure(a, vignette(reponse), leurres)
      const figure: Figure = { type: 'bande', cases: [...montrees.map(vignette), { inconnue: true }] }
      const detail = montrees.map((m) => `${nomForme(m.forme)} (${cotes(m)} côtés) portant « ${m.code} »`).join(' ; ')

      return {
        section: S,
        skillId: 'tm.logique.matrices_de_figures',
        typeItem: 'qcm',
        enonce: 'Les trois premières cases forment une série. Quelle case doit occuper la place du point d’interrogation ?',
        figure,
        options,
        optionsFigure,
        bonneReponse,
        diagnostics,
        rappel: `Règle : ${rel.texte}.`,
        explication:
          `1. Les formes et les codes changent tous d’une case à l’autre : la règle ne porte pas sur une progression, ` +
          `mais sur un LIEN entre la figure et son code, à l’intérieur de chaque case.\n` +
          `2. On compte les côtés et on traduit le code : ${detail}.\n` +
          `3. Le lien commun aux trois cases : ${rel.texte}.\n` +
          `4. La proposition qui le respecte : ${un(reponse.forme)} (${cotes(reponse)} côtés) portant « ${reponse.code} ».\n` +
          `Les leurres gardent une forme ou un code plausibles, mais le lien entre les deux est rompu.`,
        difficulte: 5,
      }
    }
    throw new Error('série croisée : pas de tirage à réponse unique')
  },
}

export const FAMILLES_PROPRIETES: Famille[] = [croixChiffres, croixLettres, serieCroisee]
