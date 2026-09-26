/**
 * Sous-test 2 — Calcul.
 *
 * Chaque famille pose ses paramètres PUIS calcule la réponse : la bonne
 * proposition n'est jamais un choix, c'est un résultat. Les leurres sont des
 * erreurs de méthode nommées dans l'explication, pour qu'une erreur apprenne
 * quelque chose au lieu d'être un simple raté.
 */

import { capitale, euros, fraction, nombre, pgcd, pourcent, ppcm } from './alea'
import { qcm, qcmTexte } from './qcm'
import type { Famille } from './types'
import { MODELES_CALCUL_SUPPLEMENTAIRES } from './calcul-modeles'

const S = 'calcul' as const

const PRENOMS = [
  'Camille', 'Malik', 'Inès', 'Thomas', 'Awa', 'Lucas', 'Sofia', 'Nathan',
  'Léa', 'Youssef', 'Chloé', 'Hugo', 'Fatou', 'Antoine', 'Maya', 'Théo',
]
/** Article séparé du nom : « d'une librairie » et « dans une librairie ». */
const ENTREPRISES: Array<[article: string, nom: string]> = [
  ['une', 'librairie'],
  ['un', 'atelier de céramique'],
  ['une', 'jardinerie'],
  ['un', 'torréfacteur'],
  ['une', 'brasserie artisanale'],
  ['un', 'cabinet de conseil'],
  ['une', 'école de musique'],
  ['un', 'club de natation'],
  ['une', 'coopérative agricole'],
  ['un', 'studio de photographie'],
]
const PRODUITS = [
  'un vélo', 'une imprimante', 'un canapé', 'un réfrigérateur', 'un téléviseur',
  'une machine à café', 'un ordinateur portable', 'une guitare', 'un appareil photo',
]

/* ------------------------------------------- pourcentages et variations -- */

const pourcentages: Famille = {
  skillId: 'tm.calcul.pourcentages_et_variations',
  nom: 'variations successives',
  produire(a) {
    const prix = a.entier(2, 40) * 100
    const hausse = a.choix([10, 20, 25, 40, 50])
    const baisse = a.choix([10, 20, 25, 40, 50])
    const produit = a.choix(PRODUITS)

    const final = prix * (1 + hausse / 100) * (1 - baisse / 100)

    const cH = nombre(1 + hausse / 100, 2)
    const cB = nombre(1 - baisse / 100, 2)

    const { options, bonneReponse, diagnostics } = qcm(
      a,
      final,
      [
        [prix * (1 + (hausse - baisse) / 100), `les deux taux ont été additionnés (${pourcent(hausse)} − ${pourcent(baisse)}) au lieu d'être composés`],
        [prix * (1 + hausse / 100), 'seule la hausse a été appliquée : la baisse a été oubliée'],
        [prix * (1 - baisse / 100), 'seule la baisse a été appliquée : la hausse a été oubliée'],
        [prix, 'les deux variations ont été supposées se compenser — elles ne le font jamais'],
        [prix * (1 + hausse / 100) * (1 + baisse / 100), 'la baisse a été appliquée comme une hausse : le signe s’est perdu'],
      ],
      euros,
      { minimum: 0 },
    )

    return {
      section: S,
      skillId: pourcentages.skillId,
      typeItem: 'qcm',
      enonce:
        `${capitale(produit)} coûte ${euros(prix)}. Son prix augmente de ${pourcent(hausse)}, ` +
        `puis le nouveau prix baisse de ${pourcent(baisse)}. Quel est le prix final ?`,
      options,
      bonneReponse,
      diagnostics,
      rappel: `${euros(prix)} × ${cH} × ${cB} = ${euros(final)}. Les taux se composent.`,
      explication:
        `1. Chaque variation devient un coefficient multiplicateur : ` +
        `une hausse de ${pourcent(hausse)} donne 1 + ${hausse}/100 = ${cH}, ` +
        `une baisse de ${pourcent(baisse)} donne 1 − ${baisse}/100 = ${cB}.\n` +
        `2. Les deux se suivent, donc les coefficients se multiplient : ` +
        `${euros(prix)} × ${cH} × ${cB}.\n` +
        `3. ${euros(prix)} × ${cH} = ${euros(prix * (1 + hausse / 100))}, ` +
        `puis × ${cB} = ${euros(final)}.\n` +
        `Le piège : ${pourcent(hausse)} − ${pourcent(baisse)} donnerait ` +
        `${euros(prix * (1 + (hausse - baisse) / 100))}. Additionner deux taux n'est légitime que ` +
        `s'ils portent sur la même base. Ici la baisse porte sur le prix DÉJÀ augmenté, pas sur le prix de départ.`,
      difficulte: 2,
    }
  },
}

const variationGlobale: Famille = {
  skillId: 'tm.calcul.pourcentages_et_variations',
  nom: 'variation globale',
  produire(a) {
    const h1 = a.choix([10, 20, 25, 50])
    const h2 = a.choix([10, 20, 25, 50])
    const baisse = a.chance(0.5)
    const entreprise = a.choix(ENTREPRISES)
    const coefficient = (1 + h1 / 100) * (baisse ? 1 - h2 / 100 : 1 + h2 / 100)
    const global = (coefficient - 1) * 100

    const c1 = nombre(1 + h1 / 100, 2)
    const c2 = nombre(baisse ? 1 - h2 / 100 : 1 + h2 / 100, 2)

    const { options, bonneReponse, diagnostics } = qcm(
      a,
      global,
      [
        [baisse ? h1 - h2 : h1 + h2, 'les deux taux ont été additionnés au lieu de composer leurs coefficients'],
        [(h1 + h2) / 2, 'c’est la moyenne des deux taux — une variation globale n’est pas une moyenne'],
        [-global, 'la bonne valeur, mais dans le mauvais sens'],
        [baisse ? -(h1 + h2) : (h1 * h2) / 100, 'les taux ont été combinés au hasard plutôt que par leurs coefficients'],
      ],
      (n) => `${nombre(n, Number.isInteger(n) ? 0 : 2)} %`,
    )

    return {
      section: S,
      skillId: variationGlobale.skillId,
      typeItem: 'qcm',
      enonce:
        `Le chiffre d'affaires d'${entreprise.join(' ')} augmente de ${pourcent(h1)} la première année, ` +
        `puis ${baisse ? 'diminue' : 'augmente'} de ${pourcent(h2)} la deuxième. ` +
        `Quelle est la variation globale sur les deux ans ?`,
      options,
      bonneReponse,
      diagnostics,
      rappel: `${c1} × ${c2} = ${nombre(coefficient, 4)}, soit ${nombre(global, 2)} %.`,
      explication:
        `1. Année 1 : ${pourcent(h1)} de hausse, coefficient ${c1}.\n` +
        `2. Année 2 : ${pourcent(h2)} ${baisse ? 'de baisse' : 'de hausse'}, coefficient ${c2}.\n` +
        `3. Sur les deux ans, les coefficients se multiplient : ${c1} × ${c2} = ${nombre(coefficient, 4)}.\n` +
        `4. On revient au pourcentage en retranchant 1 : ${nombre(coefficient, 4)} − 1 = ` +
        `${nombre(coefficient - 1, 4)}, soit ${nombre(global, 2)} %.\n` +
        `Le piège : additionner ${pourcent(h1)} et ${pourcent(h2)} donnerait ` +
        `${nombre(baisse ? h1 - h2 : h1 + h2)} %. C'est faux dès que la base change d'une année sur l'autre — ` +
        `et elle change toujours, puisque la deuxième variation porte sur le chiffre d'affaires de la première.`,
      difficulte: 3,
    }
  },
}

