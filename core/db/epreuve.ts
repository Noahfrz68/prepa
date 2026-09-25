import { lireCases, lireFigure } from '@/core/figures/lire'
import type { Case, Figure } from '@/core/figures/types'
import { db, diagnosticDe } from './queries'
import { itemsComprehensionGroupes } from './selection'
import { tirageEquilibre, type Candidat } from '@/core/scheduler/tirage'
import { aleaDepuis } from '@/core/generation/alea'
import type { ItemDrill } from './queries'
import { SECTIONS_PAR_ID } from '@/exams/tagemage'
import { composerEpreuve, type Etape, type ModeEpreuve } from '@/exams/tagemage/epreuve'
import { issueDe, pointsDe, resultatSerie, type Issue } from '@/core/scoring/tagemage'
import {
  analyserFatigue,
  ecartACible,
  estimerScoreParSousTest,
  troisLeviers,
  type EchantillonEpreuve,
  type PointFatigue,
} from '@/core/stats/diagnostic'
import { ErreurRequete } from '@/core/erreurs'
import { tempsBorne, verifierSessionOuverte } from './garde'

export interface EtapePreparee extends Etape {
  items: ItemDrill[]
  /** Questions manquantes en banque pour cette section. */
  manquantes: number
}

export interface EpreuvePreparee {
  sessionId: number
  mode: ModeEpreuve
  etapes: EtapePreparee[]
  complete: boolean
}

/**
 * Prépare une épreuve entière en une seule fois : tous les items sont chargés
 * avant le départ, pour qu'aucun appel réseau ne vienne s'intercaler pendant
 * les deux heures de passage.
 *
 * `bonne_reponse` n'est jamais envoyé au client : les corrections ne sortent
 * qu'à `recapEpreuve`, une fois l'épreuve close.
 */
export function demarrerEpreuve(mode: ModeEpreuve): EpreuvePreparee {
  const d = db()
  const modele = composerEpreuve(mode)

  // Les candidates d'une section, sans les champs lourds : le tirage ne
  // regarde que la sous-compétence, le début de l'énoncé et la fraîcheur.
  const candidates = d.prepare(
    `SELECT i.id, i.skill_id AS skillId, i.enonce,
            (SELECT COUNT(*) FROM attempt a WHERE a.item_id = i.id) AS vu
       FROM item i
      WHERE i.exam_id = 'tagemage' AND i.section = ? AND i.statut = 'valide'`,
  )
  const poids = new Map(
    (
      d
        .prepare(`SELECT id, poids_examen AS poids FROM skill WHERE exam_id = 'tagemage'`)
        .all() as Array<{ id: string; poids: number }>
    ).map((s) => [s.id, s.poids]),
  )
  const alea = aleaDepuis(Date.now())

  // La compréhension se tire par textes complets — trois textes de cinq
  // questions, comme à l'épreuve — au lieu de quinze passages différents.
  // Le même accès sert pour les autres sections, une fois le tirage fait.
  const parTextes = d.prepare(
    `SELECT i.id, i.type_item, i.enonce, i.contexte_texte, i.info_1, i.info_2, i.options,
            i.figure, i.options_figure,
            m.hash_script AS imageHash
       FROM item i
       LEFT JOIN media m ON m.id = i.media_id AND m.type = 'image'
      WHERE i.id = ?`,
  )

  const etapes: EtapePreparee[] = modele.map((e) => {
    const ids =
      e.section === 'comprehension'
        ? itemsComprehensionGroupes(e.questions)
        : tirageEquilibre(
            candidates.all(e.section) as Candidat[],
            e.questions,
            poids,
            alea,
          ).map((c) => c.id)
    const lignes = ids.map((id) => parTextes.get(id) as Record<string, unknown>)
    const items: ItemDrill[] = lignes.map((l) => ({
      id: l.id as number,
      typeItem: l.type_item as 'qcm' | 'conditions_minimales',
      enonce: l.enonce as string,
      contexteTexte: (l.contexte_texte as string) ?? null,
      info1: (l.info_1 as string) ?? null,
      info2: (l.info_2 as string) ?? null,
      options: l.options ? (JSON.parse(l.options as string) as string[]) : [],
      imageHash: (l.imageHash as string) ?? null,
      figure: lireFigure(l.figure),
      optionsFigure: lireCases(l.options_figure),
    }))

    return { ...e, items, manquantes: e.questions - items.length }
  })

  const total = etapes.reduce((acc, e) => acc + e.items.length, 0)
  if (total === 0) {
    throw new ErreurRequete(
      'La banque est vide : importe des questions avant de lancer une épreuve.',
    )
  }

  const complete = etapes.every((e) => e.manquantes === 0)

  const info = d
    .prepare(
      `INSERT INTO exam_session (exam_id, type, sections, conditions_reelles)
       VALUES ('tagemage', ?, ?, ?)`,
    )
    .run(
      mode === 'blanc' ? 'blanc' : 'diagnostic',
      JSON.stringify(etapes.map((e) => e.section)),
      complete ? 1 : 0,
    )

  return { sessionId: Number(info.lastInsertRowid), mode, etapes, complete }
}

