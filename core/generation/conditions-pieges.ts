/**
 * Sous-test 4 — Conditions minimales, version « pièges ».
 *
 * Les moules de conditions.ts fixent à la main le statut de six faits, et leurs
 * faits inutiles sont toujours des bornes : on apprend vite que « borne = ne
 * suffit pas », et on répond sans raisonner. Les annales jouent précisément
 * contre ce réflexe :
 *
 *   — une équation qui SEMBLE donner la valeur mais en admet deux,
 *     (a − 6)² = 1 ;
 *   — une borne ou une propriété qui SUFFIT, parce que l'inconnue est entière,
 *     que c'est un dé, ou que la question est fermée (« est-il majeur ? ») ;
 *   — une somme connue sans connaître les deux nombres.
 *
 * Ici, rien n'est étiqueté. Chaque question part d'un UNIVERS fini de valeurs
 * possibles, annoncé dans l'énoncé (un entier entre 10 et 60, deux entiers de
 * 1 à 15, trois dés…), d'une valeur secrète, et de faits tous vrais pour elle.
 * Le statut d'un fait se CALCULE : on garde les valeurs de l'univers qui le
 * vérifient, et il suffit si toutes donnent la même réponse. La lettre en
 * découle ; les pièges aussi, sans qu'on les fabrique un par un.
 */

import { nombre, type Alea } from './alea'
import { estPremier, sommeChiffres } from './logique/outils'
import type { Famille, Lettre, QuestionGeneree } from './types'

const S = 'conditions_minimales' as const

type Valeur = number[]

/**
 * Comment un fait se présente : « forte » s'il a l'air de donner la valeur
 * (une équation, un chiffre), « faible » s'il a l'air vague (une borne, une
 * propriété). Le piège, c'est quand l'apparence ment.
 */
type Apparence = 'forte' | 'faible'

export interface Fait {
  texte: string
  vrai: (v: Valeur) => boolean
  apparence: Apparence
  /**
   * Le fait recopie la quantité demandée (« x + y = 12 » pour « que vaut
   * x + y ? ») : juste, mais sans rien à raisonner. Gardé, mais rare.
   */
  directe?: boolean
}

export interface Univers {
  /** L'énoncé, domaine compris : il fait partie des données. */
  question: string
  valeurs: Valeur[]
  /** La réponse demandée pour une valeur : un nombre, un triplet, « oui »… */
  reponse: (v: Valeur) => string
  secret: Valeur
  faits: Fait[]
  /** Comment écrire une valeur dans la correction. */
  decrire: (v: Valeur) => string
  /** La question est fermée (oui / non). */
  fermee: boolean
  skillId: string
  /**
   * Un univers plus large, quand le domaine n'est pas annoncé en entier (des
   * âges) : un fait dont le statut changerait en élargissant les bornes
   * tiendrait à une limite que l'énoncé ne donne pas, et serait faux.
   */
  elargi?: Valeur[]
}

/* -------------------------------------------------------------- statut -- */

/** Les réponses distinctes que laissent les faits donnés. */
export function reponsesRestantes(u: Univers, faits: Fait[], valeurs = u.valeurs): Set<string> {
  return new Set(valeurs.filter((v) => faits.every((f) => f.vrai(v))).map(u.reponse))
}

export function suffit(u: Univers, faits: Fait[], valeurs = u.valeurs): boolean {
  return reponsesRestantes(u, faits, valeurs).size === 1
}

/** La lettre officielle, d'après le statut calculé des deux informations. */
export function lettre(u: Univers, f1: Fait, f2: Fait, valeurs = u.valeurs): Lettre {
  const s1 = suffit(u, [f1], valeurs)
  const s2 = suffit(u, [f2], valeurs)
  if (s1 && s2) return 'D'
  if (s1) return 'A'
  if (s2) return 'B'
  return suffit(u, [f1, f2], valeurs) ? 'C' : 'E'
}

/* ------------------------------------------------------------ univers -- */

const PRENOMS = ['Sarah', 'Karim', 'Élodie', 'Marc', 'Nadia', 'Julien', 'Rachel', 'Bilal', 'Inès', 'Hugo']

