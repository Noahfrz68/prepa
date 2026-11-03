/**
 * Sous-test 2 — Calcul : les questions à une idée.
 *
 * Relevé sur une épreuve blanche de prépa (2026-11-03) : sur dix questions de
 * calcul, cinq relevaient d'un type que le générateur ne posait pas, et aucune
 * ne se réglait en appliquant une formule. Chacune tient en deux lignes et se
 * résout en moins d'une minute à condition de voir LE point : une condition qui
 * ne désigne personne, une durée qui ne suit pas la vitesse, une grille que les
 * colonnes remplissent presque seules, un total qui doit tomber juste deux fois.
 *
 * Les énoncés sont écrits ici, sur ces modèles ; aucun n'est recopié.
 */

import type { Case } from '@/core/figures/types'
import { de, fraction, nombre, pgcd, ppcm } from './alea'
import { chercher } from './calcul-problemes'
import { qcm, qcmFraction, type Leurre, type LeurreFraction } from './qcm'
import type { Famille } from './types'

const S = 'calcul' as const

const etapes = (lignes: string[], piege: string) =>
  `${lignes.map((e, i) => `${i + 1}. ${e}`).join('\n')}\nLe piège : ${piege}`

/** Sans zéros inutiles : « 22,4 » et non « 22,40 ». */
const decimal = (v: number) => nombre(v, 2).replace(/(,\d*?)0+$/, '$1').replace(/,$/, '')

const NOMBRES_MOTS = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six']

/* ------------------------------------------- probabilité conditionnelle -- */

type Issue = number[]

/**
 * « Sachant que l'un des deux est un mâle » : la condition ne désigne personne.
 * Elle écarte un seul cas (aucun mâle) et en laisse trois, d'où 1/3 et non 1/2.
 * La même question où un individu est NOMMÉ vaut 1/2 : les deux formulations
 * alternent, pour qu'on apprenne à lire la condition plutôt qu'à retenir 1/3.
 */