export interface TentativeLot {
  itemId: number
  reponse: string | null
  aSaute: boolean
  /** 'saute' = décision assumée · 'non_traite' = temps écoulé. */
  motifBlanc: 'saute' | 'non_traite' | null
  tempsMs: number
  confiance: number
}

/**
 * Enregistre en bloc les tentatives d'un sous-test, à sa clôture.
 *
 * En blanc on navigue librement dans le sous-test : on ne peut donc écrire
 * qu'à la fin, quand les réponses sont figées. La transaction garantit qu'un
 * sous-test est enregistré entièrement ou pas du tout.
 */
export function enregistrerLot(sessionId: number, tentatives: TentativeLot[]): number {
  const d = db()

  // Séance disparue, close ou abandonnée : le lot est refusé avec un message
  // lisible (voir garde.ts), plutôt que par le « FOREIGN KEY constraint
  // failed » brut de SQLite au milieu d'un examen.
  verifierSessionOuverte(d, sessionId)

  const lireItem = d.prepare(`SELECT bonne_reponse FROM item WHERE id = ?`)
  const inserer = d.prepare(
    `INSERT INTO attempt
       (session_id, item_id, reponse_donnee, est_correct, a_saute, motif_blanc,
        temps_ms, confiance, points_gagnes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
     -- Un lot renvoyé après une panne est absorbé, pas doublé (migration 016).
     ON CONFLICT (session_id, item_id) DO NOTHING`,
  )

  const tout = d.transaction((liste: TentativeLot[]) => {
    for (const t of liste) {
      const item = lireItem.get(t.itemId) as { bonne_reponse: string } | undefined
      if (!item) throw new ErreurRequete(`Question ${t.itemId} introuvable.`, 404)

      const issue: Issue = t.aSaute ? 'blanc' : issueDe(t.reponse, item.bonne_reponse)

      inserer.run(
        sessionId,
        t.itemId,
        t.aSaute ? null : t.reponse,
        issue === 'juste' ? 1 : 0,
        t.aSaute ? 1 : 0,
        t.aSaute ? (t.motifBlanc ?? 'saute') : null,
        tempsBorne(t.tempsMs),
        Math.min(4, Math.max(1, Math.round(t.confiance))),
        pointsDe(issue),
      )
    }
  })

  tout(tentatives)
  return tentatives.length
}

export function terminerEpreuve(sessionId: number): void {
  const d = db()

  const lignes = d
    .prepare(
      `SELECT a.est_correct, a.a_saute, i.section
         FROM attempt a JOIN item i ON i.id = a.item_id
        WHERE a.session_id = ?`,
    )
    .all(sessionId) as Array<{ est_correct: number; a_saute: number; section: string }>

  const issues = lignes.map<Issue>((r) => (r.a_saute ? 'blanc' : r.est_correct ? 'juste' : 'faux'))
  const r = resultatSerie(issues)

  // Le score enregistré est celui du bilan : chaque sous-test pèse autant,
  // comme à l'épreuve réelle, quel que soit le nombre de questions servies.
  const sections = [...new Set(lignes.map((l) => l.section))]
  const score = estimerScoreParSousTest(
    echantillonsParSousTest(
      lignes.map((l) => ({
        section: l.section,
        estCorrect: Boolean(l.est_correct),
        aSaute: Boolean(l.a_saute),
      })),
      sections,
    ),
  ).score

  d.prepare(
    // Idempotent : un « finish » renvoyé après une coupure ne réécrit pas la fin.
    `UPDATE exam_session SET fin = datetime('now'), score_brut = ?, score_echelle = ?
      WHERE id = ? AND fin IS NULL`,
  ).run(r.pointsBruts, score, sessionId)
}

/** Regroupe les réponses d'une épreuve par sous-test, dans l'ordre donné. */
function echantillonsParSousTest(
  reponses: Array<{ section: string; estCorrect: boolean; aSaute: boolean }>,
  ordre: string[],
): EchantillonEpreuve[] {
  return ordre.map((section) => {
    const g = reponses.filter((c) => c.section === section)
    const justes = g.filter((c) => c.estCorrect).length
    const blanches = g.filter((c) => c.aSaute).length
    return { nItems: g.length, justes, fausses: g.length - justes - blanches, blanches }
  })
}

