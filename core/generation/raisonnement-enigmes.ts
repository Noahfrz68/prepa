/**
 * Raisonnement — prémisse et conclusion, au niveau des annales.
 *
 * Les questions « prémisse et conclusion » des annales ne sont presque jamais
 * des syllogismes nus : ce sont des énigmes. Un classement dont on connaît
 * quelques comparaisons, une rangée de places, une chaîne de conditions, une
 * île de menteurs, un calendrier, deux sous-groupes qui se recoupent. Le
 * générateur ne posait que la contraposée et deux syllogismes, réussis à 100 % ;
 * les annales du même type le sont à 38 %.
 *
 * Toutes ces énigmes se résolvent de la même façon, et c'est aussi ainsi
 * qu'elles sont construites ici : on énumère TOUS les cas (ordres, places,
 * valeurs de vérité, effectifs) et l'on garde ceux qui respectent les
 * informations. Une proposition est certaine si elle est vraie dans chacun,
 * impossible si elle ne l'est dans aucun. Rien n'est écrit d'avance : la bonne
 * réponse est un résultat d'énumération, comme le statut d'une information en
 * conditions minimales.
 *
 * Les leurres sont des propositions POSSIBLES mais pas certaines — exactement
 * l'erreur qu'on commet en raisonnant sur le premier cas qui vient à l'esprit.
 * Chacun porte le contre-exemple qui l'écarte : c'est ce qui est rendu en
 * correction, en face de la proposition cochée.
 */
import { capitale, de, pluriel, type Alea } from './alea'
import { qcmTexte } from './qcm'
import type { Famille, QuestionGeneree } from './types'

const S = 'raisonnement' as const
const SKILL = 'tm.raisonnement.premisse_et_conclusion'

/* ------------------------------------------------------------- moteur -- */

/** Un énoncé dont on sait dire, pour chaque cas, s'il est vrai. */
export interface Proposition<M> {
  texte: string
  vrai: (m: M) => boolean
  /** Ce que pense celui qui la coche, quand le piège a un nom. */
  piege?: string
  /** Priorité comme leurre : les appâts connus passent devant. */
  appat?: number
}

export type Mode = 'certaine' | 'impossible'

export const CONSIGNE: Record<Mode, string> = {
  certaine: 'Si ces informations sont exactes, laquelle des propositions suivantes est nécessairement vraie ?',
  impossible: 'Si ces informations sont exactes, laquelle des propositions suivantes est nécessairement fausse ?',
}

export function compatibles<M>(univers: readonly M[], premisses: readonly Proposition<M>[]): M[] {
  return univers.filter((m) => premisses.every((p) => p.vrai(m)))
}

/**
 * Tire des informations jusqu'à laisser entre `min` et `max` cas.
 *
 * Chaque information retenue doit écarter au moins un cas : une information
 * redondante allonge l'énoncé sans rien apprendre, et le candidat la repère.
 */
export function choisirPremisses<M>(
  a: Alea,
  univers: readonly M[],
  pool: readonly Proposition<M>[],
  r: { nbMin: number; nbMax: number; min: number; max: number },
): Proposition<M>[] | null {
  const premisses: Proposition<M>[] = []
  let restants = [...univers]
  for (const p of a.melanger(pool)) {
    if (premisses.length === r.nbMax) break
    if (premisses.length >= r.nbMin && restants.length <= r.max) break
    const apres = restants.filter(p.vrai)
    if (apres.length < r.min || apres.length === restants.length) continue
    premisses.push(p)
    restants = apres
  }
  return premisses.length >= r.nbMin && restants.length <= r.max ? premisses : null
}

export interface Pose<M> {
  bonne: Proposition<M>
  leurres: Array<[string, string]>
  /** Les leurres retenus, avec le cas qui les tranche. */
  ecartes: Array<{ p: Proposition<M>; cas: M }>
}

/**
 * Choisit la bonne réponse et quatre leurres possibles-mais-pas-certains.
 *
 * La bonne réponse ne doit pas se lire dans UNE information prise seule — sinon
 * la question se résout en recopiant l'énoncé. C'est le croisement des
 * informations qui doit la produire, comme dans les annales.
 */
export function poser<M>(
  a: Alea,
  mode: Mode,
  o: {
    univers: readonly M[]
    premisses: readonly Proposition<M>[]
    bonnes: readonly Proposition<M>[]
    leurres: readonly Proposition<M>[]
    decrire: (m: M) => string
  },
): Pose<M> | null {
  const cas = compatibles(o.univers, o.premisses)
  const textes = new Set(o.premisses.map((p) => p.texte))
  const visee = (p: Proposition<M>, liste: readonly M[]) =>
    mode === 'certaine' ? liste.every(p.vrai) : !liste.some(p.vrai)
  const parSeule = o.premisses.map((p) => compatibles(o.univers, [p]))

  const bonnes = o.bonnes.filter(
    (p) => !textes.has(p.texte) && visee(p, cas) && parSeule.every((l) => !visee(p, l)),
  )
  if (bonnes.length === 0) return null
  const bonne = a.choix(bonnes)

  // Possibles sans être certaines : vraies dans un cas au moins, fausses dans un autre.
  const vus = new Set([bonne.texte, ...textes])
  const possibles = a
    .melanger(o.leurres.filter((p) => cas.some(p.vrai) && !cas.every(p.vrai)))
    .filter((p) => (vus.has(p.texte) ? false : (vus.add(p.texte), true)))
  // La plus tentante d'abord : vraie dans la plupart des cas quand on cherche
  // une certitude, fausse dans la plupart quand on cherche une impossibilité.
  const tentation = (p: Proposition<M>) => {
    const part = cas.filter(p.vrai).length / cas.length
    return (p.appat ?? 0) + (mode === 'certaine' ? part : 1 - part)
  }
  possibles.sort((x, y) => tentation(y) - tentation(x))
  const retenus = possibles.slice(0, 4)
  if (retenus.length < 4) return null

  const ecartes = retenus.map((p) => ({
    p,
    cas: mode === 'certaine' ? cas.find((m) => !p.vrai(m))! : cas.find(p.vrai)!,
  }))
  const leurres = ecartes.map(({ p, cas: m }): [string, string] => {
    const preuve =
      mode === 'certaine'
        ? `possible, mais pas certaine : ${o.decrire(m)} respecte toutes les informations et la contredit`
        : `elle peut être vraie : ${o.decrire(m)} respecte toutes les informations et la vérifie`
    return [p.texte, p.piege ? `${p.piege} — ${preuve}` : preuve]
  })
  return { bonne, leurres, ecartes }
}

