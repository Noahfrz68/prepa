/**
 * La grammaire visuelle du sous-test de logique.
 *
 * À l'épreuve, une question de logique n'est presque jamais une phrase : c'est
 * une disposition. Une croix de deux séries, une bande de cases, une case
 * barrée en X avec un nombre par quartier, une figure géométrique portant une
 * lettre. Écrire « Série horizontale : XYN KLC WXA ? HIX » ne s'entraîne pas —
 * le travail de lecture, qui est la moitié de la difficulté, disparaît.
 *
 * On décrit donc la disposition, pas son rendu : une structure de données que
 * le générateur produit, que la base range en JSON, et que le composant
 * `Figure` dessine en SVG. Le même objet sert à l'écran, à l'impression et au
 * fichier hors ligne, sans image bitmap et sans dépendance.
 */

/** Neuf ancrages dans une case : les quatre coins, les quatre bords, le centre. */
export type Ancre = 'hg' | 'hd' | 'bg' | 'bd' | 'h' | 'b' | 'g' | 'd' | 'c'

export type Forme =
  | 'carre'
  | 'rectangle'
  | 'cercle'
  | 'ovale'
  | 'triangle'
  | 'losange'
  | 'pentagone'
  | 'hexagone'
  | 'heptagone'
  | 'octogone'
  | 'etoile'
  | 'fleche'
  | 'croix'

/** Traits tracés à l'intérieur de la case, par-dessus la forme s'il y en a une. */
export type Trait = 'montante' | 'descendante' | 'verticale' | 'horizontale'

/**
 * Une case : l'unité de base de toute disposition.
 *
 * Tous les champs sont facultatifs et se cumulent — c'est ce cumul qui fait la
 * difficulté du sous-test réel, où une même case porte une forme, une lettre,
 * une pastille et une orientation, et où la règle ne concerne qu'un seul de ces
 * attributs.
 */
export interface Case {
  /** Texte principal. Au centre par défaut. */
  texte?: string
  /** Où poser ce texte dans la case. */
  position?: Ancre
  /** Forme géométrique tracée dans la case. */
  forme?: Forme
  /** Quart de tour appliqué à la forme, dans le sens des aiguilles. */
  rotation?: 0 | 90 | 180 | 270
  /** Lettre ou code inscrit À L'INTÉRIEUR de la forme. */
  lettre?: string
  /** Traits internes. */
  traits?: Trait[]
  /** Petits disques pleins posés aux ancrages indiqués. */
  pastilles?: Ancre[]
  /** Les quatre quartiers d'une case barrée en X (les deux diagonales sont tracées). */
  quartiers?: Partial<Record<'h' | 'b' | 'g' | 'd', string>>
  /** Un domino : points du haut, points du bas, de 0 à 6. */
  domino?: [number, number]
  /** Une carte à jouer : valeur et enseigne. */
  carte?: { valeur: string; enseigne: 'pique' | 'coeur' | 'carreau' | 'trefle' }
  /** La case cherchée : un grand « ? ». */
  inconnue?: boolean
  /** Épaisseur du cadre. `aucun` pour une case sans bordure (suites de nombres). */
  cadre?: 'epais' | 'fin' | 'aucun'
}

/**
 * Une disposition complète.
 *
 * `croix` — deux séries qui se coupent sur la case manquante ; la ligne est
 * tracée à la hauteur du « ? » de la colonne. C'est la forme la plus courante
 * du sous-test, et celle qu'aucun rendu textuel ne restitue.
 *
 * `bande` — une rangée de cases, de gauche à droite.
 *
 * `matrice` — plusieurs rangées superposées.
 *
 * `analogie` — « A est à B ce que C est à ? », avec les flèches.
 */
export type Figure =
  | {
      type: 'croix'
      ligne: Case[]
      colonne: Case[]
      /** Index du « ? » dans la ligne — c'est la colonne où passe la verticale. */
      iLigne: number
      /** Index du « ? » dans la colonne — c'est la rangée où passe l'horizontale. */
      iColonne: number
    }
  | { type: 'bande'; cases: Case[] }
  | { type: 'matrice'; lignes: Case[][] }
  | { type: 'analogie'; a: Case; b: Case; c: Case }

/** Ce qu'une question graphique transporte, en plus de son texte. */
export interface HabillageFigure {
  /** La disposition de l'énoncé. */
  figure?: Figure
  /** Les cinq propositions dessinées, dans l'ordre de `options`. */
  optionsFigure?: Case[]
}