/* ------------------------------------------------------------- recap -- */

export interface CorrectionEpreuve {
  itemId: number
  section: string
  enonce: string
  typeItem: 'qcm' | 'conditions_minimales'
  options: string[]
  info1: string | null
  info2: string | null
  bonneReponse: string
  reponseDonnee: string | null
  aSaute: boolean
  motifBlanc: string | null
  estCorrect: boolean
  tempsMs: number
  confiance: number
  points: number
  explication: string | null
  rappel: string | null
  diagnostic: string | null
  /** La sous-compétence, pour renvoyer vers la leçon qui l’explique. */
  skillId: string | null
  /** Disposition dessinée de l'énoncé, pour les questions graphiques. */
  figure: Figure | null
  /** Les cinq propositions dessinées, dans l'ordre de `options`. */
  optionsFigure: Case[] | null
}

export interface RecapEpreuve {
  sessionId: number
  mode: ModeEpreuve
  terminee: boolean
  /** Abandonnée (délai dépassé ou bouton « Abandonner ») ; sinon, peut-être encore en cours. */
  interrompue: boolean
  /** Sous-tests prévus, qu'ils aient été passés ou non. */
  sousTestsPrevus: number
  conditionsReelles: boolean
  debut: string
  scoreEstime: ReturnType<typeof estimerScoreParSousTest>
  ecart: ReturnType<typeof ecartACible> | null
  fatigue: ReturnType<typeof analyserFatigue>
  leviers: ReturnType<typeof troisLeviers>
  totaux: { n: number; justes: number; fausses: number; sautees: number; nonTraitees: number; pointsBruts: number }
  corrections: CorrectionEpreuve[]
  precedent: { sessionId: number; score: number; debut: string } | null
}