/** Assemble la question à partir d'une énigme posée. */
function question<M>(
  a: Alea,
  mode: Mode,
  o: {
    enonce: string
    univers: readonly M[]
    premisses: readonly Proposition<M>[]
    pose: Pose<M>
    decrire: (m: M) => string
    /** Le geste propre à ce genre d'énigme : un dessin, un tableau, une hypothèse. */
    methode: string
    nomCas: [singulier: string, pluriel: string]
  },
): QuestionGeneree {
  const { options, bonneReponse, diagnostics } = qcmTexte(a, o.pose.bonne.texte, o.pose.leurres)
  const cas = compatibles(o.univers, o.premisses)
  const [un, plusieurs] = o.nomCas
  const liste =
    cas.length <= 4
      ? `il en reste ${cas.length} : ${cas.map(o.decrire).join(' ; ')}`
      : `il en reste ${cas.length}, par exemple ${cas.slice(0, 2).map(o.decrire).join(' et ')}`
  const verdict = mode === 'certaine' ? 'vraie dans chacun d’eux' : 'fausse dans chacun d’eux'
  const autres = o.pose.ecartes
    .map(({ p, cas: m }) => `   • « ${p.texte} » — ${mode === 'certaine' ? 'tombe avec' : 'est vérifiée par'} ${o.decrire(m)}.`)
    .join('\n')

  return {
    section: S,
    skillId: SKILL,
    typeItem: 'qcm',
    enonce: `${o.enonce}\n${CONSIGNE[mode]}`,
    options,
    bonneReponse,
    diagnostics,
    rappel:
      mode === 'certaine'
        ? `« Nécessairement vraie » = vraie dans TOUS les ${plusieurs} compatibles : un seul contre-exemple écarte une proposition.`
        : `« Nécessairement fausse » = fausse dans TOUS les ${plusieurs} compatibles : un seul ${un} qui la vérifie l’écarte.`,
    explication:
      `1. ${o.methode}\n` +
      `2. Chercher TOUS les ${plusieurs} compatibles avec les informations, pas seulement le premier qui vient : ${liste}.\n` +
      `3. « ${o.pose.bonne.texte} » est ${verdict} — c’est la réponse.\n` +
      `4. Les quatre autres sont possibles, mais pas ${mode === 'certaine' ? 'certaines' : 'exclues'} :\n${autres}\n` +
      `Le piège du sous-test : raisonner sur UN ${un} plausible. Une proposition vraie dans ce ${un}-là ` +
      `n'est pas pour autant ${mode === 'certaine' ? 'nécessaire' : 'possible dans tous'} — il faut la confronter à tous les autres.`,
    difficulte: 5,
  }
}

/** Toutes les permutations de 0..n-1, chacune donnée comme « place de chaque personne ». */
export function permutations(n: number): number[][] {
  if (n === 0) return [[]]
  const r: number[][] = []
  for (const p of permutations(n - 1)) {
    for (let i = 0; i <= p.length; i++) r.push([...p.slice(0, i), n - 1, ...p.slice(i)])
  }
  return r
}

/** Prénoms épicènes : aucun accord à deviner, aucun pronom à choisir. */
export const PRENOMS = ['Alix', 'Camille', 'Charlie', 'Sacha', 'Lou', 'Noa', 'Eden', 'Morgan', 'Andréa', 'Dominique', 'Maxime', 'Louison']

/** « que Lou » mais « qu'Eden ». */
const que = (nom: string) => (/^[AEIOUÉ]/.test(nom) ? `qu’${nom}` : `que ${nom}`)

const ORDINAUX = ['première', 'deuxième', 'troisième', 'quatrième', 'cinquième']

/* --------------------------------------------------------- classement -- */

/** Un classement : `place[i]` est le rang (0 = premier) de la personne i. */
type Classement = number[]

interface Contexte {
  intro: (noms: string) => string
  avant: (x: string, y: string) => string
  entre: (x: string, y: string, z: string) => string
  juste: (x: string, y: string) => string
  premier: (x: string) => string
  dernier: (x: string) => string
  niExtreme: (x: string) => string
  rang: (x: string, k: number) => string
  ordre: string
}

