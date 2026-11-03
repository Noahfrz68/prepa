/**
 * Sous-test 2 — Calcul.
 *
 * Chaque famille pose ses paramètres PUIS calcule la réponse : la bonne
 * proposition n'est jamais un choix, c'est un résultat. Les leurres sont des
 * erreurs de méthode nommées dans l'explication, pour qu'une erreur apprenne
 * quelque chose au lieu d'être un simple raté.
 */

import { capitale, de, euros, fraction, nombre, pgcd, pourcent, ppcm, presqueEntier, type Alea } from './alea'
import { qcm, qcmFraction, type Leurre, type LeurreFraction } from './qcm'
import type { Famille, QuestionGeneree } from './types'
import { MODELES_CALCUL_SUPPLEMENTAIRES } from './calcul-modeles'
import { FAMILLES_IDEES } from './calcul-idees'
import { chercher, FAMILLES_PROBLEMES } from './calcul-problemes'

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
    // « Une hausse puis une baisse, quel prix final ? » se réglait d'un seul
    // produit de coefficients (difficulté 2). La moitié des tirages demande
    // désormais la variation qui ramène au prix de départ : il faut inverser
    // le coefficient, et le leurre « même taux » est celui de l'épreuve.
    if (a.chance(0.5)) return retourAuPrix(a)
    // L'autre moitié enchaîne TROIS variations : une étape de plus, et le
    // leurre « somme des taux » devient bien plus tentant.
    const prix = a.entier(2, 40) * 100
    const hausse = a.choix([10, 20, 25, 40, 50])
    const baisse = a.choix([10, 20, 25, 40, 50])
    const hausse2 = a.choix([10, 20, 25, 50])
    const produit = a.choix(PRODUITS)

    const final = prix * (1 + hausse / 100) * (1 - baisse / 100) * (1 + hausse2 / 100)
    const somme = hausse - baisse + hausse2

    const cH = nombre(1 + hausse / 100, 2)
    const cB = nombre(1 - baisse / 100, 2)
    const cH2 = nombre(1 + hausse2 / 100, 2)

    const { options, bonneReponse, diagnostics } = qcm(
      a,
      final,
      [
        [prix * (1 + somme / 100), `les trois taux ont été additionnés (${hausse} − ${baisse} + ${hausse2} = ${somme} %) au lieu d'être composés`],
        [prix * (1 + hausse / 100) * (1 - baisse / 100), 'la troisième variation a été oubliée'],
        [prix * (1 + hausse2 / 100), 'la hausse et la baisse ont été supposées se compenser — elles ne le font jamais'],
        [prix * (1 + hausse / 100) * (1 + baisse / 100) * (1 + hausse2 / 100), 'la baisse a été appliquée comme une hausse : le signe s’est perdu'],
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
        `puis baisse de ${pourcent(baisse)}, puis augmente encore de ${pourcent(hausse2)}. Quel est le prix final ?`,
      options,
      bonneReponse,
      diagnostics,
      rappel: `${euros(prix)} × ${cH} × ${cB} × ${cH2} = ${euros(final)}. Les taux se composent.`,
      explication:
        `1. Chaque variation devient un coefficient multiplicateur : ${cH}, ${cB}, ${cH2}.\n` +
        `2. Elles se suivent, donc les coefficients se multiplient : ${euros(prix)} × ${cH} × ${cB} × ${cH2}.\n` +
        `3. ${euros(prix)} × ${cH} = ${euros(prix * (1 + hausse / 100))} ; × ${cB} = ` +
        `${euros(prix * (1 + hausse / 100) * (1 - baisse / 100))} ; × ${cH2} = ${euros(final)}.\n` +
        `Le piège : ${hausse} − ${baisse} + ${hausse2} = ${somme} % donnerait ` +
        `${euros(prix * (1 + somme / 100))}. Additionner des taux n'est légitime que s'ils portent sur la même base ; ` +
        `ici chaque variation porte sur le prix déjà modifié par la précédente.`,
      difficulte: 3,
    }
  },
}

/**
 * « Le prix augmente de 25 % : de combien doit-il baisser pour revenir au
 * départ ? » Réponse 20 %, pas 25 : la baisse porte sur un prix plus élevé.
 * Couples choisis pour tomber juste.
 */
const RETOURS: Array<[variation: number, retour: number]> = [
  [25, 20], [100, 50], [150, 60], [300, 75], [400, 80], [60, 37.5],
  [-20, 25], [-50, 100], [-60, 150], [-75, 300], [-80, 400],
]

