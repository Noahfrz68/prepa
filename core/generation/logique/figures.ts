/**
 * Les familles dessinées : cases barrées, matrices, suites et intrus figurés.
 *
 * C'est la moitié du sous-test réel, et c'est celle qu'aucune version textuelle
 * ne peut restituer : la question EST le dessin. On en fabrique donc par
 * centaines, avec la même grammaire visuelle que l'épreuve — trois cases de
 * référence au-dessus, cinq propositions dessinées en dessous.
 *
 * Toute règle posée ici est vérifiable à l'œil en moins de vingt secondes, et
 * une seule proposition la satisfait. Ce second point est le plus coûteux à
 * garantir : chaque famille écarte explicitement les leurres qui vérifieraient
 * la règle par accident.
 */

import type { Famille } from '../types'
import { nombre } from '../alea'
import type { Case, Forme } from '@/core/figures/types'
import {
  ALPHABET,
  COINS,
  COTES,
  FORMES,
  lettre,
  qcmFigure,
  rang,
  sommeChiffres,
  tournerCoin,
  type CoinFigure,
} from './outils'

const S = 'logique' as const

const VOYELLES = ['A', 'E', 'I', 'O', 'U', 'Y']
const CONSONNES = ALPHABET.split('').filter((c) => !VOYELLES.includes(c))

const NOM_COIN: Record<CoinFigure, string> = {
  hg: 'en haut à gauche',
  hd: 'en haut à droite',
  bd: 'en bas à droite',
  bg: 'en bas à gauche',
}

/* ------------------------------------------------------- cases barrées -- */

type Quartier = 'h' | 'g' | 'd' | 'b'
const QUARTIERS: Quartier[] = ['h', 'g', 'd', 'b']

interface RegleCase {
  /** Comment on la dit, une fois trouvée. */
  enonce: string
  /** Par quoi commencer pour la trouver. */
  methode: string
  /** Fabrique une case conforme. */
  conforme(a: import('../alea').Alea): { n1: number; n2: number; l: string }
  /** Vérifie une case. */
  test(n1: number, n2: number, l: string): boolean
}

function regleCase(a: import('../alea').Alea): RegleCase {
  const genre = a.entier(0, 2)

  if (genre === 0) {
    // La règle de l'annale : même somme de chiffres, et une voyelle.
    return {
      enonce:
        'les chiffres des deux nombres donnent la même somme, et la lettre est une voyelle',
      methode:
        'deux nombres et une lettre : on teste d’abord la SOMME DES CHIFFRES des nombres, puis le caractère de la lettre (voyelle ou consonne)',
      conforme(al) {
        const s = al.entier(4, 13)
        const tirer = () => {
          const pool: number[] = []
          for (let n = 10; n <= 99; n++) if (sommeChiffres(n) === s) pool.push(n)
          return al.choix(pool)
        }
        const n1 = tirer()
        let n2 = tirer()
        for (let i = 0; i < 12 && n2 === n1; i++) n2 = tirer()
        return { n1, n2, l: al.choix(VOYELLES) }
      },
      test: (n1, n2, l) => sommeChiffres(n1) === sommeChiffres(n2) && VOYELLES.includes(l),
    }
  }

  if (genre === 1) {
    // Le rang de la lettre est la différence des deux nombres.
    return {
      enonce: 'le rang de la lettre est exactement la différence des deux nombres',
      methode:
        'quand une lettre côtoie des nombres, on convertit la lettre en rang (A = 1, … Z = 26) et on la compare à la somme, à la différence, puis au produit des nombres',
      conforme(al) {
        const ecart = al.entier(2, 20)
        const n2 = al.entier(11, 60)
        return { n1: n2 + ecart, n2, l: lettre(ecart) }
      },
      test: (n1, n2, l) => Math.abs(n1 - n2) === rang(l),
    }
  }

  // Les deux nombres sont des multiples du rang de la lettre.
  const m = a.entier(3, 9)
  return {
    enonce: `les deux nombres sont des multiples de ${m}, et la lettre est une consonne`,
    methode:
      'on cherche un diviseur commun aux deux nombres avant toute chose : c’est la règle la plus fréquente sur une case barrée',
    conforme(al) {
      const n1 = m * al.entier(3, 12)
      let n2 = m * al.entier(3, 12)
      for (let i = 0; i < 12 && n2 === n1; i++) n2 = m * al.entier(3, 12)
      return { n1, n2, l: al.choix(CONSONNES) }
    },
    test: (n1, n2, l) => n1 % m === 0 && n2 % m === 0 && CONSONNES.includes(l),
  }
}

