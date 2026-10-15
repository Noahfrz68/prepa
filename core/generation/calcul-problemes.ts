/**
 * Sous-test 2 — Calcul : les problèmes rédigés, au niveau des annales.
 *
 * Mesuré sur les mêmes épreuves : 71 % de réussite sur le calcul généré, 53 %
 * sur les annales, et 52 s contre 79 s. Les annales ne demandent presque
 * jamais d'appliquer une formule : elles racontent une situation (un capital
 * placé pour partie, une clôture autour d'une piscine, des plots le long d'un
 * circuit) qu'il faut d'abord mettre en équation, en deux à quatre étapes, avec
 * un piège en route (le plot de l'entrée, la moyenne non pondérée).
 *
 * Douze familles, chacune modelée sur une annale. La réponse est calculée ; les
 * leurres sont les résultats des erreurs de méthode classiques, nommées dans le
 * diagnostic. Les paramètres sont cherchés pour que tout tombe juste : un
 * problème de concours n'a pas de décimales parasites.
 */

import { de, euros, nombre, pourcent, type Alea } from './alea'
import { qcm, type Leurre } from './qcm'
import type { Famille, QuestionGeneree } from './types'

const S = 'calcul' as const

const PRENOMS = ['Camille', 'Malik', 'Inès', 'Thomas', 'Awa', 'Lucas', 'Sofia', 'Nathan', 'Léa', 'Youssef', 'Chloé', 'Hugo']

/** Cherche des paramètres jusqu'à ce que `ok` soit vrai ; lève sinon (le lot retire). */
function chercher<T>(a: Alea, tirer: (a: Alea) => T, ok: (t: T) => boolean, essais = 200): T {
  for (let i = 0; i < essais; i++) {
    const t = tirer(a)
    if (ok(t)) return t
  }
  throw new Error('paramètres introuvables')
}

function question(
  a: Alea,
  skillId: string,
  enonce: string,
  bonne: number,
  leurres: Leurre[],
  formater: (n: number) => string,
  etapes: string[],
  rappel: string,
  piege: string,
  minimum = 0,
): QuestionGeneree {
  const { options, bonneReponse, diagnostics } = qcm(a, bonne, leurres, formater, { minimum })
  return {
    section: S,
    skillId,
    typeItem: 'qcm',
    enonce,
    options,
    bonneReponse,
    diagnostics,
    rappel,
    explication: `${etapes.map((e, i) => `${i + 1}. ${e}`).join('\n')}\nLe piège : ${piege}`,
    difficulte: 5,
  }
}

const entier = (x: number) => Number.isInteger(x) && x > 0

/**
 * Arrondi au dixième AVANT d'écrire : sinon 6,96 s'écrit « 7,0 » et 7 « 7 »,
 * deux textes distincts que l'harmonisation des décimales rend identiques.
 */
const dixieme = (v: number) => Math.round(v * 10) / 10
/** Sans zéros inutiles : « 1,2 » et non « 1,2000 », « 9 » et non « 9,00 ». */
const sansZeros = (v: number, decimales: number) => nombre(v, decimales).replace(/(,\d*?)0+$/, '$1').replace(/,$/, '')

const nombre1 = (v: number) => {
  const r = dixieme(v)
  return nombre(r, Number.isInteger(r) ? 0 : 1)
}

/* ---------------------------------------------- capital placé pour partie -- */

