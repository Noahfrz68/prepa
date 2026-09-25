import { getDb } from './client'
import { seed } from './seed'
import { SECTIONS, type SectionTageMage } from '@/exams/tagemage'
import { issueDe, pointsDe, resultatSerie, type Issue } from '@/core/scoring/tagemage'
import { lireCases, lireFigure } from '@/core/figures/lire'
import type { Case, Figure } from '@/core/figures/types'
import { itemsComprehensionGroupes } from './selection'
import type { ItemParse } from '@/core/import/parse'
import { ErreurRequete } from '@/core/erreurs'
import { tempsBorne, verifierSessionOuverte } from './garde'
import { normaliserMultiplication, normaliserMultiplicationSi } from '@/core/import/typographie'

let amorce = false

/** Ouvre la base, applique les migrations et sème la taxonomie, une seule fois. */
export function db() {
  const d = getDb()
  if (!amorce) {
    seed()
    amorce = true
  }
  return d
}

/* ------------------------------------------------------------- Accueil -- */

export interface EtatExamen {
  examId: string
  libelle: string
  nbItems: number
  nbTentatives: number
  dateExamen: string | null
  dateProvisoire: boolean
  scoreCible: number | null
  scoreEstime: number | null
  joursRestants: number | null
  motif: string | null
}

export function etatExamens(): EtatExamen[] {
  const d = db()
  const libelles: Record<string, string> = {
    tagemage: 'TAGE MAGE',
    toeic_lr: 'TOEIC',
  }

  const lignes = d
    .prepare(
      `SELECT g.exam_id,
              g.date_examen,
              g.date_provisoire,
              g.score_cible,
              g.score_estime_courant,
              g.motif,
              (SELECT COUNT(*) FROM item i
                WHERE i.exam_id = g.exam_id AND i.statut = 'valide')      AS nb_items,
              (SELECT COUNT(*) FROM attempt a
                JOIN exam_session s ON s.id = a.session_id
                WHERE s.exam_id = g.exam_id)                              AS nb_tentatives
         FROM exam_goal g
        WHERE g.actif = 1
        ORDER BY g.exam_id = 'tagemage' DESC`,
    )
    .all() as Array<Record<string, unknown>>

  return lignes.map((l) => {
    const dateExamen = (l.date_examen as string) ?? null
    return {
      examId: l.exam_id as string,
      libelle: libelles[l.exam_id as string] ?? (l.exam_id as string),
      nbItems: l.nb_items as number,
      nbTentatives: l.nb_tentatives as number,
      dateExamen,
      dateProvisoire: Boolean(l.date_provisoire),
      scoreCible: (l.score_cible as number) ?? null,
      scoreEstime: (l.score_estime_courant as number) ?? null,
      joursRestants: dateExamen ? joursJusqua(dateExamen) : null,
      motif: (l.motif as string) ?? null,
    }
  })
}

export interface Objectif {
  examId: string
  dateExamen: string | null
  dateProvisoire: boolean
  scoreCible: number | null
  motif: string | null
}

export function enregistrerObjectif(o: Objectif): void {
  db()
    .prepare(
      `UPDATE exam_goal
          SET date_examen     = @dateExamen,
              date_provisoire = @dateProvisoire,
              score_cible     = @scoreCible,
              motif           = COALESCE(@motif, motif)
        WHERE exam_id = @examId`,
    )
    .run({
      examId: o.examId,
      dateExamen: o.dateExamen,
      dateProvisoire: o.dateProvisoire ? 1 : 0,
      scoreCible: o.scoreCible,
      motif: o.motif,
    })
}

export function profil(): { heuresDispoSemaine: number | null } {
  const r = db()
    .prepare(`SELECT heures_dispo_semaine FROM user_profile WHERE id = 1`)
    .get() as { heures_dispo_semaine: number | null } | undefined
  return { heuresDispoSemaine: r?.heures_dispo_semaine ?? null }
}

export function enregistrerProfil(heuresDispoSemaine: number | null): void {
  db()
    .prepare(`UPDATE user_profile SET heures_dispo_semaine = ? WHERE id = 1`)
    .run(heuresDispoSemaine)
}