const casesBarrees: Famille = {
  skillId: 'tm.logique.cases_barrees',
  nom: 'case barrée',
  produire(a) {
    const regle = regleCase(a)

    /** Pose deux nombres et une lettre dans trois quartiers sur quatre. */
    const poser = (n1: number, n2: number, l: string): Case => {
      const places = a.melanger(QUARTIERS).slice(0, 3)
      const q: Partial<Record<Quartier, string>> = {}
      q[places[0]] = nombre(n1)
      q[places[1]] = nombre(n2)
      q[places[2]] = l
      return { quartiers: q }
    }

    const references = Array.from({ length: 3 }, () => {
      const c = regle.conforme(a)
      return poser(c.n1, c.n2, c.l)
    })

    const bonne = regle.conforme(a)
    const caseBonne = poser(bonne.n1, bonne.n2, bonne.l)

    /** Un leurre : conforme sur un point, faux sur l'autre. */
    const leurres: Array<[Case, string]> = []

    // Bons nombres, mauvaise lettre.
    {
      const c = regle.conforme(a)
      let l = ALPHABET[a.entier(0, 25)]
      for (let i = 0; i < 40 && regle.test(c.n1, c.n2, l); i++) l = ALPHABET[a.entier(0, 25)]
      if (!regle.test(c.n1, c.n2, l)) {
        leurres.push([poser(c.n1, c.n2, l), 'les deux nombres conviennent, mais pas la lettre'])
      }
    }

    // Bonne lettre, mauvais nombres.
    {
      const c = regle.conforme(a)
      let n2 = a.entier(11, 99)
      for (let i = 0; i < 40 && regle.test(c.n1, n2, c.l); i++) n2 = a.entier(11, 99)
      if (!regle.test(c.n1, n2, c.l)) {
        leurres.push([poser(c.n1, n2, c.l), 'la lettre convient, mais pas la relation entre les nombres'])
      }
    }

    // Rien ne va.
    for (let essai = 0; essai < 60 && leurres.length < 4; essai++) {
      const n1 = a.entier(11, 99)
      const n2 = a.entier(11, 99)
      const l = ALPHABET[a.entier(0, 25)]
      if (regle.test(n1, n2, l) || n1 === n2) continue
      leurres.push([poser(n1, n2, l), 'ni la relation entre les nombres ni la lettre ne conviennent'])
    }

    const { options, optionsFigure, bonneReponse, diagnostics } = qcmFigure(a, caseBonne, leurres, () => {
      const n1 = a.entier(11, 99)
      const n2 = a.entier(11, 99)
      const l = ALPHABET[a.entier(0, 25)]
      return regle.test(n1, n2, l) ? poser(n1, n2, lettre(rang(l) + 1)) : poser(n1, n2, l)
    })

    return {
      section: S,
      skillId: casesBarrees.skillId,
      typeItem: 'qcm',
      enonce:
        'Les trois cases du haut obéissent à une même règle.\n' +
        'Laquelle des cinq propositions obéit à la même règle ?',
      figure: { type: 'bande', cases: references },
      options,
      optionsFigure,
      bonneReponse,
      diagnostics,
      rappel: `Règle : ${regle.enonce}.`,
      explication:
        `1. Sur une case barrée, il n'y a jamais de progression à lire : les trois cases du haut ` +
        `sont trois EXEMPLES d'une même règle, pas une suite. Le geste est donc de trouver ce ` +
        `qu'elles partagent, puis de tester les cinq propositions une à une.\n` +
        `2. ${regle.methode}.\n` +
        `3. La règle est ici : ${regle.enonce}.\n` +
        `4. Une seule proposition la vérifie entièrement. Les autres n'en satisfont qu'une moitié — ` +
        `c'est le piège de la famille : une case qui « ressemble » suffit rarement.\n` +
        `Astuce de temps : ne jamais tester les cinq propositions sur la règle complète. On teste ` +
        `d'abord la moitié la plus rapide à vérifier (la lettre, presque toujours), ce qui élimine ` +
        `deux ou trois propositions en cinq secondes.`,
      difficulte: 4,
    }
  },
}