function retourAuPrix(a: Alea): QuestionGeneree {
  const [v, r] = a.choix(RETOURS)
  const hausse = v > 0
  const produit = a.choix(PRODUITS)
  const c = 1 + v / 100
  const pct = (x: number) => `${nombre(x, Number.isInteger(x) ? 0 : 1)} %`

  const leurres: Leurre[] = [
    [Math.abs(v), `le même taux en sens inverse : la seconde variation porte sur un prix ${hausse ? 'plus élevé' : 'plus bas'}, elle ne peut pas compenser au même taux`],
  ]
  // Le calcul fait dans l'autre sens : la compensation d'une variation de signe opposé.
  const inverse = hausse ? (100 * v) / (100 - v) : (-100 * v) / (100 - v)
  if (v < 100 && v > -100 && Number.isFinite(inverse) && inverse > 0) {
    leurres.push([Math.round(inverse * 10) / 10, 'la formule a été appliquée dans le mauvais sens : la base de la seconde variation est le prix modifié, pas le prix de départ'])
  }
  leurres.push([Math.abs(v) / 2, 'la moitié du taux : aucune règle ne justifie ce raccourci'])
  if (Math.abs(v) < 100) leurres.push([100 - Math.abs(v), `c’est le complément à 100 de ${Math.abs(v)} %, pas le taux de retour`])

  const { options, bonneReponse, diagnostics } = qcm(a, r, leurres, pct, { minimum: 0 })
  return {
    section: S,
    skillId: 'tm.calcul.pourcentages_et_variations',
    typeItem: 'qcm',
    enonce: hausse
      ? `Le prix d’${produit} augmente de ${pourcent(v)}. De quel pourcentage ce nouveau prix doit-il baisser pour revenir au prix de départ ?`
      : `Le prix d’${produit} baisse de ${pourcent(-v)}. De quel pourcentage ce nouveau prix doit-il augmenter pour retrouver le prix de départ ?`,
    options,
    bonneReponse,
    diagnostics,
    rappel: `Coefficient ${nombre(c, 2)} ; pour revenir, × 1/${nombre(c, 2)} = ${nombre(1 / c, 4)}, soit ${hausse ? '−' : '+'}${pct(r)}.`,
    explication:
      `1. La variation de ${pourcent(Math.abs(v))} ${hausse ? 'en hausse' : 'en baisse'} correspond au coefficient ${nombre(c, 2)}.\n` +
      `2. Revenir au prix de départ, c'est multiplier par l'inverse : 1 ÷ ${nombre(c, 2)} = ${nombre(1 / c, 4)}.\n` +
      `3. ${nombre(1 / c, 4)} ${hausse ? `= 1 − ${nombre(r / 100, 4)}, soit une baisse de` : `= 1 + ${nombre(r / 100, 4)}, soit une hausse de`} ${pct(r)}.\n` +
      `Le piège : répondre ${pourcent(Math.abs(v))}. La seconde variation porte sur le prix déjà ${hausse ? 'augmenté' : 'diminué'} : ` +
      `${hausse ? 'une baisse appliquée à une base plus grande retire plus, il en faut donc moins' : 'une hausse appliquée à une base plus petite ajoute moins, il en faut donc plus'}. ` +
      `Contrôle sur 100 € : ${nombre(100 * c)} € ${hausse ? '−' : '+'} ${pct(r)} = 100 €.`,
    difficulte: 3,
  }
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
      (n) => `${nombre(n, presqueEntier(n) ? 0 : 2)} %`,
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
    // Le total donné se partageait en une division (difficulté 2). C'est
    // désormais l'ÉCART entre les deux groupes qui est donné : il faut voir
    // qu'il vaut |q − p| parts, et le leurre « l'écart est une part » est
    // le réflexe qui coûte le point.
    const { p, q } = chercher(
      a,
      (a) => ({ p: a.entier(2, 7), q: a.entier(2, 9) }),
      ({ p, q }) => p !== q && pgcd(p, q) === 1 && Math.abs(p - q) >= 2,
    )
    const parts = p + q
    const part = a.entier(6, 40)
    const ecart = Math.abs(q - p) * part
    const [adh, vis, total] = [p * part, q * part, parts * part]
    const demande = a.choix(['total', 'visiteurs', 'adherents'] as const)
    const reponse = { total, visiteurs: vis, adherents: adh }[demande]
    const plusNombreux = q > p ? 'visiteurs' : 'adhérents'
    const moinsNombreux = q > p ? "d'adhérents" : 'de visiteurs'

    const { options, bonneReponse, diagnostics } = qcm(
      a,
      reponse,
      [
        [{ total: ecart * parts, visiteurs: ecart * q, adherents: ecart * p }[demande], 'l’écart a été pris pour une part : il en vaut ' + Math.abs(q - p)],
        [{ total: adh, visiteurs: adh, adherents: vis }[demande], demande === 'total' ? 'c’est le nombre d’adhérents seul, pas le total' : 'c’est l’autre groupe'],
        [demande === 'total' ? vis : total, demande === 'total' ? 'c’est le nombre de visiteurs seul, pas le total' : 'c’est le total des deux groupes'],
        [part, `c’est UNE part (${nombre(ecart)} ÷ ${Math.abs(q - p)})`],
        [ecart, 'c’est l’écart donné dans l’énoncé'],
      ],
      (n) => nombre(n),
      { minimum: 1 },
    )

    const question = { total: 'de personnes en tout', visiteurs: 'de visiteurs', adherents: "d'adhérents" }[demande]
    return {
      section: S,
      skillId: ratios.skillId,
      typeItem: 'qcm',
      enonce:
        `Dans ${a.choix(ENTREPRISES).join(' ')}, le rapport entre le nombre d'adhérents et celui des visiteurs ` +
        `est de ${p} pour ${q}. Il y a ${nombre(ecart)} ${plusNombreux} de plus que ${moinsNombreux}. ` +
        `Combien y a-t-il ${question} ?`,
      options,
      bonneReponse,
      diagnostics,
      rappel: `Écart = ${Math.abs(q - p)} parts → 1 part = ${nombre(part)} ; ${demande === 'total' ? `${parts} parts` : demande === 'visiteurs' ? `${q} parts` : `${p} parts`} = ${nombre(reponse)}.`,
      explication:
        `1. Un rapport de ${p} pour ${q} découpe les personnes en parts égales : ${p} pour les adhérents, ${q} pour les visiteurs.\n` +
        `2. L'écart entre les deux groupes vaut ${Math.abs(q - p)} parts. Une part vaut donc ${nombre(ecart)} ÷ ${Math.abs(q - p)} = ${nombre(part)}.\n` +
        `3. Adhérents : ${p} × ${nombre(part)} = ${nombre(adh)} ; visiteurs : ${q} × ${nombre(part)} = ${nombre(vis)} ; total : ${nombre(total)}.\n` +
        `4. On demande ${question} : ${nombre(reponse)}.\n` +
        `Le piège : prendre l'écart de ${nombre(ecart)} pour une part. Il en vaut ${Math.abs(q - p)}, puisque c'est la différence entre ${q} parts et ${p} parts.`,
      difficulte: 3,
    }
  },
}

