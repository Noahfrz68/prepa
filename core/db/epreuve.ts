import { lireCases, lireFigure } from '@/core/figures/lire'
import type { Case, Figure } from '@/core/figures/types'
import { db, diagnosticDe, difficultesDe } from './queries'
import type { DifficulteObservee } from '@/core/stats/difficulte'
import { itemsComprehensionGroupes, texteLongComprehension } from './selection'
import { poidsDesTypes } from './poids'
import { tirageEquilibre, type Candidat } from '@/core/scheduler/tirage'
import { aleaDepuis } from '@/core/generation/alea'
import type { ItemDrill } from './queries'
import { SECONDES_PAR_QUESTION, SECTIONS_PAR_ID } from '@/exams/tagemage'
import {
  composerEpreuve,
  COUPURE_TOLEREE_MS,
  QUESTIONS_DIAGNOSTIC,
  type Etape,
  type ModeEpreuve,
} from '@/exams/tagemage/epreuve'
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
import { natureDe, type NatureEpreuve } from '@/core/stats/nature'
import { partAnnales } from './arbitrage'
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
  const { etapes, complete } = preparerEtapes(mode)

  const info = db()
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

/**
 * Compose une épreuve SANS ouvrir de séance : pour l'épreuve sur papier, qui
 * s'imprime un jour et se saisit parfois le lendemain. Une séance ouverte à
 * l'impression serait vide pendant des heures, et rangée (supprimée) au bout
 * de douze.
 */
export function composerEpreuvePapier(mode: ModeEpreuve): Omit<EpreuvePreparee, 'sessionId'> {
  return { mode, ...preparerEtapes(mode) }
}