/* ------------------------------------------- proportionnalité et ratios -- */

const ratios: Famille = {
  skillId: 'tm.calcul.proportionnalite_et_ratios',
  nom: 'partage selon un rapport',
  produire(a) {
    // Deux parts égales ne font pas un rapport, et deux parts non réduites
    // (4 pour 6) sont un énoncé mal écrit : on impose des entiers premiers
    // entre eux et distincts.
    const p = a.entier(2, 7)
    let q = a.entier(2, 9)
    for (let essai = 0; (q === p || pgcd(p, q) !== 1) && essai < 30; essai++) q = a.entier(2, 9)
    if (q === p || pgcd(p, q) !== 1) q = p + 1
    const parts = p + q
    const total = parts * a.entier(6, 40)

    const seconde = (total * q) / parts

    const part = total / parts

    const { options, bonneReponse, diagnostics } = qcm(
      a,
      seconde,
      [
        [(total * p) / parts, `c’est l’autre groupe : les ${p} parts d’adhérents, pas les ${q} parts de visiteurs`],
        [total / parts, 'c’est UNE part, il en faut ' + q],
        [(total * q) / p, 'le total a été divisé par ' + p + ' au lieu de ' + parts + ' : le rapport a été pris pour un dénominateur'],
        [total - q, 'le nombre de parts a été retranché du total, comme si c’était un effectif'],
      ],
      (n) => nombre(n),
      { minimum: 1 },
    )

    return {
      section: S,
      skillId: ratios.skillId,
      typeItem: 'qcm',
      enonce:
        `Dans ${a.choix(ENTREPRISES).join(' ')}, le rapport entre le nombre d'adhérents et celui des visiteurs ` +
        `est de ${p} pour ${q}. L'ensemble représente ${nombre(total)} personnes. ` +
        `Combien y a-t-il de visiteurs ?`,
      options,
      bonneReponse,
      diagnostics,
      rappel: `${p} + ${q} = ${parts} parts de ${nombre(part)} ; les visiteurs en font ${q}, soit ${nombre(seconde)}.`,
      explication:
        `1. Un rapport de ${p} pour ${q} découpe le total en ${p} + ${q} = ${parts} parts égales.\n` +
        `2. Une part vaut ${nombre(total)} ÷ ${parts} = ${nombre(part)} personnes.\n` +
        `3. Les visiteurs comptent pour ${q} parts : ${q} × ${nombre(part)} = ${nombre(seconde)}.\n` +
        `Contrôle : les adhérents en font ${p}, soit ${nombre((total * p) / parts)}, ` +
        `et ${nombre(seconde)} + ${nombre((total * p) / parts)} = ${nombre(total)}. ` +
        `Le piège est de répondre pour le mauvais groupe : relire quel nombre est demandé avant de cocher.`,
      difficulte: 2,
    }
  },
}

/* ---------------------------------------------- équations du 1er degré -- */

const premierDegre: Famille = {
  skillId: 'tm.calcul.equations_du_1er_degre',
  nom: 'nombre inconnu',
  produire(a) {
    const x = a.entier(3, 40)
    // On reste dans double/triple/quadruple/quintuple/sextuple : au-delà, le
    // français n'a plus de mot courant et l'énoncé devient artificiel.
    const k1 = a.entier(2, 5)
    const k2 = a.entier(k1 + 1, 6) // strictement plus grand : le coefficient ne s'annule pas
    const b1 = a.entier(5, 60)
    const b2 = (k1 - k2) * x + b1

    const signe = b2 >= 0 ? '+' : '−'
    const equation = `${k1}x + ${nombre(b1)} = ${k2}x ${signe} ${nombre(Math.abs(b2))}`

    const { options, bonneReponse, diagnostics } = qcm(
      a,
      x,
      [
        [-x, 'la bonne valeur au signe près : l’équation a été retournée dans le mauvais sens'],
        [x + 1, 'une unité de trop — sans doute un report de constante mal compté'],
        [x - 1, 'une unité de moins — sans doute un report de constante mal compté'],
        [b1 - b2, 'c’est la différence des constantes, avant la division par ' + (k2 - k1)],
      ],
      (n) => nombre(n),
    )

    return {
      section: S,
      skillId: premierDegre.skillId,
      typeItem: 'qcm',
      enonce:
        `Le ${motMultiplicateur(k1)} d'un nombre augmenté de ${nombre(b1)} est égal ` +
        `au ${motMultiplicateur(k2)} de ce nombre ${b2 >= 0 ? 'augmenté' : 'diminué'} de ${nombre(Math.abs(b2))}. ` +
        `Quel est ce nombre ?`,
      options,
      bonneReponse,
      diagnostics,
      rappel: `${equation} → ${k2 - k1}x = ${nombre(b1 - b2)} → x = ${nombre(x)}.`,
      explication:
        `1. Traduire mot à mot, en appelant x le nombre cherché : ${equation}.\n` +
        `2. Regrouper les x d'un côté, les constantes de l'autre. On retire ${k1}x aux deux membres ` +
        `et on ${b2 >= 0 ? 'retire ' + nombre(b2) : 'ajoute ' + nombre(-b2)} de chaque côté :\n` +
        `   ${nombre(b1)} ${b2 >= 0 ? '−' : '+'} ${nombre(Math.abs(b2))} = ${k2}x − ${k1}x, ` +
        `soit ${nombre(b1 - b2)} = ${k2 - k1}x.\n` +
        `3. Diviser : x = ${nombre(b1 - b2)} ÷ ${k2 - k1} = ${nombre(x)}.\n` +
        `Vérification en dix secondes, à faire systématiquement : ` +
        `${k1} × ${nombre(x)} + ${nombre(b1)} = ${nombre(k1 * x + b1)}, ` +
        `et ${k2} × ${nombre(x)} ${signe} ${nombre(Math.abs(b2))} = ${nombre(k2 * x + b2)}. Les deux membres tombent juste.`,
      difficulte: 2,
    }
  },
}

const MULTIPLICATEURS: Record<number, string> = {
  2: 'double',
  3: 'triple',
  4: 'quadruple',
  5: 'quintuple',
  6: 'sextuple',
}

function motMultiplicateur(k: number): string {
  return MULTIPLICATEURS[k] ?? `produit par ${k}`
}

/* ---------------------------------------------- équations du 2nd degré -- */