export function recapEpreuve(sessionId: number): RecapEpreuve {
  const d = db()

  const session = d
    .prepare(
      `SELECT id, type, sections, debut, fin, score_brut, score_echelle, conditions_reelles,
              interrompue
         FROM exam_session WHERE id = ?`,
    )
    .get(sessionId) as
    | {
        id: number
        type: string
        sections: string
        debut: string
        fin: string | null
        interrompue: number
        score_brut: number | null
        score_echelle: number | null
        conditions_reelles: number
      }
    | undefined

  if (!session) throw new ErreurRequete(`Épreuve ${sessionId} introuvable.`, 404)

  const mode: ModeEpreuve = session.type === 'blanc' ? 'blanc' : 'diagnostic'
  const ordre = JSON.parse(session.sections) as string[]

  const lignes = d
    .prepare(
      `SELECT a.item_id, a.reponse_donnee, a.est_correct, a.a_saute, a.motif_blanc,
              a.temps_ms, a.confiance, a.points_gagnes,
              i.section, i.enonce, i.type_item, i.options, i.info_1, i.info_2,
              i.figure, i.options_figure,
              i.bonne_reponse, i.explication_reference, i.rappel, i.diagnostics, i.skill_id
         FROM attempt a
         JOIN item i ON i.id = a.item_id
        WHERE a.session_id = ?
        ORDER BY a.id`,
    )
    .all(sessionId) as Array<Record<string, unknown>>

  const corrections: CorrectionEpreuve[] = lignes.map((l) => ({
    itemId: l.item_id as number,
    section: l.section as string,
    enonce: l.enonce as string,
    typeItem: l.type_item as 'qcm' | 'conditions_minimales',
    options: l.options ? (JSON.parse(l.options as string) as string[]) : [],
    info1: (l.info_1 as string) ?? null,
    info2: (l.info_2 as string) ?? null,
    bonneReponse: l.bonne_reponse as string,
    reponseDonnee: (l.reponse_donnee as string) ?? null,
    aSaute: Boolean(l.a_saute),
    motifBlanc: (l.motif_blanc as string) ?? null,
    estCorrect: Boolean(l.est_correct),
    tempsMs: l.temps_ms as number,
    confiance: l.confiance as number,
    points: l.points_gagnes as number,
    explication: (l.explication_reference as string) ?? null,
    rappel: (l.rappel as string) ?? null,
    diagnostic: diagnosticDe(l.diagnostics, (l.reponse_donnee as string) ?? null),
    skillId: (l.skill_id as string) ?? null,
    figure: lireFigure(l.figure),
    optionsFigure: lireCases(l.options_figure),
  }))

  const totaux = {
    n: corrections.length,
    justes: corrections.filter((c) => c.estCorrect).length,
    fausses: corrections.filter((c) => !c.aSaute && !c.estCorrect).length,
    sautees: corrections.filter((c) => c.motifBlanc === 'saute').length,
    nonTraitees: corrections.filter((c) => c.motifBlanc === 'non_traite').length,
    pointsBruts: Math.max(0, corrections.reduce((acc, c) => acc + c.points, 0)),
  }

  const scoreEstime = estimerScoreParSousTest(echantillonsParSousTest(corrections, ordre))

  // Réussite habituelle de chaque sous-test, mesurée HORS de cette épreuve :
  // c'est la référence qui sépare la fatigue de la difficulté propre d'un
  // sous-test (voir analyserFatigue). Sous 20 réponses, pas de référence.
  const habituel = new Map(
    (
      d
        .prepare(
          `SELECT i.section, COUNT(*) AS n, AVG(a.est_correct) AS taux
             FROM attempt a JOIN item i ON i.id = a.item_id
            WHERE i.exam_id = 'tagemage' AND a.session_id <> ?
            GROUP BY i.section`,
        )
        .all(sessionId) as Array<{ section: string; n: number; taux: number }>
    )
      .filter((r) => r.n >= 20)
      .map((r) => [r.section, r.taux]),
  )

  // Agrégats par sous-test, dans l'ordre chronologique de passage.
  const points: PointFatigue[] = ordre.map((section, i) => {
    const groupe = corrections.filter((c) => c.section === section)
    const justes = groupe.filter((c) => c.estCorrect).length
    return {
      position: i + 1,
      section,
      libelle: SECTIONS_PAR_ID.get(section as never)?.libelle ?? section,
      n: groupe.length,
      justes,
      tauxReussite: groupe.length === 0 ? 0 : justes / groupe.length,
      tempsMoyenMs:
        groupe.length === 0 ? 0 : groupe.reduce((acc, c) => acc + c.tempsMs, 0) / groupe.length,
      nonTraitees: groupe.filter((c) => c.motifBlanc === 'non_traite').length,
      tauxHabituel: habituel.get(section) ?? null,
    }
  })

  const objectif = d
    .prepare(`SELECT score_cible FROM exam_goal WHERE exam_id = 'tagemage'`)
    .get() as { score_cible: number | null } | undefined

  const precedent = d
    .prepare(
      `SELECT id AS sessionId, score_echelle AS score, debut
         FROM exam_session
        WHERE exam_id = 'tagemage' AND type = ? AND fin IS NOT NULL AND id < ?
        ORDER BY id DESC LIMIT 1`,
    )
    .get(session.type, sessionId) as { sessionId: number; score: number; debut: string } | undefined

  return {
    sessionId,
    mode,
    terminee: session.fin !== null,
    interrompue: session.interrompue === 1,
    sousTestsPrevus: ordre.length,
    conditionsReelles: Boolean(session.conditions_reelles),
    debut: session.debut,
    scoreEstime,
    ecart: objectif?.score_cible ? ecartACible(scoreEstime.score, objectif.score_cible) : null,
    fatigue: analyserFatigue(points),
    leviers: troisLeviers(
      points.map((p) => ({
        section: p.section,
        libelle: p.libelle,
        n: p.n,
        justes: p.justes,
        nonTraitees: p.nonTraitees,
      })),
    ),
    totaux,
    corrections,
    precedent: precedent ?? null,
  }
}

export interface LigneHistorique {
  sessionId: number
  type: string
  debut: string
  scoreEchelle: number | null
  conditionsReelles: boolean
  n: number
}

export function historiqueEpreuves(limite = 10): LigneHistorique[] {
  return db()
    .prepare(
      `SELECT s.id AS sessionId, s.type, s.debut, s.score_echelle AS scoreEchelle,
              s.conditions_reelles AS conditionsReelles,
              (SELECT COUNT(*) FROM attempt a WHERE a.session_id = s.id) AS n
         FROM exam_session s
        WHERE s.exam_id = 'tagemage' AND s.type IN ('blanc', 'diagnostic') AND s.fin IS NOT NULL
        ORDER BY s.id DESC
        LIMIT ?`,
    )
    .all(limite)
    .map((r) => {
      const l = r as Omit<LigneHistorique, 'conditionsReelles'> & { conditionsReelles: number }
      return { ...l, conditionsReelles: Boolean(l.conditionsReelles) }
    })
}
