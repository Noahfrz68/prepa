import { db } from './queries'
import type { QuestionComprehension, ResultatComprehension } from '@/core/import/comprehension'
import { equilibrer } from '@/core/import/permutation'
import { aleaDepuis } from '@/core/generation/alea'

/**
 * Classement d'une question de compréhension par sa sous-compétence.
 *
 * Les quinze questions de l'annale importée au lot 9 n'en portent aucune, et le
 * plan comme la répétition espacée travaillent par sous-compétence : sans elle,
 * la compréhension reste un bloc opaque où l'on ne sait pas ce qui manque.
 *
 * Les motifs sont ordonnés du plus spécifique au plus général, et l'ordre
 * compte : « Que signifie l'expression… » est une question de vocabulaire avant
 * d'être une question de détail.
 */
const CLASSEMENT: Array<{ motif: RegExp; skill: string }> = [
  {
    // Ce qui distingue ce type du détail explicite, c'est la NATURE de la
    // réponse : ici, un jugement porté par l'auteur, là un fait qu'il rapporte.
    // La frontière passe entre « quelle position adopte-t-il » — la réponse est
    // sa position — et « pourquoi juge-t-il que » — la réponse est une raison
    // écrite dans le texte. Sans cette distinction, la moitié du corpus tombait
    // en détail explicite et le type restait vide.
    motif:
      /(\bton\b|registre|ironi|distance critique|attitude de l['’]auteur|intention de l['’]auteur|quelle position .*(adopte|défend|tient)|quelle attitude .*(adopte|recommande)|que reproche l['’]auteur|quelle critique l['’]auteur|l['’]auteur (considère|estime|juge) que)/i,
    skill: 'tm.comprehension.ton_et_intention_de_l_auteur',
  },
  {
    motif:
      /(que signifie|signifie que|entend(re)? par|au sens de|l['’]expression|le terme|le mot|la formule|l['’]image de)/i,
    skill: 'tm.comprehension.vocabulaire_en_contexte',
  },
  {
    // Tout ce qui porte sur la CONSTRUCTION de l'argument plutôt que sur son
    // contenu : fonction d'un exemple, place d'une objection, mouvement de la
    // conclusion. C'est le sous-test dans le sous-test, et ces tournures le
    // repèrent plus sûrement qu'une lecture du sens de la question.
    motif:
      /(fonction|rôle|structure|articulation|organis|plan du texte|enchaîn|connecteur|paradoxe|objection|concession|dans l['’]argumentation|dans le raisonnement|que montre l['’](exemple|expérience)|quelle conclusion.*(tire|apporte)|quelle nuance|quelle portée)/i,
    skill: 'tm.comprehension.structure_argumentative',
  },
  {
    motif:
      /(idée (directrice|principale|centrale)|thèse|titre|résume|synthèse|propos général|de quoi traite)/i,
    skill: 'tm.comprehension.idee_principale',
  },
  {
    motif:
      /(déduire|implique|suppose|sous-entend|laisse entendre|peut-on conclure|présuppos|en quoi)/i,
    skill: 'tm.comprehension.inference',
  },
  {
    // Le résidu : une question qui interroge ce que le texte ou l'auteur DIT.
    // La réponse est écrite quelque part dans le passage — c'est la définition
    // du détail explicite, et c'est le cas le plus fréquent du sous-test. Ce
    // qui ne correspond même pas à cela reste sans sous-compétence : mieux vaut
    // un blanc qu'un classement inventé.
    motif:
      /(conforme au texte|selon le texte|d['’]après (le texte|le|la)|selon l['’]auteur|affirme|indique|précise|l['’]auteur|le texte|le passage|le dernier paragraphe|la dernière phrase)/i,
    skill: 'tm.comprehension.detail_explicite',
  },
]

/**
 * Question qui interroge le contenu du passage, sans le nommer.
 *
 * « Quelle place accorde la communauté philosophique à Hannah Arendt ? » ne
 * contient ni « le texte » ni « l'auteur », et échappe donc à toutes les règles
 * ci-dessus. C'est pourtant la forme la plus courante du sous-test, et sa
 * réponse est écrite dans le passage : c'est du détail explicite.
 *
 * Ce défaut n'est pas un classement inventé — c'est la catégorie modale du
 * sous-test 1, la seule dont on puisse dire qu'elle est vraie par défaut. Mais
 * il reste un défaut, et il ne s'applique qu'à ce qui a la forme d'une question.
 */
const QUESTION_DE_CONTENU = /^(que |qu[''’]|quel|quelle|quels|quelles|comment|pourquoi|à quelle|sur quoi|combien|de quoi|qui )/i

export function classer(enonce: string): string | null {
  const parRegle = CLASSEMENT.find((c) => c.motif.test(enonce))?.skill
  if (parRegle) return parRegle

  const nu = enonce.trim()
  if (nu.length >= 15 && QUESTION_DE_CONTENU.test(nu)) {
    return 'tm.comprehension.detail_explicite'
  }
  return null
}

export interface ResultatInsertionComprehension {
  fichiers: number
  textes: number
  questions: number
  inseres: number
  doublons: number
  sansSkill: number
  avertissements: string[]
}

/**
 * Insère des séries de compréhension.
 *
 * Statut `a_relire`, comme tout ce qui entre par un import : la structure a
 * beau être régulière, c'est une lecture automatique, et rien de lu
 * automatiquement n'est servi sans qu'un humain l'ait vu.
 *
 * La déduplication porte sur l'énoncé ET son texte support, contrairement à
 * l'import PDF. C'est indispensable ici : « Quelle est l'idée directrice du
 * texte ? » revient à chaque épreuve, et dédupliquer sur le seul énoncé
 * n'aurait gardé qu'une question sur dix.
 */
export function insererComprehension(
  resultats: ResultatComprehension[],
  examId = 'tagemage',
): ResultatInsertionComprehension {
  const d = db()

  const existe = d.prepare(
    `SELECT 1 FROM item
      WHERE exam_id = ? AND section = 'comprehension'
        AND enonce = ? AND IFNULL(contexte_texte, '') = ?
      LIMIT 1`,
  )

  const inserer = d.prepare(`
    INSERT INTO item
      (exam_id, section, skill_id, type_item, enonce, contexte_texte, options,
       bonne_reponse, explication_reference, source, statut)
    VALUES (@exam, 'comprehension', @skill, 'qcm', @enonce, @contexte, @options,
            @bonne, @explication, 'importe', 'a_relire')
  `)

  let inseres = 0
  let doublons = 0
  let sansSkill = 0
  const avertissements: string[] = []

  const toutes: QuestionComprehension[] = []
  for (const r of resultats) {
    avertissements.push(...r.avertissements)
    toutes.push(...r.questions)
  }

  const tout = d.transaction(() => {
    const aInserer: QuestionComprehension[] = []
    for (const q of toutes) {
      if (!q.bonneReponse) {
        avertissements.push(`${q.numero} : aucune réponse au corrigé, question non importée.`)
        continue
      }
      if (existe.get(examId, q.enonce, q.contexte)) {
        doublons++
        continue
      }
      aInserer.push(q)
    }

    // Les corrigés rédigés à la main placent la bonne réponse très
    // inégalement (la moitié en B dans la première banque). On rééquilibre
    // avant d'enregistrer, en tenant compte de ce que la banque contient déjà.
    const dejaEnBanque = Object.fromEntries(
      (
        d
          .prepare(
            `SELECT bonne_reponse AS l, COUNT(*) AS n FROM item
              WHERE exam_id = ? AND section = 'comprehension' GROUP BY bonne_reponse`,
          )
          .all(examId) as Array<{ l: string; n: number }>
      ).map((r) => [r.l, r.n]),
    )
    const equilibrees = equilibrer(
      aInserer.map((q) => ({ ...q, bonneReponse: q.bonneReponse as string })),
      aleaDepuis(Date.now()),
      dejaEnBanque,
    ).map((r) => r.question)

    for (const q of equilibrees) {
      const skill = classer(q.enonce)
      if (!skill) sansSkill++

      inserer.run({
        exam: examId,
        skill,
        enonce: q.enonce,
        contexte: q.contexte,
        options: JSON.stringify(q.options),
        bonne: q.bonneReponse,
        explication: q.explication ?? null,
      })
      inseres++
    }
  })

  tout()

  return {
    fichiers: resultats.length,
    textes: resultats.reduce((n, r) => n + r.textes.length, 0),
    questions: toutes.length,
    inseres,
    doublons,
    sansSkill,
    avertissements,
  }
}