const secondDegre: Famille = {
  skillId: 'tm.calcul.equations_du_2nd_degre',
  nom: 'somme et produit des racines',
  produire(a) {
    const r1 = a.entier(-9, 9) || 2
    const r2 = a.entier(-9, 9) || 3
    const somme = r1 + r2
    const produit = r1 * r2
    const cherchePlusGrande = a.chance(0.5)
    const reponse = cherchePlusGrande ? Math.max(r1, r2) : somme

    const { options, bonneReponse, diagnostics } = qcm(
      a,
      reponse,
      cherchePlusGrande
        ? [
            [Math.min(r1, r2), 'c’est l’autre racine, la plus petite des deux'],
            [-Math.max(r1, r2), 'la bonne racine, mais avec le signe inversé'],
            [somme, 'c’est la somme des deux racines, pas la plus grande'],
            [produit, 'c’est le produit des deux racines'],
          ]
        : [
            [-somme, 'c’est le coefficient b lui-même : la somme vaut −b, pas b'],
            [produit, 'c’est le produit des racines (le coefficient c), pas leur somme'],
            [Math.max(r1, r2), 'c’est la plus grande des deux racines, pas leur somme'],
            [Math.min(r1, r2), 'c’est la plus petite des deux racines, pas leur somme'],
          ],
      (n) => nombre(n),
    )

    // Un coefficient nul ne s'écrit pas : « x² + 0x − 49 = 0 » n'est pas une
    // équation qu'on rencontre, et le zéro affiché fait douter de l'énoncé
    // plutôt que réfléchir.
    const terme = (coefficient: number, suffixe: string) =>
      coefficient === 0
        ? ''
        : ` ${coefficient > 0 ? '+' : '−'} ${nombre(Math.abs(coefficient))}${suffixe}`

    const equation = `x²${terme(-somme, 'x')}${terme(produit, '')} = 0`

    return {
      section: S,
      skillId: secondDegre.skillId,
      typeItem: 'qcm',
      enonce: cherchePlusGrande
        ? `Quelle est la plus grande solution de l'équation ${equation} ?`
        : `Quelle est la somme des solutions de l'équation ${equation} ?`,
      options,
      bonneReponse,
      diagnostics,
      rappel: cherchePlusGrande
        ? `Racines ${nombre(r1)} et ${nombre(r2)} (somme ${nombre(somme)}, produit ${nombre(produit)}) : ` +
          `la plus grande est ${nombre(reponse)}.`
        : `Somme des racines = −b = ${nombre(somme)}. Inutile de les calculer.`,
      explication:
        `1. L'équation est de la forme x² + bx + c = 0, avec ` +
        `b = ${nombre(-somme)} et c = ${nombre(produit)}.\n` +
        `2. Deux formules dispensent du discriminant : la somme des racines vaut −b, ` +
        `leur produit vaut c. Ici : somme = ${nombre(somme)}, produit = ${nombre(produit)}.\n` +
        (cherchePlusGrande
          ? `3. On cherche donc deux entiers dont la somme fait ${nombre(somme)} et le produit ${nombre(produit)}. ` +
            `Comme le produit est ${produit < 0 ? 'négatif, les deux racines sont de signes contraires' : 'positif, les deux racines ont le même signe'}, ` +
            `on essaie les diviseurs de ${nombre(Math.abs(produit))} : ce sont ${nombre(r1)} et ${nombre(r2)}.\n` +
            `   Vérification : ${nombre(r1)} + ${nombre(r2)} = ${nombre(somme)} et ` +
            `${nombre(r1)} × ${nombre(r2)} = ${nombre(produit)}.\n` +
            `4. La question demande la plus GRANDE : ${nombre(reponse)}, pas ${nombre(Math.min(r1, r2))}.\n` +
            `Les deux pièges à connaître : cocher la petite racine par réflexe de lecture, ` +
            `et se tromper de signe sur la somme — le x de l'équation porte −b, pas b.`
          : `3. La question ne demande que la somme : elle est déjà lue, c'est ${nombre(somme)}. ` +
            `Inutile de chercher les racines (${nombre(r1)} et ${nombre(r2)}), inutile de calculer le discriminant.\n` +
            `Le piège : répondre ${nombre(-somme)}, c'est avoir recopié le coefficient devant x. ` +
            `La somme vaut −b, avec le signe changé.`),
      difficulte: 3,
    }
  },
}

/* ----------------------------------------------------------- systèmes -- */

export interface ParametresSysteme {
  n1: number
  m1: number
  n2: number
  m2: number
  prixA: number
  prixB: number
  chercheA: boolean
}

/**
 * La correction d'un système, à partir des seuls paramètres.
 *
 * Sortie de la famille parce qu'elle sert deux fois : à la fabrication, et au
 * rattrapage des questions déjà travaillées, qu'on ne peut pas remplacer sans
 * emporter les tentatives de l'utilisateur. Recopier le texte à l'identique
 * dans un script aurait garanti qu'il diverge à la première retouche.
 *
 * Aucun prénom n'y figure : ils n'apparaissent que dans l'énoncé.
 */
export function correctionSysteme(p: ParametresSysteme): {
  rappel: string
  explication: string
  /** Valeur → ce qu'elle signifie. La lettre dépend du mélange, pas d'ici. */
  motifs: Array<[valeur: number, motif: string]>
} {
  const { n1, m1, n2, m2, prixA, prixB, chercheA } = p
  const total1 = n1 * prixA + m1 * prixB
  const total2 = n2 * prixA + m2 * prixB
  const reponse = chercheA ? prixA : prixB

  // Élimination des stylos : (ligne 1) × m2 − (ligne 2) × m1.
  const det = n1 * m2 - n2 * m1
  const membre = total1 * m2 - total2 * m1

  return {
    motifs: [
      [chercheA ? prixB : prixA, `c’est le prix de l’autre article : la question porte sur ${chercheA ? 'un cahier' : 'un stylo'}`],
      [prixA + prixB, 'c’est le prix des deux articles ensemble'],
      [Math.abs(prixA - prixB), 'c’est l’écart entre les deux prix'],
      [reponse * 2, 'le résultat a été doublé : sans doute un coefficient oublié lors du report'],
    ],
    rappel: `Cahier ${euros(prixA)}, stylo ${euros(prixB)} — on demandait ${chercheA ? 'le cahier' : 'le stylo'} : ${euros(reponse)}.`,
    explication:
      `1. Nommer les inconnues : c le prix d'un cahier, s celui d'un stylo. Les deux achats s'écrivent\n` +
      `   (I)  ${n1}c + ${m1}s = ${nombre(total1)}\n` +
      `   (II) ${n2}c + ${m2}s = ${nombre(total2)}\n` +
      `2. Éliminer les stylos : multiplier (I) par ${m2} et (II) par ${m1}, puis soustraire. ` +
      `Les termes en s se compensent (${m1} × ${m2} des deux côtés) et il reste\n` +
      `   (${n1}×${m2} − ${n2}×${m1})c = ${nombre(total1)}×${m2} − ${nombre(total2)}×${m1}, ` +
      `soit ${det}c = ${nombre(membre)}.\n` +
      `3. D'où c = ${euros(prixA)}. On reporte dans (I) : ` +
      `${m1}s = ${nombre(total1)} − ${n1} × ${nombre(prixA)} = ${nombre(total1 - n1 * prixA)}, donc s = ${euros(prixB)}.\n` +
      `4. La question demande ${chercheA ? 'le cahier' : 'le stylo'} : ${euros(reponse)}.\n` +
      `Vérification sur la ligne qui n'a pas servi : ` +
      `${n2} × ${nombre(prixA)} + ${m2} × ${nombre(prixB)} = ${euros(total2)}. ` +
      `Cinq secondes, et elle attrape toutes les erreurs de report.`,
  }
}

