import type { SectionTageMage } from '../index'
import { LECONS_CALCUL } from './calcul'
import { LECONS_COMPREHENSION } from './comprehension'
import { LECONS_CONDITIONS } from './conditions'
import { LECONS_EXPRESSION } from './expression'
import { LECONS_LOGIQUE } from './logique'
import { LECONS_RAISONNEMENT } from './raisonnement'
import type { Lecon } from './types'

export type { Lecon }

/**
 * Toutes les leçons, dans l'ordre des sous-tests de l'épreuve.
 *
 * Une par sous-compétence mesurée : c'est ce qui permet à un taux faible de
 * renvoyer vers la bonne page, et non vers un chapitre où il faudrait chercher.
 */
export const LECONS: Lecon[] = [
  ...LECONS_COMPREHENSION,
  ...LECONS_CALCUL,
  ...LECONS_RAISONNEMENT,
  ...LECONS_CONDITIONS,
  ...LECONS_EXPRESSION,
  ...LECONS_LOGIQUE,
]

export function leconsDeSection(section: SectionTageMage): Lecon[] {
  return LECONS.filter((l) => l.section === section)
}

export const PAR_SKILL = new Map(LECONS.map((l) => [l.skillId, l]))

/**
 * Un ordre d'attaque, parce que 48 leçons à plat n'ont pas d'entrée.
 *
 * Le classement ne suit ni l'ordre de l'épreuve ni la difficulté, mais le
 * RENDEMENT : ce qui se gagne par la méthode d'abord, ce qui demande des mois
 * de langue en dernier. À trois semaines de l'épreuve, l'effort rentable n'est
 * pas le même qu'à trois mois, et c'est ce que l'ordre encode.
 *
 * Ce n'est pas une mesure : c'est un jugement, et il est assumé comme tel.
 */
export interface EtapeParcours {
  titre: string
  /** Pourquoi cette marche vient à ce moment-là. */
  pourquoi: string
  /** Ce qu'on peut raisonnablement y consacrer. */
  duree: string
  skillIds: string[]
}

