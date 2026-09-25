/**
 * Répétition espacée — SM-2, adapté à des sous-compétences et à une échéance.
 *
 * POURQUOI SM-2 ET PAS FSRS
 * -------------------------
 * FSRS est meilleur que SM-2 *une fois ses paramètres calibrés sur l'historique
 * de révision de l'utilisateur*. Ici il n'y a pas d'historique au départ, et les
 * poids par défaut de FSRS sont entraînés sur des paquets Anki de cartes de
 * vocabulaire — des rappels binaires sur des items discrets. Notre unité de
 * révision est autre chose : un lot de questions sur une sous-compétence, noté
 * par un taux de réussite continu. Utiliser ces poids ici emprunterait une
 * précision que rien ne justifie.
 *
 * SM-2 est simple, entièrement spécifiable, et testable exhaustivement. On peut
 * passer à FSRS quand il y aura de quoi le calibrer.
 *
 * DEUX ADAPTATIONS ASSUMÉES
 * -------------------------
 * 1. La note ne vient pas d'un bouton mais du taux de réussite observé sur le
 *    lot (`noteDepuisReussite`).
 * 2. Réviser pour un examen n'est pas réviser pour la vie : un intervalle qui
 *    dépasse la date d'examen n'a aucune valeur. `plafonnerAvantExamen` comprime
 *    le calendrier pour que chaque compétence soit revue au moins une fois de
 *    plus avant l'échéance.
 *
 * Déterministe, sans I/O, sans appel réseau.
 */

/** Facteur de facilité initial, et plancher sous lequel il ne descend pas. */
export const FACILITE_INITIALE = 2.5
export const FACILITE_MINIMALE = 1.3

/** Une note strictement inférieure remet la progression à zéro. */
export const NOTE_ECHEC = 3

/** Intervalles des deux premières répétitions réussies, en jours. */
export const PREMIER_INTERVALLE = 1
export const SECOND_INTERVALLE = 6

/** Nombre minimal de tentatives pour qu'un lot vaille comme révision. */
export const TENTATIVES_MINIMALES = 3

export interface EtatRevision {
  repetitions: number
  facilite: number
  intervalleJours: number
  /** Date ISO (AAAA-MM-JJ) de la dernière révision, null si jamais révisée. */
  derniereRevision: string | null
  prochaineRevision: string | null
}

export const ETAT_INITIAL: EtatRevision = {
  repetitions: 0,
  facilite: FACILITE_INITIALE,
  intervalleJours: 0,
  derniereRevision: null,
  prochaineRevision: null,
}

/**
 * Convertit un taux de réussite en note SM-2 (0 à 5).
 *
 * Les seuils sont conventionnels et regroupés ici pour être discutables d'un
 * seul endroit. 3 est le seuil de réussite : en dessous, la progression est
 * remise à zéro.
 */
export function noteDepuisReussite(justes: number, total: number): number {
  if (total === 0) return 0
  const taux = justes / total

  if (taux >= 0.95) return 5
  if (taux >= 0.85) return 4
  if (taux >= 0.7) return 3
  if (taux >= 0.5) return 2
  if (taux >= 0.3) return 1
  return 0
}

/** Formule SM-2 de mise à jour du facteur de facilité, bornée par le plancher. */
export function nouvelleFacilite(facilite: number, note: number): number {
  const ajustee = facilite + (0.1 - (5 - note) * (0.08 + (5 - note) * 0.02))
  return Math.max(FACILITE_MINIMALE, ajustee)
}