export const CONTEXTES_CLASSEMENT: Contexte[] = [
  {
    intro: (n) => `Cinq coureurs — ${n} — ont disputé une course, sans ex æquo.`,
    avant: (x, y) => `${x} a franchi la ligne avant ${y}.`,
    entre: (x, y, z) => `${x} a franchi la ligne après ${y} mais avant ${z}.`,
    juste: (x, y) => `${x} a franchi la ligne juste avant ${y}.`,
    premier: (x) => `${x} a gagné la course.`,
    dernier: (x) => `${x} a franchi la ligne en dernier.`,
    niExtreme: (x) => `${x} n’a ni gagné la course ni franchi la ligne en dernier.`,
    rang: (x, k) => `${x} a terminé à la ${ORDINAUX[k]} place.`,
    ordre: 'l’arrivée',
  },
  {
    intro: (n) => `Cinq collègues — ${n} — ont des salaires tous différents.`,
    avant: (x, y) => `${x} gagne plus ${que(y)}.`,
    entre: (x, y, z) => `${x} gagne moins ${que(y)} mais plus ${que(z)}.`,
    juste: (x, y) => `Dans l’ordre des salaires, ${y} vient juste après ${x}.`,
    premier: (x) => `${x} a le salaire le plus élevé.`,
    dernier: (x) => `${x} a le salaire le plus bas.`,
    niExtreme: (x) => `${x} n’a ni le salaire le plus élevé ni le plus bas.`,
    rang: (x, k) => `${x} a le ${ORDINAUX[k].replace('première', 'premier')} salaire le plus élevé.`,
    ordre: 'les salaires, du plus élevé au plus bas',
  },
]

function enonceClassement(c: Contexte, noms: string[]) {
  const n = noms.length
  const pool: Proposition<Classement>[] = []
  const candidats: Proposition<Classement>[] = []
  for (let x = 0; x < n; x++) {
    for (let y = 0; y < n; y++) {
      if (x === y) continue
      const avant = { texte: c.avant(noms[x], noms[y]), vrai: (m: Classement) => m[x] < m[y] }
      const juste = { texte: c.juste(noms[x], noms[y]), vrai: (m: Classement) => m[y] === m[x] + 1 }
      pool.push(avant, avant, juste)
      candidats.push(avant, juste)
      for (let z = 0; z < n; z++) {
        if (z === x || z === y) continue
        pool.push({ texte: c.entre(noms[x], noms[y], noms[z]), vrai: (m) => m[y] < m[x] && m[x] < m[z] })
      }
    }
    const premier = { texte: c.premier(noms[x]), vrai: (m: Classement) => m[x] === 0 }
    const dernier = { texte: c.dernier(noms[x]), vrai: (m: Classement) => m[x] === n - 1 }
    const niExtreme = { texte: c.niExtreme(noms[x]), vrai: (m: Classement) => m[x] > 0 && m[x] < n - 1 }
    pool.push(premier, dernier, niExtreme)
    candidats.push(premier, dernier, niExtreme)
    for (let k = 1; k < n - 1; k++) candidats.push({ texte: c.rang(noms[x], k), vrai: (m) => m[x] === k })
  }
  return { pool, candidats }
}

const classement: Famille = {
  skillId: SKILL,
  nom: 'classement',
  produire(a) {
    for (;;) {
      const c = a.choix(CONTEXTES_CLASSEMENT)
      const noms = a.melanger(PRENOMS).slice(0, 5)
      const univers = permutations(5)
      const { pool, candidats } = enonceClassement(c, noms)
      const premisses = choisirPremisses(a, univers, pool, { nbMin: 3, nbMax: 5, min: 2, max: 6 })
      if (!premisses) continue
      const mode: Mode = a.chance(0.7) ? 'certaine' : 'impossible'
      const decrire = (m: Classement) =>
        `l’ordre ${noms.map((_, i) => i).sort((i, j) => m[i] - m[j]).map((i) => noms[i]).join(', ')}`
      const pose = poser(a, mode, { univers, premisses, bonnes: candidats, leurres: candidats, decrire })
      if (!pose) continue
      return question(a, mode, {
        enonce: [c.intro(`${noms.slice(0, 4).join(', ')} et ${noms[4]}`), ...premisses.map((p) => p.texte)].join('\n'),
        univers,
        premisses,
        pose,
        decrire: (m) => `${decrire(m)} (${c.ordre})`,
        methode:
          `Poser les cinq noms sur une ligne verticale et y reporter chaque information — « avant » place un nom ` +
          `au-dessus d'un autre, « juste avant » les colle. Les informations se croisent : c'est leur combinaison, ` +
          `jamais une seule, qui fixe ce qui est certain.`,
        nomCas: ['ordre', 'ordres'],
      })
    }
  },
}

/* ------------------------------------------------------------- rangée -- */

/** Une rangée : `place[i]` est la place (0 = la plus à gauche) de la personne i. */
type Rangee = number[]

function enonceRangee(noms: string[]) {
  const n = noms.length
  const pool: Proposition<Rangee>[] = []
  const candidats: Proposition<Rangee>[] = []
  const voisins = (m: Rangee, x: number, y: number) => Math.abs(m[x] - m[y]) === 1
  for (let x = 0; x < n; x++) {
    for (let y = 0; y < n; y++) {
      if (x === y) continue
      const gauche = { texte: `La place ${de(noms[x])} est à gauche de celle ${de(noms[y])}.`, vrai: (m: Rangee) => m[x] < m[y] }
      pool.push(gauche)
      candidats.push(gauche)
      if (x < y) {
        const voisin = { texte: `${noms[x]} et ${noms[y]} occupent deux places voisines.`, vrai: (m: Rangee) => voisins(m, x, y) }
        const loin = { texte: `${noms[x]} et ${noms[y]} n’occupent pas deux places voisines.`, vrai: (m: Rangee) => !voisins(m, x, y) }
        pool.push(voisin, loin, voisin)
        candidats.push(voisin, loin)
      }
      for (let z = y + 1; z < n; z++) {
        if (z === x) continue
        pool.push({
          texte: `La place ${de(noms[x])} est située entre celle ${de(noms[y])} et celle ${de(noms[z])}.`,
          vrai: (m) => Math.min(m[y], m[z]) < m[x] && m[x] < Math.max(m[y], m[z]),
        })
      }
    }
    const bout = { texte: `${noms[x]} occupe une place au bout de la rangée.`, vrai: (m: Rangee) => m[x] === 0 || m[x] === n - 1 }
    const pasBout = { texte: `${noms[x]} n’occupe aucune des deux places du bout.`, vrai: (m: Rangee) => m[x] > 0 && m[x] < n - 1 }
    pool.push(bout, pasBout)
    candidats.push(bout, pasBout)
    for (let k = 0; k < n; k++) {
      const place = { texte: `${noms[x]} occupe la place ${k + 1}.`, vrai: (m: Rangee) => m[x] === k }
      candidats.push(place)
      if (k === 0 || k === 2 || k === n - 1) pool.push(place)
      pool.push({ texte: `${noms[x]} n’occupe pas la place ${k + 1}.`, vrai: (m) => m[x] !== k })
    }
  }
  return { pool, candidats }
}