const probaConditionnelle: Famille = {
  skillId: 'tm.calcul.probabilites',
  nom: 'probabilité conditionnelle',
  produire(a) {
    const precise = a.chance(0.35)
    const scene = a.choix(['chiots', 'pieces', 'des'] as const)

    let issues: Issue[]
    let condition: (i: Issue) => boolean
    let autre: (i: Issue) => boolean
    let evenement: (i: Issue) => boolean
    let enonce: string
    let lecture: string
    let individu: string
    let feminin = false
    let binaire = true

    if (scene === 'des') {
      binaire = false
      individu = 'un dé'
      const v = a.entier(1, 6)
      const double = a.chance(0.4)
      const somme = v + a.entier(1, 6)
      issues = []
      for (let r = 1; r <= 6; r++) for (let b = 1; b <= 6; b++) issues.push([r, b])
      const auMoins = (i: Issue) => i[0] === v || i[1] === v
      const rouge = (i: Issue) => i[0] === v
      condition = precise ? rouge : auMoins
      autre = precise ? auMoins : rouge
      evenement = double ? (i) => i[0] === v && i[1] === v : (i) => i[0] + i[1] === somme
      enonce =
        `On lance deux dés équilibrés, un rouge et un bleu. ` +
        (precise ? `Sachant que le dé rouge affiche ${v}, ` : `Sachant qu'au moins l'un des deux dés affiche ${v}, `) +
        (double ? `quelle est la probabilité que les deux dés affichent ${v} ?` : `quelle est la probabilité que la somme des deux dés fasse ${somme} ?`)
      lecture = `les 36 couples (rouge, bleu)`
    } else {
      const k = a.chance(0.6) ? 2 : 3
      const seul = a.chance(0.3)
      const [x, y] = scene === 'chiots' ? ['M', 'F'] : ['P', 'F']
      issues = []
      for (let m = 0; m < 2 ** k; m++) issues.push(Array.from({ length: k }, (_, j) => (m >> (k - 1 - j)) & 1))
      const auMoins = (i: Issue) => i.includes(1)
      const premier = (i: Issue) => i[0] === 1
      condition = precise ? premier : auMoins
      autre = precise ? auMoins : premier
      evenement = seul ? (i) => i.filter((c) => c === 1).length === 1 : (i) => i.every((c) => c === 1)
      lecture = issues.map((i) => i.map((c) => (c ? x : y)).join('')).join(', ')
      const tous = k === 2 ? 'les deux' : 'les trois'

      if (scene === 'chiots') {
        individu = 'un chiot'
        const noms = a.melanger(['Filou', 'Moka', 'Tango', 'Biscuit', 'Réglisse', 'Pépite']).slice(0, k)
        const liste = k === 2 ? `${noms[0]} et ${noms[1]}` : `${noms[0]}, ${noms[1]} et ${noms[2]}`
        enonce =
          `Une chienne a eu ${NOMBRES_MOTS[k]} chiots, ${liste} ; à chaque naissance, mâle et femelle sont également probables. ` +
          (precise
            ? `Sachant que ${noms[0]} est un mâle, `
            : k === 2
              ? `Sachant que l'un des deux est un mâle, sans savoir lequel, `
              : `Sachant qu'au moins l'un des trois est un mâle, `) +
          (seul ? `quelle est la probabilité qu'il y ait exactement un mâle dans la portée ?` : `quelle est la probabilité que ${tous} soient des mâles ?`)
      } else {
        individu = 'une pièce'
        feminin = true
        enonce =
          `On lance ${NOMBRES_MOTS[k]} pièces équilibrées, l'une après l'autre. ` +
          (precise
            ? `Sachant que la première est tombée sur pile, `
            : k === 2
              ? `Sachant que l'une des deux est tombée sur pile, sans savoir laquelle, `
              : `Sachant qu'au moins l'une des trois est tombée sur pile, `) +
          (seul ? `quelle est la probabilité qu'une seule pièce soit tombée sur pile ?` : `quelle est la probabilité que ${tous} soient tombées sur pile ?`)
      }
    }

    const precis = feminin ? 'précise' : 'précis'
    const designe = feminin ? 'désignée' : 'désigné'
    const N = issues.length
    const C = issues.filter(condition)
    const nC = C.length
    const nCE = C.filter(evenement).length
    const nE = issues.filter(evenement).length
    const nA = issues.filter(autre).length
    const nAE = issues.filter((i) => autre(i) && evenement(i)).length

    const leurres: LeurreFraction[] = [
      [
        [nAE, nA],
        precise
          ? `c’est la réponse pour « au moins un » ; ici la condition désigne ${individu} ${precis}, et seuls les autres restent à tirer`
          : `c’est la réponse si la condition désignait ${individu} ${precis} ; « au moins un » laisse ouverts ${nC} cas, pas ${nA}`,
      ],
      [[nE, N], 'la condition a été ignorée : c’est la probabilité avant toute information'],
      [[nCE, N], 'les cas favorables ont été comptés sur toutes les issues, au lieu des seules issues où la condition est remplie'],
      [[nC - nCE, nC], 'c’est la probabilité de l’événement contraire'],
    ]
    if (binaire) leurres.push([[1, 2], 'chaque tirage est indépendant, mais la condition ne porte sur aucun individu en particulier'])

    const { options, bonneReponse, diagnostics } = qcmFraction(a, [nCE, nC], leurres, [nC, N], () => {
      const D = a.choix([nC, N, nC + 1, N - 1])
      return [a.entier(1, D - 1), D]
    })

    const reponse = fraction(nCE, nC)
    return {
      section: S,
      skillId: probaConditionnelle.skillId,
      typeItem: 'qcm',
      enonce,
      options,
      bonneReponse,
      diagnostics,
      rappel: `On ne garde que les ${nC} cas où la condition est vraie, dont ${nCE} favorable${nCE > 1 ? 's' : ''} : ${reponse}.`,
      explication: etapes(
        [
          `Avant toute information, ${N} issues équiprobables : ${lecture}.`,
          precise
            ? `La condition porte sur ${individu} ${designe} : elle garde ${nC} issues sur ${N}.`
            : `La condition « au moins un » écarte seulement les issues où aucun ne convient : il en reste ${nC}.`,
          `Parmi ces ${nC} issues, ${nCE} réalise${nCE > 1 ? "nt" : ""} l'événement demandé.`,
          `Probabilité : ${nCE}/${nC}${reponse === `${nCE}/${nC}` ? '' : ` = ${reponse}`}.`,
        ],
        precise
          ? `quand la condition nomme ${individu}, son résultat est connu et seuls les autres comptent. Avec « au moins un, sans savoir lequel », la réponse change : c'est ${fraction(nAE, nA)}.`
          : `« au moins un » ne dit pas lequel. On ne peut pas fixer ${individu} et tirer les autres : on liste les issues, on raye celles que la condition exclut, et on compte ce qui reste.`,
      ),
      difficulte: 4,
    }
  },
}

/* ---------------------------------------------- deux vitesses, deux heures -- */

const heure = (m: number) => {
  const h = Math.floor(m / 60)
  const mm = m % 60
  return mm ? `${h} h ${String(mm).padStart(2, '0')}` : `${h} h`
}
const duree = (m: number) => {
  const h = Math.floor(m / 60)
  const mm = m % 60
  if (!h) return `${mm} min`
  return mm ? `${h} h ${String(mm).padStart(2, '0')}` : `${h} h`
}

/**
 * « À 40 km/h j'arrive à 20 h 30, à 60 km/h à 19 h 30 : quelle vitesse pour
 * 20 h ? » La réponse n'est pas 50 : la durée varie comme 1 / vitesse. On passe
 * par la distance (l'écart de durée la donne), puis par l'heure de départ.
 */