const systemes: Famille = {
  skillId: 'tm.calcul.systemes',
  nom: 'deux achats, deux inconnues',
  produire(a) {
    const prixA = a.entier(3, 25)
    const prixB = a.entier(3, 25)
    const n1 = a.entier(2, 8)
    const m1 = a.entier(2, 8)
    let n2 = a.entier(2, 8)
    let m2 = a.entier(2, 8)
    // Déterminant non nul : sans cela le système n'a pas de solution unique.
    if (n1 * m2 - n2 * m1 === 0) {
      n2 = n1 + 1
      m2 = m1 + 2
    }

    const total1 = n1 * prixA + m1 * prixB
    const total2 = n2 * prixA + m2 * prixB
    const chercheA = a.chance(0.5)
    const reponse = chercheA ? prixA : prixB
    const duo = a.melanger(PRENOMS).slice(0, 2)

    const correction = correctionSysteme({ n1, m1, n2, m2, prixA, prixB, chercheA })

    const { options, bonneReponse, diagnostics } = qcm(a, reponse, correction.motifs, euros, {
      minimum: 0,
    })

    return {
      section: S,
      skillId: systemes.skillId,
      typeItem: 'qcm',
      enonce:
        `${duo[0]} achète ${n1} cahiers et ${m1} stylos pour ${euros(total1)}. ` +
        `${duo[1]} achète ${n2} cahiers et ${m2} stylos pour ${euros(total2)}. ` +
        `Quel est le prix d'un ${chercheA ? 'cahier' : 'stylo'} ?`,
      options,
      bonneReponse,
      diagnostics,
      rappel: correction.rappel,
      explication: correction.explication,
      difficulte: 3,
    }
  },
}

/* ----------------------------------------- arithmétique et divisibilité -- */

const divisibilite: Famille = {
  skillId: 'tm.calcul.arithmetique_et_divisibilite',
  nom: 'comptage de multiples',
  produire(a) {
    const p = a.choix([3, 4, 6, 7, 8, 9, 11, 12])
    // Si p est un multiple de q, tout multiple de p l'est aussi de q et la
    // réponse vaut zéro : la question n'a plus d'objet.
    const candidats = [2, 3, 5, 7].filter((c) => c !== p && p % c !== 0)
    const q = a.choix(candidats)
    const n = a.entier(15, 60) * 10

    const multiplesP = Math.floor(n / p)
    const communs = Math.floor(n / ppcm(p, q))
    const reponse = multiplesP - communs

    const { options, bonneReponse, diagnostics } = qcm(
      a,
      reponse,
      [
        [multiplesP, `c’est le nombre de multiples de ${p}, sans avoir rien retranché`],
        [multiplesP - Math.floor(n / q), `tous les multiples de ${q} ont été retranchés — or ils ne sont pas tous multiples de ${p}`],
        [Math.floor(n / q) - communs, `le comptage est parti du mauvais diviseur : ${q} au lieu de ${p}`],
        [Math.floor(n / (p * q)), `le produit ${p} × ${q} a été utilisé au lieu du PPCM (${ppcm(p, q)})`],
        [multiplesP + communs, 'les multiples communs ont été ajoutés au lieu d’être retranchés'],
      ],
      (v) => nombre(v),
      // Un comptage d'entiers ne descend pas sous zéro : le deuxième leurre
      // passe sous la barre dès que q est petit, et se fait alors écarter.
      { minimum: 0 },
    )

    return {
      section: S,
      skillId: divisibilite.skillId,
      typeItem: 'qcm',
      enonce:
        `Combien d'entiers compris entre 1 et ${nombre(n)} sont divisibles par ${p} ` +
        `mais pas par ${q} ?`,
      options,
      bonneReponse,
      diagnostics,
      rappel: `${nombre(multiplesP)} multiples de ${p}, moins ${nombre(communs)} multiples de ${ppcm(p, q)} : ${nombre(reponse)}.`,
      explication:
        `1. Compter les multiples de ${p} jusqu'à ${nombre(n)} : c'est la division entière, ` +
        `⌊${nombre(n)} ÷ ${p}⌋ = ${nombre(multiplesP)}.\n` +
        `2. Parmi eux, écarter ceux qui sont AUSSI divisibles par ${q}. Un nombre divisible par ${p} et par ${q} ` +
        `est divisible par leur PPCM, ici ppcm(${p}, ${q}) = ${ppcm(p, q)}.\n` +
        `3. Ces multiples communs sont ⌊${nombre(n)} ÷ ${ppcm(p, q)}⌋ = ${nombre(communs)}.\n` +
        `4. Réponse : ${nombre(multiplesP)} − ${nombre(communs)} = ${nombre(reponse)}.\n` +
        `Le piège : retrancher les ${nombre(Math.floor(n / q))} multiples de ${q}. ` +
        `On n'a le droit de retirer que ceux qui figuraient dans le premier comptage, ` +
        `c'est-à-dire les multiples des DEUX nombres à la fois.`,
      difficulte: 3,
    }
  },
}

const pgcdPpcm: Famille = {
  skillId: 'tm.calcul.arithmetique_et_divisibilite',
  nom: 'PGCD et PPCM',
  produire(a) {
    const d = a.choix([6, 8, 9, 12, 14, 15, 18])
    let u = a.entier(2, 9)
    let v = a.entier(2, 9)
    while (pgcd(u, v) !== 1) {
      u = a.entier(2, 9)
      v = a.entier(2, 11)
    }
    const x = d * u
    const y = d * v
    const cherchePgcd = a.chance(0.5)
    const reponse = cherchePgcd ? d : ppcm(x, y)

    const { options, bonneReponse, diagnostics } = qcm(
      a,
      reponse,
      [
        [cherchePgcd ? ppcm(x, y) : d, `c’est le ${cherchePgcd ? 'PPCM' : 'PGCD'} : les deux ont été échangés`],
        [x, 'c’est l’un des deux nombres de l’énoncé'],
        [y, 'c’est l’autre nombre de l’énoncé'],
        [Math.abs(x - y), 'c’est leur différence — elle n’a rien à voir avec le PGCD'],
      ],
      (n) => nombre(n),
      { minimum: 1 },
    )

    return {
      section: S,
      skillId: pgcdPpcm.skillId,
      typeItem: 'qcm',
      enonce: `Quel est le ${cherchePgcd ? 'PGCD' : 'PPCM'} de ${nombre(x)} et ${nombre(y)} ?`,
      options,
      bonneReponse,
      diagnostics,
      rappel: cherchePgcd
        ? `${nombre(x)} = ${d}×${u}, ${nombre(y)} = ${d}×${v} : le facteur commun est ${d}.`
        : `PPCM = ${d} × ${u} × ${v} = ${nombre(ppcm(x, y))}.`,
      explication:
        `1. Factoriser les deux nombres pour faire apparaître ce qu'ils ont en commun :\n` +
        `   ${nombre(x)} = ${d} × ${u} et ${nombre(y)} = ${d} × ${v}.\n` +
        `2. ${u} et ${v} n'ont aucun diviseur commun : le facteur ${d} est donc le plus grand qu'on puisse ` +
        `mettre en commun. PGCD = ${d}.\n` +
        `3. Le PPCM prend le facteur commun UNE fois, puis ce qui reste de chaque côté : ` +
        `${d} × ${u} × ${v} = ${nombre(ppcm(x, y))}.\n` +
        `4. La question porte sur le ${cherchePgcd ? 'PGCD' : 'PPCM'} : ${nombre(reponse)}.\n` +
        `Contrôle imparable : PGCD × PPCM = les deux nombres multipliés. ` +
        `Ici ${d} × ${nombre(ppcm(x, y))} = ${nombre(x * y)} = ${nombre(x)} × ${nombre(y)}. ` +
        `Et un repère de bon sens : le PGCD est plus petit que les deux nombres, le PPCM plus grand.`,
      difficulte: 2,
    }
  },
}

