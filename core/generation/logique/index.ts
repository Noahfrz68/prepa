/**
 * Sous-test 6 — Logique, seize familles.
 *
 * Le découpage suit les archétypes de l'épreuve, pas une classification
 * commode : une croix de lettres et une suite de lettres partagent l'alphabet
 * et rien d'autre, un domino et une carte n'ont pas la même mécanique de
 * bouclage, un intrus numérique et un intrus figuré ne se travaillent pas avec
 * les mêmes réflexes. Six familles ne permettaient pas de dire à quelqu'un ce
 * qu'il doit réviser ; seize le permettent.
 *
 * Toutes produisent une DISPOSITION en plus d'un énoncé. C'est la différence
 * décisive avec la version précédente : le sous-test se joue autant sur la
 * lecture de la mise en page que sur la règle elle-même, et une question de
 * logique rendue en deux lignes de texte n'entraîne pas à l'épreuve.
 */

import type { Famille } from '../types'
import { FAMILLES_CROIX } from './croix'
import { FAMILLES_SERIES } from './series'
import { FAMILLES_FIGURES } from './figures'
import { FAMILLES_JEUX } from './jeux'

export const FAMILLES_LOGIQUE: Famille[] = [
  ...FAMILLES_CROIX,
  ...FAMILLES_SERIES,
  ...FAMILLES_FIGURES,
  ...FAMILLES_JEUX,
]