const rangee: Famille = {
  skillId: SKILL,
  nom: 'places dans une rangée',
  produire(a) {
    for (;;) {
      const noms = a.melanger(PRENOMS).slice(0, 5)
      const univers = permutations(5)
      const { pool, candidats } = enonceRangee(noms)
      const premisses = choisirPremisses(a, univers, pool, { nbMin: 3, nbMax: 5, min: 2, max: 6 })
      if (!premisses) continue
      const mode: Mode = a.chance(0.7) ? 'certaine' : 'impossible'
      const decrire = (m: Rangee) =>
        `la disposition ${noms.map((_, i) => i).sort((i, j) => m[i] - m[j]).map((i) => noms[i]).join(', ')}`
      const pose = poser(a, mode, { univers, premisses, bonnes: candidats, leurres: candidats, decrire })
      if (!pose) continue
      return question(a, mode, {
        enonce: [
          `Cinq personnes — ${noms.slice(0, 4).join(', ')} et ${noms[4]} — occupent les cinq places d’une rangée, ` +
            `numérotées de 1 à 5 de gauche à droite.`,
          ...premisses.map((p) => p.texte),
        ].join('\n'),
        univers,
        premisses,
        pose,
        decrire: (m) => `${decrire(m)} (places 1 à 5)`,
        methode:
          `Dessiner cinq cases et commencer par l'information la plus contraignante — une place fixée, un bout ` +
          `de rangée, deux voisins —, puis essayer chaque position restante. « Entre » ne veut pas dire « à côté » : ` +
          `il peut y avoir d'autres places au milieu.`,
        nomCas: ['placement', 'placements'],
      })
    }
  },
}

/* ---------------------------------------------------- chaîne de conditions -- */

/** Une affirmation simple et sa négation, écrites en entier : la langue ne se laisse pas concaténer. */
export const ATOMES: Array<[oui: string, non: string]> = [
  ['Alix vient à la réunion', 'Alix ne vient pas à la réunion'],
  ['la salle est réservée', 'la salle n’est pas réservée'],
  ['Sacha prend la voiture', 'Sacha ne prend pas la voiture'],
  ['le budget est voté', 'le budget n’est pas voté'],
  ['Camille présente le projet', 'Camille ne présente pas le projet'],
  ['le contrat est signé', 'le contrat n’est pas signé'],
  ['Noa part en mission', 'Noa ne part pas en mission'],
  ['la livraison arrive lundi', 'la livraison n’arrive pas lundi'],
  ['le stand est monté', 'le stand n’est pas monté'],
  ['Morgan relit le rapport', 'Morgan ne relit pas le rapport'],
]

/** Une affectation de vérité : le bit i dit si le i-ème atome est vrai. */
type Valuation = number

interface Litteral {
  atome: number
  oui: boolean
}

const vaut = (m: Valuation, l: Litteral) => ((m >> l.atome) & 1) === 1 === l.oui

