import { db, diagnosticDe } from './queries'
import { lireCases, lireFigure } from '@/core/figures/lire'
import type { Case, Figure } from '@/core/figures/types'
import { PAR_SKILL } from '@/exams/tagemage/lecons'
import { SECTIONS_PAR_ID } from '@/exams/tagemage'
import { estDue, etatReprise, type EtatReprise } from '@/core/scheduler/reprise'
import { LIBELLE_CAUSE, type CauseErreur } from '@/core/stats/causes'

/**
 * Le carnet d'erreurs.
 *
 * Il ne stocke rien de ce qui est déjà connu : une entrée du carnet EST une
 * question qui compte au moins un échec ou un saut dans `attempt`. La table
 * `carnet_note` ne porte que ce que l'utilisateur ajoute — sa note, et la date
 * à laquelle il déclare avoir compris.
 *
 * Deux décisions qui gouvernent tout le reste :
 *
 * 1. Une question réussie depuis ne sort PAS du carnet. Réussir une fois n'est
 *    pas comprendre, et ce n'est pas au programme d'en décider : elle reste
 *    visible, signalée « réussie depuis », jusqu'à ce qu'on la coche.
 * 2. Un saut compte comme une erreur. Sauter est une bonne décision en épreuve,
 *    mais la question reste une question qu'on ne savait pas traiter — et c'est
 *    précisément ce qu'un carnet doit rappeler.
 */
export interface EntreeCarnet {
  itemId: number
  section: string
  sectionLibelle: string
  skillId: string | null
  /** Le titre de la leçon correspondante, pour y renvoyer d'un clic. */
  leconTitre: string | null
  enonce: string
  typeItem: 'qcm' | 'conditions_minimales'
  options: string[]
  info1: string | null
  info2: string | null
  bonneReponse: string
  /** La dernière mauvaise réponse donnée. Null si la question n'a été que sautée. */
  derniereReponse: string | null
  /** Ce que valait cette proposition, quand le générateur l'a nommée. */
  diagnostic: string | null
  explication: string | null
  nbEchecs: number
  nbSauts: number
  nbReussites: number
  dernierEchec: string
  /** Vrai si la dernière tentative, quelle qu'elle soit, était juste. */
  reussieDepuis: boolean
  note: string | null
  comprisLe: string | null
  /** Cause déclarée de l'erreur (migration 021). */
  cause: CauseErreur | null
  /** Reprise espacée : J+1, J+3, J+7 après la dernière erreur. */
  reprise: EtatReprise
  /** La reprise est due aujourd'hui ou avant. */
  aRejouer: boolean
  /** Disposition dessinée de l'énoncé, pour les questions graphiques. */
  figure: Figure | null
  /** Les cinq propositions dessinées, dans l'ordre de `options`. */
  optionsFigure: Case[] | null
  /** L'image d'une question tirée d'une annale, quand l'énoncé en est une. */
  imageHash: string | null
  /** Vrai pour une question d'annale : sa correction est celle du corrigé officiel. */
  annale: boolean
}

export type OrdreCarnet = 'priorite' | 'recentes'

export { CAUSES, LIBELLE_CAUSE, type CauseErreur } from '@/core/stats/causes'

export interface FiltreCarnet {
  section?: string
  /** Un seul type de question : ce qui revient le plus se travaille d'un bloc. */
  skillId?: string
  /** Une seule cause déclarée. */
  cause?: CauseErreur
  /** Seulement les questions dont la reprise espacée est due. */
  dues?: boolean
  /**
   * 'priorite' (par défaut) : d'abord ce qui n'a pas été réussi depuis, puis ce
   * qui a été raté le plus souvent, puis le plus récent. 'recentes' : la plus
   * récemment ratée en tête.
   */
  ordre?: OrdreCarnet
  /** Par défaut les questions comprises sont masquées : le carnet est une pile à vider. */
  inclureComprises?: boolean
  limite?: number
}