/* --------------------------------------------------- matrices de figures -- */

const matricesDeFigures: Famille = {
  skillId: 'tm.logique.matrices_de_figures',
  nom: 'matrice de figures',
  produire(a) {
    // Deux attributs indépendants : la forme suit la colonne, le nombre de
    // pastilles suit la rangée. C'est la structure de matrice la plus
    // fréquente, et la seule qui se vérifie entièrement à l'œil.
    const formes = a.melanger(FORMES).slice(0, 3)
    const pastillesParRangee = a.melanger([0, 1, 2])

    const cellule = (i: number, j: number): Case => ({
      forme: formes[j],
      pastilles: COINS.slice(0, pastillesParRangee[i]) as Case['pastilles'],
    })

    const lignes: Case[][] = [0, 1, 2].map((i) =>
      [0, 1, 2].map((j) => (i === 2 && j === 2 ? { inconnue: true } : cellule(i, j))),
    )

    const bonne = cellule(2, 2)
    const nBonne = pastillesParRangee[2]

    const leurres: Array<[Case, string]> = [
      [
        { forme: formes[a.choix([0, 1])], pastilles: COINS.slice(0, nBonne) as Case['pastilles'] },
        'le nombre de points est juste, mais la forme est celle d’une autre colonne',
      ],
      [
        {
          forme: formes[2],
          pastilles: COINS.slice(0, pastillesParRangee[a.choix([0, 1])]) as Case['pastilles'],
        },
        'la forme est juste, mais le nombre de points est celui d’une autre rangée',
      ],
      [
        { forme: formes[2], pastilles: COINS.slice(0, (nBonne + 1) % 4) as Case['pastilles'] },
        'un point de trop : la rangée en demande exactement ' + nBonne,
      ],
      [
        { forme: a.choix(FORMES.filter((f) => !formes.includes(f))), pastilles: COINS.slice(0, nBonne) as Case['pastilles'] },
        'cette forme n’apparaît nulle part dans la matrice',
      ],
      [
        { forme: formes[0], pastilles: COINS.slice(0, pastillesParRangee[0]) as Case['pastilles'] },
        'c’est la case en haut à gauche, recopiée telle quelle',
      ],
    ]

    const { options, optionsFigure, bonneReponse, diagnostics } = qcmFigure(a, bonne, leurres, () => ({
      forme: a.choix(FORMES),
      pastilles: COINS.slice(0, a.entier(0, 3)) as Case['pastilles'],
    }))

    return {
      section: S,
      skillId: matricesDeFigures.skillId,
      typeItem: 'qcm',
      enonce: 'Quelle figure complète la matrice ?',
      figure: { type: 'matrice', lignes },
      options,
      optionsFigure,
      bonneReponse,
      diagnostics,
      rappel: 'La forme est donnée par la colonne, le nombre de points par la rangée.',
      explication:
        `1. Une matrice ne se lit pas comme une image : on la DÉCOMPOSE en attributs. Ici il y en ` +
        `a deux — la forme, et le nombre de petits ronds. On les traite séparément, jamais ensemble.\n` +
        `2. Attribut « forme » : il est constant dans chaque COLONNE. La troisième colonne porte ` +
        `partout la même forme, donc la case manquante aussi.\n` +
        `3. Attribut « nombre de points » : il est constant dans chaque RANGÉE. La dernière rangée ` +
        `en porte ${nBonne}, donc la case manquante aussi.\n` +
        `4. On recompose : la forme de la 3ᵉ colonne, avec ${nBonne} point${nBonne > 1 ? 's' : ''}.\n` +
        `Méthode d'élimination, et c'est elle qui fait gagner du temps : on prend l'attribut le ` +
        `plus rapide à lire (le nombre de points), on élimine toutes les propositions qui s'y ` +
        `trompent, et on ne regarde la forme que sur celles qui restent. Deux passes de cinq ` +
        `secondes valent mieux qu'une comparaison globale d'une minute.`,
      difficulte: 3,
    }
  },
}