const conditions: Famille = {
  skillId: SKILL,
  nom: 'chaîne de conditions',
  produire(a) {
    for (;;) {
      const nb = a.choix([4, 4, 5])
      const atomes = a.melanger(ATOMES).slice(0, nb)
      const ecrire = (l: Litteral) => atomes[l.atome][l.oui ? 0 : 1]
      const litteraux: Litteral[] = atomes.flatMap((_, i) => [{ atome: i, oui: true }, { atome: i, oui: false }])
      const univers = Array.from({ length: 1 << nb }, (_, i) => i)

      const implications: Proposition<Valuation>[] = []
      const disjonctions: Proposition<Valuation>[] = []
      for (const p of litteraux) {
        for (const q of litteraux) {
          if (p.atome === q.atome) continue
          implications.push({ texte: `Si ${ecrire(p)}, alors ${ecrire(q)}.`, vrai: (m) => !vaut(m, p) || vaut(m, q) })
          if (p.atome < q.atome) {
            disjonctions.push({
              texte: `${capitale(ecrire(p))}, ou bien ${ecrire(q)} (ou les deux).`,
              vrai: (m) => vaut(m, p) || vaut(m, q),
            })
          }
        }
      }
      const faits = litteraux.map((l) => ({ texte: `${capitale(ecrire(l))}.`, vrai: (m: Valuation) => vaut(m, l), l }))

      // Des conditions d'abord, un constat en dernier : c'est la forme des annales.
      const regles = choisirPremisses(a, univers, [...implications, ...implications, ...disjonctions], {
        nbMin: 3,
        nbMax: 4,
        min: 3,
        max: 1 << nb,
      })
      if (!regles) continue
      const avecConstat = a.chance(0.6)
      const restants = compatibles(univers, regles)
      const constats = faits.filter((f) => {
        const n = restants.filter(f.vrai).length
        return n >= 2 && n < restants.length
      })
      if (avecConstat && constats.length === 0) continue
      const constat = avecConstat ? a.choix(constats) : null
      const premisses = constat ? [...regles, constat] : regles
      const cas = compatibles(univers, premisses)
      if (cas.length < 2 || cas.length > 6) continue
      // Un atome dont aucune information ne parle ferait un leurre gratuit :
      // « Alix vient à la réunion » se rejette sans réfléchir s'il n'en est
      // question nulle part.
      const cite = (i: number) => premisses.some((p) => atomes[i].some((t) => p.texte.includes(t) || p.texte.includes(capitale(t))))
      const parle = (p: Proposition<Valuation>) =>
        atomes.every((t, i) => cite(i) || !t.some((x) => p.texte.includes(x) || p.texte.includes(capitale(x))))

      // Une implication dont l'antécédent n'arrive jamais est vraie à vide :
      // juste en logique, déroutante en QCM. On ne la propose pas.
      const nonVides = implications.filter((p) => {
        const [, gauche, droite] = /^Si (.+), alors (.+)\.$/.exec(p.texte)!
        return cas.some((m) => litteraux.some((l) => ecrire(l) === gauche && vaut(m, l))) &&
          !cas.every((m) => litteraux.some((l) => ecrire(l) === droite && vaut(m, l)))
      })
      const candidats = (avecConstat ? faits : [...nonVides, ...faits]).filter(parle)
      const mode: Mode = a.chance(0.75) ? 'certaine' : 'impossible'
      const decrire = (m: Valuation) =>
        `le cas où ${atomes
          .map((_, i) => i)
          .filter(cite)
          .map((i) => ecrire({ atome: i, oui: ((m >> i) & 1) === 1 }))
          .join(', ')}`
      const pose = poser(a, mode, { univers, premisses, bonnes: candidats, leurres: candidats, decrire })
      if (!pose) continue

      const enonce = [
        'On sait que :',
        ...regles.map((p) => `— ${p.texte}`),
        ...(constat ? [`On constate par ailleurs ${que(ecrire(constat.l))}.`] : []),
      ].join('\n')
      return question(a, mode, {
        enonce,
        univers,
        premisses,
        pose,
        decrire,
        methode:
          `Écrire chaque condition en flèche (A ⇒ B) et ajouter tout de suite sa contraposée (non-B ⇒ non-A) : ` +
          `ce sont les deux seules lectures valides. « Si A, alors B » ne dit RIEN quand A est faux, et rien ` +
          `de B vers A — affirmer le conséquent ou nier l'antécédent sont les deux erreurs que le sous-test attend.`,
        nomCas: ['cas', 'cas'],
      })
    }
  },
}

/* ------------------------------------------------------------ menteurs -- */

/** Le bit i dit si le i-ème habitant est Fourbe. */
type Clans = number

export interface Declaration {
  texte: string
  vrai: (m: Clans) => boolean
}

const fourbe = (m: Clans, i: number) => ((m >> i) & 1) === 1
const nbFourbes = (m: Clans) => [0, 1, 2].filter((i) => fourbe(m, i)).length

/** Ce que l'habitant `s` peut dire, parmi trois. */
export function declarationsPossibles(noms: string[], s: number): Declaration[] {
  const r: Declaration[] = []
  for (let x = 0; x < 3; x++) {
    if (x === s) continue
    r.push({ texte: `${noms[x]} appartient au clan des Fourbes.`, vrai: (m) => fourbe(m, x) })
    r.push({ texte: `${noms[x]} appartient au clan des Véridiques.`, vrai: (m) => !fourbe(m, x) })
    r.push({ texte: `${noms[x]} et moi appartenons au même clan.`, vrai: (m) => fourbe(m, x) === fourbe(m, s) })
    r.push({ texte: `${noms[x]} et moi appartenons à des clans différents.`, vrai: (m) => fourbe(m, x) !== fourbe(m, s) })
  }
  const [x, y] = [0, 1, 2].filter((i) => i !== s)
  r.push({ texte: `${noms[x]} et ${noms[y]} appartiennent au même clan.`, vrai: (m) => fourbe(m, x) === fourbe(m, y) })
  r.push({ texte: `${noms[x]} et ${noms[y]} appartiennent à des clans différents.`, vrai: (m) => fourbe(m, x) !== fourbe(m, y) })
  r.push({ texte: `Exactement un de nous trois appartient au clan des Fourbes.`, vrai: (m) => nbFourbes(m) === 1 })
  r.push({ texte: `Exactement deux de nous trois appartiennent au clan des Fourbes.`, vrai: (m) => nbFourbes(m) === 2 })
  r.push({ texte: `Au moins l’un de nous trois appartient au clan des Fourbes.`, vrai: (m) => nbFourbes(m) >= 1 })
  r.push({ texte: `Nous appartenons tous les trois au clan des Fourbes.`, vrai: (m) => nbFourbes(m) === 3 })
  return r
}

/** Une déclaration est cohérente quand elle est vraie dans la bouche d'un Véridique, fausse dans celle d'un Fourbe. */
const coherent = (m: Clans, s: number, d: Declaration) => d.vrai(m) === !fourbe(m, s)

export function nommerFourbes(noms: string[], m: Clans): string {
  const f = noms.filter((_, i) => fourbe(m, i))
  if (f.length === 0) return 'Aucun des trois'
  if (f.length === 1) return `${f[0]} seulement`
  if (f.length === 2) return `${f[0]} et ${f[1]}`
  return 'Les trois'
}