export const PARCOURS: EtapeParcours[] = [
  {
    titre: '1. Les règles du jeu',
    pourquoi:
      'Avant toute technique : savoir ce que rapporte une réponse, pourquoi une case vide est la seule vraie perte, et ' +
      'comment se lisent les cinq propositions des conditions minimales. Ces deux leçons ne ' +
      's’oublient plus et rapportent dès la première série.',
    duree: 'une soirée',
    skillIds: [
      'tm.conditions_minimales.maitrise_du_format_a_e',
      'tm.conditions_minimales.suffisance_vs_resolution',
    ],
  },
  {
    titre: '2. Ce qui se gagne par la seule méthode',
    pourquoi:
      'Les conditions minimales et la logique ne demandent presque aucune connaissance : la note ' +
      'y dépend d’une procédure. C’est là que la progression est la plus rapide, et c’est pour ' +
      'cela qu’on commence par là plutôt que par le sous-test qu’on aime.',
    duree: 'une semaine',
    skillIds: [
      'tm.conditions_minimales.pieges_de_signe_et_cas_particuliers',
      'tm.logique.suites_numeriques',
      'tm.logique.suites_de_lettres',
      'tm.logique.croix_de_nombres',
      'tm.logique.croix_de_lettres',
      'tm.logique.cases_barrees',
      'tm.logique.intrus_numerique',
      'tm.logique.intrus_alphabetique',
      'tm.logique.analogies_de_lettres',
      'tm.raisonnement.premisse_et_conclusion',
    ],
  },
  {
    titre: '3. Le socle de calcul',
    pourquoi:
      'Quatre familles couvrent la majorité du sous-test 2, et resservent intégralement en ' +
      'conditions minimales. Deux sous-tests sur six reposent dessus : c’est le meilleur ' +
      'rapport entre ce qu’on apprend et ce qu’on récupère.',
    duree: 'une à deux semaines',
    skillIds: [
      'tm.calcul.pourcentages_et_variations',
      'tm.calcul.proportionnalite_et_ratios',
      'tm.calcul.equations_du_1er_degre',
      'tm.calcul.moyennes_et_medianes',
    ],
  },
  {
    titre: '4. Le reste du calcul, et l’argumentation',
    pourquoi:
      'Familles moins fréquentes mais qui tombent, et les quatre types d’argumentation, qui ' +
      'suivent tous la même démarche une fois qu’on sait nommer la faille d’un raisonnement.',
    duree: 'deux semaines',
    skillIds: [
      'tm.calcul.equations_du_2nd_degre',
      'tm.calcul.systemes',
      'tm.calcul.arithmetique_et_divisibilite',
      'tm.calcul.geometrie_plane',
      'tm.calcul.aires_et_volumes',
      'tm.calcul.vitesses_debits_et_melanges',
      'tm.raisonnement.affaiblir_un_argument',
      'tm.raisonnement.renforcer_un_argument',
      'tm.raisonnement.hypothese_implicite',
      'tm.raisonnement.identifier_un_sophisme',
    ],
  },
  {
    titre: '5. Le verbal, qui se construit lentement',
    pourquoi:
      'La compréhension et l’expression dépendent d’une langue qui ne s’acquiert pas en quinze ' +
      'jours. On les travaille en fond dès le début, un peu chaque jour, sans en attendre le ' +
      'saut que produisent les sous-tests méthodiques.',
    duree: 'en continu, du premier au dernier jour',
    skillIds: [
      'tm.comprehension.idee_principale',
      'tm.comprehension.detail_explicite',
      'tm.comprehension.inference',
      'tm.expression.orthographe',
      'tm.expression.grammaire_et_conjugaison',
      'tm.expression.synonymes_et_antonymes',
      'tm.expression.connecteurs_logiques',
    ],
  },
  {
    titre: '6. Les finitions',
    pourquoi:
      'Types plus rares, ou plus fins. À garder pour le moment où le reste tient : les traiter ' +
      'trop tôt coûte du temps qui rapporterait davantage ailleurs.',
    duree: 'la dernière semaine',
    skillIds: [
      'tm.calcul.probabilites',
      'tm.calcul.denombrement',
      'tm.calcul.suites_et_progressions',
      'tm.conditions_minimales.cm_equations_et_systemes',
      'tm.conditions_minimales.cm_pourcentages_et_variations',
      'tm.conditions_minimales.cm_proportionnalite_et_ratios',
      'tm.conditions_minimales.cm_geometrie',
      'tm.conditions_minimales.cm_arithmetique_et_divisibilite',
      'tm.conditions_minimales.cm_statistiques_et_probabilites',
      'tm.logique.operations_codees',
      'tm.logique.matrices_de_figures',
      'tm.logique.suites_de_figures',
      'tm.logique.rotations_et_symetries',
      'tm.logique.intrus_figure',
      'tm.logique.analogies_de_figures',
      'tm.logique.dominos',
      'tm.logique.cartes',
      'tm.raisonnement.raisonnement_par_analogie',
      'tm.raisonnement.resoudre_un_paradoxe',
      'tm.comprehension.ton_et_intention_de_l_auteur',
      'tm.comprehension.structure_argumentative',
      'tm.comprehension.vocabulaire_en_contexte',
      'tm.expression.correction_syntaxique',
      'tm.expression.reformulation',
      'tm.expression.coherence_et_registre',
    ],
  },
]

/**
 * Les tables à savoir sans réfléchir.
 *
 * Le TAGE MAGE se joue à 80 secondes par question. Ce qui est su par cœur ne
 * coûte rien ; ce qui se recalcule coûte dix à vingt secondes, soit une
 * question entière toutes les cinq. Ces tables ne sont pas un supplément
 * culturel : ce sont les secondes qu'on ne dépensera pas.
 */
export interface Table {
  titre: string
  /** Pourquoi celle-ci mérite la place qu'elle prend en mémoire. */
  pourquoi: string
  lignes: string[]
}