const deuxHoraires: Famille = {
  skillId: 'tm.calcul.vitesses_debits_et_melanges',
  nom: 'deux vitesses, deux heures d’arrivée',
  produire(a) {
    const p = chercher(
      a,
      (a) => {
        const v1 = a.choix([30, 40, 45, 50, 60, 75, 80])
        const v2 = a.choix([40, 45, 50, 60, 75, 80, 90, 100, 120].filter((v) => v > v1))
        const d = a.entier(3, 30) * 10
        const t1 = (d * 60) / v1
        const t2 = (d * 60) / v2
        const milieu = a.chance(0.6)
        const t3 = milieu ? (t1 + t2) / 2 : a.entier(Math.ceil(t2 / 5) + 1, Math.floor(t1 / 5) - 1) * 5
        const depart = a.entier(5 * 4, 15 * 4) * 15
        return { v1, v2, d, t1, t2, t3, depart, milieu }
      },
      ({ v1, v2, d, t1, t2, t3, depart }) =>
        Number.isInteger(t1) &&
        Number.isInteger(t2) &&
        Number.isInteger(t3) &&
        t1 - t2 >= 20 &&
        t1 - t2 <= 120 &&
        t3 > t2 &&
        t3 < t1 &&
        Number.isInteger((d * 60) / t3) &&
        (d * 60) / t3 !== (v1 + v2) / 2 &&
        depart + t1 < 23 * 60,
    )
    const { v1, v2, d, t1, t2, t3, depart } = p
    const v = (d * 60) / t3
    const [h1, h2, h3] = [depart + t1, depart + t2, depart + t3]

    const vehicule = a.chance(0.5)
    const enonce = vehicule
      ? `Une navette quitte le dépôt chaque matin à la même heure. À ${v1} km/h, elle arrive à ${heure(h1)} ; à ${v2} km/h, elle arrive à ${heure(h2)}. ` +
        `À quelle vitesse constante doit-elle rouler pour arriver à ${heure(h3)} ?`
      : `Si je roule à ${v1} km/h, j'arrive chez moi à ${heure(h1)}. Si je roule à ${v2} km/h, j'arrive à ${heure(h2)}. ` +
        `À quelle vitesse dois-je rouler pour arriver à ${heure(h3)} pile ?`

    const interpolee = v1 + ((v2 - v1) * (t1 - t3)) / (t1 - t2)
    const leurres: Leurre[] = [
      [
        interpolee,
        p.milieu
          ? 'c’est la moyenne des deux vitesses : viser l’heure du milieu ne donne pas la vitesse du milieu, la durée varie comme 1 / vitesse'
          : 'c’est une règle de trois sur les heures : la durée n’est pas proportionnelle à la vitesse',
      ],
    ]
    if (d < 3 * v2) leurres.push([d, `c’est la distance (${d} km), trouvée en cours de route : il restait à la diviser par la durée voulue`])
    const faux = t3 - t1 + t2
    if (faux > 0 && Number.isInteger((d * 60) / faux) && (d * 60) / faux <= 2 * v2) {
      leurres.push([(d * 60) / faux, 'l’heure de départ a été calculée en mélangeant la durée d’un trajet et l’heure d’arrivée de l’autre'])
    }

    const { options, bonneReponse, diagnostics } = qcm(a, v, leurres, (x) => `${nombre(x, Number.isInteger(x) ? 0 : 1)} km/h`, { minimum: 1 })

    return {
      section: S,
      skillId: deuxHoraires.skillId,
      typeItem: 'qcm',
      enonce,
      options,
      bonneReponse,
      diagnostics,
      rappel: `Écart ${duree(t1 - t2)} → ${d} km, départ ${heure(depart)} → ${d} km en ${duree(t3)} = ${v} km/h.`,
      explication: etapes(
        [
          `Les deux trajets partent à la même heure et couvrent la même distance d. Leur écart d'arrivée, ${duree(t1 - t2)}, est l'écart de leurs durées.`,
          `En minutes : d × 60 / ${v1} − d × 60 / ${v2} = ${t1 - t2}, d'où d = ${d} km.`,
          `À ${v1} km/h, le trajet dure ${duree(t1)} : le départ a lieu à ${heure(h1)} − ${duree(t1)} = ${heure(depart)}.`,
          `Pour arriver à ${heure(h3)}, il faut couvrir ${d} km en ${duree(t3)} : ${d} × 60 ÷ ${t3} = ${v} km/h.`,
        ],
        `répondre ${nombre(interpolee, Number.isInteger(interpolee) ? 0 : 1)} km/h. La vitesse et l'heure d'arrivée ne sont pas liées par une droite : on passe toujours par la distance, puis par l'heure de départ.`,
      ),
      difficulte: 4,
    }
  },
}

/* ------------------------------------------------- grille à sommes égales -- */

/**
 * Les nombres de 1 à 2n dans un tableau de 2 lignes et n colonnes, colonnes de
 * même somme, lignes de même somme. Les sommes se déduisent du total ; une case
 * connue par colonne complète cette colonne ; la colonne de X, laissée vide,
 * n'a plus que deux remplissages possibles, et la somme des lignes tranche.
 */
