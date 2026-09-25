import { db, diagnosticDe } from './queries'
import { lireCases, lireFigure } from '@/core/figures/lire'
import type { Case, Figure } from '@/core/figures/types'
import { PAR_SKILL } from '@/exams/tagemage/lecons'
import { SECTIONS_PAR_ID } from '@/exams/tagemage'

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
  /** Disposition dessinée de l'énoncé, pour les questions graphiques. */
  figure: Figure | null
  /** Les cinq propositions dessinées, dans l'ordre de `options`. */
  optionsFigure: Case[] | null
  /** L'image d'une question tirée d'une annale, quand l'énoncé en est une. */
  imageHash: string | null
  /** Vrai pour une question d'annale : sa correction est celle du corrigé officiel. */
  annale: boolean
}

export interface FiltreCarnet {
  section?: string
  /** Par défaut les questions comprises sont masquées : le carnet est une pile à vider. */
  inclureComprises?: boolean
  limite?: number
}

/**
 * Les questions ratées, la plus récemment ratée en tête.
 *
 * L'ordre n'est pas le nombre d'échecs mais la fraîcheur : une erreur d'hier se
 * corrige encore, une erreur d'il y a six semaines a déjà été recouverte par
 * autre chose. Le nombre d'échecs est affiché, pas utilisé pour trier.
 */
export function entreesCarnet(f: FiltreCarnet = {}): EntreeCarnet[] {
  const conditions = [`i.exam_id = 'tagemage'`]
  const params: unknown[] = []

  if (f.section) {
    conditions.push('i.section = ?')
    params.push(f.section)
  }
  if (!f.inclureComprises) conditions.push('c.compris_le IS NULL')

  const lignes = db()
    .prepare(
      `SELECT i.id, i.section, i.skill_id, i.enonce, i.type_item, i.options,
              i.info_1, i.info_2, i.bonne_reponse, i.explication_reference, i.diagnostics,
              i.figure, i.options_figure, i.tags,
              m.hash_script AS image_hash,
              c.note, c.compris_le,
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
        ORDER BY dernier_echec DESC, i.id DESC
        LIMIT ?`,
    )
    .all(...params, f.limite ?? 200) as Array<Record<string, unknown>>

  return lignes.map((l) => {
    const skillId = (l.skill_id as string) ?? null
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
      figure: lireFigure(l.figure),
      optionsFigure: lireCases(l.options_figure),
      imageHash: (l.image_hash as string) ?? null,
      annale: l.tags === 'annale',
    }
  })
}

export interface ResumeCarnet {
  aTravailler: number
  comprises: number
  parSection: Array<{ section: string; libelle: string; n: number }>
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

  return {
    aTravailler,
    comprises,
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
    d.prepare(`DELETE FROM carnet_note WHERE item_id = ? AND note IS NULL AND compris_le IS NULL`).run(
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
  d.prepare(`DELETE FROM carnet_note WHERE item_id = ? AND note IS NULL AND compris_le IS NULL`).run(
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
export function itemsARejouer(section: string | null, taille: number): number[] {
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
        GROUP BY i.id
       HAVING ratés > 0
        ORDER BY ratés DESC, RANDOM()
        LIMIT ?`,
    )
    .all(...(section ? [section] : []), taille) as Array<{ id: number }>

  return lignes.map((l) => l.id)
}
