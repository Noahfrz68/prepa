import { createHash } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { db } from './queries'
import { libelleSection } from './planification'
import type { QuestionPdf } from '@/core/import/pdf'
import { ErreurRequete } from '@/core/erreurs'
import { normaliserMultiplication, normaliserMultiplicationSi } from '@/core/import/typographie'
import { alerteRepartition } from '@/core/import/permutation'

/**
 * Atelier de contenu : relecture, détection d'items suspects, doublons.
 *
 * Le principe P1 dit que le contenu est un consommable. Corollaire : tout ce
 * qui entre doit pouvoir être relu vite, et ce qui se révèle faux à l'usage
 * doit remonter tout seul. Un item faux ne se contente pas d'être inutile : il
 * apprend quelque chose de faux et pollue la calibration.
 */

/* ------------------------------------------------------------- import -- */

export interface ResultatInsertion {
  inseres: number
  doublons: number
  sansReponse: number
}

/**
 * Insère des questions extraites d'un PDF.
 *
 * Statut `a_relire` systématiquement : une extraction automatique n'est jamais
 * servie sans qu'un humain l'ait vue. Les questions dont le corrigé n'a pas
 * livré la réponse sont insérées quand même, avec une réponse vide à
 * compléter — on ne devine pas.
 */
export function insererDepuisPdf(
  questions: QuestionPdf[],
  examId = 'tagemage',
): ResultatInsertion {
  const d = db()

  const existe = d.prepare(
    `SELECT 1 FROM item WHERE exam_id = ? AND section = ? AND enonce = ? LIMIT 1`,
  )

  const inserer = d.prepare(`
    INSERT INTO item
      (exam_id, section, type_item, enonce, contexte_texte, info_1, info_2, options,
       bonne_reponse, explication_reference, source, statut)
    VALUES (@exam, @section, @type, @enonce, @contexte, @info1, @info2, @options,
            @bonne, @explication, 'importe', 'a_relire')
  `)

  let inseres = 0
  let doublons = 0

  const tout = d.transaction((liste: QuestionPdf[]) => {
    for (const brute of liste) {
      // Typographie normalisée AVANT le contrôle de doublon : c'est la forme
      // stockée qu'il faut comparer, sinon réimporter la même annale doublerait.
      const q = {
        ...brute,
        enonce: normaliserMultiplication(brute.enonce),
        info1: normaliserMultiplicationSi(brute.info1),
        info2: normaliserMultiplicationSi(brute.info2),
        options: brute.options.map(normaliserMultiplication),
        explication: normaliserMultiplicationSi(brute.explication),
      }
      if (existe.get(examId, q.section, q.enonce)) {
        doublons++
        continue
      }

      inserer.run({
        exam: examId,
        section: q.section,
        type: q.section === 'conditions_minimales' ? 'conditions_minimales' : 'qcm',
        enonce: q.enonce,
        contexte: q.contexte ?? null,
        info1: q.info1 ?? null,
        info2: q.info2 ?? null,
        // En conditions minimales les cinq propositions sont figées : les
        // stocker serait redondant, l'interface les fournit.
        options: q.options.length > 0 ? JSON.stringify(q.options) : null,
        // Réponse vide plutôt qu'inventée : la relecture la réclamera.
        bonne: q.bonneReponse ?? '',
        explication: q.explication ?? null,
      })
      inseres++
    }
  })

  tout(questions)

  return {
    inseres,
    doublons,
    sansReponse: questions.filter((q) => !q.bonneReponse).length,
  }
}

/**
 * Insère des questions dont l'énoncé est une figure.
 *
 * L'image est stockée comme un média et rattachée à l'item. Une figure sans
 * image n'est pas insérée : un item sans énoncé ni visuel serait inutilisable.
 */
