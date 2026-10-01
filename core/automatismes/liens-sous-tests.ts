import type { JeuId } from './types'

/**
 * Quels automatismes travailler quand on rate un type de question.
 *
 * Une erreur en drill ou en épreuve ne dit pas toujours qu'un réflexe manque
 * — une erreur de lecture n'en relève pas. Mais quand un réflexe existe pour
 * ce type de question, c'est le moins cher à acquérir : on le désigne ici.
 * Les sous-compétences sans automatisme utile (compréhension, expression,
 * argumentation, figures) n'y figurent pas.
 *
 * Les identifiants sont ceux de la taxonomie (exams/tagemage) ; un test
 * vérifie qu'ils existent toujours.
 */
export const JEUX_PAR_SOUS_TEST: Record<string, JeuId[]> = {
  // Calcul
  'tm.calcul.pourcentages_et_variations': ['fractions', 'calcul'],
  'tm.calcul.proportionnalite_et_ratios': ['fractions', 'calcul'],
  'tm.calcul.equations_du_1er_degre': ['calcul'],
  'tm.calcul.equations_du_2nd_degre': ['identites', 'formules'],
  'tm.calcul.systemes': ['calcul'],
  'tm.calcul.arithmetique_et_divisibilite': ['premiers'],
  'tm.calcul.geometrie_plane': ['pythagore', 'formules'],
  'tm.calcul.aires_et_volumes': ['formules', 'puissances'],
  'tm.calcul.moyennes_et_medianes': ['formules', 'calcul'],
  'tm.calcul.probabilites': ['formules', 'fractions'],
  'tm.calcul.denombrement': ['formules'],
  'tm.calcul.vitesses_debits_et_melanges': ['formules', 'ordres'],
  'tm.calcul.suites_et_progressions': ['formules', 'suites'],

  // Conditions minimales : le réflexe sert à voir vite ce qui se calcule.
  'tm.conditions_minimales.cm_pourcentages_et_variations': ['fractions'],
  'tm.conditions_minimales.cm_proportionnalite_et_ratios': ['fractions'],
  'tm.conditions_minimales.cm_equations_et_systemes': ['calcul'],
  'tm.conditions_minimales.cm_arithmetique_et_divisibilite': ['premiers'],
  'tm.conditions_minimales.cm_geometrie': ['pythagore', 'formules'],
  'tm.conditions_minimales.cm_statistiques_et_probabilites': ['formules', 'fractions'],

  // Logique
  'tm.logique.suites_numeriques': ['suites', 'puissances'],
  'tm.logique.suites_de_lettres': ['lettres', 'suites'],
  'tm.logique.croix_de_nombres': ['calcul'],
  'tm.logique.croix_de_lettres': ['lettres'],
  'tm.logique.operations_codees': ['calcul'],
  'tm.logique.intrus_numerique': ['premiers', 'puissances'],
  'tm.logique.intrus_alphabetique': ['lettres'],
  'tm.logique.analogies_de_lettres': ['lettres'],
  'tm.logique.dominos': ['calcul'],
  'tm.logique.cartes': ['calcul'],
}

/**
 * Sous-tests où l'erreur vient surtout de la méthode : rater un système
 * d'équations ne dit pas que le calcul mental manque. Leurs erreurs ne
 * désignent un automatisme que si le carnet les attribue au calcul ou au
 * temps. (Le dénombrement n'y est pas : une erreur y vient souvent d'une
 * formule mal sue, et les formules flash la travaillent.)
 */
export const SOUS_TESTS_DE_METHODE = new Set([
  'tm.calcul.equations_du_1er_degre',
  'tm.calcul.systemes',
  'tm.conditions_minimales.cm_equations_et_systemes',
  'tm.logique.operations_codees',
])

/** Les causes du carnet qu'un réflexe aurait évitées. */
export const CAUSES_DE_REFLEXE = new Set(['calcul', 'temps'])