/* ---------------------------------------------------- suites de figures -- */

const suitesDeFigures: Famille = {
  skillId: 'tm.logique.suites_de_figures',
  nom: 'suite de figures',
  produire(a) {
    const genre = a.entier(0, 1)

    if (genre === 0) {
      // Le nombre de côtés change d'un cran à chaque case, dans un sens ou dans
      // l'autre. Le tirage de la forme parmi celles qui ont ce nombre de côtés
      // n'est pas un détail : carré et losange en ont quatre tous les deux, et
      // sans ce tirage la famille ne produirait que deux suites identiques,
      // écartées ensuite comme doublons.
      const sens = a.choix([1, -1])
      const depart = sens > 0 ? a.entier(3, 4) : a.entier(7, 8)
      const suite: Forme[] = []
      for (let i = 0; i < 5; i++) {
        const cotes = depart + i * sens
        const possibles = FORMES.filter((f) => COTES[f] === cotes)
        if (possibles.length === 0) throw new Error(`Aucune forme à ${cotes} côtés.`)
        suite.push(a.choix(possibles))
      }

      const visibles = suite.slice(0, 4)
      const bonne: Case = { forme: suite[4] }
      const cotesBonne = COTES[suite[4]]

      const leurres: Array<[Case, string]> = [
        [{ forme: suite[3] }, 'la figure précédente, recopiée : la suite n’a pas avancé'],
        [{ forme: suite[2] }, 'deux crans en arrière dans la suite'],
        [
          { forme: a.choix(FORMES.filter((f) => COTES[f] === 0)) },
          'une figure ronde : elle n’a pas de côtés, donc elle sort de la règle',
        ],
        [
          {
            forme: a.choix(
              FORMES.filter((f) => COTES[f] > 0 && Math.abs(COTES[f] - cotesBonne) > 1),
            ),
          },
          'le compte de côtés est trop loin : la suite change d’UN côté à la fois',
        ],
      ]

      const { options, optionsFigure, bonneReponse, diagnostics } = qcmFigure(a, bonne, leurres, () => ({
        forme: a.choix(FORMES),
      }))

      return {
        section: S,
        skillId: suitesDeFigures.skillId,
        typeItem: 'qcm',
        enonce: 'Quelle figure continue la suite ?',
        figure: { type: 'bande', cases: [...visibles.map((f) => ({ forme: f })), { inconnue: true }] },
        options,
        optionsFigure,
        bonneReponse,
        diagnostics,
        rappel: `Le nombre de côtés ${sens > 0 ? 'augmente' : 'diminue'} de 1 à chaque case : ${depart}, ${depart + sens}, … → ${cotesBonne}.`,
        explication:
          `1. Sur une suite de figures, le premier réflexe est de COMPTER, pas de regarder. ` +
          `On compte les côtés de chaque figure et on écrit les nombres sous la suite : ` +
          `${visibles.map((f) => COTES[f]).join(', ')}, ?\n` +
          `2. La suite des nombres est alors une suite ordinaire, et on lui applique la méthode ` +
          `des écarts : ici ils valent tous +1.\n` +
          `3. La figure cherchée a donc ${cotesBonne} côtés.\n` +
          `4. Une seule proposition les a.\n` +
          `Les attributs qui progressent dans cette famille, par ordre de fréquence : nombre de ` +
          `côtés — nombre de points ou de traits — orientation (quarts de tour) — remplissage. ` +
          `Les tester dans cet ordre évite de rester bloqué sur l'allure générale du dessin.`,
        difficulte: 3,
      }
    }

    // Une pastille qui tourne d'un coin au suivant.
    const forme = a.choix(FORMES)
    const depart = a.choix(COINS)
    const sens = a.choix([1, -1])
    const suite = [0, 1, 2, 3, 4].map((i) => tournerCoin(depart, i * sens))

    const visibles = suite.slice(0, 4)
    const bonne: Case = { forme, pastilles: [suite[4]] }

    const leurres: Array<[Case, string]> = [
      [{ forme, pastilles: [suite[3]] }, 'le point n’a pas bougé : la suite n’a pas avancé'],
      [
        { forme, pastilles: [tournerCoin(suite[4], sens)] },
        'un cran de trop : le point a tourné deux fois',
      ],
      [
        { forme, pastilles: [tournerCoin(suite[4], -2 * sens)] },
        `le point a tourné dans le mauvais sens`,
      ],
      [
        { forme: a.choix(FORMES.filter((f) => f !== forme)), pastilles: [suite[4]] },
        'le point est bien placé, mais la forme a changé — or elle est constante dans toute la suite',
      ],
    ]

    const { options, optionsFigure, bonneReponse, diagnostics } = qcmFigure(a, bonne, leurres, () => ({
      forme: a.choix(FORMES),
      pastilles: [a.choix(COINS)],
    }))

    return {
      section: S,
      skillId: suitesDeFigures.skillId,
      typeItem: 'qcm',
      enonce: 'Quelle figure continue la suite ?',
      figure: {
        type: 'bande',
        cases: [...visibles.map((c) => ({ forme, pastilles: [c] })), { inconnue: true }],
      },
      options,
      optionsFigure,
      bonneReponse,
      diagnostics,
      rappel: `La forme ne change pas ; le point avance d’un coin ${sens > 0 ? 'dans le sens des aiguilles' : 'dans le sens inverse des aiguilles'} à chaque case → ${NOM_COIN[suite[4]]}.`,
      explication:
        `1. Deux attributs à séparer : la FORME et la POSITION du point. On les regarde l'un après ` +
        `l'autre, jamais ensemble.\n` +
        `2. La forme est la même dans les quatre cases visibles : elle ne porte aucune règle, ` +
        `elle sert seulement à rendre les propositions crédibles. On l'écarte tout de suite.\n` +
        `3. Le point, lui, se déplace : ${visibles.map((c) => NOM_COIN[c]).join(' → ')}. ` +
        `Il avance d'un coin ${sens > 0 ? 'dans le sens des aiguilles d’une montre' : 'dans le sens inverse des aiguilles'} ` +
        `à chaque case.\n` +
        `4. La case suivante porte donc le point ${NOM_COIN[suite[4]]}.\n` +
        `Le piège de cette famille est le SENS de rotation. Le fixer une bonne fois en regardant ` +
        `les deux premières cases, et l'écrire en marge (↻ ou ↺), évite de le perdre en route.`,
      difficulte: 3,
    }
  },
}