export function insererFigures(
  figures: Array<{
    section: string
    numero: number
    options: string[]
    bonneReponse?: string
    explication?: string
  }>,
  images: Map<string, { png: Buffer; largeur: number; hauteur: number }>,
  examId = 'tagemage',
): { inseres: number; sansImage: number; doublons: number } {
  const d = db()
  const dossier = path.join(process.cwd(), 'data', 'media')
  fs.mkdirSync(dossier, { recursive: true })

  const existe = d.prepare(
    `SELECT 1 FROM item WHERE exam_id = ? AND section = ? AND enonce = ? LIMIT 1`,
  )
  const insererMedia = d.prepare(
    `INSERT INTO media (type, chemin_fichier, transcript, hash_script) VALUES ('image', ?, ?, ?)`,
  )
  const insererItem = d.prepare(`
    INSERT INTO item
      (exam_id, section, type_item, enonce, options, bonne_reponse,
       explication_reference, source, statut, media_id)
    VALUES (@exam, @section, 'qcm', @enonce, @options, @bonne, @explication,
            'importe', 'a_relire', @media)
  `)

  let inseres = 0
  let sansImage = 0
  let doublons = 0

  const tout = d.transaction(() => {
    for (const f of figures) {
      const image = images.get(`${f.section}#${f.numero}`)
      if (!image) {
        sansImage++
        continue
      }

      // L'énoncé textuel n'existe pas : on en fabrique un repère lisible, qui
      // sert aussi de clé de doublon.
      const enonce = `Figure — ${libelleSection(f.section)}, question ${f.numero}`
      if (existe.get(examId, f.section, enonce)) {
        doublons++
        continue
      }

      const hash = createHash('sha256')
        .update(image.png)
        .digest('hex')
        .slice(0, 32)
      const nom = `figure-${hash}.png`
      fs.writeFileSync(path.join(dossier, nom), image.png)

      let mediaId: number
      const dejaLa = d.prepare(`SELECT id FROM media WHERE hash_script = ?`).get(hash) as
        | { id: number }
        | undefined

      if (dejaLa) {
        mediaId = dejaLa.id
      } else {
        mediaId = Number(insererMedia.run(`media/${nom}`, enonce, hash).lastInsertRowid)
      }

      insererItem.run({
        exam: examId,
        section: f.section,
        enonce,
        options: JSON.stringify(f.options),
        bonne: f.bonneReponse ?? '',
        explication: f.explication ?? null,
        media: mediaId,
      })
      inseres++
    }
  })

  tout()
  return { inseres, sansImage, doublons }
}

/* -------------------------------------------------- items suspects -- */

/** Tentatives minimales avant de juger un item aberrant. */
export const TENTATIVES_AVANT_JUGEMENT = 5
export const SEUIL_TROP_DUR = 0.1
export const SEUIL_TROP_FACILE = 0.95

export interface ItemSuspect {
  id: number
  enonce: string
  section: string
  sectionLibelle: string
  n: number
  tauxReussite: number
  raison: string
}

/**
 * Marque comme suspects les items au taux de réussite aberrant.
 *
 * Un item que personne ne réussit est probablement faux ou ambigu ; un item
 * que tout le monde réussit n'apprend rien. Dans les deux cas, il fausse la
 * mesure plus qu'il ne l'alimente. C'est le garde-fou contre les items mal
 * extraits ou mal recopiés — il travaille tout seul, sur les données d'usage.
 */
export function detecterSuspects(examId?: string): ItemSuspect[] {
  const d = db()

  const lignes = d
    .prepare(
      `SELECT i.id, i.enonce, i.section, i.exam_id,
              COUNT(a.id) AS n,
              AVG(a.est_correct) AS taux
         FROM item i
         JOIN attempt a ON a.item_id = i.id AND a.a_saute = 0
        WHERE i.statut = 'valide' ${examId ? 'AND i.exam_id = ?' : ''}
        GROUP BY i.id
       HAVING n >= ?`,
    )
    .all(...(examId ? [examId, TENTATIVES_AVANT_JUGEMENT] : [TENTATIVES_AVANT_JUGEMENT])) as Array<{
    id: number
    enonce: string
    section: string
    n: number
    taux: number
  }>

  const suspects: ItemSuspect[] = []
  const marquer = d.prepare(`UPDATE item SET statut = 'suspect' WHERE id = ?`)

  const tout = d.transaction(() => {
    for (const l of lignes) {
      if (l.taux > SEUIL_TROP_DUR && l.taux < SEUIL_TROP_FACILE) continue

      marquer.run(l.id)
      suspects.push({
        id: l.id,
        enonce: l.enonce,
        section: l.section,
        sectionLibelle: libelleSection(l.section),
        n: l.n,
        tauxReussite: l.taux,
        raison:
          l.taux <= SEUIL_TROP_DUR
            ? `Personne ne le réussit (${Math.round(l.taux * 100)} % sur ${l.n}) : énoncé probablement faux ou ambigu.`
            : `Réussi presque à tous les coups (${Math.round(l.taux * 100)} % sur ${l.n}) : il n’apprend plus rien.`,
      })
    }
  })

  tout()
  return suspects
}

