/**
 * Les familles qui se lisent de gauche à droite : suites, intrus, opérations.
 *
 * Elles s'affichent en bande — une rangée de cases, comme à l'épreuve — plutôt
 * qu'en ligne de texte. La différence n'est pas cosmétique : sur une bande, on
 * écrit les écarts SOUS les cases, et ce geste est toute la méthode.
 */

import type { Famille } from '../types'
import { qcmTexte, type LeurreTexte } from '../qcm'
import { nombre } from '../alea'
import type { Case } from '@/core/figures/types'
import {
  ALPHABET,
  enRangs,
  estPremier,
  groupeAleatoire,
  lettre,
  rang,
  rangee,
  sommeChiffres,
  texte,
} from './outils'

const S = 'logique' as const

/* ---------------------------------------------------- suites numériques -- */

const suitesNumeriques: Famille = {
  skillId: 'tm.logique.suites_numeriques',
  nom: 'suite numérique',
  produire(a) {
    const genre = a.entier(0, 5)
    const u0 = a.entier(2, 15)
    let regle: string
    let quoiRegarder: string
    const termes: number[] = [u0]

    if (genre === 0) {
      const r = a.entier(3, 15)
      for (let i = 1; i < 6; i++) termes.push(termes[i - 1] + r)
      regle = `on ajoute ${r} à chaque étape`
      quoiRegarder = 'ils sont constants — la suite est arithmétique'
    } else if (genre === 1) {
      const q = a.choix([2, 3])
      for (let i = 1; i < 6; i++) termes.push(termes[i - 1] * q)
      regle = `on multiplie par ${q} à chaque étape`
      quoiRegarder =
        'ils ne sont pas constants, mais leur RAPPORT l’est : chaque terme est un multiple du précédent'
    } else if (genre === 2) {
      const d0 = a.entier(2, 6)
      const pas = a.entier(1, 4)
      for (let i = 1; i < 6; i++) termes.push(termes[i - 1] + d0 + (i - 1) * pas)
      regle = `l'écart part de ${d0} et augmente de ${pas} à chaque fois`
      quoiRegarder =
        'ils ne sont pas constants, mais ils progressent eux-mêmes régulièrement — la règle porte sur l’écart'
    } else if (genre === 3) {
      const r = a.entier(3, 12)
      for (let i = 1; i < 6; i++) termes.push(i % 2 === 1 ? termes[i - 1] + r : termes[i - 1] * 2)
      regle = `on ajoute ${r}, puis on multiplie par 2, en alternance`
      quoiRegarder = 'ils alternent entre deux comportements : la règle change à chaque étape'
    } else if (genre === 4) {
      // Fibonacci décalé : chaque terme est la somme des deux précédents.
      termes.push(a.entier(3, 18))
      for (let i = 2; i < 6; i++) termes.push(termes[i - 1] + termes[i - 2])
      regle = 'chaque terme est la somme des deux précédents'
      quoiRegarder =
        'ils reproduisent la suite elle-même — signe que la règle relie chaque terme aux DEUX précédents, pas au seul dernier'
    } else {
      // Carrés ou cubes déguisés : la suite des bases est simple, la suite
      // affichée ne l'est pas du tout.
      const base = a.entier(2, 7)
      const puissance = a.choix([2, 3])
      termes.length = 0
      for (let i = 0; i < 6; i++) termes.push((base + i) ** puissance)
      regle = `ce sont les ${puissance === 2 ? 'carrés' : 'cubes'} de ${base}, ${base + 1}, ${base + 2}, …`
      quoiRegarder =
        puissance === 2
          ? 'ils augmentent de 2 en 2 — signature des carrés successifs'
          : 'ils n’ont rien de régulier : il faut sortir de la logique des écarts et reconnaître des cubes'
    }

    const reponse = termes[5]
    const visibles = termes.slice(0, 5)
    const ecarts = termes.slice(1, 6).map((t, i) => t - termes[i])

    const candidats: Array<[number, string]> = [
      [reponse + (termes[5] - termes[4]), 'un terme de trop : c’est le 7ᵉ, la suite s’arrête au 6ᵉ'],
      [
        termes[4] + (termes[4] - termes[3]),
        'l’écart a été figé à sa dernière valeur au lieu de suivre la règle',
      ],
      [reponse - 1, 'une unité en dessous : la règle a été appliquée de travers'],
      [reponse + 1, 'une unité au-dessus : la règle a été appliquée de travers'],
      [termes[4] * 2, 'le dernier terme visible a été doublé, sans vérifier que c’est bien la règle'],
      [reponse * 2, 'la règle a été appliquée deux fois'],
    ]
    const leurres = candidats
      .filter(([x]) => x !== reponse && x > 0)
      .map(([x, motif]): LeurreTexte => [nombre(x), motif])

    const { options, bonneReponse, diagnostics } = qcmTexte(a, nombre(reponse), leurres, () =>
      nombre(reponse + (a.entier(-40, 40) || 7)),
    )

    return {
      section: S,
      skillId: suitesNumeriques.skillId,
      typeItem: 'qcm',
      enonce: 'Quel nombre complète la suite ?',
      figure: { type: 'bande', cases: rangee([...visibles.map((t) => nombre(t)), ''], 5) },
      options,
      bonneReponse,
      diagnostics,
      rappel: `${regle} : ${nombre(termes[4])} → ${nombre(reponse)}.`,
      explication:
        `1. Le réflexe, toujours le même : écrire les écarts SOUS la suite. Un écart se lit, une ` +
        `suite se devine — et deviner coûte une minute par question.\n` +
        `   ${visibles.map((t) => nombre(t)).join('   ')}\n` +
        `   écarts : ${ecarts
          .slice(0, 4)
          .map((e) => (e >= 0 ? `+${nombre(e)}` : nombre(e)))
          .join('   ')}\n` +
        `2. Ce que disent ces écarts : ${quoiRegarder}.\n` +
        `3. Règle retenue : ${regle}.\n` +
        `4. Appliquée au dernier terme visible (${nombre(termes[4])}), elle donne ${nombre(reponse)}.\n` +
        `L'ordre de test qui couvre presque tout le sous-test : écarts constants → écarts en ` +
        `progression → rapport constant → alternance de deux règles → somme des deux précédents → ` +
        `carrés et cubes déguisés. Six essais, trente secondes.`,
      difficulte: genre >= 4 ? 4 : genre >= 2 ? 3 : 2,
    }
  },
}