function joursJusqua(iso: string): number {
  const jour = 24 * 60 * 60 * 1000
  const cible = new Date(`${iso}T00:00:00`).getTime()
  const aujourdhui = new Date(new Date().toDateString()).getTime()
  return Math.round((cible - aujourdhui) / jour)
}

/* -------------------------------------------------- Sections TAGE MAGE -- */

export interface EtatSection {
  id: SectionTageMage
  numero: number
  libelle: string
  bloc: string
  typeItem: 'qcm' | 'conditions_minimales'
  nbItems: number
  nbTentatives: number
  tauxReussite: number | null
}

export function etatSectionsTageMage(): EtatSection[] {
  const d = db()

  const comptes = d
    .prepare(
      `SELECT i.section,
              COUNT(DISTINCT i.id)                                    AS nb_items,
              COUNT(a.id)                                             AS nb_tentatives,
              -- Réussite = bonnes réponses / questions servies, sauts compris :
              -- sans pénalité, un saut rapporte 0 comme une erreur. C'est la
              -- même définition partout (voir mesuresParSkill). Toutes les
              -- réponses comptent, y compris celles données sur une question
              -- retirée depuis : ce qui a été répondu a été mesuré.
              (SELECT AVG(r.est_correct)
                 FROM attempt r JOIN item j ON j.id = r.item_id
                WHERE j.exam_id = 'tagemage' AND j.section = i.section)  AS taux
         FROM item i
         LEFT JOIN attempt a ON a.item_id = i.id
        WHERE i.exam_id = 'tagemage' AND i.statut = 'valide'
        GROUP BY i.section`,
    )
    .all() as Array<{ section: string; nb_items: number; nb_tentatives: number; taux: number | null }>

  const parSection = new Map(comptes.map((c) => [c.section, c]))

  return SECTIONS.map((s) => {
    const c = parSection.get(s.id)
    return {
      id: s.id,
      numero: s.numero,
      libelle: s.libelle,
      bloc: s.bloc,
      typeItem: s.typeItem,
      nbItems: c?.nb_items ?? 0,
      nbTentatives: c?.nb_tentatives ?? 0,
      tauxReussite: c?.taux ?? null,
    }
  })
}

/**
 * Ce qui a été mesuré sur chaque sous-compétence, sans seuil ni mise en forme.
 *
 * Sert au cours : une leçon qui affiche le taux de son propre type de question
 * dit à l'élève si elle le concerne.
 *
 * Les sauts COMPTENT dans le taux. Ils en étaient exclus du temps de la
 * pénalité, où sauter pouvait être la bonne décision ; depuis, un saut
 * rapporte 0 comme une erreur, et le hub, le plan et la stratégie
 * affichaient trois taux différents pour le même sous-test selon qu'ils les
 * comptaient ou non. Une seule définition désormais : bonnes réponses sur
 * questions servies.
 */
export function mesuresParSkill(examId = 'tagemage'): Map<string, { n: number; justes: number }> {
  const lignes = db()
    .prepare(
      `SELECT i.skill_id AS skill, COUNT(*) AS n, SUM(a.est_correct) AS justes
         FROM attempt a
         JOIN item i         ON i.id = a.item_id
         JOIN exam_session s ON s.id = a.session_id
        WHERE s.exam_id = ? AND i.skill_id IS NOT NULL
        GROUP BY i.skill_id`,
    )
    .all(examId) as Array<{ skill: string; n: number; justes: number }>

  return new Map(lignes.map((l) => [l.skill, { n: l.n, justes: l.justes }]))
}

/**
 * Combien de questions d'ANNALE la banque contient pour chaque sous-compétence.
 *
 * Sert à dire au lecteur ce qui est adossé à de vraies questions du concours et
 * ce qui ne l'est pas. Les leçons ont été écrites de mémoire du concours, pas
 * d'une observation : sur les types dont la banque ne contient aucun exemplaire
 * réel, la pondération annoncée n'engage que celui qui l'a écrite. Le taire
 * serait plus confortable et moins honnête.
 *
 * Les questions engendrées sont exclues : elles sortent du même auteur que les
 * leçons, elles ne prouvent donc rien.
 */
