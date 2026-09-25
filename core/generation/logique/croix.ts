/**
 * Les croix : deux séries qui se coupent sur la case cherchée.
 *
 * C'est la question emblématique du sous-test, et celle qu'un rendu textuel
 * abîme le plus. À l'épreuve, on voit une rangée de cinq groupes coupée par une
 * colonne de cinq groupes ; le regard doit aller de l'un à l'autre, et
 * comprendre que la case au croisement appartient aux deux. Écrite en deux
 * lignes de texte, la question devient un exercice de lecture de liste, ce
 * qu'elle n'est pas.
 *
 * Deux familles : lettres et nombres. Elles partagent la disposition et rien
 * d'autre — la règle alphabétique porte sur des positions dans un groupe, la
 * règle numérique sur une propriété du nombre entier.
 */

import type { Famille } from '../types'
import { qcmTexte, type LeurreTexte } from '../qcm'
import { nombre, type Alea } from '../alea'
import type { Case, Figure } from '@/core/figures/types'
import {
  ALPHABET,
  decaler,
  enRangs,
  estCarre,
  estCube,
  groupeAleatoire,
  lettre,
  produitChiffres,
  rang,
  sommeChiffres,
  texte,
} from './outils'

const S = 'logique' as const

const ORDINAL = ['1ʳᵉ', '2ᵉ', '3ᵉ']

/* ---------------------------------------------------- croix de lettres -- */

/**
 * Une règle DANS le groupe, une règle ENTRE les groupes.
 *
 * C'est la structure exacte des annales : horizontalement, chaque groupe
 * vérifie une relation interne (« les deux premières lettres se suivent ») ;
 * verticalement, une position donnée progresse d'un groupe au suivant. La case
 * du croisement doit vérifier les deux, et c'est le seul moyen de trancher
 * entre deux propositions qui n'en vérifient qu'une.
 */