/* --------------------------------------------------- suites de lettres -- */

const suitesDeLettres: Famille = {
  skillId: 'tm.logique.suites_de_lettres',
  nom: 'suite de lettres',
  produire(a) {
    const genre = a.entier(0, 2)
    const termes: string[] = []
    let regle: string
    let methode: string

    if (genre === 0) {
      // Un pas constant sur des lettres isolées, avec repli après Z.
      const debut = a.entier(1, 26)
      const pas = a.choix([2, 3, 4, 5, -3, -4])
      for (let i = 0; i < 6; i++) termes.push(lettre(debut + i * pas))
      regle = `chaque lettre ${pas > 0 ? 'avance' : 'recule'} de ${Math.abs(pas)} rang${Math.abs(pas) > 1 ? 's' : ''}`
      methode = 'une seule lettre par case : on convertit en rangs et on lit les écarts'
    } else if (genre === 1) {
      // Un pas qui grandit : l'écart lui-même progresse.
      const debut = a.entier(1, 12)
      const d0 = a.entier(1, 3)
      const croissance = a.entier(1, 2)
      let r = debut
      for (let i = 0; i < 6; i++) {
        termes.push(lettre(r))
        r += d0 + i * croissance
      }
      regle = `l'écart part de ${d0} et augmente de ${croissance} à chaque fois`
      methode = 'les écarts ne sont pas constants : on écrit les écarts DES écarts'
    } else {
      // Des groupes de deux lettres, chaque position avec son propre pas.
      const d1 = a.entier(1, 20)
      const d2 = a.entier(1, 20)
      const p1 = a.choix([1, 2, 3, -2])
      const p2 = a.choix([1, 2, 4, -1])
      for (let i = 0; i < 6; i++) termes.push(`${lettre(d1 + i * p1)}${lettre(d2 + i * p2)}`)
      regle =
        `la 1ʳᵉ lettre ${p1 > 0 ? 'avance' : 'recule'} de ${Math.abs(p1)}, ` +
        `la 2ᵉ ${p2 > 0 ? 'avance' : 'recule'} de ${Math.abs(p2)}`
      methode = 'deux positions, donc DEUX suites indépendantes : on les traite séparément'
    }

    const reponse = termes[5]
    const visibles = termes.slice(0, 5)
    const taille = reponse.length

    const bouger = (g: string, delta: number) =>
      [...g].map((c) => lettre(rang(c) + delta)).join('')

    const candidats: Array<[string, string]> = [
      [bouger(reponse, 1), 'un rang de trop'],
      [bouger(reponse, -1), 'un rang de moins'],
      [termes[4], 'le dernier terme VISIBLE a été recopié, sans appliquer la règle'],
      [
        bouger(termes[4], rang(termes[5][0]) - rang(termes[4][0]) > 0 ? -1 : 1),
        'la règle a été appliquée dans le mauvais sens',
      ],
      [taille === 2 ? `${reponse[1]}${reponse[0]}` : bouger(reponse, 2), 'deux rangs de trop, ou les lettres interverties'],
    ]
    const leurres = candidats.filter(([g]) => g !== reponse) as LeurreTexte[]

    const { options, bonneReponse, diagnostics } = qcmTexte(a, reponse, leurres, () =>
      groupeAleatoire(a, taille),
    )

    const rangsVisibles = visibles
      .map((g) => `${g} (${[...g].map((c) => rang(c)).join('-')})`)
      .join('   ')

    return {
      section: S,
      skillId: suitesDeLettres.skillId,
      typeItem: 'qcm',
      enonce: 'Quel groupe de lettres complète la suite ?',
      figure: { type: 'bande', cases: rangee([...visibles, ''], 5) },
      options,
      bonneReponse,
      diagnostics,
      rappel: `${regle} : ${termes[4]} → ${reponse}.`,
      explication:
        `1. On ne compare JAMAIS des lettres à l'œil. On les convertit en rangs (A = 1, B = 2, … ` +
        `Z = 26) et on écrit les rangs sous la suite. Un écart se voit sur des nombres ; sur des ` +
        `lettres, il ne se voit pas.\n` +
        `   ${rangsVisibles}\n` +
        `2. ${methode}.\n` +
        `3. Règle retenue : ${regle}.\n` +
        `4. Appliquée à ${termes[4]}, elle donne ${reponse}.\n` +
        `Les repères à connaître pour convertir sans compter depuis A : E = 5, J = 10, O = 15, ` +
        `T = 20, Y = 25. Et après Z, on repart à A — un rang 27 vaut A, un rang 28 vaut B.`,
      difficulte: genre === 2 ? 3 : 2,
    }
  },
}