export const TABLES: Table[] = [
  {
    titre: 'Fractions et pourcentages',
    pourquoi:
      'Convertir de tête évite la division posée, et permet de travailler en fractions exactes ' +
      'plutôt qu’en décimales arrondies — où l’erreur s’accumule.',
    lignes: [
      '1/2 = 50 %   ·   1/3 ≈ 33,3 %   ·   2/3 ≈ 66,7 %   ·   1/4 = 25 %   ·   3/4 = 75 %',
      '1/5 = 20 %   ·   2/5 = 40 %   ·   1/6 ≈ 16,7 %   ·   1/7 ≈ 14,3 %   ·   1/8 = 12,5 %',
      '3/8 = 37,5 %   ·   5/8 = 62,5 %   ·   1/9 ≈ 11,1 %   ·   1/12 ≈ 8,3 %',
      '1/16 = 6,25 %   ·   1/20 = 5 %   ·   1/25 = 4 %   ·   1/50 = 2 %',
    ],
  },
  {
    titre: 'Coefficients multiplicateurs',
    pourquoi:
      'Toute question de pourcentage se ramène à une multiplication par un de ces nombres. ' +
      'Les avoir en tête supprime l’étape de conversion.',
    lignes: [
      'Hausse : +5 % → ×1,05   ·   +10 % → ×1,10   ·   +20 % → ×1,20   ·   +25 % → ×1,25   ·   +50 % → ×1,50',
      'Baisse : −5 % → ×0,95   ·   −10 % → ×0,90   ·   −20 % → ×0,80   ·   −25 % → ×0,75   ·   −50 % → ×0,50',
      'Annulations exactes : +25 % s’annule par −20 %   ·   +50 % par −33,3 %   ·   +100 % par −50 %',
      'Défaire une variation = DIVISER par son coefficient, jamais appliquer l’inverse',
    ],
  },
  {
    titre: 'Carrés, cubes et racines',
    pourquoi:
      'Ils servent au second degré, aux aires, à Pythagore et aux suites de logique. C’est la ' +
      'table la plus rentable des quatre.',
    lignes: [
      '11² = 121  ·  12² = 144  ·  13² = 169  ·  14² = 196  ·  15² = 225  ·  16² = 256',
      '17² = 289  ·  18² = 324  ·  19² = 361  ·  20² = 400  ·  25² = 625  ·  30² = 900',
      '2³ = 8  ·  3³ = 27  ·  4³ = 64  ·  5³ = 125  ·  6³ = 216  ·  7³ = 343  ·  8³ = 512',
      'Puissances de 2 : 2, 4, 8, 16, 32, 64, 128, 256, 512, 1 024, 2 048',
      '√2 ≈ 1,41  ·  √3 ≈ 1,73  ·  √5 ≈ 2,24  ·  π ≈ 3,14',
    ],
  },
  {
    titre: 'Divisibilité, de tête',
    pourquoi:
      'Tester une divisibilité sans poser la division est ce qui rend l’arithmétique et les ' +
      'intrus rapides.',
    lignes: [
      'par 2 : dernier chiffre pair   ·   par 5 : finit par 0 ou 5',
      'par 3 : somme des chiffres multiple de 3   ·   par 9 : somme des chiffres multiple de 9',
      'par 4 : les deux derniers chiffres forment un multiple de 4',
      'par 6 : pair ET divisible par 3   ·   par 8 : les trois derniers forment un multiple de 8',
      'par 11 : somme alternée des chiffres (+ − + −) multiple de 11',
      'par 25 : finit par 00, 25, 50 ou 75',
    ],
  },
  {
    titre: 'Triplets de Pythagore',
    pourquoi:
      'Le concours les utilise presque toujours : les reconnaître dispense de la racine carrée ' +
      'et fait gagner trente secondes par question de géométrie.',
    lignes: [
      '3-4-5   ·   5-12-13   ·   8-15-17   ·   7-24-25   ·   9-40-41   ·   20-21-29',
      'Et tous leurs multiples : 6-8-10, 9-12-15, 12-16-20, 10-24-26, 15-36-39…',
    ],
  },
  {
    titre: 'Dénombrement',
    pourquoi:
      'Les cinq ou six valeurs qui reviennent, pour ne pas refaire le produit à chaque fois.',
    lignes: [
      'Factorielles : 3! = 6  ·  4! = 24  ·  5! = 120  ·  6! = 720  ·  7! = 5 040',
      'Combinaisons : 2 parmi 5 = 10  ·  2 parmi 6 = 15  ·  2 parmi 8 = 28  ·  2 parmi 10 = 45',
      '3 parmi 5 = 10  ·  3 parmi 6 = 20  ·  3 parmi 10 = 120',
      'Ordre compte → on multiplie n × (n−1) × …   ·   Ordre ne compte pas → on divise par k!',
    ],
  },
  {
    titre: 'Repères d’alphabet',
    pourquoi:
      'Toute la logique alphanumérique passe par la conversion en rangs. Ces six repères ' +
      'évitent de compter depuis A.',
    lignes: [
      'A = 1   ·   E = 5   ·   J = 10   ·   O = 15   ·   T = 20   ·   Y = 25   ·   Z = 26',
      'Symétrie dans l’alphabet : rang → 27 − rang (A↔Z, B↔Y, M↔N)',
      'Après Z on repart à A : compter modulo 26',
    ],
  },
]