export function temoinsAnnale(examId = 'tagemage'): Map<string, number> {
  const lignes = db()
    .prepare(
      `SELECT skill_id AS skill, COUNT(*) AS n
         FROM item
        WHERE exam_id = ? AND source <> 'genere' AND skill_id IS NOT NULL
        GROUP BY skill_id`,
    )
    .all(examId) as Array<{ skill: string; n: number }>

  return new Map(lignes.map((l) => [l.skill, l.n]))
}

export function skillsDeSection(examId: string, section: string) {
  return db()
    .prepare(
      `SELECT id, libelle FROM skill
        WHERE exam_id = ? AND section = ?
        ORDER BY ordre`,
    )
    .all(examId, section) as Array<{ id: string; libelle: string }>
}

/* ---------------------------------------------------------------- Drill -- */

export interface ItemDrill {
  id: number
  typeItem: 'qcm' | 'conditions_minimales'
  enonce: string
  contexteTexte: string | null
  info1: string | null
  info2: string | null
  options: string[]
  /** Figure rattachée, pour les questions à énoncé graphique. */
  imageHash: string | null
  /** Disposition dessinée de l'énoncé, pour les questions graphiques. */
  figure: Figure | null
  /** Les cinq propositions dessinées, dans l'ordre de `options`. */
  optionsFigure: Case[] | null
}

/**
 * Constitue une série. `item.bonne_reponse` n'est délibérément PAS renvoyé :
 * il ne quitte le serveur qu'une fois la tentative enregistrée
 * (critère d'acceptation : la bonne réponse ne fuite jamais vers le client).
 *
 * Priorise les items jamais vus, puis les moins vus.
 */
export function demarrerDrill(
  section: string,
  taille: number,
  skillIds: string[] = [],
  /**
   * Questions imposées, dans cet ordre — le carnet d'erreurs s'en sert pour
   * rejouer exactement ce qui a été raté. Quand elle est fournie, la liste
   * court-circuite le tirage : ni filtre de sous-compétence, ni priorité aux
   * questions jamais vues, qui écarteraient précisément ce qu'on veut revoir.
   */
  itemIds: number[] = [],
): { sessionId: number; items: ItemDrill[] } {
  const d = db()

  // Le plan de révision nomme des sous-compétences précises : sans ce filtre,
  // « lancer » depuis le plan servirait tout le sous-test et ne travaillerait
  // pas ce qui est dû.
  const filtreSkills = skillIds.length > 0 ? `AND i.skill_id IN (${skillIds.map(() => '?').join(',')})` : ''

  // La compréhension se tire par TEXTES complets, comme à l'épreuve : trois
  // textes de cinq questions plutôt que quinze passages à lire. L'exception
  // assumée est le travail ciblé — carnet d'erreurs, ou révision d'un seul type
  // de question — où l'on accepte une question sous son texte, faute de pouvoir
  // réunir cinq questions du même type sur le même passage.
  const cible =
    itemIds.length === 0 && section === 'comprehension' && skillIds.length === 0
      ? itemsComprehensionGroupes(taille)
      : itemIds

  const impose = cible.length > 0

  const lignes = impose
    ? (d
        .prepare(
          `SELECT i.id, i.type_item, i.enonce, i.contexte_texte, i.info_1, i.info_2, i.options,
                  i.figure, i.options_figure,
                  m.hash_script AS imageHash
             FROM item i
             LEFT JOIN media m ON m.id = i.media_id AND m.type = 'image'
            WHERE i.id IN (${cible.map(() => '?').join(',')})`,
        )
        .all(...cible) as Array<Record<string, unknown>>)
    : (d
        .prepare(
          `SELECT i.id, i.type_item, i.enonce, i.contexte_texte, i.info_1, i.info_2, i.options,
                  i.figure, i.options_figure,
                  m.hash_script AS imageHash,
                  (SELECT COUNT(*) FROM attempt a WHERE a.item_id = i.id) AS vu
             FROM item i
             LEFT JOIN media m ON m.id = i.media_id AND m.type = 'image'
            WHERE i.exam_id = 'tagemage' AND i.section = ? AND i.statut = 'valide' ${filtreSkills}
            ORDER BY vu ASC, RANDOM()
            LIMIT ?`,
        )
        .all(section, ...skillIds, taille) as Array<Record<string, unknown>>)

  // `IN (…)` rend les lignes dans l'ordre de la table : on rétablit l'ordre demandé.
  if (impose) {
    const rang = new Map(cible.map((id, i) => [id, i]))
    lignes.sort((a, b) => (rang.get(a.id as number) ?? 0) - (rang.get(b.id as number) ?? 0))
  }

  if (lignes.length === 0) {
    throw new ErreurRequete(
      impose
        ? 'Aucune question à rejouer : le carnet est vide pour ce filtre.'
        : skillIds.length > 0
          ? `Aucune question en banque pour les sous-compétences visées dans « ${section} ».`
          : `Aucun item disponible pour la section « ${section} ».`,
    )
  }

  const info = d
    .prepare(
      `INSERT INTO exam_session (exam_id, type, sections) VALUES ('tagemage', 'drill', ?)`,
    )
    .run(JSON.stringify([section]))

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

  return { sessionId: Number(info.lastInsertRowid), items }
}