const chiffres = (n: number) => [Math.floor(n / 10), n % 10]
const carre = (n: number) => Number.isInteger(Math.sqrt(n))

/** Un entier dans un intervalle annoncé, ou un nombre à deux chiffres. */
export function universEntier(a: Alea): Univers {
  const deuxChiffres = a.chance(0.5)
  const [L, H] = deuxChiffres ? [10, 99] : (() => {
    const lo = a.entier(10, 50)
    return [lo, lo + a.entier(15, 40)]
  })()
  const valeurs = Array.from({ length: H - L + 1 }, (_, i) => [L + i])
  const s = a.entier(L, H)
  const domaine = deuxChiffres ? 'n est un nombre entier à deux chiffres.' : `n est un entier compris entre ${L} et ${H}.`

  // `recopie` : le fait qui répondrait mot pour mot à une question fermée
  // (« n est pair » pour « n est-il pair ? ») n'est pas une information.
  type Q = { texte: string; reponse: (v: Valeur) => string; fermee: boolean; recopie?: RegExp }
  const seuil = a.entier(L + 3, H - 3)
  const kq = a.choix([3, 4, 6])
  const questions: Q[] = [
    { texte: 'Que vaut n ?', reponse: ([n]) => String(n), fermee: false },
    { texte: 'Que vaut n ?', reponse: ([n]) => String(n), fermee: false },
    { texte: 'n est-il pair ?', reponse: ([n]) => (n % 2 === 0 ? 'oui' : 'non'), fermee: true, recopie: /^n est (pair|impair)/ },
    {
      texte: `n est-il un multiple de ${kq} ?`,
      reponse: ([n]) => (n % kq === 0 ? 'oui' : 'non'),
      fermee: true,
      recopie: new RegExp(`(multiple de|divisible par|par) ${kq}(?!\\d)`),
    },
    { texte: `n est-il supérieur à ${seuil} ?`, reponse: ([n]) => (n > seuil ? 'oui' : 'non'), fermee: true },
  ]
  const q = a.choix(questions)

  const faits: Fait[] = []
  const ajouter = (texte: string, vrai: (n: number) => boolean, apparence: Apparence) => {
    if (q.recopie?.test(texte)) return
    if (vrai(s)) faits.push({ texte, vrai: ([n]) => vrai(n), apparence })
  }

  ajouter(`n est ${s % 2 ? 'impair' : 'pair'}.`, (n) => n % 2 === s % 2, 'faible')
  for (const k of a.melanger([3, 4, 5, 6, 7, 9]).slice(0, 3)) {
    if (s % k === 0) ajouter(`n est un multiple de ${k}.`, (n) => n % k === 0, 'faible')
    else ajouter(`n n’est pas divisible par ${k}.`, (n) => n % k !== 0, 'faible')
    ajouter(`Le reste de la division de n par ${k} vaut ${s % k}.`, (n) => n % k === s % k, 'forte')
  }
  const m = a.entier(2, 4)
  ajouter(`n est un diviseur de ${nombre(s * m)}.`, (n) => (s * m) % n === 0, 'faible')
  if (s >= 10) {
    const [d, u] = chiffres(s)
    ajouter(`La somme des chiffres de n vaut ${d + u}.`, (n) => sommeChiffres(n) === d + u, 'forte')
    ajouter(`Le chiffre des unités de n est ${u}.`, (n) => n % 10 === u, 'forte')
    ajouter(`Le produit des chiffres de n vaut ${d * u}.`, (n) => chiffres(n)[0] * chiffres(n)[1] === d * u, 'forte')
    if (s < 100 && d !== u) {
      const ecart = Math.abs(10 * u + d - s)
      const plus = 10 * u + d > s
      ajouter(
        `En inversant ses deux chiffres, on obtient un nombre ${plus ? 'plus grand' : 'plus petit'} de ${ecart}.`,
        (n) => n < 100 && (plus ? 1 : -1) * (10 * (n % 10) + Math.floor(n / 10) - n) === ecart && n % 10 !== 0,
        'forte',
      )
    }
  }
  const bas = a.entier(Math.max(L, s - 8), s)
  const haut = a.entier(s, Math.min(H, s + 8))
  if (bas > L) ajouter(`n est supérieur ou égal à ${bas}.`, (n) => n >= bas, 'faible')
  if (haut < H) ajouter(`n est inférieur ou égal à ${haut}.`, (n) => n <= haut, 'faible')
  if (carre(s)) ajouter('n est un carré parfait.', carre, 'faible')
  if (estPremier(s)) ajouter('n est un nombre premier.', estPremier, 'faible')
  const dd = a.entier(1, 6)
  const c = a.chance(0.5) ? s + dd : s - dd
  ajouter(`(n − ${c})² = ${dd * dd}.`, (n) => (n - c) ** 2 === dd * dd, 'forte')

  return {
    question: `${domaine} ${q.texte}`,
    valeurs,
    reponse: q.reponse,
    secret: [s],
    faits,
    decrire: ([n]) => String(n),
    fermee: q.fermee,
    skillId: faits.some((f) => f.texte.startsWith('(n')) && a.chance(0.5)
      ? 'tm.conditions_minimales.pieges_de_signe_et_cas_particuliers'
      : 'tm.conditions_minimales.cm_arithmetique_et_divisibilite',
  }
}