const capitalPartiel: Famille = {
  skillId: 'tm.calcul.pourcentages_et_variations',
  nom: 'capital placé pour partie',
  produire(a) {
    const { C, p, q, t, n } = chercher(
      a,
      (a) => {
        const [p, q] = a.choix([[1, 2], [2, 3], [3, 4], [1, 3], [2, 5], [3, 5]])
        return { C: a.entier(6, 40) * 1000, p, q, t: a.entier(2, 12), n: a.entier(2, 5) }
      },
      ({ C, p, q, t, n }) => entier((C * p) / q) && entier((C * p * t * n) / (q * 100)),
    )
    const place = (C * p) / q
    const interets = (place * t * n) / 100
    const total = C + interets
    const nom = a.choix(PRENOMS)
    return question(
      a,
      'tm.calcul.pourcentages_et_variations',
      `${nom} dispose de ${euros(C)}. Les ${p}/${q} de cette somme sont placés à intérêts simples ; le reste n'est pas touché. ` +
        `Au bout de ${n} ans, le placement est retiré avec ses intérêts : ${nom} dispose alors de ${euros(total)} au total. ` +
        `Quel est le taux d'intérêt annuel du placement ?`,
      t,
      [
        [(interets / (C * n)) * 100, 'les intérêts ont été rapportés au capital entier, pas à la part placée'],
        [(interets / place) * 100, 'les intérêts de toutes les années ont été pris pour un taux annuel'],
        [(interets / C) * 100, 'les intérêts totaux rapportés au capital entier : deux erreurs à la fois'],
        [t * n, 'le taux multiplié par la durée : c’est le rendement total, pas annuel'],
      ],
      (v) => pourcent(dixieme(v)),
      [
        `Les intérêts : ${euros(total)} − ${euros(C)} = ${euros(interets)}.`,
        `Ils proviennent de la part placée seulement : ${p}/${q} de ${euros(C)} = ${euros(place)}.`,
        `Sur ${n} ans, cela fait ${euros(interets / n)} par an.`,
        `Taux : ${euros(interets / n)} / ${euros(place)} = ${pourcent(t)}.`,
      ],
      `Intérêts ${euros(interets)} sur ${euros(place)} placés, en ${n} ans → ${pourcent(t)} par an.`,
      `le capital non placé ne rapporte rien : les intérêts se rapportent à la part placée, et se divisent par le nombre d'années.`,
    )
  },
}

/* ------------------------------------------------- clôture autour d'un carré -- */

const cloture: Famille = {
  skillId: 'tm.calcul.aires_et_volumes',
  nom: 'clôture autour d’un carré',
  produire(a) {
    const s = a.entier(4, 15)
    const w = a.entier(1, 4)
    const exterieur = s + 2 * w
    const aireExt = exterieur ** 2
    const nom = a.choix(PRENOMS)
    return question(
      a,
      'tm.calcul.aires_et_volumes',
      `${nom} entoure d'une clôture sa piscine carrée. La clôture forme un carré, à ${w} m des rebords tout autour de la piscine. ` +
        `L'aire délimitée par la clôture vaut ${nombre(aireExt)} m². Quelle est l'aire de la piscine ?`,
      s * s,
      [
        [(exterieur - w) ** 2, 'l’écart n’a été retiré que d’un côté : il faut l’enlever des deux côtés'],
        [aireExt - 4 * w * exterieur, 'les bandes ont été retirées sans tenir compte des coins'],
        [(exterieur - 2 * w) * exterieur, 'une seule dimension a été réduite'],
        [aireExt - w * w * 4, 'seuls les quatre coins ont été retirés'],
      ],
      (v) => `${nombre(v)} m²`,
      [
        `Le côté du carré de la clôture : √${nombre(aireExt)} = ${exterieur} m.`,
        `La piscine est en retrait de ${w} m de chaque côté : son côté vaut ${exterieur} − 2 × ${w} = ${s} m.`,
        `Aire de la piscine : ${s}² = ${s * s} m².`,
      ],
      `Côté ${exterieur} − 2 × ${w} = ${s}, aire ${s * s} m².`,
      `l'écart se retire DEUX fois du côté (une fois de chaque bord), jamais une seule.`,
    )
  },
}

/* ------------------------------------------------------- cadeau commun -- */