/**
 * Les questions ratées, dans l'ordre demandé.
 *
 * Par défaut, la priorité : 216 questions présentées de la plus récente à la
 * plus ancienne ne disaient pas par où commencer. Une question pas encore
 * réussie depuis passe devant une question rattrapée ; à égalité, celle qui
 * résiste le plus (échecs + sauts) ; puis la fraîcheur, parce qu'une erreur
 * d'hier se corrige encore. L'ordre « récentes » reste disponible.
 */
export function entreesCarnet(f: FiltreCarnet = {}): EntreeCarnet[] {
  const conditions = [`i.exam_id = 'tagemage'`]
  const params: unknown[] = []

  if (f.section) {
    conditions.push('i.section = ?')
    params.push(f.section)
  }
  if (f.skillId) {
    conditions.push('i.skill_id = ?')
    params.push(f.skillId)
  }
  if (f.cause) {
    conditions.push('c.cause = ?')
    params.push(f.cause)
  }
  if (!f.inclureComprises) conditions.push('c.compris_le IS NULL')

  const lignes = db()
    .prepare(
      `SELECT i.id, i.section, i.skill_id, i.enonce, i.type_item, i.options,
              i.info_1, i.info_2, i.bonne_reponse, i.explication_reference, i.diagnostics,
              i.figure, i.options_figure, i.tags,
              m.hash_script AS image_hash,
              c.note, c.compris_le, c.cause,
              date(MAX(a.created_at), 'localtime')                                  AS derniere_tentative,
              (SELECT COUNT(*) FROM attempt r
                WHERE r.item_id = i.id AND r.est_correct = 1
                  AND r.created_at > (SELECT MAX(e.created_at) FROM attempt e
                                       WHERE e.item_id = i.id AND e.est_correct = 0))  AS reussites_depuis,
              SUM(CASE WHEN a.est_correct = 0 AND a.a_saute = 0 THEN 1 ELSE 0 END) AS echecs,
              SUM(CASE WHEN a.a_saute = 1 THEN 1 ELSE 0 END)                       AS sauts,
              SUM(CASE WHEN a.est_correct = 1 THEN 1 ELSE 0 END)                   AS reussites,
              MAX(CASE WHEN a.est_correct = 0 THEN a.created_at END)               AS dernier_echec,
              (SELECT d.reponse_donnee FROM attempt d
                WHERE d.item_id = i.id AND d.est_correct = 0 AND d.reponse_donnee IS NOT NULL
                ORDER BY d.id DESC LIMIT 1)                                        AS derniere_reponse,
              (SELECT d.est_correct FROM attempt d
                WHERE d.item_id = i.id ORDER BY d.id DESC LIMIT 1)                 AS dernier_juste
         FROM item i
         JOIN attempt a         ON a.item_id = i.id
         LEFT JOIN carnet_note c ON c.item_id = i.id
         LEFT JOIN media m       ON m.id = i.media_id AND m.type = 'image'
        WHERE ${conditions.join(' AND ')}
        GROUP BY i.id
       HAVING echecs + sauts > 0
        ORDER BY ${
          f.ordre === 'recentes'
            ? 'dernier_echec DESC, i.id DESC'
            : 'dernier_juste ASC, (echecs + sauts) DESC, dernier_echec DESC, i.id DESC'
        }
        LIMIT ?`,
    )
    .all(...params, f.limite ?? 200) as Array<Record<string, unknown>>

  const aujourdhui = new Date().toLocaleDateString('sv-SE')
  const toutes = lignes.map((l) => {
    const skillId = (l.skill_id as string) ?? null
    const reprise = etatReprise(l.derniere_tentative as string, Number(l.reussites_depuis ?? 0))
    return {
      itemId: l.id as number,
      section: l.section as string,
      sectionLibelle: SECTIONS_PAR_ID.get(l.section as never)?.libelle ?? (l.section as string),
      skillId,
      leconTitre: skillId ? (PAR_SKILL.get(skillId)?.titre ?? null) : null,
      enonce: l.enonce as string,
      typeItem: l.type_item as 'qcm' | 'conditions_minimales',
      options: l.options ? (JSON.parse(l.options as string) as string[]) : [],
      info1: (l.info_1 as string) ?? null,
      info2: (l.info_2 as string) ?? null,
      bonneReponse: l.bonne_reponse as string,
      derniereReponse: (l.derniere_reponse as string) ?? null,
      diagnostic: diagnosticDe(l.diagnostics, (l.derniere_reponse as string) ?? null),
      explication: (l.explication_reference as string) ?? null,
      nbEchecs: Number(l.echecs ?? 0),
      nbSauts: Number(l.sauts ?? 0),
      nbReussites: Number(l.reussites ?? 0),
      dernierEchec: l.dernier_echec as string,
      reussieDepuis: Boolean(l.dernier_juste),
      note: (l.note as string) ?? null,
      comprisLe: (l.compris_le as string) ?? null,
      cause: (l.cause as CauseErreur) ?? null,
      reprise,
      aRejouer: estDue(reprise, aujourdhui),
      figure: lireFigure(l.figure),
      optionsFigure: lireCases(l.options_figure),
      imageHash: (l.image_hash as string) ?? null,
      annale: l.tags === 'annale',
    }
  })

  return f.dues ? toutes.filter((e) => e.aRejouer) : toutes
}

