/**
 * Rééquilibrage de la position des bonnes réponses.
 *
 * POURQUOI CE FICHIER EXISTE
 * --------------------------
 * Les séries de compréhension importées plaçaient la bonne réponse en B une
 * fois sur deux, et en E presque jamais (83 et 3 sur 167). Cocher B par défaut
 * rapportait alors bien plus que le hasard : le taux de réussite mesurait en
 * partie un biais de rédaction, et la calibration avec lui.
 *
 * On permute donc les propositions pour que chaque lettre porte la bonne
 * réponse aussi souvent que les autres. Le piège est ailleurs : les
 * explications citent les propositions par leur lettre (« A est un
 * contresens »). Une permutation qui ne réécrit pas ces renvois produit une
 * correction fausse — pire qu'un biais. Les lettres sont donc réécrites avec
 * la même permutation, sauf dans les passages où elles ne désignent pas une
 * proposition : citations entre guillemets et formules génériques comme
 * « non pas A, mais B ».
 */

import type { Alea } from '@/core/generation/alea'

export const LETTRES = ['A', 'B', 'C', 'D', 'E'] as const
type Lettre = (typeof LETTRES)[number]

/**
 * Une permutation : `nouvelIndex[i]` est la place qu'occupe, après
 * permutation, la proposition qui était en position `i`.
 */
export type Permutation = number[]

export function estPermutation(p: Permutation, n: number): boolean {
  return p.length === n && new Set(p).size === n && p.every((i) => Number.isInteger(i) && i >= 0 && i < n)
}

/** Nouvelle lettre d'une ancienne lettre. Laisse intact ce qui n'est pas une lettre de proposition. */
export function lettrePermutee(lettre: string, p: Permutation): string {
  const i = LETTRES.indexOf(lettre as Lettre)
  if (i < 0 || i >= p.length) return lettre
  return LETTRES[p[i]]
}

/**
 * Passages où une lettre majuscule isolée ne désigne PAS une proposition :
 * une citation du texte, ou une formule générique du type « non pas A,
 * mais B », reprise ensuite par « reprend A mot pour mot ».
 */
const ZONES_PROTEGEES: RegExp[] = [/«[^»]*»/g, /\bA mot pour mot\b/g]

/** Une lettre A-E isolée : ni précédée ni suivie d'une lettre ou d'un chiffre. */
const RE_LETTRE = /(?<![\p{L}\p{N}’'])[A-E](?![\p{L}\p{N}’'])/gu

/** Réécrit les renvois « A », « B et D »… d'une explication selon la permutation. */
export function reecrireLettres(texte: string, p: Permutation): string {
  const protegees: Array<[number, number]> = []
  for (const re of ZONES_PROTEGEES) {
    for (const m of texte.matchAll(re)) protegees.push([m.index, m.index + m[0].length])
  }
  const estProtegee = (i: number) => protegees.some(([a, b]) => i >= a && i < b)

  return texte.replace(RE_LETTRE, (lettre, index: number) =>
    estProtegee(index) ? lettre : lettrePermutee(lettre, p),
  )
}

export interface QuestionPermutable {
  options: string[]
  bonneReponse: string
  explication?: string | null
  /** JSON { lettre: ce que vaut la proposition }, tel que stocké sur `item`. */
  diagnostics?: string | null
}

/** Applique une permutation à une question et à tout ce qui cite ses lettres. */
export function permuterQuestion<T extends QuestionPermutable>(q: T, p: Permutation): T {
  if (!estPermutation(p, q.options.length)) {
    throw new Error(`Permutation invalide pour ${q.options.length} propositions.`)
  }

  const options = new Array<string>(q.options.length)
  q.options.forEach((o, i) => {
    options[p[i]] = o
  })

  let diagnostics = q.diagnostics ?? null
  if (diagnostics) {
    const brut = JSON.parse(diagnostics) as Record<string, string>
    diagnostics = JSON.stringify(
      Object.fromEntries(
        Object.entries(brut)
          .map(([l, v]) => [lettrePermutee(l, p), v] as const)
          .sort(([a], [b]) => a.localeCompare(b)),
      ),
    )
  }

  return {
    ...q,
    options,
    bonneReponse: lettrePermutee(q.bonneReponse, p),
    explication: q.explication == null ? q.explication : reecrireLettres(q.explication, p),
    diagnostics: q.diagnostics === undefined ? undefined : diagnostics,
  }
}

/**
 * Permutation qui amène la bonne réponse en position `cible` et mélange les
 * autres propositions. Les distracteurs n'ont pas d'ordre à respecter : les
 * laisser en place garderait l'empreinte de la rédaction d'origine.
 */