const cotisation: Famille = {
  skillId: 'tm.calcul.equations_du_1er_degre',
  nom: 'cadeau commun',
  produire(a) {
    const { n, p, k } = chercher(
      a,
      (a) => ({ n: a.entier(6, 20), p: a.entier(8, 60), k: a.entier(1, 4) }),
      ({ n, p, k }) => n - k >= 3 && entier((n * p) / (n - k)),
    )
    const q = (n * p) / (n - k)
    const total = n * p
    return question(
      a,
      'tm.calcul.equations_du_1er_degre',
      `Un groupe d'amis se cotise pour un cadeau : cela coûtera ${euros(p)} à chacun. ` +
        `Mais si ${k === 1 ? 'l’un d’eux refuse' : `${k} d'entre eux refusent`} de payer, il en coûtera ${euros(q)} à chacun des autres. ` +
        `Combien coûte le cadeau ?`,
      total,
      [
        [n, 'c’est le nombre d’amis, pas le prix du cadeau'],
        [(n - k) * p, 'le prix payé par ceux qui restent, à l’ancien tarif'],
        [n * q, 'le nouveau tarif appliqué à tout le groupe'],
        [k * q, 'seule la part reportée a été comptée'],
      ],
      (v) => euros(v),
      [
        `Soit n le nombre d'amis : le cadeau coûte ${p}n, et aussi ${q}(n − ${k}).`,
        `${p}n = ${q}n − ${q * k}, donc ${q - p}n = ${q * k} et n = ${n}.`,
        `Prix du cadeau : ${n} × ${euros(p)} = ${euros(total)}.`,
      ],
      `${p}n = ${q}(n − ${k}) → n = ${n}, cadeau ${euros(total)}.`,
      `on trouve d'abord le nombre de personnes, mais la question porte sur le prix : relire ce qu'on demande avant de cocher.`,
    )
  },
}

/* --------------------------------------------------------- plots / piquets -- */

const plots: Famille = {
  skillId: 'tm.calcul.vitesses_debits_et_melanges',
  nom: 'plots et intervalles',
  produire(a) {
    const d = a.choix([50, 100, 125, 200, 250, 500])
    const intervalles = a.entier(8, 40)
    const L = d * intervalles
    const boucle = a.chance(0.35)
    const deuxCotes = !boucle && a.chance(0.3)
    const reponse = boucle ? intervalles : (intervalles + 1) * (deuxCotes ? 2 : 1)
    // En kilomètres seulement si la longueur tombe juste au dixième : « 1,6 km »
    // pour 1 550 m faussait la réponse d'un intervalle.
    const longueur = L >= 1000 && L % 100 === 0 ? `${nombre(L / 1000, L % 1000 ? 1 : 0)} km` : `${nombre(L)} m`
    const enonce = boucle
      ? `Une piste circulaire de ${longueur} est balisée par un plot tous les ${d} mètres, en partant de la ligne d'arrivée. Combien de plots faut-il ?`
      : `Une allée droite de ${longueur} est plantée d'arbres ${deuxCotes ? 'des deux côtés, ' : ''}un à chaque extrémité puis un tous les ${d} mètres. Combien d'arbres faut-il ?`
    return question(
      a,
      'tm.calcul.vitesses_debits_et_melanges',
      enonce,
      reponse,
      boucle
        ? [[intervalles + 1, 'sur une boucle, le dernier plot retombe sur le premier : pas de +1'], [intervalles - 1, 'un intervalle de trop retiré'], [2 * intervalles, 'les intervalles comptés deux fois']]
        : [
            [intervalles * (deuxCotes ? 2 : 1), 'l’arbre de l’extrémité a été oublié : il y a un arbre de plus que d’intervalles'],
            [(intervalles + 2) * (deuxCotes ? 2 : 1), 'les deux extrémités ont été ajoutées en plus des intervalles'],
            [deuxCotes ? intervalles + 1 : 2 * (intervalles + 1), deuxCotes ? 'un seul côté de l’allée a été compté' : 'l’allée a été plantée des deux côtés, ce que l’énoncé ne dit pas'],
            [(intervalles - 1) * (deuxCotes ? 2 : 1), 'les deux extrémités ont été retirées'],
          ],
      (v) => nombre(v),
      boucle
        ? [`${L} m / ${d} m = ${intervalles} intervalles.`, `Sur un circuit fermé, autant de plots que d'intervalles : le dernier intervalle ramène au premier plot. ${intervalles} plots.`]
        : [
            `${L} m / ${d} m = ${intervalles} intervalles.`,
            `Sur une ligne ouverte, il y a un arbre de plus que d'intervalles : ${intervalles + 1}.`,
            ...(deuxCotes ? [`Des deux côtés : 2 × ${intervalles + 1} = ${reponse}.`] : []),
          ],
      boucle ? `Boucle : ${intervalles} intervalles = ${intervalles} plots.` : `Ligne ouverte : ${intervalles} intervalles + 1${deuxCotes ? ', × 2 côtés' : ''} = ${reponse}.`,
      `ligne ouverte → intervalles + 1 ; boucle fermée → autant que d'intervalles. Dessiner trois intervalles suffit à s'en convaincre.`,
    )
  },
}

