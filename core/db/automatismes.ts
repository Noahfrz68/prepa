import type { Base } from './base'
import { db } from './queries'
import { tempsBorne } from './garde'
import { ErreurRequete } from '@/core/erreurs'
import {
  estFormat,
  estJeuPartie,
  jeu,
  MELANGE,
  QUESTIONS_SERIE,
  type EtatsFaits,
  type FormatPartie,
  type PartieJeuId,
} from '@/core/automatismes'
import { SERIE_MAITRISE } from '@/core/automatismes/poids'

/**
 * Les parties d'automatismes : enregistrement, records, faits à revoir.
 *
 * Tout se recalcule depuis les deux tables (migration 025) : il n'y a ni
 * compteur ni record stocké qui pourrait diverger de l'historique — ni entre
 * le PC et l'iPhone une fois synchronisés.
 */

export interface ReponseEnvoyee {
  jeu: string
  cle: string
  reponse: string | null
  juste: boolean
  tempsMs: number
  lent: boolean
}

export interface PartieEnvoyee {
  uid: string
  jeu: string
  format: string
  dureeMs: number
  reponses: ReponseEnvoyee[]
}

export interface MeilleurScore {
  justes: number
  nb: number
  dureeMs: number
  le: string
}

export interface ResultatPartie {
  /** Le meilleur score de ce jeu dans ce format, avant cette partie. */
  precedent: MeilleurScore | null
  nouveauRecord: boolean
  /** La partie était déjà là : un envoi rejoué après une coupure. */
  dejaEnregistree: boolean
}

/** Au-delà, ce n'est plus une partie mais un envoi aberrant. */
const REPONSES_MAX = 300
const UID = /^[0-9a-zA-Z-]{8,64}$/

/** Meilleur au sens du format : plus de justes ; en série, à égalité, plus rapide. */
function meilleur(format: FormatPartie, a: MeilleurScore, b: MeilleurScore | null): boolean {
  if (!b) return true
  if (a.justes !== b.justes) return a.justes > b.justes
  return format === 'serie' && a.dureeMs < b.dureeMs
}

export function recordDe(jeuId: string, format: FormatPartie, d: Base = db()): MeilleurScore | null {
  const ordre = format === 'serie' ? 'justes DESC, duree_ms ASC, le ASC' : 'justes DESC, le ASC'
  const r = d
    .prepare(
      `SELECT justes, nb, duree_ms, le FROM automatisme_partie
        WHERE jeu = ? AND format = ? ORDER BY ${ordre} LIMIT 1`,
    )
    .get(jeuId, format) as { justes: number; nb: number; duree_ms: number; le: string } | undefined
  return r ? { justes: r.justes, nb: r.nb, dureeMs: r.duree_ms, le: r.le } : null
}

function valider(p: PartieEnvoyee): asserts p is PartieEnvoyee & { format: FormatPartie } {
  if (typeof p?.uid !== 'string' || !UID.test(p.uid)) throw new ErreurRequete('Partie sans identifiant valide.', 400)
  if (!estJeuPartie(p.jeu)) throw new ErreurRequete(`Jeu inconnu : ${String(p.jeu)}.`, 400)
  if (!estFormat(p.format)) throw new ErreurRequete(`Format de partie inconnu : ${String(p.format)}.`, 400)
  if (!Array.isArray(p.reponses) || p.reponses.length === 0) {
    throw new ErreurRequete('Partie vide : aucune réponse à enregistrer.', 400)
  }
  if (p.reponses.length > REPONSES_MAX) throw new ErreurRequete('Partie trop longue.', 400)
  // Une série incomplète ne se compare à rien : elle n'est pas enregistrée.
  if (p.format === 'serie' && p.reponses.length !== QUESTIONS_SERIE) {
    throw new ErreurRequete(`Une série compte ${QUESTIONS_SERIE} réponses, pas ${p.reponses.length}.`, 400)
  }
  for (const r of p.reponses) {
    if (!jeu(r?.jeu) || typeof r.cle !== 'string' || r.cle.length === 0 || r.cle.length > 64) {
      throw new ErreurRequete('Réponse mal formée.', 400)
    }
  }
}