/* --------------------------------------------------------- relecture -- */

export interface ItemARelire {
  id: number
  examId: string
  section: string
  sectionLibelle: string
  typeItem: string
  statut: string
  enonce: string
  contexteTexte: string | null
  info1: string | null
  info2: string | null
  options: string[]
  bonneReponse: string
  explication: string | null
  source: string
  nTentatives: number
  tauxReussite: number | null
  /** Figure rattachée, pour les questions à énoncé graphique. */
  imageHash: string | null
}

export interface FileRelecture {
  items: ItemARelire[]
  restants: number
  parStatut: Record<string, number>
  /** Items dont la bonne réponse est vide : ils bloquent toute utilisation. */
  sansReponse: number
}

/**
 * File de relecture, priorité aux bloquants.
 *
 * Un item sans bonne réponse est inutilisable : il passe devant. Viennent
 * ensuite les suspects, puis le reste.
 */
export function fileRelecture(limite = 20): FileRelecture {
  const d = db()

  const lignes = d
    .prepare(
      `SELECT i.id, i.exam_id AS examId, i.section, i.type_item AS typeItem, i.statut,
              i.enonce, i.contexte_texte AS contexteTexte, i.info_1 AS info1, i.info_2 AS info2,
              i.options, i.bonne_reponse AS bonneReponse,
              i.explication_reference AS explication, i.source,
              m.hash_script AS imageHash,
              (SELECT COUNT(*) FROM attempt a WHERE a.item_id = i.id AND a.a_saute = 0) AS nTentatives,
              (SELECT AVG(a.est_correct) FROM attempt a WHERE a.item_id = i.id AND a.a_saute = 0) AS taux
         FROM item i
         LEFT JOIN media m ON m.id = i.media_id AND m.type = 'image'
        WHERE i.statut IN ('a_relire', 'suspect')
        ORDER BY (i.bonne_reponse = '') DESC, (i.statut = 'suspect') DESC, i.id
        LIMIT ?`,
    )
    .all(limite) as Array<Record<string, unknown>>

  const compte = d
    .prepare(
      `SELECT statut, COUNT(*) AS n,
              SUM(CASE WHEN bonne_reponse = '' THEN 1 ELSE 0 END) AS vides
         FROM item WHERE statut IN ('a_relire','suspect') GROUP BY statut`,
    )
    .all() as Array<{ statut: string; n: number; vides: number }>

  return {
    items: lignes.map((l) => ({
      id: l.id as number,
      examId: l.examId as string,
      section: l.section as string,
      sectionLibelle: libelleSection(l.section as string),
      typeItem: l.typeItem as string,
      statut: l.statut as string,
      enonce: l.enonce as string,
      contexteTexte: (l.contexteTexte as string) ?? null,
      info1: (l.info1 as string) ?? null,
      info2: (l.info2 as string) ?? null,
      options: l.options ? (JSON.parse(l.options as string) as string[]) : [],
      bonneReponse: (l.bonneReponse as string) ?? '',
      explication: (l.explication as string) ?? null,
      source: l.source as string,
      nTentatives: l.nTentatives as number,
      tauxReussite: (l.taux as number) ?? null,
      imageHash: (l.imageHash as string) ?? null,
    })),
    restants: compte.reduce((acc, c) => acc + c.n, 0),
    parStatut: Object.fromEntries(compte.map((c) => [c.statut, c.n])),
    sansReponse: compte.reduce((acc, c) => acc + (c.vides ?? 0), 0),
  }
}

export interface CorrectionItem {
  enonce?: string
  options?: string[]
  bonneReponse?: string
  explication?: string | null
  skillId?: string | null
}