/* --------------------------------------------------- entiers consécutifs -- */

const consecutifs: Famille = {
  skillId: 'tm.calcul.arithmetique_et_divisibilite',
  nom: 'entiers consécutifs',
  produire(a) {
    const { n, k, m, r } = chercher(
      a,
      (a) => {
        const k = a.entier(5, 8)
        const m = a.entier(2, Math.floor(k / 2))
        const n = a.entier(1, 15)
        const s1 = m * n + (m * (m - 1)) / 2
        const s2 = m * (n + k - m) + (m * (m - 1)) / 2
        return { n, k, m, r: s2 / s1 }
      },
      ({ r }) => Number.isInteger(r) && r >= 2,
    )
    const total = k * n + (k * (k - 1)) / 2
    const s1 = m * n + (m * (m - 1)) / 2
    const mots = ['', '', 'deux', 'trois', 'quatre']
    return question(
      a,
      'tm.calcul.arithmetique_et_divisibilite',
      `On considère ${k} entiers consécutifs. La somme des ${mots[m]} derniers vaut ${r === 2 ? 'le double de' : r === 3 ? 'le triple de' : `${r} fois`} ` +
        `la somme des ${mots[m]} premiers. Que vaut la somme de ces ${k} entiers ?`,
      total,
      [
        [s1 + r * s1, 'seuls les premiers et les derniers ont été additionnés : les entiers du milieu manquent'],
        [n, 'c’est le premier entier, pas la somme'],
        [k * n, 'les écarts entre entiers consécutifs ont été oubliés'],
        [total + k, 'les entiers ont été pris à partir de n + 1'],
      ],
      (v) => nombre(v),
      [
        `Notons n le plus petit : les ${mots[m]} premiers font ${m}n + ${(m * (m - 1)) / 2}, les ${mots[m]} derniers ${m}n + ${m * (k - m) + (m * (m - 1)) / 2}.`,
        `${m}n + ${m * (k - m) + (m * (m - 1)) / 2} = ${r} × (${m}n + ${(m * (m - 1)) / 2}), d'où n = ${n}.`,
        `Les entiers vont de ${n} à ${n + k - 1} : leur somme vaut ${k} × (${n} + ${n + k - 1}) / 2 = ${total}.`,
      ],
      `n = ${n}, somme de ${n} à ${n + k - 1} = ${total}.`,
      `on demande la somme des ${k} entiers, pas le premier — et les entiers du milieu comptent.`,
    )
  },
}

/* ------------------------------------------------ fractions et reste -- */