const menteurs: Famille = {
  skillId: SKILL,
  nom: 'Véridiques et Fourbes',
  produire(a) {
    for (;;) {
      const noms = a.melanger(PRENOMS).slice(0, 3)
      // Deux ou trois habitants parlent ; quand l'un se tait, il faut le déduire.
      const parlants = a.chance(0.7) ? [0, 1, 2] : a.melanger([0, 1, 2]).slice(0, 2).sort()
      const dits = parlants.map((s) => ({ s, d: a.choix(declarationsPossibles(noms, s)) }))
      const solutions = [0, 1, 2, 3, 4, 5, 6, 7].filter((m) => dits.every(({ s, d }) => coherent(m, s, d)))
      if (solutions.length !== 1) continue
      const juste = solutions[0]

      const violations = (m: Clans) => dits.filter(({ s, d }) => !coherent(m, s, d))
      const autres = a
        .melanger([0, 1, 2, 3, 4, 5, 6, 7].filter((m) => m !== juste))
        .sort((x, y) => violations(x).length - violations(y).length)
        .slice(0, 4)
      const leurres = autres.map((m): [string, string] => {
        const { s, d } = violations(m)[0]
        return [
          nommerFourbes(noms, m),
          fourbe(m, s)
            ? `impossible : ${noms[s]} serait Fourbe, et sa déclaration (« ${d.texte} ») serait pourtant vraie`
            : `impossible : ${noms[s]} serait Véridique, et sa déclaration (« ${d.texte} ») serait pourtant fausse`,
        ]
      })
      const bonne = nommerFourbes(noms, juste)
      const { options, bonneReponse, diagnostics } = qcmTexte(a, bonne, leurres)
      const verif = dits
        .map(({ s, d }) => `   • ${noms[s]} est ${fourbe(juste, s) ? 'Fourbe' : 'Véridique'}, et « ${d.texte} » est bien ${d.vrai(juste) ? 'vraie' : 'fausse'}.`)
        .join('\n')

      return {
        section: S,
        skillId: SKILL,
        typeItem: 'qcm',
        enonce:
          `Sur une île vivent deux clans : les Véridiques, qui disent toujours la vérité, et les Fourbes, qui mentent toujours. ` +
          `On rencontre trois habitants, ${noms[0]}, ${noms[1]} et ${noms[2]}.\n` +
          dits.map(({ s, d }) => `${noms[s]} déclare : « ${d.texte} »`).join('\n') +
          `\nQui, parmi les trois, appartient au clan des Fourbes ?`,
        options,
        bonneReponse,
        diagnostics,
        rappel: `Une seule répartition rend chaque déclaration vraie chez un Véridique et fausse chez un Fourbe : on la trouve en testant les hypothèses.`,
        explication:
          `1. Faire une hypothèse sur un habitant (« ${noms[dits[0].s]} est Véridique »), en tirer ce que sa déclaration impose, ` +
          `et dérouler jusqu'à une contradiction ou une répartition qui tient. Puis l'hypothèse contraire.\n` +
          `2. Sur les huit répartitions possibles, une seule tient : ${bonne.toLowerCase().replace('aucun des trois', 'aucun Fourbe')}.\n` +
          `3. Vérification, déclaration par déclaration :\n${verif}\n` +
          `4. Chaque autre répartition fait mentir un Véridique ou dire vrai un Fourbe — la correction de la proposition cochée ` +
          `dit lequel. Une déclaration sur soi-même (« X et moi… ») se lit en deux temps : sa valeur de vérité, puis ce qu'elle impose selon le clan de celui qui parle.`,
        difficulte: 5,
      }
    }
  },
}

/* ----------------------------------------------------------- calendrier -- */

export const JOURS = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche']
export const MOIS: Array<[nom: string, jours: number]> = [
  ['janvier', 31], ['février', 28], ['mars', 31], ['avril', 30], ['mai', 31], ['juin', 30],
  ['juillet', 31], ['août', 31], ['septembre', 30], ['octobre', 31], ['novembre', 30], ['décembre', 31],
]
const jour = (k: number) => JOURS[((k % 7) + 7) % 7]
const quantieme = (d: number) => (d === 1 ? '1er' : String(d))

