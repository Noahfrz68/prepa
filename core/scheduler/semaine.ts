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

/** Dans le dernier mois, un blanc chaque semaine : l'endurance se règle au plus près de l'échéance. */
export const SEMAINES_DERNIER_MOIS = 4

/** Semaines à laisser entre deux blancs, selon l'échéance. */
export function intervalleBlancs(semainesRestantes: number | null): number {
  return semainesRestantes !== null && semainesRestantes <= SEMAINES_DERNIER_MOIS ? 1 : SEMAINES_ENTRE_BLANCS
}
export const SEMAINES_AVANT_EXAMEN_INTENSIF = 6

/** Hors blancs, une mesure complète au moins tous les quatorze jours. */
export const JOURS_ENTRE_DIAGNOSTICS = 14

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
  /**
   * Taux de réussite du sous-test, null si non mesuré. À froid (scénarios
   * jamais vus, core/stats/afroid.ts) quand il est mesuré : la réussite globale
   * mêle méthode et familiarité — 80 % en conditions minimales, 40 % à froid.
   */
  taux: number | null
  /** Vrai quand `taux` est la réussite à froid. */
  tauxAFroid?: boolean
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
  /** Jours depuis la dernière épreuve terminée (diagnostic ou blanc) ; null si aucune. */
  joursDepuisDerniereEpreuve: number | null
  /** Séries prévues la semaine passée et non faites, par sous-test. */
  reports?: Array<{ section: string; series: number }>
  /** Note de recalibrage du budget (calibrerBudget), placée en tête des notes. */
  noteBudget?: string | null
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
/** Séries que reçoit au moins le sous-test le plus faible, dès que la semaine en compte assez. */
export const SERIES_MIN_PLUS_FAIBLE = 2
/** En dessous, la semaine est trop courte : chaque série compte, y compris les reports. */
export const SERIES_POUR_GARANTIE = 5

/**
 * Le sous-test le plus faible reçoit au moins SERIES_MIN_PLUS_FAIBLE séries.
 * La pondération par la faiblesse, une fois arrondie et après les reports,
 * pouvait lui en laisser une seule — l'expression (51 %) autant que le calcul
 * (79 %). La série manquante est prise au sous-test le mieux doté (le plus
 * réussi à égalité), sans jamais en retirer un du plan.
 */