export interface EnregistrerTentative {
  sessionId: number
  itemId: number
  reponse: string | null
  aSaute: boolean
  tempsMs: number
  confiance: number
  /**
   * Temps de LECTURE du texte support, pour la compréhension.
   *
   * Il est commun aux cinq questions d'un même texte et ne doit pas gonfler le
   * temps de la première : sans cette séparation, toute question ouvrant un
   * passage passerait pour un puits de temps. Porté par la première question du
   * groupe seulement, nul ailleurs.
   */
  tempsPreparationMs?: number | null
}

export function enregistrerTentative(t: EnregistrerTentative): void {
  const d = db()

  verifierSessionOuverte(d, t.sessionId)

  const item = d.prepare(`SELECT bonne_reponse FROM item WHERE id = ?`).get(t.itemId) as
    | { bonne_reponse: string }
    | undefined
  if (!item) throw new ErreurRequete(`Question ${t.itemId} introuvable.`, 404)

  const issue: Issue = t.aSaute ? 'blanc' : issueDe(t.reponse, item.bonne_reponse)

  d.prepare(
    `INSERT INTO attempt
       (session_id, item_id, reponse_donnee, est_correct, a_saute, motif_blanc,
        temps_ms, temps_preparation_ms, confiance, points_gagnes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     -- Un renvoi après une coupure ne doit pas compter deux fois (migration 016).
     ON CONFLICT (session_id, item_id) DO NOTHING`,
  ).run(
    t.sessionId,
    t.itemId,
    t.aSaute ? null : t.reponse,
    issue === 'juste' ? 1 : 0,
    t.aSaute ? 1 : 0,
    // Dans le drill, tout saut est délibéré : il n'y a pas de couperet horaire.
    t.aSaute ? 'saute' : null,
    tempsBorne(t.tempsMs),
    t.tempsPreparationMs == null ? null : tempsBorne(t.tempsPreparationMs),
    t.confiance,
    pointsDe(issue),
  )
}

export interface Correction {
  itemId: number
  enonce: string
  typeItem: 'qcm' | 'conditions_minimales'
  options: string[]
  info1: string | null
  info2: string | null
  bonneReponse: string
  reponseDonnee: string | null
  aSaute: boolean
  estCorrect: boolean
  tempsMs: number
  confiance: number
  points: number
  /** La démarche complète. Servie quand la question est fausse ou sautée. */
  explication: string | null
  /** Une ligne. Servie quand la question est juste. */
  rappel: string | null
  /** Ce que valait la proposition cochée, quand elle est nommée. */
  diagnostic: string | null
  /** La sous-compétence, pour renvoyer vers la leçon qui l’explique. */
  skillId: string | null
  /** Disposition dessinée de l'énoncé, pour les questions graphiques. */
  figure: Figure | null
  /** Les cinq propositions dessinées, dans l'ordre de `options`. */
  optionsFigure: Case[] | null
}

/**
 * Le diagnostic de la proposition cochée, s'il en existe un.
 *
 * `diagnostics` est un objet lettre → phrase, écrit par le générateur. Il n'y
 * a pas toujours d'entrée : les propositions de remplissage ne correspondent à
 * aucune erreur de méthode, et inventer une explication pour elles serait pire
 * que se taire. Le JSON est lu défensivement — une ligne écrite à la main peut
 * porter n'importe quoi, et une correction ne doit jamais faire tomber une page.
 */
