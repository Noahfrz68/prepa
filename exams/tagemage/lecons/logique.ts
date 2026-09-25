import type { Lecon } from './types'

/**
 * Sous-test 6 — Logique, seize leçons.
 *
 * C'est le sous-test où le niveau de départ compte le moins et la méthode le
 * plus : aucune connaissance n'est exigée, et c'est précisément ce qui le rend
 * difficile. Sans procédure, on fixe la série en espérant que la règle
 * apparaisse ; avec une procédure, on l'essaie, on l'élimine, on passe à la
 * suivante. Chaque leçon donne donc un ORDRE DE TEST — la liste des règles à
 * essayer, dans l'ordre de leur fréquence réelle — parce que c'est ce qui
 * remplace l'inspiration.
 *
 * Le découpage en seize familles n'est pas une commodité de rangement. Un
 * intrus numérique et un intrus figuré n'appellent pas les mêmes réflexes ; un
 * domino et une carte ne bouclent pas pareil ; une croix et une suite ne se
 * lisent pas dans le même sens. Les confondre, c'était se priver de savoir
 * laquelle des deux fait perdre des points.
 */

/* ------------------------------------------------------------------------ */
/*  Ce qui vaut pour tout le sous-test, avant toute famille                   */
/* ------------------------------------------------------------------------ */

/**
 * Les quatre gestes qui reviennent dans les seize familles.
 *
 * Ils sont répétés dans les leçons qui les emploient, et c'est voulu : une
 * règle lue une fois en préambule ne s'applique pas, une règle relue au moment
 * où l'on en a besoin s'applique.
 */
export const FONDATIONS_LOGIQUE: Array<{ titre: string; texte: string }> = [
  {
    titre: '1. Convertir avant de comparer',
    texte:
      'Des lettres ne se comparent pas à l’œil : on les remplace par leur rang (A = 1, B = 2, … ' +
      'Z = 26). Des figures ne se comparent pas à l’œil non plus : on les remplace par un nombre ' +
      '(combien de côtés, combien de points, combien de traits). Une régularité invisible sur des ' +
      'symboles saute aux yeux sur des nombres. Ce geste, à lui seul, débloque la moitié du sous-test.',
  },
  {
    titre: '2. Décomposer en attributs, et les traiter séparément',
    texte:
      'Un groupe de trois lettres, ce sont trois suites indépendantes, pas une. Un domino, ce sont ' +
      'deux suites. Une figure, ce sont souvent trois attributs — la forme, la lettre, le point. ' +
      'On ne regarde JAMAIS un objet en bloc : on prend un attribut, on le suit sur toute la série, ' +
      'on conclut, puis on passe au suivant. Vouloir tout voir d’un coup est la première cause ' +
      'd’échec sur ce sous-test.',
  },
  {
    titre: '3. Un attribut qui varie partout ne dit rien',
    texte:
      'Si les cinq figures ont cinq formes différentes, la forme n’est pas la règle : elle ne ' +
      'sépare rien. C’est une déduction, pas une impression, et elle se fait en trois secondes. ' +
      'Repérer et écarter les attributs qui ne portent aucune règle réduit souvent le problème de ' +
      'trois dimensions à une seule.',
  },
  {
    titre: '4. Valider sur tous les éléments visibles',
    texte:
      'Deux points suffisent à tracer n’importe quelle droite. Une règle vérifiée sur deux ' +
      'éléments est une coïncidence ; il en faut trois pour qu’elle soit crédible, quatre pour en ' +
      'être sûr. Et lorsque deux lectures indépendantes donnent la même réponse, on peut cocher ' +
      'sans relire.',
  },
]

/**
 * L'ordre de test, toutes familles confondues — la fiche à relire la veille.
 *
 * C'est le seul contenu du sous-test qui mérite d'être su par cœur : il ne
 * s'agit pas de connaissances mais d'un itinéraire de recherche, et c'est lui
 * qui fait la différence entre trouver en vingt secondes et ne pas trouver.
 */
export const ORDRE_DE_TEST: Array<{ sur: string; essais: string[] }> = [
  {
    sur: 'Une suite de nombres',
    essais: [
      'écart constant (suite arithmétique)',
      'écarts qui progressent régulièrement',
      'rapport constant (suite géométrique)',
      'alternance de deux règles',
      'chaque terme dépend des DEUX précédents (type Fibonacci)',
      'carrés, cubes, ou ces suites décalées de 1',
      'la règle porte sur les CHIFFRES et non sur la valeur',
    ],
  },
  {
    sur: 'Une suite de lettres',
    essais: [
      'convertir en rangs, puis traiter chaque position séparément',
      'pas constant, avec repli après Z',
      'pas qui grandit',
      'alternance avant/arrière',
      'une position qui ne bouge pas, ou qui est libre',
    ],
  },
  {
    sur: 'Un intrus, quel qu’il soit',
    essais: [
      'chercher la règle que QUATRE partagent, jamais l’anomalie d’un seul',
      'nombres : carrés — cubes — premiers — parité — multiples — somme des chiffres',
      'lettres : écart interne — lettres consécutives — voyelle/consonne — symétrie A↔Z',
      'figures : nombre de côtés — parité de ce nombre — symétrie — nombre de points',
    ],
  },
  {
    sur: 'Une croix (deux séries qui se croisent)',
    essais: [
      'lire la rangée seule : que vérifie chaque case TOUTE SEULE ?',
      'lire la colonne seule : qu’est-ce qui change d’une case à la suivante ?',
      'ne garder que la proposition qui vérifie les DEUX',
    ],
  },
  {
    sur: 'Une figure, une matrice, une analogie figurée',
    essais: [
      'lister les attributs qui peuvent changer, et les compter à voix basse',
      'écarter ceux qui varient partout : ils ne portent rien',
      'suivre chaque attribut restant sur toute la série, un à la fois',
      'éliminer les propositions sur l’attribut le plus rapide à vérifier',
    ],
  },
]

/* ------------------------------------------------------------------------ */