/* ---------------------------------------------- équations du 1er degré -- */

const premierDegre: Famille = {
  skillId: 'tm.calcul.equations_du_1er_degre',
  nom: 'nombre inconnu',
  // L'équation était donnée presque toute faite (« le triple d'un nombre
  // augmenté de… ») : difficulté 2. C'est maintenant un problème d'âges, où
  // l'écart de n ans s'ajoute aux DEUX âges — l'oubli classique.
  produire(a) {
    const { k, m, n, b } = chercher(
      a,
      (a) => {
        const k = a.entier(3, 6)
        const m = a.entier(2, k - 1)
        const n = a.entier(2, 20)
        return { k, m, n, b: (n * (m - 1)) / (k - m) }
      },
      ({ k, b }) => Number.isInteger(b) && b >= 3 && b <= 20 && k * b <= 80,
    )
    const [aine, cadet] = a.melanger(PRENOMS).slice(0, 2)
    const demandeAine = a.chance(0.35)
    const reponse = demandeAine ? k * b : b

    const leurres: Leurre[] = [
      [demandeAine ? b : k * b, demandeAine ? `c’est l’âge ${de(cadet)}, pas celui ${de(aine)}` : `c’est l’âge ${de(aine)}, pas celui ${de(cadet)}`],
      [demandeAine ? k * b + n : b + n, `c’est l’âge dans ${n} ans, pas aujourd’hui`],
    ]
    // Les n ans ajoutés au seul cadet : k·b = m(b + n).
    const oubli = (m * n) / (k - m)
    if (Number.isInteger(oubli)) leurres.push([demandeAine ? k * oubli : oubli, `les ${n} ans n’ont été ajoutés qu’à l’âge ${de(cadet)} : ils s’ajoutent aux deux`])
    leurres.push([demandeAine ? k * b - n : Math.abs(b - n), 'les années ont été retranchées au lieu d’être ajoutées'])

    const { options, bonneReponse, diagnostics } = qcm(a, reponse, leurres, (v) => `${nombre(v)} ans`, { minimum: 1 })
    const fois = (x: number) => (x <= 6 ? `le ${motMultiplicateur(x)} de` : `${x} fois`)

    return {
      section: S,
      skillId: premierDegre.skillId,
      typeItem: 'qcm',
      enonce:
        `${aine} a aujourd'hui ${k} fois l'âge ${de(cadet)}. Dans ${n} ans, ${aine} aura ${fois(m)} l'âge ${de(cadet)}. ` +
        `Quel âge a ${demandeAine ? aine : cadet} aujourd'hui ?`,
      options,
      bonneReponse,
      diagnostics,
      rappel: `${k}x + ${n} = ${m}(x + ${n}) → ${k - m === 1 ? '' : `${k - m}x = ${n * (m - 1)} → `}x = ${b}${demandeAine ? `, et ${aine} a ${k * b} ans` : ''}.`,
      explication:
        `1. Appeler x l'âge actuel ${de(cadet)} ; ${aine} a ${k}x ans.\n` +
        `2. Dans ${n} ans, CHACUN a vieilli de ${n} ans : ${aine} aura ${k}x + ${n}, ${cadet} aura x + ${n}.\n` +
        `3. L'énoncé donne : ${k}x + ${n} = ${m}(x + ${n}), soit ${k}x + ${n} = ${m}x + ${m * n}, donc ${k - m === 1 ? '' : k - m}x = ${n * (m - 1)} et x = ${b}.\n` +
        `4. ${cadet} a ${b} ans, ${aine} ${k * b} ans. On demande l'âge ${de(demandeAine ? aine : cadet)} : ${reponse} ans.\n` +
        `Vérification : dans ${n} ans, ${k * b + n} = ${m} × ${b + n}. ` +
        `Le piège : n'ajouter les ${n} ans qu'à un seul des deux âges.`,
      difficulte: 3,
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
  produire: (a) => pgcdEnSituation(a),
}

const heureMinutes = (m: number) => `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, '0')}`

/**
 * Le PGCD ou le PPCM n'est jamais la réponse : c'est l'étape intermédiaire.
 * Trouver le côté des carrés ne suffit pas, on demande leur nombre ; trouver
 * l'intervalle commun ne suffit pas, on demande l'heure ou le nombre de
 * rencontres. Reconnaître l'outil, puis s'en servir (difficulté 3).
 */
function pgcdEnSituation(a: Alea): QuestionGeneree {
  const scene = a.choix(['plaque', 'fleurs', 'bus', 'phares'] as const)
  const pgcdCherche = scene === 'plaque' || scene === 'fleurs'
  const { d, u, v } = chercher(
    a,
    (a) => ({ d: a.choix([6, 8, 9, 12, 14, 15, 18]), u: a.entier(2, 9), v: a.entier(2, 11) }),
    ({ d, u, v }) =>
      u !== v && pgcd(u, v) === 1 &&
      (scene === 'bus' ? d * u * v <= 600 : scene === 'phares' ? d * u * v <= 900 : true),
  )
  const [x, y] = [d * u, d * v]
  const L = d * u * v

  let reponse: number
  let leurres: Leurre[]
  let enonce: string
  let derniere: string
  let formater = (n: number) => nombre(n)

  if (scene === 'plaque') {
    reponse = u * v
    leurres = [
      [d, `c’est le côté des carrés (${d} cm), pas leur nombre`],
      [u + v, 'les carrés des deux bords ont été additionnés au lieu d’être multipliés'],
      [L, 'c’est le PPCM : il ne mesure rien ici'],
      ...(d % 2 === 0 ? [[4 * u * v, `ce sont des carrés de ${d / 2} cm, plus petits que nécessaire`] as Leurre] : []),
    ]
    enonce = `On découpe une plaque de ${nombre(x)} cm sur ${nombre(y)} cm en carrés identiques, les plus grands possible, sans aucune chute. Combien de carrés obtient-on ?`
    derniere = `Côté ${d} cm : ${u} carrés sur la longueur de ${x} cm, ${v} sur celle de ${y} cm, soit ${u} × ${v} = ${reponse} carrés.`
  } else if (scene === 'fleurs') {
    reponse = u
    leurres = [
      [d, `c’est le nombre de bouquets (${d}), pas le nombre de roses par bouquet`],
      [v, 'c’est le nombre de tulipes par bouquet'],
      [u + v, 'c’est le nombre de fleurs par bouquet, roses et tulipes ensemble'],
    ]
    enonce = `Un fleuriste dispose de ${nombre(x)} roses et ${nombre(y)} tulipes. Avec toutes ces fleurs, on compose le plus grand nombre possible de bouquets identiques. Combien de roses contient chaque bouquet ?`
    derniere = `${d} bouquets : chacun reçoit ${x} ÷ ${d} = ${u} roses (et ${v} tulipes).`
  } else if (scene === 'bus') {
    reponse = 360 + L
    formater = heureMinutes
    leurres = [
      [360 + d, `${d} min est le PGCD : à ${heureMinutes(360 + d)}, aucun des deux bus ne repasse forcément`],
      [360 + x, `c’est le prochain passage du premier bus seul`],
      [360 + y, `c’est le prochain passage du second bus seul`],
      ...(360 + x * y < 24 * 60 ? [[360 + x * y, 'avec le produit des deux intervalles : les bus se retrouvent bien, mais pas pour la première fois'] as Leurre] : []),
    ]
    enonce = `Deux bus partent ensemble du terminus à 6 h 00. L'un y repasse toutes les ${x} minutes, l'autre toutes les ${y} minutes. À quelle heure repartiront-ils de nouveau ensemble pour la première fois ?`
    derniere = `${L} min = ${Math.floor(L / 60)} h ${String(L % 60).padStart(2, '0')} après 6 h 00, soit ${heureMinutes(reponse)}.`
  } else {
    reponse = Math.ceil(3600 / L)
    leurres = [
      [reponse - 1, 'l’allumage commun de minuit a été oublié'],
      [reponse + 1, 'un allumage de trop : 1 h est exclue'],
      [Math.ceil(3600 / d), `le calcul a été fait avec le PGCD (${d} s) au lieu du PPCM`],
      [Math.floor(3600 / x) + Math.floor(3600 / y), 'les allumages des deux phares ont été additionnés, sans chercher ceux qui coïncident'],
    ]
    enonce = `Deux phares s'allument ensemble à minuit. L'un s'allume toutes les ${x} secondes, l'autre toutes les ${y} secondes. Combien de fois s'allument-ils en même temps entre minuit et 1 h, minuit compris et 1 h exclue ?`
    derniere = `Ensemble toutes les ${L} s : à 0, ${L}, ${2 * L}… s, tant que l'on reste sous 3 600 s. Cela fait ${reponse} allumages communs.`
  }

  const { options, bonneReponse, diagnostics } = qcm(a, reponse, leurres, formater, { minimum: 1 })
  return {
    section: S,
    skillId: 'tm.calcul.arithmetique_et_divisibilite',
    typeItem: 'qcm',
    // Le mot « PGCD » ou « PPCM » n'apparaît jamais à l'épreuve : on y lit
    // « les plus grands carrés possibles » ou « de nouveau ensemble ».
    enonce,
    options,
    bonneReponse,
    diagnostics,
    rappel: pgcdCherche
      ? `PGCD(${x}, ${y}) = ${d}, puis : ${derniere}`
      : `PPCM(${x}, ${y}) = ${d} × ${u} × ${v} = ${L}, puis : ${derniere}`,
    explication:
      `1. Factoriser : ${nombre(x)} = ${d} × ${u} et ${nombre(y)} = ${d} × ${v}, avec ${u} et ${v} sans diviseur commun.\n` +
      (pgcdCherche
        ? `2. « Les plus grands possible, sans reste » : c'est le PGCD, ${d}.\n`
        : `2. « De nouveau ensemble » : le premier multiple commun aux deux intervalles, c'est le PPCM, ${d} × ${u} × ${v} = ${L}.\n`) +
      `3. ${derniere}\n` +
      `Le piège : s'arrêter au ${pgcdCherche ? 'PGCD' : 'PPCM'}. Il n'est qu'une étape ; relire ce que la question demande avant de cocher.`,
    difficulte: 3,
  }
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
  produire: (a) => triangleAvecPythagore(a),
}

/**
 * Les deux côtés de l'angle droit étaient donnés : l'aire tombait en une
 * multiplication (difficulté 2). On donne maintenant l'hypoténuse et un seul
 * côté, ou une échelle contre un mur : Pythagore d'abord, le reste ensuite.
 */
function triangleAvecPythagore(a: Alea): QuestionGeneree {
  const echelle = a.chance(0.35)
  // L'échelle reste à taille humaine : 3-4-5, 5-12-13 ou 8-15-17, en mètres.
  const [p, q, h] = a.choix(echelle ? TRIPLETS.filter((t) => t[2] <= 17) : TRIPLETS)
  const k = echelle ? 1 : a.entier(1, 5)
  const [c1, c2, hyp] = [p * k, q * k, h * k]
  const demande = echelle ? 'hauteur' : a.choix(['aire', 'perimetre'] as const)
  const unite = echelle ? 'm' : demande === 'aire' ? 'cm²' : 'cm'
  const aire = (c1 * c2) / 2
  const reponse = demande === 'hauteur' ? c2 : demande === 'aire' ? aire : c1 + c2 + hyp

  const leurres: Leurre[] =
    demande === 'hauteur'
      ? [
          [hyp - c1, 'les longueurs ont été soustraites : Pythagore porte sur les CARRÉS des côtés'],
          [hyp, 'c’est la longueur de l’échelle elle-même'],
          [Math.round(Math.sqrt(hyp * hyp + c1 * c1) * 10) / 10, 'les carrés ont été additionnés : l’échelle est l’hypoténuse, il fallait soustraire'],
        ]
      : demande === 'aire'
        ? [
            [(c1 * hyp) / 2, 'l’hypoténuse a été prise comme hauteur : l’aire se calcule sur les deux côtés de l’angle droit'],
            [c1 * c2, 'la division par 2 a été oubliée : c’est l’aire du rectangle'],
            [c1 * (hyp - c1) / 2, 'le côté manquant a été calculé comme une différence de longueurs, sans les carrés'],
            [c1 + c2 + hyp, 'c’est le périmètre, pas l’aire'],
          ]
        : [
            [c1 + hyp, 'le côté manquant a été oublié : un périmètre compte les trois côtés'],
            [c1 + hyp + (hyp - c1), 'le côté manquant a été calculé comme une différence de longueurs, sans les carrés'],
            [aire, 'c’est l’aire, pas le périmètre'],
            [2 * c1 + hyp, `le côté de ${nombre(c1)} cm a été compté deux fois`],
          ]

  const { options, bonneReponse, diagnostics } = qcm(a, reponse, leurres, (n) => `${nombre(n, Number.isInteger(n) ? 0 : 1)} ${unite}`, { minimum: 1 })
  return {
    section: S,
    skillId: 'tm.calcul.geometrie_plane',
    typeItem: 'qcm',
    enonce: echelle
      ? `Une échelle de ${nombre(hyp)} m est appuyée contre un mur vertical ; son pied est posé à ${nombre(c1)} m du mur. À quelle hauteur le haut de l'échelle touche-t-il le mur ?`
      : `Un triangle rectangle a une hypoténuse de ${nombre(hyp)} cm et un côté de l'angle droit de ${nombre(c1)} cm. ` +
        (demande === 'aire' ? `Quelle est son aire ?` : `Quel est son périmètre ?`),
    options,
    bonneReponse,
    diagnostics,
    rappel: `Côté manquant = √(${nombre(hyp)}² − ${nombre(c1)}²) = ${nombre(c2)}` +
      (demande === 'aire' ? ` ; aire = ${nombre(c1)} × ${nombre(c2)} ÷ 2 = ${nombre(aire)} cm².` : demande === 'perimetre' ? ` ; périmètre = ${nombre(reponse)} cm.` : ' m.'),
    explication:
      `1. Le côté manquant se trouve par Pythagore : hypoténuse² = somme des carrés des deux autres côtés.\n` +
      `2. ${nombre(c2)}² = ${nombre(hyp)}² − ${nombre(c1)}² = ${nombre(hyp * hyp)} − ${nombre(c1 * c1)} = ${nombre(c2 * c2)}, donc le côté vaut ${nombre(c2)}.\n` +
      (demande === 'aire'
        ? `3. Aire : les deux côtés de l'angle droit servent de base et de hauteur, ${nombre(c1)} × ${nombre(c2)} ÷ 2 = ${nombre(aire)} cm².\n`
        : demande === 'perimetre'
          ? `3. Périmètre : ${nombre(c1)} + ${nombre(c2)} + ${nombre(hyp)} = ${nombre(reponse)} cm.\n`
          : `3. Le mur, le sol et l'échelle forment un triangle rectangle dont l'échelle est l'hypoténuse : hauteur ${nombre(c2)} m.\n`) +
      `Le raccourci : c'est le triplet ${p}-${q}-${h}${k > 1 ? ` multiplié par ${k}` : ''}. Le reconnaître évite la racine carrée.`,
    difficulte: 3,
  }
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

    // L'épreuve ne dit presque jamais « sans remise » : elle dit « simultanément »,
    // « d'un coup », « on la met de côté ». Traduire la formule fait partie de la
    // question ; l'écrire en toutes lettres la retirait. Le tirage avec remise
    // revient de temps en temps, pour que la lecture compte vraiment.
    const remise = a.chance(0.25)
    const tirage = remise
      ? a.choix([
          `On tire une boule, on note sa couleur et on la remet dans l'urne, puis on en tire une seconde.`,
          `On tire deux fois une boule, en la replaçant dans l'urne entre les deux tirages.`,
        ])
      : a.choix([
          `On en tire deux successivement, sans remise.`,
          `On en tire deux simultanément.`,
          `On plonge la main dans l'urne et on en prend deux d'un coup.`,
          `On tire une boule, on la met de côté, puis on en tire une seconde.`,
        ])

    const sansRemise: [number, number] = [rouges * (rouges - 1), total * (total - 1)]
    const avecRemise: [number, number] = [rouges * rouges, total * total]
    const [favorables, possibles] = remise ? avecRemise : sansRemise
    const reponse = fraction(favorables, possibles)

    const leurres: LeurreFraction[] = [
      remise
        ? [sansRemise, 'c’est le calcul SANS remise : or la boule est replacée, l’urne est la même au second tirage']
        : [avecRemise, 'c’est le calcul AVEC remise : la première boule n’est plus dans l’urne au second tirage'],
      [[bleues * (bleues - (remise ? 0 : 1)), possibles], 'c’est la probabilité de deux BLEUES'],
      [[rouges, total], 'c’est la probabilité d’une seule boule rouge, au premier tirage'],
      [[2 * rouges * bleues, possibles], 'c’est la probabilité d’obtenir une boule de chaque couleur'],
    ]
    if (!remise) {
      leurres.push(
        [[rouges * (rouges - 1), total * total], 'le numérateur a été ajusté mais pas le dénominateur : il reste une boule de moins dans l’urne aussi'],
        [[rouges - 1, total - 1], 'c’est le second tirage seul, sans le premier'],
      )
    }
    const { options, bonneReponse, diagnostics } = qcmFraction(
      a,
      [favorables, possibles],
      leurres,
      remise ? [possibles] : [possibles, possibles / 2],
      () => [a.entier(1, total - 1), total],
    )

    const second = remise ? `${rouges}/${total}` : `${rouges - 1}/${total - 1}`
    return {
      section: S,
      skillId: probabilites.skillId,
      typeItem: 'qcm',
      enonce:
        `Une urne contient ${rouges} boules rouges et ${bleues} boules bleues. ${tirage} ` +
        `Quelle est la probabilité d'obtenir deux boules rouges ?`,
      options,
      bonneReponse,
      diagnostics,
      rappel: remise
        ? `${rouges}/${total} × ${rouges}/${total} = ${reponse}. Boule remise : l'urne ne change pas.`
        : `${rouges}/${total} × ${rouges - 1}/${total - 1} = ${reponse}. Tirage sans remise : les deux nombres baissent.`,
      explication:
        `1. L'urne contient ${rouges} + ${bleues} = ${total} boules.\n` +
        `2. Premier tirage : ${rouges} boules rouges sur ${total}, soit ${rouges}/${total}.\n` +
        (remise
          ? `3. La boule est remise : au second tirage, l'urne est exactement la même, ${rouges} rouges sur ${total}.\n`
          : `3. La première boule ne revient pas (tirer deux boules d'un coup revient au même) : il reste ${rouges - 1} rouges ` +
            `sur ${total - 1} boules. Les DEUX nombres baissent d'une unité.\n`) +
        `4. Les deux tirages doivent réussir tous les deux, donc on multiplie : ` +
        `${rouges}/${total} × ${second} = ${favorables}/${possibles} = ${reponse}.\n` +
        `Le piège : traduire la phrase du tirage avant de calculer. « Simultanément », « d'un coup », ` +
        `« mise de côté » : sans remise. « Remise », « replacée » : avec remise, et les deux tirages sont identiques.`,
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
        [combinaisons(n, k - 1), `le calcul a porté sur ${k - 1} place${k > 2 ? "s" : ""} au lieu de ${k}`],
        [n * k, 'les deux nombres ont été multipliés entre eux, sans démarche de dénombrement'],
      ],
      (v) => nombre(v),
      { minimum: 1 },
    )

    return {
      section: S,
      skillId: denombrement.skillId,
      typeItem: 'qcm',
      // Ni « places distinctes » ni « sans hiérarchie » : c'est au lecteur de
      // voir si les rôles se distinguent. L'énoncé le dit par la situation.
      enonce: ordonne
        ? a.choix([
            k === 3
              ? `${n} coureurs disputent une course. Combien de podiums différents sont possibles ?`
              : `${n} coureurs disputent une course. Combien de duos (vainqueur, deuxième) différents sont possibles ?`,
            `Une association de ${n} membres élit ${k === 2 ? 'un président et un trésorier' : 'un président, un secrétaire et un trésorier'}, ` +
              `qui doivent être des personnes différentes. Combien de bureaux différents peut-on former ?`,
            `${n} candidats passent un concours. Combien de classements différents des ${k} premiers sont possibles ?`,
          ])
        : a.choix([
            `Un club de ${n} membres doit désigner une commission de ${k} personnes. Combien de commissions différentes peut-on former ?`,
            `Parmi ${n} salariés, on en choisit ${k} pour représenter l'entreprise à un salon. Combien de groupes différents sont possibles ?`,
            `Combien de façons y a-t-il de choisir ${k} copies parmi ${n} pour une double correction ?`,
          ]),
      options,
      bonneReponse,
      diagnostics,
      rappel: ordonne
        ? `Rôles distincts → l'ordre compte : ${produit} = ${nombre(reponse)}.`
        : `Même rôle pour tous → l'ordre ne compte pas : (${produit}) ÷ ${k}! = ${nombre(reponse)}.`,
      explication:
        `1. La seule question à se poser : est-ce que changer l'ordre change le résultat ?\n` +
        (ordonne
          ? `   Ici oui — ${k} rôles distincts : échanger deux personnes donne un autre résultat. On compte des ARRANGEMENTS.\n` +
            `2. On remplit les places une par une : ${n} candidats pour la première, ` +
            `${n - 1} pour la deuxième${k > 2 ? `, ${n - 2} pour la troisième` : ''}.\n` +
            `3. ${produit} = ${nombre(reponse)}.\n` +
            `Le piège inverse : si les ${k} places n'étaient pas distinctes, il faudrait diviser par ` +
            `${k}! = ${factorielle} = ${nombre(arrangements(n, k) / combinaisons(n, k))}, ` +
            `et on trouverait ${nombre(combinaisons(n, k))}.`
          : `   Ici non — les ${k} personnes retenues jouent toutes le même rôle : nommées dans un autre ordre, ` +
            `elles forment le même groupe. On compte des COMBINAISONS.\n` +
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
    const n = a.entier(12, 30)
    const chercheSomme = a.chance(0.5)

    const un = u1 + (n - 1) * r
    const somme = (n * (u1 + un)) / 2
    const reponse = chercheSomme ? somme : un
    // Le terme de rang n à partir du premier se lisait d'une formule
    // (difficulté 2). On donne maintenant deux termes intermédiaires : il
    // faut retrouver le pas, puis repartir du bon rang.
    const i = a.entier(2, 4)
    const j = i + a.entier(3, 6)
    const [ui, uj] = [u1 + (i - 1) * r, u1 + (j - 1) * r]

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
            [ui + (n - 1) * r, `les ${n - 1} pas ont été comptés depuis le ${i}ᵉ terme comme s’il était le premier`],
            [Math.round(ui + (n - i) * ((uj - ui) / (j - i + 1))), `le pas a été calculé sur ${j - i + 1} intervalles au lieu de ${j - i}`],
            [Math.round((uj * n) / j), 'règle de trois sur les rangs : une progression arithmétique n’est pas proportionnelle'],
            [un + r, 'un pas de trop : c’est le terme suivant'],
          ],
      (v) => nombre(v),
      { minimum: 0 },
    )

    return {
      section: S,
      skillId: suites.skillId,
      typeItem: 'qcm',
      // Aucune « suite » dans l'énoncé : une situation qui avance d'un pas
      // constant, qu'il faut reconnaître, et dont il faut compter les pas.
      enonce: a.choix(
        chercheSomme
          ? [
              `Dans un amphithéâtre, la 1ʳᵉ rangée compte ${nombre(u1)} sièges, et chaque rangée en compte ${nombre(r)} de plus que la précédente. Combien de sièges compte l'amphithéâtre, qui a ${n} rangées ?`,
              `Pour préparer une course, une coureuse parcourt ${nombre(u1)} km la 1ʳᵉ semaine, puis ${nombre(r)} km de plus chaque semaine que la précédente. Combien de kilomètres a-t-elle parcourus en tout au bout de ${n} semaines ?`,
              `Un salarié met de côté ${nombre(u1)} € le 1ᵉʳ mois, puis chaque mois ${nombre(r)} € de plus que le mois précédent. Quelle somme a-t-il épargnée au total au bout de ${n} mois ?`,
            ]
          : // Ni premier terme ni pas : seulement deux rangs intermédiaires.
            [
              `Dans un amphithéâtre, chaque rangée compte le même nombre de sièges de plus que la précédente. La ${i}ᵉ rangée en compte ${nombre(ui)} et la ${j}ᵉ ${nombre(uj)}. Combien de sièges compte la ${n}ᵉ rangée ?`,
              `Pour préparer une course, une coureuse ajoute chaque semaine la même distance à celle de la semaine précédente. La ${i}ᵉ semaine, elle parcourt ${nombre(ui)} km, et la ${j}ᵉ ${nombre(uj)} km. Combien de kilomètres parcourt-elle la ${n}ᵉ semaine ?`,
              `Un salarié met de côté chaque mois la même somme de plus que le mois précédent. Le ${i}ᵉ mois, il met ${nombre(ui)} € de côté, et le ${j}ᵉ ${nombre(uj)} €. Combien met-il de côté le ${n}ᵉ mois ?`,
            ],
      ),
      options,
      bonneReponse,
      diagnostics,
      rappel: chercheSomme
        ? `u${n} = ${nombre(un)}, puis ${n} × (${nombre(u1)} + ${nombre(un)}) ÷ 2 = ${nombre(somme)}.`
        : `Pas = (${nombre(uj)} − ${nombre(ui)}) ÷ ${j - i} = ${nombre(r)} ; u${n} = ${nombre(ui)} + ${n - i} × ${nombre(r)} = ${nombre(un)}.`,
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
          : `3. Ici le premier terme n'est pas donné : entre le ${i}ᵉ et le ${j}ᵉ, il y a ${j - i} pas, donc ` +
            `r = (${nombre(uj)} − ${nombre(ui)}) ÷ ${j - i} = ${nombre(r)}.\n` +
            `4. Du ${i}ᵉ au ${n}ᵉ terme, ${n - i} pas : ${nombre(ui)} + ${n - i} × ${nombre(r)} = ${nombre(un)}.\n` +
            `Le piège : compter ${j - i + 1} intervalles entre le ${i}ᵉ et le ${j}ᵉ terme. Entre deux rangs, il y a leur différence de pas, pas un de plus.`),
      difficulte: 3,
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
  // Les problèmes rédigés en plusieurs étapes, au niveau des annales
  // (calcul-problemes.ts) : 53 % de réussite sur les annales contre 71 %.
  ...FAMILLES_PROBLEMES,
  // Les questions à une idée relevées sur une épreuve blanche (calcul-idees.ts).
  ...FAMILLES_IDEES,
]