const croixDeLettres: Famille = {
  skillId: 'tm.logique.croix_de_lettres',
  nom: 'croix de lettres',
  produire(a) {
    // Règle interne : la position `j` vaut la position `i` décalée de `k`.
    const positions = a.melanger([0, 1, 2])
    const i = positions[0]
    const j = positions[1]
    const libre = positions[2]
    const k = a.choix([1, 2, 3, -1, -2])

    // Règle verticale : la position `p` progresse de `d` rangs. Elle doit
    // porter sur l'une des deux positions liées, sinon la case cherchée garde
    // deux degrés de liberté et plusieurs propositions deviennent correctes.
    const p = a.choix([i, j])
    const d = a.choix([1, 2, 3, -1, -2, -3])

    /** Construit un groupe vérifiant la règle interne, la position `i` valant `ri`. */
    const groupeInterne = (ri: number, rLibre: number): string => {
      const g = ['', '', '']
      g[i] = lettre(ri)
      g[j] = lettre(ri + k)
      g[libre] = lettre(rLibre)
      return g.join('')
    }

    const iColonne = a.entier(1, 3)
    const iLigne = a.entier(1, 3)

    // La verticale fixe la position p de la case cherchée.
    const departV = a.entier(6, 20)
    const rangP = departV + iColonne * d
    const rangI = p === i ? rangP : rangP - k
    const reponse = groupeInterne(rangI, a.entier(1, 26))

    // La colonne : même position p en progression, règle interne respectée
    // partout — sinon la case cherchée ne serait pas la seule à la vérifier.
    const colonne: Case[] = []
    for (let n = 0; n < 5; n++) {
      if (n === iColonne) {
        colonne.push({ inconnue: true })
        continue
      }
      const rp = departV + n * d
      colonne.push(texte(groupeInterne(p === i ? rp : rp - k, a.entier(1, 26))))
    }

    // La ligne : règle interne respectée, position p libre. Un groupe de la
    // ligne qui vérifierait AUSSI la verticale ferait douter de l'énoncé.
    const ligne: Case[] = []
    for (let n = 0; n < 5; n++) {
      if (n === iLigne) {
        ligne.push({ inconnue: true })
        continue
      }
      let ri = a.entier(1, 26)
      // On écarte le rang qui rendrait ce groupe conforme à la verticale.
      if (lettre(p === i ? ri : ri + k) === lettre(rangP)) ri += 5
      ligne.push(texte(groupeInterne(ri, a.entier(1, 26))))
    }

    const verifieInterne = (g: string) => rang(g[j]) === ((rang(g[i]) + k + 25) % 26) + 1
    const verifieVerticale = (g: string) => g[p] === lettre(rangP)
    const utilisable = (g: string) => g !== reponse && !(verifieInterne(g) && verifieVerticale(g))

    const varier = (g: string, pos: number, delta: number) => {
      const t = [...g]
      t[pos] = lettre(rang(t[pos]) + delta)
      return t.join('')
    }

    const candidats: Array<[string, string]> = [
      [
        varier(reponse, j, 1),
        `la règle verticale est vérifiée, mais pas la règle interne : la ${ORDINAL[j]} lettre ne découle plus de la ${ORDINAL[i]}`,
      ],
      [
        varier(varier(reponse, i, -d), j, -d),
        'c’est la case PRÉCÉDENTE de la colonne : la progression verticale a été remontée d’un cran',
      ],
      [
        varier(varier(reponse, i, d), j, d),
        'c’est la case SUIVANTE de la colonne : un cran de trop sur la progression verticale',
      ],
      [
        [...reponse].reverse().join(''),
        'les bonnes lettres, mais dans l’ordre inverse — la règle porte sur des POSITIONS précises',
      ],
      [
        varier(reponse, p, -2 * d),
        'la progression verticale a été appliquée dans le mauvais sens',
      ],
    ]
    const leurres = candidats.filter(([g]) => utilisable(g)) as LeurreTexte[]

    const { options, bonneReponse, diagnostics } = qcmTexte(a, reponse, leurres, () => {
      const g = groupeAleatoire(a, 3)
      return utilisable(g) ? g : `${ALPHABET[a.entier(0, 25)]}${g[1]}${g[2]}`
    })

    const figure: Figure = { type: 'croix', ligne, colonne, iLigne, iColonne }

    const exempleLigne = (ligne.find((c) => !c.inconnue)?.texte ?? '') as string
    const colonneVisible = colonne.filter((c) => !c.inconnue).map((c) => c.texte as string)

    return {
      section: S,
      skillId: croixDeLettres.skillId,
      typeItem: 'qcm',
      enonce: 'Quel groupe de lettres peut appartenir aux deux séries à la fois ?',
      figure,
      options,
      bonneReponse,
      diagnostics,
      rappel:
        `Interne : ${ORDINAL[j]} lettre = ${ORDINAL[i]} ${k > 0 ? '+' : '−'} ${Math.abs(k)}. ` +
        `Verticale : la ${ORDINAL[p]} lettre ${d > 0 ? 'avance' : 'recule'} de ${Math.abs(d)} ` +
        `à chaque case → ${lettre(rangP)}. Réponse : ${reponse}.`,
      explication:
        `1. Une croix se lit en deux temps, jamais d'un bloc. On cherche d'abord ce que chaque ` +
        `groupe vérifie TOUT SEUL (la règle horizontale), puis ce qui change d'un groupe au ` +
        `suivant dans la colonne (la règle verticale).\n` +
        `2. Règle horizontale — regarde un groupe de la rangée, ${exempleLigne} : ` +
        `${enRangs(exempleLigne)}. La ${ORDINAL[j]} lettre vaut la ${ORDINAL[i]} ` +
        `${k > 0 ? `plus ${k}` : `moins ${-k}`}. C'est vrai dans chacun des groupes de la rangée.\n` +
        `3. Règle verticale — on ne regarde qu'UNE position à la fois, ici la ${ORDINAL[p]} lettre : ` +
        `${colonneVisible.map((g) => `${g} → ${g[p]} (${rang(g[p])})`).join(', ')}. ` +
        `Elle ${d > 0 ? 'avance' : 'recule'} de ${Math.abs(d)} rang${Math.abs(d) > 1 ? 's' : ''} ` +
        `d'une case à la suivante. À la place du « ? », elle vaut donc ${lettre(rangP)}.\n` +
        `4. Le groupe cherché doit vérifier les DEUX. Sa ${ORDINAL[p]} lettre est ${lettre(rangP)}, ` +
        `et la règle interne fixe alors la ${ORDINAL[p === i ? j : i]} : ${reponse} convient.\n` +
        `La ${ORDINAL[libre]} lettre ne porte aucune règle. C'est normal et voulu : elle sert à ` +
        `rendre les propositions crédibles. Ne pas la chercher fait gagner trente secondes.\n` +
        `Chaque leurre ne vérifie qu'UNE des deux règles. Tester la seconde même quand la ` +
        `première passe, c'est exactement là que la question se gagne.`,
      difficulte: 4,
    }
  },
}