export interface ResumeCarnet {
  aTravailler: number
  comprises: number
  parSection: Array<{ section: string; libelle: string; n: number }>
  /** Les types de question qui reviennent le plus dans ce qui reste à revoir. */
  parType: Array<{ skillId: string; libelle: string; section: string; n: number }>
  /** Erreurs par cause déclarée, pour les questions restant à revoir. */
  parCause: Array<{ cause: CauseErreur; libelle: string; n: number }>
  /** Questions dont la reprise espacée est due aujourd'hui. */
  aRejouerAujourdhui: number
}

/** De quoi afficher un compteur sans charger tout le carnet. */
export function resumeCarnet(): ResumeCarnet {
  const lignes = db()
    .prepare(
      `SELECT i.section, c.compris_le IS NOT NULL AS compris, COUNT(DISTINCT i.id) AS n
         FROM item i
         JOIN attempt a          ON a.item_id = i.id
         LEFT JOIN carnet_note c ON c.item_id = i.id
        WHERE i.exam_id = 'tagemage' AND (a.est_correct = 0 OR a.a_saute = 1)
        GROUP BY i.section, compris`,
    )
    .all() as Array<{ section: string; compris: number; n: number }>

  const parSection = new Map<string, number>()
  let aTravailler = 0
  let comprises = 0

  for (const l of lignes) {
    if (l.compris) {
      comprises += l.n
      continue
    }
    aTravailler += l.n
    parSection.set(l.section, (parSection.get(l.section) ?? 0) + l.n)
  }

  const parType = db()
    .prepare(
      `SELECT i.skill_id AS skillId, k.libelle, i.section, COUNT(DISTINCT i.id) AS n
         FROM item i
         JOIN attempt a          ON a.item_id = i.id
         JOIN skill k            ON k.id = i.skill_id
         LEFT JOIN carnet_note c ON c.item_id = i.id
        WHERE i.exam_id = 'tagemage' AND (a.est_correct = 0 OR a.a_saute = 1)
          AND c.compris_le IS NULL
        GROUP BY i.skill_id
        ORDER BY n DESC
        LIMIT 8`,
    )
    .all() as ResumeCarnet['parType']

  const parCause = (
    db()
      .prepare(
        `SELECT cause, COUNT(*) AS n FROM carnet_note
          WHERE cause IS NOT NULL AND compris_le IS NULL
          GROUP BY cause ORDER BY n DESC`,
      )
      .all() as Array<{ cause: CauseErreur; n: number }>
  ).map((r) => ({ ...r, libelle: LIBELLE_CAUSE[r.cause] }))

  const aRejouerAujourdhui = entreesCarnet({ limite: 1000 }).filter((e) => e.aRejouer).length

  return {
    aTravailler,
    comprises,
    parType,
    parCause,
    aRejouerAujourdhui,
    parSection: [...parSection.entries()]
      .map(([section, n]) => ({
        section,
        libelle: SECTIONS_PAR_ID.get(section as never)?.libelle ?? section,
        n,
      }))
      .sort((a, b) => b.n - a.n),
  }
}