/** Le tirage des questions d'une épreuve, sous-test par sous-test. */
function preparerEtapes(mode: ModeEpreuve): { etapes: EtapePreparee[]; complete: boolean } {
  const d = db()
  const modele = composerEpreuve(mode)

  // Les candidates d'une section, sans les champs lourds : le tirage ne
  // regarde que la sous-compétence, le début de l'énoncé et la fraîcheur.
  const candidates = d.prepare(
    `SELECT i.id, i.skill_id AS skillId, i.enonce, i.tags = 'annale' AS annale,
            (SELECT COUNT(*) FROM attempt a WHERE a.item_id = i.id) AS vu
       FROM item i
      WHERE i.exam_id = 'tagemage' AND i.section = ? AND i.statut = 'valide'`,
  )
  const poids = poidsDesTypes()
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

  const etapes: EtapePreparee[] = modele.map((modeleEtape) => {
    // Diagnostic : un texte long de sept questions, quand la banque en a un,
    // met la compréhension au même volume que les autres sous-tests.
    const long =
      mode === 'diagnostic' && modeleEtape.section === 'comprehension'
        ? texteLongComprehension(QUESTIONS_DIAGNOSTIC)
        : null
    const e = long
      ? { ...modeleEtape, questions: long.length, secondes: long.length * SECONDES_PAR_QUESTION }
      : modeleEtape
    const ids = long
      ? long
      : e.section === 'comprehension'
        ? itemsComprehensionGroupes(e.questions, 'tagemage', true)
        : tirageEquilibre(
            (candidates.all(e.section) as Array<Omit<Candidat, 'annale'> & { annale: number }>).map((c) => ({
              ...c,
              annale: c.annale === 1,
            })),
            e.questions,
            poids,
            alea,
            // Les annales jamais vues d'abord : ce sont elles qui mesurent le
            // niveau à l'épreuve réelle (core/stats/nature.ts).
            { prioriteAnnales: true },
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

    // Borné à zéro : un sous-test servi avec PLUS de questions que prévu (textes
    // entiers en compréhension) n'en manque d'aucune — le négatif déclarait
    // l'épreuve incomplète à tort (voir migration 018).
    return { ...e, items, manquantes: Math.max(0, e.questions - items.length) }
  })

  const total = etapes.reduce((acc, e) => acc + e.items.length, 0)
  if (total === 0) {
    throw new ErreurRequete(
      'La banque est vide : importe des questions avant de lancer une épreuve.',
    )
  }

  return { etapes, complete: etapes.every((e) => e.manquantes === 0) }
}

export interface SaisiePapier {
  section: string
  itemIds: number[]
  /** Une réponse par question, dans l'ordre de `itemIds` ; lettre null = case vide. */
  reponses: Array<{ lettre: string | null; confiance: number | null }>
  /** Temps passé sur le sous-test, en minutes, noté sur la feuille. */
  minutes: number
}

/**
 * Enregistre en une fois une épreuve passée sur papier.
 *
 * La séance naît à la saisie, complète : lots de chaque sous-test puis
 * clôture, dans une seule transaction — une saisie à moitié enregistrée
 * serait une épreuve interrompue.
 *
 * Le temps n'est connu que par sous-test (noté sur la feuille) : il est
 * réparti à parts égales entre ses questions, pour que le volume de travail
 * reste juste — mais marqué `temps_mesure = 0`, pour qu'aucune statistique
 * de temps par question ne le prenne pour une mesure.
 *
 * Une confiance laissée vide sur la feuille n'est pas remplacée par « 3 » :
 * la réponse est enregistrée avec `confiance_declaree = 0`, et la calibration
 * l'ignore. Quatre-vingt-dix « assez sûr » fictifs la faussaient.
 */
export function enregistrerEpreuvePapier(mode: ModeEpreuve, saisie: SaisiePapier[]): number {
  const d = db()
  const attendues = composerEpreuve(mode)
  if (saisie.length === 0) throw new ErreurRequete('Aucun sous-test saisi.')

  let sessionId = 0
  d.transaction(() => {
    const complete =
      saisie.length === attendues.length &&
      attendues.every((e) => (saisie.find((s) => s.section === e.section)?.itemIds.length ?? 0) >= e.questions)
    sessionId = Number(
      d
        .prepare(
          `INSERT INTO exam_session (exam_id, type, sections, conditions_reelles, papier)
           VALUES ('tagemage', ?, ?, ?, 1)`,
        )
        .run(mode === 'blanc' ? 'blanc' : 'diagnostic', JSON.stringify(saisie.map((s) => s.section)), complete ? 1 : 0)
        .lastInsertRowid,
    )

    for (const s of saisie) {
      if (s.reponses.length !== s.itemIds.length) {
        throw new ErreurRequete(`Sous-test ${s.section} : ${s.itemIds.length} questions, ${s.reponses.length} réponses.`)
      }
      const parQuestion = Math.max(0, (Number(s.minutes) || 0) * 60_000) / Math.max(1, s.itemIds.length)
      enregistrerLot(
        sessionId,
        s.itemIds.map((itemId, i) => {
          const r = s.reponses[i]
          const lettre = r.lettre && /^[A-E]$/.test(r.lettre) ? r.lettre : null
          const confiance = Number(r.confiance)
          const declaree = lettre !== null && Number.isInteger(confiance) && confiance >= 1 && confiance <= 4
          return {
            itemId,
            reponse: lettre,
            aSaute: lettre === null,
            // Sur papier, une case vide ne dit pas si c'était un choix ou le
            // temps : on la compte non traitée, le cas le plus fréquent.
            motifBlanc: lettre === null ? ('non_traite' as const) : null,
            tempsMs: parQuestion,
            tempsMesure: false,
            // La colonne exige une valeur ; `confianceDeclaree` dit qu'elle ne compte pas.
            confiance: declaree ? confiance : 1,
            confianceDeclaree: declaree,
          }
        }),
      )
    }
    terminerEpreuve(sessionId)
  })()

  return sessionId
}

export interface TentativeLot {
  itemId: number
  reponse: string | null
  aSaute: boolean
  /** 'saute' = décision assumée · 'non_traite' = temps écoulé. */
  motifBlanc: 'saute' | 'non_traite' | null
  tempsMs: number
  confiance: number
  /** Faux pour une épreuve papier : temps déclaré en bloc, pas chronométré. Vrai par défaut. */
  tempsMesure?: boolean
  /** Faux quand personne n'a déclaré de confiance (feuille papier). Vrai par défaut. */
  confianceDeclaree?: boolean
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
        temps_ms, confiance, points_gagnes, temps_mesure, confiance_declaree)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
        t.tempsMesure === false ? 0 : 1,
        t.confianceDeclaree === false ? 0 : 1,
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
  /** Difficulté tirée de toutes tes réponses à cette question. */
  difficulte: DifficulteObservee | null
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
  /** Passée sur papier : temps déclaré, pas mesuré question par question. */
  papier: boolean
  /** Temps cumulé des coupures pendant l'épreuve (onglet fermé, rechargement). */
  coupureMs: number
  /** Part de questions d'annales, et la nature qui en découle (core/stats/nature.ts). */
  partAnnales: number
  nature: NatureEpreuve
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
              interrompue, papier, coupure_ms
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
        papier: number
        coupure_ms: number
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

  const difficultes = difficultesDe(lignes.map((l) => l.item_id as number))
  const corrections: CorrectionEpreuve[] = lignes.map((l) => ({
    itemId: l.item_id as number,
    difficulte: difficultes.get(l.item_id as number) ?? null,
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

  // La précédente du même format ET de même nature : comparer une épreuve sur
  // annales à une épreuve de questions générées mêlerait progrès et banque.
  const part = partAnnales(sessionId)
  const nature = natureDe(part)
  const precedent = (
    d
      .prepare(
        `SELECT id AS sessionId, score_echelle AS score, debut
           FROM exam_session
          WHERE exam_id = 'tagemage' AND type = ? AND fin IS NOT NULL AND id < ?
            AND score_echelle IS NOT NULL
          ORDER BY id DESC`,
      )
      .all(session.type, sessionId) as Array<{ sessionId: number; score: number; debut: string }>
  ).find((p) => natureDe(partAnnales(p.sessionId)) === nature)

  return {
    sessionId,
    mode,
    terminee: session.fin !== null,
    interrompue: session.interrompue === 1,
    sousTestsPrevus: ordre.length,
    conditionsReelles: Boolean(session.conditions_reelles),
    papier: session.papier === 1,
    coupureMs: session.coupure_ms,
    partAnnales: part,
    nature,
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
  papier: boolean
  /** Coupure au-delà de la tolérance : hors conditions réelles. */
  horsDelai: boolean
  nature: NatureEpreuve
}

export function historiqueEpreuves(limite = 10): LigneHistorique[] {
  return db()
    .prepare(
      `SELECT s.id AS sessionId, s.type, s.debut, s.score_echelle AS scoreEchelle,
              s.conditions_reelles AS conditionsReelles, s.papier, s.coupure_ms AS coupureMs,
              (SELECT COUNT(*) FROM attempt a WHERE a.session_id = s.id) AS n
         FROM exam_session s
        WHERE s.exam_id = 'tagemage' AND s.type IN ('blanc', 'diagnostic') AND s.fin IS NOT NULL
        ORDER BY s.id DESC
        LIMIT ?`,
    )
    .all(limite)
    .map((r) => {
      const l = r as Omit<LigneHistorique, 'conditionsReelles' | 'papier' | 'horsDelai' | 'nature'> & {
        conditionsReelles: number
        papier: number
        coupureMs: number
      }
      const { coupureMs, ...reste } = l
      return {
        ...reste,
        conditionsReelles: Boolean(l.conditionsReelles),
        papier: l.papier === 1,
        horsDelai: coupureMs > COUPURE_TOLEREE_MS,
        nature: natureDe(partAnnales(l.sessionId)),
      }
    })
}