const calendrier: Famille = {
  skillId: SKILL,
  nom: 'calendrier',
  produire(a) {
    const forme = a.choix(['avant-hier', 'surlendemain', 'dates'] as const)
    let enonce: string, juste: number, leurres: Array<[number, string]>, etapes: string

    if (forme === 'avant-hier') {
      const j = a.entier(0, 6)
      const n = a.entier(10, 100)
      enonce = `Avant-hier, nous étions ${JOURS[j]}. Quel jour de la semaine serons-nous dans ${n} jours ?`
      juste = j + 2 + n
      etapes =
        `aujourd'hui = ${JOURS[j]} + 2 = ${jour(j + 2)} ; ${n} = 7 × ${Math.floor(n / 7)} + ${n % 7}, ` +
        `donc dans ${n} jours on avance de ${n % 7} jour${n % 7 > 1 ? 's' : ''} : ${jour(juste)}`
      leurres = [
        [j + n, 'c’est compter à partir d’avant-hier, comme si c’était aujourd’hui'],
        [j + 1 + n, 'avant-hier a été pris pour hier : il manque un jour'],
        [j + 3 + n, 'un jour de trop : le jour de départ a été compté deux fois'],
        [j + 2 - n, 'on a reculé de ' + n + ' jours au lieu d’avancer'],
      ]
    } else if (forme === 'surlendemain') {
      const j = a.entier(0, 6)
      const n = a.entier(10, 100)
      enonce = `Dans ${n} jours, nous serons le surlendemain d’un ${JOURS[j]}. Quel jour de la semaine était-on hier ?`
      juste = j + 2 - n - 1
      etapes =
        `dans ${n} jours = ${JOURS[j]} + 2 = ${jour(j + 2)} ; reculer de ${n} jours, c'est reculer de ${n % 7} ` +
        `(${n} = 7 × ${Math.floor(n / 7)} + ${n % 7}) : aujourd'hui = ${jour(j + 2 - n)} ; hier = ${jour(juste)}`
      leurres = [
        [j + 2 - n, 'c’est le jour d’aujourd’hui — la question demande hier'],
        [j + 1 - n - 1, 'le surlendemain a été pris pour le lendemain'],
        [j + 2 + n - 1, 'on a avancé de ' + n + ' jours au lieu de reculer'],
        [j - n - 1, 'le surlendemain a été oublié : on est parti du ' + JOURS[j] + ' lui-même'],
      ]
    } else {
      // Deux dates d'une année non bissextile, au moins un mois d'écart.
      const debut = Array.from({ length: 12 }, (_, m) => MOIS.slice(0, m).reduce((s, [, d]) => s + d, 0))
      let m1: number, d1: number, m2: number, d2: number, ecart: number
      do {
        m1 = a.entier(0, 9)
        d1 = a.entier(1, MOIS[m1][1])
        m2 = a.entier(m1 + 1, 11)
        d2 = a.entier(1, MOIS[m2][1])
        ecart = debut[m2] + d2 - (debut[m1] + d1)
      } while (ecart < 40 || ecart > 250)
      const j = a.entier(0, 6)
      enonce =
        `Dans une année non bissextile, le ${quantieme(d1)} ${MOIS[m1][0]} est un ${JOURS[j]}. ` +
        `Quel jour de la semaine sera le ${quantieme(d2)} ${MOIS[m2][0]} de la même année ?`
      juste = j + ecart
      const trente = (m2 - m1) * 30 + d2 - d1
      const trenteEtUn = (m2 - m1) * 31 + d2 - d1
      const mois = MOIS.slice(m1, m2).map(([nom, d]) => `${nom} ${d}`).join(', ')
      etapes =
        `écart = ${ecart} jours (mois traversés : ${mois}, puis ${d2} − ${d1} jours) ; ${ecart} = 7 × ${Math.floor(ecart / 7)} + ${ecart % 7}, ` +
        `donc on avance de ${ecart % 7} jour${ecart % 7 > 1 ? 's' : ''} : ${jour(juste)}`
      leurres = [
        [j + trente, 'tous les mois ont été comptés à 30 jours'],
        [j + ecart + 1, 'un jour de trop : le premier jour a été compté dans l’écart'],
        [j + trenteEtUn, 'tous les mois ont été comptés à 31 jours'],
        [j - ecart, 'on a reculé au lieu d’avancer'],
        [j + ecart - 1, 'un jour de moins : l’écart a été compté une case trop court'],
      ]
    }

    const bonne = capitale(jour(juste))
    const { options, bonneReponse, diagnostics } = qcmTexte(
      a,
      bonne,
      leurres.map(([k, motif]): [string, string] => [capitale(jour(k)), motif]),
      () => capitale(jour(a.entier(0, 6))),
    )
    return {
      section: S,
      skillId: SKILL,
      typeItem: 'qcm',
      enonce,
      options,
      bonneReponse,
      diagnostics,
      rappel: `Les jours reviennent tous les 7 : seul le reste de la division par 7 compte.`,
      explication:
        `1. Ramener l'énoncé à un seul jour de référence, en traduisant chaque mot : hier = −1, avant-hier = −2, ` +
        `lendemain = +1, surlendemain = +2.\n` +
        `2. Ne garder du décalage que son reste par 7 — les semaines entières ne changent rien.\n` +
        `3. Ici : ${etapes}.\n` +
        `4. Réponse : ${bonne.toLowerCase()}.\n` +
        `Les erreurs classiques : un mot du calendrier traduit d'un jour de travers (avant-hier pris pour hier), ` +
        `le jour de départ compté deux fois, le sens du décalage inversé, des mois comptés à 30 jours.`,
      difficulte: 5,
    }
  },
}

/* ---------------------------------------------------------- recoupement -- */

interface Groupe {
  intro: (n: number) => string
  /** Quand l'énoncé parle en pourcentages, l'effectif n'est pas donné. */
  introPourcent: string
  nom: string
  a: string
  b: string
  deux: string
  aucun: string
  chacun: string
}

export const GROUPES: Groupe[] = [
  {
    intro: (n) => `Dans un lycée, une classe compte ${n} élèves`,
    introPourcent: 'On interroge les élèves d’un lycée',
    nom: 'élèves',
    a: 'font du sport',
    b: 'font de la musique',
    deux: 'font à la fois du sport et de la musique',
    aucun: 'ne font ni sport ni musique',
    chacun: 'Chaque élève fait du sport ou de la musique (ou les deux).',
  },
  {
    intro: (n) => `Une entreprise emploie ${n} salariés`,
    introPourcent: 'On interroge les salariés d’une entreprise',
    nom: 'salariés',
    a: 'parlent anglais',
    b: 'parlent espagnol',
    deux: 'parlent à la fois anglais et espagnol',
    aucun: 'ne parlent ni anglais ni espagnol',
    chacun: 'Chaque salarié parle anglais ou espagnol (ou les deux).',
  },
  {
    intro: (n) => `Une boulangerie a reçu ${n} clients ce matin`,
    introPourcent: 'Une boulangerie fait le bilan de ses clients de la matinée',
    nom: 'clients',
    a: 'ont acheté du pain',
    b: 'ont acheté des viennoiseries',
    deux: 'ont acheté à la fois du pain et des viennoiseries',
    aucun: 'n’ont acheté ni pain ni viennoiseries',
    chacun: 'Chaque client a acheté du pain ou des viennoiseries (ou les deux).',
  },
  {
    intro: (n) => `Un club compte ${n} adhérents`,
    introPourcent: 'Un club fait le point sur ses adhérents',
    nom: 'adhérents',
    a: 'pratiquent la natation',
    b: 'pratiquent le tennis',
    deux: 'pratiquent à la fois la natation et le tennis',
    aucun: 'ne pratiquent ni la natation ni le tennis',
    chacun: 'Chaque adhérent pratique la natation ou le tennis (ou les deux).',
  },
]

