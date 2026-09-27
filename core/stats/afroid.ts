/**
 * Réussite « à froid » : sur un scénario jamais rencontré.
 *
 * Le jour de l'épreuve, tout est nouveau. Or une grande part de l'entraînement
 * revoit les mêmes scénarios avec d'autres nombres — en conditions minimales,
 * la réussite passait de 43 % à la première rencontre d'un modèle à 93 % à
 * partir de la quatrième. La réussite globale mêle donc la méthode et la
 * familiarité ; la réussite à froid isole la première, et c'est elle qui
 * prédit l'épreuve.
 *
 * Le « scénario » dépend du sous-test : le texte support en compréhension, le
 * début de l'énoncé (par type de question) en calcul, en raisonnement et en
 * conditions minimales. En expression et en logique, la consigne est fixe par
 * construction : la notion n'y a pas de sens, et ces sous-tests sont exclus.
 */

/** Réponses à froid à partir desquelles ce taux est retenu (plan, stratégie, hub). */
export const REPONSES_MIN_A_FROID = 15

/** Taux à froid par sous-test, pour ceux qui ont assez de réponses. */
export function tauxAFroid(lignes: ReussiteAFroid[]): Map<string, { taux: number; n: number }> {
  return new Map(
    lignes
      .filter((r) => r.froid.n >= REPONSES_MIN_A_FROID)
      .map((r) => [r.section, { taux: r.froid.justes / r.froid.n, n: r.froid.n }]),
  )
}

/** Tentatives déjà faites sur le même scénario à partir desquelles on parle d'habitude. */
export const RENCONTRES_HABITUDE = 3

export interface TentativeScenario {
  section: string
  /** Le scénario ; null quand la notion ne s'applique pas. */
  scenario: string | null
  juste: boolean
}

export interface ReussiteAFroid {
  section: string
  froid: { n: number; justes: number }
  habitude: { n: number; justes: number }
}

/** @param tentatives dans l'ordre chronologique */
export function reussiteAFroid(tentatives: TentativeScenario[]): ReussiteAFroid[] {
  const vus = new Map<string, number>()
  const parSection = new Map<string, ReussiteAFroid>()
  for (const t of tentatives) {
    if (t.scenario === null) continue
    const cle = `${t.section}|${t.scenario}`
    const deja = vus.get(cle) ?? 0
    vus.set(cle, deja + 1)
    if (!parSection.has(t.section)) {
      parSection.set(t.section, { section: t.section, froid: { n: 0, justes: 0 }, habitude: { n: 0, justes: 0 } })
    }
    const r = parSection.get(t.section)!
    const case_ = deja === 0 ? r.froid : deja >= RENCONTRES_HABITUDE ? r.habitude : null
    if (case_) {
      case_.n++
      if (t.juste) case_.justes++
    }
  }
  return [...parSection.values()]
}