export function enregistrerPartie(p: PartieEnvoyee, d: Base = db()): ResultatPartie {
  valider(p)
  const format = p.format
  return d.transaction(() => {
    const precedent = recordDe(p.jeu, format, d)
    const justes = p.reponses.filter((r) => r.juste).length
    const dureeMs = tempsBorne(p.dureeMs)

    const insertion = d
      .prepare(
        `INSERT OR IGNORE INTO automatisme_partie (uid, jeu, format, duree_ms, nb, justes)
         VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .run(p.uid, p.jeu, format, dureeMs, p.reponses.length, justes)
    if (insertion.changes === 0) return { precedent: null, nouveauRecord: false, dejaEnregistree: true }

    const reponse = d.prepare(
      `INSERT INTO automatisme_reponse (partie_uid, ordre, jeu, cle, reponse, juste, temps_ms, lent)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    p.reponses.forEach((r, i) => {
      const juste = Boolean(r.juste)
      reponse.run(
        p.uid,
        i,
        r.jeu,
        r.cle,
        r.reponse == null ? null : String(r.reponse).slice(0, 64),
        juste ? 1 : 0,
        tempsBorne(r.tempsMs),
        juste && r.lent ? 1 : 0,
      )
    })

    const cette: MeilleurScore = { justes, nb: p.reponses.length, dureeMs, le: '' }
    return { precedent, nouveauRecord: meilleur(format, cette, precedent), dejaEnregistree: false }
  })()
}

/* -------------------------------------------------------------- lecture -- */

export interface StatsJeu {
  parties: number
  dernierePartie: string | null
  records: { chrono: MeilleurScore | null; serie: MeilleurScore | null }
  /** Sur les 30 derniers jours, null sans réponse. */
  reussite: number | null
  tempsMoyenMs: number | null
  /** Faits dont la dernière réponse était fausse ou trop lente. */
  aRevoir: number
}

const vide = (): StatsJeu => ({
  parties: 0,
  dernierePartie: null,
  records: { chrono: null, serie: null },
  reussite: null,
  tempsMoyenMs: null,
  aRevoir: 0,
})

export function statsAutomatismes(ids: readonly PartieJeuId[], d: Base = db()): Map<PartieJeuId, StatsJeu> {
  const stats = new Map<PartieJeuId, StatsJeu>(ids.map((id) => [id, vide()]))

  const parties = d
    .prepare(`SELECT jeu, COUNT(*) AS n, MAX(le) AS derniere FROM automatisme_partie GROUP BY jeu`)
    .all() as Array<{ jeu: PartieJeuId; n: number; derniere: string }>
  for (const p of parties) {
    const s = stats.get(p.jeu)
    if (s) Object.assign(s, { parties: p.n, dernierePartie: p.derniere })
  }

  // Par jeu de la QUESTION : un mélange nourrit les statistiques de chaque jeu.
  const recentes = d
    .prepare(
      `SELECT r.jeu, AVG(r.juste) AS reussite, AVG(r.temps_ms) AS temps, COUNT(*) AS n
         FROM automatisme_reponse r JOIN automatisme_partie p ON p.uid = r.partie_uid
        WHERE p.le >= strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-30 days')
        GROUP BY r.jeu`,
    )
    .all() as Array<{ jeu: PartieJeuId; reussite: number; temps: number; n: number }>
  for (const r of recentes) {
    const s = stats.get(r.jeu)
    if (s) Object.assign(s, { reussite: r.reussite, tempsMoyenMs: r.temps })
  }

  const aRevoir = d
    .prepare(
      `SELECT jeu, COUNT(*) AS n FROM (
         SELECT r.jeu, r.juste, r.lent,
                ROW_NUMBER() OVER (PARTITION BY r.jeu, r.cle ORDER BY p.le DESC, r.ordre DESC) AS rang
           FROM automatisme_reponse r JOIN automatisme_partie p ON p.uid = r.partie_uid
       ) WHERE rang = 1 AND (juste = 0 OR lent = 1)
       GROUP BY jeu`,
    )
    .all() as Array<{ jeu: PartieJeuId; n: number }>
  for (const r of aRevoir) {
    const s = stats.get(r.jeu)
    if (s) s.aRevoir = r.n
  }

  // Le Mélange puise dans tous les jeux : sa réussite et ses faits à revoir
  // sont ceux de l'ensemble, quelle que soit la partie qui les a joués.
  const melange = stats.get(MELANGE.id)
  if (melange) {
    const n = recentes.reduce((t, r) => t + r.n, 0)
    if (n > 0) {
      melange.reussite = recentes.reduce((t, r) => t + r.reussite * r.n, 0) / n
      melange.tempsMoyenMs = recentes.reduce((t, r) => t + r.temps * r.n, 0) / n
    }
    melange.aRevoir = aRevoir.reduce((t, r) => t + r.n, 0)
  }

  for (const [id, s] of stats) {
    if (s.parties > 0) s.records = { chrono: recordDe(id, 'chrono', d), serie: recordDe(id, 'serie', d) }
  }
  return stats
}

/**
 * L'état de chaque fait déjà rencontré, pour la répétition (poids.ts) : sa
 * dernière réponse, et combien de réponses justes et rapides la précèdent
 * d'affilée. Il suffit de lire les SERIE_MAITRISE dernières réponses de
 * chaque fait.
 */
export function etatsFaits(d: Base = db()): EtatsFaits {
  const lignes = d
    .prepare(
      `SELECT cle, juste, lent, le FROM (
         SELECT r.cle, r.juste, r.lent, p.le,
                ROW_NUMBER() OVER (PARTITION BY r.cle ORDER BY p.le DESC, r.ordre DESC) AS rang
           FROM automatisme_reponse r JOIN automatisme_partie p ON p.uid = r.partie_uid
       ) WHERE rang <= ? ORDER BY cle, rang`,
    )
    .all(SERIE_MAITRISE) as Array<{ cle: string; juste: number; lent: number; le: string }>

  const etats: EtatsFaits = {}
  let enCours: string | null = null
  let interrompue = false
  for (const l of lignes) {
    const bonne = l.juste === 1 && l.lent === 0
    if (l.cle !== enCours) {
      enCours = l.cle
      interrompue = !bonne
      etats[l.cle] = { serie: bonne ? 1 : 0, aRevoir: !bonne, vuLe: Date.parse(l.le) }
    } else if (!interrompue) {
      if (bonne) etats[l.cle].serie++
      else interrompue = true
    }
  }
  return etats
}
