import { SECONDES_PAR_QUESTION } from '@/exams/tagemage'

/**
 * Composition d'une semaine de travail, figée le lundi.
 *
 * Ce que l'ancien planificateur ne faisait pas, et qui manquait le plus : il ne
 * budgétait QUE de l'entraînement. Les quarante-huit leçons existaient, aucune
 * minute ne leur était allouée — comme si lire ne prenait pas de temps. Une
 * semaine se compose donc maintenant de trois choses, dans cet ordre de
 * priorité : les épreuves, le cours, les séries.
 *
 * Fonction pure : aucune I/O, aucune date implicite. Tout ce dont elle a besoin
 * entre par `ParametresSemaine`, ce qui la rend testable exhaustivement.
 */

/* ------------------------------------------------------------ unités -- */

/**
 * Temps d'étude d'une leçon.
 *
 * Une leçon fait trois à quatre cents mots de règles, plus trois questions de
 * récupération, un exemple déroulé et un exercice à faire seul. Douze minutes
 * est le temps de l'étudier vraiment — pas celui de la parcourir. Compter cinq
 * minutes reviendrait à budgéter une lecture en diagonale et à prescrire deux
 * fois trop de leçons par semaine.
 */
export const MINUTES_PAR_LECON = 12

/** Une série de 15 questions : le temps de l'épreuve, plus la correction. */
export const MINUTES_PAR_SERIE = Math.round((15 * SECONDES_PAR_QUESTION) / 60) + 5 // 25

export const MINUTES_BLANC = 120
export const MINUTES_DIAGNOSTIC = 53

/** En dessous, une tâche ne vaut pas la peine d'être inscrite. */
export const TACHE_MINIMALE = 10

/** Au-delà de ce taux, une leçon déjà étudiée n'a pas besoin d'être relue. */
export const SEUIL_RELECTURE = 0.6

/** Semaines entre deux blancs, et fenêtre où le blanc devient prioritaire. */
export const SEMAINES_ENTRE_BLANCS = 2
export const SEMAINES_AVANT_EXAMEN_INTENSIF = 6

/**
 * Part maximale du budget consacrée au cours, selon l'échéance.
 *
 * Le cours cède la place à l'entraînement à mesure que l'examen approche : à
 * quinze jours, découvrir une notion nouvelle rapporte moins que d'apprendre à
 * la placer sous chronomètre. Ce sont des jugements, pas des mesures, et ils
 * sont écrits ici plutôt que dispersés dans le code.
 */
export function plafondCours(semainesRestantes: number | null): number {
  if (semainesRestantes === null) return 0.5
  if (semainesRestantes <= 2) return 0.15
  if (semainesRestantes <= 4) return 0.3
  if (semainesRestantes <= 8) return 0.45
  return 0.55
}

/* ----------------------------------------------------------- entrées -- */

export interface LeconAPlanifier {
  skillId: string
  section: string
  titre: string
  /** Jamais ouverte : elle passe avant toute relecture. */
  jamaisEtudiee: boolean
  /** Taux mesuré sur ce type de question, null si trop peu de réponses. */
  taux: number | null
  /** Rang dans le parcours conseillé : 1 = à faire en premier. */
  rangParcours: number
}

export interface BesoinSection {
  section: string
  libelle: string
  /** Taux de réussite du sous-test, null si non mesuré. */
  taux: number | null
  /** Sous-compétences dues à la révision espacée. */
  skillIdsDus: string[]
  /** Questions disponibles en banque : sans elles, rien à prescrire. */
  questionsEnBanque: number
}

export interface ParametresSemaine {
  semaineDu: string
  budgetMinutes: number
  joursRestants: number | null
  lecons: LeconAPlanifier[]
  sections: BesoinSection[]
  semainesDepuisDernierBlanc: number | null
  aDejaPasseUneEpreuve: boolean
  banqueSuffisantePourBlanc: boolean
}

/* ----------------------------------------------------------- sorties -- */

export type TypeTache = 'cours' | 'entrainement' | 'blanc' | 'diagnostic'

export interface Tache {
  type: TypeTache
  section: string | null
  libelle: string
  skillIds: string[]
  minutes: number
  /** Leçons, séries ou épreuves — ce qui se compte. */
  quantite: number
  raison: string
}