/* ------------------------------------------------------------- intrus -- */

const intrusNumerique: Famille = {
  skillId: 'tm.logique.intrus_numerique',
  nom: 'intrus numérique',
  produire(a) {
    const genre = a.entier(0, 3)
    let conformes: number[]
    let intrusValeur: number
    let regle: string
    let pourquoi: string
    let detail: string

    if (genre === 0) {
      const bases = a.melanger([4, 5, 6, 7, 8, 9, 11, 12, 13]).slice(0, 4)
      conformes = bases.map((b) => b * b)
      const proche = a.entier(10, 15) ** 2
      intrusValeur = proche + a.choix([-1, 1, 2, -2])
      regle = 'ce sont des carrés parfaits'
      detail = conformes.map((c, i) => `${nombre(c)} = ${bases[i]}²`).join(', ')
      const r = Math.floor(Math.sqrt(intrusValeur))
      pourquoi = `il tombe entre ${r}² = ${nombre(r * r)} et ${r + 1}² = ${nombre((r + 1) ** 2)}`
    } else if (genre === 1) {
      const d = a.choix([3, 4, 6, 7, 9, 11])
      const vus = new Set<number>()
      conformes = []
      while (conformes.length < 4) {
        const m = d * a.entier(4, 30)
        if (!vus.has(m)) {
          vus.add(m)
          conformes.push(m)
        }
      }
      intrusValeur = d * a.entier(4, 30) + a.choix([1, -1, 2, -2])
      regle = `ce sont des multiples de ${d}`
      detail = conformes.map((c) => `${nombre(c)} = ${d} × ${c / d}`).join(', ')
      pourquoi = `il tombe entre ${nombre(d * Math.floor(intrusValeur / d))} et ${nombre(d * (Math.floor(intrusValeur / d) + 1))}, deux multiples consécutifs de ${d}`
    } else if (genre === 2) {
      const premiers = [11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73]
      conformes = a.melanger(premiers).slice(0, 4)
      let candidat = a.entier(12, 90)
      while (estPremier(candidat)) candidat++
      intrusValeur = candidat
      regle = 'ce sont des nombres premiers'
      detail = `${conformes.map(nombre).join(', ')} n’ont pas d’autre diviseur qu’eux-mêmes et 1`
      const d = [2, 3, 5, 7, 11, 13].find((x) => intrusValeur % x === 0) ?? 2
      pourquoi = `il se divise par ${d} : ${nombre(intrusValeur)} = ${d} × ${intrusValeur / d}`
    } else {
      const s = a.entier(8, 17)
      const vus = new Set<number>()
      conformes = []
      for (let n = 20; n < 900 && conformes.length < 4; n++) {
        if (sommeChiffres(n) === s && !vus.has(n) && a.chance(0.25)) {
          vus.add(n)
          conformes.push(n)
        }
      }
      if (conformes.length < 4) throw new Error('Pas assez de nombres à somme de chiffres fixée.')
      let candidat = a.entier(20, 900)
      while (sommeChiffres(candidat) === s) candidat++
      intrusValeur = candidat
      regle = `la somme de leurs chiffres vaut ${s}`
      detail = conformes.map((c) => `${nombre(c)} → ${[...String(c)].join(' + ')} = ${s}`).join(', ')
      pourquoi = `${[...String(intrusValeur)].join(' + ')} = ${sommeChiffres(intrusValeur)}, et non ${s}`
    }

    if (conformes.includes(intrusValeur)) throw new Error('L’intrus vérifie la règle.')

    const { options, bonneReponse, diagnostics } = qcmTexte(
      a,
      nombre(intrusValeur),
      conformes.map((c): LeurreTexte => [nombre(c), `${nombre(c)} respecte la règle : ${regle}`]),
      () => nombre(a.entier(10, 400)),
    )

    const iIntrus = options.indexOf(nombre(intrusValeur))
    const cases: Case[] = options.map((o) => texte(o))

    return {
      section: S,
      skillId: intrusNumerique.skillId,
      typeItem: 'qcm',
      enonce: 'Parmi ces nombres, lequel est l’intrus ?',
      figure: { type: 'bande', cases },
      optionsFigure: cases,
      options,
      bonneReponse,
      diagnostics,
      rappel: `Règle partagée : ${regle}. ${nombre(intrusValeur)} y échappe.`,
      explication:
        `1. Sur un intrus, on ne cherche jamais ce qui cloche dans UN nombre : on cherche la règle ` +
        `que QUATRE nombres partagent. C'est le renversement qui fait toute la famille — chercher ` +
        `l'anomalie mène à des justifications inventables pour n'importe lequel des cinq.\n` +
        `2. L'ordre de test, du plus fréquent au plus rare : carrés — cubes — nombres premiers — ` +
        `parité — multiples d'un même nombre — somme des chiffres — chiffres tous différents. ` +
        `Sept essais qui couvrent la quasi-totalité des cas.\n` +
        `3. Ici, ${regle} : ${detail}.\n` +
        `4. ${nombre(intrusValeur)} n'y répond pas — ${pourquoi}. C'est l'intrus` +
        `${iIntrus >= 0 ? `, proposition ${'ABCDE'[iIntrus]}` : ''}.\n` +
        `Les carrés jusqu'à 25² et les cubes jusqu'à 10³ méritent d'être sus par cœur : ils font ` +
        `gagner dix secondes ici, et reviennent en calcul comme en conditions minimales.`,
      difficulte: genre === 3 ? 3 : 2,
    }
  },
}