/** Un cas : le nombre de personnes qui sont dans les deux sous-groupes. */
type Recoupement = number

const recoupement: Famille = {
  skillId: SKILL,
  nom: 'sous-groupes qui se recoupent',
  produire(a) {
    for (;;) {
      const g = a.choix(GROUPES)
      const enPourcent = a.chance(0.4)
      const N = enPourcent ? 100 : a.choix([20, 25, 30, 40, 50, 60, 80, 120, 200])
      const pas = enPourcent ? 5 : N >= 80 ? 2 : 1
      const na = pas * a.entier(Math.ceil((N * 0.45) / pas), Math.floor((N * 0.9) / pas))
      const nb = pas * a.entier(Math.ceil((N * 0.3) / pas), Math.floor((N * 0.85) / pas))
      const lo = Math.max(0, na + nb - N)
      const hi = Math.min(na, nb)
      if (lo < 2 || hi - lo < 3) continue
      const univers = Array.from({ length: hi - lo + 1 }, (_, i) => lo + i)

      const qte = (k: number) => (enPourcent ? `${k} % des ${g.nom}` : `${k} ${g.nom}`)
      const ni = (x: Recoupement) => N - na - nb + x
      const auMoins = (k: number, piege?: string, appat?: number): Proposition<Recoupement> => ({
        texte: `Au moins ${qte(k)} ${g.deux}.`, vrai: (x) => x >= k, piege, appat,
      })
      const auPlus = (k: number, piege?: string): Proposition<Recoupement> => ({
        texte: `Au plus ${qte(k)} ${g.deux}.`, vrai: (x) => x <= k, piege,
      })
      const exactement = (k: number, piege?: string, appat?: number): Proposition<Recoupement> => ({
        texte: `Exactement ${qte(k)} ${g.deux}.`, vrai: (x) => x === k, piege, appat,
      })
      const niPlusDe = (k: number): Proposition<Recoupement> => ({
        texte: `Au plus ${qte(k)} ${g.aucun}.`, vrai: (x) => ni(x) <= k,
      })
      const niAuMoins = (k: number, piege?: string): Proposition<Recoupement> => ({
        texte: `Au moins ${qte(k)} ${g.aucun}.`, vrai: (x) => ni(x) >= k, piege,
      })
      const chacun: Proposition<Recoupement> = {
        texte: g.chacun, vrai: (x) => ni(x) === 0, piege: 'c’est le cas où le recoupement est le plus petit possible, pas le seul',
      }

      const produit = Math.round((na * nb) / N)
      const yhi = N - Math.max(na, nb)
      const bonnes = [auMoins(lo), auMoins(lo), auMoins(lo), auPlus(hi), niPlusDe(yhi)]
      const leurres = [
        auMoins(produit, 'c’est le calcul d’indépendance (une proportion multipliée par l’autre), que rien n’impose', 1),
        exactement(lo, 'le minimum possible a été pris pour la valeur exacte', 1),
        exactement(produit, 'c’est le calcul d’indépendance, que rien n’impose'),
        auMoins(hi, 'c’est le maximum possible, atteint seulement si un groupe est inclus dans l’autre'),
        auPlus(lo, 'le minimum possible a été lu comme un maximum'),
        auMoins(lo + Math.ceil((hi - lo) / 2)),
        auPlus(Math.abs(na - nb), 'l’écart entre les deux effectifs ne mesure pas le recoupement'),
        chacun,
        niAuMoins(Math.max(1, N - na - nb + hi - 1), 'ce n’est vrai que si le recoupement est presque maximal'),
      ].filter((p) => !/^Au (moins|plus) [01] |^Exactement [01] /.test(p.texte))
      const brut = (k: number) => (enPourcent ? `${k} %` : pluriel(k, 'personne'))
      const decrire = (x: Recoupement) =>
        `le cas où les deux groupes ont ${brut(x)} en commun (et ${brut(ni(x))} dans aucun des deux)`
      const pose = poser(a, 'certaine', { univers, premisses: [], bonnes, leurres, decrire })
      if (!pose) continue
      const [pa, pb] = enPourcent ? [`${na} %`, `${nb} %`] : [String(na), String(nb)]
      const enonce =
        `${enPourcent ? g.introPourcent : g.intro(N)}. Parmi eux, ${pa} ${g.a}, et ${pb} ${g.b}.`
      return question(a, 'certaine', {
        enonce,
        univers,
        premisses: [],
        pose,
        decrire,
        methode:
          `Le recoupement n'est PAS donné : il peut varier. Il est le plus petit quand les deux groupes se chevauchent ` +
          `le moins possible — ${na} + ${nb} − ${N} = ${lo} ${enPourcent ? '%' : g.nom} —, et le plus grand quand le petit groupe ` +
          `est entièrement dans le grand — ${hi}. Toute valeur entre les deux est possible.`,
        nomCas: ['cas', 'cas'],
      })
    }
  },
}

export const FAMILLES_ENIGMES: Famille[] = [classement, rangee, conditions, menteurs, calendrier, recoupement]