export const LECONS_LOGIQUE: Lecon[] = [
  /* ------------------------------------------------ suites numériques -- */
  {
    skillId: 'tm.logique.suites_numeriques',
    section: 'logique',
    titre: 'Suites numériques',
    quoi: 'Trouver la règle qui engendre une suite de nombres, puis le terme suivant.',
    retrouver: [
      {
        q: 'Quel geste faire avant toute réflexion sur une suite ?',
        r: 'Écrire les écarts sous la suite.',
      },
      {
        q: 'Dans quel ordre teste-t-on les règles ?',
        r: 'Écart constant → écarts en progression → rapport constant → alternance → dépendance aux deux termes précédents → carrés et cubes → règle sur les chiffres.',
      },
      {
        q: 'Combien de termes faut-il pour valider une règle ?',
        r: 'Trois pour qu’elle soit crédible, quatre pour en être sûr. Deux ne prouvent rien.',
      },
      {
        q: 'Que faire quand les écarts ne donnent rien ?',
        r: 'Écrire les écarts DES écarts. Si cela ne donne rien non plus, passer au rapport entre termes consécutifs.',
      },
    ],
    regles: [
      {
        titre: 'Écrire les écarts sous la suite',
        texte:
          'Le geste à faire avant toute réflexion, sans exception. Sous 3, 7, 11, 15 on écrit ' +
          '+4, +4, +4 : la règle se lit. Sous 2, 5, 11, 23 on écrit +3, +6, +12 : les écarts ' +
          'doublent. Ce n’est pas une technique parmi d’autres, c’est la porte d’entrée de la famille.',
      },
      {
        titre: 'Les écarts des écarts',
        texte:
          'Quand la première ligne d’écarts n’est pas constante, on en fait une deuxième. ' +
          'Sur 3, 4, 8, 17, 33 : écarts +1, +4, +9, +16 — puis écarts de ces écarts : +3, +5, +7. ' +
          'Deux lignes suffisent presque toujours.',
      },
      {
        titre: 'L’ordre de test, du plus fréquent au plus rare',
        texte:
          '1) Écart constant (arithmétique). 2) Écarts en progression régulière. 3) Rapport ' +
          'constant (géométrique). 4) Alternance de deux règles. 5) Chaque terme dépend des DEUX ' +
          'précédents (type Fibonacci). 6) Carrés ou cubes, éventuellement décalés de 1. ' +
          '7) La règle porte sur les CHIFFRES et non sur la valeur.',
      },
      {
        titre: 'Les suites de carrés et de cubes déguisées',
        texte:
          '1, 4, 9, 16, 25 sont des carrés ; 2, 5, 10, 17, 26 sont ces mêmes carrés + 1 ; ' +
          '0, 3, 8, 15, 24 sont ces mêmes carrés − 1. Devant une suite qui accélère sans rapport ' +
          'constant, tester n², n² ± 1, puis n³. Trois essais, dix secondes.',
      },
      {
        titre: 'Quand la règle porte sur les chiffres',
        texte:
          'Somme des chiffres, produit des chiffres, chiffres inversés, chiffres triés. À tester ' +
          'dès que les termes n’ont pas d’ordre de grandeur cohérent entre eux — une suite qui ' +
          'passe de 12 à 340 puis revient à 45 ne suit pas une règle sur les valeurs.',
      },
      {
        titre: 'L’alternance : deux suites entrelacées',
        texte:
          'Sur 2, 100, 5, 90, 8, 80 il n’y a pas une suite mais deux : les rangs impairs ' +
          '(2, 5, 8 : +3) et les rangs pairs (100, 90, 80 : −10). Signe qui ne trompe pas : ' +
          'les écarts alternent entre positif et négatif, ou entre petit et grand.',
      },
      {
        titre: 'Valider sur TOUS les termes visibles',
        texte:
          'Deux points suffisent à tracer n’importe quelle droite. Une règle vérifiée sur deux ' +
          'termes est une coïncidence ; il en faut trois pour qu’elle soit crédible, quatre pour ' +
          'en être sûr.',
      },
      {
        titre: 'Le contrôle par la seconde lecture',
        texte:
          'Quand deux règles différentes donnent le même terme suivant, la réponse est sûre et ' +
          'on coche sans relire. C’est le seul contrôle gratuit du sous-test : il coûte dix ' +
          'secondes et supprime le doute.',
      },
    ],
    exemple: {
      enonce: 'Complétez : 4, 7, 13, 25, 49, ?',
      etapes: [
        'Écarts : +3, +6, +12, +24. Ils doublent — la règle porte sur l’écart.',
        'Écart suivant : +48. Donc 49 + 48 = 97.',
        'Contrôle par une autre lecture : chaque terme vaut le double du précédent moins 1. ' +
          '2 × 49 − 1 = 97. Les deux lectures concordent.',
      ],
      reponse: '97. Deux lectures indépendantes tombent sur le même terme : la règle est sûre.',
    },
    aToi: {
      enonce: 'Trouve le terme suivant de la suite : 3, 4, 8, 17, 33, ?',
      indice: 'Écris les écarts. Puis regarde les écarts des écarts.',
      reponse:
        '58. Écarts : +1, +4, +9, +16 — ce sont les carrés 1², 2², 3², 4². Le suivant est 5² = 25, ' +
        'donc 33 + 25 = 58.',
    },
    piege:
      'S’arrêter à la première règle qui marche sur deux termes. Quand deux lectures différentes ' +
      'donnent le même terme suivant, on est sûr ; quand une seule marche à moitié, on cherche encore.',
    parCoeur: [
      'Carrés : 1, 4, 9, 16, 25, 36, 49, 64, 81, 100, 121, 144, 169, 196, 225',
      'Cubes : 1, 8, 27, 64, 125, 216, 343, 512, 729, 1000',
      'Puissances de 2 : 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024',
      'Premiers : 2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47',
      'Fibonacci : 1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89',
    ],
  },

  /* ------------------------------------------------- suites de lettres -- */
  {
    skillId: 'tm.logique.suites_de_lettres',
    section: 'logique',
    titre: 'Suites de lettres',
    quoi: 'Traiter des lettres comme des nombres, et suivre chaque position séparément.',
    retrouver: [
      {
        q: 'Quel est le rang de la lettre O ?',
        r: '15. Repères : A = 1, E = 5, J = 10, O = 15, T = 20, Y = 25, Z = 26.',
      },
      {
        q: 'Dans un groupe de trois lettres, comment lit-on la série ?',
        r: 'Une POSITION à la fois : toutes les premières lettres, puis toutes les deuxièmes, puis toutes les troisièmes.',
      },
      { q: 'Que se passe-t-il après Z ?', r: 'On repart à A. Y + 3 donne B — on compte modulo 26.' },
      {
        q: 'Que faire d’une position qui ne suit aucune règle ?',
        r: 'La laisser. Certaines positions sont libres : elles servent à remplir, et les chercher fait perdre la question.',
      },
    ],
    regles: [
      {
        titre: 'Convertir en rangs, toujours',
        texte:
          'A = 1, B = 2, … Z = 26. Aucune progression alphabétique ne se voit sur des lettres ; ' +
          'toutes se voient sur des nombres. Écrire le rang sous chaque lettre coûte cinq secondes ' +
          'et supprime presque toutes les erreurs de la famille.',
      },
      {
        titre: 'Les six repères qui évitent de compter',
        texte:
          'A = 1, E = 5, J = 10, O = 15, T = 20, Y = 25. On se place sur le repère le plus proche ' +
          'et on ajuste de un ou deux. Q ? Après O = 15, donc Q = 17. Sans repères, on recompte ' +
          'depuis A à chaque fois — et c’est là que les minutes partent.',
      },
      {
        titre: 'Une POSITION à la fois',
        texte:
          'Un groupe de trois lettres, ce sont trois suites indépendantes. On lit toutes les ' +
          'premières lettres de la série, on conclut ; puis toutes les deuxièmes ; puis toutes ' +
          'les troisièmes. Jamais les groupes en bloc.',
      },
      {
        titre: 'Le repli après Z',
        texte:
          'L’alphabet boucle : après Z on revient à A. Une progression qui semble s’interrompre ' +
          'continue de l’autre côté. X + 4 = B (24 + 4 = 28, on retranche 26 → 2). De même vers ' +
          'l’arrière : C − 5 = X (3 − 5 = −2, on ajoute 26 → 24).',
      },
      {
        titre: 'La position libre',
        texte:
          'Dans un groupe de trois, une position ne porte parfois AUCUNE règle : elle est tirée au ' +
          'hasard pour rendre les propositions crédibles. Le signe : ses rangs ne forment ni suite ' +
          'ni répétition. Dès qu’on l’a repéré, on l’ignore — et on gagne trente secondes.',
      },
      {
        titre: 'Les trois mouvements les plus fréquents',
        texte:
          'Pas constant (le plus courant, de loin) ; pas qui grandit (+1, +2, +3, +4) ; deux ' +
          'positions qui avancent en sens contraire. Ces trois-là couvrent l’essentiel de la famille.',
      },
      {
        titre: 'La symétrie de l’alphabet',
        texte:
          'A ↔ Z, B ↔ Y, C ↔ X… deux lettres symétriques ont des rangs dont la somme vaut 27. ' +
          'C’est une règle rare mais imparable quand elle tombe : dès que deux lettres d’un couple ' +
          'font 27, on la tient.',
      },
    ],
    exemple: {
      enonce: 'Complétez : A, C, F, J, ?',
      etapes: [
        'Rangs : 1, 3, 6, 10.',
        'Écarts : +2, +3, +4. Le pas grandit d’une unité à chaque fois.',
        'Écart suivant : +5. Donc 10 + 5 = 15, c’est-à-dire O.',
      ],
      reponse: 'O. Le pas qui grandit est le deuxième mouvement le plus fréquent de la famille.',
    },
    aToi: {
      enonce: 'Complétez : BXC, EUF, HRI, KOL, ?',
      indice: 'Convertis les trois positions en rangs. Chacune suit sa propre règle.',
      reponse:
        'NLO. Rangs : (2, 24, 3), (5, 21, 6), (8, 18, 9), (11, 15, 12). ' +
        'La 1ʳᵉ avance de 3 → 14 = N. La 2ᵉ recule de 3 → 12 = L. La 3ᵉ avance de 3 → 15 = O.',
    },
    piege:
      'Chercher une régularité sur une position qui n’en porte aucune. Si les rangs d’une position ' +
      'ne forment ni suite ni répétition sur QUATRE groupes, elle est libre : on passe.',
    parCoeur: [
      'A = 1 · E = 5 · J = 10 · O = 15 · T = 20 · Y = 25 · Z = 26',
      'Voyelles : A(1), E(5), I(9), O(15), U(21), Y(25)',
      'Symétriques : A↔Z, B↔Y, C↔X, D↔W — la somme des rangs vaut 27',
    ],
  },

  /* -------------------------------------------------- croix de nombres -- */
  {
    skillId: 'tm.logique.croix_de_nombres',
    section: 'logique',
    titre: 'Croix de nombres',
    quoi:
      'Deux séries de nombres se coupent sur une case vide. Trouver le nombre qui appartient aux ' +
      'deux à la fois.',
    retrouver: [
      {
        q: 'Sur une croix, la règle est-elle une progression ou une propriété ?',
        r: 'Une propriété partagée, presque toujours : tous carrés, tous multiples de 7, toutes sommes de chiffres égales.',
      },
      {
        q: 'Dans quel ordre teste-t-on les propriétés ?',
        r: 'Carrés → cubes → multiples d’un même nombre → premiers → somme des chiffres → produit des chiffres.',
      },
      {
        q: 'Que faire quand une proposition vérifie la première règle ?',
        r: 'Tester la seconde. C’est exactement là que la question se gagne ou se perd : chaque leurre en vérifie une seule.',
      },
      {
        q: 'Quel nombre est à la fois un carré et un cube ?',
        r: '64 (8² et 4³), et 729 (27² et 9³). Ce sont les puissances sixièmes.',
      },
    ],
    regles: [
      {
        titre: 'Lire les deux séries SÉPARÉMENT, dans cet ordre',
        texte:
          'D’abord la rangée horizontale seule, sans regarder la colonne : qu’est-ce que ces ' +
          'quatre nombres partagent ? Puis la colonne seule. Vouloir voir les deux règles en même ' +
          'temps est le meilleur moyen de n’en voir aucune.',
      },
      {
        titre: 'Ce n’est pas une suite : c’est une propriété',
        texte:
          'Sur une croix, les nombres d’une même série ne se suivent presque jamais. 36, 121, 81, ' +
          '16 ne progressent pas — ce sont tous des carrés. Chercher un écart constant ici fait ' +
          'perdre la question : on cherche ce qu’ils SONT, pas comment ils s’enchaînent.',
      },
      {
        titre: 'L’ordre de test des propriétés',
        texte:
          '1) Carrés parfaits. 2) Cubes parfaits. 3) Multiples d’un même nombre. 4) Nombres ' +
          'premiers. 5) Somme des chiffres constante. 6) Produit des chiffres constant. ' +
          '7) Parité, ou chiffre final commun.',
      },
      {
        titre: 'L’intersection se déduit souvent sans chercher',
        texte:
          'Carrés ET cubes → une puissance sixième : 64 ou 729, il n’y en a pas d’autres dans les ' +
          'ordres de grandeur du test. Multiples de 4 ET de 9 → multiples de 36. Multiples de 3 ET ' +
          'de 4 → multiples de 12. Connaître ces trois cas fait gagner la question entière.',
      },
      {
        titre: 'Les critères de divisibilité, à savoir sans réfléchir',
        texte:
          'Par 2 : le nombre est pair. Par 3 : la somme des chiffres est un multiple de 3. Par 4 : ' +
          'les deux derniers chiffres forment un multiple de 4. Par 5 : il finit par 0 ou 5. ' +
          'Par 9 : la somme des chiffres est un multiple de 9. Par 11 : la somme alternée ' +
          '(+ − + −) est un multiple de 11.',
      },
      {
        titre: 'Tester la SECONDE règle, systématiquement',
        texte:
          'Les leurres sont construits pour vérifier une règle et une seule. Dès qu’une proposition ' +
          'satisfait la première, la tentation est de cocher — et c’est exactement le piège. ' +
          'Cinq secondes de vérification, un point sauvé.',
      },
    ],
    exemple: {
      enonce:
        'Horizontale : 28, 16, ?, 44, 52. Verticale : 27, 45, ?, 63, 99. ' +
        'Quel nombre appartient aux deux séries ?',
      etapes: [
        'Rangée seule : 28, 16, 44, 52. Ils ne progressent pas. Sont-ils des carrés ? Non. ' +
          'Des multiples d’un même nombre ? 28 = 4 × 7, 16 = 4 × 4, 44 = 4 × 11, 52 = 4 × 13. ' +
          'Ce sont des multiples de 4.',
        'Colonne seule : 27, 45, 63, 99. Somme des chiffres : 9, 9, 9, 18 — tous multiples de 9. ' +
          'Ce sont des multiples de 9.',
        'Le nombre cherché doit être multiple de 4 ET de 9, donc multiple de 36.',
        'Parmi les propositions, une seule l’est : 72 = 4 × 18 = 9 × 8.',
      ],
      reponse:
        '72. Le raccourci à retenir : multiple de a et de b, avec a et b sans diviseur commun, ' +
        'signifie multiple de a × b.',
    },
    aToi: {
      enonce:
        'Horizontale : 49, 16, ?, 100, 25. Verticale : 8, 27, ?, 125, 216. ' +
        'Quel nombre appartient aux deux séries ?',
      indice: 'Chaque série a une propriété très classique. Elles se croisent sur un nombre unique.',
      reponse:
        '64. La rangée ne contient que des carrés (7², 4², 10², 5²), la colonne que des cubes ' +
        '(2³, 3³, 5³, 6³). Le seul nombre qui soit les deux est 64 = 8² = 4³.',
    },
    piege:
      'Cocher dès que la première règle est vérifiée. Chaque leurre appartient à UNE des deux ' +
      'séries : c’est précisément ce qui le rend tentant.',
    parCoeur: [
      'Carrés jusqu’à 225 : 1, 4, 9, 16, 25, 36, 49, 64, 81, 100, 121, 144, 169, 196, 225',
      'Cubes jusqu’à 1000 : 1, 8, 27, 64, 125, 216, 343, 512, 729, 1000',
      'Carrés ET cubes : 64 et 729',
      'Divisibilité par 3 et 9 : somme des chiffres · par 4 : deux derniers chiffres · par 11 : somme alternée',
    ],
  },

  /* -------------------------------------------------- croix de lettres -- */
  {
    skillId: 'tm.logique.croix_de_lettres',
    section: 'logique',
    titre: 'Croix de lettres',
    quoi:
      'Deux règles se croisent sur un groupe manquant : une règle DANS chaque groupe, une règle ' +
      'ENTRE les groupes de la colonne.',
    retrouver: [
      {
        q: 'Quelle est la différence entre la règle horizontale et la verticale ?',
        r: 'L’horizontale est interne à chaque groupe (« les deux premières lettres se suivent »). La verticale relie les groupes entre eux (« la 2ᵉ lettre recule d’un rang à chaque case »).',
      },
      {
        q: 'Par laquelle commencer ?',
        r: 'Par la rangée : la règle interne se lit sur un seul groupe et se confirme sur les autres. La verticale demande de suivre une position sur toute la colonne.',
      },
      {
        q: 'Combien de positions la règle contraint-elle, en général ?',
        r: 'Deux sur trois. La troisième est libre — c’est normal, et la chercher fait perdre la question.',
      },
      {
        q: 'Comment un leurre est-il construit ?',
        r: 'Il vérifie UNE des deux règles, jamais les deux. C’est ce qui le rend tentant.',
      },
    ],
    regles: [
      {
        titre: 'Repérer ce qui est interne et ce qui est externe',
        texte:
          'La règle horizontale se vérifie sur UN groupe pris isolément : « la 2ᵉ lettre suit la ' +
          '1ʳᵉ ». La règle verticale ne se vérifie qu’en comparant plusieurs groupes : « la 2ᵉ ' +
          'lettre recule d’un rang d’une case à la suivante ». Distinguer les deux est la moitié ' +
          'du travail.',
      },
      {
        titre: 'Commencer par la rangée',
        texte:
          'La règle interne se lit sur un seul groupe, donc en trois secondes, et se confirme sur ' +
          'les trois autres. La verticale demande de convertir quatre groupes en rangs. On fait ' +
          'le rapide d’abord : il contraint déjà une position.',
      },
      {
        titre: 'Sur la colonne, une seule position à la fois',
        texte:
          'On choisit une position — disons la deuxième lettre — et on écrit ses rangs sur toute ' +
          'la colonne : 5, 4, 3, ?, 1. La progression apparaît, et la case manquante vaut 2, ' +
          'soit B. Puis, seulement si besoin, on recommence sur une autre position.',
      },
      {
        titre: 'Attention à la case sautée',
        texte:
          'Le « ? » occupe une place dans la colonne : entre la case juste au-dessus et celle juste ' +
          'au-dessous, il y a DEUX pas, pas un. C’est l’erreur d’arithmétique la plus fréquente de ' +
          'la famille, et elle donne toujours une réponse qui figure parmi les propositions.',
      },
      {
        titre: 'La position libre, encore',
        texte:
          'Une des trois lettres ne porte généralement aucune règle. Elle sert à peupler les ' +
          'propositions. Dès qu’on a identifié les deux positions contraintes, on ne regarde plus ' +
          'que celles-là.',
      },
      {
        titre: 'Éliminer, plutôt que construire',
        texte:
          'Plutôt que de fabriquer la réponse puis de la chercher dans la liste, on part des cinq ' +
          'propositions et on applique la règle interne : deux ou trois tombent immédiatement. ' +
          'On n’applique la règle verticale qu’aux survivantes. Deux passes rapides valent mieux ' +
          'qu’une construction lente.',
      },
    ],
    exemple: {
      enonce:
        'Rangée : RXT, CFE, ?, HQJ, WAY. Colonne : DZF, GKI, JSL, ?, PCR. ' +
        'Propositions : MBO, MBN, NBP, KMM, MOP.',
      etapes: [
        'Règle interne, sur un groupe de la rangée : RXT → R = 18, T = 20. La 3ᵉ lettre vaut la ' +
          '1ʳᵉ plus 2. Vérification : CFE (3 → 5 ✓), HQJ (8 → 10 ✓), WAY (23 → 25 ✓).',
        'Règle verticale, sur la 1ʳᵉ lettre de la colonne : D = 4, G = 7, J = 10, ?, P = 16. ' +
          'Elle avance de 3 à chaque case. Attention à la case sautée : après J = 10 vient ' +
          '13 = M, et 16 = P ferme bien la série.',
        'Le groupe cherché commence donc par M, et sa 3ᵉ lettre vaut 13 + 2 = 15 = O. La 2ᵉ est libre.',
        'On teste les propositions : MBN (M → N, écart 1 ✗), NBP (N → P ✓ interne, mais commence ' +
          'par N ✗ verticale), KMM (K → M ✓ interne, commence par K ✗), MOP (M → P, écart 3 ✗). ' +
          'Reste MBO.',
      ],
      reponse:
        'MBO. Trois des quatre leurres vérifient exactement une des deux règles : c’est la ' +
        'signature de la famille.',
    },
    aToi: {
      enonce:
        'Rangée : FGQ, MNB, ?, STX, WXD. Colonne : CDM, GHZ, ?, OPR, STF. ' +
        'Propositions : KLJ, KMJ, JKJ, OPJ, LKJ.',
      indice:
        'La règle interne se lit sur un seul groupe de la rangée. Pour la verticale, prends la ' +
        '1ʳᵉ lettre de la colonne et écris ses rangs — sans oublier que le « ? » occupe une case.',
      reponse:
        'KLJ. Règle interne : la 2ᵉ lettre suit la 1ʳᵉ (F→G, M→N, S→T, W→X). Règle verticale sur ' +
        'la 1ʳᵉ lettre : C = 3, G = 7, ?, O = 15, S = 19 — un pas de 4, donc la case manquante ' +
        'vaut 11 = K. Le groupe commence par K, et la règle interne impose L en deuxième. ' +
        'La 3ᵉ lettre est libre. KMJ échoue sur la règle interne (K → M, écart 2), JKJ et OPJ la ' +
        'respectent mais ne commencent pas par K, LKJ échoue sur les deux.',
    },
    piege:
      'Oublier que le « ? » occupe une case : entre la case du dessus et celle du dessous, il y a ' +
      'deux pas. Le leurre qui correspond à « un pas » est toujours proposé.',
    parCoeur: [
      'A = 1 · E = 5 · J = 10 · O = 15 · T = 20 · Y = 25 · Z = 26',
      'Deux règles, deux positions contraintes, une position libre : c’est la structure standard',
    ],
  },

  /* ----------------------------------------------------- cases barrées -- */
  {
    skillId: 'tm.logique.cases_barrees',
    section: 'logique',
    titre: 'Cases barrées',
    quoi:
      'Trois cases divisées en quatre quartiers obéissent à une même règle. Trouver la quatrième ' +
      'qui y obéit aussi.',
    retrouver: [
      {
        q: 'Les trois cases du haut forment-elles une suite ?',
        r: 'Non. Ce sont trois EXEMPLES d’une même règle. Chercher une progression entre elles fait perdre la question.',
      },
      {
        q: 'Par quoi commencer quand une case mêle nombres et lettre ?',
        r: 'Par la lettre : voyelle ou consonne, rang pair ou impair. C’est le test le plus rapide, et il élimine souvent deux propositions.',
      },
      {
        q: 'Quelles relations tester entre les nombres ?',
        r: 'Somme des chiffres égale → diviseur commun → somme, différence ou produit des deux nombres.',
      },
      {
        q: 'Que signifie une règle en deux parties ?',
        r: 'Qu’il faut vérifier les DEUX sur chaque proposition. Les leurres n’en respectent qu’une.',
      },
    ],
    regles: [
      {
        titre: 'Trois exemples, pas une suite',
        texte:
          'C’est la confusion qui coûte le plus cher. Les cases du haut ne s’enchaînent pas : ' +
          'elles illustrent. On cherche ce qu’elles ont EN COMMUN, exactement comme sur un intrus, ' +
          'et non ce qui change de l’une à l’autre.',
      },
      {
        titre: 'La position dans la case ne compte presque jamais',
        texte:
          'Le nombre placé en haut dans une case peut être placé à gauche dans la suivante : la ' +
          'disposition varie exprès. La règle porte sur les VALEURS, pas sur les emplacements. ' +
          'Vouloir aligner les quartiers est une perte de temps pure.',
      },
      {
        titre: 'Commencer par la lettre',
        texte:
          'Voyelle ou consonne ? Rang pair ou impair ? Première moitié ou seconde moitié de ' +
          'l’alphabet ? Ces trois tests prennent cinq secondes et éliminent souvent deux ' +
          'propositions avant même d’avoir regardé les nombres.',
      },
      {
        titre: 'Les relations à tester entre les nombres',
        texte:
          '1) Même somme des chiffres — de loin la plus fréquente. 2) Un diviseur commun. ' +
          '3) Leur différence, ou leur somme, vaut quelque chose de remarquable. 4) Le rang de la ' +
          'lettre égale leur somme, leur différence, ou leur nombre de diviseurs.',
      },
      {
        titre: 'La règle est presque toujours double',
        texte:
          'Une condition sur les nombres ET une condition sur la lettre. C’est ce qui permet de ' +
          'construire quatre leurres crédibles. Une proposition qui « ressemble » aux exemples ' +
          'n’en vérifie généralement que la moitié.',
      },
      {
        titre: 'Tester par élimination, pas par construction',
        texte:
          'On ne fabrique pas la bonne case : on applique la moitié la plus rapide de la règle aux ' +
          'cinq propositions, on en élimine deux ou trois, puis on vérifie l’autre moitié sur ce ' +
          'qui reste. Deux passes courtes battent une analyse longue.',
      },
    ],
    exemple: {
      enonce:
        'Cases de référence : (23, 41, e) — (34, 61, o) — (15, 51, a). ' +
        'Propositions : A (42, 24, k) · B (33, 24, e) · C (47, 24, o) · D (42, 23, u) · E (18, 26, i).',
      etapes: [
        'La lettre d’abord : e, o, a sont des voyelles. On élimine A, dont la lettre k est une consonne.',
        'Les nombres ensuite. 23 et 41 : sommes de chiffres 5 et 5. 34 et 61 : 7 et 7. ' +
          '15 et 51 : 6 et 6. La règle est « les deux nombres ont la même somme de chiffres ».',
        'B : 33 → 6, 24 → 6. Égales ✓, et e est une voyelle ✓.',
        'C : 47 → 11, 24 → 6. Différentes ✗. D : 42 → 6, 23 → 5. Différentes ✗. ' +
          'E : 18 → 9, 26 → 8. Différentes ✗.',
      ],
      reponse:
        'B. Le test sur la lettre a éliminé une proposition en cinq secondes ; le test sur les ' +
        'nombres a fait le reste.',
    },
    aToi: {
      enonce:
        'Cases de référence : (24, 36, f) — (18, 45, m) — (63, 27, r). ' +
        'Quelle règle relie les nombres, et quelle condition porte sur la lettre ?',
      indice: 'Cherche un diviseur commun aux deux nombres de chaque case. Puis regarde les lettres.',
      reponse:
        'Les deux nombres de chaque case sont des multiples de 3 : 24 = 3×8 et 36 = 3×12 ; ' +
        '18 = 3×6 et 45 = 3×15 ; 63 = 3×21 et 27 = 3×9. Attention au réflexe « multiples de 9 » : ' +
        'il marche sur 36, 18, 45, 63 et 27, mais pas sur 24 — une règle qui échoue sur une seule ' +
        'case de référence est écartée. Et f, m, r sont toutes des consonnes : c’est la seconde ' +
        'moitié de la règle.',
    },
    piege:
      'Chercher une progression entre les trois cases de référence. Il n’y en a pas : ce sont des ' +
      'exemples d’une règle, pas les termes d’une suite.',
    parCoeur: [
      'Voyelles : A, E, I, O, U (et Y selon les énoncés — vérifier sur les exemples)',
      'Divisibilité par 3 : somme des chiffres multiple de 3 · par 9 : somme multiple de 9',
      'Ordre de test : la lettre d’abord, les nombres ensuite',
    ],
  },

  /* ------------------------------------------------- opérations codées -- */
  {
    skillId: 'tm.logique.operations_codees',
    section: 'logique',
    titre: 'Opérations codées',
    quoi:
      'Un symbole inventé désigne une opération inconnue. La reconstituer sur les exemples donnés, ' +
      'puis l’appliquer.',
    retrouver: [
      {
        q: 'Quelle forme tester en premier ?',
        r: 'La somme pondérée : x ⊕ y = ax + by. Elle couvre la majorité des cas et se résout par un système de deux équations.',
      },
      {
        q: 'Sur combien d’exemples faut-il valider ?',
        r: 'Deux au minimum. Une règle qui marche sur un seul exemple est presque toujours fausse.',
      },
      {
        q: 'Comment savoir si l’opération est symétrique ?',
        r: 'Si x ⊕ y et y ⊕ x donnent le même résultat. Presque jamais : c’est pourquoi « les deux nombres échangés » est le leurre classique.',
      },
      {
        q: 'Que faire si les résultats grandissent très vite ?',
        r: 'Penser au carré ou au cube d’un des deux termes avant d’insister sur les multiplications.',
      },
    ],
    regles: [
      {
        titre: 'On pose, on ne devine pas',
        texte:
          'C’est la seule famille du sous-test où écrire une équation est plus rapide que ' +
          'regarder. On écrit la forme la plus simple possible — x ⊕ y = ax + by — et on la teste. ' +
          'Deux exemples donnent deux équations, et le système se résout de tête.',
      },
      {
        titre: 'L’ordre de test des formes',
        texte:
          '1) ax + by (somme pondérée). 2) x × y + c (produit plus constante). 3) x² − y, ou ' +
          'x² + y. 4) (x + y) × c. 5) une opération sur les CHIFFRES plutôt que sur les valeurs. ' +
          'Cinq formes, et la première suffit dans plus de la moitié des cas.',
      },
      {
        titre: 'Résoudre le système de tête',
        texte:
          'Avec 3a + 4b = 19 et 5a + 2b = 27, on multiplie la seconde par 2 pour aligner les b : ' +
          '10a + 4b = 54. On soustrait la première : 7a = 35, donc a = 5, puis b = 1. Cette ' +
          'manipulation est exactement celle du sous-test de calcul — elle resservira.',
      },
      {
        titre: 'Vérifier sur le troisième exemple',
        texte:
          'Quand l’énoncé donne trois exemples et demande le quatrième, on résout sur deux et on ' +
          'VÉRIFIE sur le troisième. Si la vérification échoue, la forme testée est fausse et on ' +
          'passe à la suivante — sans avoir perdu la question.',
      },
      {
        titre: 'L’ordre des opérandes compte',
        texte:
          'x ⊕ y n’est presque jamais égal à y ⊕ x. Le leurre « les deux nombres échangés » est ' +
          'systématiquement proposé, et il est très tentant quand on a lu vite. Recopier l’ordre ' +
          'de l’énoncé avant de calculer supprime l’erreur.',
      },
      {
        titre: 'Quand rien ne marche : regarder les chiffres',
        texte:
          'Si aucune forme algébrique ne colle, la règle porte peut-être sur l’écriture : ' +
          'concaténation des chiffres, somme des chiffres de x et de y, nombre de lettres. ' +
          'C’est rare, mais c’est la dernière carte à jouer avant de cocher et de passer.',
      },
    ],
    exemple: {
      enonce: 'Si 3 ⊕ 4 = 19 et 5 ⊕ 2 = 27, que vaut 6 ⊕ 3 ?',
      etapes: [
        'Forme testée en premier : x ⊕ y = ax + by. On obtient 3a + 4b = 19 et 5a + 2b = 27.',
        'On aligne les b : la seconde équation multipliée par 2 donne 10a + 4b = 54.',
        'On soustrait la première : 7a = 35, donc a = 5. En reportant : 15 + 4b = 19, donc b = 1.',
        'La règle est x ⊕ y = 5x + y. Vérification sur le second exemple : 5 × 5 + 2 = 27 ✓.',
        'Application : 6 ⊕ 3 = 5 × 6 + 3 = 33.',
      ],
      reponse: '33. La somme pondérée est la première forme à tester, et de loin la plus fréquente.',
    },
    aToi: {
      enonce: 'Si 2 ⊕ 5 = 13 et 4 ⊕ 3 = 19, que vaut 6 ⊕ 2 ?',
      indice: 'Pose x ⊕ y = ax + by et résous le système.',
      reponse:
        '26. On a 2a + 5b = 13 et 4a + 3b = 19. La première multipliée par 2 donne 4a + 10b = 26 ; ' +
        'en soustrayant la seconde : 7b = 7, donc b = 1 et a = 4. La règle est x ⊕ y = 4x + y, ' +
        'donc 6 ⊕ 2 = 24 + 2 = 26.',
    },
    piege:
      'Valider une forme sur un seul exemple. Deux exemples déterminent les coefficients, le ' +
      'troisième sert à vérifier — et il arrive qu’il contredise tout.',
    parCoeur: [
      'Formes à tester, dans l’ordre : ax + by · xy + c · x² ± y · (x + y) × c · règle sur les chiffres',
      'Méthode du système : aligner un coefficient, soustraire, reporter',
    ],
  },

  /* ------------------------------------------------ matrices de figures -- */
  {
    skillId: 'tm.logique.matrices_de_figures',
    section: 'logique',
    titre: 'Matrices de figures',
    quoi: 'Compléter une grille de figures dont la case d’un coin manque.',
    retrouver: [
      {
        q: 'Que fait-on en premier devant une matrice ?',
        r: 'On liste les attributs qui peuvent changer, et on les compte à voix basse. Forme, remplissage, nombre de points, orientation, taille.',
      },
      {
        q: 'Dans quel sens lit-on ?',
        r: 'Les lignes d’abord, les colonnes ensuite. Un attribut suit presque toujours l’un des deux, pas les deux.',
      },
      {
        q: 'Comment gagner du temps sur les propositions ?',
        r: 'On élimine sur l’attribut le plus RAPIDE à vérifier — le nombre de points, presque toujours — avant de regarder la forme.',
      },
      {
        q: 'Qu’indique un attribut qui varie partout sans régularité ?',
        r: 'Qu’il ne porte aucune règle. On l’écarte, et le problème perd une dimension.',
      },
    ],
    regles: [
      {
        titre: 'Décomposer la figure en attributs',
        texte:
          'Une figure n’est jamais « une image » : c’est une liste d’attributs indépendants. ' +
          'Forme extérieure, contenu, nombre de points, nombre de traits, orientation, taille, ' +
          'remplissage. On les nomme AVANT de chercher quoi que ce soit — trois secondes qui ' +
          'structurent tout le reste.',
      },
      {
        titre: 'Un attribut à la fois, sur toute la matrice',
        texte:
          'On prend « nombre de points » et on le suit sur les neuf cases, sans regarder autre ' +
          'chose. On conclut. Puis on prend « forme ». Vouloir lire la figure entière d’un coup ' +
          'est ce qui fait tourner en rond.',
      },
      {
        titre: 'Lire les lignes, puis les colonnes',
        texte:
          'Un attribut constant par ligne, un autre constant par colonne : c’est la structure la ' +
          'plus fréquente. Si rien ne sort des lignes, les colonnes le donnent presque toujours.',
      },
      {
        titre: 'Les trois mouvements les plus fréquents',
        texte:
          'Rotation d’un quart de tour d’une case à la suivante ; un élément qui s’ajoute ' +
          'régulièrement ; un élément qui se déplace d’une position fixe. Les tester dans cet ordre.',
      },
      {
        titre: 'La règle de superposition',
        texte:
          'Sur certaines matrices, la troisième case d’une ligne est la superposition des deux ' +
          'premières — ou leur différence, les éléments communs s’annulant. Le signe : la ' +
          'troisième case contient visiblement des morceaux des deux autres.',
      },
      {
        titre: 'Éliminer par attribut',
        texte:
          'On ne construit pas la figure manquante : on élimine. L’attribut le plus rapide à ' +
          'vérifier d’abord (compter des points va plus vite que reconnaître un heptagone), ce qui ' +
          'fait tomber deux ou trois propositions ; on ne vérifie les autres attributs que sur les ' +
          'survivantes.',
      },
      {
        titre: 'Compter au crayon, sur le sujet',
        texte:
          'Le nombre de côtés ou de points se compte en marquant le sujet, pas de tête. Deux ' +
          'secondes de plus, et plus aucune erreur de comptage — qui est, avec l’oubli d’un ' +
          'attribut, la seule vraie cause d’échec de cette famille.',
      },
    ],
    exemple: {
      enonce:
        'Grille 3 × 3. Colonne 1 : des triangles. Colonne 2 : des carrés. Colonne 3 : des ' +
        'pentagones. Ligne 1 : aucune case ne porte de point. Ligne 2 : chaque case porte un point. ' +
        'Ligne 3 : chaque case porte deux points. La case en bas à droite manque.',
      etapes: [
        'Attributs présents : la forme, et le nombre de points. Deux, pas plus.',
        'La forme est constante par COLONNE. La case manquante est en colonne 3 : ce sera un pentagone.',
        'Le nombre de points est constant par LIGNE. La case manquante est en ligne 3 : deux points.',
        'On recompose : un pentagone portant deux points.',
        'Sur les propositions, on élimine d’abord sur le nombre de points — c’est le plus rapide — ' +
          'puis on vérifie la forme sur ce qui reste.',
      ],
      reponse:
        'Un pentagone à deux points. La méthode vaut plus que le résultat : deux attributs, deux ' +
        'lectures, une recomposition.',
    },
    aToi: {
      enonce:
        'Sur une matrice, tu as identifié trois attributs : la forme, la couleur de remplissage, ' +
        'et le nombre de traits internes. La forme est différente dans les neuf cases. Que fais-tu ?',
      indice: 'Un attribut qui varie partout sépare-t-il quoi que ce soit ?',
      reponse:
        'On l’écarte immédiatement. Un attribut différent dans les neuf cases ne porte aucune règle : ' +
        'il est là pour occuper le regard. Le problème passe de trois dimensions à deux, et devient ' +
        'lisible.',
    },
    piege:
      'Lire la figure en bloc. Elle est faite pour ça : l’allure générale attire l’œil, les ' +
      'attributs portent la règle.',
    parCoeur: [
      'Attributs à passer en revue : forme · remplissage · nombre de points · nombre de traits · orientation · taille',
      'Mouvements fréquents : rotation d’un quart de tour · ajout régulier · déplacement fixe · superposition',
    ],
  },

  /* -------------------------------------------------- suites de figures -- */
  {
    skillId: 'tm.logique.suites_de_figures',
    section: 'logique',
    titre: 'Suites de figures',
    quoi: 'Une rangée de figures progresse. Trouver celle qui la continue.',
    retrouver: [
      {
        q: 'Quel est le premier geste devant une suite de figures ?',
        r: 'Compter. Côtés, points, traits — et écrire les nombres sous les figures. La suite de figures devient alors une suite de nombres ordinaire.',
      },
      {
        q: 'Quels attributs progressent le plus souvent ?',
        r: 'Le nombre de côtés, le nombre de points ou de traits, l’orientation par quarts de tour, le remplissage.',
      },
      {
        q: 'Comment ne pas perdre le sens d’une rotation ?',
        r: 'Le fixer sur les deux premières cases et l’écrire en marge : ↻ ou ↺.',
      },
      {
        q: 'Que faire d’un attribut constant sur toute la suite ?',
        r: 'Le noter comme contrainte : la réponse doit le conserver. C’est souvent ce qui élimine une proposition par ailleurs correcte.',
      },
    ],
    regles: [
      {
        titre: 'Compter, puis traiter comme une suite de nombres',
        texte:
          'Le geste fondateur : sous chaque figure, on écrit son nombre de côtés (ou de points, ou ' +
          'de traits). La suite de dessins devient 3, 4, 5, 6, ? — et toute la méthode des suites ' +
          'numériques s’applique, écarts compris.',
      },
      {
        titre: 'L’ordre de test des attributs',
        texte:
          '1) Nombre de côtés. 2) Nombre de points ou de traits. 3) Orientation (quarts de tour). ' +
          '4) Remplissage ou contour. 5) Taille. Les tester dans cet ordre évite de rester bloqué ' +
          'sur l’allure générale du dessin.',
      },
      {
        titre: 'Ce qui ne change pas est une contrainte',
        texte:
          'Si la forme est identique dans les quatre cases visibles, la réponse la conserve. Ce ' +
          'n’est pas une information négligeable : c’est souvent elle qui élimine la proposition ' +
          'qui a le bon nombre de points mais la mauvaise forme.',
      },
      {
        titre: 'Le sens de rotation se fixe une fois pour toutes',
        texte:
          'On le détermine sur les deux premières cases et on l’écrit en marge. Le perdre en cours ' +
          'de route est l’erreur numéro un de la famille, et le leurre « mauvais sens » est ' +
          'toujours proposé.',
      },
      {
        titre: 'Deux attributs peuvent progresser ensemble',
        texte:
          'Le nombre de côtés augmente ET le point tourne. Il faut alors les suivre séparément puis ' +
          'recomposer. Les compter à voix basse avant de commencer — « il y a deux choses qui ' +
          'changent » — force à ne pas en oublier un.',
      },
      {
        titre: 'Les figures rondes n’ont pas de côtés',
        texte:
          'Un cercle ou un ovale a zéro côté : il ne peut pas appartenir à une suite sur le nombre ' +
          'de côtés. C’est une élimination gratuite, et elle est systématiquement proposée comme ' +
          'leurre.',
      },
    ],
    exemple: {
      enonce: 'Triangle, carré, pentagone, hexagone, ?',
      etapes: [
        'On compte les côtés et on écrit dessous : 3, 4, 5, 6.',
        'Écarts : +1, +1, +1. La suite est arithmétique de raison 1.',
        'La figure cherchée a 7 côtés : un heptagone.',
        'Contrôle sur les propositions : un cercle est éliminé d’office (zéro côté), un octogone ' +
          'a un côté de trop.',
      ],
      reponse: 'Un heptagone. Compter transforme une question de dessin en question de nombres.',
    },
    aToi: {
      enonce:
        'Un même carré revient quatre fois, avec un point qui occupe successivement le coin haut ' +
        'gauche, haut droit, bas droit, bas gauche. Quelle est la cinquième figure ?',
      indice: 'Le point fait un tour complet. Où reprend-il ?',
      reponse:
        'Un carré avec le point en haut à gauche. Le point tourne dans le sens des aiguilles et ' +
        'boucle après quatre positions : la cinquième case revient au point de départ. La forme, ' +
        'constante, doit être conservée.',
    },
    piege:
      'Regarder l’allure générale au lieu de compter. Deux figures peuvent se ressembler beaucoup ' +
      'et n’avoir ni le même nombre de côtés ni le même nombre de points.',
    parCoeur: [
      'Côtés : triangle 3 · carré et losange 4 · pentagone 5 · hexagone 6 · heptagone 7 · octogone 8',
      'Cercle et ovale : zéro côté',
      'Une rotation complète boucle en quatre quarts de tour',
    ],
  },

  /* -------------------------------------------- rotations et symétries -- */
  {
    skillId: 'tm.logique.rotations_et_symetries',
    section: 'logique',
    titre: 'Rotations et symétries',
    quoi:
      'Une figure se transforme en une autre. Nommer la transformation, puis l’appliquer à une ' +
      'troisième figure.',
    retrouver: [
      {
        q: 'Comment distinguer une rotation d’une symétrie en trois secondes ?',
        r: 'Une rotation conserve le sens de lecture ; une symétrie l’inverse comme un miroir. Si l’ordre des éléments s’inverse, c’est une symétrie.',
      },
      {
        q: 'Que vaut une rotation de 180° ?',
        r: 'Deux quarts de tour. Un élément en haut à gauche passe en bas à droite.',
      },
      {
        q: 'Que fait-on avant de regarder les propositions ?',
        r: 'On NOMME la transformation à voix basse : « rotation d’un quart de tour vers la droite ». Tant qu’elle n’est pas nommée, on ne compare rien.',
      },
      {
        q: 'Que conserve la figure d’arrivée du second couple ?',
        r: 'Tout ce que la transformation ne touche pas — à commencer par la forme de la troisième case, et non celle de la première.',
      },
    ],
    regles: [
      {
        titre: 'Nommer la transformation avant tout',
        texte:
          'On ne compare jamais les propositions entre elles. On regarde le premier couple, on dit ' +
          'à voix basse ce qui s’est passé — « le point a fait un quart de tour vers la droite » — ' +
          'et seulement ensuite on applique.',
      },
      {
        titre: 'Rotation ou symétrie : le test du sens de lecture',
        texte:
          'Une rotation conserve le sens : ce qui tournait dans le sens des aiguilles continue de ' +
          'tourner dans ce sens. Une symétrie l’inverse, comme un miroir. Sur une figure portant ' +
          'plusieurs éléments, il suffit de regarder si leur ordre s’est inversé.',
      },
      {
        titre: 'Les quatre rotations, et rien d’autre',
        texte:
          '90° (un quart de tour), 180° (demi-tour), 270° (trois quarts, équivalent à un quart ' +
          'dans l’autre sens), 360° (retour au point de départ). Un quart de tour vers la droite ' +
          'fait passer : haut gauche → haut droit → bas droit → bas gauche → haut gauche.',
      },
      {
        titre: 'Les trois symétries à connaître',
        texte:
          'Axe vertical : la gauche et la droite s’échangent. Axe horizontal : le haut et le bas ' +
          's’échangent. Symétrie centrale : les deux à la fois — elle est identique à une rotation ' +
          'de 180°, ce qui est le seul cas où rotation et symétrie se confondent.',
      },
      {
        titre: 'Repérer ce qui NE change pas',
        texte:
          'Entre les deux premières figures, la forme reste souvent identique. C’est une ' +
          'information à part entière : elle dit que la figure d’arrivée conserve la forme de sa ' +
          'figure de départ — donc celle de la TROISIÈME case, et non celle de la première. Le ' +
          'leurre qui reprend la forme du premier couple est systématiquement proposé.',
      },
      {
        titre: 'Se servir d’un repère physique',
        texte:
          'Tourner la feuille d’un quart de tour est autorisé et prend deux secondes. Pour une ' +
          'symétrie, on imagine le miroir posé sur l’axe. Ces gestes concrets sont bien plus ' +
          'fiables que la visualisation mentale sous chronomètre.',
      },
    ],
    exemple: {
      enonce:
        'Un carré portant un point en haut à gauche devient un carré portant un point en haut à ' +
        'droite. Un pentagone portant un point en bas à droite devient … ?',
      etapes: [
        'Premier couple : le point passe de « haut gauche » à « haut droit ». Dans le cycle ' +
          'haut gauche → haut droit → bas droit → bas gauche, c’est un quart de tour vers la droite.',
        'Ce qui ne change pas : la forme. Le carré reste un carré.',
        'Application au second couple : le point part de « bas droit » et avance d’un cran dans le ' +
          'même sens, donc « bas gauche ».',
        'La forme conservée est celle de la troisième case : un pentagone.',
      ],
      reponse:
        'Un pentagone portant un point en bas à gauche. Le leurre le plus tentant est le carré au ' +
        'bon endroit : il reprend la forme du premier couple.',
    },
    aToi: {
      enonce:
        'Une figure porte les lettres A, B, C de gauche à droite. Après transformation, elle porte ' +
        'C, B, A de gauche à droite. Rotation ou symétrie ?',
      indice: 'L’ordre de lecture a-t-il été conservé ?',
      reponse:
        'Symétrie d’axe vertical. L’ordre s’est inversé comme dans un miroir ; une rotation ' +
        'l’aurait conservé (en la retournant, une rotation de 180° donnerait des lettres à ' +
        'l’envers, pas simplement réordonnées).',
    },
    piege:
      'Confondre rotation de 180° et symétrie d’axe vertical. Elles donnent le même résultat sur ' +
      'une figure symétrique, et des résultats différents sur toutes les autres.',
    parCoeur: [
      'Quart de tour à droite : haut gauche → haut droit → bas droit → bas gauche',
      'Rotation de 180° = symétrie centrale (le seul cas où les deux coïncident)',
      'Rotation : le sens de lecture est conservé · Symétrie : il est inversé',
    ],
  },

  /* ---------------------------------------------------- intrus numérique -- */
  {
    skillId: 'tm.logique.intrus_numerique',
    section: 'logique',
    titre: 'Intrus numérique',
    quoi: 'Cinq nombres, quatre partagent une règle. Trouver celui qui y échappe.',
    retrouver: [
      {
        q: 'Cherche-t-on l’anomalie ou la règle ?',
        r: 'La règle que QUATRE nombres partagent. Chercher l’anomalie permet de justifier n’importe lequel des cinq.',
      },
      {
        q: 'Quel est l’ordre de test ?',
        r: 'Carrés → cubes → premiers → parité → multiples d’un même nombre → somme des chiffres → chiffres tous différents.',
      },
      {
        q: 'Que faire si deux règles sont possibles ?',
        r: 'Prendre la plus simple, et celle qui ne laisse qu’un seul intrus. Une règle qui en laisse deux est la mauvaise.',
      },
      {
        q: 'Quel est le piège des puissances de 2 ?',
        r: '128 et 32 ressemblent à des cubes sans en être. 2⁷ = 128, et le cube le plus proche est 125 = 5³.',
      },
    ],
    regles: [
      {
        titre: 'Chercher la règle, jamais l’anomalie',
        texte:
          'C’est le renversement qui fait toute la famille. Si l’on cherche « ce qui cloche », on ' +
          'trouvera toujours quelque chose sur n’importe lequel des cinq nombres. Si l’on cherche ' +
          '« ce que quatre d’entre eux partagent », il n’y a qu’une réponse.',
      },
      {
        titre: 'L’ordre de test, du plus fréquent au plus rare',
        texte:
          '1) Carrés parfaits. 2) Cubes parfaits. 3) Nombres premiers. 4) Parité. 5) Multiples ' +
          'd’un même nombre. 6) Somme des chiffres constante. 7) Chiffres tous différents, ou ' +
          'chiffres consécutifs. Sept essais couvrent la quasi-totalité des cas.',
      },
      {
        titre: 'Les tables à savoir sans réfléchir',
        texte:
          'Carrés jusqu’à 225, cubes jusqu’à 1000, premiers jusqu’à 50, puissances de 2 jusqu’à ' +
          '1024. C’est le seul par-cœur du sous-test, il tient en quatre lignes, et il fait gagner ' +
          'dix secondes par question — ici comme en calcul et en conditions minimales.',
      },
      {
        titre: 'Deux règles possibles : prendre celle qui ne laisse qu’un intrus',
        texte:
          'Si une règle laisse deux nombres dehors, elle n’est pas la bonne : l’énoncé n’a qu’une ' +
          'réponse. C’est un critère de tri fiable, et il évite d’hésiter longuement entre deux ' +
          'lectures plausibles.',
      },
      {
        titre: 'Les faux amis',
        texte:
          '128 n’est pas un cube (c’est 2⁷). 121 est un carré (11²) mais pas un cube. 1 est à la ' +
          'fois carré et cube. 2 est le seul nombre premier pair — il est régulièrement l’intrus ' +
          'd’une liste de premiers impairs, et c’est un piège classique.',
      },
      {
        titre: 'Quand les valeurs sont incohérentes, regarder les chiffres',
        texte:
          'Une liste où l’on trouve 12, 340 et 45 ne suit pas une règle sur les valeurs. On passe ' +
          'aux chiffres : somme, produit, nombre de chiffres, chiffres identiques, chiffres qui ' +
          'se suivent.',
      },
    ],
    exemple: {
      enonce: 'Quel est l’intrus : 128, 512, 216, 343, 64 ?',
      etapes: [
        'Test 1, carrés : 64 en est un (8²), mais pas 128 ni 512 ni 216 ni 343. Ce n’est pas la règle.',
        'Test 2, cubes : 512 = 8³, 216 = 6³, 343 = 7³, 64 = 4³. Quatre cubes.',
        '128 en est-il un ? 5³ = 125 et 6³ = 216 : 128 tombe entre les deux. C’est 2⁷, pas un cube.',
        'Contrôle : la règle « cube parfait » ne laisse qu’un seul nombre dehors. C’est bien elle.',
      ],
      reponse:
        '128. Il ressemble à une puissance remarquable — et il en est une — mais pas à la bonne : ' +
        'c’est exactement pour cela qu’il est choisi.',
    },
    aToi: {
      enonce: 'Quel est l’intrus : 13, 17, 23, 29, 33 ?',
      indice: 'Aucun n’est pair. Essaie le troisième test de la liste.',
      reponse:
        '33. Les quatre autres sont des nombres premiers ; 33 = 3 × 11. Le piège tient à ce que 33 ' +
        'est impair et ne se divise ni par 2 ni par 5, ce qui lui donne l’air d’un premier.',
    },
    piege:
      'Se laisser convaincre par la première anomalie repérée. La question n’a de réponse que si ' +
      'QUATRE nombres partagent quelque chose : tant qu’on ne l’a pas trouvé, on n’a rien trouvé.',
    parCoeur: [
      'Carrés : 1, 4, 9, 16, 25, 36, 49, 64, 81, 100, 121, 144, 169, 196, 225',
      'Cubes : 1, 8, 27, 64, 125, 216, 343, 512, 729, 1000',
      'Puissances de 2 : 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024',
      'Premiers : 2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47',
      'Faux amis : 128 (2⁷, pas un cube) · 2 (seul premier pair) · 1 (carré ET cube)',
    ],
  },

  /* ------------------------------------------------ intrus alphabétique -- */
  {
    skillId: 'tm.logique.intrus_alphabetique',
    section: 'logique',
    titre: 'Intrus alphabétique',
    quoi: 'Cinq groupes de lettres, quatre partagent une règle. Trouver celui qui y échappe.',
    retrouver: [
      {
        q: 'Quel est le tout premier geste ?',
        r: 'Convertir les cinq groupes en rangs. Un écart ne se voit pas sur des lettres.',
      },
      {
        q: 'Quel est l’ordre de test ?',
        r: 'Écart interne constant → lettres consécutives → voyelle/consonne → symétrie A↔Z → position d’une même lettre.',
      },
      {
        q: 'Quelle somme font deux lettres symétriques de l’alphabet ?',
        r: '27. A + Z = 1 + 26, B + Y = 2 + 25, et ainsi de suite.',
      },
      {
        q: 'Que faire si un groupe semble respecter la règle « de justesse » ?',
        r: 'Recompter au crayon. L’intrus se joue presque toujours à un rang près.',
      },
    ],
    regles: [
      {
        titre: 'Convertir d’abord, réfléchir ensuite',
        texte:
          'Les cinq groupes, en rangs, écrits les uns sous les autres. Sans cela, on compare des ' +
          'silhouettes de lettres, et un écart de 2 ressemble à un écart de 3. Le geste coûte dix ' +
          'secondes et rend la question presque mécanique.',
      },
      {
        titre: 'L’ordre de test sur des lettres',
        texte:
          '1) Écart interne constant entre les lettres d’un même groupe. 2) Lettres consécutives ' +
          '(cas particulier du précédent, écart 1). 3) Voyelle ou consonne à une position donnée. ' +
          '4) Symétrie dans l’alphabet (A↔Z, somme 27). 5) Une même lettre présente dans quatre ' +
          'groupes sur cinq.',
      },
      {
        titre: 'L’écart interne, cas le plus fréquent',
        texte:
          'BDF, HJL, MOQ, RTV ont tous un écart de 2 entre lettres consécutives. Le repérer tient ' +
          'en une soustraction par groupe. C’est la règle qui tombe le plus souvent.',
      },
      {
        titre: 'Le repli après Z compte aussi',
        texte:
          'YAC a bien un écart de 2 : Y = 25, A = 1 (après le repli, 27), C = 3. Un groupe qui ' +
          'semble briser la règle parce qu’il « redescend » la respecte souvent. Ne pas l’éliminer ' +
          'sans avoir vérifié modulo 26.',
      },
      {
        titre: 'Voyelles et consonnes',
        texte:
          'Position d’une voyelle dans le groupe, nombre de voyelles, alternance voyelle-consonne. ' +
          'À tester dès que les écarts ne donnent rien. Attention : selon les énoncés, Y est ' +
          'compté comme voyelle ou non — on tranche en regardant les quatre groupes conformes.',
      },
      {
        titre: 'L’intrus se joue à un rang près',
        texte:
          'Les leurres ne sont jamais grossiers : le groupe intrus respecte la règle sur deux ' +
          'lettres sur trois, et diverge d’un seul rang. Recompter au crayon sur le groupe qu’on ' +
          'croit conforme est le dernier contrôle avant de cocher.',
      },
    ],
    exemple: {
      enonce: 'Quel est l’intrus : BDF, HJL, MOQ, RTV, CDE ?',
      etapes: [
        'En rangs : BDF = 2-4-6, HJL = 8-10-12, MOQ = 13-15-17, RTV = 18-20-22, CDE = 3-4-5.',
        'Écarts internes : +2 +2, +2 +2, +2 +2, +2 +2 — puis +1 +1 pour CDE.',
        'Quatre groupes ont un écart interne de 2. CDE a un écart de 1.',
        'Contrôle : la règle « écart interne de 2 » ne laisse qu’un seul groupe dehors.',
      ],
      reponse:
        'CDE. Les lettres consécutives sautent moins aux yeux que prévu quand on ne convertit pas ' +
        'en rangs — c’est tout l’intérêt de la conversion.',
    },
    aToi: {
      enonce: 'Quel est l’intrus : KMO, PRT, ADG, VXZ, EGI ?',
      indice: 'Convertis les cinq groupes en rangs et compare les écarts internes.',
      reponse:
        'ADG. En rangs : 11-13-15, 16-18-20, 1-4-7, 22-24-26, 5-7-9. Quatre groupes ont un écart ' +
        'interne de 2 ; ADG a un écart de 3.',
    },
    piege:
      'Éliminer un groupe qui « redescend » dans l’alphabet. Après Z on revient à A : YAC respecte ' +
      'un écart de 2 aussi bien que BDF.',
    parCoeur: [
      'A = 1 · E = 5 · J = 10 · O = 15 · T = 20 · Y = 25 · Z = 26',
      'Symétriques : la somme des rangs vaut 27 (A↔Z, B↔Y, C↔X…)',
      'Voyelles : A, E, I, O, U — et Y selon l’énoncé',
    ],
  },

  /* --------------------------------------------------------- intrus figuré -- */
  {
    skillId: 'tm.logique.intrus_figure',
    section: 'logique',
    titre: 'Intrus figuré',
    quoi: 'Cinq figures, quatre partagent une propriété. Trouver celle qui y échappe.',
    retrouver: [
      {
        q: 'Quel raisonnement fait gagner le plus de temps ?',
        r: 'Écarter les attributs qui varient sur les cinq figures : ils ne séparent rien, donc ne portent aucune règle.',
      },
      {
        q: 'Quel est l’ordre de test sur des figures ?',
        r: 'Nombre de côtés → parité de ce nombre → axe de symétrie → nombre de points ou de traits → orientation.',
      },
      {
        q: 'Combien de côtés a un cercle ?',
        r: 'Zéro. Il ne peut appartenir à aucune règle fondée sur le nombre de côtés.',
      },
      {
        q: 'Comment compter sans se tromper ?',
        r: 'Au crayon, en marquant chaque côté sur le sujet. Deux secondes de plus, zéro erreur.',
      },
    ],
    regles: [
      {
        titre: 'Éliminer les attributs qui varient partout',
        texte:
          'Si les cinq figures ont cinq formes différentes, la forme n’est pas la règle. Cette ' +
          'déduction se fait en trois secondes et fait souvent tomber le problème de trois ' +
          'dimensions à une. C’est le geste le plus rentable de la famille.',
      },
      {
        titre: 'Chercher la règle des quatre, pas l’étrangeté d’une',
        texte:
          'Comme pour l’intrus numérique, et pour la même raison : sur un dessin, on peut toujours ' +
          'trouver quelque chose de particulier à n’importe laquelle des cinq figures.',
      },
      {
        titre: 'L’ordre de test sur des figures',
        texte:
          '1) Nombre de côtés. 2) Parité de ce nombre. 3) Présence d’un axe de symétrie. ' +
          '4) Nombre de points, de traits ou d’éléments internes. 5) Orientation. 6) Figure ouverte ' +
          'ou fermée.',
      },
      {
        titre: 'Compter au crayon',
        texte:
          'On marque chaque côté d’un petit trait en le comptant. L’erreur de comptage est, avec ' +
          'l’oubli d’un attribut, la seule vraie cause d’échec sur cette famille — et elle est ' +
          'entièrement évitable.',
      },
      {
        titre: 'La symétrie, règle fréquente et vite lue',
        texte:
          'Un axe de symétrie vertical, horizontal, ou aucun. Quatre figures symétriques et une ' +
          'qui ne l’est pas se repèrent sans compter quoi que ce soit — c’est le test à tenter ' +
          'quand les côtés ne donnent rien.',
      },
      {
        titre: 'Ne pas confondre taille et nature',
        texte:
          'Une figure plus grande que les autres n’est presque jamais l’intrus : la taille est le ' +
          'plus fréquent des attributs décoratifs. Elle attire l’œil, et c’est exactement son rôle.',
      },
    ],
    exemple: {
      enonce: 'Cinq figures : un carré, un hexagone, un losange, un octogone, un triangle.',
      etapes: [
        'La forme varie sur les cinq : elle ne porte aucune règle. On passe à autre chose.',
        'Nombre de côtés : 4, 6, 4, 8, 3.',
        'Parité : pair, pair, pair, pair, impair.',
        'Quatre figures ont un nombre pair de côtés. Le triangle en a trois.',
      ],
      reponse:
        'Le triangle. Remarquer que carré et losange ont tous deux 4 côtés — des formes ' +
        'différentes peuvent partager le même nombre de côtés, et c’est souvent là que se cache ' +
        'la règle.',
    },
    aToi: {
      enonce:
        'Cinq figures de formes toutes différentes. Quatre portent un point dans leur coin ' +
        'supérieur gauche, la cinquième dans son coin inférieur droit. Quel est l’intrus, et pourquoi ?',
      indice: 'Quel attribut varie sur les cinq ? Quel attribut n’en sépare qu’une ?',
      reponse:
        'La cinquième. La forme varie sur les cinq figures : elle ne sépare rien, donc elle n’est ' +
        'pas la règle. Reste la position du point, commune à quatre d’entre elles.',
    },
    piege:
      'S’arrêter sur la figure la plus grande, la plus inclinée ou la plus « bizarre ». Ces ' +
      'attributs-là sont décoratifs neuf fois sur dix.',
    parCoeur: [
      'Côtés : triangle 3 · carré et losange 4 · pentagone 5 · hexagone 6 · heptagone 7 · octogone 8',
      'Cercle et ovale : zéro côté',
      'Un attribut qui varie sur les cinq ne porte aucune règle',
    ],
  },

  /* --------------------------------------------- analogies de lettres -- */
  {
    skillId: 'tm.logique.analogies_de_lettres',
    section: 'logique',
    titre: 'Analogies de lettres',
    quoi: '« A est à B ce que C est à ? » — nommer l’opération, puis l’appliquer.',
    retrouver: [
      {
        q: 'Que fait-on avant de regarder les propositions ?',
        r: 'On nomme l’opération du premier couple à voix basse : « chaque lettre avance de 5 rangs ».',
      },
      {
        q: 'Quelle est l’erreur la plus fréquente ?',
        r: 'Le sens du décalage. Écrire les rangs sous chaque lettre la rend impossible.',
      },
      {
        q: 'Le décalage est-il toujours le même sur les trois lettres ?',
        r: 'Souvent, mais pas toujours. Vérifier position par position avant de conclure.',
      },
      {
        q: 'Que faire si deux propositions passent ?',
        r: 'Revenir au premier couple et chercher un second attribut : ordre des lettres, voyelle conservée, longueur.',
      },
    ],
    regles: [
      {
        titre: 'Nommer l’opération avant de regarder les propositions',
        texte:
          'Une analogie se résout en deux temps : on identifie l’opération sur le premier couple, ' +
          'puis on l’applique au second. On ne compare JAMAIS les propositions entre elles — ' +
          'c’est ce qui fait perdre la question.',
      },
      {
        titre: 'Position par position, en rangs',
        texte:
          'CFI → HKN se lit : C (3) → H (8), F (6) → K (11), I (9) → N (14). Chaque lettre avance ' +
          'de 5. Écrire les rangs prend cinq secondes et supprime toute ambiguïté sur le sens.',
      },
      {
        titre: 'Les transformations de lettres les plus fréquentes',
        texte:
          'Décalage constant sur les trois lettres (le plus courant) ; décalage différent par ' +
          'position ; inversion de l’ordre des lettres ; remplacement par la lettre symétrique ' +
          '(somme 27) ; une lettre conservée et les autres décalées.',
      },
      {
        titre: 'Respecter le sens de lecture',
        texte:
          'L’erreur numéro un, de très loin. Le leurre « décalage dans le mauvais sens » est ' +
          'systématiquement proposé, et il est indiscernable de la bonne réponse si l’on n’a pas ' +
          'écrit les rangs.',
      },
      {
        titre: 'Le repli, une fois de plus',
        texte:
          'BEH → ZCF est un décalage de −2 : B (2) − 2 = 0, donc 26 = Z. Une analogie qui semble ' +
          'incohérente parce qu’une lettre « saute » en fin d’alphabet respecte presque toujours ' +
          'la règle modulo 26.',
      },
      {
        titre: 'Affiner quand deux propositions passent',
        texte:
          'Cela signifie qu’on a manqué une contrainte. On retourne au premier couple et on ' +
          'cherche un SECOND attribut : l’ordre des lettres a-t-il été conservé ? la voyelle ' +
          'est-elle restée à sa place ? Il y en a toujours un.',
      },
    ],
    exemple: {
      enonce: 'CFI est à HKN ce que MPS est à … ?',
      etapes: [
        'Rangs du premier couple : C (3) → H (8), F (6) → K (11), I (9) → N (14).',
        'Le décalage vaut +5 aux trois positions. L’opération est nommée.',
        'Application : M (13) → 18 = R, P (16) → 21 = U, S (19) → 24 = X.',
        'Contrôle du sens : on avance dans l’alphabet, comme dans le premier couple.',
      ],
      reponse: 'RUX. Cinq secondes de conversion en rangs, et le leurre « −5 » devient inoffensif.',
    },
    aToi: {
      enonce: 'BEH est à ZCF ce que KNQ est à … ?',
      indice: 'Attention : le décalage est négatif, et B − 2 passe de l’autre côté de l’alphabet.',
      reponse:
        'ILO. Le décalage est −2 : B (2) → Z (26 après repli), E (5) → C (3), H (8) → F (6). ' +
        'Appliqué à KNQ : K (11) → I (9), N (14) → L (12), Q (17) → O (15).',
    },
    piege:
      'Appliquer le décalage dans le mauvais sens. C’est le leurre le plus fréquent du sous-test, ' +
      'et le seul remède est d’écrire les rangs.',
    parCoeur: [
      'A = 1 · E = 5 · J = 10 · O = 15 · T = 20 · Y = 25 · Z = 26',
      'Repli : rang 0 → Z, rang 27 → A, rang 28 → B',
      'Symétriques : somme des rangs = 27',
    ],
  },

  /* --------------------------------------------- analogies de figures -- */
  {
    skillId: 'tm.logique.analogies_de_figures',
    section: 'logique',
    titre: 'Analogies de figures',
    quoi:
      'Une figure se transforme. Transporter la même transformation sur une autre figure, sans en ' +
      'oublier aucun attribut.',
    retrouver: [
      {
        q: 'Que fait-on en premier ?',
        r: 'On compte les attributs à voix basse : « il y a trois choses qui peuvent changer ». Cela force à toutes les vérifier.',
      },
      {
        q: 'La forme de la réponse vient d’où ?',
        r: 'De la troisième case, pas de la première — quand la transformation ne touche pas la forme.',
      },
      {
        q: 'Quel est le leurre le plus tentant ?',
        r: 'Celui qui applique correctement un attribut sur deux. Il « ressemble » beaucoup à la bonne réponse.',
      },
      {
        q: 'Que faire si aucune proposition ne convient ?',
        r: 'C’est qu’un attribut a été mal lu. On reprend le premier couple attribut par attribut.',
      },
    ],
    regles: [
      {
        titre: 'Compter les attributs avant de chercher',
        texte:
          'Forme, lettre ou symbole intérieur, nombre de points, orientation, remplissage. On les ' +
          'énumère à voix basse avant toute chose : « il y en a trois ». L’oubli d’un attribut est ' +
          'l’erreur la plus coûteuse de la famille, et ce comptage préalable la supprime.',
      },
      {
        titre: 'Suivre chaque attribut séparément',
        texte:
          'La forme : change-t-elle ? La lettre : avance-t-elle ? Les points : s’en ajoute-t-il ? ' +
          'Une ligne par attribut, une conclusion par attribut. Jamais de lecture globale.',
      },
      {
        titre: 'Ce qui ne change pas est une information',
        texte:
          'Si la forme est identique entre les deux premières figures, la transformation ne la ' +
          'touche pas : la réponse conserve donc la forme de la TROISIÈME case. Le leurre qui ' +
          'reprend la forme du premier couple est systématiquement proposé, et il est très tentant.',
      },
      {
        titre: 'Les transformations les plus fréquentes',
        texte:
          'Un élément qui s’ajoute ; un élément qui se déplace d’une position fixe ; une lettre ou ' +
          'un chiffre qui avance d’un pas constant ; une rotation ; un remplissage qui s’inverse. ' +
          'Souvent deux d’entre elles en même temps.',
      },
      {
        titre: 'Vérifier les cinq propositions sur TOUS les attributs',
        texte:
          'Les leurres appliquent correctement un attribut et se trompent sur l’autre. Une ' +
          'proposition qui a la bonne lettre n’est pas pour autant la bonne réponse. Quand il ' +
          'reste deux candidates, c’est qu’un attribut n’a pas encore été vérifié.',
      },
    ],
    exemple: {
      enonce:
        'Un carré portant la lettre C et un point devient un carré portant la lettre F et deux ' +
        'points. Un hexagone portant la lettre M et un point devient … ?',
      etapes: [
        'Attributs : la forme, la lettre, le nombre de points. Trois.',
        'La forme : carré → carré. Elle ne change pas. La réponse gardera donc la forme de la ' +
          'troisième case, un hexagone.',
        'La lettre : C (3) → F (6). Elle avance de 3 rangs. Appliqué à M (13) : 16 = P.',
        'Les points : un → deux. Il s’en ajoute un. Appliqué : deux points.',
        'Recomposition : un hexagone portant P et deux points.',
      ],
      reponse:
        'Un hexagone avec la lettre P et deux points. Les trois leurres classiques : bonne lettre ' +
        'sans le point ajouté, point ajouté sans la lettre, et la forme du premier couple.',
    },
    aToi: {
      enonce:
        'Une figure devient elle-même avec un point de plus ET une rotation d’un quart de tour. ' +
        'Tu hésites entre deux propositions qui ont toutes deux le bon nombre de points. Que fais-tu ?',
      indice: 'Combien d’attributs la transformation touche-t-elle ?',
      reponse:
        'On vérifie l’orientation, qui est le second attribut touché. Deux propositions qui passent ' +
        'signifient toujours qu’un attribut n’a pas encore été testé — jamais que la question est ' +
        'ambiguë.',
    },
    piege:
      'Reprendre la forme de la figure de DÉPART du premier couple. La transformation s’applique ' +
      'au second couple, pas son contenu.',
    parCoeur: [
      'Compter les attributs à voix basse avant de commencer',
      'Un attribut inchangé dans le premier couple est une contrainte, pas une absence d’information',
      'Deux propositions qui passent = un attribut non testé',
    ],
  },

  /* ------------------------------------------------------------ dominos -- */
  {
    skillId: 'tm.logique.dominos',
    section: 'logique',
    titre: 'Dominos',
    quoi: 'Deux suites indépendantes, l’une en haut, l’autre en bas, bornées de 0 à 6.',
    retrouver: [
      {
        q: 'Un domino est-il un nombre à deux chiffres ?',
        r: 'Non. Ce sont deux suites indépendantes qu’on écrit l’une sous l’autre et qu’on traite séparément.',
      },
      {
        q: 'Que se passe-t-il après 6 ?',
        r: 'On repart à 0. Un total de 8 devient 1 (8 − 7). Et sous 0, on ajoute 7.',
      },
      {
        q: 'Quelles autres lectures existent ?',
        r: 'La somme des deux moitiés, leur différence, ou le domino lu à l’envers d’une case à l’autre.',
      },
      {
        q: 'Quel est le leurre classique ?',
        r: 'Les deux bonnes valeurs, moitiés interverties.',
      },
    ],
    regles: [
      {
        titre: 'Haut et bas sont deux suites distinctes',
        texte:
          'On les écrit l’une sous l’autre, en deux lignes, dans la marge : haut 1, 3, 5, 0, ? et ' +
          'bas 6, 4, 2, 0, ?. Chacune se traite avec la méthode des suites numériques. C’est tout ' +
          'le geste de la famille, et il est presque toujours suffisant.',
      },
      {
        titre: 'Le retour à zéro après 6',
        texte:
          'Une moitié de domino ne porte que 0 à 6 points. Dès qu’un total dépasse 6, on retranche ' +
          '7 ; dès qu’il descend sous 0, on ajoute 7. 5 + 3 donne 1, pas 8. C’est l’erreur qui ' +
          'coûte le plus dans cette famille, et se le dire à voix basse avant de commencer suffit ' +
          'à ne plus la faire.',
      },
      {
        titre: 'Les deux suites peuvent avoir des pas différents',
        texte:
          'Et même des sens opposés : le haut avance de 2 pendant que le bas recule de 2. Les ' +
          'traiter ensemble rend la série incompréhensible ; les traiter séparément la rend ' +
          'évidente.',
      },
      {
        titre: 'Les autres lectures possibles',
        texte:
          'Quand les deux moitiés prises séparément ne donnent rien : leur SOMME suit peut-être une ' +
          'règle, ou leur DIFFÉRENCE. Autre cas classique : la moitié basse d’un domino devient la ' +
          'moitié haute du suivant.',
      },
      {
        titre: 'Le leurre des moitiés interverties',
        texte:
          'Il est systématiquement proposé, et il contient les deux bonnes valeurs : impossible de ' +
          'l’écarter à l’œil. Il faut avoir noté laquelle des deux suites est celle du haut.',
      },
      {
        titre: 'Vérifier sur toute la série',
        texte:
          'Quatre dominos visibles donnent trois écarts par moitié. Une règle qui n’explique que ' +
          'deux d’entre eux est fausse, même si elle paraît naturelle.',
      },
    ],
    exemple: {
      enonce: 'Quel domino complète la suite : [1|6], [3|4], [5|2], [0|0], ?',
      etapes: [
        'Deux lignes : haut 1, 3, 5, 0 — bas 6, 4, 2, 0.',
        'Haut : +2, +2, puis 5 + 2 = 7 → retour à zéro → 0 ✓. Le pas est +2.',
        'Bas : −2, −2, puis 2 − 2 = 0 ✓. Le pas est −2.',
        'Suivant : haut 0 + 2 = 2. Bas 0 − 2 = −2 → on ajoute 7 → 5.',
      ],
      reponse:
        '[2|5]. Les deux retours à zéro tombent sur la même case : c’est exactement ce que la ' +
        'famille cherche à faire rater.',
    },
    aToi: {
      enonce: 'Quel domino complète la suite : [2|3], [4|5], [6|0], [1|2], ?',
      indice: 'Écris les deux lignes. Les deux moitiés avancent du même pas.',
      reponse:
        '[3|4]. Haut : 2, 4, 6, puis 8 → 1, puis 10 → 3. Bas : 3, 5, puis 7 → 0, puis 9 → 2, ' +
        'puis 11 → 4. Les deux avancent de 2 avec retour à zéro.',
    },
    piege:
      'Oublier le retour à zéro. Une moitié ne peut pas porter 7 points : dès qu’un total dépasse ' +
      '6, on retranche 7 sans réfléchir.',
    parCoeur: [
      'Une moitié va de 0 à 6 : sept valeurs, retour à zéro après 6',
      'Au-dessus de 6 : retrancher 7 · en dessous de 0 : ajouter 7',
      'Lectures de secours : somme des moitiés · différence · le bas devient le haut suivant',
    ],
  },

  /* -------------------------------------------------------------- cartes -- */
  {
    skillId: 'tm.logique.cartes',
    section: 'logique',
    titre: 'Cartes',
    quoi:
      'Une valeur de 1 à 13 et une enseigne qui tourne dans un ordre fixe : deux suites, deux ' +
      'bouclages différents.',
    retrouver: [
      {
        q: 'Combien vaut le Valet ? La Dame ? Le Roi ?',
        r: '11, 12 et 13. L’As vaut 1.',
      },
      {
        q: 'Dans quel ordre tournent les enseignes ?',
        r: 'Pique → cœur → carreau → trèfle, puis retour au pique. C’est l’ordre conventionnel, et il est à connaître.',
      },
      {
        q: 'Sur combien boucle chaque suite ?',
        r: 'Les valeurs sur 13, les enseignes sur 4. Ce sont deux bouclages différents, et c’est ce qui rend la famille pénible sans méthode.',
      },
      {
        q: 'Que faut-il écrire en marge ?',
        r: 'Les deux suites en nombres, l’une sous l’autre. La difficulté disparaît entièrement.',
      },
    ],
    regles: [
      {
        titre: 'Deux informations indépendantes, comme un domino',
        texte:
          'La valeur et l’enseigne ne se lisent pas ensemble. On écrit deux lignes dans la marge : ' +
          'les valeurs en nombres, les enseignes en numéros de 1 à 4. Le reste est de l’arithmétique.',
      },
      {
        titre: 'Les valeurs vont de 1 à 13',
        texte:
          'As = 1, puis 2 à 10, Valet = 11, Dame = 12, Roi = 13. Après le Roi, on revient à l’As. ' +
          'Dame + 3 donne 2 (12 + 3 = 15, on retranche 13). Le bouclage sur 13 est le premier des ' +
          'deux pièges.',
      },
      {
        titre: 'Les enseignes tournent sur quatre',
        texte:
          'Pique → cœur → carreau → trèfle → pique. C’est le second bouclage, et il n’a pas la ' +
          'même période que le premier : une enseigne revient toutes les 4 cartes, une valeur ' +
          'toutes les 13.',
      },
      {
        titre: 'La couleur comme attribut à part',
        texte:
          'Pique et trèfle sont noirs, cœur et carreau sont rouges. Certaines séries alternent la ' +
          'COULEUR sans suivre l’ordre des enseignes : c’est la lecture à essayer quand la rotation ' +
          'sur quatre ne colle pas.',
      },
      {
        titre: 'Le leurre de la valeur juste, enseigne figée',
        texte:
          'Comme pour les dominos, les leurres sont construits en appliquant correctement UNE des ' +
          'deux suites. Vérifier les deux avant de cocher est ce qui distingue cette famille d’une ' +
          'simple suite.',
      },
      {
        titre: 'Quand rien ne colle : la somme',
        texte:
          'Somme des valeurs de deux cartes consécutives, ou valeur qui dépend du rang de la carte ' +
          'dans la série. Rare, mais c’est la dernière lecture à tenter avant de cocher et de passer.',
      },
    ],
    exemple: {
      enonce: 'Quelle carte complète la suite : 2♠, 5♥, 8♦, V♣, ?',
      etapes: [
        'Deux lignes. Valeurs : 2, 5, 8, 11 (le Valet). Enseignes : pique, cœur, carreau, trèfle.',
        'Valeurs : +3, +3, +3. La suivante vaut 11 + 3 = 14, or on boucle sur 13 : 14 − 13 = 1, ' +
          'c’est-à-dire l’As.',
        'Enseignes : elles avancent d’un cran dans l’ordre conventionnel. Après trèfle, on revient ' +
          'au pique.',
        'La carte cherchée est donc l’As de pique.',
      ],
      reponse:
        'A♠. Les deux bouclages tombent en même temps : c’est précisément la case que la famille ' +
        'choisit de faire manquer.',
    },
    aToi: {
      enonce: 'Quelle carte complète la suite : 3♥, 6♣, 9♥, D♣, ?',
      indice: 'Les enseignes ne suivent pas l’ordre conventionnel ici. Que font-elles ?',
      reponse:
        '2♥. Les valeurs avancent de 3 : 3, 6, 9, 12 (Dame), puis 15 − 13 = 2. Les enseignes ' +
        'alternent simplement entre cœur et trèfle, donc la cinquième est un cœur.',
    },
    piege:
      'Oublier l’un des deux bouclages. Les valeurs reviennent tous les 13, les enseignes tous les ' +
      '4 : les deux ne tombent presque jamais ensemble, et les leurres exploitent exactement cela.',
    parCoeur: [
      'As = 1 · Valet = 11 · Dame = 12 · Roi = 13',
      'Ordre des enseignes : pique → cœur → carreau → trèfle',
      'Couleurs : pique et trèfle noirs · cœur et carreau rouges',
      'Bouclages : 13 pour les valeurs, 4 pour les enseignes',
    ],
  },
]
