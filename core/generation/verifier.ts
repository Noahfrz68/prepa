import { LETTRES } from './types'
import type { QuestionGeneree } from './types'
import { decrireCase } from '@/core/figures/decrire'

/**
 * Contrôles structurels appliqués à CHAQUE question fabriquée, avant écriture.
 *
 * Le générateur calcule sa réponse : elle est juste par construction. Ce qui
 * peut encore casser, c'est la forme — quatre propositions au lieu de cinq, un
 * doublon parmi elles, une lettre hors des propositions, deux informations
 * identiques en conditions minimales. Ces défauts-là ne se voient qu'à l'usage,
 * une question sur deux cents, et une question fausse fausse la calibration.
 * On les attrape ici plutôt que dans une série.
 */
export function anomalies(q: QuestionGeneree): string[] {
  const maux: string[] = []

  if (q.enonce.trim().length < 20) maux.push(`énoncé trop court (${q.enonce.length} caractères)`)
  if (!q.explication.trim()) maux.push('explication vide')
  if (!q.skillId) maux.push('sous-compétence absente')
  if (!LETTRES.includes(q.bonneReponse)) maux.push(`réponse « ${q.bonneReponse} » hors A–E`)

  if (q.typeItem === 'conditions_minimales') {
    if (q.options.length > 0) maux.push('les conditions minimales n’ont pas de propositions propres')
    if (!q.info1?.trim()) maux.push('information (1) vide')
    if (!q.info2?.trim()) maux.push('information (2) vide')
    if (q.info1 && q.info1 === q.info2) maux.push('les deux informations sont identiques')
    return maux
  }

  if (q.options.length !== 5) maux.push(`${q.options.length} proposition(s) au lieu de 5`)
  if (q.options.some((o) => !o.trim())) maux.push('proposition vide')
  if (new Set(q.options).size !== q.options.length) maux.push('propositions en double')

  const rang = LETTRES.indexOf(q.bonneReponse)
  if (rang < 0 || rang >= q.options.length) {
    maux.push(`la réponse ${q.bonneReponse} ne désigne aucune proposition`)
  }

  // Une proposition dessinée doit exister pour CHACUNE des cinq lettres, sans
  // quoi deux propositions s'afficheraient en texte et trois en figure — et
  // celle qui manque serait éliminée d'un coup d'œil, sans rien comprendre.
  if (q.optionsFigure) {
    if (q.optionsFigure.length !== q.options.length) {
      maux.push(
        `${q.optionsFigure.length} proposition(s) dessinée(s) pour ${q.options.length} texte(s)`,
      )
    }
    const dessins = q.optionsFigure.map(decrireCase)
    if (new Set(dessins).size !== dessins.length) maux.push('propositions dessinées en double')
  }

  return maux
}

/**
 * Signature d'une question, pour la déduplication.
 *
 * Deux questions sont le même exercice quand elles posent la même chose et
 * attendent la même réponse. L'énoncé seul ne tranche dans aucun des deux
 * sens : deux conditions minimales d'un même moule partagent leur question et
 * ne diffèrent que par leurs informations, tandis qu'un intrus a toujours le
 * même énoncé et ne se distingue que par la valeur cherchée.
 *
 * On retient donc l'énoncé, les informations, et le TEXTE de la bonne réponse —
 * jamais les leurres, qui ne changent pas l'exercice posé.
 */
export function signature(q: QuestionGeneree): string {
  const rang = LETTRES.indexOf(q.bonneReponse)
  const texteReponse =
    q.typeItem === 'conditions_minimales' ? q.bonneReponse : (q.options[rang] ?? '')
  // La disposition fait partie de l'exercice posé : sans elle, deux croix
  // différentes qui aboutissent au même groupe de lettres se prendraient pour
  // la même question, et la seconde serait écartée à tort.
  const figure = q.figure ? JSON.stringify(q.figure) : ''
  return [q.section, q.enonce, q.info1 ?? '', q.info2 ?? '', texteReponse, figure].join('␟')
}