export function permutationVers(
  bonne: number,
  cible: number,
  n: number,
  alea: Alea,
): Permutation {
  const places = alea.melanger([...Array(n).keys()].filter((i) => i !== cible))
  const p = new Array<number>(n)
  p[bonne] = cible
  let k = 0
  for (let i = 0; i < n; i++) if (i !== bonne) p[i] = places[k++]
  return p
}

/**
 * Choisit la lettre cible de chaque question pour que la banque, une fois ces
 * questions ajoutées, porte la bonne réponse aussi souvent sur chaque lettre.
 *
 * `dejaEnBanque` compte les bonnes réponses déjà présentes, pour qu'un petit
 * import vienne combler les lettres sous-représentées au lieu d'ajouter un
 * nouveau déséquilibre. Les ex æquo sont départagés au hasard, pour qu'aucune
 * régularité de rang ne s'installe.
 */
export function ciblesEquilibrees(
  nbQuestions: number,
  alea: Alea,
  dejaEnBanque: Partial<Record<string, number>> = {},
  nbOptions = 5,
): string[] {
  const lettres = LETTRES.slice(0, nbOptions)
  const compte = new Map<string, number>(lettres.map((l) => [l, dejaEnBanque[l] ?? 0]))
  const cibles: string[] = []

  for (let i = 0; i < nbQuestions; i++) {
    const min = Math.min(...compte.values())
    const candidates = lettres.filter((l) => compte.get(l) === min)
    const l = alea.choix(candidates)
    compte.set(l, min + 1)
    cibles.push(l)
  }

  // L'ordre d'attribution suit l'ordre des questions : on le mélange, sinon
  // les questions successives d'un même texte recevraient A, B, C, D, E.
  return alea.melanger(cibles)
}

/**
 * Rééquilibre une liste de questions. Une question dont le nombre de
 * propositions n'est pas `nbOptions`, ou sans bonne réponse, est laissée
 * telle quelle.
 */
export function equilibrer<T extends QuestionPermutable>(
  questions: T[],
  alea: Alea,
  dejaEnBanque: Partial<Record<string, number>> = {},
  nbOptions = 5,
): Array<{ question: T; permutation: Permutation | null }> {
  const eligibles = questions.filter(
    (q) => q.options.length === nbOptions && LETTRES.indexOf(q.bonneReponse as Lettre) >= 0,
  )
  const cibles = ciblesEquilibrees(eligibles.length, alea, dejaEnBanque, nbOptions)

  let k = 0
  return questions.map((q) => {
    if (!eligibles.includes(q)) return { question: q, permutation: null }
    const bonne = LETTRES.indexOf(q.bonneReponse as Lettre)
    const cible = LETTRES.indexOf(cibles[k++] as Lettre)
    const p = permutationVers(bonne, cible, nbOptions, alea)
    return { question: permuterQuestion(q, p), permutation: p }
  })
}

/** Part de la lettre la plus fréquente parmi les bonnes réponses. */
export function partLettreDominante(bonnes: string[]): { lettre: string; part: number } | null {
  if (bonnes.length === 0) return null
  const compte = new Map<string, number>()
  for (const b of bonnes) compte.set(b, (compte.get(b) ?? 0) + 1)
  const [lettre, n] = [...compte.entries()].sort((a, b) => b[1] - a[1])[0]
  return { lettre, part: n / bonnes.length }
}

/**
 * Au-delà de cette part, une lettre porte trop de bonnes réponses : répondre
 * cette lettre par défaut rapporterait plus que le hasard (20 %). 35 % laisse
 * la marge d'un tirage honnête sur une petite banque, et aurait signalé le
 * B à 50 % de la compréhension dès le premier import.
 */
export const ALERTE_LETTRE_DOMINANTE = 0.35

/** En dessous, la répartition d'un petit lot ne dit rien. */
export const MINIMUM_ALERTE_REPARTITION = 20

/**
 * La lettre qui porte trop de bonnes réponses dans une liste, ou null.
 * Sert au contrôle de la banque (atelier, `npm run audit:questions`) et à
 * son test : c'est le garde-fou qui empêche le biais de revenir.
 */
export function alerteRepartition(
  bonnes: string[],
): { lettre: string; part: number; n: number } | null {
  if (bonnes.length < MINIMUM_ALERTE_REPARTITION) return null
  const d = partLettreDominante(bonnes)
  if (!d || d.part <= ALERTE_LETTRE_DOMINANTE) return null
  return { ...d, n: bonnes.length }
}