const fractionsReste: Famille = {
  skillId: 'tm.calcul.proportionnalite_et_ratios',
  nom: 'fractions et reste',
  produire(a) {
    const jeux: Array<[string[], number[], number]> = [
      [['la moitié', 'le tiers', 'le neuvième'], [1 / 2, 1 / 3, 1 / 9], 18],
      [['la moitié', 'le quart', 'le sixième'], [1 / 2, 1 / 4, 1 / 6], 12],
      [['le tiers', 'le quart', 'le sixième'], [1 / 3, 1 / 4, 1 / 6], 12],
      [['la moitié', 'le cinquième', 'le dixième'], [1 / 2, 1 / 5, 1 / 10], 10],
      [['les deux cinquièmes', 'le quart', 'le dixième'], [2 / 5, 1 / 4, 1 / 10], 20],
      [['le tiers', 'le cinquième', 'le sixième'], [1 / 3, 1 / 5, 1 / 6], 30],
    ]
    const [noms, parts, denom] = a.choix(jeux)
    // En entiers : la part du reste, en douzièmes, dix-huitièmes…
    const partsReste = denom - parts.reduce((s, x) => s + Math.round(x * denom), 0)
    const reste = partsReste / denom
    const total = denom * a.entier(2, 12)
    const R = (total * partsReste) / denom
    const couleurs = ['bleus', 'noirs', 'rouges', 'verts']
    return question(
      a,
      'tm.calcul.proportionnalite_et_ratios',
      `Dans une papeterie, ${noms[0]} des stylos vendus le mois dernier étaient ${couleurs[0]}, ${noms[1]} ${couleurs[1]}, ${noms[2]} ${couleurs[2]}, ` +
        `et les ${nombre(R)} autres ${couleurs[3]}. Combien de stylos ont été vendus ?`,
      total,
      [
        [R * (parts.length + 1), 'chaque catégorie a été supposée aussi nombreuse que les verts'],
        [Math.round(R / (1 - reste)), 'le reste a été divisé par la part déjà vendue, pas par sa propre part'],
        [R * denom, 'le reste multiplié par le dénominateur commun, sans tenir compte de ses parts'],
        [total - R, 'c’est le nombre de stylos bleus, noirs et rouges, sans les verts'],
      ],
      (v) => nombre(v),
      [
        `Part des trois premières couleurs : ${parts.map((x) => `${Math.round(x * denom)}/${denom}`).join(' + ')} = ${denom - partsReste}/${denom}.`,
        `Les verts représentent donc ${partsReste}/${denom} des ventes.`,
        `${partsReste}/${denom} du total = ${nombre(R)}, donc total = ${nombre(R)} × ${denom}/${partsReste} = ${nombre(total)}.`,
      ],
      `Reste ${partsReste}/${denom} = ${nombre(R)} → total ${nombre(total)}.`,
      `on ramène tout au même dénominateur pour trouver la part du reste, puis on remonte au total.`,
    )
  },
}

/* --------------------------------------------- multiples dans un intervalle -- */

const multiplesIntervalle: Famille = {
  skillId: 'tm.calcul.arithmetique_et_divisibilite',
  nom: 'multiples dans un intervalle',
  produire(a) {
    const k = a.choix([3, 4, 6, 7, 9, 11, 12])
    const bas = -a.entier(30, 400)
    const haut = a.entier(30, 400)
    const reponse = Math.floor(haut / k) - Math.ceil(bas / k) + 1
    return question(
      a,
      'tm.calcul.arithmetique_et_divisibilite',
      `Combien y a-t-il de multiples de ${k} entre ${nombre(bas)} et ${nombre(haut)} ?`,
      reponse,
      [
        [reponse - 1, '0 a été oublié : c’est un multiple de tous les entiers'],
        [Math.floor(haut / k), 'seuls les multiples positifs ont été comptés'],
        [Math.floor((haut - bas) / k), 'la longueur de l’intervalle divisée par k : le décompte des bornes est faussé'],
        [reponse + 1, 'un multiple compté deux fois'],
      ],
      (v) => nombre(v),
      [
        `Multiples positifs, de ${k} à ${k * Math.floor(haut / k)} : ${Math.floor(haut / k)}.`,
        `Multiples négatifs, de −${k} à −${k * Math.floor(-bas / k)} : ${Math.floor(-bas / k)}.`,
        `Sans oublier 0 : ${Math.floor(haut / k)} + ${Math.floor(-bas / k)} + 1 = ${reponse}.`,
      ],
      `${Math.floor(haut / k)} positifs + ${Math.floor(-bas / k)} négatifs + 0 = ${reponse}.`,
      `0 est un multiple de ${k} : un intervalle qui le contient en compte un de plus.`,
    )
  },
}

/* ------------------------------------------------- croissance par phases -- */