const grilleSommes: Famille = {
  skillId: 'tm.calcul.arithmetique_et_divisibilite',
  nom: 'grille à sommes égales',
  produire(a) {
    const n = a.chance(0.75) ? 4 : 6
    const total = n * (2 * n + 1)
    const sCol = 2 * n + 1
    const sLigne = total / 2

    const grille = chercher(
      a,
      (a) => {
        const paires = a.melanger(Array.from({ length: n }, (_, i) => [i + 1, sCol - i - 1]))
        return paires.map((p) => (a.chance(0.5) ? p : [p[1], p[0]]))
      },
      (cols) => cols.reduce((s, c) => s + c[0], 0) === sLigne,
    )
    const jx = a.entier(0, n - 1)
    const ix = a.entier(0, 1)
    const X = grille[jx][ix]
    // Une case dévoilée par colonne, sauf dans celle de X.
    const devoilee = grille.map((_, j) => (j === jx ? -1 : a.entier(0, 1)))

    const lignes: Case[][] = [0, 1].map((i) =>
      grille.map((col, j): Case => {
        if (j === jx && i === ix) return { texte: 'X', cadre: 'epais' }
        return devoilee[j] === i ? { texte: String(col[i]) } : {}
      }),
    )

    const voisin = sCol - X
    const autres = grille
      .map((col, j) => ({ j, connu: col[devoilee[j]], cache: col[1 - devoilee[j]] }))
      .filter((c) => c.j !== jx)
    const connus = a.melanger(autres)
    const leurres: Leurre[] = [
      [voisin, `c’est la valeur de l’autre case de la colonne de X : la somme des lignes départage les deux`],
      ...connus.map((c): Leurre => [c.cache, `${c.cache} va forcément avec le ${c.connu}, pour que sa colonne fasse ${sCol}`]),
      ...connus.map((c): Leurre => [c.connu, `${c.connu} est déjà dans la grille, et chaque nombre ne sert qu’une fois`]),
    ]
    const { options, bonneReponse, diagnostics } = qcm(a, X, leurres, (v) => nombre(v), { minimum: 1 })

    const ligneX = grille.map((col) => col[ix])
    const sansX = ligneX.filter((_, j) => j !== jx)
    const nomLigne = ix === 0 ? 'du haut' : 'du bas'

    return {
      section: S,
      skillId: grilleSommes.skillId,
      typeItem: 'qcm',
      enonce:
        `On place les nombres de 1 à ${2 * n}, chacun une seule fois, dans ce tableau de 2 lignes et ${n} colonnes. ` +
        `Les ${n} colonnes ont toutes la même somme, et les deux lignes aussi. Combien vaut X ?`,
      figure: { type: 'matrice', lignes },
      options,
      bonneReponse,
      diagnostics,
      rappel: `Colonnes à ${sCol}, lignes à ${sLigne} : X = ${sLigne} − (${sansX.join(' + ')}) = ${X}.`,
      explication: etapes(
        [
          `Total : 1 + 2 + … + ${2 * n} = ${total}. ${n} colonnes égales font ${sCol} chacune ; 2 lignes égales, ${sLigne} chacune.`,
          `Chaque colonne où un nombre est connu se complète à ${sCol} : ${autres.map((c) => `${c.connu} appelle ${c.cache}`).join(', ')}.`,
          `La ligne ${nomLigne} contient alors ${sansX.join(', ')}, soit ${sansX.reduce((s, x) => s + x, 0)}.`,
          `X = ${sLigne} − ${sansX.reduce((s, x) => s + x, 0)} = ${X}, et l'autre case de sa colonne vaut ${voisin}.`,
        ],
        `commencer par les sommes, qui se déduisent du total, jamais par des essais. Les colonnes donnent presque tout ; la ligne départage la seule colonne restée vide.`,
      ),
      difficulte: 4,
    }
  },
}

/* ----------------------------------------------- nombres et leurs chiffres -- */

const COMPARAISONS = {
  '>': { mot: 'strictement supérieur à', ok: (c: number, k: number) => c > k },
  '≥': { mot: 'supérieur ou égal à', ok: (c: number, k: number) => c >= k },
  '<': { mot: 'strictement inférieur à', ok: (c: number, k: number) => c < k },
  '≤': { mot: 'inférieur ou égal à', ok: (c: number, k: number) => c <= k },
} as const
type Comparaison = keyof typeof COMPARAISONS
const BASCULE: Record<Comparaison, Comparaison> = { '>': '≥', '≥': '>', '<': '≤', '≤': '<' }

/**
 * Compter des nombres par leurs chiffres : un choix par position, et on
 * multiplie. Le chiffre de tête ne vaut jamais 0, la parité ne regarde que les
 * unités, et « strictement » change la borne d'une unité.
 */