/* ------------------------------------------------------ géométrie plane -- */

const TRIPLETS: Array<[number, number, number]> = [
  [3, 4, 5],
  [5, 12, 13],
  [8, 15, 17],
  [7, 24, 25],
  [9, 40, 41],
  [20, 21, 29],
]

const geometrie: Famille = {
  skillId: 'tm.calcul.geometrie_plane',
  nom: 'triangle rectangle',
  produire(a) {
    const [p, q, h] = a.choix(TRIPLETS)
    const k = a.entier(1, 6)
    const [c1, c2, hyp] = [p * k, q * k, h * k]
    const cherchePerimetre = a.chance(0.5)
    const aire = (c1 * c2) / 2
    const reponse = cherchePerimetre ? c1 + c2 + hyp : aire

    const { options, bonneReponse, diagnostics } = qcm(
      a,
      reponse,
      cherchePerimetre
        ? [
            [c1 + c2, 'l’hypoténuse a été oubliée : un périmètre compte les trois côtés'],
            [aire, 'c’est l’aire, pas le périmètre'],
            [c1 + c2 + c1, `le côté de ${nombre(c1)} cm a été compté deux fois à la place de l’hypoténuse`],
            [2 * (c1 + c2), 'c’est le périmètre d’un rectangle de mêmes côtés, pas d’un triangle'],
          ]
        : [
            [c1 * c2, 'la division par 2 a été oubliée : c’est l’aire du rectangle, le triangle en fait la moitié'],
            [(c1 * hyp) / 2, `l’hypoténuse a remplacé le côté de ${nombre(c2)} cm — l’aire se calcule sur les deux côtés de l’angle droit`],
            [c1 + c2 + hyp, 'c’est le périmètre, pas l’aire'],
            [(c2 * hyp) / 2, `l’hypoténuse a remplacé le côté de ${nombre(c1)} cm — l’aire se calcule sur les deux côtés de l’angle droit`],
          ],
      (n) => `${nombre(n)} ${cherchePerimetre ? 'cm' : 'cm²'}`,
      { minimum: 0 },
    )

    return {
      section: S,
      skillId: geometrie.skillId,
      typeItem: 'qcm',
      enonce:
        `Un triangle rectangle a pour côtés de l'angle droit ${nombre(c1)} cm et ${nombre(c2)} cm. ` +
        (cherchePerimetre ? `Quel est son périmètre ?` : `Quelle est son aire ?`),
      options,
      bonneReponse,
      diagnostics,
      rappel: cherchePerimetre
        ? `Triplet ${p}-${q}-${h} × ${k} : hypoténuse ${nombre(hyp)}, périmètre ${nombre(reponse)} cm.`
        : `Aire = (${nombre(c1)} × ${nombre(c2)}) ÷ 2 = ${nombre(reponse)} cm². L'hypoténuse ne sert pas.`,
      explication: cherchePerimetre
        ? `1. Le périmètre demande les trois côtés : les deux de l'angle droit sont donnés, ` +
          `l'hypoténuse est à trouver.\n` +
          `2. Pythagore : hypoténuse = √(${nombre(c1)}² + ${nombre(c2)}²) = ` +
          `√(${nombre(c1 * c1)} + ${nombre(c2 * c2)}) = √${nombre(hyp * hyp)} = ${nombre(hyp)} cm.\n` +
          `3. Périmètre : ${nombre(c1)} + ${nombre(c2)} + ${nombre(hyp)} = ${nombre(reponse)} cm.\n` +
          `Le raccourci qui fait gagner trente secondes : ce triangle est le triplet ${p}-${q}-${h} ` +
          `multiplié par ${k}. Les six triplets à connaître par cœur — 3-4-5, 5-12-13, 8-15-17, 7-24-25, ` +
          `9-40-41, 20-21-29 — couvrent presque tous les triangles rectangles du TAGE MAGE, ` +
          `et dispensent de la racine carrée.`
        : `1. L'aire d'un triangle rectangle se calcule sur les deux côtés de l'angle droit, ` +
          `qui se servent mutuellement de base et de hauteur.\n` +
          `2. Aire = (base × hauteur) ÷ 2 = (${nombre(c1)} × ${nombre(c2)}) ÷ 2 = ` +
          `${nombre(c1 * c2)} ÷ 2 = ${nombre(reponse)} cm².\n` +
          `3. L'hypoténuse (${nombre(hyp)} cm ici) ne sert à rien pour l'aire : elle n'est ni base ni hauteur.\n` +
          `Les deux erreurs classiques : oublier la division par 2 — on obtient alors l'aire du rectangle, ` +
          `soit le double — et faire entrer l'hypoténuse dans le produit.`,
      difficulte: 2,
    }
  },
}

/* ------------------------------------------------------ aires et volumes -- */

const aires: Famille = {
  skillId: 'tm.calcul.aires_et_volumes',
  nom: 'rectangle à périmètre donné',
  produire(a) {
    const k = a.entier(2, 5)
    const largeur = a.entier(3, 30)
    const longueur = largeur * k
    const perimetre = 2 * (largeur + longueur)
    const aire = largeur * longueur

    const { options, bonneReponse, diagnostics } = qcm(
      a,
      aire,
      [
        [perimetre, 'c’est le périmètre donné par l’énoncé, recopié tel quel'],
        [largeur + longueur, 'c’est le demi-périmètre (largeur + longueur), pas leur produit'],
        [(perimetre * perimetre) / 16, 'c’est l’aire du carré de même périmètre — mais le rectangle n’est pas un carré'],
        [largeur * largeur * k * k * 2, 'un facteur de trop : l’aire a été doublée en cours de route'],
      ],
      (n) => `${nombre(n)} cm²`,
      { minimum: 0 },
    )

    return {
      section: S,
      skillId: aires.skillId,
      typeItem: 'qcm',
      enonce:
        `Un rectangle a un périmètre de ${nombre(perimetre)} cm et sa longueur vaut ` +
        `${k} fois sa largeur. Quelle est son aire ?`,
      options,
      bonneReponse,
      diagnostics,
      rappel: `${2 * (k + 1)}l = ${nombre(perimetre)} → l = ${nombre(largeur)}, L = ${nombre(longueur)}, aire ${nombre(aire)} cm².`,
      explication:
        `1. Tout ramener à UNE inconnue. On appelle l la largeur ; l'énoncé dit que la longueur vaut ${k}l.\n` +
        `2. Écrire le périmètre avec cette seule inconnue : ` +
        `2 × (l + ${k}l) = 2 × ${k + 1}l = ${2 * (k + 1)}l.\n` +
        `3. Ce périmètre vaut ${nombre(perimetre)} cm, donc l = ${nombre(perimetre)} ÷ ${2 * (k + 1)} = ` +
        `${nombre(largeur)} cm, et L = ${k} × ${nombre(largeur)} = ${nombre(longueur)} cm.\n` +
        `4. Aire = L × l = ${nombre(longueur)} × ${nombre(largeur)} = ${nombre(aire)} cm².\n` +
        `Contrôle : 2 × (${nombre(largeur)} + ${nombre(longueur)}) = ${nombre(perimetre)} cm, ` +
        `le périmètre annoncé. Le réflexe à retenir : quand deux dimensions sont liées par un rapport, ` +
        `on les exprime toutes les deux avec la même lettre — le problème devient une équation à une inconnue.`,
      difficulte: 3,
    }
  },
}

