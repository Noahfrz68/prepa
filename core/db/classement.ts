import { db } from './queries'
import { classer as classerComprehension } from './comprehension'

/**
 * Classement d'un item par sous-compétence, à partir de ce qu'il contient déjà.
 *
 * Les questions entrées par import n'en portent aucune : ni les quatre-vingt-dix
 * de l'annale, ni celles d'un futur PDF. Or le plan de révision et la répétition
 * espacée ne travaillent QUE par sous-compétence — un item non classé est
 * invisible à l'un comme à l'autre, quand bien même on l'a travaillé.
 *
 * Le classement se lit dans trois choses, et pas seulement dans l'énoncé :
 *
 *  - la question posée à la fin de l'énoncé, qui donne le type en raisonnement
 *    (« Que peut-on en déduire ? » contre « Quelle proposition affaiblit… ») ;
 *  - la FORME des propositions, qui trahit le type en expression : cinq mots
 *    isolés font une question de vocabulaire, cinq variantes d'une même phrase
 *    une question d'orthographe ;
 *  - l'explication du corrigé, seule ressource en logique, où l'énoncé n'est
 *    qu'une figure et ne dit rien.
 *
 * Une question qui ne correspond à rien reste sans sous-compétence. Un
 * classement inventé serait pire que l'absence : il enverrait le plan travailler
 * une compétence qui n'est pas celle qui manque.
 */

export interface ItemAClasser {
  section: string
  enonce: string
  options: string[]
  explication: string | null
}

type Regle = { motif: RegExp; skill: string }

/** Applique la première règle qui reconnaît le texte. L'ordre fait le sens. */
function premiere(texte: string, regles: Regle[]): string | null {
  return regles.find((r) => r.motif.test(texte))?.skill ?? null
}

/* ------------------------------------------------------------- calcul -- */