const chiffresContraints: Famille = {
  skillId: 'tm.calcul.denombrement',
  nom: 'nombres selon leurs chiffres',
  produire(a) {
    const m = a.chance(0.6) ? 2 : 3
    const parite = a.choix(['pairs', 'impairs', ''] as const)
    const { op, k } = chercher(
      a,
      (a) => ({ op: a.choix(Object.keys(COMPARAISONS) as Comparaison[]), k: a.entier(1, 9) }),
      ({ op, k }) => {
        const n = [1, 2, 3, 4, 5, 6, 7, 8, 9].filter((c) => COMPARAISONS[op].ok(c, k)).length
        return n >= 2 && n <= 7
      },
    )
    const tete = (o: Comparaison, avecZero = false) =>
      [...(avecZero ? [0] : []), 1, 2, 3, 4, 5, 6, 7, 8, 9].filter((c) => COMPARAISONS[o].ok(c, k)).length
    const L = tete(op)
    const U = parite ? 5 : 10
    const M = m === 3 ? 10 : 1
    const reponse = L * M * U
    const position = m === 2 ? 'dizaines' : 'centaines'

    const leurres: Leurre[] = [
      [tete(BASCULE[op]) * M * U, op === '>' || op === '<' ? `${k} a été compté alors que l’inégalité est stricte` : `${k} a été exclu alors que l’inégalité est large`],
    ]
    if (op === '<' || op === '≤') leurres.push([tete(op, true) * M * U, `0 a été accepté en tête : un nombre ne commence jamais par 0`])
    if (parite) leurres.push([L * M * 10, `la parité a été oubliée : seuls 5 chiffres des unités conviennent`])
    if (m === 3) leurres.push([L * U, `le chiffre des dizaines a été oublié : il a 10 valeurs possibles`])
    leurres.push([L + U + (m === 3 ? 10 : 0), `les choix ont été additionnés au lieu d’être multipliés`])
    if (!parite) leurres.push([L * M * 9, `le 0 a été exclu des unités, où il est permis`])

    const { options, bonneReponse, diagnostics } = qcm(a, reponse, leurres, (v) => nombre(v), { minimum: 1 })

    const facteurs = m === 3 ? `${L} × 10 × ${U}` : `${L} × ${U}`
    const chiffresTete = [1, 2, 3, 4, 5, 6, 7, 8, 9].filter((c) => COMPARAISONS[op].ok(c, k))
    return {
      section: S,
      skillId: chiffresContraints.skillId,
      typeItem: 'qcm',
      enonce:
        `Combien y a-t-il de nombres ${parite ? `${parite} ` : ''}à ${NOMBRES_MOTS[m]} chiffres ` +
        `dont le chiffre des ${position} est ${COMPARAISONS[op].mot} ${k} ?`,
      options,
      bonneReponse,
      diagnostics,
      rappel: `Un choix par position, on multiplie : ${facteurs} = ${nombre(reponse)}.`,
      explication: etapes(
        [
          `Chiffre des ${position} : ${chiffresTete.join(', ')}, soit ${L} choix${op === '<' || op === '≤' ? ' (jamais 0 en tête)' : ''}.`,
          ...(m === 3 ? ['Chiffre des dizaines : aucune contrainte, 10 choix.'] : []),
          parite
            ? `Chiffre des unités : il décide seul de la parité, ${parite === 'pairs' ? '0, 2, 4, 6, 8' : '1, 3, 5, 7, 9'}, soit 5 choix.`
            : `Chiffre des unités : aucune contrainte, 10 choix (0 compris).`,
          `Les choix sont indépendants : on les multiplie, ${facteurs} = ${nombre(reponse)}.`,
        ],
        `« strictement » retire la borne, « ou égal » la garde : vérifier sur ${k} avant de compter. Et le chiffre de tête ne vaut jamais 0.`,
      ),
      difficulte: 3,
    }
  },
}

/* ------------------------------------------------------- offre par lots -- */

const ARTICLES = [
  { vendeur: 'Un éditeur', client: 'Une librairie', pluriel: 'livres', f: false, prix: [12, 15, 18, 20, 25] },
  { vendeur: 'Une boulangerie', client: 'Une cantine', pluriel: 'baguettes', f: true, prix: [1, 2] },
  { vendeur: 'Un caviste', client: 'Un restaurant', pluriel: 'bouteilles', f: true, prix: [6, 8, 10, 12, 15] },
  { vendeur: 'Une papeterie', client: 'Une école', pluriel: 'cahiers', f: false, prix: [2, 3, 4, 5] },
]

/**
 * « Pour 5 achetés, le 6ᵉ offert » : les objets emportés vont par lots de
 * n + g, pas de n. Le reste de la division, s'il y en a un, se paie à l'unité.
 */