/* --------------------------------------------------- moyennes et médianes -- */

const moyennes: Famille = {
  skillId: 'tm.calcul.moyennes_et_medianes',
  nom: 'note manquante',
  produire(a) {
    // La note déduite doit rester dans [0, 20] : sinon l'énoncé est absurde et
    // l'élève écarte la bonne réponse pour de bonnes raisons.
    let n = 0
    let moyenne = 0
    let nouvelle = 0
    let note = -1
    for (let essai = 0; essai < 40 && (note < 0 || note > 20); essai++) {
      n = a.entier(4, 9)
      moyenne = a.entier(8, 15)
      nouvelle = moyenne + a.choix([-2, -1, 1, 2])
      note = (n + 1) * nouvelle - n * moyenne
    }

    const { options, bonneReponse, diagnostics } = qcm(
      a,
      note,
      [
        [nouvelle, 'c’est la nouvelle moyenne, recopiée : une moyenne n’est pas une note'],
        [2 * nouvelle - moyenne, 'le calcul a été mené comme s’il n’y avait qu’un seul devoir avant'],
        [moyenne, 'c’est l’ancienne moyenne'],
        [(moyenne + nouvelle) / 2, 'c’est la moyenne des deux moyennes — deux moyennes ne se moyennent pas'],
      ],
      (v) => nombre(v, Number.isInteger(v) ? 0 : 1),
      { minimum: 0 },
    )

    return {
      section: S,
      skillId: moyennes.skillId,
      typeItem: 'qcm',
      enonce:
        `${a.choix(PRENOMS)} a une moyenne de ${nombre(moyenne)} sur ${n} devoirs. ` +
        `Après un ${n + 1}ᵉ devoir, sa moyenne devient ${nombre(nouvelle)}. ` +
        `Quelle note a été obtenue à ce dernier devoir ?`,
      options,
      bonneReponse,
      diagnostics,
      rappel: `${nombre((n + 1) * nouvelle)} − ${nombre(n * moyenne)} = ${nombre(note)}. On passe par les totaux.`,
      explication:
        `1. Une moyenne ne se manipule pas directement : on repasse toujours par le TOTAL des points, ` +
        `qui est le seul nombre qui s'additionne.\n` +
        `2. Total avant : ${n} devoirs × ${nombre(moyenne)} de moyenne = ${nombre(n * moyenne)} points.\n` +
        `3. Total après : ${n + 1} devoirs × ${nombre(nouvelle)} de moyenne = ${nombre((n + 1) * nouvelle)} points.\n` +
        `4. Le dernier devoir est la différence des deux totaux : ` +
        `${nombre((n + 1) * nouvelle)} − ${nombre(n * moyenne)} = ${nombre(note)}.\n` +
        `Le contrôle de bon sens : la moyenne a ${nouvelle > moyenne ? 'monté' : 'baissé'}, ` +
        `la note doit donc être ${nouvelle > moyenne ? 'au-dessus' : 'en dessous'} de l'ancienne moyenne — ` +
        `${nombre(note)} ${nouvelle > moyenne ? '>' : '<'} ${nombre(moyenne)}, c'est cohérent. ` +
        `Et l'erreur que teste la question : faire la moyenne des deux moyennes.`,
      difficulte: 3,
    }
  },
}

/* --------------------------------------------------------- probabilités -- */

const probabilites: Famille = {
  skillId: 'tm.calcul.probabilites',
  nom: 'tirage sans remise',
  produire(a) {
    const rouges = a.entier(3, 8)
    const bleues = a.entier(3, 9)
    const total = rouges + bleues

    const favorables = rouges * (rouges - 1)
    const possibles = total * (total - 1)

    // Les propositions sont des fractions réduites : formater une probabilité
    // en décimal arrondi effacerait justement la différence entre « avec » et
    // « sans remise », qui est ce que la question teste.
    const { options, bonneReponse, diagnostics } = qcmTexte(a, fraction(favorables, possibles), [
      [fraction(rouges * rouges, total * total), 'c’est le calcul AVEC remise : la boule aurait été remise dans l’urne'],
      [fraction(bleues * (bleues - 1), possibles), 'c’est la probabilité de deux BLEUES'],
      [fraction(rouges, total), 'c’est la probabilité d’une seule boule rouge, au premier tirage'],
      [fraction(2 * rouges * bleues, possibles), 'c’est la probabilité d’obtenir une boule de chaque couleur'],
      [fraction(rouges * (rouges - 1), total * total), 'le numérateur a été ajusté mais pas le dénominateur : il reste une boule de moins dans l’urne aussi'],
      [fraction(rouges - 1, total - 1), 'c’est le second tirage seul, sans le premier'],
    ])

    return {
      section: S,
      skillId: probabilites.skillId,
      typeItem: 'qcm',
      enonce:
        `Une urne contient ${rouges} boules rouges et ${bleues} boules bleues. ` +
        `On en tire deux successivement, sans remise. ` +
        `Quelle est la probabilité d'obtenir deux boules rouges ?`,
      options,
      bonneReponse,
      diagnostics,
      rappel: `${rouges}/${total} × ${rouges - 1}/${total - 1} = ${fraction(favorables, possibles)}. Sans remise : les deux nombres baissent.`,
      explication:
        `1. L'urne contient ${rouges} + ${bleues} = ${total} boules.\n` +
        `2. Premier tirage : ${rouges} boules rouges sur ${total}, soit ${rouges}/${total}.\n` +
        `3. « Sans remise » : la boule tirée ne revient pas. Il reste ${rouges - 1} rouges ` +
        `sur ${total - 1} boules au total. Les DEUX nombres baissent d'une unité.\n` +
        `4. Les deux tirages doivent réussir tous les deux, donc on multiplie : ` +
        `${rouges}/${total} × ${rouges - 1}/${total - 1} = ${favorables}/${possibles} = ` +
        `${fraction(favorables, possibles)}.\n` +
        `Le piège tient en deux mots dans l'énoncé. Avec remise, on aurait ` +
        `${rouges}/${total} × ${rouges}/${total} = ${fraction(rouges * rouges, total * total)}. ` +
        `Repérer « avec » ou « sans remise » avant de calculer vaut un point à chaque fois.`,
      difficulte: 3,
    }
  },
}

/* --------------------------------------------------------- dénombrement -- */

function combinaisons(n: number, k: number): number {
  let r = 1
  for (let i = 1; i <= k; i++) r = (r * (n - k + i)) / i
  return Math.round(r)
}

function arrangements(n: number, k: number): number {
  let r = 1
  for (let i = 0; i < k; i++) r *= n - i
  return r
}