/** Deux entiers x et y, de 1 à M : on demande x, x + y, xy, ou leur ordre. */
export function universCouple(a: Alea): Univers {
  const M = a.entier(10, 15)
  const valeurs: Valeur[] = []
  for (let x = 1; x <= M; x++) for (let y = 1; y <= M; y++) valeurs.push([x, y])
  let x = a.entier(2, M)
  let y = a.entier(1, M)
  while (y === x) y = a.entier(1, M)
  ;[x, y] = a.chance(0.6) && x < y ? [y, x] : [x, y]

  type Q = { texte: string; reponse: (v: Valeur) => string; fermee: boolean }
  const questions: Q[] = [
    { texte: 'Que vaut x ?', reponse: ([p]) => String(p), fermee: false },
    { texte: 'Que vaut x + y ?', reponse: ([p, q]) => String(p + q), fermee: false },
    { texte: 'Que vaut x + y ?', reponse: ([p, q]) => String(p + q), fermee: false },
    { texte: 'Que vaut le produit xy ?', reponse: ([p, q]) => String(p * q), fermee: false },
    { texte: 'x est-il supérieur à y ?', reponse: ([p, q]) => (p > q ? 'oui' : 'non'), fermee: true },
  ]
  const q = a.choix(questions)

  const faits: Fait[] = []
  const ajouter = (texte: string, vrai: (p: number, q: number) => boolean, apparence: Apparence, directe = false) => {
    if (vrai(x, y)) faits.push({ texte, vrai: ([p, r]) => vrai(p, r), apparence, directe })
  }
  const signe = (n: number) => (n < 0 ? `−${nombre(-n)}` : nombre(n))
  const demande = q.texte
  ajouter(`x + y = ${x + y}.`, (p, r) => p + r === x + y, 'forte', demande.includes('x + y'))
  ajouter(`x − y = ${signe(x - y)}.`, (p, r) => p - r === x - y, 'forte')
  ajouter(`xy = ${x * y}.`, (p, r) => p * r === x * y, 'forte', demande.includes('xy'))
  ajouter(`x² − y² = ${signe(x * x - y * y)}.`, (p, r) => p * p - r * r === x * x - y * y, 'forte')
  ajouter(`x² + y² = ${x * x + y * y}.`, (p, r) => p * p + r * r === x * x + y * y, 'forte')
  ajouter(`(x + y)² = ${(x + y) ** 2}.`, (p, r) => (p + r) ** 2 === (x + y) ** 2, 'forte', demande.includes('x + y'))
  ajouter(`x + 2y = ${x + 2 * y}.`, (p, r) => p + 2 * r === x + 2 * y, 'forte')
  if (x % y === 0) ajouter(`x = ${x / y === 1 ? '' : x / y}y.`, (p, r) => p === (x / y) * r, 'forte')
  // Sur la question de l'ordre, ce fait serait la réponse recopiée.
  if (!q.fermee) ajouter(x > y ? 'x est supérieur à y.' : 'x est inférieur à y.', (p, r) => (x > y ? p > r : p < r), 'faible')
  ajouter(`x est ${x % 2 ? 'impair' : 'pair'}, y est ${y % 2 ? 'impair' : 'pair'}.`, (p, r) => p % 2 === x % 2 && r % 2 === y % 2, 'faible')
  ajouter(`x et y sont ${x % y === 0 || y % x === 0 ? 'multiples l’un de l’autre' : 'premiers entre eux'}.`,
    (p, r) => (x % y === 0 || y % x === 0 ? p % r === 0 || r % p === 0 : pgcd2(p, r) === 1),
    'faible')

  return {
    question: `x et y sont deux entiers compris entre 1 et ${M}. ${q.texte}`,
    valeurs,
    reponse: q.reponse,
    secret: [x, y],
    faits,
    decrire: ([p, r]) => `(${p} ; ${r})`,
    fermee: q.fermee,
    skillId: q.texte.includes('x + y') || q.texte.includes('xy')
      ? 'tm.conditions_minimales.suffisance_vs_resolution'
      : 'tm.conditions_minimales.cm_equations_et_systemes',
  }
}

