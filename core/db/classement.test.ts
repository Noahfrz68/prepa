import { describe, expect, it } from 'vitest'
import { classerItem, prefixeCommun, type ItemAClasser } from './classement'

const item = (p: Partial<ItemAClasser> & { section: string; enonce: string }): ItemAClasser => ({
  options: [],
  explication: null,
  ...p,
})

const court = (s: string) => s.replace(/^tm\.[a-z_]+\./, '')

describe('classement — calcul', () => {
  // Deux bugs réels, attrapés sur les annales : « anniversaire » et « salaire »
  // contiennent « aire », et rangeaient un partage et une proportionnalité
  // parmi les questions de surface.
  it('ne prend pas « anniversaire » pour une question d’aire', () => {
    const s = classerItem(
      item({
        section: 'calcul',
        enonce:
          'Un groupe d’étudiants décide d’acheter un cadeau d’anniversaire à leur ami. Cela leur coûtera 44 euros chacun. Combien sont-ils ?',
      }),
    )
    expect(court(s ?? '')).not.toBe('aires_et_volumes')
  })

  it('reconnaît les familles usuelles', () => {
    const cas: Array<[string, string]> = [
      ['Combien y a-t-il de multiples de 9 entre −308 et 148 ?', 'arithmetique_et_divisibilite'],
      ['Quel est le taux d’intérêt annuel de ce placement ?', 'pourcentages_et_variations'],
      ['Quelle est la surface de ce rectangle en cm² ?', 'aires_et_volumes'],
      ['La moyenne de la classe est de 12. Que vaut la moyenne des filles ?', 'moyennes_et_medianes'],
      ['La photocopieuse imprime vingt-quatre pages par minute. Combien de temps ?', 'vitesses_debits_et_melanges'],
    ]
    for (const [enonce, attendu] of cas) {
      expect(court(classerItem(item({ section: 'calcul', enonce })) ?? ''), enonce).toBe(attendu)
    }
  })

  it('laisse sans sous-compétence un calcul qui n’appartient à aucune famille', () => {
    expect(classerItem(item({ section: 'calcul', enonce: 'Que vaut 18 ÷ 0.02 ?' }))).toBeNull()
  })
})

describe('classement — logique', () => {
  // L'énoncé d'une question à figure ne dit rien : « Figure — Logique,
  // question 12 ». Tout se joue ailleurs.
  it('reconnaît une matrice de figures à ses propositions dessinées', () => {
    const s = classerItem(
      item({
        section: 'logique',
        enonce: 'Figure — Logique, question 11',
        options: ['', '', '', '', ''],
        explication: 'La première lettre de chaque nombre face à face avec alternance.',
      }),
    )
    expect(court(s ?? '')).toBe('matrices_de_figures')
  })

  it('sépare séries de lettres et séries de nombres par l’explication', () => {
    const lettres = classerItem(
      item({
        section: 'logique',
        enonce: 'Figure — Logique, question 1',
        options: ['MIF', 'ABJ', 'NBC', 'NOG', 'KDS'],
        explication: 'Verticalement : les deuxièmes lettres de chaque mot se suivent.',
      }),
    )
    const nombres = classerItem(
      item({
        section: 'logique',
        enonce: 'Figure — Logique, question 5',
        options: ['64', '49', '21', '512', '27'],
        explication: 'Verticalement : tous les nombres sont des cubes.',
      }),
    )
    expect(court(lettres ?? '')).toBe('suites_alphanumeriques')
    expect(court(nombres ?? '')).toBe('suites_numeriques')
  })
})

describe('classement — expression', () => {
  // Le type se lit dans la FORME des propositions, pas dans la consigne, qui
  // est le plus souvent muette.
  it('reconnaît une question de lexique à ses propositions courtes', () => {
    const s = classerItem(
      item({
        section: 'expression',
        enonce: 'Il n’est pas parvenu à enrayer la dynamique négative.',
        options: ['arrêter', 'entraver', 'bloquer', 'freiner', 'maîtriser'],
      }),
    )
    expect(court(s ?? '')).toBe('synonymes_et_antonymes')
  })

  it('reconnaît une phrase à corriger à ses propositions longues', () => {
    const phrase = 'Tu ne vas pas le croire, je t’écris dans l’avion entre Moscou et Leningrad, et je pense à toi.'
    const s = classerItem(
      item({
        section: 'expression',
        enonce: 'Choisissez la formulation correcte.',
        options: [
          phrase,
          phrase.replace('vas pas', 'va pas'),
          'Tu me croiras pas, je t’écris depuis l’avion entre Moscou et Leningrad, et je pense à toi.',
          phrase.replace('croire', 'croires'),
          phrase.replace('pense', 'penses'),
        ],
      }),
    )
    expect(court(s ?? '')).toBe('orthographe')
  })

  it('reconnaît un texte à trous par ses propositions à barres obliques', () => {
    const s = classerItem(
      item({
        section: 'expression',
        enonce: 'Le CAC 40 (...) ce mardi après avoir (...) lundi.',
        options: ['Après / progresse', 'Pour / baisse', 'Avant d’ / plafonne', 'Après / stagne', 'Du fait d’ / augmente'],
      }),
    )
    expect(court(s ?? '')).toBe('connecteurs_logiques')
  })
})