const denombrement: Famille = {
  skillId: 'tm.calcul.denombrement',
  nom: 'comité et podium',
  produire(a) {
    const n = a.entier(6, 12)
    const ordonne = a.chance(0.5)
    // Un podium a au plus trois marches : au-delà, l'énoncé décrirait autre chose.
    const k = ordonne ? a.entier(2, 3) : a.entier(2, 4)
    const reponse = ordonne ? arrangements(n, k) : combinaisons(n, k)

    const facteurs = Array.from({ length: k }, (_, i) => n - i)
    const produit = facteurs.join(' × ')
    const factorielle = Array.from({ length: k }, (_, i) => k - i).join(' × ')

    const { options, bonneReponse, diagnostics } = qcm(
      a,
      reponse,
      [
        [
          ordonne ? combinaisons(n, k) : arrangements(n, k),
          ordonne
            ? `l’ordre a été ignoré : on a divisé par ${k}! alors que les places sont distinctes`
            : `l’ordre a été compté : chaque commission a été comptée ${factorielle} = ${nombre(arrangements(n, k) / combinaisons(n, k))} fois`,
        ],
        [Math.pow(n, k), `c’est ${n}^${k} : cela reviendrait à pouvoir choisir ${k} fois la même personne`],
        [combinaisons(n, k - 1), `le calcul a porté sur ${k - 1} places au lieu de ${k}`],
        [n * k, 'les deux nombres ont été multipliés entre eux, sans démarche de dénombrement'],
      ],
      (v) => nombre(v),
      { minimum: 1 },
    )

    return {
      section: S,
      skillId: denombrement.skillId,
      typeItem: 'qcm',
      enonce: ordonne
        ? `${n} coureurs disputent une course. Combien de podiums différents (${k} places distinctes) sont possibles ?`
        : `Un club de ${n} membres doit désigner une commission de ${k} personnes, sans hiérarchie. ` +
          `Combien de commissions différentes peut-on former ?`,
      options,
      bonneReponse,
      diagnostics,
      rappel: ordonne
        ? `Places distinctes → l'ordre compte : ${produit} = ${nombre(reponse)}.`
        : `Sans hiérarchie → l'ordre ne compte pas : (${produit}) ÷ ${k}! = ${nombre(reponse)}.`,
      explication:
        `1. La seule question à se poser : est-ce que changer l'ordre change le résultat ?\n` +
        (ordonne
          ? `   Ici oui — ${k} places distinctes, être premier n'est pas être ${k}ᵉ. On compte des ARRANGEMENTS.\n` +
            `2. On remplit les places une par une : ${n} candidats pour la première, ` +
            `${n - 1} pour la deuxième${k > 2 ? `, ${n - 2} pour la troisième` : ''}.\n` +
            `3. ${produit} = ${nombre(reponse)}.\n` +
            `Le piège inverse : si les ${k} places n'étaient pas distinctes, il faudrait diviser par ` +
            `${k}! = ${factorielle} = ${nombre(arrangements(n, k) / combinaisons(n, k))}, ` +
            `et on trouverait ${nombre(combinaisons(n, k))}.`
          : `   Ici non — la commission est « sans hiérarchie », les mêmes ${k} personnes forment la même ` +
            `commission quel que soit l'ordre où on les nomme. On compte des COMBINAISONS.\n` +
            `2. On commence comme si l'ordre comptait : ${produit} = ${nombre(arrangements(n, k))} façons ` +
            `de désigner ${k} personnes l'une après l'autre.\n` +
            `3. Mais chaque commission a été comptée autant de fois qu'il y a de façons d'ordonner ` +
            `${k} personnes, soit ${k}! = ${factorielle} = ${nombre(arrangements(n, k) / combinaisons(n, k))}.\n` +
            `4. On divise : ${nombre(arrangements(n, k))} ÷ ${nombre(arrangements(n, k) / combinaisons(n, k))} = ` +
            `${nombre(reponse)}.\n` +
            `Le repère de vocabulaire : « podium », « classement », « président et trésorier » → l'ordre compte. ` +
            `« Commission », « équipe », « groupe », « poignée de main » → il ne compte pas.`),
      difficulte: 3,
    }
  },
}

/* ------------------------------------------ vitesses, débits et mélanges -- */

const vitesseMoyenne: Famille = {
  skillId: 'tm.calcul.vitesses_debits_et_melanges',
  nom: 'vitesse moyenne aller-retour',
  produire(a) {
    const v1 = a.choix([20, 30, 40, 60, 80])
    let v2 = a.choix([20, 30, 40, 60, 120])
    if (v2 === v1) v2 = v1 === 60 ? 30 : 60

    const moyenne = (2 * v1 * v2) / (v1 + v2)

    const { options, bonneReponse, diagnostics } = qcm(
      a,
      moyenne,
      [
        [(v1 + v2) / 2, 'c’est la moyenne des deux vitesses — elle supposerait des DURÉES égales, or ce sont les distances qui le sont'],
        [v1, 'c’est la vitesse de l’aller seul'],
        [v2, 'c’est la vitesse du retour seul'],
        [Math.abs(v1 - v2), 'c’est l’écart entre les deux vitesses'],
      ],
      (n) => `${nombre(n, Number.isInteger(n) ? 0 : 1)} km/h`,
      { minimum: 0 },
    )

    // Distance arbitraire posée à v1 × v2 : elle se simplifie, mais rend la
    // démarche lisible sans fraction de fraction.
    const dist = v1 * v2

    return {
      section: S,
      skillId: vitesseMoyenne.skillId,
      typeItem: 'qcm',
      enonce:
        `${a.choix(PRENOMS)} parcourt un trajet aller à ${nombre(v1)} km/h et revient par le même ` +
        `chemin à ${nombre(v2)} km/h. Quelle est la vitesse moyenne sur l'aller-retour ?`,
      options,
      bonneReponse,
      diagnostics,
      rappel: `2 × ${v1} × ${v2} ÷ (${v1} + ${v2}) = ${nombre(moyenne, 1)} km/h. Jamais la moyenne des vitesses.`,
      explication:
        `1. Une vitesse moyenne, c'est toujours distance totale ÷ temps total. Jamais la moyenne des vitesses.\n` +
        `2. La distance n'est pas donnée : on en choisit une commode, par exemple ${nombre(dist)} km ` +
        `à l'aller (elle se simplifiera à la fin, le résultat n'en dépend pas).\n` +
        `3. Temps aller : ${nombre(dist)} ÷ ${v1} = ${nombre(dist / v1)} h. ` +
        `Temps retour : ${nombre(dist)} ÷ ${v2} = ${nombre(dist / v2)} h. ` +
        `Temps total ${nombre(dist / v1 + dist / v2)} h pour ${nombre(2 * dist)} km.\n` +
        `4. Vitesse moyenne : ${nombre(2 * dist)} ÷ ${nombre(dist / v1 + dist / v2)} = ` +
        `${nombre(moyenne, 1)} km/h. C'est la formule 2 v₁ v₂ ÷ (v₁ + v₂), qu'on peut appliquer directement.\n` +
        `Le piège : ${nombre((v1 + v2) / 2)} km/h, la moyenne des deux vitesses. Elle ne vaudrait que si ` +
        `l'on passait autant de TEMPS à chaque allure ; ici c'est la DISTANCE qui est la même, ` +
        `et on passe plus de temps à la vitesse lente. ` +
        `D'où le contrôle immédiat : la vitesse moyenne est toujours plus petite que la moyenne des vitesses ` +
        `(${nombre(moyenne, 1)} < ${nombre((v1 + v2) / 2)}).`,
      difficulte: 4,
    }
  },
}

