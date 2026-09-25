import type { Lecon } from './types'

/**
 * Sous-test 4 — Conditions minimales.
 *
 * Le sous-test le plus rentable de l'épreuve : les mathématiques n'y dépassent
 * jamais celles du sous-test 2, et la note dépend presque entièrement d'une
 * procédure qu'on peut apprendre en une heure. Les leçons portent donc sur la
 * PROCÉDURE d'abord, et sur ce qui rend chaque domaine suffisant ou non ensuite.
 */
export const LECONS_CONDITIONS: Lecon[] = [
  {
    skillId: 'tm.conditions_minimales.maitrise_du_format_a_e',
    section: 'conditions_minimales',
    retrouver: [
      { q: 'Que signifie la réponse C ?', r: 'Ni (1) ni (2) ne suffit seule, mais leur réunion détermine la réponse.' },
      { q: 'Et la réponse D ?', r: 'CHACUNE suffit séparément. À ne pas confondre avec C.' },
      {
        q: 'Quelle est l’erreur numéro un du sous-test ?',
        r: 'La contamination : évaluer (2) en gardant (1) en mémoire. Elle fait répondre D là où c’est A.',
      },
    ],
    aToi: {
      enonce:
        'Quel est le prix d’un livre ? (1) Trois livres coûtent 36 €. (2) Le prix du livre est un ' +
        'multiple de 4.',
      indice: 'Teste (1) seule en masquant (2). Puis (2) seule, en oubliant tout ce que (1) a appris.',
      reponse:
        'Réponse A. (1) seule donne 36 ÷ 3 = 12 € : une seule valeur, elle suffit — et on n’avait ' +
        'même pas besoin de faire la division. (2) seule laisse 4, 8, 12, 16… : insuffisant.',
    },
    titre: 'Le format A–E : la procédure',
    quoi: 'Le mode d’emploi du sous-test. À savoir par cœur avant tout le reste.',
    regles: [
      {
        titre: 'Les cinq propositions ne changent jamais',
        texte:
          'A : l’information (1) SEULE permet de répondre, mais pas la (2) seule. ' +
          'B : la (2) SEULE permet de répondre, mais pas la (1) seule. ' +
          'C : les deux ENSEMBLE sont nécessaires — ni l’une ni l’autre ne suffit isolément. ' +
          'D : CHACUNE suffit séparément. ' +
          'E : même réunies, elles ne suffisent pas.',
      },
      {
        titre: 'On ne calcule jamais la réponse',
        texte:
          'La question n’est pas « combien ça fait » mais « peut-on répondre ». Savoir qu’une ' +
          'équation à une inconnue a une solution unique suffit : la résoudre est du temps perdu, ' +
          'et c’est ce temps-là qui fait la note.',
      },
      {
        titre: 'L’ordre du test, sans exception',
        texte:
          '1) Reformuler ce qui est cherché. 2) Tester (1) SEULE. 3) Tester (2) SEULE, en oubliant ' +
          'tout ce que (1) a appris. 4) Si aucune ne suffit, tester leur réunion. ' +
          'Puis lire la lettre dans la grille : (1) oui + (2) oui → D ; oui/non → A ; non/oui → B ; ' +
          'non/non + ensemble oui → C ; ensemble non → E.',
      },
      {
        titre: 'Le geste physique qui évite l’erreur n° 1',
        texte:
          'Poser un doigt ou une gomme sur l’information (2) pendant qu’on évalue la (1), et ' +
          'inversement. La contamination — évaluer (2) en gardant (1) en mémoire — est la cause ' +
          'de la majorité des erreurs, et elle fait répondre D là où la réponse est A.',
      },
      {
        titre: 'Suffire, ce n’est pas être vrai',
        texte:
          'Une information peut être vraie, utile, intéressante, et ne pas suffire. La seule ' +
          'question est : après l’avoir lue, reste-t-il plus d’une réponse possible ? Si oui, ' +
          'elle ne suffit pas.',
      },
    ],
    exemple: {
      enonce:
        'Quel est l’âge de Paul ? (1) Dans 5 ans, Paul aura le double de l’âge qu’il avait il y a 10 ans. ' +
        '(2) Paul a plus de 20 ans.',
      etapes: [
        '(1) seule : soit p l’âge. p + 5 = 2(p − 10) donne p = 25. Une seule valeur → elle SUFFIT.',
        '(2) seule : « plus de 20 ans » laisse une infinité d’âges → elle NE SUFFIT PAS.',
        'Une seule suffit, et c’est la première.',
      ],
      reponse: 'Réponse A. Noter qu’on n’avait même pas besoin de calculer 25.',
    },
    piege:
      'Répondre D parce que les deux informations sont cohérentes. La cohérence ne rend pas ' +
      'suffisant : il faut que chacune, seule, détermine la réponse.',
    parCoeur: [
      'A = (1) seule suffit   ·   B = (2) seule suffit',
      'C = les deux ensemble, et seulement ensemble',
      'D = chacune suffit de son côté   ·   E = même ensemble, insuffisant',
    ],
  },

  {
    skillId: 'tm.conditions_minimales.suffisance_vs_resolution',
    section: 'conditions_minimales',
    retrouver: [
      {
        q: 'La question porte sur x + y. Faut-il connaître x et y ?',
        r: 'Non. Une information qui donne directement x + y suffit. C’est le cœur du sous-test.',
      },
      { q: 'Comment se factorise x² − y² ?', r: '(x + y)(x − y). Connaître le produit et un facteur donne l’autre.' },
      {
        q: 'Comment prouve-t-on qu’une information NE suffit PAS ?',
        r: 'En exhibant deux cas qui la respectent et donnent des réponses différentes.',
      },
    ],
    aToi: {
      enonce: 'Que vaut x² + y² ? (1) x + y = 6. (2) xy = 5.',
      indice: 'Développe (x + y)². Que retrouve-t-on dedans ?',
      reponse:
        'Réponse C. (x + y)² = x² + 2xy + y², donc x² + y² = 36 − 2 × 5 = 26. ' +
        'Chaque information seule laisse une infinité de couples ; ensemble elles donnent la ' +
        'combinaison demandée, sans jamais calculer x ni y (qui valent 1 et 5).',
    },
    titre: 'Suffisance contre résolution',
    quoi: 'Répondre à la question posée, qui n’est presque jamais « trouver les inconnues ».',
    regles: [
      {
        titre: 'Lire ce qui est CHERCHÉ, mot pour mot',
        texte:
          'Si la question porte sur x + y, une information qui donne x + y suffit — même si elle ' +
          'ne dit rien de x ni de y séparément. C’est le cœur du sous-test.',
      },
      {
        titre: 'Les combinaisons qui se déduisent sans les inconnues',
        texte:
          'x² − y² = (x + y)(x − y) : connaître le produit et l’un des facteurs donne l’autre. ' +
          '(x + y)² = x² + 2xy + y² : connaître x + y et xy donne x² + y². Ces identités ' +
          'transforment souvent un C apparent en A ou B.',
      },
      {
        titre: 'Compter les équations et les inconnues',
        texte:
          'Deux inconnues demandent en général deux équations indépendantes. « Indépendantes » ' +
          'est le mot important : 2x + 2y = 10 et x + y = 5 sont la même équation écrite deux fois, ' +
          'et deux fois la même information n’en fait pas deux.',
      },
      {
        titre: 'Une équation peut suffire à deux inconnues',
        texte:
          'Quand une contrainte supplémentaire est cachée dans l’énoncé — des entiers, des ' +
          'quantités positives, un nombre de personnes — une seule équation peut n’avoir qu’une ' +
          'solution acceptable. Toujours relire le domaine avant de conclure E.',
      },
      {
        titre: 'Le test de la double valeur',
        texte:
          'Pour montrer qu’une information NE suffit PAS, il faut exhiber deux cas qui la ' +
          'respectent et donnent des réponses différentes. Un seul contre-exemple tranche, et ' +
          'il va plus vite qu’une démonstration.',
      },
    ],
    exemple: {
      enonce:
        'Que vaut x + y ? (1) x − y = 4. (2) x² − y² = 32.',
      etapes: [
        '(1) seule : une infinité de couples (5 ; 1), (6 ; 2)… dont les sommes diffèrent → NE SUFFIT PAS.',
        '(2) seule : x² − y² = (x + y)(x − y) = 32 ; sans connaître x − y, la somme reste indéterminée → NE SUFFIT PAS.',
        'Ensemble : (x + y) × 4 = 32, donc x + y = 8.',
      ],
      reponse:
        'Réponse C. On a obtenu la somme sans jamais calculer x ni y — c’est exactement ce que ' +
        'le sous-test veut faire voir.',
    },
    piege:
      'Chercher x et y alors qu’on demande x + y. C’est plus long, et cela fait conclure E sur ' +
      'des questions où la réponse est C.',
  },

  {
    skillId: 'tm.conditions_minimales.pieges_de_signe_et_cas_particuliers',
    section: 'conditions_minimales',
    retrouver: [
      { q: 'x² = 36. Combien de valeurs possibles ?', r: 'Deux : 6 et −6. L’information ne suffit donc pas.' },
      { q: 'x³ = −8. Combien ?', r: 'Une seule : −2. Les puissances impaires conservent le signe.' },
      {
        q: 'Une équation du second degré donne deux racines. Est-ce forcément insuffisant ?',
        r: 'Non : si le contexte (un âge, un effectif) en élimine une, l’information redevient suffisante.',
      },
    ],
    aToi: {
      enonce:
        'Quelle est la valeur de n ? (1) n² − 5n + 6 = 0. (2) n est le nombre de personnes d’une équipe.',
      indice: 'Résous (1), puis demande-toi si (2) élimine une racine — ou pas.',
      reponse:
        'Réponse E. (1) donne n = 2 ou n = 3, deux entiers positifs : (2) n’en élimine aucun. ' +
        'Le piège est de croire que « nombre de personnes » tranche toujours ; ici il ne tranche rien.',
    },
    titre: 'Pièges de signe et cas particuliers',
    quoi: 'Les situations où une information semble suffire et laisse en fait deux réponses.',
    regles: [
      {
        titre: 'Un carré ne détermine pas le signe',
        texte:
          'x² = 25 donne x = 5 OU x = −5 : deux réponses, donc l’information ne suffit pas. ' +
          'Il faut une seconde information qui tranche le signe. C’est le piège le plus fréquent ' +
          'du sous-test.',
      },
      {
        titre: 'Un cube, si',
        texte:
          'x³ = −27 n’a qu’une solution, x = −3. Les puissances IMPAIRES conservent le signe et ' +
          'déterminent donc la valeur ; les puissances PAIRES l’effacent.',
      },
      {
        titre: 'La valeur absolue',
        texte:
          '|x| = 7 donne x = 7 ou x = −7. Même mécanisme que le carré, et même conclusion.',
      },
      {
        titre: 'Une racine à écarter',
        texte:
          'Une équation du second degré a deux solutions ; une seule est parfois acceptable ' +
          '(un âge, un effectif, une longueur ne sont pas négatifs). Quand le contexte élimine ' +
          'une racine, l’information redevient suffisante — et beaucoup de candidats répondent E ' +
          'à tort.',
      },
      {
        titre: 'La division par zéro et les cas limites',
        texte:
          'Une équation avec un paramètre au dénominateur peut perdre son unicité dans un cas ' +
          'précis. De même, multiplier une inégalité par un nombre négatif en retourne le sens. ' +
          'Chercher le cas limite avant de conclure.',
      },
    ],
    exemple: {
      enonce: 'Quelle est la valeur de x ? (1) x² = 49. (2) x < 0.',
      etapes: [
        '(1) seule : x = 7 ou x = −7 → deux réponses → NE SUFFIT PAS.',
        '(2) seule : « négatif » ne donne aucune grandeur → NE SUFFIT PAS.',
        'Ensemble : le carré fournit les deux candidats, le signe en élimine un → x = −7.',
      ],
      reponse: 'Réponse C.',
    },
    piege:
      'Répondre A parce que √49 = 7. La racine carrée d’un nombre est positive par convention, ' +
      'mais l’ÉQUATION x² = 49 a bien deux solutions.',
  },

  {
    skillId: 'tm.conditions_minimales.cm_equations_et_systemes',
    section: 'conditions_minimales',
    retrouver: [
      {
        q: 'Deux équations à deux inconnues suffisent-elles toujours ?',
        r: 'Seulement si elles sont indépendantes : l’une ne doit pas être un multiple de l’autre.',
      },
      { q: '« Dans 5 ans » et « il y a 10 ans » : combien d’inconnues ?', r: 'Une seule. C’est p + 5 et p − 10.' },
      {
        q: 'Un rapport entre deux âges suffit-il ?',
        r: 'Jamais seul. Il faut une valeur absolue quelque part : un âge, une somme, un écart.',
      },
    ],
    aToi: {
      enonce: 'Que valent a et b ? (1) 3a − b = 7. (2) 6a − 2b = 14.',
      indice: 'Regarde si la seconde ligne apporte quelque chose de neuf.',
      reponse:
        'Réponse E. (2) est exactement (1) multipliée par 2 : deux fois la même information. ' +
        'Il n’y a donc qu’une équation pour deux inconnues, et une infinité de couples conviennent.',
    },
    titre: 'CM — équations et systèmes',
    quoi: 'Décider si un système a une solution unique, sans le résoudre.',
    regles: [
      {
        titre: 'Deux inconnues, deux équations indépendantes',
        texte:
          'Le système ax + by = e / cx + dy = f a une solution unique si ad − bc ≠ 0. ' +
          'Sans calculer : il suffit que les deux équations ne soient pas proportionnelles l’une ' +
          'à l’autre.',
      },
      {
        titre: 'Repérer l’équation redondante',
        texte:
          'Si (2) s’obtient en multipliant (1) par un nombre, elle n’apporte rien. C’est un cas ' +
          'de réponse E qui ressemble à un C, et le concours le pose régulièrement.',
      },
      {
        titre: 'Les problèmes d’âges',
        texte:
          'Un rapport entre deux âges ne fixe aucun des deux. Il faut une valeur absolue quelque ' +
          'part : un âge donné, leur somme, ou leur écart chiffré. « Il aura le double dans 5 ans » ' +
          'est une équation, et souvent suffisante à elle seule.',
      },
      {
        titre: 'Un âge futur ou passé n’est pas une inconnue de plus',
        texte:
          '« Dans 5 ans » se traduit p + 5, « il y a 10 ans » se traduit p − 10 : c’est toujours ' +
          'la même lettre. Une phrase qui parle de deux moments donne une seule équation.',
      },
      {
        titre: 'Le domaine compte',
        texte:
          'Quand l’inconnue est un nombre de personnes, d’objets, d’années, elle est entière et ' +
          'positive. Cette contrainte non écrite rend parfois une seule équation suffisante.',
      },
    ],
    exemple: {
      enonce:
        'Que valent x et y ? (1) 2x + 3y = 12. (2) 4x + 6y = 24.',
      etapes: [
        '(1) seule : une équation, deux inconnues → infinité de couples → NE SUFFIT PAS.',
        '(2) seule : idem → NE SUFFIT PAS.',
        'Ensemble : (2) est exactement (1) multipliée par 2. Elle n’apporte aucune information nouvelle.',
      ],
      reponse:
        'Réponse E. Le piège tient dans le fait que les deux lignes ont l’air différentes.',
    },
    piege:
      'Compter deux équations là où il n’y en a qu’une. Toujours vérifier qu’une ligne n’est pas ' +
      'un multiple de l’autre avant de conclure C.',
  },

  {
    skillId: 'tm.conditions_minimales.cm_pourcentages_et_variations',
    section: 'conditions_minimales',
    retrouver: [
      { q: 'Un taux de remise seul suffit-il à trouver un prix ?', r: 'Non. Un pourcentage est une proportion, il lui faut une base chiffrée.' },
      {
        q: 'Quelle information sur une remise se suffit à elle-même ?',
        r: 'Le montant économisé accompagné de son taux : 24 € pour 30 % donne 24 ÷ 0,30 = 80 €.',
      },
      {
        q: 'Une variation globale sur deux ans dit-elle ce qui s’est passé chaque année ?',
        r: 'Non : une infinité de couples de coefficients donnent le même produit.',
      },
    ],
    aToi: {
      enonce:
        'Quel est le prix initial ? (1) Après une remise, l’article coûte 45 €. ' +
        '(2) La remise a fait économiser 15 €.',
      indice: 'Le prix initial, c’est le prix payé plus ce qui a été économisé.',
      reponse:
        'Réponse C. 45 + 15 = 60 €. Aucune des deux ne suffit seule, mais leur somme donne ' +
        'directement le prix — sans qu’on ait besoin de connaître le taux, qui vaut ici 25 %.',
    },
    titre: 'CM — pourcentages et variations',
    quoi: 'Savoir ce qui manque pour remonter d’un pourcentage à un montant.',
    regles: [
      {
        titre: 'Un taux seul ne donne aucun montant',
        texte:
          '« Une remise de 30 % » s’applique à 40 € comme à 4 000 €. Un pourcentage est une ' +
          'proportion : il lui faut toujours une base chiffrée.',
      },
      {
        titre: 'Un montant final seul ne donne pas le taux',
        texte:
          '« L’article coûte 60 € après remise » peut venir d’une remise de 10 % comme de 50 %. ' +
          'C’est le couple taux + montant qui remonte au prix initial.',
      },
      {
        titre: 'Une variation exprimée en euros se suffit souvent',
        texte:
          '« La remise de 30 % a fait économiser 24 € » donne le prix initial à elle seule : ' +
          '24 ÷ 0,30 = 80 €. Une variation ABSOLUE accompagnée de son taux est autosuffisante.',
      },
      {
        titre: 'Une variation globale ne dit rien des étapes',
        texte:
          'Savoir qu’un prix a baissé de 4 % sur deux ans ne dit pas de combien il a varié chaque ' +
          'année : une infinité de couples donnent le même produit de coefficients.',
      },
      {
        titre: 'Les proportions sans effectif',
        texte:
          '« 60 % des salariés sont des femmes » ne donne aucun nombre de femmes. Mais « il y a ' +
          '30 femmes de plus que d’hommes » associé à ce taux suffit : l’écart en points devient ' +
          'un écart en personnes.',
      },
    ],
    exemple: {
      enonce:
        'Quel était le prix initial d’un article ? (1) Il a subi une remise de 20 %. ' +
        '(2) Il coûte 48 € après remise.',
      etapes: [
        '(1) seule : un taux sans base → NE SUFFIT PAS.',
        '(2) seule : un prix final sans taux → NE SUFFIT PAS.',
        'Ensemble : 48 ÷ 0,80 = 60 €.',
      ],
      reponse: 'Réponse C.',
    },
    piege:
      'Croire que le prix initial vaut 48 × 1,20 = 57,60 €. On défait une variation en DIVISANT ' +
      'par son coefficient, jamais en appliquant la variation inverse.',
  },

  {
    skillId: 'tm.conditions_minimales.cm_proportionnalite_et_ratios',
    section: 'conditions_minimales',
    retrouver: [
      { q: 'Quels compléments rendent un rapport suffisant ?', r: 'Un total, un écart chiffré, ou l’un des deux effectifs. Un seul des trois suffit.' },
      { q: 'Un total seul suffit-il ?', r: 'Non : il ne dit pas comment il se répartit entre les groupes.' },
      {
        q: 'Quand un rapport se suffit-il à lui seul ?',
        r: 'Quand la question demande une PROPORTION et non un effectif. Relire ce qui est cherché.',
      },
    ],
    aToi: {
      enonce:
        'Quelle proportion de l’effectif les femmes représentent-elles ? ' +
        '(1) Le rapport hommes / femmes est de 2 pour 3. (2) L’association compte 200 membres.',
      indice: 'Relis la question : demande-t-elle un nombre ou une part ?',
      reponse:
        'Réponse A. La question porte sur une PROPORTION : 3 parts sur 5, soit 60 %. ' +
        'Le rapport suffit seul, et le total de (2) ne sert à rien. Si la question avait demandé ' +
        '« combien de femmes », la réponse aurait été C.',
    },
    titre: 'CM — proportionnalité et ratios',
    quoi: 'Reconnaître ce qui manque pour convertir un rapport en effectif.',
    regles: [
      {
        titre: 'Un rapport ne donne jamais un effectif',
        texte:
          '« 3 hommes pour 5 femmes » vaut à toutes les échelles. Il faut y ajouter un total, ' +
          'un écart chiffré, ou l’un des deux effectifs.',
      },
      {
        titre: 'Trois compléments suffisants, et un seul suffit',
        texte:
          'Rapport + total → on divise en parts. Rapport + écart → l’écart vaut un nombre entier ' +
          'de parts. Rapport + un effectif → la valeur de la part se lit directement. ' +
          'Chacun de ces trois couples est autosuffisant.',
      },
      {
        titre: 'Un total seul ne se répartit pas',
        texte:
          '« L’association compte 160 membres » ne dit rien du partage entre les deux groupes. ' +
          'C’est l’information insuffisante typique.',
      },
      {
        titre: 'Attention à ce qui est rapporté à quoi',
        texte:
          '« Le rapport des hommes au total » et « le rapport des hommes aux femmes » ne sont pas ' +
          'la même donnée : 3/8 n’est pas 3/5. Une lecture rapide fait conclure trop vite.',
      },
      {
        titre: 'Le cas où le rapport suffit seul',
        texte:
          'Si la question porte sur une PROPORTION et non un effectif — « quelle part de ' +
          'l’ensemble représentent les femmes ? » —, le rapport suffit à lui seul. Relire ce qui ' +
          'est demandé avant de trancher.',
      },
    ],
    exemple: {
      enonce:
        'Combien de femmes compte l’association ? (1) Le rapport hommes / femmes est de 3 pour 5. ' +
        '(2) Il y a 40 femmes de plus que d’hommes.',
      etapes: [
        '(1) seule : une proportion, aucun effectif → NE SUFFIT PAS.',
        '(2) seule : un écart sans proportion → NE SUFFIT PAS.',
        'Ensemble : l’écart vaut 5 − 3 = 2 parts, donc 2 parts = 40 et une part = 20. Les femmes en font 5 : 100.',
      ],
      reponse: 'Réponse C.',
    },
    piege:
      'Conclure A parce que le rapport « donne » les femmes. Il donne leur part, pas leur nombre.',
  },

  {
    skillId: 'tm.conditions_minimales.cm_geometrie',
    section: 'conditions_minimales',
    retrouver: [
      { q: 'Un périmètre détermine-t-il une aire ?', r: 'Non. 4 × 6 et 2 × 8 ont le même périmètre et des aires différentes.' },
      { q: 'Trois angles suffisent-ils à déterminer un triangle ?', r: 'Non : ils donnent la forme, jamais la taille.' },
      {
        q: 'Combien de nombres faut-il pour déterminer un cercle ?',
        r: 'Un seul — rayon, diamètre, périmètre ou aire donnent les trois autres.',
      },
    ],
    aToi: {
      enonce:
        'Quelle est l’aire d’un triangle rectangle ? (1) Son hypoténuse mesure 10 cm. ' +
        '(2) Un de ses côtés de l’angle droit mesure 6 cm.',
      indice: 'Le mot « rectangle » est lui-même une information : Pythagore relie déjà les trois côtés.',
      reponse:
        'Réponse C. Seules, ni l’hypoténuse ni un côté ne déterminent la figure. Ensemble, Pythagore ' +
        'donne le troisième côté (√(100 − 36) = 8), donc l’aire : 6 × 8 / 2 = 24 cm².',
    },
    titre: 'CM — géométrie',
    quoi: 'Savoir quand une figure est entièrement déterminée par ce qu’on en dit.',
    regles: [
      {
        titre: 'Un périmètre ne détermine pas une aire',
        texte:
          'Une infinité de rectangles partagent le même périmètre et n’ont pas la même aire ' +
          '(4 × 6 et 2 × 8 ont tous deux 20 de périmètre). Il faut une seconde relation entre les côtés.',
      },
      {
        titre: 'Ce qui détermine un rectangle',
        texte:
          'Deux dimensions ; ou une dimension et le périmètre ; ou le périmètre et le rapport des ' +
          'côtés ; ou l’aire et le rapport. Un seul de ces couples suffit.',
      },
      {
        titre: 'Ce qui détermine un triangle',
        texte:
          'Trois côtés ; ou deux côtés et l’angle entre eux ; ou un côté et deux angles. ' +
          'Trois ANGLES seuls ne suffisent jamais : ils donnent la forme, pas la taille.',
      },
      {
        titre: 'Le cercle est déterminé par un seul nombre',
        texte:
          'Rayon, diamètre, périmètre ou aire : l’un quelconque des quatre donne les trois autres. ' +
          'Une question sur un disque est donc souvent un D.',
      },
      {
        titre: 'Le mot « rectangle » est une information',
        texte:
          'Si l’énoncé pose un triangle rectangle, Pythagore relie déjà les trois côtés : deux ' +
          'côtés donnés suffisent alors, là où un triangle quelconque en demanderait trois.',
      },
    ],
    exemple: {
      enonce:
        'Quelle est l’aire d’un rectangle ? (1) Son périmètre vaut 36 cm. ' +
        '(2) Sa longueur vaut le double de sa largeur.',
      etapes: [
        '(1) seule : 8 × 10 et 6 × 12 ont le même périmètre et des aires différentes → NE SUFFIT PAS.',
        '(2) seule : un rapport de forme sans dimension → NE SUFFIT PAS.',
        'Ensemble : 2(l + 2l) = 36 donne l = 6 et L = 12, donc une aire de 72 cm².',
      ],
      reponse: 'Réponse C.',
    },
    piege:
      'Oublier de chercher un contre-exemple. Sur la géométrie, deux figures concrètes tranchent ' +
      'plus vite que n’importe quel raisonnement.',
  },

  {
    skillId: 'tm.conditions_minimales.cm_arithmetique_et_divisibilite',
    section: 'conditions_minimales',
    retrouver: [
      { q: 'Une divisibilité seule suffit-elle ?', r: 'Jamais : les multiples d’un nombre sont infinis. Il faut une borne.' },
      {
        q: 'Que faut-il vérifier sur un encadrement plus une divisibilité ?',
        r: 'Qu’un SEUL multiple tombe dans l’intervalle. Deux, et l’information ne suffit plus.',
      },
      { q: 'Faut-il identifier n pour répondre ?', r: 'Non : il suffit de savoir COMBIEN de valeurs survivent.' },
    ],
    aToi: {
      enonce:
        'Quelle est la valeur de n ? (1) n est un multiple de 7 strictement compris entre 30 et 50. ' +
        '(2) n est impair.',
      indice: 'Liste les multiples de 7 dans l’intervalle avant de conclure.',
      reponse:
        'Réponse C. (1) laisse 35 et 42 : deux valeurs, insuffisant. (2) seule ne borne rien. ' +
        'Ensemble, « impair » élimine 42 et laisse 35. Conclure A ici est l’erreur classique — ' +
        'on compte, on ne suppose pas.',
    },
    titre: 'CM — arithmétique et divisibilité',
    quoi: 'Savoir quand un encadrement et une contrainte enferment un seul entier.',
    regles: [
      {
        titre: 'Un encadrement suffit s’il ne contient qu’un candidat',
        texte:
          '« n est un multiple de 7 compris entre 50 et 60 » ne laisse que 56 : c’est suffisant. ' +
          'Si l’intervalle en contenait deux, ce ne le serait plus. Toute la question est là, et ' +
          'elle se vérifie en comptant.',
      },
      {
        titre: 'Une divisibilité seule ne suffit jamais',
        texte:
          'Les multiples d’un nombre sont infinis. Il faut toujours une borne, ou une seconde ' +
          'contrainte de divisibilité assortie d’un intervalle.',
      },
      {
        titre: 'Le mot « seul » fait tout le travail',
        texte:
          '« n est le SEUL multiple de 9 entre 40 et 60 » est suffisant par construction : ' +
          'l’énoncé garantit l’unicité. Sans ce mot, il faut la vérifier soi-même.',
      },
      {
        titre: 'Parité, chiffres, et restes',
        texte:
          '« La somme de ses chiffres vaut 9 », « il est pair », « il laisse un reste de 3 dans la ' +
          'division par 5 » : chacune restreint sans déterminer. C’est leur croisement qui peut ' +
          'enfermer un candidat unique.',
      },
      {
        titre: 'Compter les candidats, ne pas les trouver',
        texte:
          'Il n’est pas nécessaire d’identifier n : il suffit de savoir COMBIEN de valeurs ' +
          'survivent. Une suffit, deux ou plus ne suffisent pas.',
      },
    ],
    exemple: {
      enonce:
        'Quelle est la valeur de l’entier n ? (1) n est un multiple de 6 strictement compris entre 20 et 30. ' +
        '(2) n est pair.',
      etapes: [
        '(1) seule : entre 20 et 30 exclus, le seul multiple de 6 est 24 → une valeur → SUFFIT.',
        '(2) seule : une infinité de nombres pairs → NE SUFFIT PAS.',
      ],
      reponse: 'Réponse A.',
    },
    piege:
      'Ne pas compter. Entre 20 et 30 exclus il n’y a qu’un multiple de 6, mais il y en a trois ' +
      'entre 20 et 40 : la largeur de l’intervalle décide, et elle se vérifie en deux secondes. ' +
      'Attention aussi aux bornes — « compris entre » inclut ou non les extrémités selon l’énoncé.',
  },

  {
    skillId: 'tm.conditions_minimales.cm_statistiques_et_probabilites',
    section: 'conditions_minimales',
    retrouver: [
      { q: 'Que faut-il pour calculer une moyenne ?', r: 'Le total ET l’effectif. L’un sans l’autre ne donne rien.' },
      {
        q: 'Quand deux moyennes se moyennent-elles simplement ?',
        r: 'Seulement si les deux groupes ont le MÊME effectif. Sinon il faut pondérer.',
      },
      {
        q: 'Connaître le total dit-il quelque chose de la médiane ?',
        r: 'Non. Moyenne et médiane ne se déduisent jamais l’une de l’autre.',
      },
    ],
    aToi: {
      enonce:
        'Quelle est la moyenne du groupe ? (1) Les 12 hommes ont 14 de moyenne, les 8 femmes 19. ' +
        '(2) Le groupe compte 20 personnes.',
      indice: 'Les effectifs sont-ils déjà donnés quelque part ?',
      reponse:
        'Réponse A. (1) donne les deux effectifs ET les deux moyennes : ' +
        '(12 × 14 + 8 × 19) / 20 = (168 + 152) / 20 = 16. (2) ne fait que répéter le total des ' +
        'effectifs, déjà contenu dans (1).',
    },
    titre: 'CM — statistiques et probabilités',
    quoi: 'Reconnaître ce qui manque pour qu’une moyenne ou une probabilité soit calculable.',
    regles: [
      {
        titre: 'Une moyenne demande le total ET l’effectif',
        texte:
          'L’un sans l’autre ne donne rien. C’est le couple qui suffit, et c’est le C le plus ' +
          'fréquent du domaine.',
      },
      {
        titre: 'Deux moyennes ne se moyennent que si les effectifs sont égaux',
        texte:
          'Si l’énoncé précise que les deux groupes ont le même effectif, la moyenne des deux ' +
          'moyennes suffit. Sinon il faut aussi les effectifs — et l’information devient insuffisante.',
      },
      {
        titre: 'Une probabilité demande les deux comptages',
        texte:
          'Cas favorables et cas possibles. Connaître le nombre de boules rouges ne suffit pas ' +
          'sans le total ; connaître une proportion suffit parfois, si la question porte sur une ' +
          'probabilité et non sur un effectif.',
      },
      {
        titre: 'La médiane demande la position, pas la somme',
        texte:
          'Connaître le total ne dit rien de la médiane, et connaître la médiane ne dit rien de la ' +
          'moyenne. Ces deux informations ne se remplacent jamais l’une l’autre.',
      },
      {
        titre: 'Les proportions se suffisent quand la question est une proportion',
        texte:
          'Si l’on demande « quelle est la probabilité », des pourcentages suffisent souvent. ' +
          'Si l’on demande « combien de personnes », il faut un effectif quelque part.',
      },
    ],
    exemple: {
      enonce:
        'Quelle est la moyenne de la classe ? (1) La classe se partage en deux groupes de même ' +
        'effectif, de moyennes 12 et 14. (2) La somme des notes vaut 390.',
      etapes: [
        '(1) seule : effectifs égaux, donc la moyenne d’ensemble est (12 + 14)/2 = 13 → SUFFIT.',
        '(2) seule : un total sans effectif → NE SUFFIT PAS.',
      ],
      reponse:
        'Réponse A. Si (1) n’avait pas précisé « de même effectif », elle n’aurait plus suffi.',
    },
    piege:
      'Ne pas voir la mention des effectifs égaux. C’est elle qui fait basculer la réponse de C à A, ' +
      'et elle tient en trois mots.',
  },
]