export interface SemaineComposee {
  semaineDu: string
  budgetMinutes: number
  minutesPlanifiees: number
  taches: Tache[]
  notes: string[]
}

/* ------------------------------------------------------------ calcul -- */

/**
 * Les leçons à étudier cette semaine, dans l'ordre du besoin.
 *
 * Trois files, concaténées : ce qui n'a jamais été vu, dans l'ordre du parcours
 * conseillé ; puis ce qui a été vu mais dont le taux reste sous le seuil ; le
 * reste n'est pas reprogrammé. Relire une leçon maîtrisée coûte du temps qui
 * rapporterait ailleurs.
 */
export function leconsAEtudier(lecons: LeconAPlanifier[]): LeconAPlanifier[] {
  const neuves = lecons
    .filter((l) => l.jamaisEtudiee)
    .sort((a, b) => a.rangParcours - b.rangParcours)

  const aRelire = lecons
    .filter((l) => !l.jamaisEtudiee && l.taux !== null && l.taux < SEUIL_RELECTURE)
    .sort((a, b) => (a.taux ?? 1) - (b.taux ?? 1))

  return [...neuves, ...aRelire]
}

/**
 * Répartit un nombre de séries entre les sous-tests, du plus faible au plus sûr.
 *
 * On ne divise pas également : un sous-test à 40 % mérite davantage qu'un
 * sous-test à 80 %. Un sous-test non mesuré compte comme moyen — il faut bien
 * le travailler pour le mesurer, mais rien ne justifie de le prioriser.
 */
export function repartirSeries(
  sections: BesoinSection[],
  nbSeries: number,
): Array<{ section: BesoinSection; series: number }> {
  const eligibles = sections.filter((s) => s.questionsEnBanque >= 15)
  if (eligibles.length === 0 || nbSeries <= 0) return []

  // Poids : ce qui manque pour atteindre 100 %, plancher à 0,15 pour qu'un
  // sous-test maîtrisé ne disparaisse jamais complètement du plan.
  const poids = eligibles.map((s) => Math.max(0.15, 1 - (s.taux ?? 0.5)))
  const total = poids.reduce((a, p) => a + p, 0)

  const brut = eligibles.map((s, i) => ({ section: s, exact: (poids[i] / total) * nbSeries }))
  const repartition = brut.map((b) => ({ section: b.section, series: Math.floor(b.exact) }))

  // Les séries restantes vont aux plus gros restes, pour que la somme tombe juste.
  let reste = nbSeries - repartition.reduce((a, r) => a + r.series, 0)
  const ordre = brut
    .map((b, i) => ({ i, frac: b.exact - Math.floor(b.exact) }))
    .sort((a, b) => b.frac - a.frac)

  for (const { i } of ordre) {
    if (reste <= 0) break
    repartition[i].series++
    reste--
  }

  return repartition.filter((r) => r.series > 0)
}

