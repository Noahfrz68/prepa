/**
 * Les causes d'erreur que l'on peut déclarer dans le carnet (migration 021).
 * Module pur : partagé par la base et par l'écran, qui ne doit rien importer
 * de la couche SQLite.
 */
export const CAUSES = ['lecture', 'calcul', 'methode', 'piege', 'temps', 'hesitation'] as const
export type CauseErreur = (typeof CAUSES)[number]

export const LIBELLE_CAUSE: Record<CauseErreur, string> = {
  lecture: 'Mal lu l’énoncé',
  calcul: 'Erreur de calcul',
  methode: 'Méthode inconnue',
  piege: 'Tombé dans le piège',
  temps: 'Précipité, manque de temps',
  hesitation: 'Hésité entre deux',
}

/** Ce que chaque cause appelle comme travail : la raison de les distinguer. */
export const REMEDE_CAUSE: Record<CauseErreur, string> = {
  lecture: 'relire la question avant les propositions, et souligner ce qui est demandé',
  calcul: 'poser le calcul et vérifier l’ordre de grandeur avant de cocher',
  methode: 'reprendre la leçon du type de question',
  piege: 'relire le piège de la leçon : c’est la proposition qu’il vise',
  temps: 'travailler le rythme en sprint, pas les notions',
  hesitation: 'éliminer explicitement avant de choisir entre les deux restantes',
}