function pgcd2(p: number, q: number): number {
  while (q) [p, q] = [q, p % q]
  return p
}

/** Trois dés, trois valeurs différentes. */
export function universDes(a: Alea): Univers {
  const valeurs: Valeur[] = []
  for (let i = 1; i <= 6; i++) for (let j = i + 1; j <= 6; j++) for (let k = j + 1; k <= 6; k++) valeurs.push([i, j, k])
  const secret = a.choix(valeurs)
  const [p, m, g] = secret
  const nom = a.choix(PRENOMS)

  type Q = { texte: string; reponse: (v: Valeur) => string; fermee: boolean }
  const questions: Q[] = [
    { texte: 'Quels sont ces trois nombres ?', reponse: (v) => v.join('-'), fermee: false },
    { texte: 'Quel est le plus grand des trois ?', reponse: (v) => String(v[2]), fermee: false },
    { texte: 'Leur somme est-elle paire ?', reponse: (v) => ((v[0] + v[1] + v[2]) % 2 === 0 ? 'oui' : 'non'), fermee: true },
  ]
  const q = a.choix(questions)

  const faits: Fait[] = []
  const ajouter = (texte: string, vrai: (v: Valeur) => boolean, apparence: Apparence, directe = false) => {
    if (vrai(secret)) faits.push({ texte, vrai, apparence, directe })
  }
  const somme = (v: Valeur) => v[0] + v[1] + v[2]
  const pairs = (v: Valeur) => v.filter((x) => x % 2 === 0).length
  ajouter(`La somme des trois nombres vaut ${somme(secret)}.`, (v) => somme(v) === somme(secret), 'forte')
  ajouter(`Le produit des trois nombres vaut ${p * m * g}.`, (v) => v[0] * v[1] * v[2] === p * m * g, 'forte')
  ajouter(`Le plus petit vaut ${p}.`, (v) => v[0] === p, 'forte')
  ajouter(`Le plus grand vaut ${g}.`, (v) => v[2] === g, 'forte', q.texte.includes('plus grand'))
  ajouter('L’un des nombres est la somme des deux autres.', (v) => v[0] + v[1] === v[2], 'faible')
  ajouter(
    ['Aucun des trois n’est pair.', 'Un seul des trois est pair.', 'Deux des trois sont pairs.', 'Les trois sont pairs.'][pairs(secret)],
    (v) => pairs(v) === pairs(secret),
    'faible',
  )
  ajouter('Deux des nombres se suivent.', (v) => v[1] - v[0] === 1 || v[2] - v[1] === 1, 'faible')
  ajouter('Aucun des nombres ne suit un autre.', (v) => v[1] - v[0] > 1 && v[2] - v[1] > 1, 'faible')
  ajouter(`La somme des deux plus petits vaut ${p + m}.`, (v) => v[0] + v[1] === p + m, 'forte')

  return {
    question: `${nom} lance trois dés et obtient trois nombres différents. ${q.texte}`,
    valeurs,
    reponse: q.reponse,
    secret,
    faits,
    decrire: (v) => `{${v.join(', ')}}`,
    fermee: q.fermee,
    skillId: 'tm.conditions_minimales.cm_statistiques_et_probabilites',
  }
}