export function ajouterJours(iso: string, jours: number): string {
  const d = new Date(`${iso}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + jours)
  return d.toISOString().slice(0, 10)
}

export function joursEntre(depuis: string, jusqua: string): number {
  const a = new Date(`${depuis}T00:00:00Z`).getTime()
  const b = new Date(`${jusqua}T00:00:00Z`).getTime()
  return Math.round((b - a) / 86_400_000)
}

/**
 * Applique une révision et renvoie le nouvel état.
 *
 * `aujourdhui` est passé explicitement : aucune fonction de ce module ne lit
 * l'horloge, pour rester testable.
 */
export function reviser(etat: EtatRevision, note: number, aujourdhui: string): EtatRevision {
  const facilite = nouvelleFacilite(etat.facilite, note)

  if (note < NOTE_ECHEC) {
    // Échec : on ne repart pas de zéro sur la facilité, seulement sur le rythme.
    return {
      repetitions: 0,
      facilite,
      intervalleJours: PREMIER_INTERVALLE,
      derniereRevision: aujourdhui,
      prochaineRevision: ajouterJours(aujourdhui, PREMIER_INTERVALLE),
    }
  }

  const repetitions = etat.repetitions + 1
  const intervalleJours =
    repetitions === 1
      ? PREMIER_INTERVALLE
      : repetitions === 2
        ? SECOND_INTERVALLE
        : Math.round(etat.intervalleJours * facilite)

  return {
    repetitions,
    facilite,
    intervalleJours,
    derniereRevision: aujourdhui,
    prochaineRevision: ajouterJours(aujourdhui, intervalleJours),
  }
}

/**
 * Comprime le calendrier pour qu'il tienne avant l'examen.
 *
 * Une révision programmée après la date d'examen ne sert à rien. On ramène
 * l'échéance dans la fenêtre restante, en gardant une marge : la dernière
 * révision utile a lieu au plus tard la veille.
 *
 * Renvoie la date inchangée s'il n'y a pas de date d'examen, ou si l'échéance
 * tombe déjà avant.
 */
export function plafonnerAvantExamen(
  prochaineRevision: string,
  aujourdhui: string,
  dateExamen: string | null,
): string {
  if (!dateExamen) return prochaineRevision

  const veille = ajouterJours(dateExamen, -1)
  if (joursEntre(prochaineRevision, veille) >= 0) return prochaineRevision

  // L'échéance dépasse l'examen : on la ramène à mi-chemin du temps restant,
  // pour garder au moins une révision utile plutôt qu'aucune.
  const restant = joursEntre(aujourdhui, veille)
  if (restant <= 0) return aujourdhui

  return ajouterJours(aujourdhui, Math.max(1, Math.floor(restant / 2)))
}

export interface TentativeBrute {
  /** Date ISO de la tentative. */
  jour: string
  juste: boolean
}

export interface LotRevision {
  /** Date de la dernière tentative du lot : c'est elle qui date la révision. */
  jour: string
  n: number
  justes: number
}

/**
 * Découpe une suite de tentatives en lots de révision.
 *
 * Un lot se referme dès qu'il atteint `taille` tentatives, **même s'il
 * traverse plusieurs séances**. C'est la correction d'un défaut observé : une
 * série de 15 questions sur un sous-test se répartit sur une douzaine de
 * sous-compétences, donc presque aucune n'atteint le seuil à l'intérieur d'une
 * seule séance. En exigeant le seuil par séance, le calendrier ne se
 * déclenchait quasiment jamais.
 *
 * Les tentatives restantes en fin de liste ne forment pas un lot : la preuve
 * n'est pas encore suffisante, et on préfère ne rien programmer que programmer
 * sur du bruit.
 */
export function decouperEnLots(
  tentatives: TentativeBrute[],
  taille = TENTATIVES_MINIMALES,
): LotRevision[] {
  const lots: LotRevision[] = []
  let n = 0
  let justes = 0

  for (const t of tentatives) {
    n++
    if (t.juste) justes++

    if (n >= taille) {
      lots.push({ jour: t.jour, n, justes })
      n = 0
      justes = 0
    }
  }

  return lots
}

export interface CompetenceAReviser {
  skillId: string
  prochaineRevision: string | null
  /** Négatif = en retard, 0 = due aujourd'hui, positif = pas encore due. */
  joursDeRetard: number
}

/**
 * Compétences dues, les plus en retard d'abord.
 * Une compétence jamais révisée est considérée comme due immédiatement.
 */
export function competencesDues(
  etats: Array<{ skillId: string; prochaineRevision: string | null }>,
  aujourdhui: string,
): CompetenceAReviser[] {
  return etats
    .map((e) => ({
      skillId: e.skillId,
      prochaineRevision: e.prochaineRevision,
      joursDeRetard: e.prochaineRevision ? joursEntre(e.prochaineRevision, aujourdhui) : Infinity,
    }))
    .filter((e) => e.joursDeRetard >= 0)
    .sort((a, b) => b.joursDeRetard - a.joursDeRetard)
}