const offreLots: Famille = {
  skillId: 'tm.calcul.arithmetique_et_divisibilite',
  nom: 'offre par lots',
  produire(a) {
    const art = a.choix(ARTICLES)
    const n = a.choix([2, 3, 4, 5, 6, 9])
    const g = n >= 4 && a.chance(0.25) ? 2 : 1
    const lot = n + g
    const q = a.entier(4, 16)
    const r = a.chance(0.4) ? a.entier(1, n - 1) : 0
    const N = q * lot + r
    const payes = q * n + r
    const P = a.choix(art.prix)
    const e = art.f ? "e" : ""
    const offre = g === 1
      ? `pour ${n} ${art.pluriel} acheté${e}s, ${art.f ? "la" : "le"} ${n + 1}ᵉ est offert${e}`
      : `pour ${n} ${art.pluriel} acheté${e}s, ${g} sont offert${e}s`
    const inverse = a.chance(0.35)
    const euros = (v: number) => `${nombre(v)} €`

    if (inverse) {
      const leurres: Leurre[] = [
        [payes, 'c’est le nombre d’articles payés : il fallait ajouter les articles offerts'],
        [payes + Math.floor(payes / lot) * g, `les offerts ont été comptés par lots de ${lot} articles payés, au lieu de ${n}`],
        [N + g, 'des articles offerts ont été comptés pour un groupe de payés incomplet'],
        [Math.ceil(payes / n) * lot, 'le reste a été traité comme un lot complet, avec ses articles offerts'],
      ]
      const { options, bonneReponse, diagnostics } = qcm(a, N, leurres, (v) => nombre(v), { minimum: 1 })
      return {
        section: S,
        skillId: offreLots.skillId,
        typeItem: 'qcm',
        enonce:
          `${art.vendeur} fait l'offre suivante : ${offre}. ${art.client} paie ${euros(payes * P)}, ` +
          `à ${euros(P)} l'unité, en profitant au mieux de l'offre. Combien ${de(art.pluriel)} sont emporté${e}s ?`,
        options,
        bonneReponse,
        diagnostics,
        rappel: `${payes} payés = ${q} lots de ${n}${r ? ` + ${r}` : ''} → ${q} × ${g} offert${g > 1 ? 's' : ''} → ${N}.`,
        explication: etapes(
          [
            `Articles payés : ${euros(payes * P)} ÷ ${euros(P)} = ${payes}.`,
            `Chaque groupe de ${n} payés en apporte ${g} de plus : ${payes} = ${q} × ${n}${r ? ` + ${r}` : ''}, soit ${q} groupe${q > 1 ? 's' : ''} complet${q > 1 ? 's' : ''}${r ? ` et ${r} article${r > 1 ? 's' : ''} isolé${r > 1 ? 's' : ''}` : ''}.`,
            `Articles offerts : ${q} × ${g} = ${q * g}. Total emporté : ${payes} + ${q * g} = ${N}.`,
          ],
          `on compte les lots sur les articles PAYÉS, par ${n} ; un groupe incomplet ne donne droit à rien.`,
        ),
        difficulte: 3,
      }
    }

    const leurres: Leurre[] = [
      [N * P, 'l’offre a été oubliée : tous les articles ont été payés'],
      [(N - Math.floor(N / n) * g) * P, `un article offert a été compté tous les ${n} emportés ; or un lot compte ${lot} articles`],
      [Math.ceil(N / lot) * n * P, 'le dernier lot, incomplet, a été payé en entier'],
    ]
    if (g > 1) leurres.push([(N - q) * P, `un seul article offert par lot, alors que l’offre en donne ${g}`])
    const { options, bonneReponse, diagnostics } = qcm(a, payes * P, leurres, euros, { minimum: 1 })
    return {
      section: S,
      skillId: offreLots.skillId,
      typeItem: 'qcm',
      enonce:
        `${art.vendeur} fait l'offre suivante : ${offre}. ${art.client} repart avec ${N} ${art.pluriel} en ayant profité au mieux de l'offre. ` +
        `Sachant qu'un article coûte ${euros(P)}, quel montant a été payé ?`,
      options,
      bonneReponse,
      diagnostics,
      rappel: `Lots de ${lot} : ${N} = ${q} × ${lot}${r ? ` + ${r}` : ''} → ${payes} payés × ${euros(P)} = ${euros(payes * P)}.`,
      explication: etapes(
        [
          `Un lot, c'est ${n} payés + ${g} offert${g > 1 ? 's' : ''}, soit ${lot} articles emportés.`,
          `${N} = ${q} × ${lot}${r ? ` + ${r}` : ''} : ${q} lot${q > 1 ? 's' : ''} complet${q > 1 ? 's' : ''}${r ? `, et ${r} article${r > 1 ? 's' : ''} payé${r > 1 ? 's' : ''} à l'unité` : ''}.`,
          `Articles payés : ${q} × ${n}${r ? ` + ${r}` : ''} = ${payes}.`,
          `Montant : ${payes} × ${euros(P)} = ${euros(payes * P)}.`,
        ],
        `on divise par la taille du lot EMPORTÉ (${lot}), pas par le nombre d'articles payés (${n}).`,
      ),
      difficulte: 3,
    }
  },
}

/* --------------------------------------------- le seul total compatible -- */

const PARTS: Record<number, [string, string]> = {
  3: ['tiers', 'tiers'],
  4: ['quart', 'quarts'],
  6: ['sixième', 'sixièmes'],
  7: ['septième', 'septièmes'],
  8: ['huitième', 'huitièmes'],
  9: ['neuvième', 'neuvièmes'],
  11: ['onzième', 'onzièmes'],
  12: ['douzième', 'douzièmes'],
}

const LIEUX = [
  { tout: 'livres', lieu: 'Dans une bibliothèque', a: 'sont des romans', b: 'sont des essais' },
  { tout: 'élèves', lieu: 'Dans un lycée', a: 'sont internes', b: 'sont demi-pensionnaires' },
  { tout: 'arbres', lieu: 'Dans un parc', a: 'sont des chênes', b: 'sont des hêtres' },
  { tout: 'salariés', lieu: 'Dans une entreprise', a: 'sont cadres', b: 'sont en alternance' },
]

/**
 * « Un septième … et 20 % … : quel est le seul total possible ? » Le total doit
 * être divisible par 7 ET par 5. On ne résout rien : on teste les propositions,
 * et une seule passe les deux filtres.
 */