const intrusAlphabetique: Famille = {
  skillId: 'tm.logique.intrus_alphabetique',
  nom: 'intrus alphabétique',
  produire(a) {
    const genre = a.entier(0, 2)
    const conformes: string[] = []
    let intrusGroupe: string
    let regle: string

    if (genre === 0) {
      // Trois lettres consécutives.
      while (conformes.length < 4) {
        const d = a.entier(1, 22)
        const g = `${lettre(d)}${lettre(d + 1)}${lettre(d + 2)}`
        if (!conformes.includes(g)) conformes.push(g)
      }
      const d = a.entier(1, 20)
      intrusGroupe = `${lettre(d)}${lettre(d + 1)}${lettre(d + 3)}`
      regle = 'trois lettres qui se suivent dans l’alphabet'
    } else if (genre === 1) {
      // Écart interne constant, différent de 1.
      const pas = a.choix([2, 3, 4])
      while (conformes.length < 4) {
        const d = a.entier(1, 26 - 2 * pas)
        const g = `${lettre(d)}${lettre(d + pas)}${lettre(d + 2 * pas)}`
        if (!conformes.includes(g)) conformes.push(g)
      }
      const d = a.entier(1, 26 - 2 * pas - 1)
      intrusGroupe = `${lettre(d)}${lettre(d + pas)}${lettre(d + 2 * pas + 1)}`
      regle = `un écart constant de ${pas} rangs entre les lettres`
    } else {
      // Une voyelle au milieu.
      const voyelles = ['A', 'E', 'I', 'O', 'U']
      while (conformes.length < 4) {
        const g = `${ALPHABET[a.entier(0, 25)]}${a.choix(voyelles)}${ALPHABET[a.entier(0, 25)]}`
        if (!conformes.includes(g)) conformes.push(g)
      }
      let milieu = ALPHABET[a.entier(0, 25)]
      while (voyelles.includes(milieu)) milieu = ALPHABET[a.entier(0, 25)]
      intrusGroupe = `${ALPHABET[a.entier(0, 25)]}${milieu}${ALPHABET[a.entier(0, 25)]}`
      regle = 'la lettre du milieu est une voyelle'
    }

    if (conformes.includes(intrusGroupe)) throw new Error('L’intrus vérifie la règle.')

    const { options, bonneReponse, diagnostics } = qcmTexte(
      a,
      intrusGroupe,
      conformes.map((g): LeurreTexte => [
        g,
        `${g} = rangs ${[...g].map((c) => rang(c)).join('-')} : la règle y est respectée`,
      ]),
      () => groupeAleatoire(a, 3),
    )

    const cases: Case[] = options.map((o) => texte(o))

    return {
      section: S,
      skillId: intrusAlphabetique.skillId,
      typeItem: 'qcm',
      enonce: 'Parmi ces groupes de lettres, lequel est l’intrus ?',
      figure: { type: 'bande', cases },
      optionsFigure: cases,
      options,
      bonneReponse,
      diagnostics,
      rappel: `Règle partagée : ${regle}. ${intrusGroupe} y échappe.`,
      explication:
        `1. Premier geste, sans exception : convertir en rangs. ` +
        `${[...conformes, intrusGroupe].map((g) => `${g} → ${[...g].map((c) => rang(c)).join('-')}`).join(', ')}.\n` +
        `2. Ce qu'on teste sur des lettres, dans l'ordre : écart interne constant — lettres ` +
        `consécutives — voyelle/consonne — symétrie dans l'alphabet (A↔Z, B↔Y…) — position ` +
        `d'une même lettre.\n` +
        `3. Quatre groupes partagent la même règle : ${regle}. ` +
        `${enRangs(conformes[0])} le montre sur le premier.\n` +
        `4. ${intrusGroupe} ne la vérifie pas : c'est l'intrus.\n` +
        `Savoir placer E = 5, J = 10, O = 15, T = 20, Y = 25 permet de convertir sans compter ` +
        `depuis A. C'est ce qui fait la différence quand il reste quatre minutes.`,
      difficulte: 2,
    }
  },
}