/* ------------------------------------------------ rotations et symétries -- */

const rotationsEtSymetries: Famille = {
  skillId: 'tm.logique.rotations_et_symetries',
  nom: 'rotation de figure',
  produire(a) {
    const quarts = a.choix([1, 2, 3])
    const forme = a.choix(FORMES.filter((f) => COTES[f] > 0))
    const forme2 = a.choix(FORMES.filter((f) => COTES[f] > 0 && f !== forme))
    const coinA = a.choix(COINS)
    const coinC = a.choix(COINS)

    const caseA: Case = { forme, pastilles: [coinA] }
    const caseB: Case = { forme, pastilles: [tournerCoin(coinA, quarts)] }
    const caseC: Case = { forme: forme2, pastilles: [coinC] }
    const bonne: Case = { forme: forme2, pastilles: [tournerCoin(coinC, quarts)] }

    const leurres: Array<[Case, string]> = [
      [
        { forme: forme2, pastilles: [tournerCoin(coinC, -quarts)] },
        `la rotation a été appliquée dans le mauvais sens`,
      ],
      [caseC, 'la figure de départ recopiée : aucune rotation appliquée'],
      [
        { forme: forme2, pastilles: [tournerCoin(coinC, quarts + 1)] },
        'un quart de tour de trop',
      ],
      [
        { forme, pastilles: [tournerCoin(coinC, quarts)] },
        'le point est bien placé, mais c’est la forme du PREMIER couple qui a été reprise',
      ],
    ]

    const { options, optionsFigure, bonneReponse, diagnostics } = qcmFigure(a, bonne, leurres, () => ({
      forme: a.choix(FORMES),
      pastilles: [a.choix(COINS)],
    }))

    return {
      section: S,
      skillId: rotationsEtSymetries.skillId,
      typeItem: 'qcm',
      enonce: 'La première figure devient la deuxième. Que devient la troisième ?',
      figure: { type: 'analogie', a: caseA, b: caseB, c: caseC },
      options,
      optionsFigure,
      bonneReponse,
      diagnostics,
      rappel: `Rotation de ${quarts * 90}° dans le sens des aiguilles : le point passe ${NOM_COIN[coinC]} → ${NOM_COIN[tournerCoin(coinC, quarts)]}.`,
      explication:
        `1. On NOMME la transformation avant de regarder les propositions. Le premier couple ` +
        `montre un point qui passe de ${NOM_COIN[coinA]} à ${NOM_COIN[tournerCoin(coinA, quarts)]} : ` +
        `c'est une rotation de ${quarts * 90}° dans le sens des aiguilles d'une montre.\n` +
        `2. Vérification de ce qui NE change pas : la forme reste la même entre les deux premières ` +
        `figures. La transformation ne touche donc que la position du point.\n` +
        `3. On applique la même chose au second couple : le point part de ${NOM_COIN[coinC]} ` +
        `et arrive ${NOM_COIN[tournerCoin(coinC, quarts)]}. La forme, elle, est conservée : ` +
        `c'est celle de la troisième case, pas celle de la première.\n` +
        `4. Une seule proposition combine les deux.\n` +
        `Rotation ou symétrie ? Le test qui tranche en trois secondes : une rotation conserve le ` +
        `sens de lecture (horaire reste horaire), une symétrie l'inverse comme un miroir. ` +
        `Les confondre est l'erreur numéro un de cette famille.`,
      difficulte: 4,
    }
  },
}