const croissancePhases: Famille = {
  skillId: 'tm.calcul.suites_et_progressions',
  nom: 'croissance par phases',
  produire(a) {
    const depart = a.entier(2, 12)
    const annee0 = a.entier(1995, 2012)
    const p1 = a.entier(2, 3)
    const p2 = a.entier(1, 3)
    const [f1, f2] = a.choix([[3, 2], [2, 3], [2, 2], [3, 3]])
    const annee1 = annee0 + p1
    const annee2 = annee1 + p2
    const final = depart * f1 ** p1 * f2 ** p2
    const verbe = (f: number) => (f === 2 ? 'doubler' : 'tripler')
    return question(
      a,
      'tm.calcul.suites_et_progressions',
      `Depuis son ouverture en ${annee0}, un club a vu son nombre de membres ${verbe(f1)} chaque année jusqu'en ${annee1}, ` +
        `puis ${verbe(f2)} chaque année jusqu'en ${annee2}. Il comptait ${depart} membres l'année de son ouverture. Combien en compte-t-il en ${annee2} ?`,
      final,
      [
        [depart * f1 ** (p1 + 1) * f2 ** p2, 'une année de trop dans la première phase : on compte les ÉCARTS entre années'],
        [depart * f1 ** p1 * f2 ** (p2 + 1), 'une année de trop dans la seconde phase'],
        [depart * f1 ** (p1 + p2), `la première croissance prolongée jusqu’en ${annee2}`],
        [depart + depart * (f1 - 1) * p1 + depart * (f2 - 1) * p2, 'les croissances ont été additionnées au lieu d’être multipliées'],
      ],
      (v) => nombre(v),
      [
        `De ${annee0} à ${annee1} : ${p1} hausses, × ${f1}${p1 > 1 ? ` chacune, soit × ${f1 ** p1}` : ''}.`,
        `De ${annee1} à ${annee2} : ${p2} hausse${p2 > 1 ? 's' : ''}, × ${f2}${p2 > 1 ? ` chacune, soit × ${f2 ** p2}` : ''}.`,
        `${depart} × ${f1 ** p1} × ${f2 ** p2} = ${nombre(final)}.`,
      ],
      `${depart} × ${f1}^${p1} × ${f2}^${p2} = ${nombre(final)}.`,
      `entre ${annee0} et ${annee1}, il y a ${p1} changements d'année, pas ${p1 + 1} : on compte les écarts.`,
    )
  },
}

/* ------------------------------------------ moyenne d'un groupe manquant -- */

const moyenneGroupe: Famille = {
  skillId: 'tm.calcul.moyennes_et_medianes',
  nom: 'moyenne d’un groupe manquant',
  produire(a) {
    const { r, F, M } = chercher(
      a,
      (a) => ({ r: a.entier(2, 4), F: a.entier(8, 17), M: a.entier(8, 15) }),
      ({ r, F, M }) => F !== M && entier(((r + 1) * M - F) / r) && ((r + 1) * M - F) / r <= 20,
    )
    const G = ((r + 1) * M - F) / r
    const fois = ['', '', 'deux', 'trois', 'quatre'][r]
    return question(
      a,
      'tm.calcul.moyennes_et_medianes',
      `Dans une classe, il y a ${fois} fois plus de garçons que de filles. La moyenne des filles est de ${F}, celle de la classe de ${M}. ` +
        `Quelle est la moyenne des garçons ?`,
      G,
      [
        [2 * M - F, 'les deux groupes ont été supposés de même effectif'],
        [(M + F) / 2, 'la moyenne de la classe et celle des filles ont été moyennées'],
        [r * M - F, 'les effectifs ont été mal pondérés'],
        [M + (M - F) * r, 'l’écart des filles a été reporté sur les garçons, multiplié au lieu de divisé'],
      ],
      (v) => nombre1(v),
      [
        `Pour 1 fille, ${r} garçons : la classe se résume à ${r + 1} élèves, de total ${r + 1} × ${M} = ${(r + 1) * M}.`,
        `La fille compte pour ${F} ; il reste ${(r + 1) * M} − ${F} = ${(r + 1) * M - F} pour les ${r} garçons.`,
        `Moyenne des garçons : ${(r + 1) * M - F} / ${r} = ${G}.`,
      ],
      `Total ${(r + 1) * M} pour ${r + 1} élèves − ${F} → ${G} par garçon.`,
      `une moyenne de classe est pondérée par les effectifs : on repasse par les totaux.`,
    )
  },
}