export function composerSemaine(p: ParametresSemaine): SemaineComposee {
  const taches: Tache[] = []
  const notes: string[] = []
  let restant = p.budgetMinutes

  const semainesRestantes = p.joursRestants === null ? null : p.joursRestants / 7

  /* ------------------------------------------------------- épreuves -- */

  if (!p.aDejaPasseUneEpreuve) {
    const minutes = Math.min(MINUTES_DIAGNOSTIC, restant)
    if (minutes >= TACHE_MINIMALE) {
      taches.push({
        type: 'diagnostic',
        section: null,
        libelle: 'Diagnostic',
        skillIds: [],
        minutes,
        quantite: 1,
        raison: 'Aucune épreuve passée : rien n’est mesuré tant que celle-ci n’est pas faite.',
      })
      restant -= minutes
    }
  } else if (
    p.banqueSuffisantePourBlanc &&
    // Un blanc ne se raccourcit pas : sans deux heures libres, il n'a pas lieu.
    restant >= MINUTES_BLANC &&
    // Le tout premier blanc n'attend pas la fenêtre des six semaines : tant
    // qu'aucun n'a été passé, l'endurance n'a jamais été mesurée, et c'est
    // précisément ce qu'il faut savoir tôt. Les suivants reviennent dans la
    // fenêtre, toutes les deux semaines.
    (p.semainesDepuisDernierBlanc === null ||
      (semainesRestantes !== null &&
        semainesRestantes <= SEMAINES_AVANT_EXAMEN_INTENSIF &&
        p.semainesDepuisDernierBlanc >= SEMAINES_ENTRE_BLANCS))
  ) {
    const minutes = MINUTES_BLANC
    {
      taches.push({
        type: 'blanc',
        section: null,
        libelle: 'Blanc complet',
        skillIds: [],
        minutes,
        quantite: 1,
        raison:
          p.semainesDepuisDernierBlanc === null
            ? 'Aucun blanc passé : ton endurance sur deux heures n’a jamais été mesurée. Ce premier blanc sert de référence, et dit tôt si la fatigue coûte des points.'
            : `Examen dans ${semainesLisibles(p.joursRestants ?? 0)} : c’est l’endurance qu’il faut entraîner, pas les notions.`,
      })
      restant -= minutes
    }
  }

  /* ---------------------------------------------------------- cours -- */

  const file = leconsAEtudier(p.lecons)
  const plafond = Math.floor(p.budgetMinutes * plafondCours(semainesRestantes))
  const minutesCours = Math.min(restant, plafond, file.length * MINUTES_PAR_LECON)
  const nbLecons = Math.floor(minutesCours / MINUTES_PAR_LECON)

  if (nbLecons > 0) {
    // Une tâche par sous-test : c'est l'unité que l'utilisateur reconnaît, et
    // celle sur laquelle il veut voir un nombre d'heures.
    const parSection = new Map<string, LeconAPlanifier[]>()
    for (const l of file.slice(0, nbLecons)) {
      if (!parSection.has(l.section)) parSection.set(l.section, [])
      parSection.get(l.section)!.push(l)
    }

    for (const [section, lot] of parSection) {
      const libelle = p.sections.find((s) => s.section === section)?.libelle ?? section
      const neuves = lot.filter((l) => l.jamaisEtudiee).length
      taches.push({
        type: 'cours',
        section,
        libelle: `Cours — ${libelle}`,
        skillIds: lot.map((l) => l.skillId),
        minutes: lot.length * MINUTES_PAR_LECON,
        quantite: lot.length,
        raison:
          neuves === lot.length
            ? `${lot.length} leçon${lot.length > 1 ? 's' : ''} jamais étudiée${lot.length > 1 ? 's' : ''}.`
            : neuves === 0
              ? `À relire : taux sous ${Math.round(SEUIL_RELECTURE * 100)} % malgré la lecture.`
              : `${neuves} nouvelle${neuves > 1 ? 's' : ''}, ${lot.length - neuves} à relire.`,
      })
    }
    restant -= nbLecons * MINUTES_PAR_LECON
  }

  /* ---------------------------------------------------- entraînement -- */

  const nbSeries = Math.floor(restant / MINUTES_PAR_SERIE)
  if (nbSeries > 0) {
    for (const { section, series } of repartirSeries(p.sections, nbSeries)) {
      taches.push({
        type: 'entrainement',
        section: section.section,
        libelle: `${series} série${series > 1 ? 's' : ''} — ${section.libelle}`,
        skillIds: section.skillIdsDus,
        minutes: series * MINUTES_PAR_SERIE,
        quantite: series,
        raison:
          section.taux === null
            ? 'Jamais mesuré : ces séries serviront d’abord à situer ton niveau.'
            : section.skillIdsDus.length > 0
              ? `${Math.round(section.taux * 100)} % de réussite à la composition du plan · ${section.skillIdsDus.length} type${section.skillIdsDus.length > 1 ? 's' : ''} de question ${section.skillIdsDus.length > 1 ? 'dus' : 'dû'} à la révision.`
              : `${Math.round(section.taux * 100)} % de réussite à la composition du plan.`,
      })
      restant -= series * MINUTES_PAR_SERIE
    }
  }

  /* ------------------------------------------------------------ notes -- */

  const minutesPlanifiees = taches.reduce((a, t) => a + t.minutes, 0)

  if (taches.length === 0) {
    notes.push(
      p.budgetMinutes < TACHE_MINIMALE
        ? 'Budget hebdomadaire trop court pour composer une seule tâche.'
        : 'Rien à programmer : la banque est vide et toutes les leçons sont étudiées.',
    )
  }

  // Zéro épreuve cette semaine est une décision, pas un oubli. La taire
  // laisserait croire que le plan a omis ce que l'utilisateur est venu chercher.
  if (!taches.some((t) => t.type === 'blanc' || t.type === 'diagnostic')) {
    if (!p.banqueSuffisantePourBlanc) {
      notes.push(
        'Aucun blanc programmé : la banque ne contient pas de quoi en composer un (90 questions, au moins 15 par sous-test).',
      )
    } else if (
      p.semainesDepuisDernierBlanc === null ||
      (semainesRestantes !== null &&
        semainesRestantes <= SEMAINES_AVANT_EXAMEN_INTENSIF &&
        p.semainesDepuisDernierBlanc >= SEMAINES_ENTRE_BLANCS)
    ) {
      // Un blanc était dû : seul le budget l'a empêché.
      notes.push(
        'Aucun blanc programmé alors qu’il en faudrait un : le budget de la semaine ne laisse pas deux heures d’affilée. Augmente tes heures disponibles, ou passe-le à la place de séries.',
      )
    } else if (semainesRestantes !== null && semainesRestantes > SEMAINES_AVANT_EXAMEN_INTENSIF) {
      // Les deux durées sont arrondies de la même façon, depuis les jours :
      // « examen dans 8 semaines, blancs dans 3 » ne tombait pas juste.
      const dans = Math.max(
        1,
        Math.round(((p.joursRestants ?? 0) - SEMAINES_AVANT_EXAMEN_INTENSIF * 7) / 7),
      )
      notes.push(
        `Aucun blanc cette semaine : l’examen est dans ${semainesLisibles(p.joursRestants ?? 0)}. Les blancs reviennent toutes les ${SEMAINES_ENTRE_BLANCS} semaines à partir de ${SEMAINES_AVANT_EXAMEN_INTENSIF} semaines de l’échéance, soit dans ${dans} semaine${dans > 1 ? 's' : ''} — d’ici là, le temps rapporte plus en cours et en séries.`,
      )
    } else if (p.semainesDepuisDernierBlanc !== null) {
      const reste = Math.max(1, Math.ceil(SEMAINES_ENTRE_BLANCS - p.semainesDepuisDernierBlanc))
      notes.push(
        `Aucun blanc cette semaine : le dernier date de moins de ${SEMAINES_ENTRE_BLANCS} semaines. Le prochain dans ${reste} semaine${reste > 1 ? 's' : ''}.`,
      )
    }
  }

  if (file.length > nbLecons) {
    notes.push(
      `${file.length - nbLecons} leçon${file.length - nbLecons > 1 ? 's' : ''} attendent leur tour : le cours ne prend jamais plus de ${Math.round(plafondCours(semainesRestantes) * 100)} % de la semaine, pour que l’entraînement garde sa place.`,
    )
  }

  if (restant >= TACHE_MINIMALE) {
    notes.push(
      `${Math.round(restant)} minutes non attribuées. Tout ce qui est mesuré est déjà couvert — élargis la banque plutôt que de repasser les mêmes questions.`,
    )
  }

  if (p.joursRestants !== null && p.joursRestants <= 21) {
    notes.push(
      `Examen dans ${p.joursRestants} jours : à ce stade les points viennent du rythme et de la stratégie, pas de notions nouvelles.`,
    )
  }

  return {
    semaineDu: p.semaineDu,
    budgetMinutes: p.budgetMinutes,
    minutesPlanifiees,
    taches,
    notes,
  }
}

/** « 8 semaines », « 1 semaine », « 5 jours » : une durée lisible depuis un nombre de jours. */
export function semainesLisibles(jours: number): string {
  if (jours < 7) return `${jours} jour${jours > 1 ? 's' : ''}`
  const n = Math.round(jours / 7)
  return `${n} semaine${n > 1 ? 's' : ''}`
}

/** Le lundi de la semaine d'une date ISO. Dimanche appartient à la semaine qui s'achève. */
export function lundiDeLaSemaine(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`)
  const jour = d.getUTCDay() // 0 = dimanche
  const recul = jour === 0 ? 6 : jour - 1
  d.setUTCDate(d.getUTCDate() - recul)
  return d.toISOString().slice(0, 10)
}
