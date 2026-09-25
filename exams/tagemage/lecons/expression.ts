import type { Lecon } from './types'

/**
 * Sous-test 5 — Expression.
 *
 * C'est le seul sous-test où une connaissance réelle est demandée : les règles
 * de la langue. Elles ne s'inventent pas au chronomètre. Mais elles sont en
 * nombre fini, et le concours en teste toujours les mêmes — accord du participe
 * passé, homophones, mode après conjonction, préposition attendue par le verbe.
 * Les leçons les listent, avec le test qui les tranche sur le moment.
 */
export const LECONS_EXPRESSION: Lecon[] = [
  {
    skillId: 'tm.expression.orthographe',
    section: 'expression',
    retrouver: [
      { q: 'Comment tranche-t-on entre « a » et « à » ?', r: 'On remplace par « avait ». Si la phrase tient, c’est « a », le verbe.' },
      { q: 'Et entre « ces » et « ses » ?', r: 'On remplace par « mes ». Si cela marche, c’est « ses », le possessif.' },
      { q: 'Quand « leur » prend-il un s ?', r: 'Seulement devant un nom. Devant un verbe c’est un pronom, invariable : « il leur parle ».' },
    ],
    aToi: {
      enonce:
        'Corrige : « Quelque soit sa décision, il l’a prendra sans se soucier de ces collègues, ' +
        'quoiqu’il en pense. »',
      indice: 'Quatre fautes. Applique tes tests un mot à la fois.',
      reponse:
        '« Quelle que soit sa décision, il la prendra sans se soucier de ses collègues, quoi qu’il ' +
        'en pense. » — (1) « quel que » en deux mots devant être, accordé au féminin ; ' +
        '(2) « la prendra » : pronom, pas « l’a » ; (3) « ses collègues » : possessif (test « mes ») ; ' +
        '(4) « quoi que » = « quelle que soit la chose que ».',
    },
    titre: 'Orthographe et homophones',
    quoi: 'Les paires de mots qui se prononcent pareil et s’écrivent autrement.',
    regles: [
      {
        titre: 'a / à — le test de l’imparfait',
        texte:
          '« a » est le verbe avoir : on peut le remplacer par « avait ». « à » est la préposition, ' +
          'et ne se remplace pas. « Il a relu » → « il avait relu » : c’est bien le verbe.',
      },
      {
        titre: 'ce / se, ces / ses, c’est / s’est',
        texte:
          '« se » et « s’ » accompagnent un verbe pronominal (se laver). « ces » est démonstratif ' +
          '(ces livres-là), « ses » est possessif (les siens). Test : remplacer par « mes » — si ' +
          'cela marche, c’est « ses ».',
      },
      {
        titre: 'leur / leurs',
        texte:
          '« leur » devant un verbe est un pronom, invariable : « il leur parle ». Devant un nom, ' +
          'c’est un possessif qui s’accorde : « leurs livres ». Test : si on peut le remplacer par ' +
          '« lui », il est invariable.',
      },
      {
        titre: 'Les paires en un ou deux mots',
        texte:
          'plutôt (préférence) / plus tôt (temps) — test : opposer à « plus tard ». ' +
          'quoique (bien que) / quoi que (quelle que soit la chose que). ' +
          'quelquefois (parfois) / quelques fois (un petit nombre de fois). ' +
          'davantage (plus) / d’avantage (de bénéfice).',
      },
      {
        titre: 'quel que / quelque',
        texte:
          'Devant le verbe être, « quel que » s’écrit en deux mots et s’accorde avec le sujet : ' +
          '« quelle que soit la décision ». Ailleurs, « quelque » signifie « environ » ou « un certain ».',
      },
      {
        titre: 'ou / où, la / là / l’a, sa / ça',
        texte:
          '« ou » se remplace par « ou bien » ; « où » marque le lieu ou le temps. ' +
          '« la » est article ou pronom, « là » indique un endroit, « l’a » contient le verbe avoir ' +
          '(« il l’a vu »). « sa » est possessif, « ça » se remplace par « cela ».',
      },
      {
        titre: 'peu / peut / peux, s’en / sans / sang',
        texte:
          '« peut » et « peux » se remplacent par « pouvait » ; « peu » est une quantité. ' +
          '« sans » est la préposition du manque, « s’en » accompagne un verbe pronominal ' +
          '(« il s’en va »), et « sang » est le liquide.',
      },
      {
        titre: 'près / prêt, dans / d’en, plus tôt / plutôt',
        texte:
          '« près » indique la proximité, « prêt » signifie préparé et s’accorde (« prête »). ' +
          '« Plus tôt » s’oppose à « plus tard » — c’est LE test ; « plutôt » exprime la préférence.',
      },
      {
        titre: 'Les pluriels irréguliers',
        texte:
          'Un travail → des travaux. Un bail → des baux. Un vitrail → des vitraux. ' +
          'Mais un détail → des détails, un chandail → des chandails. ' +
          'Les mots en -ou prennent un s sauf sept : bijou, caillou, chou, genou, hibou, joujou, pou.',
      },
      {
        titre: 'Les doubles consonnes fréquentes au concours',
        texte:
          'Un appel mais appeler ; un professionnel ; une occurrence ; un développement ; ' +
          'une adresse (un seul d) ; un accueil ; une abréviation (un seul b) ; ' +
          'un dilemme ; une hypothèse. Le concours pioche presque toujours dans cette famille.',
      },
    ],
    exemple: {
      enonce:
        'Chacun apportera (ces / ses) propres outils, et (ces / ses) derniers resteront sur place.',
      etapes: [
        'Premier blanc : les outils appartiennent à chacun → possessif → « ses ». ' +
          'Test : « ses propres outils » se remplace par « mes propres outils ».',
        'Second blanc : « ces derniers » est une locution démonstrative figée, elle désigne ' +
          'les outils dont on vient de parler → « ces », toujours.',
      ],
      reponse: '« Chacun apportera ses propres outils, et ces derniers resteront sur place. »',
    },
    piege:
      'Corriger la première occurrence et laisser la seconde. Les propositions ne diffèrent souvent ' +
      'que par UN mot : comparer les cinq entre elles montre lequel est testé.',
  },

  {
    skillId: 'tm.expression.grammaire_et_conjugaison',
    section: 'expression',
    retrouver: [
      {
        q: 'Avec « avoir », quand le participe passé s’accorde-t-il ?',
        r: 'Seulement si le complément d’objet direct est placé AVANT le verbe.',
      },
      {
        q: 'Cite trois locutions qui imposent le subjonctif, et une qui ne l’impose pas.',
        r: 'Bien que, quoique, avant que, pour que, à moins que → subjonctif. « Après que » → indicatif.',
      },
      { q: 'Peut-on écrire « si j’aurais su » ?', r: 'Jamais. Après « si » de condition : présent, imparfait ou plus-que-parfait.' },
    ],
    aToi: {
      enonce:
        'Corrige : « Bien qu’il a compris les consignes qu’on lui a donné, il les a mal appliqué, ' +
        'et si il aurait relu, il s’en serait aperçu. »',
      indice: 'Trois fautes : un mode, deux accords de participe, et une conjonction mal écrite.',
      reponse:
        '« Bien qu’il ait compris les consignes qu’on lui a données, il les a mal appliquées, ' +
        'et s’il avait relu, il s’en serait aperçu. » — « bien que » impose le subjonctif ; ' +
        '« consignes » et « les » sont des COD placés avant, donc accord ; ' +
        '« si il » s’élide en « s’il », et « si » ne se construit jamais avec un conditionnel.',
    },
    titre: 'Grammaire et conjugaison',
    quoi: 'Accords, temps et modes — les quatre règles que le concours teste sans arrêt.',
    regles: [
      {
        titre: 'Le participe passé — les trois cas',
        texte:
          'Avec ÊTRE : il s’accorde avec le sujet (« elles sont parties »). ' +
          'Avec AVOIR : il s’accorde avec le complément d’objet direct SEULEMENT si celui-ci est ' +
          'placé avant (« les lettres qu’il a écrites »), et reste invariable sinon (« il a écrit ' +
          'des lettres »). ' +
          'Avec un verbe PRONOMINAL : accord avec le sujet, sauf si un COD suit le verbe ' +
          '(« elle s’est lavée » mais « elle s’est lavé les mains »).',
      },
      {
        titre: 'Le subjonctif après une locution',
        texte:
          'L’IMPOSENT : bien que, quoique, avant que, jusqu’à ce que, pour que, afin que, à moins ' +
          'que, sans que, de peur que. ' +
          'NE L’IMPOSENT PAS : après que, parce que, pendant que, dès que, puisque — l’indicatif ' +
          'y est correct, et le concours joue précisément là-dessus.',
      },
      {
        titre: 'Si + imparfait, jamais de conditionnel',
        texte:
          '« Si j’avais su, je serais venu » — jamais « si j’aurais su ». Après « si » de ' +
          'condition : présent, imparfait ou plus-que-parfait, jamais un conditionnel.',
      },
      {
        titre: 'La concordance des temps',
        texte:
          'Récit au passé → subordonnée à l’imparfait (« il disait qu’il venait »). ' +
          'Récit au présent → subordonnée au présent (« il dit qu’il vient »). Un temps qui ' +
          'détonne dans la subordonnée est le signal de la faute.',
      },
      {
        titre: 'Les accords qui trompent l’oreille',
        texte:
          '« Chacun », « aucun », « personne », « tout le monde » sont SINGULIERS. ' +
          '« La plupart » et « beaucoup de » entraînent le pluriel. ' +
          'Un sujet éloigné de son verbe par une longue incise reste le sujet : on le retrouve ' +
          'avant d’accorder.',
      },
      {
        titre: 'Le participe passé des verbes pronominaux réfléchis indirects',
        texte:
          '« Elles se sont parlé » — invariable, parce qu’on parle À quelqu’un : le pronom est ' +
          'complément INDIRECT. Même chose pour se téléphoner, se nuire, se succéder, se plaire. ' +
          'C’est la variante avancée que le concours réserve aux questions difficiles.',
      },
      {
        titre: 'Le participe passé suivi d’un infinitif',
        texte:
          '« Les musiciens que j’ai entendus jouer » — accord, car ce sont eux qui jouent. ' +
          '« Les airs que j’ai entendu jouer » — pas d’accord, car les airs ne jouent pas, ils sont joués. ' +
          'Le test : le complément fait-il l’action de l’infinitif ?',
      },
      {
        titre: 'Les temps composés du conditionnel',
        texte:
          '« J’aurais aimé » (conditionnel passé) exprime le regret ; « j’aurai aimé » (futur ' +
          'antérieur) situe dans l’avenir. La différence tient à un s, et le concours la teste.',
      },
      {
        titre: 'Les verbes du troisième groupe à surveiller',
        texte:
          'Il vainc, ils vainquent. Il résout, nous résolvons. Il faut que je puisse, que je fasse, ' +
          'que j’aille, que je sache. Ces subjonctifs irréguliers reviennent avec « bien que » et ' +
          '« il faut que ».',
      },
    ],
    exemple: {
      enonce: 'Les décisions que le conseil a (pris / prise / prises) hier entrent en vigueur.',
      etapes: [
        'Auxiliaire avoir : l’accord dépend de la place du COD.',
        'Le COD est « que », mis pour « les décisions » — il est placé AVANT le verbe.',
        'Accord au féminin pluriel.',
      ],
      reponse: '« Les décisions que le conseil a prises hier… »',
    },
    piege:
      'Accorder avec le mot le plus proche. Dans « les décisions que le conseil a prises », ' +
      'l’oreille voudrait accorder avec « conseil » ; c’est « décisions » qui commande.',
  },

  {
    skillId: 'tm.expression.correction_syntaxique',
    section: 'expression',
    retrouver: [
      { q: 'Dit-on « se rappeler de quelque chose » ?', r: 'Non : on se rappelle QUELQUE CHOSE, mais on se souvient DE quelque chose.' },
      { q: 'Dit-on « pallier à un problème » ?', r: 'Non. « Pallier » se construit directement, comme « corriger ».' },
      {
        q: 'Quel est le défaut de « En sortant du métro, la pluie s’est mise à tomber » ?',
        r: 'Le participe présent ne se rattache pas au sujet : ce n’est pas la pluie qui sort du métro.',
      },
    ],
    aToi: {
      enonce:
        'Corrige : « Après avoir relu le dossier dont il se rappelait mal, la conclusion lui a paru ' +
        'plus claire qu’avant. »',
      indice: 'Deux problèmes : une préposition de trop, et un participe qui ne se rattache pas au bon sujet.',
      reponse:
        '« Après avoir relu le dossier qu’il se rappelait mal, il a trouvé la conclusion plus ' +
        'claire. » — « se rappeler » est direct, donc « qu’il » et non « dont il » ; et ce n’est pas ' +
        'la conclusion qui a relu le dossier : il faut que le sujet de la principale soit celui qui relit.',
    },
    titre: 'Correction syntaxique',
    quoi: 'La construction des phrases : prépositions, pronoms, et ce qui se rattache à quoi.',
    regles: [
      {
        titre: 'Chaque verbe appelle SA préposition',
        texte:
          'se rappeler QUELQUE CHOSE (sans « de ») mais se souvenir DE quelque chose. ' +
          'pallier quelque chose (sans « à »). aider quelqu’un (sans « à » devant la personne). ' +
          'obéir À. remédier À. C’est une liste à connaître : la logique n’y aide pas.',
      },
      {
        titre: 'Le participe présent doit se rattacher au sujet',
        texte:
          '« En sortant du métro, la pluie s’est mise à tomber » est fautif : ce n’est pas la ' +
          'pluie qui sort du métro. Le sujet du participe doit être celui de la phrase.',
      },
      {
        titre: 'Le pronom relatif',
        texte:
          '« qui » est sujet, « que » est complément d’objet, « dont » remplace un groupe ' +
          'introduit par « de », « où » un lieu ou un temps. « L’homme dont je parle » et non ' +
          '« l’homme que je parle ».',
      },
      {
        titre: 'La double négation et le « ne » explétif',
        texte:
          '« Je crains qu’il ne vienne » signifie qu’on craint sa venue : ce « ne » n’est pas une ' +
          'négation. En revanche « il ne vient pas que le lundi » veut dire qu’il vient aussi ' +
          'd’autres jours.',
      },
      {
        titre: 'La comparaison doit être complète',
        texte:
          '« Ce livre est plus intéressant » appelle « que quoi ». Une comparaison tronquée, ou ' +
          'qui compare deux choses non comparables (« le climat de Paris est plus doux que Lyon »), ' +
          'est une faute de construction fréquente.',
      },
    ],
    exemple: {
      enonce: 'Il faut pallier (à ce manque / ce manque) de moyens.',
      etapes: [
        '« Pallier » se construit directement, sans préposition.',
        'On dit « pallier un inconvénient », comme on dirait « corriger un inconvénient ».',
      ],
      reponse: '« Il faut pallier ce manque de moyens. »',
    },
    piege:
      'Se fier à l’usage courant. « Pallier à » s’entend partout et reste fautif : c’est ' +
      'exactement pour cela que le concours le pose.',
  },

  {
    skillId: 'tm.expression.connecteurs_logiques',
    section: 'expression',
    retrouver: [
      { q: 'Quelle est la différence entre opposition et concession ?', r: 'L’opposition met deux faits côte à côte ; la concession admet un fait qui devrait empêcher l’autre — et pourtant.' },
      { q: 'Cite trois connecteurs de conséquence.', r: 'Donc, par conséquent, si bien que, c’est pourquoi, ainsi.' },
      {
        q: 'Comment le mode du verbe aide-t-il ?',
        r: '« Bien que » et « pour que » appellent le subjonctif ; « parce que » et « puisque » l’indicatif. Le mode élimine plusieurs connecteurs d’un coup.',
      },
    ],
    aToi: {
      enonce:
        'Quel lien logique, et quel connecteur ? « Le dossier était incomplet … la commission ' +
        'a rendu son avis dans les délais. »',
      indice: 'Le premier fait devrait empêcher le second. Comment appelle-t-on ce rapport ?',
      reponse:
        'Une concession : « bien que le dossier fût incomplet », « malgré un dossier incomplet », ' +
        'ou « le dossier était incomplet ; néanmoins la commission… ». ' +
        '« Donc » inverserait le sens, « car » aussi.',
    },
    titre: 'Connecteurs logiques',
    quoi: 'Choisir le mot qui dit le bon rapport entre deux propositions.',
    regles: [
      {
        titre: 'Nommer la relation AVANT de lire les propositions',
        texte:
          'On lit les deux propositions, on formule le lien en un mot — cause, conséquence, ' +
          'opposition, concession, condition, but, addition — et seulement ensuite on regarde ' +
          'les connecteurs. Dans l’autre sens, tous « sonnent » possibles.',
      },
      {
        titre: 'Opposition et concession ne sont pas la même chose',
        texte:
          'L’OPPOSITION met deux faits côte à côte : « mais », « en revanche », « alors que ». ' +
          'La CONCESSION admet un fait qui devrait empêcher l’autre, et pourtant : « bien que », ' +
          '« malgré », « pourtant », « néanmoins ». C’est la distinction la plus testée.',
      },
      {
        titre: 'Cause et conséquence se lisent dans le sens de la phrase',
        texte:
          'CAUSE (elle précède l’effet) : car, parce que, puisque, étant donné que, en effet. ' +
          'CONSÉQUENCE (elle suit) : donc, ainsi, par conséquent, si bien que, c’est pourquoi. ' +
          'Se tromper de sens renverse la phrase.',
      },
      {
        titre: 'Les autres relations',
        texte:
          'CONDITION : si, à condition que, pourvu que, à moins que. ' +
          'BUT : afin que, pour que, de peur que. ' +
          'ADDITION : de plus, en outre, par ailleurs. ' +
          'ILLUSTRATION : ainsi, par exemple, notamment.',
      },
      {
        titre: 'Le mode qui suit trahit le connecteur',
        texte:
          '« Bien que » et « pour que » appellent le subjonctif ; « parce que » et « puisque » ' +
          'l’indicatif. Si la phrase donne déjà le verbe, son mode élimine plusieurs connecteurs ' +
          'd’un coup.',
      },
    ],
    exemple: {
      enonce:
        'Les ventes ont progressé de 12 % … le marché s’est contracté sur la même période.',
      etapes: [
        'Premier fait : les ventes montent. Second : le marché baisse.',
        'Le second devrait empêcher le premier, et pourtant les deux sont vrais : c’est une CONCESSION.',
        'On cherche un connecteur de concession, pas de cause ni d’addition.',
      ],
      reponse:
        '« … alors même que le marché s’est contracté » ou « … bien que le marché se soit ' +
        'contracté ». « Car » ou « donc » renverseraient le sens.',
    },
    piege:
      'Choisir au son. Les cinq connecteurs proposés sont tous grammaticalement possibles ; un ' +
      'seul dit le bon rapport.',
  },

  {
    skillId: 'tm.expression.synonymes_et_antonymes',
    section: 'expression',
    retrouver: [
      { q: 'Quel est le leurre le plus efficace de ce type de question ?', r: 'Le mot de sens CONTRAIRE : il appartient au même champ, donc il « sonne » juste.' },
      { q: 'Quel test départage deux candidats proches ?', r: 'Remettre chaque mot dans la phrase et la relire entière. Un seul la laisse intacte.' },
      {
        q: 'Différence entre éminent et imminent ? Entre conjecture et conjoncture ?',
        r: 'Éminent = remarquable, imminent = sur le point d’arriver. Conjecture = hypothèse, conjoncture = situation du moment.',
      },
    ],
    aToi: {
      enonce:
        '« Le rapport ÉLUDE la question du financement. » Par quel mot remplacer « élude » ? ' +
        'Et quel serait son contraire ?',
      indice: 'Le mot ne signifie ni « refuser » ni « ignorer par erreur » : il y a une intention.',
      reponse:
        'Synonyme : « esquive » ou « contourne » — éviter délibérément un sujet. ' +
        'Contraire : « aborde » ou « traite ». Le leurre habituel serait « résout », qui va plus ' +
        'loin qu’aborder.',
    },
    titre: 'Synonymes et antonymes',
    quoi: 'Trouver le mot de même sens — ou de sens contraire — dans le contexte donné.',
    regles: [
      {
        titre: 'Lire la consigne en premier',
        texte:
          'Synonyme ou contraire ? Le mot opposé figure toujours parmi les propositions, et ' +
          'c’est le leurre le plus efficace du sous-test, parce qu’il appartient au même champ ' +
          'de sens et « sonne » juste.',
      },
      {
        titre: 'Le contexte décide de l’acception',
        texte:
          'Un mot a plusieurs sens ; c’est la phrase qui dit lequel. « Une position tranchée » ' +
          'n’a rien à voir avec « une lame tranchée ». Toujours fixer le sens DANS la phrase avant ' +
          'de chercher.',
      },
      {
        titre: 'Le test du remplacement',
        texte:
          'Remettre chaque proposition à la place du mot et relire la phrase entière. Une seule ' +
          'la laisse intacte : les autres changent l’intensité, le registre ou la construction.',
      },
      {
        titre: 'Les faux amis de forme',
        texte:
          'Des mots proches par la forme sans l’être par le sens : éminent / imminent, ' +
          'conjecture / conjoncture, effraction / infraction, prolixe / prolifique, ' +
          'perpétrer / perpétuer. Ce sont des leurres réguliers.',
      },
      {
        titre: 'L’intensité compte',
        texte:
          'Bon, excellent, parfait ne sont pas interchangeables. Entre deux propositions de sens ' +
          'voisin, la bonne est celle dont la FORCE correspond à celle du mot d’origine.',
      },
    ],
    exemple: {
      enonce:
        '« Il n’est pas parvenu à ENRAYER la dynamique négative. » Par quel mot remplacer « enrayer » ?',
      etapes: [
        'Sens dans la phrase : arrêter un mouvement en cours, l’interrompre.',
        'Test du remplacement : « arrêter la dynamique » fonctionne ; « freiner » l’affaiblit sans ' +
          'l’arrêter, « maîtriser » suppose qu’on la contrôle sans forcément l’arrêter.',
        '« Enrayer » signifie stopper net : c’est l’intensité qui départage.',
      ],
      reponse: '« Arrêter ». « Freiner » et « maîtriser » sont trop faibles.',
    },
    piege:
      'Répondre par le contraire quand on demande le synonyme, ou l’inverse. Lire la consigne ' +
      'avant les propositions vaut un point à chaque fois.',
  },

  {
    skillId: 'tm.expression.reformulation',
    section: 'expression',
    retrouver: [
      { q: 'Le critère d’une bonne reformulation ?', r: 'L’équivalence, pas l’élégance. Ni plus, ni moins que l’original.' },
      { q: 'Quelle transformation fautive revient le plus ?', r: 'Le renforcement d’un quantificateur : « certains » devenu « tous », « souvent » devenu « toujours ».' },
      {
        q: '« Si A alors B » peut-il se reformuler en « B donc A » ?',
        r: 'Non, c’est la réciproque. Et « il faut A pour B » ne veut pas dire « A suffit ».',
      },
    ],
    aToi: {
      enonce:
        'Reformule sans trahir : « Sans une préparation régulière, il est difficile d’obtenir un ' +
        'bon score. »',
      indice: 'Repère la modalité (« difficile ») et la condition (« sans »). Ni l’une ni l’autre ne doit durcir.',
      reponse:
        '« Une préparation régulière est presque toujours nécessaire pour obtenir un bon score. » ' +
        'Fausses reformulations : « il est impossible » (difficile ≠ impossible) et ' +
        '« une préparation régulière garantit un bon score » (nécessaire ≠ suffisant).',
    },
    titre: 'Reformulation',
    quoi: 'Choisir la phrase qui dit exactement la même chose, ni plus ni moins.',
    regles: [
      {
        titre: 'Le critère est l’équivalence, pas l’élégance',
        texte:
          'La bonne reformulation dit la même chose. Une phrase plus jolie qui ajoute ou retire ' +
          'une nuance est fausse ; une phrase plate mais exacte est juste.',
      },
      {
        titre: 'Surveiller les quantificateurs',
        texte:
          '« Certains » ne devient pas « tous », « souvent » ne devient pas « toujours », ' +
          '« peut » ne devient pas « doit ». Un renforcement de quantificateur est la ' +
          'transformation fautive la plus fréquente.',
      },
      {
        titre: 'Surveiller les modalités',
        texte:
          'Possible, probable, certain, obligatoire : ce sont quatre degrés différents. ' +
          '« Il est possible que » ne se reformule pas en « il faut que ».',
      },
      {
        titre: 'Le sens des liens logiques doit être conservé',
        texte:
          'Une cause ne devient pas une conséquence, une condition ne devient pas une certitude. ' +
          '« Si A alors B » ne se reformule pas en « B donc A » : c’est la réciproque, et elle ' +
          'ne suit pas.',
      },
      {
        titre: 'Comparer les propositions entre elles',
        texte:
          'Comme pour les phrases à corriger, les cinq candidates ne diffèrent que sur quelques ' +
          'points. Repérer ces points et n’examiner qu’eux — le reste est identique et ne mérite ' +
          'pas d’être relu.',
      },
    ],
    exemple: {
      enonce:
        'Reformuler : « Rares sont les entreprises qui, sans aide publique, franchissent ce cap. »',
      etapes: [
        'Contenu : peu d’entreprises y arrivent seules ; l’aide publique est presque toujours nécessaire.',
        'Une reformulation qui dirait « aucune entreprise n’y arrive sans aide » est trop forte : ' +
          '« rares » n’est pas « aucune ».',
        'Une reformulation qui dirait « l’aide publique garantit le franchissement » inverse le ' +
          'lien : nécessaire n’est pas suffisant.',
      ],
      reponse:
        '« Sans aide publique, peu d’entreprises franchissent ce cap. » L’équivalence est exacte, ' +
        'sans renforcement.',
    },
    piege:
      'Confondre condition NÉCESSAIRE et condition SUFFISANTE. « Il faut A pour B » ne veut pas ' +
      'dire « A suffit à obtenir B ».',
  },

  {
    skillId: 'tm.expression.coherence_et_registre',
    section: 'expression',
    retrouver: [
      { q: 'Cite les trois registres, avec un exemple.', r: 'Familier (bagnole), courant (voiture), soutenu (véhicule).' },
      {
        q: 'Trois marques de familiarité à l’écrit ?',
        r: 'Le « on » mis pour « nous », la disparition du « ne » de négation, l’interrogation sans inversion.',
      },
      {
        q: 'Sur un texte à remettre en ordre, que suit-on ?',
        r: 'Les reprises : un pronom renvoie à un nom déjà cité, « ce dernier » désigne le plus proche.',
      },
    ],
    aToi: {
      enonce:
        'Laquelle détonne ? (a) La commission examinera le dossier. (b) Les délais seront respectés. ' +
        '(c) Le rapport a été transmis. (d) On va voir ce qu’ils décident, faut pas s’emballer.',
      indice: 'Cherche le niveau de langue, pas la faute d’orthographe.',
      reponse:
        '(d). Trois marques de familiarité : « on » pour « nous », « faut » sans « il », et ' +
        '« s’emballer ». Aucune faute de grammaire — c’est le registre qui est incompatible.',
    },
    titre: 'Cohérence et registre',
    quoi: 'Repérer la phrase qui détonne — par le niveau de langue ou par la logique.',
    regles: [
      {
        titre: 'Les trois registres',
        texte:
          'FAMILIER (bagnole, bosser, ça), COURANT (voiture, travailler, cela), ' +
          'SOUTENU (véhicule, œuvrer, ceci). Une phrase qui mélange deux registres est fautive, ' +
          'même si chaque mot pris isolément est correct.',
      },
      {
        titre: 'Les marques de familiarité',
        texte:
          'Le « on » mis pour « nous », la suppression du « ne » de négation, les abréviations, ' +
          'l’interrogation sans inversion (« tu viens ? »). Dans un texte écrit soutenu, chacune ' +
          'est un signal.',
      },
      {
        titre: 'La cohérence d’un enchaînement',
        texte:
          'Sur un texte à trous ou à remettre en ordre, on suit les reprises : un pronom renvoie ' +
          'à un nom déjà cité, un « ce dernier » désigne le plus proche, un connecteur annonce la ' +
          'suite. Ces fils donnent l’ordre sans avoir à comprendre le contenu.',
      },
      {
        titre: 'La progression thématique',
        texte:
          'Une phrase reprend en général l’information de la précédente pour en ajouter une ' +
          'nouvelle. Une phrase qui n’a aucun lien avec ce qui précède est celle qui ne va pas.',
      },
      {
        titre: 'Les répétitions et les lourdeurs',
        texte:
          'Quand deux propositions semblent également correctes, l’une contient une redondance ' +
          '(« monter en haut », « au jour d’aujourd’hui ») ou une construction pesante. ' +
          'La plus sobre est la bonne.',
      },
    ],
    exemple: {
      enonce:
        'Laquelle détonne ? (a) Le conseil a validé la proposition. (b) Les résultats seront ' +
        'communiqués en janvier. (c) Du coup, on a laissé tomber le projet. (d) La procédure ' +
        'a été suspendue.',
      etapes: [
        'Trois phrases sont d’un registre courant à soutenu, dans un contexte professionnel.',
        '(c) accumule trois marques de familiarité : « du coup », « on » pour « nous », ' +
          '« laisser tomber ».',
      ],
      reponse:
        '(c). Aucune faute de grammaire, mais un registre incompatible avec les autres.',
    },
    piege:
      'Chercher une faute d’orthographe. Sur ce type de question il n’y en a pas : ce qui cloche ' +
      'est le niveau de langue ou la logique de l’enchaînement.',
  },
]