/* ----------------------------------------------------------- rattrapage -- */

const rattrapage: Famille = {
  skillId: 'tm.calcul.vitesses_debits_et_melanges',
  nom: 'rattrapage',
  produire(a) {
    const { v1, v2, t } = chercher(
      a,
      (a) => ({ v1: a.choix([4, 5, 6, 10, 12, 15, 20]), v2: a.choix([8, 10, 12, 15, 18, 20, 24, 30, 40]), t: a.choix([10, 15, 20, 30, 40, 45, 60]) }),
      ({ v1, v2, t }) => v2 > v1 && entier((v1 * t) / (v2 - v1)),
    )
    const minutes = (v1 * t) / (v2 - v1)
    const [p1, p2] = a.melanger(PRENOMS).slice(0, 2)
    return question(
      a,
      'tm.calcul.vitesses_debits_et_melanges',
      `${p1} part à pied à ${v1} km/h. ${t} minutes plus tard, ${p2} part du même point, sur la même route, à ${v2} km/h. ` +
        `Combien de minutes après le départ ${de(p2)} le rattrapage a-t-il lieu ?`,
      minutes,
      [
        [minutes + t, 'la durée depuis le départ du premier, pas du second'],
        [(v2 * t) / (v2 - v1), 'la vitesse du poursuivant a été prise pour mesurer l’avance'],
        [(v1 * t) / v2, 'l’avance a été divisée par la vitesse du poursuivant, pas par l’écart de vitesse'],
        [(v1 * t) / (v1 + v2), 'les vitesses ont été additionnées : c’est le calcul d’un croisement, pas d’un rattrapage'],
      ],
      (v) => `${nombre1(v)} min`,
      [
        `Avance ${de(p1)} au départ ${de(p2)} : ${v1} km/h × ${t} min = ${sansZeros((v1 * t) / 60, 2)} km.`,
        `${p2} gagne ${v2} − ${v1} = ${v2 - v1} km/h sur ${p1}.`,
        `Temps pour combler l'avance : ${sansZeros((v1 * t) / 60, 2)} / ${v2 - v1} h = ${minutes} min.`,
      ],
      `Avance ${v1} × ${t} min, rattrapée à ${v2 - v1} km/h → ${minutes} min.`,
      `en rattrapage, c'est l'ÉCART des vitesses qui compte ; on additionne les vitesses quand deux mobiles vont l'un vers l'autre.`,
    )
  },
}

/* --------------------------------------- prix avant deux variations -- */

const prixInitial: Famille = {
  skillId: 'tm.calcul.pourcentages_et_variations',
  nom: 'prix avant deux variations',
  produire(a) {
    const { P, h, b } = chercher(
      a,
      (a) => ({ P: a.entier(4, 60) * 10, h: a.choix([10, 20, 25, 50]), b: a.choix([10, 20, 25, 40]) }),
      ({ P, h, b }) => entier((P * (100 + h) * (100 - b)) / 10000),
    )
    const F = (P * (100 + h) * (100 - b)) / 10000
    return question(
      a,
      'tm.calcul.pourcentages_et_variations',
      `Le prix d'un article augmente de ${h} %, puis le nouveau prix baisse de ${b} %. Il coûte alors ${euros(F)}. Quel était son prix de départ ?`,
      P,
      [
        [Math.round((F / (1 + (h - b) / 100)) * 100) / 100, 'les deux pourcentages ont été additionnés au lieu d’être composés'],
        [Math.round(F * (1 - h / 100) * (1 + b / 100) * 100) / 100, 'chaque variation a été défaite en appliquant le pourcentage inverse, au lieu de diviser'],
        [F, 'le prix final, sans retour en arrière'],
        [Math.round(F * (1 + (b - h) / 100) * 100) / 100, 'les variations ont été défaites en additionnant les pourcentages'],
      ],
      (v) => euros(v),
      [
        `Coefficient global : ${sansZeros(1 + h / 100, 2)} × ${sansZeros(1 - b / 100, 2)} = ${sansZeros((1 + h / 100) * (1 - b / 100), 4)}.`,
        `Prix de départ : ${euros(F)} / ${sansZeros((1 + h / 100) * (1 - b / 100), 4)} = ${euros(P)}.`,
      ],
      `${euros(F)} / (${sansZeros(1 + h / 100, 2)} × ${sansZeros(1 - b / 100, 2)}) = ${euros(P)}.`,
      `défaire une variation, c'est DIVISER par son coefficient — jamais appliquer le pourcentage inverse.`,
    )
  },
}