/* ---------------------------------------------------- croix de nombres -- */

interface Propriete {
  nom: string
  /** Comment on la reconnaît, en une phrase utilisable à l'épreuve. */
  reconnaitre: string
  test(n: number): boolean
}

function proprietes(a: Alea): { h: Propriete; v: Propriete; candidats: number[] } {
  const genre = a.entier(0, 3)

  if (genre === 0) {
    // Carrés et cubes : l'intersection est une puissance sixième. C'est la
    // croix la plus élégante du sous-test, et elle tombe régulièrement.
    const h: Propriete = {
      nom: 'des carrés parfaits',
      reconnaitre: 'un carré parfait est le produit d’un entier par lui-même : 4, 9, 16, 25, 36…',
      test: estCarre,
    }
    const v: Propriete = {
      nom: 'des cubes parfaits',
      reconnaitre: 'un cube parfait est un entier multiplié deux fois par lui-même : 8, 27, 64, 125…',
      test: estCube,
    }
    return { h, v, candidats: [64, 729] }
  }

  if (genre === 1) {
    // Multiples de deux nombres premiers entre eux : l'intersection est un
    // multiple de leur produit.
    const paires: Array<[number, number]> = [
      [3, 4], [4, 7], [3, 7], [5, 6], [4, 9], [6, 7], [3, 11], [5, 8],
    ]
    const [x, y] = a.choix(paires)
    const critere: Record<number, string> = {
      3: 'la somme des chiffres est un multiple de 3',
      4: 'les deux derniers chiffres forment un multiple de 4',
      5: 'le nombre finit par 0 ou 5',
      6: 'le nombre est pair et sa somme de chiffres est un multiple de 3',
      7: 'aucun critère simple : on divise',
      8: 'les trois derniers chiffres forment un multiple de 8',
      9: 'la somme des chiffres est un multiple de 9',
      11: 'la somme alternée des chiffres (+ − + −) est un multiple de 11',
    }
    const h: Propriete = {
      nom: `des multiples de ${x}`,
      reconnaitre: critere[x],
      test: (n) => n % x === 0,
    }
    const v: Propriete = {
      nom: `des multiples de ${y}`,
      reconnaitre: critere[y],
      test: (n) => n % y === 0,
    }
    const pas = x * y
    const candidats = [2, 3, 4, 5, 6, 7, 8].map((m) => pas * m)
    return { h, v, candidats }
  }

  if (genre === 2) {
    // Somme de chiffres constante et produit de chiffres constant. Toute
    // permutation partage les deux : les leurres doivent l'éviter.
    const c1 = a.entier(1, 6)
    const c2 = a.entier(1, 6)
    const c3 = a.entier(1, 6)
    const s = c1 + c2 + c3
    const pr = c1 * c2 * c3
    const h: Propriete = {
      nom: `des nombres dont le produit des chiffres vaut ${pr}`,
      reconnaitre: 'on multiplie les chiffres entre eux, sans regarder la valeur du nombre',
      test: (n) => produitChiffres(n) === pr,
    }
    const v: Propriete = {
      nom: `des nombres dont la somme des chiffres vaut ${s}`,
      reconnaitre: 'on additionne les chiffres, sans regarder la valeur du nombre',
      test: (n) => sommeChiffres(n) === s,
    }
    return { h, v, candidats: [Number(`${c1}${c2}${c3}`)] }
  }

  // Carrés et multiples d'un nombre : l'intersection est un carré de multiple.
  const m = a.choix([3, 4, 5, 6, 7])
  const h: Propriete = {
    nom: 'des carrés parfaits',
    reconnaitre: 'un carré parfait est le produit d’un entier par lui-même : 4, 9, 16, 25, 36…',
    test: estCarre,
  }
  const v: Propriete = {
    nom: `des multiples de ${m}`,
    reconnaitre: `on divise par ${m} et on regarde si ça tombe juste`,
    test: (n) => n % m === 0,
  }
  return { h, v, candidats: [2, 3, 4, 5].map((b) => (b * m) ** 2) }
}

