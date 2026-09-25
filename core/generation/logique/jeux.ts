/**
 * Dominos et cartes : deux systèmes, pas une seule famille.
 *
 * Ils étaient réunis sous une même sous-compétence, ce qui ne voulait rien
 * dire : un domino porte deux suites de points bornées à 6 et bouclées, une
 * carte porte une valeur de 1 à 13 et une enseigne qui tourne dans un ordre
 * fixe. Les méthodes n'ont rien en commun, et une mesure qui les confond ne
 * peut pas dire laquelle des deux fait perdre des points.
 */

import type { Famille } from '../types'
import type { Case } from '@/core/figures/types'
import { qcmFigure } from './outils'

const S = 'logique' as const

/* ------------------------------------------------------------ dominos -- */

const mod7 = (n: number) => ((n % 7) + 7) % 7

const dominos: Famille = {
  skillId: 'tm.logique.dominos',
  nom: 'suite de dominos',
  produire(a) {
    const hautDepart = a.entier(0, 6)
    const basDepart = a.entier(0, 6)
    const pasHaut = a.choix([1, 2, 3, 5, -1, -2])
    const pasBas = a.choix([1, 2, 3, 4, -1, -3])

    const haut = (i: number) => mod7(hautDepart + i * pasHaut)
    const bas = (i: number) => mod7(basDepart + i * pasBas)

    const visibles: Case[] = [0, 1, 2, 3].map((i) => ({ domino: [haut(i), bas(i)] }))
    const bonne: Case = { domino: [haut(4), bas(4)] }

    const leurres: Array<[Case, string]> = [
      [
        { domino: [haut(5), bas(5)] },
        'un domino de trop : c’est le 6ᵉ de la suite, pas le 5ᵉ',
      ],
      [
        { domino: [haut(4), bas(3)] },
        'la moitié du haut est juste, mais celle du bas n’a pas avancé',
      ],
      [
        { domino: [haut(3), bas(4)] },
        'la moitié du bas est juste, mais celle du haut n’a pas avancé',
      ],
      [
        { domino: [bas(4), haut(4)] },
        'les deux bonnes valeurs, mais les moitiés interverties',
      ],
      [
        { domino: [mod7(haut(4) + 1), bas(4)] },
        'un point de trop en haut — souvent le signe d’un retour à zéro mal compté',
      ],
      [
        { domino: [haut(4), mod7(bas(4) + 1)] },
        'un point de trop en bas — souvent le signe d’un retour à zéro mal compté',
      ],
    ]

    const { options, optionsFigure, bonneReponse, diagnostics } = qcmFigure(a, bonne, leurres, () => ({
      domino: [a.entier(0, 6), a.entier(0, 6)],
    }))

    const serieHaut = [0, 1, 2, 3, 4].map(haut)
    const serieBas = [0, 1, 2, 3, 4].map(bas)
    const bouclaitHaut = hautDepart + 4 * pasHaut > 6 || hautDepart + 4 * pasHaut < 0
    const bouclaitBas = basDepart + 4 * pasBas > 6 || basDepart + 4 * pasBas < 0

    return {
      section: S,
      skillId: dominos.skillId,
      typeItem: 'qcm',
      enonce: 'Quel domino complète la suite ?',
      figure: { type: 'bande', cases: [...visibles, { inconnue: true }] },
      options,
      optionsFigure,
      bonneReponse,
      diagnostics,
      rappel: `Haut ${pasHaut > 0 ? '+' : '−'}${Math.abs(pasHaut)}, bas ${pasBas > 0 ? '+' : '−'}${Math.abs(pasBas)}, avec retour à 0 après 6.`,
      explication:
        `1. Un domino n'est PAS un nombre à deux chiffres. Ce sont deux suites indépendantes, ` +
        `l'une en haut, l'autre en bas. On les écrit l'une sous l'autre et on les traite ` +
        `séparément — c'est tout le geste de la famille.\n` +
        `   haut : ${serieHaut.slice(0, 4).join('  ')}  ?\n` +
        `   bas  : ${serieBas.slice(0, 4).join('  ')}  ?\n` +
        `2. Moitiés hautes : elles ${pasHaut > 0 ? 'avancent' : 'reculent'} de ${Math.abs(pasHaut)} ` +
        `à chaque domino. La suivante vaut ${serieHaut[4]}` +
        (bouclaitHaut
          ? `, après retour à 0 : une moitié ne porte que 0 à 6 points, donc dès qu'on dépasse 6 on retranche 7 (et si l'on descend sous 0, on ajoute 7).`
          : '.') +
        `\n3. Moitiés basses : elles ${pasBas > 0 ? 'avancent' : 'reculent'} de ${Math.abs(pasBas)}. ` +
        `La suivante vaut ${serieBas[4]}` +
        (bouclaitBas ? `, également après retour à 0.` : '.') +
        `\n4. Le domino cherché porte donc ${serieHaut[4]} en haut et ${serieBas[4]} en bas.\n` +
        `L'erreur qui coûte le plus dans cette famille est l'oubli du retour à zéro. Une moitié ` +
        `ne peut pas porter 7 points ou plus : dès qu'un total dépasse 6, on retranche 7 sans ` +
        `réfléchir. Se le dire À VOIX BASSE avant de commencer suffit à ne plus la faire.`,
      difficulte: 3,
    }
  },
}

