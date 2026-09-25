import { db } from '@/core/db/queries'
import { syntheseStrategie } from '@/core/stats/queries'
import { SECTIONS_PAR_ID } from '@/exams/tagemage'
import { PARTS } from '@/exams/toeic'
import { SEUIL_FIABILITE } from '@/core/stats/calculs'
import { fournisseurActif } from './fournisseurs'
import { PROMPT_TUTEUR, decouperReponse, type SortieTuteur } from './prompt'

/**
 * Orchestration du tuteur.
 *
 * Une règle traverse tout ce fichier : le modèle **interprète**, il ne compte
 * pas. Les chiffres envoyés dans le contexte sont calculés en SQL, et rien de
 * ce que le modèle renvoie n'est réinjecté comme une statistique.
 */

/* ------------------------------------------------------------ mémoire -- */

export interface MemoireCoach {
  id: number
  version: number
  contenu: string
  genereLe: string
  declencheur: string
  modele: string | null
}

export function memoireCourante(examId: string | null = null): MemoireCoach | null {
  const l = db()
    .prepare(
      `SELECT id, version, contenu_markdown, genere_le, declencheur, modele_utilise
         FROM coach_memory
        WHERE exam_id IS ?
        ORDER BY version DESC LIMIT 1`,
    )
    .get(examId) as Record<string, unknown> | undefined

  if (!l) return null

  return {
    id: l.id as number,
    version: l.version as number,
    contenu: l.contenu_markdown as string,
    genereLe: l.genere_le as string,
    declencheur: l.declencheur as string,
    modele: (l.modele_utilise as string) ?? null,
  }
}

export function historiqueMemoire(examId: string | null = null, limite = 10): MemoireCoach[] {
  return (
    db()
      .prepare(
        `SELECT id, version, contenu_markdown, genere_le, declencheur, modele_utilise
           FROM coach_memory WHERE exam_id IS ? ORDER BY version DESC LIMIT ?`,
      )
      .all(examId, limite) as Array<Record<string, unknown>>
  ).map((l) => ({
    id: l.id as number,
    version: l.version as number,
    contenu: l.contenu_markdown as string,
    genereLe: l.genere_le as string,
    declencheur: l.declencheur as string,
    modele: (l.modele_utilise as string) ?? null,
  }))
}