const robinets: Famille = {
  skillId: 'tm.calcul.vitesses_debits_et_melanges',
  nom: 'travail conjoint',
  produire(a) {
    const x = a.entier(2, 9)
    const y = a.entier(2, 9) + x // durées distinctes
    const ensemble = (x * y) / (x + y)

    const { options, bonneReponse, diagnostics } = qcm(
      a,
      ensemble,
      // Des leurres qui sont eux aussi des calculs, souvent non ronds : avec des
      // entiers seuls en face (5 h, 9 h, 18 h…), la seule décimale désignait
      // la bonne réponse sans qu'on ait rien à calculer.
      [
        [x / 2, 'c’est comme si la seconde pompe allait aussi vite que la première : le temps aurait été divisé par deux'],
        [(x + y) / 2, 'c’est la moyenne des deux durées — or à deux on va plus vite que chacune seule'],
        [(x * y) / (y - x), 'les débits ont été soustraits (1/' + x + ' − 1/' + y + ') au lieu d’être additionnés'],
        [x + y, 'les durées ont été additionnées : ce serait le temps si les pompes travaillaient l’une APRÈS l’autre'],
        [Math.min(x, y), 'c’est la durée de la pompe la plus rapide, seule'],
      ],
      (n) => `${nombre(n, Number.isInteger(n) ? 0 : 2)} h`,
      { minimum: 0 },
    )

    return {
      section: S,
      skillId: robinets.skillId,
      typeItem: 'qcm',
      enonce:
        `Une pompe remplit un bassin en ${x} heures, une seconde le remplit en ${y} heures. ` +
        `En combien de temps le remplissent-elles ensemble ?`,
      options,
      bonneReponse,
      diagnostics,
      rappel: `1/${x} + 1/${y} = ${fraction(x + y, x * y)} par heure → ${nombre(ensemble, 2)} h. On additionne les débits.`,
      explication:
        `1. Les durées ne s'additionnent pas ; les DÉBITS, si. On convertit donc chaque durée en « part de ` +
        `bassin remplie en une heure ».\n` +
        `2. Première pompe : 1/${x} de bassin par heure. Seconde : 1/${y} de bassin par heure.\n` +
        `3. Ensemble : 1/${x} + 1/${y} = ${y}/${x * y} + ${x}/${x * y} = ${fraction(x + y, x * y)} de bassin par heure.\n` +
        `4. Le bassin entier prend l'inverse de ce débit : ${fraction(x * y, x + y)} = ` +
        `${nombre(ensemble, 2)} h.\n` +
        `Le contrôle qui élimine trois propositions sans calcul : à deux, on va forcément plus vite que ` +
        `la plus rapide toute seule. La réponse doit être inférieure à ${Math.min(x, y)} h — ` +
        `${nombre(ensemble, 2)} h l'est bien. Toute proposition au-dessus est fausse d'office.`,
      difficulte: 3,
    }
  },
}

/* ------------------------------------------------ suites et progressions -- */

const suites: Famille = {
  skillId: 'tm.calcul.suites_et_progressions',
  nom: 'progression arithmétique',
  produire(a) {
    const u1 = a.entier(2, 30)
    const r = a.entier(2, 12)
    const n = a.entier(8, 30)
    const chercheSomme = a.chance(0.5)

    const un = u1 + (n - 1) * r
    const somme = (n * (u1 + un)) / 2
    const reponse = chercheSomme ? somme : un

    const { options, bonneReponse, diagnostics } = qcm(
      a,
      reponse,
      chercheSomme
        ? [
            [n * un, 'tous les termes ont été supposés égaux au dernier'],
            [(n * (u1 + un + r)) / 2, 'un terme de trop dans la parenthèse : la suite s’arrête à u' + n],
            [un, `c’est le ${n}ᵉ terme seul, pas la somme`],
            [n * u1, 'tous les termes ont été supposés égaux au premier'],
          ]
        : [
            [u1 + n * r, `${n} augmentations ont été comptées au lieu de ${n - 1} : le premier terme n’en a subi aucune`],
            [somme, 'c’est la somme des ' + n + ' premiers termes, pas le ' + n + 'ᵉ terme'],
            [u1 * n, 'le premier terme a été multiplié par le rang, au lieu d’ajouter la raison'],
            [un + r, 'un terme de trop : c’est u' + (n + 1)],
          ],
      (v) => nombre(v),
      { minimum: 0 },
    )

    return {
      section: S,
      skillId: suites.skillId,
      typeItem: 'qcm',
      enonce: chercheSomme
        ? `Une suite commence à ${nombre(u1)} et augmente de ${nombre(r)} à chaque terme. ` +
          `Quelle est la somme de ses ${n} premiers termes ?`
        : `Une suite commence à ${nombre(u1)} et augmente de ${nombre(r)} à chaque terme. ` +
          `Que vaut son ${n}ᵉ terme ?`,
      options,
      bonneReponse,
      diagnostics,
      rappel: chercheSomme
        ? `u${n} = ${nombre(un)}, puis ${n} × (${nombre(u1)} + ${nombre(un)}) ÷ 2 = ${nombre(somme)}.`
        : `u${n} = ${nombre(u1)} + ${n - 1} × ${nombre(r)} = ${nombre(un)}. Le « n − 1 » est le piège.`,
      explication:
        `1. La suite avance de ${nombre(r)} à chaque pas : c'est une progression arithmétique ` +
        `de premier terme ${nombre(u1)} et de raison ${nombre(r)}.\n` +
        `2. Le nᵉ terme vaut u₁ + (n − 1) × r. Le « n − 1 » est le point qui coûte des points : ` +
        `pour aller du 1ᵉʳ au ${n}ᵉ terme il y a ${n - 1} pas, pas ${n}. Le premier terme n'a subi ` +
        `aucune augmentation.\n` +
        `   u${n} = ${nombre(u1)} + ${n - 1} × ${nombre(r)} = ${nombre(u1)} + ${nombre((n - 1) * r)} = ${nombre(un)}.\n` +
        (chercheSomme
          ? `3. La somme de termes régulièrement espacés vaut : (premier + dernier) ÷ 2 × leur nombre. ` +
            `C'est la moyenne des extrêmes, multipliée par l'effectif.\n` +
            `4. (${nombre(u1)} + ${nombre(un)}) ÷ 2 = ${nombre((u1 + un) / 2)}, puis × ${n} = ${nombre(somme)}.\n` +
            `Attention à ne pas rendre u${n} = ${nombre(un)} : c'est le dernier terme, une étape du calcul, ` +
            `pas la somme demandée.`
          : `3. La question s'arrête là : ${nombre(un)}.\n` +
            `L'erreur qui revient le plus souvent est ${nombre(u1 + n * r)}, obtenu avec ${n} pas au lieu de ${n - 1}. ` +
            `Le contrôle en deux secondes : sur les premiers termes, u₁ = ${nombre(u1)}, u₂ = ${nombre(u1 + r)}, ` +
            `u₃ = ${nombre(u1 + 2 * r)} — le rang dépasse toujours d'une unité le nombre d'augmentations.`),
      difficulte: 2,
    }
  },
}

export const FAMILLES_CALCUL: Famille[] = [
  pourcentages,
  variationGlobale,
  ratios,
  premierDegre,
  secondDegre,
  systemes,
  divisibilite,
  pgcdPpcm,
  geometrie,
  aires,
  moyennes,
  probabilites,
  denombrement,
  vitesseMoyenne,
  robinets,
  suites,
  // Deuxièmes modèles des types qui n'en avaient qu'un (calcul-modeles.ts).
  ...MODELES_CALCUL_SUPPLEMENTAIRES,
]