const croixDeNombres: Famille = {
  skillId: 'tm.logique.croix_de_nombres',
  nom: 'croix de nombres',
  produire(a) {
    const { h, v, candidats } = proprietes(a)
    const reponse = a.choix(candidats.filter((n) => h.test(n) && v.test(n) && n < 100000))
    if (reponse === undefined) throw new Error('Aucune intersection pour ce couple de règles.')

    /** Des nombres vérifiant `p` mais PAS l'autre règle, et différents de la réponse. */
    const peupler = (p: Propriete, autre: Propriete, combien: number): number[] => {
      const trouves: number[] = []
      const vus = new Set<number>([reponse])
      for (let n = 4; n <= 1200 && trouves.length < combien; n++) {
        if (!p.test(n) || autre.test(n) || vus.has(n)) continue
        vus.add(n)
        trouves.push(n)
      }
      return trouves
    }

    const serieH = peupler(h, v, 4)
    const serieV = peupler(v, h, 4)
    if (serieH.length < 4 || serieV.length < 4) {
      throw new Error('Séries trop courtes pour ce couple de règles.')
    }

    const iLigne = a.entier(1, 3)
    const iColonne = a.entier(1, 3)

    const melH = a.melanger(serieH)
    const melV = a.melanger(serieV)
    const ligne: Case[] = []
    const colonne: Case[] = []
    let ih = 0
    let iv = 0
    for (let n = 0; n < 5; n++) {
      ligne.push(n === iLigne ? { inconnue: true } : texte(nombre(melH[ih++])))
      colonne.push(n === iColonne ? { inconnue: true } : texte(nombre(melV[iv++])))
    }

    const affiches = new Set([...serieH, ...serieV])
    const utilisable = (n: number) =>
      n !== reponse && n > 0 && !affiches.has(n) && !(h.test(n) && v.test(n))

    const candidatsLeurres: Array<[number, string]> = [
      ...peupler(h, v, 2).map((n): [number, string] => [
        n,
        `il appartient bien à la série horizontale (${h.nom}), mais pas à la verticale`,
      ]),
      ...peupler(v, h, 2).map((n): [number, string] => [
        n,
        `il appartient bien à la série verticale (${v.nom}), mais pas à l’horizontale`,
      ]),
      [reponse + 1, 'ni l’une ni l’autre des deux règles n’y est vérifiée'],
      [reponse * 2, 'la réponse doublée : aucune des deux règles n’y survit'],
    ]
    const leurres = candidatsLeurres
      .filter(([n]) => utilisable(n))
      .map(([n, motif]): LeurreTexte => [nombre(n), motif])

    const { options, bonneReponse, diagnostics } = qcmTexte(a, nombre(reponse), leurres, () => {
      const n = reponse + a.entier(-40, 40)
      return nombre(utilisable(n) ? n : reponse + a.entier(41, 400))
    })

    const figure: Figure = { type: 'croix', ligne, colonne, iLigne, iColonne }

    return {
      section: S,
      skillId: croixDeNombres.skillId,
      typeItem: 'qcm',
      enonce: 'Quel nombre peut appartenir aux deux séries à la fois ?',
      figure,
      options,
      bonneReponse,
      diagnostics,
      rappel: `Horizontale : ${h.nom}. Verticale : ${v.nom}. ${nombre(reponse)} vérifie les deux.`,
      explication:
        `1. Sur une croix de nombres, la règle est une PROPRIÉTÉ partagée, pas une progression. ` +
        `L'ordre de test qui couvre presque tout : carrés — cubes — multiples d'un même nombre — ` +
        `nombres premiers — somme des chiffres — produit des chiffres.\n` +
        `2. Série horizontale : ${serieH.map(nombre).join(', ')}. Ce sont ${h.nom}. ` +
        `Pour le repérer vite : ${h.reconnaitre}.\n` +
        `3. Série verticale : ${serieV.map(nombre).join(', ')}. Ce sont ${v.nom}. ` +
        `Pour le repérer vite : ${v.reconnaitre}.\n` +
        `4. Le nombre cherché est à l'intersection : il lui faut les DEUX propriétés à la fois. ` +
        `${nombre(reponse)} convient.\n` +
        `Chaque leurre n'en vérifie qu'une. C'est le piège central de la famille : dès qu'une ` +
        `proposition satisfait la première règle, on croit avoir fini. Tester la seconde coûte ` +
        `cinq secondes et sauve le point.`,
      difficulte: 4,
    }
  },
}