/** Valide un item : il entre en service. Refusé tant qu'il n'a pas de réponse. */
export function validerItem(id: number, correction?: CorrectionItem): void {
  const d = db()

  if (correction) corrigerItem(id, correction)

  const l = d.prepare(`SELECT bonne_reponse, options FROM item WHERE id = ?`).get(id) as
    | { bonne_reponse: string; options: string | null }
    | undefined

  if (!l) throw new ErreurRequete(`Question ${id} introuvable.`, 404)
  if (!l.bonne_reponse) {
    throw new ErreurRequete('Impossible de valider : la bonne réponse est vide.')
  }

  const options = l.options ? (JSON.parse(l.options) as string[]) : []
  const rang = ['A', 'B', 'C', 'D', 'E'].indexOf(l.bonne_reponse)
  if (options.length > 0 && (rang < 0 || rang >= options.length)) {
    throw new ErreurRequete(
      `Impossible de valider : la réponse ${l.bonne_reponse} ne correspond à aucune proposition.`,
    )
  }

  // Validée après relecture = vérifiée : ses anciennes réponses ne la
  // renvoient pas aussitôt dans « Questions à vérifier ».
  d.prepare(`UPDATE item SET statut = 'valide', verifie_le = datetime('now') WHERE id = ?`).run(id)
}

export function corrigerItem(id: number, c: CorrectionItem): void {
  db()
    .prepare(
      `UPDATE item SET
         enonce                = COALESCE(@enonce, enonce),
         options               = COALESCE(@options, options),
         bonne_reponse         = COALESCE(@bonne, bonne_reponse),
         explication_reference = COALESCE(@explication, explication_reference),
         skill_id              = COALESCE(@skill, skill_id)
       WHERE id = @id`,
    )
    .run({
      id,
      enonce: c.enonce ?? null,
      options: c.options ? JSON.stringify(c.options) : null,
      bonne: c.bonneReponse ?? null,
      explication: c.explication ?? null,
      skill: c.skillId ?? null,
    })
}

/**
 * Supprime un item et ses tentatives.
 *
 * C'est le seul endroit du produit où des tentatives disparaissent. Assumé :
 * les tentatives sur un item faux ne mesurent rien, les garder polluerait la
 * calibration plus qu'elles ne l'informent.
 */
export function supprimerItem(id: number): { tentativesSupprimees: number } {
  const d = db()

  const n = (
    d.prepare(`SELECT COUNT(*) AS n FROM attempt WHERE item_id = ?`).get(id) as { n: number }
  ).n

  const tout = d.transaction(() => {
    d.prepare(`DELETE FROM attempt WHERE item_id = ?`).run(id)
    d.prepare(`DELETE FROM item WHERE id = ?`).run(id)
  })
  tout()

  return { tentativesSupprimees: n }
}

/* --------------------------------------------------------- doublons -- */

export interface Doublon {
  enonce: string
  section: string
  sectionLibelle: string
  ids: number[]
}

/** Items strictement identiques au sein d'une même section. */
export function doublons(limite = 50): Doublon[] {
  return (
    db()
      .prepare(
        // Deux items ne sont le même exercice que si tout leur contenu coïncide.
        // Grouper sur le seul énoncé signalait cent doublons imaginaires : en
        // conditions minimales, la question est commune à tout un moule et ce
        // sont les deux informations qui la distinguent.
        `SELECT enonce, section, COUNT(*) AS n, GROUP_CONCAT(id) AS ids
           FROM item
          GROUP BY exam_id, section, enonce,
                   IFNULL(info_1, ''), IFNULL(info_2, ''), IFNULL(options, '')
         HAVING n > 1
          ORDER BY n DESC LIMIT ?`,
      )
      .all(limite) as Array<{ enonce: string; section: string; ids: string }>
  ).map((l) => ({
    enonce: l.enonce,
    section: l.section,
    sectionLibelle: libelleSection(l.section),
    ids: l.ids.split(',').map(Number),
  }))
}

export interface EtatAtelier {
  parStatut: Record<string, number>
  parSource: Record<string, number>
  total: number
  sansSkill: number
  /** Sous-tests où une lettre porte trop de bonnes réponses (voir alerteRepartition). */
  alertesRepartition: Array<{ section: string; libelle: string; lettre: string; part: number; n: number }>
}

