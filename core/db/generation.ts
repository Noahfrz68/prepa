import { db } from './queries'
import { genererLot, SECTIONS_GENERABLES, type SectionGenerable } from '@/core/generation'
import { signature } from '@/core/generation/verifier'
import type { QuestionGeneree } from '@/core/generation/types'

export interface ResultatGeneration {
  section: SectionGenerable
  demande: number
  produites: number
  inseres: number
  doublons: number
  rejets: number
  parFamille: Record<string, number>
  total: number
  avertissements: string[]
}

/**
 * Signatures des questions déjà en banque pour un sous-test.
 *
 * Sans elles, relancer la génération produirait à nouveau les premières
 * questions de chaque famille — exactement le reproche fait à une banque de
 * quinze questions : toujours les mêmes.
 */
function signaturesExistantes(section: string, examId: string): Set<string> {
  const lignes = db()
    .prepare(
      `SELECT enonce, info_1, info_2, options, bonne_reponse, type_item, figure
         FROM item
        WHERE exam_id = ? AND section = ? AND source = 'genere'`,
    )
    .all(examId, section) as Array<Record<string, unknown>>

  // `signature` lit le TEXTE de la bonne réponse : omettre `bonne_reponse` ou
  // `type_item` produirait des signatures tronquées, qui ne correspondraient à
  // aucune signature fraîche — et la comparaison avec l'existant ne servirait
  // plus à rien.
  return new Set(
    lignes.map((l) =>
      signature({
        section,
        typeItem: l.type_item as 'qcm' | 'conditions_minimales',
        enonce: l.enonce as string,
        info1: (l.info_1 as string) ?? undefined,
        info2: (l.info_2 as string) ?? undefined,
        options: l.options ? (JSON.parse(l.options as string) as string[]) : [],
        bonneReponse: l.bonne_reponse as QuestionGeneree['bonneReponse'],
        figure: l.figure ? (JSON.parse(l.figure as string) as QuestionGeneree['figure']) : undefined,
      } as QuestionGeneree),
    ),
  )
}

/**
 * Fabrique et enregistre des questions pour un sous-test.
 *
 * Statut `valide` d'emblée, contrairement à l'import PDF — et ce n'est pas un
 * relâchement de la règle, c'est qu'elle ne s'applique pas. Une question
 * importée est le résultat d'une lecture qui peut se tromper ; une question
 * engendrée est le résultat d'un calcul dont les paramètres viennent d'être
 * posés. Chacune a en plus traversé les contrôles de forme de `anomalies()`.
 * Sa provenance reste inscrite dans `source`, pour qu'on puisse toujours la
 * distinguer d'une vraie question d'annale.
 */
export function genererEtInserer(
  section: SectionGenerable,
  combien: number,
  graine = Date.now(),
  examId = 'tagemage',
): ResultatGeneration {
  const d = db()
  const rapport = genererLot(section, combien, graine, signaturesExistantes(section, examId))

  const inserer = d.prepare(`
    INSERT OR IGNORE INTO item
      (exam_id, section, skill_id, type_item, enonce, info_1, info_2, options,
       bonne_reponse, difficulte_estimee, explication_reference, rappel, diagnostics,
       figure, options_figure, source, statut)
    VALUES (@exam, @section, @skill, @type, @enonce, @info1, @info2, @options,
            @bonne, @difficulte, @explication, @rappel, @diagnostics,
            @figure, @optionsFigure, 'genere', 'valide')
  `)

  let inseres = 0

  const tout = d.transaction((liste: QuestionGeneree[]) => {
    for (const q of liste) {
      const r = inserer.run({
        exam: examId,
        section: q.section,
        skill: q.skillId,
        type: q.typeItem,
        enonce: q.enonce,
        info1: q.info1 ?? null,
        info2: q.info2 ?? null,
        options: q.typeItem === 'conditions_minimales' ? null : JSON.stringify(q.options),
        bonne: q.bonneReponse,
        difficulte: q.difficulte,
        explication: q.explication,
        rappel: q.rappel ?? null,
        // Absent quand aucun leurre n'était nommé : mieux vaut NULL qu'un objet
        // vide, qui donnerait l'illusion d'un diagnostic disponible.
        diagnostics:
          q.diagnostics && Object.keys(q.diagnostics).length > 0
            ? JSON.stringify(q.diagnostics)
            : null,
        figure: q.figure ? JSON.stringify(q.figure) : null,
        optionsFigure:
          q.optionsFigure && q.optionsFigure.length > 0 ? JSON.stringify(q.optionsFigure) : null,
      })
      inseres += r.changes
    }
  })

  tout(rapport.questions)

  const total = (
    d
      .prepare(
        `SELECT COUNT(*) AS n FROM item
          WHERE exam_id = ? AND section = ? AND statut = 'valide'`,
      )
      .get(examId, section) as { n: number }
  ).n

  const avertissements: string[] = []
  if (rapport.questions.length < combien) {
    avertissements.push(
      `${rapport.questions.length} question(s) produites sur les ${combien} demandées : ` +
        `les familles de ce sous-test ont épuisé leurs combinaisons distinctes.`,
    )
  }
  if (rapport.rejets.length > 0) {
    const motifs = [...new Set(rapport.rejets.flatMap((r) => r.motifs))].slice(0, 3)
    avertissements.push(
      `${rapport.rejets.length} tirage(s) écarté(s) par les contrôles de forme (${motifs.join(' ; ')}).`,
    )
  }

  return {
    section,
    demande: combien,
    produites: rapport.questions.length,
    inseres,
    doublons: rapport.doublons,
    rejets: rapport.rejets.length,
    parFamille: rapport.parFamille,
    total,
    avertissements,
  }
}

/** Supprime les questions engendrées d'un sous-test, sans toucher aux annales. */
export function supprimerGenerees(section: SectionGenerable, examId = 'tagemage'): number {
  return db()
    .prepare(
      `DELETE FROM item
        WHERE exam_id = ? AND section = ? AND source = 'genere'
          AND id NOT IN (SELECT DISTINCT item_id FROM attempt)`,
    )
    .run(examId, section).changes
}

export interface EtatGeneration {
  section: SectionGenerable
  libelle: string
  annales: number
  engendrees: number
}

export function etatGeneration(examId = 'tagemage'): EtatGeneration[] {
  const lignes = db()
    .prepare(
      `SELECT section,
              SUM(CASE WHEN source = 'genere' THEN 1 ELSE 0 END) AS engendrees,
              SUM(CASE WHEN source <> 'genere' THEN 1 ELSE 0 END) AS annales
         FROM item
        WHERE exam_id = ? AND statut = 'valide'
        GROUP BY section`,
    )
    .all(examId) as Array<{ section: string; engendrees: number; annales: number }>

  const parSection = new Map(lignes.map((l) => [l.section, l]))
  const libelles: Record<SectionGenerable, string> = {
    calcul: 'Calcul',
    logique: 'Logique',
    conditions_minimales: 'Conditions minimales',
    expression: 'Expression',
    raisonnement: 'Raisonnement & argumentation',
  }

  return SECTIONS_GENERABLES.map((s) => ({
    section: s,
    libelle: libelles[s],
    annales: parSection.get(s)?.annales ?? 0,
    engendrees: parSection.get(s)?.engendrees ?? 0,
  }))
}