const totalCompatible: Famille = {
  skillId: 'tm.calcul.arithmetique_et_divisibilite',
  nom: 'seul total compatible',
  produire(a) {
    const { d1, n1, p, dp, L } = chercher(
      a,
      (a) => {
        const d1 = a.choix(Object.keys(PARTS).map(Number))
        const n1 = d1 >= 7 && a.chance(0.3) ? 2 : 1
        const p = a.choix([10, 15, 20, 25, 30, 35, 40, 45, 60, 75])
        const dp = 100 / pgcd(p, 100)
        return { d1, n1, p, dp, L: ppcm(d1, dp) }
      },
      ({ d1, n1, p, dp, L }) =>
        pgcd(n1, d1) === 1 && d1 % dp !== 0 && dp % d1 !== 0 && L >= 12 && L <= 70 && n1 / d1 + p / 100 < 1,
    )
    const reponse = L * a.entier(Math.ceil(80 / L), Math.floor(320 / L))
    const bas = Math.round(reponse * 0.65)
    const haut = Math.round(reponse * 1.35)
    const entre = (div: number, pas: number) => {
      const r: number[] = []
      for (let v = bas; v <= haut; v++) if (v % div === 0 && v % pas !== 0) r.push(v)
      return a.melanger(r)
    }
    const fracMot = `${NOMBRES_MOTS[n1]} ${PARTS[d1][n1 === 1 ? 0 : 1]}`
    const lieu = a.choix(LIEUX)

    const seulFrac = entre(d1, dp).slice(0, 2)
    const seulPct = entre(dp, d1).slice(0, 2)
    const leurres: Leurre[] = [
      ...seulFrac.map((v): Leurre => [v, `${v} est bien divisible par ${d1}, mais ${p} % de ${v} = ${decimal((v * p) / 100)} : pas un nombre entier ${de(lieu.tout)}`]),
      ...seulPct.map((v): Leurre => [v, `${p} % de ${v} tombe juste, mais ${v} n’est pas divisible par ${d1} : ${fracMot} de ${v} n’est pas un nombre entier`]),
    ]
    // Complément sûr : ni multiple de l'un ni de l'autre. Le complément de
    // qcm() pourrait tomber sur un autre multiple de ${L}.
    for (let v = reponse + 1; leurres.length < 4; v++) {
      if (v % d1 !== 0 && v % dp !== 0) leurres.push([v, `${v} n’est divisible ni par ${d1} ni par ${dp}`])
    }
    const { options, bonneReponse, diagnostics } = qcm(a, reponse, leurres, (v) => nombre(v), { minimum: 1 })

    const faits = a.chance(0.5)
      ? `${fracMot} des ${lieu.tout} ${lieu.a} et ${p} % ${lieu.b}`
      : `${p} % des ${lieu.tout} ${lieu.a} et ${fracMot} ${lieu.b}`
    const pctMot = `${p} % = ${fraction(p, 100)}`

    return {
      section: S,
      skillId: totalCompatible.skillId,
      typeItem: 'qcm',
      enonce:
        `${lieu.lieu}, ${faits}. ` +
        `Parmi les propositions, quel est le seul nombre total ${de(lieu.tout)} possible ?`,
      options,
      bonneReponse,
      diagnostics,
      rappel: `Divisible par ${d1} et par ${dp}, donc par ${L} : seul ${nombre(reponse)} convient.`,
      explication: etapes(
        [
          `${fracMot} du total doit être un nombre entier : le total est un multiple de ${d1}.`,
          `${pctMot} : le total est aussi un multiple de ${dp}.`,
          `Il est donc multiple de ppcm(${d1}, ${dp}) = ${L}.`,
          `Parmi les propositions, seul ${nombre(reponse)} = ${reponse / L} × ${L} convient.`,
        ],
        `ne rien résoudre : tester les propositions contre les deux filtres. Un total qui n'en passe qu'un donne une part non entière.`,
      ),
      difficulte: 3,
    }
  },
}

/* ------------------------------------------ des restes compatibles -- */

const RANGEMENTS = [
  { objets: 'chaises', de: 'de chaises', verbe: 'rangées par' },
  { objets: 'œufs', de: 'd’œufs', verbe: 'mis en boîtes de' },
  { objets: 'élèves', de: 'd’élèves', verbe: 'répartis en équipes de' },
  { objets: 'livres', de: 'de livres', verbe: 'empilés par piles de' },
]

/**
 * « Par 6, il en reste 2 ; par 8, il en reste 4. » Même forme que le total
 * compatible : on ne cherche pas le nombre, on vérifie chaque proposition
 * contre les deux restes. Une seule passe les deux.
 */
const restesCompatibles: Famille = {
  skillId: 'tm.calcul.arithmetique_et_divisibilite',
  nom: 'restes compatibles',
  produire(a) {
    const { p, q } = chercher(
      a,
      (a) => ({ p: a.entier(4, 9), q: a.entier(5, 12) }),
      ({ p, q }) => p < q && ppcm(p, q) >= 12 && ppcm(p, q) <= 72,
    )
    const reponse = a.entier(60, 300)
    const [rp, rq] = [reponse % p, reponse % q]
    const r = RANGEMENTS[a.entier(0, RANGEMENTS.length - 1)]
    const reste = (k: number) => (k === 0 ? 'il n’en reste aucun' : `il en reste ${k}`)

    const bas = Math.round(reponse * 0.7)
    const haut = Math.round(reponse * 1.3)
    const candidats = (ok: (v: number) => boolean) => {
      const l: number[] = []
      for (let v = bas; v <= haut; v++) if (v !== reponse && ok(v)) l.push(v)
      return a.melanger(l)
    }
    const seulP = candidats((v) => v % p === rp && v % q !== rq).slice(0, 2)
    const seulQ = candidats((v) => v % q === rq && v % p !== rp).slice(0, 2)
    const leurres: Leurre[] = [
      ...seulP.map((v): Leurre => [v, `${v} laisse bien ${rp} par ${p}, mais ${v % q} par ${q}, pas ${rq}`]),
      ...seulQ.map((v): Leurre => [v, `${v} laisse bien ${rq} par ${q}, mais ${v % p} par ${p}, pas ${rp}`]),
    ]
    for (const v of candidats((v) => v % p !== rp && v % q !== rq)) {
      if (leurres.length >= 4) break
      leurres.push([v, `${v} ne laisse le bon reste ni par ${p} ni par ${q}`])
    }
    const { options, bonneReponse, diagnostics } = qcm(a, reponse, leurres, (v) => nombre(v), { minimum: 1 })

    const accord = (t: string) => (r.objets === 'chaises' ? t.replace('aucun', 'aucune') : t)
    return {
      section: S,
      skillId: restesCompatibles.skillId,
      typeItem: 'qcm',
      enonce:
        `Des ${r.objets} sont ${r.verbe} ${p} : ${accord(reste(rp))}. ${r.verbe.charAt(0).toUpperCase() + r.verbe.slice(1)} ${q}, ${accord(reste(rq))}. ` +
        `Parmi les propositions, quel peut être le nombre ${r.de} ?`,
      options,
      bonneReponse,
      diagnostics,
      rappel: `Tester chaque proposition : reste ${rp} par ${p} ET reste ${rq} par ${q} → ${nombre(reponse)}.`,
      explication: etapes(
        [
          `On ne cherche pas le nombre : on vérifie les cinq propositions.`,
          `Premier filtre : la division par ${p} doit laisser ${rp}. Ici, ${nombre(reponse)} = ${p} × ${Math.floor(reponse / p)} + ${rp}.`,
          `Second filtre : la division par ${q} doit laisser ${rq}. ${nombre(reponse)} = ${q} × ${Math.floor(reponse / q)} + ${rq}.`,
          `Seul ${nombre(reponse)} passe les deux ; chacune des autres propositions échoue à l'un au moins.`,
        ],
        `chercher LE nombre par le calcul (les solutions reviennent tous les ${ppcm(p, q)}) prend trois fois plus de temps que de tester cinq propositions.`,
      ),
      difficulte: 3,
    }
  },
}