describe('classement — raisonnement', () => {
  it('distingue les types par la question posée', () => {
    const cas: Array<[string, string]> = [
      ['Les Hongrois insomniaques sont statisticiens. Que peut-on en déduire ?', 'premisse_et_conclusion'],
      ['Le sport de masse nourrit l’élite. Quelle proposition contredit le plus ce texte ?', 'affaiblir_un_argument'],
      ['On paie toute sa vie sa dette. Quel proverbe illustre le moins bien cette situation ?', 'raisonnement_par_analogie'],
      ['Sur quelle hypothèse implicite ce raisonnement repose-t-il ?', 'hypothese_implicite'],
    ]
    for (const [enonce, attendu] of cas) {
      expect(court(classerItem(item({ section: 'raisonnement', enonce })) ?? ''), enonce).toBe(attendu)
    }
  })
})

describe('classement — conditions minimales', () => {
  it('reconnaît le piège de signe dans l’explication, avant le thème', () => {
    const s = classerItem(
      item({
        section: 'conditions_minimales',
        enonce: 'a est un entier positif. Que vaut a ?',
        explication: 'La résolution de la première équation donne deux solutions : a = 7 et a = −7.',
      }),
    )
    expect(court(s ?? '')).toBe('pieges_de_signe_et_cas_particuliers')
  })

  it('ne prend pas « salaire » pour une question de géométrie', () => {
    const s = classerItem(
      item({
        section: 'conditions_minimales',
        enonce: 'Le salaire des employés est proportionnel à leur ancienneté. Qui est le mieux payé ?',
      }),
    )
    expect(court(s ?? '')).toBe('cm_proportionnalite_et_ratios')
  })

  it('réserve la suffisance aux combinaisons demandées en bloc', () => {
    expect(
      court(classerItem(item({ section: 'conditions_minimales', enonce: 'Quelle est la valeur de x+y ?' })) ?? ''),
    ).toBe('suffisance_vs_resolution')
    expect(
      court(
        classerItem(
          item({
            section: 'conditions_minimales',
            enonce: 'On considère trois entiers consécutifs. Que vaut la somme de ces entiers ?',
          }),
        ) ?? '',
      ),
    ).toBe('cm_arithmetique_et_divisibilite')
  })
})

describe('classement — compréhension', () => {
  it('reconnaît une question de contenu comme du détail explicite', () => {
    const s = classerItem(
      item({
        section: 'comprehension',
        enonce: 'Quelle place accorde la communauté philosophique à Hannah Arendt ?',
      }),
    )
    expect(court(s ?? '')).toBe('detail_explicite')
  })

  // Le type le plus rare du sous-test, et celui qui manquait entièrement : sept
  // questions de posture tombaient en détail explicite faute de le distinguer.
  it('sépare le jugement de l’auteur du fait qu’il rapporte', () => {
    const posture = [
      "Quelle position l'auteur adopte-t-il sur la condamnation du dopage ?",
      "Quelle attitude l'auteur recommande-t-il face aux cartes ?",
      "Que reproche l'auteur à l'asymétrie du principe de précaution ?",
      "Quelle critique l'auteur adresse-t-il à la première conception de l'œuvre ?",
    ]
    for (const enonce of posture) {
      expect(court(classerItem(item({ section: 'comprehension', enonce })) ?? ''), enonce).toBe(
        'ton_et_intention_de_l_auteur',
      )
    }

    // « Pourquoi l'auteur juge-t-il… » appelle une raison écrite dans le texte :
    // c'est du détail, pas une posture.
    expect(
      court(
        classerItem(
          item({
            section: 'comprehension',
            enonce: "Pourquoi l'auteur juge-t-il les prolongations de durée dépourvues d'effet ?",
          }),
        ) ?? '',
      ),
    ).toBe('detail_explicite')
  })

  it('laisse sans sous-compétence un énoncé à compléter', () => {
    expect(
      classerItem(item({ section: 'comprehension', enonce: 'De manière générale, cet article critique :' })),
    ).toBeNull()
  })
})

describe('prefixeCommun', () => {
  it('mesure le début partagé par toutes les propositions', () => {
    expect(prefixeCommun(['abcdef', 'abcdez', 'abcd'])).toBe(4)
    expect(prefixeCommun(['abc', 'xyz'])).toBe(0)
    expect(prefixeCommun(['seule'])).toBe(0)
  })
})