/* ----------------------------------------------- travail commencé seul -- */

const travailPartiel: Famille = {
  skillId: 'tm.calcul.vitesses_debits_et_melanges',
  nom: 'travail commencé seul',
  produire(a) {
    const { t1, t2, h } = chercher(
      a,
      (a) => ({ t1: a.choix([4, 6, 8, 9, 10, 12, 15]), t2: a.choix([3, 4, 5, 6, 8, 10, 12, 15]), h: a.entier(1, 5) }),
      ({ t1, t2, h }) => h < t1 && entier(((t1 - h) * t2 * 60) / (t1 + t2)) && Number.isInteger(((t1 - h) * t2) / (t1 + t2) * 2),
    )
    // Reste à faire : (t1 − h)/t1 du travail, au débit 1/t1 + 1/t2.
    const heures = ((t1 - h) * t2) / (t1 + t2)
    const [p1, p2] = a.melanger(PRENOMS).slice(0, 2)
    // « 2 h », « 3 h 20 » : les leurres ne tombent pas tous sur la demi-heure.
    const lire = (x: number) => {
      const min = Math.round(x * 60)
      return min % 60 === 0 ? `${min / 60} h` : `${Math.floor(min / 60)} h ${String(min % 60).padStart(2, '0')}`
    }
    return question(
      a,
      'tm.calcul.vitesses_debits_et_melanges',
      `Il faut ${t1} heures à ${p1} pour peindre une clôture, et ${t2} heures à ${p2}. ${p1} commence ; au bout de ${h} heure${h > 1 ? 's' : ''}, ` +
        `${p2} se joint au travail et les deux finissent ensemble. Combien de temps travaillent-ils à deux ?`,
      heures,
      [
        [(t1 * t2) / (t1 + t2), 'la durée à deux pour toute la clôture : le travail déjà fait a été oublié'],
        [Math.max(0.5, (t1 + t2) / 2 - h), 'les durées ont été moyennées au lieu d’additionner les débits'],
        [t1 - h, `la durée qu’il resterait à ${p1} sans aide`],
        [((t1 - h) * t2) / (t1 + t2) + h, 'la durée totale du chantier, pas celle du travail à deux'],
      ],
      lire,
      [
        `En ${h} h, ${p1} a fait ${h}/${t1} de la clôture ; il en reste ${t1 - h}/${t1}.`,
        `À deux, ils peignent 1/${t1} + 1/${t2} = ${t1 + t2}/${t1 * t2} de clôture par heure.`,
        `Durée : (${t1 - h}/${t1}) / (${t1 + t2}/${t1 * t2}) = ${lire(heures)}.`,
      ],
      `Reste ${t1 - h}/${t1}, débit ${t1 + t2}/${t1 * t2} → ${lire(heures)}.`,
      `on additionne les DÉBITS (fractions de travail par heure), jamais les durées — et on retire ce qui est déjà fait.`,
    )
  },
}

export const FAMILLES_PROBLEMES: Famille[] = [
  capitalPartiel,
  cloture,
  cotisation,
  plots,
  consecutifs,
  fractionsReste,
  multiplesIntervalle,
  croissancePhases,
  moyenneGroupe,
  rattrapage,
  prixInitial,
  travailPartiel,
]