/* --------------------------------------------------- opérations codées -- */

/**
 * Une opération inventée, à reconstituer sur des exemples.
 *
 * La famille teste autre chose que les suites : il n'y a pas de progression à
 * lire, il faut poser une inconnue et la résoudre sur deux exemples. C'est la
 * seule question du sous-test où écrire une équation est plus rapide que
 * chercher à l'œil.
 */
const operationsCodees: Famille = {
  skillId: 'tm.logique.operations_codees',
  nom: 'opération codée',
  produire(a) {
    const genre = a.entier(0, 2)
    let calcul: (x: number, y: number) => number
    let regle: string
    let demarche: string

    if (genre === 0) {
      const u = a.entier(2, 5)
      const v = a.entier(1, 4)
      calcul = (x, y) => u * x + v * y
      regle = `x ⊕ y = ${u}x + ${v}y`
      demarche =
        `on cherche deux coefficients : x ⊕ y = ux + vy. Deux exemples donnent deux équations, ` +
        `et le système se résout de tête quand les nombres sont petits`
    } else if (genre === 1) {
      const c = a.entier(1, 6)
      calcul = (x, y) => x * y + c
      regle = `x ⊕ y = x × y + ${c}`
      demarche =
        `on compare chaque résultat au produit x × y : si l'écart est le même partout, ` +
        `c'est une constante ajoutée`
    } else {
      calcul = (x, y) => x * x - y
      regle = 'x ⊕ y = x² − y'
      demarche =
        `quand les résultats grandissent beaucoup plus vite que x, il faut penser au carré ` +
        `avant d'insister sur les multiplications`
    }

    const exemples: Array<[number, number]> = []
    const vus = new Set<string>()
    while (exemples.length < 3) {
      const x = a.entier(2, 9)
      const y = a.entier(1, 9)
      if (vus.has(`${x}-${y}`)) continue
      vus.add(`${x}-${y}`)
      exemples.push([x, y])
    }
    const [qx, qy] = exemples[2]
    const reponse = calcul(qx, qy)
    if (reponse <= 0) throw new Error('Résultat négatif : illisible pour cette famille.')

    const candidats: Array<[number, string]> = [
      [calcul(qy, qx), 'les deux nombres ont été échangés : l’opération n’est pas symétrique'],
      [qx + qy, 'la somme brute, sans l’opération'],
      [qx * qy, 'le produit brut, sans l’opération'],
      [reponse + 1, 'une unité de trop'],
      [reponse - 1, 'une unité de moins'],
    ]
    const leurres = candidats
      .filter(([v]) => v !== reponse && v > 0)
      .map(([v, motif]): LeurreTexte => [nombre(v), motif])

    const { options, bonneReponse, diagnostics } = qcmTexte(a, nombre(reponse), leurres, () =>
      nombre(reponse + (a.entier(-15, 15) || 6)),
    )

    const lignes: Case[][] = exemples.map(([x, y], i) => [
      texte(`${x} ⊕ ${y}`),
      texte('='),
      i === 2 ? { inconnue: true } : texte(nombre(calcul(x, y))),
    ])

    return {
      section: S,
      skillId: operationsCodees.skillId,
      typeItem: 'qcm',
      enonce: 'Le symbole ⊕ désigne une opération inventée. Que vaut la dernière ligne ?',
      figure: { type: 'matrice', lignes },
      options,
      bonneReponse,
      diagnostics,
      rappel: `${regle} → ${qx} ⊕ ${qy} = ${nombre(reponse)}.`,
      explication:
        `1. Une opération codée ne se devine pas : elle se POSE. On écrit la forme la plus simple ` +
        `qui pourrait convenir, et on la teste sur les exemples donnés.\n` +
        `2. Ici, ${demarche}.\n` +
        `3. Vérification sur les deux premières lignes : ` +
        `${exemples
          .slice(0, 2)
          .map(([x, y]) => `${x} ⊕ ${y} = ${nombre(calcul(x, y))}`)
          .join(', ')}. La règle ${regle} les explique toutes les deux.\n` +
        `4. Appliquée à la dernière ligne : ${qx} ⊕ ${qy} = ${nombre(reponse)}.\n` +
        `L'ordre de test qui couvre l'essentiel : somme pondérée (ax + by) → produit plus une ` +
        `constante → carré d'un terme → différence. Et toujours vérifier sur DEUX exemples : une ` +
        `règle qui marche sur un seul est presque toujours fausse.`,
      difficulte: 4,
    }
  },
}

export const FAMILLES_SERIES: Famille[] = [
  suitesNumeriques,
  suitesDeLettres,
  intrusNumerique,
  intrusAlphabetique,
  operationsCodees,
]
