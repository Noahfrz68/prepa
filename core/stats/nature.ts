/**
 * La nature d'une épreuve : sur quelles questions elle a été mesurée.
 *
 * Deux épreuves ne se comparent que si elles mesurent la même chose. Le
 * premier diagnostic (214) portait entièrement sur une annale réelle ; le
 * second (431), aux quatre cinquièmes sur des questions générées, que tu
 * réussis à 77 % contre 52 % pour les annales. Le « +217 » mêlait donc ta
 * progression et le changement de banque, sans qu'on puisse dire dans quelle
 * proportion.
 *
 * On classe chaque épreuve par sa part de questions d'annales, et toute
 * comparaison — écart à la précédente, courbe reliée, pente de progression —
 * ne se fait plus qu'entre épreuves de même nature.
 */

export type NatureEpreuve = 'annales' | 'generees'

/** Au moins la moitié des questions tirées d'annales réelles. */
export const SEUIL_ANNALES = 0.5

export function natureDe(partAnnales: number): NatureEpreuve {
  return partAnnales >= SEUIL_ANNALES ? 'annales' : 'generees'
}

export const LIBELLE_NATURE: Record<NatureEpreuve, string> = {
  annales: 'sur annales',
  generees: 'surtout des questions générées',
}

export function descriptionComposition(partAnnales: number): string {
  const pct = Math.round(partAnnales * 100)
  return pct === 0
    ? 'aucune question d’annale'
    : pct === 100
      ? 'toutes les questions tirées d’annales'
      : `${pct} % de questions d’annales`
}