/** Écrit la note personnelle. Une note vide efface la ligne plutôt que d'y laisser du blanc. */
export function noterItem(itemId: number, note: string): void {
  const propre = note.trim()
  const d = db()

  if (!propre) {
    d.prepare(
      `UPDATE carnet_note SET note = NULL, maj_le = datetime('now') WHERE item_id = ?`,
    ).run(itemId)
    d.prepare(`DELETE FROM carnet_note WHERE item_id = ? AND note IS NULL AND compris_le IS NULL AND cause IS NULL`).run(
      itemId,
    )
    return
  }

  d.prepare(
    `INSERT INTO carnet_note (item_id, note) VALUES (?, ?)
     ON CONFLICT (item_id) DO UPDATE SET note = excluded.note, maj_le = datetime('now')`,
  ).run(itemId, propre)
}

/** Marque une question comprise, ou la remet dans la pile. */
export function marquerCompris(itemId: number, compris: boolean): void {
  const d = db()

  if (compris) {
    d.prepare(
      `INSERT INTO carnet_note (item_id, compris_le) VALUES (?, datetime('now'))
       ON CONFLICT (item_id) DO UPDATE SET compris_le = datetime('now'), maj_le = datetime('now')`,
    ).run(itemId)
    return
  }

  d.prepare(
    `UPDATE carnet_note SET compris_le = NULL, maj_le = datetime('now') WHERE item_id = ?`,
  ).run(itemId)
  // Une ligne qui ne porte plus rien n'a pas à rester.
  d.prepare(`DELETE FROM carnet_note WHERE item_id = ? AND note IS NULL AND compris_le IS NULL AND cause IS NULL`).run(
    itemId,
  )
}

/**
 * Les questions à rejouer, pour une série tirée du carnet.
 *
 * On sert d'abord celles qu'on a ratées le plus souvent : contrairement à la
 * lecture du carnet, où la fraîcheur prime, une série de rattrapage doit
 * attaquer ce qui résiste.
 */
export function itemsARejouer(
  section: string | null,
  taille: number,
  skillId: string | null = null,
): number[] {
  const lignes = db()
    .prepare(
      `SELECT i.id,
              SUM(CASE WHEN a.est_correct = 0 OR a.a_saute = 1 THEN 1 ELSE 0 END) AS ratés
         FROM item i
         JOIN attempt a          ON a.item_id = i.id
         LEFT JOIN carnet_note c ON c.item_id = i.id
        WHERE i.exam_id = 'tagemage' AND i.statut = 'valide'
          AND c.compris_le IS NULL
          ${section ? 'AND i.section = ?' : ''}
          ${skillId ? 'AND i.skill_id = ?' : ''}
        GROUP BY i.id
       HAVING ratés > 0
        ORDER BY ratés DESC, RANDOM()`,
    )
    .all(...(section ? [section] : []), ...(skillId ? [skillId] : [])) as Array<{
    id: number
  }>

  // Les reprises espacées dues passent devant : c'est leur jour. Le reste
  // garde l'ordre « ce qui résiste le plus ».
  const dues = new Set(
    entreesCarnet({
      section: section ?? undefined,
      skillId: skillId ?? undefined,
      dues: true,
      limite: 1000,
    }).map((e) => e.itemId),
  )
  return [...lignes.filter((l) => dues.has(l.id)), ...lignes.filter((l) => !dues.has(l.id))]
    .slice(0, taille)
    .map((l) => l.id)
}

/** Déclare (ou retire) la cause d'une erreur. */
export function declarerCause(itemId: number, cause: CauseErreur | null): void {
  const d = db()
  if (cause === null) {
    d.prepare(`UPDATE carnet_note SET cause = NULL, maj_le = datetime('now') WHERE item_id = ?`).run(itemId)
    d.prepare(
      `DELETE FROM carnet_note WHERE item_id = ? AND note IS NULL AND compris_le IS NULL AND cause IS NULL`,
    ).run(itemId)
    return
  }
  d.prepare(
    `INSERT INTO carnet_note (item_id, cause) VALUES (?, ?)
     ON CONFLICT (item_id) DO UPDATE SET cause = excluded.cause, maj_le = datetime('now')`,
  ).run(itemId, cause)
}