/**
 * Un parent et son enfant. Le domaine n'est pas annoncé en entier (des âges
 * plausibles) : on vérifie sur un univers plus large qu'aucun statut ne tient
 * à une borne que l'énoncé ne donne pas.
 */
export function universAges(a: Alea): Univers {
  const domaine = (pMax: number, eMax: number) => {
    const v: Valeur[] = []
    for (let P = 17; P <= pMax; P++) for (let E = 1; E <= Math.min(eMax, P - 16); E++) v.push([P, E])
    return v
  }
  const E = a.entier(2, 30)
  const P = E + a.entier(20, 40)
  const [parent, enfant] = a.melanger(PRENOMS).slice(0, 2)
  const seuil = a.choix([35, 40, 45, 50])

  type Q = { texte: string; reponse: (v: Valeur) => string; fermee: boolean }
  const questions: Q[] = [
    { texte: `Quel âge a ${parent} ?`, reponse: (v) => String(v[0]), fermee: false },
    { texte: `Quel âge a ${enfant} ?`, reponse: (v) => String(v[1]), fermee: false },
    { texte: `L’enfant, ${enfant}, est-il majeur ?`, reponse: (v) => (v[1] >= 18 ? 'oui' : 'non'), fermee: true },
    { texte: `Le parent, ${parent}, a-t-il au moins ${seuil} ans ?`, reponse: (v) => (v[0] >= seuil ? 'oui' : 'non'), fermee: true },
  ]
  const q = a.choix(questions)

  const faits: Fait[] = []
  const ajouter = (texte: string, vrai: (p: number, e: number) => boolean, apparence: Apparence) => {
    if (vrai(P, E)) faits.push({ texte, vrai: ([p, e]) => vrai(p, e), apparence })
  }
  ajouter(`La somme de leurs âges vaut ${P + E} ans.`, (p, e) => p + e === P + E, 'forte')
  ajouter(`${parent} a ${P - E} ans de plus que ${enfant}.`, (p, e) => p - e === P - E, 'forte')
  if (E > 0 && P % E === 0) ajouter(`${parent} a ${P / E} fois l’âge de ${enfant}.`, (p, e) => p === (P / E) * e, 'forte')
  const n = P - 2 * E
  if (n > 0 && n <= 30) ajouter(`Dans ${n} an${n > 1 ? 's' : ''}, ${parent} aura le double de l’âge de ${enfant}.`, (p, e) => p + n === 2 * (e + n), 'forte')
  const il = a.entier(1, Math.max(1, E - 1))
  if (E - il > 0 && (P - il) % (E - il) === 0) {
    const k = (P - il) / (E - il)
    ajouter(`Il y a ${il} an${il > 1 ? 's' : ''}, ${parent} avait ${k} fois l’âge de ${enfant}.`, (p, e) => e - il > 0 && p - il === k * (e - il), 'forte')
  }
  const b = a.entier(Math.max(0, E - 6), E)
  if (b >= 2) ajouter(`${enfant} a au moins ${b} ans.`, (p, e) => e >= b, 'faible')
  const h = a.entier(P, P + 10)
  ajouter(`${parent} a au plus ${h} ans.`, (p) => p <= h, 'faible')
  const t = a.entier(Math.max(20, P + E - 15), P + E)
  ajouter(`La somme de leurs âges dépasse ${t} ans.`, (p, e) => p + e > t, 'faible')

  return {
    // La contrainte des 16 ans fait partie du domaine : elle doit être écrite.
    question: `${parent} et son enfant ${enfant} ont des âges entiers, et ${parent} a au moins 16 ans de plus. ${q.texte}`,
    valeurs: domaine(90, 60),
    elargi: domaine(140, 110),
    reponse: q.reponse,
    secret: [P, E],
    faits,
    decrire: ([p, e]) => `${parent} ${p} ans et ${enfant} ${e} an${e > 1 ? 's' : ''}`,
    fermee: q.fermee,
    skillId: 'tm.conditions_minimales.cm_equations_et_systemes',
  }
}