export function etatAtelier(): EtatAtelier {
  const d = db()

  const statuts = d.prepare(`SELECT statut, COUNT(*) AS n FROM item GROUP BY statut`).all() as Array<{
    statut: string
    n: number
  }>
  const sources = d.prepare(`SELECT source, COUNT(*) AS n FROM item GROUP BY source`).all() as Array<{
    source: string
    n: number
  }>

  const bonnesParSection = new Map<string, string[]>()
  for (const r of d
    .prepare(`SELECT section, bonne_reponse AS b FROM item WHERE exam_id = 'tagemage' AND statut = 'valide'`)
    .all() as Array<{ section: string; b: string }>) {
    if (!bonnesParSection.has(r.section)) bonnesParSection.set(r.section, [])
    bonnesParSection.get(r.section)!.push(r.b)
  }
  const alertesRepartition = [...bonnesParSection.entries()].flatMap(([section, bonnes]) => {
    const a = alerteRepartition(bonnes)
    return a ? [{ section, libelle: libelleSection(section), ...a }] : []
  })

  return {
    alertesRepartition,
    parStatut: Object.fromEntries(statuts.map((s) => [s.statut, s.n])),
    parSource: Object.fromEntries(sources.map((s) => [s.source, s.n])),
    total: statuts.reduce((acc, s) => acc + s.n, 0),
    sansSkill: (
      d.prepare(`SELECT COUNT(*) AS n FROM item WHERE skill_id IS NULL`).get() as { n: number }
    ).n,
  }
}
import { signauxDeDoute } from '@/core/stats/doutes'

/* ----------------------------------------------- questions à vérifier -- */

export interface QuestionAVerifier {
  id: number
  section: string
  sectionLibelle: string
  enonce: string
  options: string[]
  bonneReponse: string
  typeItem: string
  n: number
  justes: number
  raisons: string[]
}

/**
 * Les questions que tes propres réponses rendent douteuses (voir
 * core/stats/doutes.ts). Les plus chargées en signaux d'abord. Une question
 * relue et déclarée juste (`verifie_le`) ne revient que si une réponse
 * postérieure redonne un signal.
 */
export function questionsAVerifier(limite = 20): QuestionAVerifier[] {
  const d = db()
  const lignes = d
    .prepare(
      `SELECT i.id, i.section, i.enonce, i.options, i.bonne_reponse, i.type_item,
              SUM(CASE WHEN a.a_saute = 0 THEN 1 ELSE 0 END)                             AS n,
              SUM(CASE WHEN a.a_saute = 0 AND a.est_correct = 1 THEN 1 ELSE 0 END)       AS justes,
              SUM(CASE WHEN a.a_saute = 0 AND a.est_correct = 0 AND a.confiance = 4 THEN 1 ELSE 0 END)
                                                                                       AS erreursCertaines,
              (SELECT f.reponse_donnee || ':' || COUNT(*) FROM attempt f
                WHERE f.item_id = i.id AND f.a_saute = 0 AND f.est_correct = 0
                  AND f.reponse_donnee IS NOT NULL
                GROUP BY f.reponse_donnee ORDER BY COUNT(*) DESC LIMIT 1)              AS fausse
         FROM item i
         JOIN attempt a ON a.item_id = i.id
        WHERE i.exam_id = 'tagemage' AND i.statut = 'valide'
        GROUP BY i.id
       HAVING i.verifie_le IS NULL OR MAX(a.created_at) > i.verifie_le`,
    )
    .all() as Array<{
    id: number
    section: string
    enonce: string
    options: string | null
    bonne_reponse: string
    type_item: string
    n: number
    justes: number
    erreursCertaines: number
    fausse: string | null
  }>

  return lignes
    .map((l) => {
      const [lettre, fois] = l.fausse ? l.fausse.split(':') : [null, null]
      const raisons = signauxDeDoute({
        n: l.n,
        justes: l.justes,
        erreursCertaines: l.erreursCertaines,
        fausseRepetee: lettre ? { lettre, fois: Number(fois) } : null,
      }).map((s) => s.raison)
      return {
        id: l.id,
        section: l.section,
        sectionLibelle: libelleSection(l.section),
        enonce: l.enonce,
        options: l.options ? (JSON.parse(l.options) as string[]) : [],
        bonneReponse: l.bonne_reponse,
        typeItem: l.type_item,
        n: l.n,
        justes: l.justes,
        raisons,
      }
    })
    .filter((q) => q.raisons.length > 0)
    .sort((a, b) => b.raisons.length - a.raisons.length || a.id - b.id)
    .slice(0, limite)
}

/** « Le corrigé est juste » : la question sort de la liste jusqu'au prochain signal. */
export function marquerVerifiee(id: number): void {
  db().prepare(`UPDATE item SET verifie_le = datetime('now') WHERE id = ?`).run(id)
}

/** Envoie la question en relecture : elle quitte les séries jusqu'à sa validation. */
export function envoyerEnRelecture(id: number): void {
  db().prepare(`UPDATE item SET statut = 'suspect' WHERE id = ?`).run(id)
}