export function garantirPlusFaible(parSection: Map<string, number>, sections: BesoinSection[]): void {
  const mesures = sections.filter((s) => s.taux !== null && s.questionsEnBanque >= 15)
  const total = [...parSection.values()].reduce((a, n) => a + n, 0)
  if (mesures.length === 0 || total < SERIES_POUR_GARANTIE) return
  const faible = mesures.reduce((a, b) => ((b.taux ?? 1) < (a.taux ?? 1) ? b : a))
  while ((parSection.get(faible.section) ?? 0) < SERIES_MIN_PLUS_FAIBLE) {
    const donneur = sections
      .filter((s) => s.section !== faible.section && (parSection.get(s.section) ?? 0) >= 2)
      .sort(
        (a, b) =>
          (parSection.get(b.section) ?? 0) - (parSection.get(a.section) ?? 0) || (b.taux ?? 0) - (a.taux ?? 0),
      )[0]
    if (!donneur) return
    parSection.set(donneur.section, (parSection.get(donneur.section) ?? 0) - 1)
    parSection.set(faible.section, (parSection.get(faible.section) ?? 0) + 1)
  }
}

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
  if (p.noteBudget) notes.push(p.noteBudget)
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
        p.semainesDepuisDernierBlanc >= intervalleBlancs(semainesRestantes)))
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

  // Un diagnostic toutes les deux semaines quand aucun blanc n'a lieu : sans
  // mesures régulières, la pente de progression (et donc l'arbitrage et
  // l'écart à la cible) repose sur deux points éloignés, ou sur rien.
  if (
    p.aDejaPasseUneEpreuve &&
    !taches.some((t) => t.type === 'blanc' || t.type === 'diagnostic') &&
    p.joursDepuisDerniereEpreuve !== null &&
    p.joursDepuisDerniereEpreuve >= JOURS_ENTRE_DIAGNOSTICS &&
    restant >= MINUTES_DIAGNOSTIC
  ) {
    taches.push({
      type: 'diagnostic',
      section: null,
      libelle: 'Diagnostic',
      skillIds: [],
      minutes: MINUTES_DIAGNOSTIC,
      quantite: 1,
      raison: `Dernière mesure il y a ${p.joursDepuisDerniereEpreuve} jours : un diagnostic toutes les deux semaines donne la pente de progression, sans laquelle l’écart à ta cible n’est qu’une photo.`,
    })
    restant -= MINUTES_DIAGNOSTIC
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
  let seriesReportees = 0
  if (nbSeries > 0) {
    // Report : ce qui n'a pas été fait la semaine passée passe d'abord, dans
    // la limite de la moitié des séries, pour que la faiblesse de la semaine
    // en cours garde sa place.
    const reportees = new Map<string, number>()
    let aReporter = Math.floor(nbSeries / 2)
    for (const r of p.reports ?? []) {
      const section = p.sections.find((s) => s.section === r.section)
      if (!section || section.questionsEnBanque < 15 || aReporter <= 0) continue
      const n = Math.min(r.series, aReporter)
      reportees.set(r.section, n)
      aReporter -= n
      seriesReportees += n
    }

    const parSection = new Map<string, number>(reportees)
    for (const { section, series } of repartirSeries(p.sections, nbSeries - seriesReportees)) {
      parSection.set(section.section, (parSection.get(section.section) ?? 0) + series)
    }
    garantirPlusFaible(parSection, p.sections)

    for (const section of p.sections) {
      const series = parSection.get(section.section) ?? 0
      if (series === 0) continue
      const report = Math.min(series, reportees.get(section.section) ?? 0)
      const mention =
        report > 0
          ? ` Dont ${report} reportée${report > 1 ? 's' : ''} de la semaine dernière, non faite${report > 1 ? 's' : ''}.`
          : ''
      taches.push({
        type: 'entrainement',
        section: section.section,
        libelle: `${series} série${series > 1 ? 's' : ''} — ${section.libelle}`,
        skillIds: section.skillIdsDus,
        minutes: series * MINUTES_PAR_SERIE,
        quantite: series,
        raison:
          (section.taux === null
            ? 'Jamais mesuré : ces séries serviront d’abord à situer ton niveau.'
            : section.skillIdsDus.length > 0
              ? `${Math.round(section.taux * 100)} % de réussite${section.tauxAFroid ? ' à froid' : ''} à la composition du plan · ${section.skillIdsDus.length} type${section.skillIdsDus.length > 1 ? 's' : ''} de question ${section.skillIdsDus.length > 1 ? 'dus' : 'dû'} à la révision.`
              : `${Math.round(section.taux * 100)} % de réussite${section.tauxAFroid ? ' à froid' : ''} à la composition du plan.`) + mention,
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
        p.semainesDepuisDernierBlanc >= intervalleBlancs(semainesRestantes))
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
        `Aucun blanc cette semaine : l’examen est dans ${semainesLisibles(p.joursRestants ?? 0)}. Les blancs reviennent toutes les ${SEMAINES_ENTRE_BLANCS} semaines à partir de ${SEMAINES_AVANT_EXAMEN_INTENSIF} semaines de l’échéance, puis chaque semaine le dernier mois, soit dans ${dans} semaine${dans > 1 ? 's' : ''} — d’ici là, le temps rapporte plus en cours et en séries.`,
      )
    } else if (p.semainesDepuisDernierBlanc !== null) {
      const intervalle = intervalleBlancs(semainesRestantes)
      const reste = Math.max(1, Math.ceil(intervalle - p.semainesDepuisDernierBlanc))
      notes.push(
        `Aucun blanc cette semaine : le dernier date de moins de ${intervalle} semaine${intervalle > 1 ? 's' : ''}. Le prochain dans ${reste} semaine${reste > 1 ? 's' : ''}.`,
      )
    }
  }

  if (seriesReportees > 0) {
    notes.push(
      `${seriesReportees} série${seriesReportees > 1 ? 's' : ''} non faite${seriesReportees > 1 ? 's' : ''} la semaine dernière ${seriesReportees > 1 ? 'sont reportées' : 'est reportée'} : elle${seriesReportees > 1 ? 's passent' : ' passe'} avant les nouvelles, dans la limite de la moitié des séries.`,
    )
  }

  if (file.length > nbLecons) {
    notes.push(
      `${file.length - nbLecons} leçon${file.length - nbLecons > 1 ? 's' : ''} attendent leur tour : le cours ne prend jamais plus de ${Math.round(plafondCours(semainesRestantes) * 100)} % de la semaine, pour que l’entraînement garde sa place.`,
    )
  }

  if (restant >= TACHE_MINIMALE) {
    notes.push(
      // Moins qu'une série : c'est l'arrondi des séries de 25 minutes, pas une
      // banque épuisée — la note l'affirmait avec près de 1 500 questions.
      restant < MINUTES_PAR_SERIE
        ? `${Math.round(restant)} minutes non attribuées : moins qu’une série de ${MINUTES_PAR_SERIE} minutes. De quoi relire les corrections de la semaine ou rejouer les reprises du carnet.`
        : `${Math.round(restant)} minutes non attribuées : aucun sous-test n’a assez de questions en banque pour une série de plus. Élargis la banque plutôt que de repasser les mêmes questions.`,
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

/* ------------------------------------------------------- calendrier -- */

export interface SemaineProjetee {
  semaineDu: string
  /** Semaines pleines restantes avant l'examen, au lundi de cette semaine. */
  semainesRestantes: number
  epreuve: 'blanc' | 'diagnostic' | null
  /** Leçons jamais étudiées qu'il resterait à la fin de la semaine. */
  leconsRestantes: number
  /** L'examen tombe cette semaine. */
  examen: boolean
}

export interface ParametresCalendrier {
  semaineDu: string
  joursRestants: number
  budgetMinutes: number
  leconsRestantes: number
  semainesDepuisDernierBlanc: number | null
  joursDepuisDerniereEpreuve: number | null
  /**
   * La semaine en cours telle que le plan FIGÉ la prévoit : son épreuve, et les
   * leçons jamais vues qui resteront une fois ses cours faits. Sans elle, le
   * calendrier rejouait les règles du jour sur une semaine composée lundi avec
   * d'autres, et contredisait le plan affiché juste au-dessus.
   */
  semaineEnCours?: { epreuve: SemaineProjetee['epreuve']; leconsRestantesFin: number }
  /**
   * Leçons nouvelles étudiées par semaine, mesurées. La projection suppose au
   * plus ce rythme : le plan peut en prévoir vingt-sept, s'il en est étudié
   * seize, c'est seize qui épuisent le cours.
   */
  leconsParSemaine?: number | null
}

/**
 * Le calendrier jusqu'à l'examen, en rejouant les règles du plan semaine
 * après semaine : quand tombent les blancs, où s'intercalent les
 * diagnostics, et à quel rythme le cours s'épuise. C'est une projection — elle
 * suppose chaque semaine faite comme prévue — et l'écran le dit.
 */
export function projeterCalendrier(p: ParametresCalendrier): SemaineProjetee[] {
  const semaines: SemaineProjetee[] = []
  let depuisBlanc = p.semainesDepuisDernierBlanc
  let depuisEpreuve = p.joursDepuisDerniereEpreuve
  let lecons = p.leconsRestantes
  const nbSemaines = Math.max(1, Math.ceil((p.joursRestants + 1) / 7))

  for (let i = 0; i < nbSemaines; i++) {
    const jours = p.joursRestants - i * 7
    const semainesRestantes = jours / 7
    const lundi = new Date(`${p.semaineDu}T00:00:00Z`)
    lundi.setUTCDate(lundi.getUTCDate() + i * 7)
    const examen = jours < 7

    let epreuve: SemaineProjetee['epreuve'] = null
    if (i === 0 && p.semaineEnCours) {
      epreuve = examen ? null : p.semaineEnCours.epreuve
    } else if (!examen) {
      const blancDu =
        depuisBlanc === null ||
        (semainesRestantes <= SEMAINES_AVANT_EXAMEN_INTENSIF && depuisBlanc >= intervalleBlancs(semainesRestantes))
      if (blancDu && p.budgetMinutes >= MINUTES_BLANC) epreuve = 'blanc'
      else if (depuisEpreuve !== null && depuisEpreuve >= JOURS_ENTRE_DIAGNOSTICS) epreuve = 'diagnostic'
    }

    if (epreuve === 'blanc') depuisBlanc = 0
    if (epreuve) depuisEpreuve = 0
    const plafond = Math.floor((p.budgetMinutes * plafondCours(semainesRestantes)) / MINUTES_PAR_LECON)
    const leconsSemaine =
      p.leconsParSemaine != null && p.leconsParSemaine > 0 ? Math.min(plafond, Math.round(p.leconsParSemaine)) : plafond
    lecons =
      i === 0 && p.semaineEnCours
        ? Math.max(0, p.semaineEnCours.leconsRestantesFin)
        : Math.max(0, lecons - (examen ? 0 : leconsSemaine))

    semaines.push({
      semaineDu: lundi.toISOString().slice(0, 10),
      semainesRestantes: Math.max(0, Math.round(semainesRestantes)),
      epreuve,
      leconsRestantes: lecons,
      examen,
    })

    if (depuisBlanc !== null) depuisBlanc += 1
    if (depuisEpreuve !== null) depuisEpreuve += 7
  }

  return semaines
}

/* ------------------------------------------------------- déséquilibre -- */

/** Séries faites au-delà du prévu à partir desquelles on parle de surentraînement. */
export const DEPASSEMENT_SIGNALE = 2

export interface Desequilibre {
  surplus: { section: string; faites: number; prevues: number; taux: number | null }
  retards: Array<{ section: string; faites: number; prevues: number; taux: number | null }>
}

/**
 * Un sous-test entraîné bien au-delà du plan pendant qu'un sous-test plus
 * faible reste en retard. Le plan ne réagissait pas : neuf séries de calcul
 * (79 %) pour une prévue, zéro sur deux en compréhension (62 %), et rien ne
 * le disait. On ne signale que ce cas précis — un surplus sur un sous-test
 * mieux réussi que ceux qu'on délaisse — : s'entraîner en plus sur sa
 * faiblesse n'a rien à corriger.
 */
export function desequilibre(
  taches: Array<{
    type: TypeTache
    section: string | null
    mesure: { faits: number; sur: number }
    fait: boolean
    tauxActuel: number | null
  }>,
): Desequilibre | null {
  const series = taches.filter((t) => t.type === 'entrainement' && t.section)
  const surplus = series
    .filter((t) => t.mesure.faits >= t.mesure.sur + DEPASSEMENT_SIGNALE)
    .sort((a, b) => b.mesure.faits - b.mesure.sur - (a.mesure.faits - a.mesure.sur))[0]
  if (!surplus) return null
  const retards = series.filter(
    (t) =>
      !t.fait &&
      t.mesure.faits < t.mesure.sur &&
      (surplus.tauxActuel === null || t.tauxActuel === null || t.tauxActuel < surplus.tauxActuel),
  )
  if (retards.length === 0) return null
  const vue = (t: (typeof series)[number]) => ({
    section: t.section as string,
    faites: t.mesure.faits,
    prevues: t.mesure.sur,
    taux: t.tauxActuel,
  })
  return { surplus: vue(surplus), retards: retards.map(vue) }
}

/* ------------------------------------------------------------ budget -- */

/** Écart toléré entre le temps déclaré et le temps mesuré avant de recalibrer. */
export const ECART_BUDGET_TOLERE = 0.2

/**
 * Le budget de la semaine, recalibré sur le temps réellement passé.
 *
 * Le plan reprenait les heures déclarées telles quelles : 10 h prévues, 7 h
 * faites, et de nouveau 10 h la semaine suivante. Un plan qu'on ne tient pas
 * n'est pas un manque de discipline, c'est un plan mal calibré. La référence
 * est la MEILLEURE des semaines passées mesurées : le rythme qu'on a prouvé
 * pouvoir tenir. Une moyenne retardait sur une préparation qui monte en
 * charge (2 h 40 puis 7 h : « 4 h 50 », et un blanc qui mangeait la semaine) ;
 * une vraie baisse se voit quand toutes les semaines retenues sont basses.
 * Au-delà de ECART_BUDGET_TOLERE d'écart avec cette référence :
 *
 *   — en dessous, le budget descend à cette référence + 10 % (de quoi
 *     progresser sans promettre ce qui ne se fera pas) ;
 *   — au-dessus, il monte à la référence, sans dépasser une fois et demie le
 *     déclaré.
 *
 * Sans mesure (première semaine), le déclaré fait foi.
 */
export function calibrerBudget(
  declareMinutes: number,
  mesuresMinutes: number[],
): { budgetMinutes: number; note: string | null } {
  if (mesuresMinutes.length === 0 || declareMinutes <= 0) return { budgetMinutes: declareMinutes, note: null }
  const reference = Math.max(...mesuresMinutes)
  const ecart = (reference - declareMinutes) / declareMinutes
  const h = (m: number) => `${Math.floor(m / 60)} h ${String(Math.round(m % 60)).padStart(2, '0')}`
  const sur = mesuresMinutes.length > 1 ? `au mieux sur les ${mesuresMinutes.length} dernières semaines` : 'la semaine dernière'
  if (ecart < -ECART_BUDGET_TOLERE) {
    const budget = Math.max(60, Math.round(reference * 1.1))
    return {
      budgetMinutes: budget,
      note: `Budget recalibré : ${h(reference)} mesurées ${sur} pour ${h(declareMinutes)} déclarées. Le plan vise ${h(budget)} — un plan tenu vaut mieux qu’un plan ambitieux. Si ta disponibilité a vraiment changé, mets-la à jour dans Objectifs.`,
    }
  }
  if (ecart > ECART_BUDGET_TOLERE) {
    const budget = Math.min(Math.round(reference), Math.round(declareMinutes * 1.5))
    return {
      budgetMinutes: budget,
      note: `Budget recalibré : ${h(reference)} mesurées ${sur}, au-delà des ${h(declareMinutes)} déclarées. Le plan suit ton rythme réel : ${h(budget)}.`,
    }
  }
  return { budgetMinutes: declareMinutes, note: null }
}