/* --------------------------------------------------- analogie de lettres -- */

const analogiesDeLettres: Famille = {
  skillId: 'tm.logique.analogies_de_lettres',
  nom: 'analogie alphabétique',
  produire(a) {
    const pas = a.choix([2, 3, 4, 5, -2, -3, -4])
    const g1 = groupeAleatoire(a, 3)
    const g2 = decaler(g1, pas)
    const g3 = groupeAleatoire(a, 3)
    const reponse = decaler(g3, pas)

    const sens = pas > 0 ? 'vers l’avant' : 'vers l’arrière'
    const ampleur = Math.abs(pas)

    const candidats: Array<[string, string]> = [
      [
        decaler(g3, -pas),
        `le décalage a été appliqué dans le mauvais sens : ${ampleur} rang(s) ${pas > 0 ? 'en arrière' : 'en avant'} au lieu de ${sens}`,
      ],
      [decaler(g3, pas + 1), 'un rang de trop sur les trois lettres'],
      [decaler(g3, pas - 1), 'un rang de moins sur les trois lettres'],
      [[...reponse].reverse().join(''), 'les bonnes lettres, mais dans l’ordre inverse'],
      [decaler(g1, pas * 2), `le décalage a été appliqué à ${g1} au lieu de ${g3}`],
      [`${reponse[0]}${g3[1]}${reponse[2]}`, 'la lettre du milieu n’a pas été décalée'],
    ]
    const leurres = candidats.filter(([x]) => x !== reponse) as LeurreTexte[]

    const { options, bonneReponse, diagnostics } = qcmTexte(a, reponse, leurres, () =>
      decaler(g3, pas + a.entier(-6, 6) || pas + 7),
    )

    const detail = [...g3]
      .map((c, i) => `${c} (${rang(c)}) → ${reponse[i]} (${rang(reponse[i])})`)
      .join(', ')

    return {
      section: S,
      skillId: analogiesDeLettres.skillId,
      typeItem: 'qcm',
      enonce: `${g1} est à ${g2} ce que ${g3} est à … ?`,
      figure: { type: 'analogie', a: texte(g1), b: texte(g2), c: texte(g3) },
      options,
      bonneReponse,
      diagnostics,
      rappel: `Décalage de ${ampleur} rang(s) ${sens}, lettre par lettre : ${g3} → ${reponse}.`,
      explication:
        `1. Une analogie se résout en deux temps, jamais en comparant les propositions entre ` +
        `elles : on NOMME l'opération sur le premier couple, puis on l'applique au second.\n` +
        `2. Premier couple, lettre par lettre, en rangs : ` +
        `${[...g1].map((c, i) => `${c} (${rang(c)}) → ${g2[i]} (${rang(g2[i])})`).join(', ')}. ` +
        `Chaque lettre se déplace de ${ampleur} rang${ampleur > 1 ? 's' : ''} ${sens} — ` +
        `le même décalage aux trois positions.\n` +
        `3. La même opération sur ${g3} : ${detail}.\n` +
        `4. Réponse : ${reponse}.\n` +
        `L'erreur la plus fréquente, de loin, est le sens du décalage. Écrire le rang sous chaque ` +
        `lettre avant de regarder les propositions prend cinq secondes et la rend impossible.`,
      difficulte: 3,
    }
  },
}

export const FAMILLES_CROIX: Famille[] = [croixDeLettres, croixDeNombres, analogiesDeLettres]