/* -------------------------------------------------------------- pièges -- */

/** Les pièges d'une paire : une apparence qui ment sur le statut. */
function pieges(u: Univers, f1: Fait, f2: Fait): string[] {
  const p: string[] = []
  for (const f of [f1, f2]) {
    const s = suffit(u, [f])
    if (f.directe) continue
    if (s && f.apparence === 'faible') p.push('borne_suffisante')
    if (!s && f.apparence === 'forte') p.push('equation_insuffisante')
  }
  return p
}

const LECONS: Record<string, string> = {
  borne_suffisante:
    'une borne ou une propriété peut suffire : le domaine (entiers, chiffres, dés, question fermée) ne laisse parfois qu’une réponse. On compte ce qui reste, on ne juge pas à l’apparence.',
  equation_insuffisante:
    'une équation n’est pas une valeur : vérifier qu’elle n’admet qu’une solution dans le domaine — un carré, un reste, une somme en laissent souvent plusieurs.',
  fermee:
    'sur une question fermée, il suffit que toutes les valeurs restantes donnent la même réponse — pas de les connaître.',
  resolution:
    'on demande une combinaison (x + y, xy) : elle peut être fixée alors que x et y ne le sont pas.',
  defaut: 'lister ce qui reste possible après chaque information est la seule méthode sûre.',
}

/* ---------------------------------------------------------- correction -- */

function restes(u: Univers, faits: Fait[]): string {
  const vs = u.valeurs.filter((v) => faits.every((f) => f.vrai(v)))
  const rep = [...new Set(vs.map(u.reponse))]
  if (vs.length <= 6) {
    const reponses = u.fermee
      ? rep.length === 1 ? `tous répondent « ${rep[0]} »` : 'certains répondent « oui », d’autres « non »'
      : rep.length === 1 ? `une seule réponse, ${rep[0]}` : `${rep.length} réponses possibles`
    return `restent ${vs.map(u.decrire).join(', ')} : ${reponses}`
  }
  // Trop de cas pour les lister : on dit ce qu'ils donnent, avec un exemple.
  if (u.fermee) {
    if (rep.length === 1) return `restent ${vs.length} cas, qui répondent tous « ${rep[0]} »`
    const oui = vs.find((v) => u.reponse(v) === 'oui')!
    const non = vs.find((v) => u.reponse(v) === 'non')!
    return `restent ${vs.length} cas, les uns « oui » (${u.decrire(oui)}), les autres « non » (${u.decrire(non)})`
  }
  if (rep.length === 1) return `restent ${vs.length} cas, mais tous donnent ${rep[0]} : une seule réponse`
  const exemples = rep.length <= 5 ? rep.join(', ') : `${rep.slice(0, 4).join(', ')}…`
  return `restent ${vs.length} cas, et ${rep.length} réponses possibles (${exemples})`
}

const RAISONS: Record<Lettre, string> = {
  A: "l'information (1) suffit à elle seule, pas l'information (2)",
  B: "l'information (2) suffit à elle seule, pas l'information (1)",
  C: 'aucune ne suffit seule, mais leur réunion ne laisse qu’une réponse',
  D: 'chacune des deux informations suffit, prise séparément',
  E: 'même réunies, les deux informations laissent plusieurs réponses',
}