export function diagnosticDe(brut: unknown, lettre: string | null): string | null {
  if (typeof brut !== 'string' || !lettre) return null
  try {
    const table = JSON.parse(brut) as Record<string, unknown>
    const d = table?.[lettre]
    return typeof d === 'string' && d.trim() ? d : null
  } catch {
    return null
  }
}

export interface RecapSerie {
  resultat: ReturnType<typeof resultatSerie>
  tempsTotalMs: number
  corrections: Correction[]
}

/** Clôt la session, calcule le score, et libère enfin les corrections. */
export function terminerDrill(sessionId: number): RecapSerie {
  const d = db()

  const lignes = d
    .prepare(
      `SELECT a.item_id, a.reponse_donnee, a.est_correct, a.a_saute, a.temps_ms,
              a.confiance, a.points_gagnes,
              i.enonce, i.type_item, i.options, i.info_1, i.info_2,
              i.figure, i.options_figure,
              i.bonne_reponse, i.explication_reference, i.rappel, i.diagnostics, i.skill_id
         FROM attempt a
         JOIN item i ON i.id = a.item_id
        WHERE a.session_id = ?
        ORDER BY a.id`,
    )
    .all(sessionId) as Array<Record<string, unknown>>

  const corrections: Correction[] = lignes.map((l) => ({
    itemId: l.item_id as number,
    enonce: l.enonce as string,
    typeItem: l.type_item as 'qcm' | 'conditions_minimales',
    options: l.options ? (JSON.parse(l.options as string) as string[]) : [],
    info1: (l.info_1 as string) ?? null,
    info2: (l.info_2 as string) ?? null,
    bonneReponse: l.bonne_reponse as string,
    reponseDonnee: (l.reponse_donnee as string) ?? null,
    aSaute: Boolean(l.a_saute),
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

  const issues: Issue[] = corrections.map((c) =>
    c.aSaute || c.reponseDonnee === null ? 'blanc' : c.estCorrect ? 'juste' : 'faux',
  )
  const resultat = resultatSerie(issues)
  const tempsTotalMs = corrections.reduce((acc, c) => acc + c.tempsMs, 0)

  d.prepare(
    `UPDATE exam_session
        SET fin = datetime('now'), score_brut = ?, score_echelle = ?
      WHERE id = ? AND fin IS NULL -- idempotent : un renvoi ne réécrit pas la fin
    `,
  ).run(resultat.pointsBruts, resultat.scoreExtrapole, sessionId)

  return { resultat, tempsTotalMs, corrections }
}

/* --------------------------------------------------------------- Import -- */

export interface OptionsImport {
  examId: string
  section: string
  skillId?: string | null
  source: 'importe' | 'saisi' | 'genere_ia'
}

export function insererItems(items: ItemParse[], opts: OptionsImport): number {
  const d = db()

  const stmt = d.prepare(`
    INSERT INTO item
      (exam_id, section, skill_id, type_item, enonce, contexte_texte, info_1, info_2,
       options, bonne_reponse, difficulte_estimee, explication_reference, source, statut)
    VALUES
      (@exam_id, @section, @skill_id, @type_item, @enonce, @contexte_texte, @info_1, @info_2,
       @options, @bonne_reponse, @difficulte, @explication, @source, 'valide')
  `)

  const tout = d.transaction((liste: ItemParse[]) => {
    for (const it of liste) {
      stmt.run({
        exam_id: opts.examId,
        section: opts.section,
        skill_id: opts.skillId ?? null,
        type_item: it.typeItem,
        enonce: normaliserMultiplication(it.enonce),
        contexte_texte: it.contexteTexte ?? null,
        info_1: normaliserMultiplicationSi(it.info1) ?? null,
        info_2: normaliserMultiplicationSi(it.info2) ?? null,
        options:
          it.typeItem === 'conditions_minimales'
            ? null
            : JSON.stringify(it.options.map(normaliserMultiplication)),
        bonne_reponse: it.bonneReponse,
        difficulte: it.difficulte ?? null,
        explication: normaliserMultiplicationSi(it.explication) ?? null,
        source: opts.source,
      })
    }
  })

  tout(items)
  return items.length
}
