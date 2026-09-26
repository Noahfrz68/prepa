/**
 * Les causes d'erreur que l'on peut déclarer dans le carnet (migrations 021
 * et 023). Module pur : partagé par la base et par l'écran, qui ne doit rien
 * importer de la couche SQLite.
 */
export const CAUSES = [
  'lecture',
  'calcul',
  'methode',
  'regle',
  'vocabulaire',
  'piege',
  'temps',
  'hesitation',
] as const
export type CauseErreur = (typeof CAUSES)[number]

export const LIBELLE_CAUSE: Record<CauseErreur, string> = {
  lecture: 'Mal lu l’énoncé',
  calcul: 'Erreur de calcul',
  methode: 'Méthode inconnue',
  regle: 'Règle ignorée',
  vocabulaire: 'Sens d’un mot',
  piege: 'Tombé dans le piège',
  temps: 'Précipité, manque de temps',
  hesitation: 'Hésité entre deux',
}

/** Ce que chaque cause appelle comme travail : la raison de les distinguer. */
export const REMEDE_CAUSE: Record<CauseErreur, string> = {
  lecture: 'relire la question avant les propositions, et souligner ce qui est demandé',
  calcul: 'poser le calcul et vérifier l’ordre de grandeur avant de cocher',
  methode: 'reprendre la leçon du type de question',
  regle: 'apprendre la règle en cause, avec ses exceptions, dans la leçon du type de question',
  vocabulaire: 'noter le mot et son sens exact, puis le réemployer dans une phrase',
  piege: 'relire le piège de la leçon : c’est la proposition qu’il vise',
  temps: 'travailler le rythme en sprint, pas les notions',
  hesitation: 'éliminer explicitement avant de choisir entre les deux restantes',
}

/**
 * Les causes qui ont un sens dans chaque sous-test. « Erreur de calcul » en
 * orthographe ou « sens d'un mot » en logique ne décrivent rien : les proposer
 * brouillait le regroupement par cause.
 */
export const CAUSES_PAR_SECTION: Record<string, readonly CauseErreur[]> = {
  comprehension: ['lecture', 'vocabulaire', 'methode', 'piege', 'temps', 'hesitation'],
  calcul: ['lecture', 'calcul', 'methode', 'piege', 'temps', 'hesitation'],
  raisonnement: ['lecture', 'methode', 'piege', 'temps', 'hesitation'],
  conditions_minimales: ['lecture', 'calcul', 'methode', 'piege', 'temps', 'hesitation'],
  expression: ['lecture', 'regle', 'vocabulaire', 'piege', 'temps', 'hesitation'],
  logique: ['lecture', 'calcul', 'methode', 'piege', 'temps', 'hesitation'],
}

/** Les causes proposées pour une question de ce sous-test (toutes, par défaut). */
export function causesDe(section: string): readonly CauseErreur[] {
  return CAUSES_PAR_SECTION[section] ?? CAUSES
}