function question(u: Univers, f1: Fait, f2: Fait, cible: Lettre): QuestionGeneree {
  const s1 = suffit(u, [f1])
  const s2 = suffit(u, [f2])
  const types = pieges(u, f1, f2)
  if (u.fermee) types.push('fermee')
  if (/x \+ y|xy/.test(u.question)) types.push('resolution')
  const lecon = LECONS[types[0] ?? 'defaut']

  const etapes = [
    `1. On ne calcule pas la réponse : pour chaque information, on liste ce qui reste possible dans le domaine de l’énoncé.`,
    `2. Information (1) seule — « ${f1.texte} » : ${restes(u, [f1])} — elle ${s1 ? 'SUFFIT' : 'NE SUFFIT PAS'}.`,
    `3. Information (2) seule — « ${f2.texte} » : ${restes(u, [f2])} — elle ${s2 ? 'SUFFIT' : 'NE SUFFIT PAS'}.`,
  ]
  if (!s1 && !s2) etapes.push(`4. Les deux ensemble : ${restes(u, [f1, f2])}.`)

  const court = (f: Fait) => {
    const rep = reponsesRestantes(u, [f])
    return rep.size === 1 ? 'une réponse' : `${rep.size} réponses`
  }
  return {
    section: S,
    skillId: u.skillId,
    typeItem: 'conditions_minimales',
    enonce: u.question,
    options: [],
    info1: f1.texte,
    info2: f2.texte,
    bonneReponse: cible,
    rappel:
      cible === 'C' || cible === 'E'
        ? `(1) seule : ${court(f1)}, (2) seule : ${court(f2)}, ensemble : ${reponsesRestantes(u, [f1, f2]).size === 1 ? 'une réponse' : 'toujours plusieurs'}. → ${cible}`
        : `(1) seule : ${court(f1)}, (2) seule : ${court(f2)}. → ${cible}`,
    explication: `${etapes.join('\n')}\nRéponse ${cible} : ${RAISONS[cible]}.\nÀ retenir : ${lecon}`,
    difficulte: types.some((t) => t === 'borne_suffisante' || t === 'equation_insuffisante') ? 5 : 4,
  }
}

/* ------------------------------------------------------------- tirage -- */

/**
 * Cherche, dans un univers, une paire de faits qui donne la lettre visée. Les
 * paires à piège sont nettement favorisées : c'est tout l'intérêt de la
 * famille. Null si l'univers n'en offre aucune.
 */
export function choisirPaire(a: Alea, u: Univers, cible: Lettre): [Fait, Fait] | null {
  const candidates: Array<{ paire: [Fait, Fait]; poids: number }> = []
  for (const f1 of u.faits) {
    for (const f2 of u.faits) {
      if (f1 === f2 || f1.texte === f2.texte) continue
      if (lettre(u, f1, f2) !== cible) continue
      // Un statut qui changerait en élargissant les bornes tiendrait à une
      // limite que l'énoncé ne donne pas.
      if (u.elargi && lettre(u, f1, f2, u.elargi) !== cible) continue
      const directes = (f1.directe ? 1 : 0) + (f2.directe ? 1 : 0)
      candidates.push({ paire: [f1, f2], poids: (1 + pieges(u, f1, f2).length) ** 2 * 0.15 ** directes })
    }
  }
  if (candidates.length === 0) return null
  const total = candidates.reduce((t, c) => t + c.poids, 0)
  let x = (a.entier(0, 999_999) / 1_000_000) * total
  for (const c of candidates) {
    x -= c.poids
    if (x < 0) return c.paire
  }
  return candidates[candidates.length - 1].paire
}

function famille(nom: string, skillId: string, univers: (a: Alea) => Univers): Famille {
  return {
    skillId,
    nom,
    produire(a) {
      // La lettre est tirée d'abord, uniformément ; l'univers est retiré tant
      // qu'il n'offre pas de paire qui la donne.
      const cible = a.choix<Lettre>(['A', 'B', 'C', 'D', 'E'])
      for (let essai = 0; essai < 40; essai++) {
        const u = univers(a)
        const paire = choisirPaire(a, u, cible)
        if (paire) return question(u, paire[0], paire[1], cible)
      }
      throw new Error(`${nom} : aucune paire pour ${cible}`)
    },
  }
}

export const FAMILLES_PIEGES: Famille[] = [
  famille('pièges — entier', 'tm.conditions_minimales.cm_arithmetique_et_divisibilite', universEntier),
  famille('pièges — deux entiers', 'tm.conditions_minimales.suffisance_vs_resolution', universCouple),
  famille('pièges — dés', 'tm.conditions_minimales.cm_statistiques_et_probabilites', universDes),
  famille('pièges — âges', 'tm.conditions_minimales.cm_equations_et_systemes', universAges),
]
