import type { Lecon } from './types'

/**
 * Sous-test 2 — Calcul.
 *
 * Le programme s'arrête au collège : rien ici ne dépasse la troisième. Ce qui
 * fait la difficulté, c'est 80 secondes par question et cinq propositions
 * construites autour des erreurs classiques. Les leçons visent donc deux
 * choses : la formule juste, et le raccourci qui la rend applicable en une
 * minute.
 */
export const LECONS_CALCUL: Lecon[] = [
  {
    skillId: 'tm.calcul.pourcentages_et_variations',
    section: 'calcul',
    retrouver: [
      { q: 'Par combien multiplie-t-on pour une baisse de 20 % ?', r: '0,80 — soit 1 − 20/100.' },
      {
        q: 'Un prix monte de 10 % puis baisse de 10 %. Où en est-il ?',
        r: '1,10 × 0,90 = 0,99, soit 1 % en dessous du départ. Jamais au même point.',
      },
      {
        q: 'Un article vaut 90 € après une remise de 25 %. Quel était son prix ?',
        r: '90 ÷ 0,75 = 120 €. On DIVISE par le coefficient pour remonter.',
      },
    ],
    aToi: {
      enonce:
        'Le prix d’un billet baisse de 40 %, puis remonte de 40 %. De combien a-t-il varié au total ?',
      indice: 'Multiplie les deux coefficients, puis retranche 1.',
      reponse:
        '0,60 × 1,40 = 0,84, soit −16 %. Une baisse suivie d’une hausse du même taux fait toujours ' +
        'perdre : la hausse s’applique à un montant plus petit que celui sur lequel la baisse a porté.',
    },
    titre: 'Pourcentages et variations',
    quoi: 'Faire varier une quantité, enchaîner plusieurs variations, et remonter au point de départ.',
    regles: [
      {
        titre: 'Tout passe par le coefficient multiplicateur',
        texte:
          'Une hausse de t % multiplie par 1 + t/100. Une baisse de t % multiplie par 1 − t/100. ' +
          '+20 % → × 1,20. −25 % → × 0,75. C’est la seule chose à retenir : tout le reste en découle.',
      },
      {
        titre: 'Les variations successives se MULTIPLIENT',
        texte:
          'Deux variations à la suite : on multiplie leurs coefficients. +20 % puis −20 % donne ' +
          '1,20 × 0,80 = 0,96, soit −4 % au total — et non 0 %. Additionner deux taux n’est légitime ' +
          'que s’ils portent sur la même base, ce qui n’arrive presque jamais.',
      },
      {
        titre: 'Revenir en arrière, c’est diviser',
        texte:
          'Un article soldé à 60 € après −25 % valait 60 ÷ 0,75 = 80 €. Jamais 60 × 1,25 = 75 € : ' +
          'les 25 % portaient sur 80, pas sur 60. Pour défaire une variation on divise par son coefficient.',
      },
      {
        titre: 'Le pourcentage d’un pourcentage',
        texte:
          '« 30 % des 40 % de femmes cadres » = 0,30 × 0,40 = 12 % de l’ensemble. Deux proportions ' +
          'emboîtées se multiplient, comme deux coefficients.',
      },
      {
        titre: 'Points ou pourcents',
        texte:
          'Passer de 20 % à 25 %, c’est +5 POINTS mais +25 % (car 5/20 = 0,25). Les propositions ' +
          'contiennent toujours les deux nombres ; c’est la question qui dit lequel est demandé.',
      },
    ],
    exemple: {
      enonce: 'Un loyer augmente de 25 %, puis baisse de 20 %. Quelle est la variation globale ?',
      etapes: [
        'Hausse de 25 % → coefficient 1,25. Baisse de 20 % → coefficient 0,80.',
        'Coefficient global : 1,25 × 0,80 = 1,00.',
        'On retranche 1 pour revenir au pourcentage : 1,00 − 1 = 0.',
      ],
      reponse:
        'Le loyer est revenu exactement à son point de départ : 0 % de variation. ' +
        'Ce n’est pas une coïncidence — une hausse de 25 % s’annule par une baisse de 20 %, ' +
        'parce que 1/1,25 = 0,80.',
    },
    piege:
      'Additionner les taux. +25 % puis −20 % ne fait pas +5 %. Dès qu’une seconde variation ' +
      'porte sur un montant déjà modifié, l’addition est fausse.',
    parCoeur: [
      '10 % → × 1,1 ou × 0,9   ·   20 % → × 1,2 ou × 0,8   ·   25 % → × 1,25 ou × 0,75',
      '50 % → × 1,5 ou × 0,5   ·   Doubler = +100 %   ·   Diviser par 2 = −50 %',
      '1/2 = 50 %  ·  1/3 ≈ 33 %  ·  1/4 = 25 %  ·  1/5 = 20 %  ·  1/6 ≈ 17 %  ·  1/8 = 12,5 %',
      '2/3 ≈ 67 %  ·  3/4 = 75 %  ·  1/20 = 5 %  ·  1/25 = 4 %  ·  3/8 = 37,5 %',
    ],
  },

  {
    skillId: 'tm.calcul.proportionnalite_et_ratios',
    section: 'calcul',
    retrouver: [
      {
        q: 'Un rapport de 4 pour 7 découpe le total en combien de parts ?',
        r: '11. On additionne toujours les deux termes du rapport.',
      },
      {
        q: 'Que manque-t-il à un rapport pour donner un effectif ?',
        r: 'Une valeur absolue : un total, un écart chiffré, ou l’un des deux effectifs.',
      },
      {
        q: 'Plus d’ouvriers, moins de jours : proportionnel ou inversement ?',
        r: 'Inversement. Ce qui reste constant est le PRODUIT (ouvriers × jours).',
      },
    ],
    aToi: {
      enonce:
        'Dans un club, le rapport entre juniors et seniors est de 3 pour 7. Il y a 60 seniors de ' +
        'plus que de juniors. Combien de membres compte le club ?',
      indice: 'L’écart de 60 correspond à un nombre entier de parts. Lequel ?',
      reponse:
        'L’écart vaut 7 − 3 = 4 parts, donc 4 parts = 60 et une part = 15. ' +
        'Le club compte 3 + 7 = 10 parts, soit 150 membres (45 juniors, 105 seniors).',
    },
    titre: 'Proportionnalité et ratios',
    quoi: 'Partager une quantité selon un rapport, et passer d’une proportion à un effectif.',
    regles: [
      {
        titre: 'Un rapport se transforme en PARTS',
        texte:
          'Un rapport de 3 pour 5 découpe le total en 3 + 5 = 8 parts égales. Une part vaut ' +
          'total ÷ 8. Le premier groupe en prend 3, le second 5. Toute question de partage se ' +
          'résout par ces trois lignes.',
      },
      {
        titre: 'Un rapport seul ne donne aucun effectif',
        texte:
          '« 3 hommes pour 5 femmes » vaut pour 8 personnes comme pour 800. Il faut TOUJOURS une ' +
          'valeur absolue en plus : un total, un écart chiffré, ou l’un des deux effectifs.',
      },
      {
        titre: 'L’écart aussi se compte en parts',
        texte:
          'Avec un rapport 3 : 5, l’écart entre les deux groupes vaut 5 − 3 = 2 parts. Si l’énoncé ' +
          'dit « 40 femmes de plus », alors 2 parts = 40, une part = 20, et le total fait 8 × 20 = 160.',
      },
      {
        titre: 'Produit en croix',
        texte:
          'a/b = c/d équivaut à a × d = b × c. C’est l’outil de toute proportionnalité : ' +
          '« 7 machines en 3 h, combien en 5 h ? » → 7/3 = x/5 → x = 35/3 ≈ 11,7.',
      },
      {
        titre: 'Proportionnel ou inversement proportionnel',
        texte:
          'Plus d’ouvriers, moins de temps : c’est INVERSEMENT proportionnel, et le produit reste ' +
          'constant (ouvriers × jours). Plus d’ouvriers, plus de production : c’est proportionnel, ' +
          'et c’est le quotient qui reste constant. Se tromper de sens donne un résultat renversé.',
      },
    ],
    exemple: {
      enonce:
        'Une prime de 3 200 € est partagée entre trois personnes selon le rapport 2 : 3 : 3. ' +
        'Que touche la première ?',
      etapes: [
        'Nombre de parts : 2 + 3 + 3 = 8.',
        'Valeur d’une part : 3 200 ÷ 8 = 400 €.',
        'La première en reçoit 2 : 2 × 400 = 800 €.',
      ],
      reponse: '800 €. Contrôle : 800 + 1 200 + 1 200 = 3 200 €.',
    },
    piege:
      'Diviser par l’un des termes du rapport au lieu de leur somme. Avec 2 : 3, on divise par 5, ' +
      'jamais par 2 ni par 3.',
  },

  {
    skillId: 'tm.calcul.equations_du_1er_degre',
    section: 'calcul',
    retrouver: [
      { q: 'Comment se traduit « le triple d’un nombre diminué de 7 » ?', r: '3x − 7. On écrit dans l’ordre de la phrase, sans simplifier d’abord.' },
      {
        q: 'Que devient un terme qui passe de l’autre côté du signe = ?',
        r: 'Il change de signe. Un FACTEUR, lui, devient un diviseur.',
      },
      {
        q: 'Quel contrôle attrape à la fois l’erreur de calcul et l’erreur de traduction ?',
        r: 'Remplacer x par le résultat dans l’énoncé de départ et vérifier que les deux membres tombent égaux.',
      },
    ],
    aToi: {
      enonce:
        'Le quadruple d’un nombre augmenté de 9 est égal au double de ce nombre augmenté de 25. ' +
        'Quel est ce nombre ?',
      indice: 'Écris l’équation, puis regroupe les x d’un côté avant toute division.',
      reponse:
        '4x + 9 = 2x + 25 → 4x − 2x = 25 − 9 → 2x = 16 → x = 8. ' +
        'Contrôle : 4 × 8 + 9 = 41 et 2 × 8 + 25 = 41.',
    },
    titre: 'Équations du premier degré',
    quoi: 'Traduire un énoncé en équation, et isoler l’inconnue sans erreur de signe.',
    regles: [
      {
        titre: 'Traduire mot à mot',
        texte:
          '« de plus que » → +. « de moins que » → −. « fois » → ×. « le double de » → 2x. ' +
          '« est » → =. On écrit dans l’ordre de la phrase, sans chercher à simplifier d’abord.',
      },
      {
        titre: 'Regrouper avant de diviser',
        texte:
          'Les x d’un côté, les nombres de l’autre, et seulement ensuite la division. Faire les ' +
          'deux en même temps est la source de presque toutes les erreurs de signe.',
      },
      {
        titre: 'Ce qui traverse le = change de signe',
        texte:
          '5x + 48 = 6x + 32 → 48 − 32 = 6x − 5x → 16 = x. Un terme qui passe de l’autre côté ' +
          'change de signe ; un facteur qui passe devient un diviseur.',
      },
      {
        titre: 'Vérifier en dix secondes',
        texte:
          'Remplacer x par le résultat dans l’énoncé d’origine, et vérifier que les deux membres ' +
          'tombent égaux. C’est le seul contrôle qui attrape à la fois l’erreur de calcul et ' +
          'l’erreur de traduction.',
      },
      {
        titre: 'Remonter depuis les propositions',
        texte:
          'Sur ce type de question, tester une proposition coûte souvent moins cher que résoudre. ' +
          'Commencer par celle du milieu : si elle est trop grande, il ne reste que deux candidates.',
      },
    ],
    exemple: {
      enonce:
        'Un groupe d’amis se partage une facture de 96 €. Si deux personnes de plus participaient, ' +
        'chacun paierait 4 € de moins. Combien sont-ils ?',
      etapes: [
        'Soit n le nombre d’amis. Chacun paie 96/n.',
        'Avec n + 2 personnes, chacun paie 96/(n + 2), soit 4 € de moins : 96/n − 96/(n + 2) = 4.',
        'Multiplier par n(n + 2) : 96(n + 2) − 96n = 4n(n + 2), soit 192 = 4n² + 8n.',
        'Diviser par 4 : n² + 2n − 48 = 0. Somme des racines −2, produit −48 → 6 et −8.',
        'Un effectif est positif : n = 6.',
      ],
      reponse: '6 amis. Contrôle : 96/6 = 16 €, 96/8 = 12 €, soit 4 € de moins.',
    },
    piege:
      'Répondre à la mauvaise question. L’énoncé demande souvent une quantité dérivée — le total, ' +
      'l’écart, le prix unitaire — et non le x qu’on vient de calculer.',
  },

  {
    skillId: 'tm.calcul.equations_du_2nd_degre',
    section: 'calcul',
    retrouver: [
      { q: 'Dans x² + bx + c = 0, que valent la somme et le produit des racines ?', r: 'Somme = −b, produit = c.' },
      {
        q: 'Le produit des racines est négatif. Que sait-on d’elles ?',
        r: 'Elles sont de signes contraires. S’il est positif, elles ont le même signe, celui de la somme.',
      },
      { q: 'Comment se factorise a² − b² ?', r: '(a + b)(a − b). C’est l’identité la plus rentable du concours.' },
    ],
    aToi: {
      enonce: 'Quelle est la somme des solutions de x² − 11x + 24 = 0 ? Et la plus petite ?',
      indice: 'La somme se lit directement dans le coefficient. Les racines, dans les diviseurs de 24.',
      reponse:
        'Somme = −b = 11, sans aucun calcul. Produit = 24 : deux entiers de somme 11 et de produit 24 ' +
        'sont 3 et 8. La plus petite est 3.',
    },
    titre: 'Équations du second degré',
    quoi: 'Résoudre x² + bx + c = 0 en quelques secondes, sans discriminant.',
    regles: [
      {
        titre: 'Somme et produit : la seule méthode utile ici',
        texte:
          'Pour x² + bx + c = 0, la somme des racines vaut −b et leur produit vaut c. ' +
          'x² − 5x + 6 = 0 : somme 5, produit 6 → les racines sont 2 et 3. ' +
          'Sur ce concours, les racines sont presque toujours entières : cette lecture suffit.',
      },
      {
        titre: 'Le signe du produit dit tout',
        texte:
          'Produit NÉGATIF → les deux racines sont de signes contraires. Produit POSITIF → elles ' +
          'ont le même signe, celui de la somme. Ce réflexe élimine la moitié des candidats avant ' +
          'tout essai.',
      },
      {
        titre: 'Les identités remarquables',
        texte:
          '(a + b)² = a² + 2ab + b² · (a − b)² = a² − 2ab + b² · a² − b² = (a + b)(a − b). ' +
          'La troisième est la plus rentable : elle transforme 51² − 49² en (51 + 49)(51 − 49) = 200.',
      },
      {
        titre: 'Le discriminant, en dernier recours',
        texte:
          'Δ = b² − 4ac, puis x = (−b ± √Δ) / 2a. Δ > 0 : deux racines. Δ = 0 : une seule. ' +
          'Δ < 0 : aucune. À réserver aux cas où somme et produit ne tombent pas juste.',
      },
      {
        titre: 'Factoriser plutôt que développer',
        texte:
          'x² − 7x = 0 se lit x(x − 7) = 0 : les racines sont 0 et 7. Un produit est nul quand ' +
          'l’un de ses facteurs l’est — et cette lecture-là ne demande aucun calcul.',
      },
    ],
    exemple: {
      enonce: 'Quelle est la plus grande solution de x² − 3x − 40 = 0 ?',
      etapes: [
        'Somme des racines = −b = 3. Produit = c = −40.',
        'Produit négatif : les racines sont de signes contraires.',
        'Deux entiers de produit 40 et d’écart 3 : 8 et 5. Avec les signes : 8 et −5.',
        'Vérification : 8 + (−5) = 3 et 8 × (−5) = −40.',
      ],
      reponse: 'La plus grande est 8.',
    },
    piege:
      'Confondre b et la somme. La somme vaut −b : dans x² − 3x − 40, elle vaut +3, pas −3. ' +
      'Et lire « la plus grande » alors qu’on vient de calculer les deux.',
    parCoeur: [
      'Carrés : 11² = 121 · 12² = 144 · 13² = 169 · 14² = 196 · 15² = 225',
      '16² = 256 · 17² = 289 · 18² = 324 · 19² = 361 · 20² = 400 · 25² = 625',
      'Cubes : 2³ = 8 · 3³ = 27 · 4³ = 64 · 5³ = 125 · 6³ = 216 · 7³ = 343 · 10³ = 1 000',
    ],
  },

  {
    skillId: 'tm.calcul.systemes',
    section: 'calcul',
    retrouver: [
      {
        q: 'Deux lignes, comment élimine-t-on une inconnue ?',
        r: 'On multiplie chaque ligne pour égaliser les coefficients de cette inconnue, puis on soustrait.',
      },
      {
        q: 'L’énoncé donne x + y et x − y. Que fait-on ?',
        r: 'On additionne les deux lignes (→ 2x) ou on les soustrait (→ 2y). Immédiat.',
      },
      {
        q: 'Sur quelle ligne vérifie-t-on le résultat ?',
        r: 'Sur celle qui n’a pas servi à la résolution — c’est elle qui attrape les erreurs de report.',
      },
    ],
    aToi: {
      enonce:
        'Deux stylos et trois carnets coûtent 16 €. Quatre stylos et un carnet coûtent 12 €. ' +
        'Combien coûte un carnet ?',
      indice: 'Multiplie la première ligne par 2 pour faire apparaître 4 stylos des deux côtés.',
      reponse:
        '(I) 2s + 3c = 16, (II) 4s + c = 12. (I) × 2 : 4s + 6c = 32. En soustrayant (II) : 5c = 20, ' +
        'donc c = 4 €. Report : 4s = 12 − 4 = 8, donc s = 2 €. Contrôle sur (I) : 4 + 12 = 16 €.',
    },
    titre: 'Systèmes de deux équations',
    quoi: 'Trouver deux inconnues à partir de deux informations qui les mêlent.',
    regles: [
      {
        titre: 'Nommer, puis écrire les deux lignes',
        texte:
          'Une lettre par inconnue, une ligne par phrase de l’énoncé. Tant que les deux lignes ne ' +
          'sont pas écrites l’une sous l’autre, on ne cherche pas à résoudre.',
      },
      {
        titre: 'Élimination : la méthode rapide',
        texte:
          'Multiplier chaque ligne pour que les coefficients d’une inconnue deviennent égaux, ' +
          'puis soustraire. 5c + 4s = 47 et 3c + 7s = 42 : × 7 et × 4 donnent 35c + 28s = 329 et ' +
          '12c + 28s = 168 ; la soustraction laisse 23c = 161, donc c = 7.',
      },
      {
        titre: 'Substitution : quand un coefficient vaut 1',
        texte:
          'Si une ligne s’écrit y = … , on remplace y par cette expression dans l’autre. ' +
          'Plus rapide que l’élimination dans ce cas précis, plus lent sinon.',
      },
      {
        titre: 'Somme et différence',
        texte:
          'Quand l’énoncé donne x + y et x − y, additionner les deux lignes donne 2x, les ' +
          'soustraire donne 2y. Cas fréquent, et immédiat.',
      },
      {
        titre: 'Vérifier sur la ligne qui n’a pas servi',
        texte:
          'On a résolu avec la ligne (I) : on contrôle sur la (II). Une erreur de report se voit ' +
          'immédiatement, et le contrôle prend cinq secondes.',
      },
    ],
    exemple: {
      enonce:
        'Trois cafés et deux croissants coûtent 11 €. Deux cafés et trois croissants coûtent 9 €. ' +
        'Combien coûte un croissant ?',
      etapes: [
        'Poser c le café, r le croissant : (I) 3c + 2r = 11 et (II) 2c + 3r = 9.',
        'Éliminer c : (I) × 2 → 6c + 4r = 22 ; (II) × 3 → 6c + 9r = 27.',
        'Soustraire : 5r = 5, donc r = 1 €.',
        'Reporter dans (I) : 3c = 11 − 2 = 9, donc c = 3 €.',
      ],
      reponse: 'Un croissant coûte 1 €. Contrôle sur (II) : 2 × 3 + 3 × 1 = 9 €.',
    },
    piege:
      'Donner la valeur de l’autre inconnue. On calcule souvent les deux ; la question n’en ' +
      'demande qu’une, et l’autre figure toujours parmi les propositions.',
  },

  {
    skillId: 'tm.calcul.arithmetique_et_divisibilite',
    section: 'calcul',
    retrouver: [
      { q: 'Combien de multiples de 7 entre 1 et 500 ?', r: '⌊500/7⌋ = 71.' },
      {
        q: 'Multiples de 6 mais pas de 4 : que retranche-t-on ?',
        r: 'Les multiples du PPCM (12), jamais les multiples de 4 eux-mêmes.',
      },
      { q: 'Critère de divisibilité par 11 ?', r: 'La somme alternée des chiffres (+ − + −) est un multiple de 11.' },
    ],
    aToi: {
      enonce: 'Combien d’entiers entre 1 et 400 sont divisibles par 5 mais pas par 3 ?',
      indice: 'Compte d’abord les multiples de 5, puis ceux qui sont AUSSI multiples de 3.',
      reponse:
        'Multiples de 5 : ⌊400/5⌋ = 80. Ceux qui sont aussi multiples de 3 sont les multiples de ' +
        'ppcm(5, 3) = 15 : ⌊400/15⌋ = 26. Réponse : 80 − 26 = 54.',
    },
    titre: 'Arithmétique et divisibilité',
    quoi: 'Compter des multiples, décomposer un nombre, reconnaître une divisibilité de tête.',
    regles: [
      {
        titre: 'Compter les multiples',
        texte:
          'Le nombre de multiples de p entre 1 et n est la division entière ⌊n/p⌋. ' +
          'Entre a et b : ⌊b/p⌋ − ⌊(a−1)/p⌋.',
      },
      {
        titre: 'Multiples de p mais PAS de q',
        texte:
          'On compte les multiples de p, puis on retranche les multiples du PPCM de p et q — ' +
          'pas les multiples de q. Seuls les nombres présents dans le premier comptage peuvent en sortir.',
      },
      {
        titre: 'PGCD et PPCM',
        texte:
          'Décomposer les deux nombres en facteurs. Le PGCD prend les facteurs COMMUNS à la plus ' +
          'petite puissance, le PPCM prend TOUS les facteurs à la plus grande. Contrôle imparable : ' +
          'PGCD × PPCM = le produit des deux nombres.',
      },
      {
        titre: 'Nombres premiers utiles',
        texte:
          '2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47. Pour tester si n est premier, ' +
          'il suffit d’essayer les premiers jusqu’à √n : au-delà, un diviseur aurait déjà un complice ' +
          'plus petit.',
      },
      {
        titre: 'Pair, impair, et signes',
        texte:
          'pair + pair = pair · impair + impair = pair · pair × n’importe quoi = pair. ' +
          'Ces règles répondent seules à beaucoup de questions, sans le moindre calcul.',
      },
    ],
    exemple: {
      enonce: 'Combien d’entiers entre 1 et 300 sont divisibles par 6 mais pas par 4 ?',
      etapes: [
        'Multiples de 6 : ⌊300/6⌋ = 50.',
        'Parmi eux, ceux qui sont aussi multiples de 4 sont les multiples de ppcm(6, 4) = 12.',
        'Multiples de 12 : ⌊300/12⌋ = 25.',
        '50 − 25 = 25.',
      ],
      reponse: '25 entiers.',
    },
    piege:
      'Retrancher les 75 multiples de 4 au lieu des 25 multiples de 12. On ne peut retirer que ' +
      'ce qui figurait dans le premier comptage.',
    parCoeur: [
      'Divisible par 2 : dernier chiffre pair.',
      'Par 3 : la somme des chiffres est un multiple de 3.',
      'Par 4 : les deux derniers chiffres forment un multiple de 4.',
      'Par 5 : finit par 0 ou 5.  ·  Par 6 : pair ET divisible par 3.',
      'Par 9 : la somme des chiffres est un multiple de 9.',
      'Par 11 : la somme alternée des chiffres (+ − + −) est un multiple de 11.',
      'Par 25 : les deux derniers chiffres font 00, 25, 50 ou 75.',
    ],
  },

  {
    skillId: 'tm.calcul.geometrie_plane',
    section: 'calcul',
    retrouver: [
      { q: 'Cite trois triplets de Pythagore.', r: '3-4-5, 5-12-13, 8-15-17 (et 7-24-25, 9-40-41, 20-21-29).' },
      { q: 'Somme des angles d’un polygone à n côtés ?', r: '(n − 2) × 180°. Triangle 180°, quadrilatère 360°.' },
      {
        q: 'Quel côté est l’hypoténuse ?',
        r: 'Le plus long, toujours, et celui opposé à l’angle droit.',
      },
    ],
    aToi: {
      enonce:
        'Un triangle rectangle a une hypoténuse de 26 cm et un côté de 10 cm. Que vaut le troisième côté ?',
      indice: 'Cherche un triplet connu avant de poser la racine carrée.',
      reponse:
        '24 cm. C’est le triplet 5-12-13 multiplié par 2. Par le calcul : √(26² − 10²) = √(676 − 100) = √576 = 24.',
    },
    titre: 'Géométrie plane',
    quoi: 'Longueurs, angles et triangles — l’essentiel tient dans Pythagore et Thalès.',
    regles: [
      {
        titre: 'Pythagore',
        texte:
          'Dans un triangle RECTANGLE : hypoténuse² = côté² + côté². L’hypoténuse est toujours le ' +
          'plus long côté, et toujours celui opposé à l’angle droit.',
      },
      {
        titre: 'Les triplets à reconnaître',
        texte:
          '3-4-5, 5-12-13, 8-15-17, 7-24-25, 9-40-41, 20-21-29 — et tous leurs multiples ' +
          '(6-8-10, 9-12-15, 10-24-26…). Les reconnaître dispense de la racine carrée, et le ' +
          'concours les utilise presque toujours.',
      },
      {
        titre: 'Thalès',
        texte:
          'Deux droites parallèles coupent deux sécantes en découpant des segments proportionnels. ' +
          'Concrètement : deux triangles emboîtés partageant un angle ont leurs côtés dans le même rapport.',
      },
      {
        titre: 'Angles',
        texte:
          'La somme des angles d’un triangle fait 180°, celle d’un quadrilatère 360°. ' +
          'Un polygone à n côtés : (n − 2) × 180°. Un triangle isocèle a deux angles égaux, ' +
          'un équilatéral trois angles de 60°.',
      },
      {
        titre: 'Le cercle',
        texte:
          'Périmètre 2πr, aire πr². Avec π ≈ 3,14. Un angle inscrit dans un demi-cercle est droit — ' +
          'utile quand un énoncé parle d’un triangle appuyé sur un diamètre.',
      },
    ],
    exemple: {
      enonce:
        'Une échelle de 13 m est appuyée contre un mur, son pied à 5 m du mur. ' +
        'À quelle hauteur touche-t-elle le mur ?',
      etapes: [
        'Le mur, le sol et l’échelle forment un triangle rectangle ; l’échelle est l’hypoténuse.',
        'Reconnaître le triplet 5-12-13.',
        'Sinon : h² = 13² − 5² = 169 − 25 = 144, donc h = 12.',
      ],
      reponse: '12 mètres.',
    },
    piege:
      'Appliquer Pythagore à un triangle qui n’est pas rectangle, ou prendre pour hypoténuse un ' +
      'côté de l’angle droit. L’hypoténuse est toujours la plus longue.',
  },

  {
    skillId: 'tm.calcul.aires_et_volumes',
    section: 'calcul',
    retrouver: [
      {
        q: 'On double toutes les longueurs d’une figure. Que devient l’aire ? Le volume ?',
        r: 'L’aire est multipliée par 4 (k²), le volume par 8 (k³).',
      },
      { q: 'Volume d’un cône de base B et de hauteur h ?', r: '(B × h) / 3. Même formule pour une pyramide.' },
      { q: 'Combien de cm² dans 1 m² ?', r: '10 000. Le facteur 100 est élevé au carré.' },
    ],
    aToi: {
      enonce:
        'On réduit de 10 % chaque arête d’un cube. De quel pourcentage son volume diminue-t-il ?',
      indice: 'Un volume suit le CUBE du facteur appliqué aux longueurs.',
      reponse:
        'Facteur 0,90 sur les longueurs, donc 0,90³ = 0,729 sur le volume : il perd 27,1 %. ' +
        'Répondre −10 % ou −30 % est l’erreur attendue.',
    },
    titre: 'Aires et volumes',
    quoi: 'Calculer une surface ou un volume, et savoir comment ils réagissent à un agrandissement.',
    regles: [
      {
        titre: 'Les aires',
        texte:
          'Rectangle : L × l. Triangle : (base × hauteur) / 2. Parallélogramme : base × hauteur. ' +
          'Trapèze : (grande base + petite base) × hauteur / 2. Disque : πr².',
      },
      {
        titre: 'Les volumes',
        texte:
          'Pavé : L × l × h. Cube : c³. Cylindre : πr² × h. Cône et pyramide : (aire de base × h) / 3. ' +
          'Sphère : (4/3)πr³.',
      },
      {
        titre: 'La règle du facteur k — la plus rentable',
        texte:
          'Si toutes les longueurs sont multipliées par k, les AIRES sont multipliées par k² et les ' +
          'VOLUMES par k³. Doubler les côtés d’un carré quadruple son aire ; doubler l’arête d’un ' +
          'cube multiplie son volume par 8.',
      },
      {
        titre: 'Une contrainte, une inconnue',
        texte:
          'Quand l’énoncé lie deux dimensions (« la longueur vaut 3 fois la largeur »), on exprime ' +
          'tout avec la même lettre. Le problème devient une équation à une inconnue.',
      },
      {
        titre: 'Les unités',
        texte:
          '1 m = 100 cm, mais 1 m² = 10 000 cm² et 1 m³ = 1 000 000 cm³. Le facteur de conversion ' +
          'est élevé au carré pour les aires, au cube pour les volumes. 1 L = 1 dm³.',
      },
    ],
    exemple: {
      enonce:
        'On augmente de 20 % le rayon d’un disque. De combien augmente son aire ?',
      etapes: [
        'Le rayon est multiplié par 1,20.',
        'Une aire suit le carré du facteur : 1,20² = 1,44.',
        'L’aire est donc multipliée par 1,44, soit +44 %.',
      ],
      reponse: '+44 %. Répondre +20 % ou +40 % est l’erreur attendue.',
    },
    piege:
      'Appliquer le facteur tel quel à l’aire. +20 % sur les longueurs, ce n’est jamais +20 % sur ' +
      'la surface.',
  },

  {
    skillId: 'tm.calcul.moyennes_et_medianes',
    section: 'calcul',
    retrouver: [
      { q: 'Par quoi repasse-t-on toujours pour manipuler une moyenne ?', r: 'Le TOTAL : total = moyenne × effectif. Seuls les totaux s’additionnent.' },
      {
        q: 'Deux groupes de 20 et 30 personnes, moyennes 12 et 14. Moyenne d’ensemble ?',
        r: '(20 × 12 + 30 × 14) / 50 = 13,2. Pas 13 : les effectifs diffèrent.',
      },
      {
        q: 'Une valeur extrême déplace-t-elle la moyenne ou la médiane ?',
        r: 'La moyenne. La médiane, qui ne compte que des positions, y résiste.',
      },
    ],
    aToi: {
      enonce:
        'Un joueur a 18 de moyenne sur 4 matchs. Après un 5ᵉ match, sa moyenne tombe à 16. ' +
        'Combien a-t-il marqué au 5ᵉ ?',
      indice: 'Compare les deux TOTAUX, pas les deux moyennes.',
      reponse:
        'Avant : 4 × 18 = 72. Après : 5 × 16 = 80. Le 5ᵉ match vaut 80 − 72 = 8 points. ' +
        'Contrôle : c’est bien en dessous de 18, la moyenne a baissé.',
    },
    titre: 'Moyennes et médianes',
    quoi: 'Manipuler des moyennes sans jamais les additionner entre elles.',
    regles: [
      {
        titre: 'Toujours repasser par le total',
        texte:
          'Moyenne = total ÷ effectif, donc total = moyenne × effectif. Les totaux s’additionnent, ' +
          'les moyennes non. Toute question de moyenne se résout en revenant aux totaux.',
      },
      {
        titre: 'La moyenne pondérée',
        texte:
          'Deux groupes de 20 et 30 personnes, de moyennes 12 et 14 : la moyenne d’ensemble vaut ' +
          '(20 × 12 + 30 × 14) / 50 = 13,2. Ce n’est 13 que si les deux groupes ont le même effectif.',
      },
      {
        titre: 'Médiane, moyenne, mode',
        texte:
          'La médiane coupe l’effectif en deux (autant au-dessus qu’en dessous) ; la moyenne est ' +
          'le total partagé ; le mode est la valeur la plus fréquente. Une valeur extrême déplace ' +
          'la moyenne et laisse la médiane intacte.',
      },
      {
        titre: 'Ajouter une valeur',
        texte:
          'Nouvelle moyenne = (ancien total + valeur ajoutée) / (effectif + 1). Pour trouver la ' +
          'valeur ajoutée : nouveau total − ancien total.',
      },
      {
        titre: 'Le contrôle de bon sens',
        texte:
          'Une moyenne d’ensemble tombe toujours ENTRE les deux moyennes partielles, et penche du ' +
          'côté du groupe le plus nombreux. Un résultat hors de cet intervalle est faux.',
      },
    ],
    exemple: {
      enonce:
        'Une classe de 25 élèves a 11 de moyenne. Les 10 filles ont 13. Quelle est la moyenne des garçons ?',
      etapes: [
        'Total de la classe : 25 × 11 = 275.',
        'Total des filles : 10 × 13 = 130.',
        'Total des garçons : 275 − 130 = 145, pour 15 garçons.',
        'Moyenne : 145 ÷ 15 ≈ 9,67.',
      ],
      reponse: 'Environ 9,67. Contrôle : c’est bien en dessous de 11, comme attendu.',
    },
    piege:
      'Faire la moyenne des moyennes. (13 + x) / 2 = 11 donnerait 9, ce qui est faux dès que les ' +
      'effectifs diffèrent.',
  },

  {
    skillId: 'tm.calcul.probabilites',
    section: 'calcul',
    retrouver: [
      { q: '« ET » puis « OU » : on multiplie ou on additionne ?', r: 'ET → on multiplie. OU (événements incompatibles) → on additionne.' },
      {
        q: 'Sans remise, qu’est-ce qui change au second tirage ?',
        r: 'Le numérateur ET le dénominateur baissent tous les deux d’une unité.',
      },
      { q: 'Comment calcule-t-on « au moins un » ?', r: '1 − P(aucun). C’est presque toujours le chemin court.' },
    ],
    aToi: {
      enonce:
        'Un sac contient 3 jetons verts et 5 jetons noirs. On en tire deux sans remise. ' +
        'Quelle est la probabilité d’obtenir au moins un vert ?',
      indice: 'Passe par le contraire : « aucun vert » signifie deux noirs.',
      reponse:
        'P(deux noirs) = 5/8 × 4/7 = 20/56 = 5/14. Donc P(au moins un vert) = 1 − 5/14 = 9/14. ' +
        'Le calcul direct aurait demandé trois cas.',
    },
    titre: 'Probabilités',
    quoi: 'Compter les cas favorables sur les cas possibles, et enchaîner correctement deux tirages.',
    regles: [
      {
        titre: 'La définition',
        texte:
          'P = cas favorables / cas possibles. Une probabilité est toujours entre 0 et 1 : un ' +
          'résultat supérieur à 1 signale une erreur, sans qu’il soit besoin de chercher où.',
      },
      {
        titre: 'ET on multiplie, OU on additionne',
        texte:
          'Deux événements qui doivent tous les deux se produire : on multiplie. Deux événements ' +
          'dont l’un ou l’autre suffit, et qui ne peuvent pas arriver ensemble : on additionne.',
      },
      {
        titre: 'Avec ou sans remise',
        texte:
          'Avec remise, les probabilités ne changent pas d’un tirage à l’autre. SANS remise, le ' +
          'numérateur ET le dénominateur baissent : 4 rouges sur 10, puis 3 sur 9.',
      },
      {
        titre: 'L’événement contraire',
        texte:
          'P(au moins un) = 1 − P(aucun). C’est presque toujours le chemin court : « au moins une ' +
          'boule rouge » se calcule en passant par « que des bleues ».',
      },
      {
        titre: 'Probabilités conditionnelles',
        texte:
          'P(A sachant B) = P(A et B) / P(B). Concrètement : on se restreint au groupe B, et on ' +
          'compte la proportion de A dedans.',
      },
    ],
    exemple: {
      enonce:
        'Une urne contient 4 boules rouges et 6 bleues. On en tire deux sans remise. ' +
        'Quelle est la probabilité d’avoir au moins une rouge ?',
      etapes: [
        'Passer par le contraire : « aucune rouge » = deux bleues.',
        'P(deux bleues) = 6/10 × 5/9 = 30/90 = 1/3.',
        'P(au moins une rouge) = 1 − 1/3 = 2/3.',
      ],
      reponse: '2/3. Calculer directement demanderait trois cas ; le contraire n’en demande qu’un.',
    },
    piege:
      'Oublier que le dénominateur baisse aussi sans remise. 4/10 × 3/10 est faux : c’est ' +
      '4/10 × 3/9.',
  },

  {
    skillId: 'tm.calcul.denombrement',
    section: 'calcul',
    retrouver: [
      { q: 'La seule question à se poser avant de compter ?', r: 'Changer l’ordre change-t-il le résultat ?' },
      {
        q: 'Combien de façons de choisir 3 personnes parmi 8, sans hiérarchie ?',
        r: '(8 × 7 × 6) / (3 × 2 × 1) = 56.',
      },
      {
        q: 'Podium, commission, code à 4 chiffres : lequel autorise les répétitions ?',
        r: 'Le code — c’est n^k. Le podium ordonne sans répéter, la commission ne fait ni l’un ni l’autre.',
      },
    ],
    aToi: {
      enonce:
        'Un jury de 7 personnes doit désigner un président, un secrétaire et un trésorier, ' +
        'tous différents. Combien de bureaux possibles ?',
      indice: 'Les trois rôles sont distincts : l’ordre compte-t-il ?',
      reponse:
        'Oui, les rôles sont distincts : 7 × 6 × 5 = 210. Si les trois places avaient été ' +
        'interchangeables, il aurait fallu diviser par 3! = 6, et on aurait trouvé 35.',
    },
    titre: 'Dénombrement',
    quoi: 'Compter des possibilités, en sachant si l’ordre compte ou non.',
    regles: [
      {
        titre: 'La seule question à se poser',
        texte:
          'Changer l’ordre change-t-il le résultat ? Podium, classement, code, « président et ' +
          'trésorier » → OUI, l’ordre compte. Commission, équipe, groupe, poignée de main, ' +
          'main de cartes → NON.',
      },
      {
        titre: 'Quand l’ordre compte (arrangements)',
        texte:
          'On remplit les places une par une : n × (n−1) × (n−2) … autant de facteurs que de places. ' +
          '3 places parmi 10 : 10 × 9 × 8 = 720.',
      },
      {
        titre: 'Quand l’ordre ne compte pas (combinaisons)',
        texte:
          'On fait le même produit, puis on divise par k! — le nombre de façons d’ordonner les k ' +
          'élus. 3 parmi 10 : (10 × 9 × 8) / (3 × 2 × 1) = 120.',
      },
      {
        titre: 'Avec répétition',
        texte:
          'Si le même élément peut resservir (un code à 4 chiffres, un tirage avec remise), c’est ' +
          'n^k : 10⁴ = 10 000 codes possibles.',
      },
      {
        titre: 'Le principe multiplicatif',
        texte:
          'Des choix successifs indépendants se multiplient : 3 entrées, 4 plats, 2 desserts font ' +
          '3 × 4 × 2 = 24 menus.',
      },
    ],
    exemple: {
      enonce: 'Dans un groupe de 8 personnes, chacune serre la main de toutes les autres. Combien de poignées de main ?',
      etapes: [
        'Une poignée de main lie deux personnes, et l’ordre n’y change rien : c’est une combinaison.',
        '2 parmi 8 : (8 × 7) / (2 × 1) = 28.',
      ],
      reponse: '28 poignées de main. Répondre 56, c’est avoir compté chaque poignée deux fois.',
    },
    piege:
      'Compter deux fois le même groupe. Si le résultat semble trop grand d’un facteur 2 ou 6, ' +
      'c’est la division par k! qui manque.',
    parCoeur: [
      'Factorielles : 3! = 6 · 4! = 24 · 5! = 120 · 6! = 720',
      'Combinaisons courantes : 2 parmi 5 = 10 · 2 parmi 6 = 15 · 2 parmi 10 = 45 · 3 parmi 6 = 20',
    ],
  },

  {
    skillId: 'tm.calcul.vitesses_debits_et_melanges',
    section: 'calcul',
    retrouver: [
      { q: 'Définition d’une vitesse moyenne ?', r: 'Distance TOTALE ÷ temps TOTAL. Jamais la moyenne des vitesses.' },
      {
        q: 'Deux robinets remplissent en 3 h et 6 h. Que fait-on ?',
        r: 'On additionne les débits : 1/3 + 1/6 = 1/2 de bassin par heure, donc 2 h.',
      },
      {
        q: 'Quel contrôle élimine des propositions sans calcul sur un travail conjoint ?',
        r: 'À deux, c’est plus rapide que le plus rapide seul. Tout ce qui est au-dessus est faux.',
      },
    ],
    aToi: {
      enonce:
        'Un train parcourt 120 km à 60 km/h, puis 120 km à 120 km/h. Quelle est sa vitesse moyenne ?',
      indice: 'Additionne les distances, additionne les temps, puis divise.',
      reponse:
        'Temps : 2 h puis 1 h, soit 3 h pour 240 km → 80 km/h. Et non 90, la moyenne des deux vitesses. ' +
        'La formule directe donne 2 × 60 × 120 / 180 = 80.',
    },
    titre: 'Vitesses, débits et mélanges',
    quoi: 'Tout ce qui se cumule par unité de temps — et qui ne se moyenne jamais directement.',
    regles: [
      {
        titre: 'La relation de base',
        texte:
          'distance = vitesse × temps. Donc temps = distance / vitesse et vitesse = distance / temps. ' +
          'On écrit celle des trois dont on a besoin, jamais les trois.',
      },
      {
        titre: 'La vitesse moyenne est un quotient, pas une moyenne',
        texte:
          'Vitesse moyenne = distance TOTALE / temps TOTAL. Sur un aller-retour à v₁ puis v₂, ' +
          'elle vaut 2v₁v₂ / (v₁ + v₂), et jamais (v₁ + v₂)/2 — parce qu’on passe plus de temps ' +
          'à l’allure lente.',
      },
      {
        titre: 'Travail conjoint : additionner les DÉBITS',
        texte:
          'Une pompe en 4 h remplit 1/4 de bassin par heure. Deux pompes en 4 h et 6 h : ' +
          '1/4 + 1/6 = 5/12 par heure, donc 12/5 = 2,4 h à elles deux. Les durées ne s’additionnent pas.',
      },
      {
        titre: 'Le contrôle immédiat',
        texte:
          'À deux, c’est toujours plus rapide que le plus rapide tout seul. Toute proposition ' +
          'supérieure à la plus petite durée est fausse d’office — souvent trois sur cinq.',
      },
      {
        titre: 'Mélanges',
        texte:
          'On raisonne sur la QUANTITÉ de produit pur, pas sur les pourcentages. 3 L à 20 % et ' +
          '2 L à 45 % : 0,6 L + 0,9 L = 1,5 L de pur dans 5 L, soit 30 %.',
      },
    ],
    exemple: {
      enonce:
        'Un cycliste monte un col à 10 km/h et le redescend par la même route à 30 km/h. ' +
        'Quelle est sa vitesse moyenne ?',
      etapes: [
        'Poser une distance commode, par exemple 30 km à l’aller.',
        'Temps de montée : 30/10 = 3 h. Temps de descente : 30/30 = 1 h.',
        'Total : 60 km en 4 h.',
        'Vitesse moyenne : 60/4 = 15 km/h.',
      ],
      reponse:
        '15 km/h, et non 20. La formule directe donne le même résultat : ' +
        '2 × 10 × 30 / (10 + 30) = 600/40 = 15.',
    },
    piege:
      'Faire la moyenne des deux vitesses. Elle ne serait juste que si l’on passait le même TEMPS ' +
      'à chaque allure ; ici c’est la DISTANCE qui est la même.',
  },

  {
    skillId: 'tm.calcul.suites_et_progressions',
    section: 'calcul',
    retrouver: [
      { q: 'Formule du nᵉ terme d’une suite arithmétique ?', r: 'u₁ + (n − 1) × r. Le « n − 1 » est le piège.' },
      { q: 'Somme de termes régulièrement espacés ?', r: '(premier + dernier) ÷ 2 × nombre de termes.' },
      {
        q: 'Combien de termes de 12 à 96 avec un pas de 6 ?',
        r: '(96 − 12)/6 + 1 = 15. Le « + 1 » compte le premier terme.',
      },
    ],
    aToi: {
      enonce: 'Quelle est la somme des multiples de 3 compris entre 1 et 60 ?',
      indice: 'Trouve d’abord combien il y en a, puis applique la formule de la somme.',
      reponse:
        'Termes de 3 à 60, pas de 3 : (60 − 3)/3 + 1 = 20 termes. ' +
        'Somme = (3 + 60)/2 × 20 = 31,5 × 20 = 630.',
    },
    titre: 'Suites et progressions',
    quoi: 'Trouver un terme lointain ou la somme d’une suite, sans écrire tous les termes.',
    regles: [
      {
        titre: 'Suite arithmétique : on AJOUTE toujours la même chose',
        texte:
          'uₙ = u₁ + (n − 1) × r. Le « n − 1 » est le point qui coûte des points : du 1ᵉʳ au 10ᵉ ' +
          'terme il y a 9 pas, pas 10.',
      },
      {
        titre: 'Sa somme',
        texte:
          'Somme = (premier + dernier) / 2 × nombre de termes. Autrement dit la moyenne des ' +
          'extrêmes, multipliée par l’effectif. 1 + 2 + … + 100 = (1 + 100)/2 × 100 = 5 050.',
      },
      {
        titre: 'Suite géométrique : on MULTIPLIE toujours par la même chose',
        texte:
          'uₙ = u₁ × q^(n−1). Une population qui augmente de 5 % par an suit une géométrique de ' +
          'raison 1,05 — c’est le même objet que les variations en pourcentage.',
      },
      {
        titre: 'Compter les termes',
        texte:
          'De a à b avec un pas de r, il y a (b − a)/r + 1 termes. Le « + 1 » compte le premier, ' +
          'et son oubli est l’erreur classique du dénombrement d’intervalle.',
      },
      {
        titre: 'Reconnaître laquelle',
        texte:
          'On écrit les écarts sous la suite. Constants → arithmétique. Non constants mais de ' +
          'rapport constant → géométrique. Ni l’un ni l’autre → la règle porte sur autre chose ' +
          '(voir la leçon de logique sur les suites numériques).',
      },
    ],
    exemple: {
      enonce: 'Quelle est la somme de tous les entiers pairs compris entre 1 et 100 ?',
      etapes: [
        'Les termes vont de 2 à 100, avec un pas de 2.',
        'Nombre de termes : (100 − 2)/2 + 1 = 50.',
        'Somme : (2 + 100)/2 × 50 = 51 × 50 = 2 550.',
      ],
      reponse: '2 550. Écrire les 50 termes aurait pris deux minutes ; la formule en prend dix secondes.',
    },
    piege:
      'Oublier le « − 1 » du terme général ou le « + 1 » du comptage. Les deux se vérifient en ' +
      'testant la formule sur les trois premiers termes.',
  },
]
