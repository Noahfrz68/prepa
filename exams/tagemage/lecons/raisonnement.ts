import type { Lecon } from './types'

/**
 * Sous-test 3 — Raisonnement et argumentation.
 *
 * Deux natures de questions cohabitent. La déduction formelle obéit à des
 * règles fixes qu'on peut apprendre en une soirée — contraposée, syllogismes —
 * et qui rapportent immédiatement. L'argumentation demande de nommer la faille
 * d'un raisonnement, ce qui s'apprend en connaissant le catalogue des failles :
 * elles sont une douzaine, et elles reviennent toutes.
 */
export const LECONS_RAISONNEMENT: Lecon[] = [
  {
    skillId: 'tm.raisonnement.premisse_et_conclusion',
    section: 'raisonnement',
    retrouver: [
      { q: 'De « si P alors Q », que peut-on tirer ?', r: 'La contraposée seulement : « si non-Q alors non-P ».' },
      {
        q: 'Nomme les deux formes invalides.',
        r: 'La réciproque (Q ⇒ P) et l’inverse (non-P ⇒ non-Q). Les deux figurent toujours parmi les propositions.',
      },
      {
        q: 'Quelle est la négation de « tous les P sont Q » ?',
        r: '« Au moins un P n’est pas Q ». Surtout pas « aucun P n’est Q ».',
      },
    ],
    aToi: {
      enonce:
        'Tous les adhérents ont une carte. Léa a une carte. Que peut-on conclure ?',
      indice: 'Dessine un cercle « adhérents » dans un cercle « porteurs de carte ». Où peut se trouver Léa ?',
      reponse:
        'Rien du tout. Affirmer que Léa est adhérente, c’est la RÉCIPROQUE, et elle est invalide : ' +
        'd’autres personnes que les adhérents peuvent avoir une carte. Si l’énoncé avait dit ' +
        '« Léa n’a pas de carte », on aurait pu conclure qu’elle n’est pas adhérente.',
    },
    titre: 'Déduction : ce qui suit et ce qui ne suit pas',
    quoi: 'Les règles formelles de l’implication et du syllogisme. Aucune interprétation, que de la forme.',
    regles: [
      {
        titre: 'Une implication n’autorise qu’UNE conclusion',
        texte:
          'De « si P alors Q », on ne peut tirer que la CONTRAPOSÉE : « si non-Q alors non-P ». ' +
          'Rien d’autre. C’est la règle la plus rentable du sous-test.',
      },
      {
        titre: 'Les deux formes invalides à reconnaître',
        texte:
          'La RÉCIPROQUE « si Q alors P » retourne l’implication : invalide. ' +
          'L’INVERSE « si non-P alors non-Q » nie sans retourner : invalide aussi. ' +
          'Les deux figurent systématiquement parmi les propositions.',
      },
      {
        titre: 'Le dessin des cercles',
        texte:
          '« Tous les P sont Q » se dessine : un cercle P entièrement dans un cercle Q. ' +
          'Sortir de Q, c’est forcément sortir de P (contraposée). Mais être dans Q ne dit rien : ' +
          'on peut être dans Q sans être dans P.',
      },
      {
        titre: 'Les syllogismes qui marchent',
        texte:
          'Tous les P sont Q + tous les Q sont R → tous les P sont R (transitivité). ' +
          'Tous les P sont Q + aucun R n’est Q → aucun P n’est R. ' +
          'Ce sont les deux formes que le concours utilise le plus.',
      },
      {
        titre: 'Le test du contre-dessin',
        texte:
          '« Nécessairement » veut dire « dans TOUS les dessins possibles ». S’il existe un seul ' +
          'agencement de cercles qui respecte les prémisses et contredit la proposition, elle ne ' +
          'suit pas. Chercher ce contre-dessin va plus vite que démontrer.',
      },
    ],
    exemple: {
      enonce:
        'Tous les membres du club paient une cotisation. Marc ne paie pas de cotisation. ' +
        'Que peut-on conclure ?',
      etapes: [
        'Poser : P = membre du club, Q = paie une cotisation. La prémisse dit P ⇒ Q.',
        'Marc est non-Q.',
        'La contraposée dit non-Q ⇒ non-P.',
      ],
      reponse:
        'Marc n’est pas membre du club. En revanche, si Marc PAYAIT une cotisation, on ne pourrait ' +
        'rien conclure : d’autres personnes que les membres peuvent en payer.',
    },
    piege:
      'La réciproque. « Tous les membres paient » ne veut pas dire « tous ceux qui paient sont ' +
      'membres ». C’est le leurre numéro un, et il paraît naturel.',
    parCoeur: [
      'P ⇒ Q · Contraposée : non-Q ⇒ non-P — VALIDE',
      'Réciproque : Q ⇒ P — INVALIDE · Inverse : non-P ⇒ non-Q — INVALIDE',
      'Négation de « tous les P sont Q » = « au moins un P n’est pas Q » (pas « aucun P n’est Q »)',
      'Négation de « il existe » = « aucun » · Négation de « toujours » = « au moins une fois non »',
    ],
  },

  {
    skillId: 'tm.raisonnement.affaiblir_un_argument',
    section: 'raisonnement',
    retrouver: [
      { q: 'Affaiblir, est-ce contredire la conclusion ?', r: 'Non — c’est attaquer le PAS entre les prémisses et la conclusion.' },
      {
        q: 'Les trois attaques qui marchent presque toujours ?',
        r: 'Une autre cause au phénomène, un échantillon non représentatif, une causalité inversée.',
      },
      {
        q: 'Comment départager deux propositions candidates ?',
        r: 'Le test de l’extrême : supposée vraie à 100 %, laquelle fait tomber l’argument ?',
      },
    ],
    aToi: {
      enonce:
        'Les employés qui déjeunent à la cantine sont moins souvent absents. L’entreprise en conclut ' +
        'que les repas de la cantine améliorent la santé. Qu’est-ce qui affaiblit le plus ?',
      indice: 'Le pas franchi est le même que d’habitude. Cherche qui déjeune à la cantine, et pourquoi.',
      reponse:
        'Que les employés déjà malades ou fatigués rentrent déjeuner chez eux — la causalité est ' +
        'alors inversée : c’est la bonne santé qui mène à la cantine, pas l’inverse. ' +
        'Dire « les repas sont trop salés » ne touche pas le raisonnement.',
    },
    titre: 'Affaiblir un argument',
    quoi: 'Trouver ce qui fait vaciller le raisonnement — pas ce qui contredit sa conclusion.',
    regles: [
      {
        titre: 'Séparer prémisses et conclusion',
        texte:
          '« Donc », « par conséquent », « on peut en déduire » annoncent la conclusion. ' +
          '« Car », « puisque », « en effet » annoncent une prémisse. Le pas entre les deux est ' +
          'ce qu’on attaque.',
      },
      {
        titre: 'Attaquer le PAS, pas la conclusion',
        texte:
          'Dire « la conclusion est fausse » n’affaiblit rien : c’est une opinion opposée. ' +
          'Affaiblir, c’est montrer que les prémisses n’entraînent pas la conclusion — que le ' +
          'lien est rompu.',
      },
      {
        titre: 'Les trois attaques qui marchent presque toujours',
        texte:
          'Proposer une AUTRE CAUSE au phénomène observé. Montrer que l’échantillon n’est pas ' +
          'représentatif. Inverser le sens de la causalité (ce n’est pas A qui cause B, c’est B ' +
          'qui cause A).',
      },
      {
        titre: 'Rester dans le périmètre',
        texte:
          'La bonne proposition parle exactement du même objet, de la même période, du même ' +
          'groupe que l’argument. Un leurre efficace affaiblit une thèse VOISINE — plus large, ' +
          'plus étroite, ou décalée dans le temps.',
      },
      {
        titre: 'Le test de l’extrême',
        texte:
          'Supposer la proposition vraie à 100 % : l’argument tient-il encore ? Si non, c’est ' +
          'bien elle qui l’affaiblit. Ce test départage deux candidates en quelques secondes.',
      },
    ],
    exemple: {
      enonce:
        'Les villes qui ont installé des caméras ont vu leur délinquance baisser de 15 %. ' +
        'Les caméras réduisent donc la délinquance. Qu’est-ce qui affaiblit le plus cet argument ?',
      etapes: [
        'Prémisse : baisse observée là où il y a des caméras. Conclusion : les caméras en sont la cause.',
        'Le pas franchi : de la corrélation à la causalité.',
        'L’attaque la plus forte est une autre cause : ces mêmes villes ont simultanément augmenté ' +
          'leurs effectifs de police.',
      ],
      reponse:
        'Une cause alternative qui explique la baisse sans les caméras. Répondre « la délinquance ' +
        'a augmenté ailleurs » n’affaiblit rien : cela ne dit rien de ces villes-là.',
    },
    piege:
      'Choisir la proposition la plus hostile au sujet. L’intensité du désaccord n’a aucun rapport ' +
      'avec la force logique de l’objection.',
  },

  {
    skillId: 'tm.raisonnement.renforcer_un_argument',
    section: 'raisonnement',
    retrouver: [
      { q: 'Renforcer, c’est quoi exactement ?', r: 'Fermer une objection : écarter ce qui pourrait expliquer le résultat autrement.' },
      {
        q: 'Le renforcement type d’un argument causal ?',
        r: '« Aucun autre changement n’est intervenu pendant la période. »',
      },
      {
        q: 'Pourquoi « beaucoup de gens le pensent » ne renforce-t-il pas ?',
        r: 'Le nombre de personnes convaincues n’est pas une preuve. Un fait vaut mieux qu’une opinion.',
      },
    ],
    aToi: {
      enonce:
        'Une ville a installé des pistes cyclables et le nombre de cyclistes a doublé. Elle en conclut ' +
        'que les pistes ont provoqué cette hausse. Qu’est-ce qui renforce le plus ?',
      indice: 'Quelle objection ferais-tu à cet argument ? Le renforcement est la phrase qui la ferme.',
      reponse:
        'Qu’une ville voisine comparable, sans nouvelles pistes, n’a connu aucune hausse sur la même ' +
        'période. Cela écarte les causes générales — météo, prix du carburant, mode. ' +
        '« Les cyclistes se disent satisfaits » ne renforce presque rien.',
    },
    titre: 'Renforcer un argument',
    quoi: 'Fermer la porte que le raisonnement avait laissée ouverte.',
    regles: [
      {
        titre: 'Renforcer, c’est éliminer une objection',
        texte:
          'On identifie d’abord la faille — comme pour affaiblir — puis on cherche la proposition ' +
          'qui l’écarte. La démarche est la même, l’effet est inverse.',
      },
      {
        titre: 'Écarter les causes alternatives',
        texte:
          '« Aucun autre changement n’est intervenu pendant la période » est le renforcement type ' +
          'd’un argument causal. Il ne prouve rien de nouveau : il ferme les autres explications.',
      },
      {
        titre: 'Confirmer la représentativité',
        texte:
          '« L’échantillon a été tiré au sort dans l’ensemble de la population » renforce toute ' +
          'généralisation, en fermant l’objection de l’échantillon biaisé.',
      },
      {
        titre: 'Répéter la conclusion ne renforce pas',
        texte:
          'Une proposition qui redit la conclusion en d’autres termes n’ajoute rien. C’est le ' +
          'leurre le plus fréquent du type, parce qu’il « sonne » d’accord avec l’argument.',
      },
      {
        titre: 'Un fait nouveau vaut mieux qu’une opinion',
        texte:
          'Une donnée, une expérience, un test contrôlé renforcent. « Beaucoup de gens le pensent » ' +
          'ne renforce pas : le nombre de personnes convaincues n’est pas un argument.',
      },
    ],
    exemple: {
      enonce:
        'Une entreprise a réduit le temps de trajet de ses livreurs et ses ventes ont augmenté. ' +
        'Elle en conclut que la rapidité de livraison stimule les ventes. Qu’est-ce qui renforce ?',
      etapes: [
        'La faille : d’autres facteurs ont pu faire monter les ventes.',
        'Renforcer, c’est écarter ces facteurs.',
        '« Ni les prix, ni la publicité, ni la gamme n’ont changé sur la période » ferme la porte.',
      ],
      reponse:
        'L’absence de tout autre changement. « Les clients disent apprécier la rapidité » est plus ' +
        'faible : c’est une opinion, pas une cause démontrée.',
    },
    piege:
      'Prendre pour un renforcement une proposition simplement compatible avec l’argument. Elle ' +
      'doit fermer une objection, pas seulement ne pas gêner.',
  },

  {
    skillId: 'tm.raisonnement.hypothese_implicite',
    section: 'raisonnement',
    retrouver: [
      { q: 'Qu’est-ce qu’une hypothèse implicite ?', r: 'Le chaînon manquant : ce qu’il faut ajouter aux prémisses pour que la conclusion suive.' },
      {
        q: 'Le test qui tranche ?',
        r: 'La négation. On nie la proposition : si l’argument s’effondre, c’était bien une hypothèse.',
      },
      {
        q: 'Où trouver l’hypothèse en trente secondes ?',
        r: 'Le mot qui apparaît dans la conclusion sans figurer dans les prémisses la désigne presque toujours.',
      },
    ],
    aToi: {
      enonce:
        'Ce logiciel réduit de moitié le temps de saisie. L’entreprise économisera donc de l’argent ' +
        'en l’adoptant. Quelle hypothèse ?',
      indice: 'Quel mot de la conclusion n’apparaît nulle part dans la prémisse ?',
      reponse:
        '« Argent » n’est pas dans la prémisse, qui ne parle que de temps. L’hypothèse est que le ' +
        'temps gagné se convertit en économie — et qu’elle dépasse le coût du logiciel. ' +
        'Test de la négation : si le logiciel coûte plus que le temps gagné, l’argument tombe.',
    },
    titre: 'Hypothèse implicite',
    quoi: 'Ce que l’argument tient pour acquis sans le dire, et sans quoi il s’effondre.',
    regles: [
      {
        titre: 'C’est le chaînon manquant',
        texte:
          'Une hypothèse implicite est ce qu’il FAUT ajouter aux prémisses pour que la conclusion ' +
          'suive. Ni un fait supplémentaire, ni une conséquence : le maillon absent de la chaîne.',
      },
      {
        titre: 'Le test de la négation — décisif',
        texte:
          'On nie la proposition. Si l’argument s’effondre, c’était bien une hypothèse nécessaire. ' +
          'S’il tient encore, ce n’en était pas une. Ce test tranche entre deux candidates en dix secondes.',
      },
      {
        titre: 'Une hypothèse est modeste',
        texte:
          'Elle affirme le minimum nécessaire. Une proposition trop forte — « toujours », « dans ' +
          'tous les cas » — est en général un leurre : l’argument n’a pas besoin de tant.',
      },
      {
        titre: 'Repérer les termes qui changent en route',
        texte:
          'Quand les prémisses parlent de « ventes » et la conclusion de « bénéfices », ' +
          'l’hypothèse implicite est le pont entre les deux : que les ventes se traduisent en ' +
          'bénéfices. Le mot qui apparaît dans la conclusion sans figurer dans les prémisses ' +
          'désigne presque toujours l’hypothèse.',
      },
      {
        titre: 'Hypothèse n’est pas renforcement',
        texte:
          'Un renforcement rend l’argument plus solide ; une hypothèse est indispensable à son ' +
          'existence. Sans l’hypothèse, il n’y a plus d’argument du tout.',
      },
    ],
    exemple: {
      enonce:
        'Cette campagne publicitaire a fait connaître la marque à 2 millions de personnes. ' +
        'Elle sera donc rentable. Sur quelle hypothèse repose ce raisonnement ?',
      etapes: [
        'Prémisse : notoriété acquise. Conclusion : rentabilité.',
        'Le mot « rentable » n’apparaît nulle part dans la prémisse : c’est là qu’est le pont.',
        'Hypothèse candidate : une partie suffisante de ces personnes achètera, et la marge ' +
          'couvrira le coût de la campagne.',
        'Test de la négation : si personne n’achète, l’argument tombe. C’est bien nécessaire.',
      ],
      reponse:
        'Que la notoriété se convertit en achats en quantité suffisante. « La campagne a coûté ' +
        'cher » n’est pas une hypothèse : c’est un fait qui ne fait pas tenir l’argument.',
    },
    piege:
      'Choisir une proposition vraie et utile mais non nécessaire. Le test de la négation est le ' +
      'seul critère : si l’argument survit à la négation, ce n’était pas une hypothèse.',
  },

  {
    skillId: 'tm.raisonnement.identifier_un_sophisme',
    section: 'raisonnement',
    retrouver: [
      { q: 'Quel est le sophisme le plus fréquent du concours ?', r: 'La corrélation prise pour une causalité.' },
      {
        q: 'Qu’est-ce qu’un homme de paille ?',
        r: 'Caricaturer la thèse adverse pour la réfuter plus facilement : ce qu’on réfute n’est pas ce qui était défendu.',
      },
      {
        q: 'Qu’est-ce qu’une pétition de principe ?',
        r: 'Utiliser sa conclusion comme prémisse : l’argument tourne en rond.',
      },
    ],
    aToi: {
      enonce:
        '« Il faut interdire ce médicament : si on l’autorise, on autorisera bientôt n’importe quelle ' +
        'substance, et le système de santé s’effondrera. » Quel défaut ?',
      indice: 'Regarde la chaîne de conséquences. Chaque maillon est-il justifié ?',
      reponse:
        'Une pente glissante : on enchaîne des conséquences de plus en plus graves sans justifier ' +
        'un seul des pas. Rien ne dit qu’autoriser ce médicament entraîne d’autoriser les autres.',
    },
    titre: 'Identifier un sophisme',
    quoi: 'Nommer le défaut de raisonnement. Le catalogue est court et il revient toujours.',
    regles: [
      {
        titre: 'Corrélation prise pour causalité',
        texte:
          'Deux faits varient ensemble, on en conclut que l’un cause l’autre. Le sophisme le plus ' +
          'fréquent du concours. Trois échappatoires existent toujours : une troisième cause, ' +
          'le hasard, ou la causalité inversée.',
      },
      {
        titre: 'Généralisation hâtive',
        texte:
          'Une conclusion générale tirée d’un cas particulier ou d’un échantillon trop petit. ' +
          'Chercher systématiquement sur QUI portait l’observation.',
      },
      {
        titre: 'Faux dilemme',
        texte:
          'Deux options présentées comme les seules possibles alors qu’il en existe d’autres. ' +
          'Se repère aux tournures « soit… soit », « il faut choisir entre ».',
      },
      {
        titre: 'Pente glissante et homme de paille',
        texte:
          'La pente glissante enchaîne des conséquences de plus en plus graves sans justifier ' +
          'chaque pas. L’homme de paille caricature la thèse adverse pour la réfuter plus ' +
          'facilement — la thèse réfutée n’est pas celle qui était défendue.',
      },
      {
        titre: 'Les sophismes d’autorité et de personne',
        texte:
          'Appel à l’autorité : « c’est vrai parce qu’un expert le dit », alors que l’expert n’est ' +
          'pas du domaine. Attaque personnelle : on discrédite celui qui parle au lieu de ce qu’il ' +
          'dit. Appel au nombre : « tout le monde le pense, donc c’est vrai ».',
      },
    ],
    exemple: {
      enonce:
        'Les enfants qui ont beaucoup de livres à la maison réussissent mieux à l’école. ' +
        'Offrir des livres à tous les enfants améliorerait donc les résultats scolaires. ' +
        'Quel est le défaut ?',
      etapes: [
        'Un lien statistique est observé entre deux faits.',
        'La conclusion suppose que le premier CAUSE le second.',
        'Une troisième cause explique très bien les deux : le milieu social, qui apporte à la fois ' +
          'les livres et l’accompagnement scolaire.',
      ],
      reponse:
        'Une corrélation prise pour une causalité. Les livres sont ici un signe du milieu, pas ' +
        'nécessairement un moteur.',
    },
    piege:
      'Répondre en jugeant la conclusion — « c’est faux, les livres aident vraiment ». La question ' +
      'porte sur la FORME du raisonnement, pas sur la vérité de ce qu’il affirme.',
    parCoeur: [
      'Corrélation ≠ causalité · Généralisation hâtive · Faux dilemme',
      'Pente glissante · Homme de paille · Appel à l’autorité · Appel au nombre',
      'Attaque personnelle · Pétition de principe (la conclusion sert de prémisse)',
      'Confusion condition nécessaire / suffisante · Après donc à cause de',
    ],
  },

  {
    skillId: 'tm.raisonnement.raisonnement_par_analogie',
    section: 'raisonnement',
    retrouver: [
      { q: 'Une analogie tient par quoi ?', r: 'Par la STRUCTURE de la relation, jamais par le sujet ou le thème.' },
      {
        q: 'Que fait-on avant de lire les propositions ?',
        r: 'On réduit la situation à une phrase abstraite, sans son contexte.',
      },
      {
        q: 'Comment attaque-t-on une analogie ?',
        r: 'En montrant la différence PERTINENTE — celle qui touche le point sur lequel repose la comparaison.',
      },
    ],
    aToi: {
      enonce:
        'Une entreprise baisse ses prix pour gagner des clients, y parvient, mais ne couvre plus ses ' +
        'coûts et ferme. Quelle structure abstraite, et quel proverbe ?',
      indice: 'Formule la phrase sans parler ni d’entreprise ni d’argent.',
      reponse:
        'Structure : « on atteint son but par un moyen qui détruit ce qu’on voulait préserver ». ' +
        'Le proverbe qui colle est « scier la branche sur laquelle on est assis ». ' +
        '« L’argent ne fait pas le bonheur » parle du même thème et pas de la même structure.',
    },
    titre: 'Raisonnement par analogie',
    quoi: 'Juger si une comparaison tient, ou trouver le proverbe qui illustre une situation.',
    regles: [
      {
        titre: 'Une analogie tient par la STRUCTURE, pas par le sujet',
        texte:
          'Ce qui compte, c’est la relation entre les éléments : « on a sacrifié le court terme ' +
          'au long terme », « on a puni celui qui alertait ». Deux situations très différentes ' +
          'peuvent partager exactement la même structure.',
      },
      {
        titre: 'Formuler la structure en une phrase abstraite',
        texte:
          'Avant de lire les propositions, réduire la situation à une phrase sans son contexte : ' +
          '« quelqu’un obtient l’inverse de ce qu’il cherchait en agissant trop fort ». ' +
          'On cherche ensuite la proposition qui fait la même phrase.',
      },
      {
        titre: 'Attaquer une analogie, c’est montrer la différence pertinente',
        texte:
          'Toute analogie boite quelque part : l’objection valable est celle qui touche le point ' +
          'sur lequel repose la comparaison, pas une différence quelconque entre les deux situations.',
      },
      {
        titre: 'Les questions « le moins bien »',
        texte:
          'Le concours demande souvent quel proverbe illustre le MOINS bien. On teste alors les ' +
          'cinq : quatre partagent la structure, un seul en change. C’est un exercice d’intrus.',
      },
      {
        titre: 'Le sens de la relation',
        texte:
          '« Qui trop embrasse mal étreint » et « il n’y a que le premier pas qui coûte » ne disent ' +
          'pas la même chose du même mouvement. Vérifier que le proverbe va dans le même SENS que ' +
          'la situation, pas seulement qu’il en parle.',
      },
    ],
    exemple: {
      enonce:
        'Une entreprise licencie ses formateurs pour réduire ses coûts ; deux ans plus tard, ' +
        'elle doit payer des consultants bien plus cher. Quel proverbe illustre le mieux ?',
      etapes: [
        'Structure : une économie immédiate produit une dépense plus grande ensuite.',
        'On cherche un proverbe qui dise exactement cela, pas simplement « l’argent ».',
        '« Économie de bouts de chandelle » dit la petite économie ; « qui veut voyager loin ' +
          'ménage sa monture » dit l’usure. Le second colle mieux à la structure temporelle.',
      ],
      reponse:
        'Le proverbe qui oppose un gain immédiat à un coût différé. Ceux qui parlent seulement ' +
        'd’argent, sans cette structure temporelle, sont des leurres.',
    },
    piege:
      'Choisir sur le thème. Un proverbe qui parle d’argent n’illustre pas mieux une histoire ' +
      'd’argent : c’est la structure qui décide.',
  },

  {
    skillId: 'tm.raisonnement.resoudre_un_paradoxe',
    section: 'raisonnement',
    retrouver: [
      { q: 'La bonne réponse conteste-t-elle l’un des deux faits ?', r: 'Jamais. Elle explique comment les deux coexistent.' },
      {
        q: 'Où se cache presque toujours la solution ?',
        r: 'Dans une variable non mentionnée : population, période, définition, ou effet de composition.',
      },
      {
        q: 'Un nombre monte pendant qu’un taux baisse. Comment ?',
        r: 'Si le dénominateur — la population de référence — augmente plus vite que le numérateur.',
      },
    ],
    aToi: {
      enonce:
        'Dans chaque département, le revenu moyen a augmenté. Pourtant le revenu moyen national a ' +
        'baissé. Comment est-ce possible ?',
      indice: 'Les moyennes nationales dépendent aussi du POIDS de chaque département.',
      reponse:
        'Un effet de composition : la population s’est déplacée vers les départements les plus ' +
        'pauvres. Chaque groupe progresse, mais les groupes à bas revenu pèsent désormais plus lourd ' +
        'dans la moyenne. Les deux faits restent vrais en même temps.',
    },
    titre: 'Résoudre un paradoxe',
    quoi: 'Deux faits qui semblent incompatibles : trouver ce qui les réconcilie.',
    regles: [
      {
        titre: 'Nommer les deux faits séparément',
        texte:
          'Écrire A et B, chacun tenu pour vrai. La bonne réponse ne conteste NI l’un NI l’autre : ' +
          'elle explique comment ils coexistent. Toute proposition qui nie l’un des deux est un leurre.',
      },
      {
        titre: 'Chercher la variable cachée',
        texte:
          'Presque tous les paradoxes du concours se résolvent par un facteur non mentionné : ' +
          'une population différente, une période différente, une définition différente, ' +
          'un effet de composition.',
      },
      {
        titre: 'L’effet de composition',
        texte:
          'Chaque sous-groupe peut évoluer dans un sens et l’ensemble dans l’autre, si les poids ' +
          'des groupes changent. C’est la clé de beaucoup d’énoncés statistiques apparemment ' +
          'contradictoires.',
      },
      {
        titre: 'Taux contre effectifs',
        texte:
          'Le nombre d’accidents peut monter pendant que le taux d’accidents baisse, si le ' +
          'nombre de trajets augmente davantage. Vérifier systématiquement de quoi parle chaque ' +
          'chiffre : une proportion ou un compte.',
      },
      {
        titre: 'Le test de compatibilité',
        texte:
          'Après avoir choisi, relire les deux faits en supposant la proposition vraie. Les deux ' +
          'doivent rester vrais. Si l’un devient faux, ce n’était pas la résolution.',
      },
    ],
    exemple: {
      enonce:
        'Depuis dix ans, le nombre d’accidents de vélo a doublé dans la ville, alors que le vélo ' +
        'y est devenu plus sûr. Comment est-ce possible ?',
      etapes: [
        'Fait A : les accidents ont doublé. Fait B : le vélo est plus sûr.',
        'Ni l’un ni l’autre n’est à contester.',
        'Variable cachée : le nombre de cyclistes. S’il a triplé, le TAUX d’accidents a bien baissé ' +
          'pendant que leur NOMBRE montait.',
      ],
      reponse:
        'La pratique du vélo a augmenté plus vite que les accidents. Les deux faits sont vrais ' +
        'en même temps, parce qu’ils ne mesurent pas la même chose.',
    },
    piege:
      'Choisir une proposition qui explique le paradoxe en niant l’un des deux faits (« en réalité ' +
      'le vélo n’est pas plus sûr »). L’énoncé les pose tous les deux comme vrais.',
  },
]