const CALCUL: Regle[] = [
  { motif: /(probabilit|au hasard|tirage|lance .*d[ée]s?\b)/i, skill: 'tm.calcul.probabilites' },
  {
    motif: /(combien de (façons|manières|possibilités)|anagramme|combinaison|arrangement|podium)/i,
    skill: 'tm.calcul.denombrement',
  },
  { motif: /(moyenne|médiane)/i, skill: 'tm.calcul.moyennes_et_medianes' },
  {
    motif: /(vitesse|km\/h|par minute|par heure|débit|robinet|imprime|parcour|mélange|alliage)/i,
    skill: 'tm.calcul.vitesses_debits_et_melanges',
  },
  {
    motif: /(chaque année|chaque mois|suite|progression|premiers termes|raison de la suite)/i,
    skill: 'tm.calcul.suites_et_progressions',
  },
  {
    motif: /(multiple|diviseur|nombres? premiers?|divisible|entiers consécutifs|pgcd|ppcm|reste de la division)/i,
    skill: 'tm.calcul.arithmetique_et_divisibilite',
  },
  {
    motif: /(taux d['’]intérêt|pour ?cent|%|remise|solde|augmenté de|réduit de|placement)/i,
    skill: 'tm.calcul.pourcentages_et_variations',
  },
  // Frontières de mots obligatoires : « aire » se cache dans anniversaire et
  // dans salaire, et rangeait un problème de partage parmi les surfaces.
  { motif: /(\baires?\b|surface|volume|cm²|m²|\blitres?\b)/i, skill: 'tm.calcul.aires_et_volumes' },
  {
    motif: /(triangle|cercle|carré|rectangle|trapèze|périmètre|diagonale|hypoténuse|angle|côté)/i,
    skill: 'tm.calcul.geometrie_plane',
  },
  {
    motif: /(proportionnel|rapport|fraction|moitié|tiers|quart|cinquième|neuvième|représente)/i,
    skill: 'tm.calcul.proportionnalite_et_ratios',
  },
  { motif: /(système|deux inconnues)/i, skill: 'tm.calcul.systemes' },
  { motif: /(équation du second|discriminant|x²)/i, skill: 'tm.calcul.equations_du_2nd_degre' },
  {
    motif: /(soit [a-z] le|combien|quel est le nombre|équation|inconnue)/i,
    skill: 'tm.calcul.equations_du_1er_degre',
  },
]

/* ------------------------------------------------ conditions minimales -- */

const CONDITIONS: Regle[] = [
  {
    // Une combinaison demandée en bloc — x + y, a × b × c — se détermine
    // parfois sans qu'aucun terme ne le soit : c'est le piège central du
    // sous-test. « La somme de trois entiers consécutifs », en revanche, reste
    // une question d'arithmétique.
    motif: /(x ?\+ ?y|a ?[x×] ?b ?[x×] ?c|que vaut le produit de)/i,
    skill: 'tm.conditions_minimales.suffisance_vs_resolution',
  },
  {
    motif: /(probabilit|\bdés?\b|moyenne|médiane)/i,
    skill: 'tm.conditions_minimales.cm_statistiques_et_probabilites',
  },
  {
    motif: /(\baires?\b|surface|périmètre|triangle|trapèze|cercle|carré|rectangle|volume)/i,
    skill: 'tm.conditions_minimales.cm_geometrie',
  },
  {
    motif: /(pour ?cent|%|augmenté de|réduit de|remise|taux)/i,
    skill: 'tm.conditions_minimales.cm_pourcentages_et_variations',
  },
  {
    motif: /(proportionnel|rapport|ancienneté|par kilo|prix du kilo)/i,
    skill: 'tm.conditions_minimales.cm_proportionnalite_et_ratios',
  },
  {
    motif: /(entier|chiffres?|multiple|diviseur|nombres? premiers?|consécutifs)/i,
    skill: 'tm.conditions_minimales.cm_arithmetique_et_divisibilite',
  },
  {
    motif: /(âge|combien a-t-elle payé|combien coûte|salaire)/i,
    skill: 'tm.conditions_minimales.cm_equations_et_systemes',
  },
]

/**
 * En conditions minimales, l'explication trahit un piège que l'énoncé cache :
 * « deux solutions possibles : 7 et −7 » signale un carré, donc le piège de
 * signe. Ce contrôle passe AVANT le classement par thème, parce que ce qui est
 * réellement testé est le piège, pas le domaine.
 */
const CONDITIONS_EXPLICATION: Regle[] = [
  {
    motif: /(deux solutions|racine|valeur absolue|signe|positif ou négatif|−?\d+ et −\d+)/i,
    skill: 'tm.conditions_minimales.pieges_de_signe_et_cas_particuliers',
  },
]

/* -------------------------------------------------------- raisonnement -- */

const RAISONNEMENT: Regle[] = [
  {
    motif: /(affaiblit|contredit|infirme|remet en cause)/i,
    skill: 'tm.raisonnement.affaiblir_un_argument',
  },
  {
    motif: /(renforce|appuie|conforte|soutient le mieux)/i,
    skill: 'tm.raisonnement.renforcer_un_argument',
  },
  {
    motif: /(proverbe|adage|analogie|illustre le (mieux|moins bien)|est à .* ce que)/i,
    skill: 'tm.raisonnement.raisonnement_par_analogie',
  },
  {
    motif: /(paradoxe|contradiction apparente|explique le mieux ce)/i,
    skill: 'tm.raisonnement.resoudre_un_paradoxe',
  },
  {
    motif: /(présuppos|hypothèse implicite|suppose nécessairement|repose.*hypothèse)/i,
    skill: 'tm.raisonnement.hypothese_implicite',
  },
  {
    motif: /(sophisme|erreur de raisonnement|défaut de raisonnement|vice de)/i,
    skill: 'tm.raisonnement.identifier_un_sophisme',
  },
  {
    motif:
      /(déduire|conclure|conclusion|est vraie|qui a raison|complète le mieux|combien y a-t-il|quel jour|le plus riche|peut-on en)/i,
    skill: 'tm.raisonnement.premisse_et_conclusion',
  },
]

/* ----------------------------------------------------------- logique -- */

const LOGIQUE_EXPLICATION: Regle[] = [
  {
    motif: /(figure|angles?|côtés?|croix|boule|emplacement|forme géométrique|case)/i,
    skill: 'tm.logique.matrices_de_figures',
  },
  { motif: /(domino|carte à jouer)/i, skill: 'tm.logique.dominos_et_cartes' },
  { motif: /(intrus)/i, skill: 'tm.logique.intrus' },
  { motif: /(lettres?|alphabet|voyelles?|consonnes?)/i, skill: 'tm.logique.suites_alphanumeriques' },
  { motif: /(nombres?|chiffres?|cubes?|carrés?|somme|produit)/i, skill: 'tm.logique.suites_numeriques' },
]

/* --------------------------------------------------------- expression -- */

const CONNECTEURS =
  /^(après|avant|pour|du fait|car|mais|donc|ainsi|cependant|néanmoins|puisque|bien que|alors que|tandis que|malgré)/i

/**
 * En expression, la forme des propositions en dit plus que l'énoncé.
 *
 * Cinq mots isolés : on cherche un synonyme. Cinq variantes d'une même longue
 * phrase : on cherche la faute. Des propositions coupées par des barres
 * obliques : c'est un texte à trous. Aucune de ces trois formes ne se devine
 * en lisant la consigne, qui est souvent muette.
 */
function classerExpression(i: ItemAClasser): string | null {
  const enonce = i.enonce
  const explicite = premiere(enonce, [
    { motif: /(faute d['’]orthographe|orthographe d['’]usage|aucune faute)/i, skill: 'tm.expression.orthographe' },
    {
      motif: /(hyperbole|figure de style|métaphore|litote|euphémisme|pléonasme)/i,
      skill: 'tm.expression.coherence_et_registre',
    },
    { motif: /(intrus)/i, skill: 'tm.expression.synonymes_et_antonymes' },
    {
      motif: /(proverbe|adage|résume le mieux|reformul|sens le plus (proche|éloigné))/i,
      skill: 'tm.expression.reformulation',
    },
    { motif: /(ponctuation|syntaxe|construction de la phrase)/i, skill: 'tm.expression.correction_syntaxique' },
  ])
  if (explicite) return explicite

  if (i.options.length === 0) return null

  // Un texte à trous : les propositions énumèrent plusieurs remplissages.
  if (i.options.some((o) => o.includes('/'))) {
    const premierSegment = i.options[0].split('/')[0].trim()
    return CONNECTEURS.test(premierSegment)
      ? 'tm.expression.connecteurs_logiques'
      : 'tm.expression.coherence_et_registre'
  }

  // Cinq variantes d'une même phrase. Le début commun les trahit d'ordinaire,
  // mais pas toujours : « Tu ne vas pas le croire » et « Tu me croiras pas »
  // divergent au quatrième mot. Or cinq propositions toutes longues, dans ce
  // sous-test, ne sont jamais autre chose qu'une phrase à corriger.
  if (prefixeCommun(i.options) >= 20) return 'tm.expression.orthographe'
  if (i.options.every((o) => o.length >= 60)) return 'tm.expression.orthographe'

  // Cinq mots ou groupes courts : c'est du lexique.
  if (i.options.every((o) => o.length <= 30)) return 'tm.expression.synonymes_et_antonymes'

  return null
}

/** Longueur du plus long début commun à toutes les propositions. */
export function prefixeCommun(options: string[]): number {
  if (options.length < 2) return 0
  let n = 0
  const court = Math.min(...options.map((o) => o.length))
  while (n < court && options.every((o) => o[n] === options[0][n])) n++
  return n
}

/* --------------------------------------------------------- répartition -- */

export function classerItem(i: ItemAClasser): string | null {
  const explication = i.explication ?? ''

  switch (i.section) {
    case 'comprehension':
      return classerComprehension(i.enonce)

    case 'calcul':
      return premiere(i.enonce, CALCUL)

    case 'conditions_minimales':
      return (
        premiere(explication, CONDITIONS_EXPLICATION) ??
        premiere(i.enonce, CONDITIONS) ??
        premiere(explication, CONDITIONS)
      )

    case 'raisonnement':
      return premiere(i.enonce, RAISONNEMENT)

    case 'logique':
      // Les propositions dessinées arrivent vides : c'est le signe le plus sûr
      // qu'on est devant une matrice de figures, avant tout examen du texte.
      if (i.options.length > 0 && i.options.every((o) => o.trim() === '')) {
        return 'tm.logique.matrices_de_figures'
      }
      return premiere(explication, LOGIQUE_EXPLICATION) ?? premiere(i.enonce, LOGIQUE_EXPLICATION)

    case 'expression':
      return classerExpression(i)

    default:
      return null
  }
}

/* ------------------------------------------------------------- en base -- */

export interface RapportClassement {
  examines: number
  classes: number
  restants: number
  parSkill: Record<string, number>
  /** Ce qui reste sans sous-compétence, par sous-test. */
  parSectionRestants: Record<string, number>
}

/**
 * Classe les items qui n'ont pas encore de sous-compétence.
 *
 * Ne touche jamais un item déjà classé : le classement manuel fait en relecture
 * doit primer sur la reconnaissance automatique.
 */
export function classerItemsSansSkill(examId = 'tagemage', appliquer = true): RapportClassement {
  const d = db()

  const lignes = d
    .prepare(
      `SELECT id, section, enonce, options, explication_reference
         FROM item
        WHERE exam_id = ? AND skill_id IS NULL`,
    )
    .all(examId) as Array<Record<string, unknown>>

  const majorer = d.prepare(`UPDATE item SET skill_id = ? WHERE id = ? AND skill_id IS NULL`)

  const parSkill: Record<string, number> = {}
  const parSectionRestants: Record<string, number> = {}
  let classes = 0

  const tout = d.transaction(() => {
    for (const l of lignes) {
      const section = l.section as string
      const skill = classerItem({
        section,
        enonce: (l.enonce as string) ?? '',
        options: l.options ? (JSON.parse(l.options as string) as string[]) : [],
        explication: (l.explication_reference as string) ?? null,
      })

      if (!skill) {
        parSectionRestants[section] = (parSectionRestants[section] ?? 0) + 1
        continue
      }

      parSkill[skill] = (parSkill[skill] ?? 0) + 1
      classes++
      if (appliquer) majorer.run(skill, l.id)
    }
  })

  tout()

  return {
    examines: lignes.length,
    classes,
    restants: lignes.length - classes,
    parSkill,
    parSectionRestants,
  }
}
