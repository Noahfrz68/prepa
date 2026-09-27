/**
 * Conditions minimales — maîtrise du format A–E : les informations équivalentes.
 *
 * Le type n'avait aucune question. Le piège de format le plus sûr du
 * sous-test : deux informations qui disent la même chose sous deux formes
 * (« n est pair » et « n est divisible par 2 »). Elles suffisent ensemble si,
 * et seulement si, chacune suffit seule : la réponse est D ou E, jamais A, B
 * ni C. Qui teste chaque information pour elle-même le voit ; qui cherche la
 * réponse au problème s'y perd.
 */

import { nombre } from './alea'
import type { Famille, Lettre } from './types'

interface PaireEquivalente {
  question: string
  info1: string
  info2: string
  suffit: boolean
  /** Pourquoi les deux disent la même chose. */
  equivalence: string
  /** Pourquoi elles suffisent, ou pourquoi non. */
  verdict: string
}

type Tirage = { entier: (a: number, b: number) => number; choix: <T>(l: T[]) => T }

const PAIRES: Array<(a: Tirage) => PaireEquivalente> = [
  (a) => {
    const n = a.entier(3, 40)
    const c = a.entier(2, 9)
    return {
      question: 'Quelle est la valeur de n ?',
      info1: `n + ${c} = ${nombre(n + c)}.`,
      info2: `2n + ${2 * c} = ${nombre(2 * n + 2 * c)}.`,
      suffit: true,
      equivalence: 'la seconde équation est la première multipliée par 2',
      verdict: `chacune donne n = ${nombre(n)}`,
    }
  },
  (a) => {
    const k = a.entier(3, 15)
    return {
      question: 'Quel est le périmètre d’un carré ?',
      info1: `Son côté mesure ${nombre(k)} cm.`,
      info2: `Son demi-périmètre vaut ${nombre(2 * k)} cm.`,
      suffit: true,
      equivalence: 'un demi-périmètre de carré vaut deux côtés : les deux donnent le même côté',
      verdict: `chacune donne un périmètre de ${nombre(4 * k)} cm`,
    }
  },
  (a) => {
    const prix = a.entier(4, 30) * 10
    return {
      question: 'Quel est le prix d’un article après une remise de 20 % ?',
      info1: `Avant remise, l’article coûtait ${nombre(prix)} €.`,
      info2: `La remise porte sur un prix initial de ${nombre(prix)} €.`,
      suffit: true,
      equivalence: 'les deux phrases donnent le même prix initial',
      verdict: `chacune donne ${nombre(prix)} × 0,8 = ${nombre(prix * 0.8)} €`,
    }
  },
  () => ({
    question: 'Quelle est la valeur de l’entier n ?',
    info1: 'n est pair.',
    info2: 'n est divisible par 2.',
    suffit: false,
    equivalence: 'être pair, c’est être divisible par 2',
    verdict: 'une infinité d’entiers sont pairs',
  }),
  (a) => {
    const k = a.entier(3, 12)
    return {
      question: 'Quelle est la valeur de x ?',
      info1: `x² = ${nombre(k * k)}.`,
      info2: `La valeur absolue de x vaut ${nombre(k)}.`,
      suffit: false,
      equivalence: `x² = ${nombre(k * k)} équivaut à |x| = ${nombre(k)}`,
      verdict: `x vaut ${nombre(k)} ou −${nombre(k)} : deux réponses`,
    }
  },
  (a) => {
    const s = a.entier(8, 60)
    return {
      question: 'Deux nombres x et y étant donnés, que vaut x ?',
      info1: `x + y = ${nombre(s)}.`,
      info2: `2x + 2y = ${nombre(2 * s)}.`,
      suffit: false,
      equivalence: 'la seconde équation est la première multipliée par 2',
      verdict: 'une équation pour deux inconnues laisse une infinité de couples',
    }
  },
  (a) => {
    const t = a.choix([10, 20, 25, 50])
    return {
      question: 'Quel est le nouveau prix d’un abonnement ?',
      info1: `Il a augmenté de ${t} %.`,
      info2: `Il a été multiplié par ${nombre(1 + t / 100, 2)}.`,
      suffit: false,
      equivalence: `augmenter de ${t} %, c’est multiplier par ${nombre(1 + t / 100, 2)}`,
      verdict: 'sans prix de départ, aucun montant',
    }
  },
]

export const informationsEquivalentes: Famille = {
  skillId: 'tm.conditions_minimales.maitrise_du_format_a_e',
  nom: 'informations équivalentes',
  produire(a) {
    const p = a.choix(PAIRES)(a)
    const bonne: Lettre = p.suffit ? 'D' : 'E'
    return {
      section: 'conditions_minimales',
      skillId: informationsEquivalentes.skillId,
      typeItem: 'conditions_minimales',
      enonce: p.question,
      options: [],
      info1: p.info1,
      info2: p.info2,
      bonneReponse: bonne,
      rappel: 'Deux informations équivalentes : D si l’une suffit, E sinon — jamais A, B ni C.',
      explication:
        `1. Avant de calculer, comparer les deux informations : ${p.equivalence}. Elles disent la même chose : ` +
        `elles suffisent seules toutes les deux, ou aucune des deux, et leur réunion n’apporte rien de plus. ` +
        `Ni A, ni B, ni C : seulement D ou E.\n` +
        `2. Information (1) seule — « ${p.info1} » : ${p.suffit ? 'elle SUFFIT' : 'elle NE SUFFIT PAS'}, ${p.verdict}.\n` +
        `3. Information (2) seule — « ${p.info2} » : ${p.suffit ? 'elle SUFFIT' : 'elle NE SUFFIT PAS'}, pour la même raison.\n` +
        `Réponse ${bonne} : ${
          p.suffit
            ? 'chacune des deux informations suffit, prise séparément'
            : 'même réunies, les deux informations laissent plusieurs réponses possibles'
        }.\n` +
        `À retenir : repérer l’équivalence élimine trois lettres d’un coup, sans rien calculer.`,
      difficulte: 2,
    }
  },
}