/* ------------------------------------------------------- intrus figuré -- */

const intrusFigure: Famille = {
  skillId: 'tm.logique.intrus_figure',
  nom: 'intrus figuré',
  produire(a) {
    const genre = a.entier(0, 1)

    if (genre === 0) {
      // Quatre figures à nombre de côtés pair, une impaire.
      const paires = FORMES.filter((f) => COTES[f] > 0 && COTES[f] % 2 === 0)
      const impaires = FORMES.filter((f) => COTES[f] > 0 && COTES[f] % 2 === 1)
      if (paires.length < 4 || impaires.length === 0) throw new Error('Pas assez de formes.')
      const conformes = a.melanger(paires).slice(0, 4)
      const bonne: Case = { forme: a.choix(impaires) }

      const leurres: Array<[Case, string]> = conformes.map((f) => [
        { forme: f },
        `${COTES[f]} côtés : un nombre pair, la règle est respectée`,
      ])

      const { options, optionsFigure, bonneReponse, diagnostics } = qcmFigure(a, bonne, leurres)
      return {
        section: S,
        skillId: intrusFigure.skillId,
        typeItem: 'qcm',
        enonce: 'Parmi ces cinq figures, laquelle est l’intrus ?',
        figure: { type: 'bande', cases: optionsFigure },
        options,
        optionsFigure,
        bonneReponse,
        diagnostics,
        rappel: 'Quatre figures ont un nombre PAIR de côtés ; une seule en a un nombre impair.',
        explication:
          `1. Comme pour l'intrus numérique : on cherche la règle que QUATRE figures partagent, ` +
          `jamais ce qui cloche dans une seule. Sur un dessin, chercher l'anomalie mène toujours ` +
          `quelque part — et presque toujours au mauvais endroit.\n` +
          `2. L'ordre de test sur des figures : nombre de côtés — parité de ce nombre — présence ` +
          `d'un axe de symétrie — nombre de points ou de traits — orientation. Cinq essais.\n` +
          `3. Ici c'est le deuxième qui répond : ` +
          `${conformes.map((f) => `${COTES[f]} côtés`).join(', ')} — que des nombres pairs.\n` +
          `4. La cinquième figure en a un nombre impair : c'est l'intrus.\n` +
          `Compter les côtés se fait au crayon sur le sujet, pas de tête. Deux secondes de plus, ` +
          `et plus aucune erreur de comptage.`,
        difficulte: 2,
      }
    }

    // Quatre figures portant une pastille au même coin, une au mauvais coin.
    const coin = a.choix(COINS)
    const autres = COINS.filter((c) => c !== coin)
    const formes = a.melanger(FORMES).slice(0, 5)
    const bonne: Case = { forme: formes[4], pastilles: [a.choix(autres)] }

    const leurres: Array<[Case, string]> = formes
      .slice(0, 4)
      .map((f) => [
        { forme: f, pastilles: [coin] } as Case,
        `son point est ${NOM_COIN[coin]}, comme les autres : la règle est respectée`,
      ])

    const { options, optionsFigure, bonneReponse, diagnostics } = qcmFigure(a, bonne, leurres)

    return {
      section: S,
      skillId: intrusFigure.skillId,
      typeItem: 'qcm',
      enonce: 'Parmi ces cinq figures, laquelle est l’intrus ?',
      figure: { type: 'bande', cases: optionsFigure },
      options,
      optionsFigure,
      bonneReponse,
      diagnostics,
      rappel: `Quatre figures portent leur point ${NOM_COIN[coin]} ; une seule ailleurs.`,
      explication:
        `1. Cinq formes toutes différentes : la forme ne peut donc PAS être la règle. C'est une ` +
        `déduction, pas une impression — un attribut qui varie partout ne sépare rien, et on ` +
        `l'écarte immédiatement.\n` +
        `2. Reste ce que les figures ont en commun : la position du point.\n` +
        `3. Quatre d'entre elles le portent ${NOM_COIN[coin]}.\n` +
        `4. La cinquième le porte ailleurs : c'est l'intrus.\n` +
        `Le réflexe qui économise le plus de temps sur cette famille : commencer par repérer ` +
        `l'attribut qui varie sur les cinq figures, et l'éliminer. Ce qui reste est forcément ` +
        `la règle.`,
      difficulte: 3,
    }
  },
}