/** Écrit une nouvelle version. Jamais d'écrasement : l'historique est la valeur. */
export function enregistrerMemoire(
  contenu: string,
  options: { examId?: string | null; declencheur: string; modele?: string | null; fournisseur?: string | null },
): number {
  const d = db()
  const examId = options.examId ?? null

  const derniere = d
    .prepare(`SELECT COALESCE(MAX(version), 0) AS v FROM coach_memory WHERE exam_id IS ?`)
    .get(examId) as { v: number }

  const info = d
    .prepare(
      `INSERT INTO coach_memory (exam_id, version, contenu_markdown, declencheur, modele_utilise, fournisseur)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .run(examId, derniere.v + 1, contenu.trim(), options.declencheur, options.modele ?? null, options.fournisseur ?? null)

  return Number(info.lastInsertRowid)
}

/* ------------------------------------------------------------ contexte -- */

const tronquer = (s: string, n: number) => (s.length <= n ? s : `${s.slice(0, n)}…`)

/**
 * Construit le message envoyé au modèle.
 *
 * Volontairement compact : on n'envoie jamais l'historique brut complet, mais
 * un profil, la mémoire du coach, des statistiques fraîches sérialisées, et
 * les tentatives de la seule session concernée.
 */
export function contexteSerie(sessionId: number): { exam: string; message: string } | null {
  const d = db()

  const session = d
    .prepare(`SELECT id, exam_id, type, sections FROM exam_session WHERE id = ?`)
    .get(sessionId) as { id: number; exam_id: string; type: string; sections: string } | undefined

  if (!session) return null

  const tentatives = d
    .prepare(
      `SELECT i.enonce, i.section, i.bonne_reponse, i.options,
              a.reponse_donnee, a.est_correct, a.a_saute, a.motif_blanc,
              a.temps_ms, a.confiance,
              k.libelle AS skill
         FROM attempt a
         JOIN item i ON i.id = a.item_id
         LEFT JOIN skill k ON k.id = i.skill_id
        WHERE a.session_id = ?
        ORDER BY a.id`,
    )
    .all(sessionId) as Array<Record<string, unknown>>

  if (tentatives.length === 0) return null

  const objectif = d
    .prepare(`SELECT date_examen, score_cible FROM exam_goal WHERE exam_id = ?`)
    .get(session.exam_id) as { date_examen: string | null; score_cible: number | null } | undefined

  const libelleSection = (s: string) =>
    SECTIONS_PAR_ID.get(s as never)?.libelle ?? PARTS.find((p) => p.id === s)?.libelle ?? s

  const lignes: string[] = []

  lignes.push(`<exam>${session.exam_id}</exam>`)

  lignes.push('<profil>')
  lignes.push(`type de séance : ${session.type}`)
  lignes.push(
    `objectif : ${objectif?.score_cible ? `score cible ${objectif.score_cible}` : 'aucun score cible renseigné'}` +
      `, ${objectif?.date_examen ? `examen le ${objectif.date_examen}` : 'date d’examen non renseignée'}`,
  )
  lignes.push('langue des explications : français')
  lignes.push('</profil>')

  const memoire = memoireCourante(session.exam_id)
  if (memoire) {
    lignes.push('<memoire_coach>')
    lignes.push(memoire.contenu)
    lignes.push('</memoire_coach>')
  }

  // Statistiques : calculées en base, citées telles quelles.
  if (session.exam_id === 'tagemage') {
    const s = syntheseStrategie('tagemage')
    lignes.push('<statistiques>')
    lignes.push(`tentatives totales : ${s.nTentatives}`)
    lignes.push(
      `calibration : ${s.calibration
        .filter((c) => c.n > 0)
        .map(
          (c) =>
            `confiance ${c.niveau} → ${Math.round(c.tauxReussite * 100)} % sur ${c.n}${c.fiable ? '' : ' (non fiable)'}`,
        )
        .join(' · ')}`,
    )
    lignes.push(`diagnostic de calibration : ${s.diagnostic.diagnostic}`)
    lignes.push(
      `cases laissées vides : ${s.regle.blanches} sur ${s.regle.total} (chacune jette 0,8 point : le barème ne pénalise plus les erreurs)`,
    )
    if (s.puits.length > 0) {
      lignes.push(
        `puits de temps : ${s.puits.map((p) => `${p.libelle} (${Math.round(p.tauxReussite * 100)} %, ×${p.ratioTemps.toFixed(1)})`).join(' · ')}`,
      )
    }
    lignes.push(
      `compétences les plus faibles : ${s.competences
        .slice(0, 6)
        .map((c) => `${c.libelle} ${Math.round(c.tauxReussite * 100)} % sur ${c.n}`)
        .join(' · ')}`,
    )
    lignes.push(`seuil de fiabilité : ${SEUIL_FIABILITE} tentatives`)
    lignes.push('</statistiques>')
  }

  lignes.push('<session>')
  for (const [i, t] of tentatives.entries()) {
    const options = t.options ? (JSON.parse(t.options as string) as string[]) : []
    const iBonne = ['A', 'B', 'C', 'D', 'E'].indexOf(t.bonne_reponse as string)
    const etat = t.a_saute
      ? t.motif_blanc === 'non_traite'
        ? 'non traitée'
        : 'sautée'
      : t.est_correct
        ? 'juste'
        : 'fausse'

    lignes.push(
      [
        `${i + 1}. [${libelleSection(t.section as string)}${t.skill ? ` / ${t.skill}` : ''}]`,
        `${etat}`,
        `${Math.round((t.temps_ms as number) / 1000)} s`,
        t.a_saute ? '' : `confiance ${t.confiance}/4`,
        `bonne : ${t.bonne_reponse}${options[iBonne] ? ` (${tronquer(options[iBonne], 40)})` : ''}`,
        t.reponse_donnee ? `donnée : ${t.reponse_donnee}` : '',
      ]
        .filter(Boolean)
        .join(' · '),
    )
    lignes.push(`   ${tronquer(t.enonce as string, 160)}`)
  }
  lignes.push('</session>')

  lignes.push('<mode>debrief_serie</mode>')

  return { exam: session.exam_id, message: lignes.join('\n') }
}

/* --------------------------------------------------------------- job -- */

export type StatutJob = 'en_attente' | 'en_cours' | 'fait' | 'echoue' | 'abandonne'

export interface Debrief {
  statut: StatutJob
  texte: string | null
  donnees: SortieTuteur | null
  fournisseur: string | null
  modele: string | null
  erreur: string | null
}

const CLE = (sessionId: number) => `session:${sessionId}`

export function debriefExistant(sessionId: number): Debrief | null {
  const l = db()
    .prepare(
      `SELECT statut, texte, donnees, fournisseur, modele, erreur
         FROM ai_job WHERE type = 'debrief_serie' AND cle = ?`,
    )
    .get(CLE(sessionId)) as Record<string, unknown> | undefined

  if (!l) return null

  return {
    statut: l.statut as StatutJob,
    texte: (l.texte as string) ?? null,
    donnees: l.donnees ? (JSON.parse(l.donnees as string) as SortieTuteur) : null,
    fournisseur: (l.fournisseur as string) ?? null,
    modele: (l.modele as string) ?? null,
    erreur: (l.erreur as string) ?? null,
  }
}

/** Nombre de tentatives au-delà duquel on abandonne proprement. */
export const TENTATIVES_MAX = 2

/**
 * Produit le débrief d'une série.
 *
 * Ne lève jamais. Un échec est un état affichable, pas une exception qui
 * casserait un écran dont le contenu statistique se suffit à lui-même.
 */
export async function produireDebrief(sessionId: number): Promise<Debrief> {
  const d = db()
  const cle = CLE(sessionId)

  const existant = debriefExistant(sessionId)
  if (existant?.statut === 'fait') return existant
  if (existant?.statut === 'abandonne') return existant

  const fournisseur = fournisseurActif()
  if (fournisseur.id === 'aucun') {
    return {
      statut: 'abandonne',
      texte: null,
      donnees: null,
      fournisseur: 'aucun',
      modele: null,
      erreur: fournisseur.indisponible(),
    }
  }

  const contexte = contexteSerie(sessionId)
  if (!contexte) {
    return {
      statut: 'abandonne',
      texte: null,
      donnees: null,
      fournisseur: fournisseur.id,
      modele: null,
      erreur: 'Aucune tentative à commenter.',
    }
  }

  const tentatives = (existant?.statut === 'echoue' ? 1 : 0) + 1

  d.prepare(
    `INSERT INTO ai_job (type, cle, statut, fournisseur, tentatives)
     VALUES ('debrief_serie', @cle, 'en_cours', @fournisseur, @tentatives)
     ON CONFLICT (type, cle) DO UPDATE SET
       statut = 'en_cours', fournisseur = excluded.fournisseur, tentatives = excluded.tentatives`,
  ).run({ cle, fournisseur: fournisseur.id, tentatives })

  try {
    const r = await fournisseur.completer(PROMPT_TUTEUR, contexte.message)
    const { texte, donnees } = decouperReponse(r.texte)

    if (donnees?.memoire) {
      enregistrerMemoire(donnees.memoire, {
        examId: contexte.exam,
        declencheur: 'debrief_serie',
        modele: r.modele,
        fournisseur: fournisseur.id,
      })
    }

    d.prepare(
      `UPDATE ai_job SET statut = 'fait', modele = @modele, texte = @texte, donnees = @donnees,
              erreur = NULL, jetons_entree = @entree, jetons_sortie = @sortie,
              traite_le = datetime('now')
        WHERE type = 'debrief_serie' AND cle = @cle`,
    ).run({
      cle,
      modele: r.modele,
      texte,
      donnees: donnees ? JSON.stringify(donnees) : null,
      entree: r.jetonsEntree ?? null,
      sortie: r.jetonsSortie ?? null,
    })

    return {
      statut: 'fait',
      texte,
      donnees,
      fournisseur: fournisseur.id,
      modele: r.modele,
      erreur: null,
    }
  } catch (e) {
    const message = (e as Error).message
    // Une seule nouvelle tentative, puis abandon silencieux : l'écran reste
    // utilisable sans le débrief.
    const statut: StatutJob = tentatives >= TENTATIVES_MAX ? 'abandonne' : 'echoue'

    d.prepare(
      `UPDATE ai_job SET statut = @statut, erreur = @erreur, traite_le = datetime('now')
        WHERE type = 'debrief_serie' AND cle = @cle`,
    ).run({ cle, statut, erreur: message })

    return {
      statut,
      texte: null,
      donnees: null,
      fournisseur: fournisseur.id,
      modele: null,
      erreur: message,
    }
  }
}
