/**
 * Signaux de doute sur une question, adaptés à un utilisateur unique.
 *
 * La détection d'origine attendait 5 réponses par question avant de juger
 * (personne ne la réussit, ou tout le monde). Avec un seul utilisateur, aucune
 * question n'en a plus de trois : le mécanisme n'a jamais rien signalé. On lit
 * donc d'autres signaux, qui existent dès la première réponse :
 *
 *   — une erreur en se déclarant CERTAIN : quand ta confiance « certain » est
 *     juste à 97 %, les 3 % restants sont souvent des corrigés faux ou des
 *     énoncés ambigus plutôt que des étourderies ;
 *   — la même mauvaise réponse donnée deux fois : si tu reviens à la même
 *     lettre, c'est peut-être elle, la bonne ;
 *   — jamais réussie en trois essais.
 *
 * Ce sont des invitations à relire, pas des verdicts : la question reste en
 * service tant que tu ne l'envoies pas en relecture.
 */

export interface StatsQuestion {
  n: number
  justes: number
  /** Réponses fausses données avec la confiance maximale (4). */
  erreursCertaines: number
  /** La mauvaise réponse la plus souvent donnée, et combien de fois. */
  fausseRepetee: { lettre: string; fois: number } | null
}

export type SignalDoute = 'erreur_certaine' | 'meme_fausse_repetee' | 'jamais_reussie'

export const ESSAIS_JAMAIS_REUSSIE = 3

export function signauxDeDoute(s: StatsQuestion): Array<{ signal: SignalDoute; raison: string }> {
  const r: Array<{ signal: SignalDoute; raison: string }> = []

  if (s.erreursCertaines > 0) {
    r.push({
      signal: 'erreur_certaine',
      raison:
        s.erreursCertaines > 1
          ? `Ratée ${s.erreursCertaines} fois en te disant certain : relis le corrigé, il est peut-être faux.`
          : 'Ratée en te disant certain : relis le corrigé, il est peut-être faux ou l’énoncé ambigu.',
    })
  }

  if (s.fausseRepetee && s.fausseRepetee.fois >= 2) {
    r.push({
      signal: 'meme_fausse_repetee',
      raison: `Tu as répondu ${s.fausseRepetee.lettre} ${s.fausseRepetee.fois} fois, et c’est compté faux : vérifie que ${s.fausseRepetee.lettre} n’est pas la bonne réponse.`,
    })
  }

  if (s.n >= ESSAIS_JAMAIS_REUSSIE && s.justes === 0) {
    r.push({
      signal: 'jamais_reussie',
      raison: `Jamais réussie en ${s.n} essais : énoncé ou corrigé à vérifier.`,
    })
  }

  return r
}