/* --------------------------------------------------- analogies figurées -- */

const analogiesDeFigures: Famille = {
  skillId: 'tm.logique.analogies_de_figures',
  nom: 'analogie figurée',
  produire(a) {
    // La transformation ajoute une lettre à l'intérieur de la figure et change
    // le nombre de points : deux attributs à transporter, pas un.
    const formeA = a.choix(FORMES)
    const formeC = a.choix(FORMES.filter((f) => f !== formeA))
    const l1 = ALPHABET[a.entier(0, 25)]
    const l2 = ALPHABET[a.entier(0, 25)]
    const pas = a.choix([1, 2, 3])
    const nPoints = a.entier(1, 2)

    const caseA: Case = { forme: formeA, lettre: l1, pastilles: COINS.slice(0, nPoints) as Case['pastilles'] }
    const caseB: Case = {
      forme: formeA,
      lettre: lettre(rang(l1) + pas),
      pastilles: COINS.slice(0, nPoints + 1) as Case['pastilles'],
    }
    const caseC: Case = { forme: formeC, lettre: l2, pastilles: COINS.slice(0, nPoints) as Case['pastilles'] }
    const bonne: Case = {
      forme: formeC,
      lettre: lettre(rang(l2) + pas),
      pastilles: COINS.slice(0, nPoints + 1) as Case['pastilles'],
    }

    const leurres: Array<[Case, string]> = [
      [
        { forme: formeC, lettre: lettre(rang(l2) + pas), pastilles: COINS.slice(0, nPoints) as Case['pastilles'] },
        'la lettre a bien avancé, mais le point supplémentaire a été oublié',
      ],
      [
        { forme: formeC, lettre: l2, pastilles: COINS.slice(0, nPoints + 1) as Case['pastilles'] },
        'le point a été ajouté, mais la lettre n’a pas avancé',
      ],
      [
        { forme: formeC, lettre: lettre(rang(l2) - pas), pastilles: COINS.slice(0, nPoints + 1) as Case['pastilles'] },
        'la lettre a reculé au lieu d’avancer',
      ],
      [
        { forme: formeA, lettre: lettre(rang(l2) + pas), pastilles: COINS.slice(0, nPoints + 1) as Case['pastilles'] },
        'la forme du PREMIER couple a été reprise : or la transformation ne change pas la forme',
      ],
    ]

    const { options, optionsFigure, bonneReponse, diagnostics } = qcmFigure(a, bonne, leurres, () => ({
      forme: a.choix(FORMES),
      lettre: ALPHABET[a.entier(0, 25)],
      pastilles: COINS.slice(0, a.entier(0, 3)) as Case['pastilles'],
    }))

    return {
      section: S,
      skillId: analogiesDeFigures.skillId,
      typeItem: 'qcm',
      enonce: 'La première figure devient la deuxième. Que devient la troisième ?',
      figure: { type: 'analogie', a: caseA, b: caseB, c: caseC },
      options,
      optionsFigure,
      bonneReponse,
      diagnostics,
      rappel: `La lettre avance de ${pas} rang${pas > 1 ? 's' : ''} et un point s’ajoute ; la forme ne change pas.`,
      explication:
        `1. Une analogie figurée se décompose en attributs, exactement comme une matrice. Il y en ` +
        `a trois ici : la forme, la lettre, le nombre de points. On regarde ce que chacun devient, ` +
        `séparément.\n` +
        `2. La forme : ${formeA} → ${formeA}. Elle NE CHANGE PAS. C'est une information à part ` +
        `entière — elle dit que la figure d'arrivée garde la forme de sa figure de départ, donc ` +
        `celle de la troisième case, et non celle de la première.\n` +
        `3. La lettre : ${l1} (${rang(l1)}) → ${lettre(rang(l1) + pas)} (${rang(lettre(rang(l1) + pas))}). ` +
        `Elle avance de ${pas} rang${pas > 1 ? 's' : ''}.\n` +
        `4. Les points : ${nPoints} → ${nPoints + 1}. Il s'en ajoute un.\n` +
        `5. On applique les trois au second couple : même forme que la troisième case, ` +
        `${l2} devient ${lettre(rang(l2) + pas)}, et un point de plus.\n` +
        `L'erreur la plus coûteuse est d'oublier un attribut. Les compter AVANT de regarder les ` +
        `propositions — « il y a trois choses qui peuvent changer » — force à toutes les vérifier.`,
      difficulte: 4,
    }
  },
}

export const FAMILLES_FIGURES: Famille[] = [
  casesBarrees,
  matricesDeFigures,
  suitesDeFigures,
  rotationsEtSymetries,
  intrusFigure,
  analogiesDeFigures,
]