/* -------------------------------------------------------------- cartes -- */

const ENSEIGNES = ['pique', 'coeur', 'carreau', 'trefle'] as const
const NOM_ENSEIGNE: Record<(typeof ENSEIGNES)[number], string> = {
  pique: 'pique',
  coeur: 'cœur',
  carreau: 'carreau',
  trefle: 'trèfle',
}

/** Les treize valeurs, dans l'ordre où elles se suivent. */
const VALEURS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'V', 'D', 'R']

const cartes: Famille = {
  skillId: 'tm.logique.cartes',
  nom: 'suite de cartes',
  produire(a) {
    const iDepart = a.entier(0, 12)
    const pasValeur = a.choix([1, 2, 3, 4, -1, -2])
    const eDepart = a.entier(0, 3)
    const pasEnseigne = a.choix([1, 2, 3])

    const mod13 = (n: number) => ((n % 13) + 13) % 13
    const mod4 = (n: number) => ((n % 4) + 4) % 4

    const valeur = (i: number) => VALEURS[mod13(iDepart + i * pasValeur)]
    const enseigne = (i: number) => ENSEIGNES[mod4(eDepart + i * pasEnseigne)]
    const carte = (i: number): Case => ({ carte: { valeur: valeur(i), enseigne: enseigne(i) } })

    const visibles = [0, 1, 2, 3].map(carte)
    const bonne = carte(4)

    const leurres: Array<[Case, string]> = [
      [carte(5), 'une carte de trop : c’est la 6ᵉ de la suite, pas la 5ᵉ'],
      [
        { carte: { valeur: valeur(4), enseigne: enseigne(3) } },
        'la valeur est juste, mais l’enseigne n’a pas tourné',
      ],
      [
        { carte: { valeur: valeur(3), enseigne: enseigne(4) } },
        'l’enseigne est juste, mais la valeur n’a pas avancé',
      ],
      [
        { carte: { valeur: VALEURS[mod13(iDepart + 4 * pasValeur + 1)], enseigne: enseigne(4) } },
        'une valeur de trop — souvent le signe d’un retour au début mal compté',
      ],
      [
        { carte: { valeur: valeur(4), enseigne: ENSEIGNES[mod4(eDepart + 4 * pasEnseigne + 1)] } },
        'l’enseigne a tourné d’un cran de trop',
      ],
    ]

    const { options, optionsFigure, bonneReponse, diagnostics } = qcmFigure(a, bonne, leurres, () => ({
      carte: { valeur: a.choix(VALEURS), enseigne: a.choix(ENSEIGNES) },
    }))

    const suiteValeurs = [0, 1, 2, 3, 4].map(valeur)
    const suiteEnseignes = [0, 1, 2, 3, 4].map((i) => NOM_ENSEIGNE[enseigne(i)])

    return {
      section: S,
      skillId: cartes.skillId,
      typeItem: 'qcm',
      enonce: 'Quelle carte complète la suite ?',
      figure: { type: 'bande', cases: [...visibles, { inconnue: true }] },
      options,
      optionsFigure,
      bonneReponse,
      diagnostics,
      rappel: `Valeur ${pasValeur > 0 ? '+' : '−'}${Math.abs(pasValeur)} (sur 13, A vaut 1 et R vaut 13), enseigne ${pasEnseigne > 0 ? '+' : '−'}${Math.abs(pasEnseigne)} dans l’ordre pique → cœur → carreau → trèfle.`,
      explication:
        `1. Comme pour un domino, une carte porte DEUX informations indépendantes : sa valeur et ` +
        `son enseigne. On les sépare avant toute chose.\n` +
        `   valeurs   : ${suiteValeurs.slice(0, 4).join('  ')}  ?\n` +
        `   enseignes : ${suiteEnseignes.slice(0, 4).join('  ')}  ?\n` +
        `2. Les valeurs vont de A (= 1) à R (= 13) : A, 2, 3, … 10, Valet, Dame, Roi. On les ` +
        `convertit en nombres, on lit les écarts — ici ${pasValeur > 0 ? '+' : '−'}${Math.abs(pasValeur)} — ` +
        `et après le Roi on repart à l'As. La suivante est donc ${suiteValeurs[4]}.\n` +
        `3. Les enseignes tournent dans un ordre fixe : pique → cœur → carreau → trèfle, puis on ` +
        `revient au pique. Ici elles avancent de ${Math.abs(pasEnseigne)} cran${Math.abs(pasEnseigne) > 1 ? 's' : ''} ` +
        `à chaque carte, ce qui donne ${suiteEnseignes[4]}.\n` +
        `4. La carte cherchée est le ${suiteValeurs[4]} de ${suiteEnseignes[4]}.\n` +
        `Le double bouclage — 13 valeurs, 4 enseignes — est ce qui rend la famille pénible sans ` +
        `méthode et facile avec. Écrire les deux suites de nombres l'une sous l'autre, en marge ` +
        `du sujet, supprime la difficulté entière.`,
      difficulte: 3,
    }
  },
}

export const FAMILLES_JEUX: Famille[] = [dominos, cartes]