/* ----------------------------------------- somme d'entiers consécutifs -- */

/**
 * « Lequel de ces nombres est la somme de 4 entiers consécutifs ? » La somme
 * de k entiers consécutifs à partir de n vaut k·n + k(k − 1)/2 : retirer le
 * talon k(k − 1)/2, puis tester la divisibilité par k. Pour k pair, un
 * multiple de k ne convient JAMAIS — c'est le leurre.
 */
const sommeConsecutifsPossible: Famille = {
  skillId: 'tm.calcul.arithmetique_et_divisibilite',
  nom: 'somme de consécutifs possible',
  produire(a) {
    const k = a.choix([3, 4, 5, 6])
    const talon = (k * (k - 1)) / 2
    const depart = a.entier(8, 60)
    const reponse = k * depart + talon
    const valide = (v: number) => (v - talon) % k === 0 && v - talon >= k

    const leurres: Leurre[] = []
    const autour = a.melanger([-3, -2, -1, 1, 2, 3, -4, 4, 5, -5].map((e) => reponse + e))
    if (k % 2 === 0) {
      // Les multiples de k voisins : le leurre de la règle « multiple de k ».
      for (const v of a.melanger([reponse - k / 2, reponse + k / 2, reponse + (3 * k) / 2])) {
        leurres.push([v, `${v} est un multiple de ${k}, mais ${k} consécutifs ont pour somme ${k} × (plus petit) + ${talon} : ${v} − ${talon} n’est pas divisible par ${k}`])
      }
    }
    for (const v of autour) {
      if (leurres.length >= 4) break
      if (!valide(v) && !leurres.some((l) => (Array.isArray(l) ? l[0] : l) === v)) {
        leurres.push([v, `${v} − ${talon} = ${v - talon} n’est pas divisible par ${k}`])
      }
    }
    const { options, bonneReponse, diagnostics } = qcm(a, reponse, leurres.slice(0, 4), (v) => nombre(v), { minimum: 1 })
    const termes = Array.from({ length: k }, (_, i) => depart + i)

    return {
      section: S,
      skillId: sommeConsecutifsPossible.skillId,
      typeItem: 'qcm',
      enonce: `Lequel de ces nombres peut s'écrire comme la somme de ${NOMBRES_MOTS[k]} entiers consécutifs strictement positifs ?`,
      options,
      bonneReponse,
      diagnostics,
      rappel: `Somme = ${k} × (plus petit) + ${talon} : ${nombre(reponse)} − ${talon} = ${k} × ${depart}.`,
      explication: etapes(
        [
          `Si n est le plus petit, la somme vaut n + (n + 1) + … + (n + ${k - 1}) = ${k}n + ${talon}.`,
          `Un nombre convient donc si, une fois ${talon} retiré, il se divise par ${k}.`,
          `${nombre(reponse)} − ${talon} = ${nombre(reponse - talon)} = ${k} × ${depart} : c'est ${termes.join(' + ')}.`,
          `Les autres propositions échouent au test de divisibilité.`,
        ],
        k % 2
          ? `pour un nombre impair de termes, « multiple de ${k} » suffit : la somme vaut ${k} fois le terme du milieu. Avec un nombre pair de termes, ce raccourci serait faux.`
          : `croire qu'il suffit d'un multiple de ${k}. Avec un nombre pair de termes, la somme laisse toujours un reste de ${talon % k} dans la division par ${k}.`,
      ),
      difficulte: 3,
    }
  },
}

/** Poids 3 : voir `Famille.poids`. */
export const FAMILLES_IDEES: Famille[] = [
  probaConditionnelle,
  deuxHoraires,
  grilleSommes,
  chiffresContraints,
  offreLots,
  totalCompatible,
  restesCompatibles,
  sommeConsecutifsPossible,
].map((f) => ({ ...f, poids: 3 }))
