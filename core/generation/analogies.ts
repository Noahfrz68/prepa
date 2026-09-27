/**
 * Raisonnement — raisonnement par analogie.
 *
 * Deux questions en banque, jamais visées par le plan. La tâche : reconnaître,
 * sous un autre sujet, la même STRUCTURE d'argument. Le corpus est rédigé ;
 * chaque argument porte un parallèle exact et quatre leurres typés :
 *
 *   — « même sujet » : reprend le thème, pas la structure — le leurre le plus
 *     attirant, parce qu'on juge au contenu ;
 *   — « réciproque » : inverse le sens de la règle ;
 *   — « valide » / « invalide » : change la validité (l'argument d'origine est
 *     fautif et le leurre ne l'est pas, ou l'inverse) ;
 *   — « autre forme » : une autre figure de raisonnement.
 */

import { qcmTexte } from './qcm'
import type { Famille } from './types'

interface Analogie {
  argument: string
  /** Ce qui fait la structure, dit en une ligne. */
  structure: string
  parallele: string
  memeSujet: string
  reciproque: string
  autreValidite: string
  autreForme: string
}

const MOTIFS = {
  memeSujet: 'même sujet, mais pas la même structure : c’est le contenu qui ressemble, pas le raisonnement',
  reciproque: 'la règle y est prise à l’envers : c’est la réciproque, un autre raisonnement',
  autreValidite: 'la structure diffère sur le point décisif : l’un des deux raisonnements est valide, l’autre non',
  autreForme: 'une autre figure de raisonnement, sans lien de structure avec l’argument',
} as const

export const ANALOGIES: Analogie[] = [
  {
    argument: 'Tous les musées de la ville sont gratuits le dimanche. Le Musée des Beaux-Arts est un musée de la ville. Il est donc gratuit le dimanche.',
    structure: 'tous les A sont B ; X est un A ; donc X est B (déduction valide)',
    parallele: 'Tous les salariés de l’entreprise ont droit à une mutuelle. Léa est salariée de l’entreprise. Elle a donc droit à une mutuelle.',
    memeSujet: 'Le Musée des Beaux-Arts est très fréquenté le dimanche. Les musées gratuits attirent donc davantage de visiteurs.',
    reciproque: 'Tous les musées de la ville sont gratuits le dimanche. Ce lieu est gratuit le dimanche. C’est donc un musée de la ville.',
    autreValidite: 'Certains salariés de l’entreprise ont une mutuelle. Léa est salariée de l’entreprise. Elle a donc une mutuelle.',
    autreForme: 'Si Léa obtient sa prime, elle partira en vacances. Elle n’est pas partie. Elle n’a donc pas obtenu sa prime.',
  },
  {
    argument: 'S’il gèle cette nuit, la route sera glissante demain. La route est glissante ce matin. Il a donc gelé cette nuit.',
    structure: 'si A alors B ; B ; donc A (affirmation du conséquent, fautive)',
    parallele: 'Si le moteur est en panne, la voiture ne démarre pas. La voiture ne démarre pas. Le moteur est donc en panne.',
    memeSujet: 'Il a gelé cette nuit, et la route n’est pourtant pas glissante : le sel a été répandu à temps.',
    reciproque: 'La route n’est glissante que s’il a gelé. Il a gelé cette nuit. La route est donc glissante.',
    autreValidite: 'Si le moteur est en panne, la voiture ne démarre pas. Le moteur est en panne. La voiture ne démarre donc pas.',
    autreForme: 'Tous les hivers de la décennie ont été doux. L’hiver prochain sera donc doux.',
  },
  {
    argument: 'Les trois derniers films de ce réalisateur ont été des succès. Son prochain film sera donc un succès.',
    structure: 'plusieurs cas passés vont dans un sens ; donc le prochain cas ira dans ce sens (généralisation inductive)',
    parallele: 'Les quatre derniers menus de ce restaurant ont plu aux clients. Le prochain leur plaira donc.',
    memeSujet: 'Le prochain film de ce réalisateur sortira en décembre, comme les trois précédents.',
    reciproque: 'Le prochain film de ce réalisateur sera un succès. Ses films précédents l’ont donc été aussi.',
    autreValidite: 'Tous les films de ce réalisateur sont produits par ce studio. Son prochain film sera donc produit par ce studio.',
    autreForme: 'Ce réalisateur est célèbre. Ce qu’il dit du cinéma est donc vrai.',
  },
  {
    argument: 'Ce médicament a soulagé mon voisin. Il soulagera donc tous ceux qui souffrent du même mal.',
    structure: 'un seul cas ; donc tous les cas (généralisation hâtive)',
    parallele: 'Cette méthode de révision a réussi à ma sœur. Elle réussira donc à tous les étudiants.',
    memeSujet: 'Ce médicament a été autorisé après trois ans d’essais cliniques sur des milliers de patients.',
    reciproque: 'Tous ceux qui souffrent de ce mal sont soulagés par ce médicament. Mon voisin l’a donc été.',
    autreValidite: 'Cette méthode a réussi à tous les étudiants de la promotion. Elle a donc réussi à ma sœur, qui en fait partie.',
    autreForme: 'Si ma sœur révise, elle réussira. Elle a réussi. Elle a donc révisé.',
  },
  {
    argument: 'Pour être admis, il faut avoir la moyenne. Paul n’a pas la moyenne. Il ne sera donc pas admis.',
    structure: 'A est nécessaire à B ; non A ; donc non B (valide)',
    parallele: 'Pour voter, il faut être inscrit sur les listes. Marie n’est pas inscrite. Elle ne pourra donc pas voter.',
    memeSujet: 'Paul a la moyenne, mais il n’a pas été admis : les places étaient limitées.',
    reciproque: 'Pour être admis, il faut avoir la moyenne. Paul a la moyenne. Il sera donc admis.',
    autreValidite: 'Pour voter, il faut être inscrit. Marie est inscrite. Elle votera donc.',
    autreForme: 'La plupart des admis avaient la moyenne. Paul a la moyenne. Il sera donc probablement admis.',
  },
  {
    argument: 'Ceux qui lisent beaucoup ont un vocabulaire riche. Élise a un vocabulaire riche. Elle lit donc beaucoup.',
    structure: 'tous les A sont B ; X est B ; donc X est A (conclusion fautive)',
    parallele: 'Les oiseaux ont des ailes. Cet animal a des ailes. C’est donc un oiseau.',
    memeSujet: 'Élise lit beaucoup, pourtant son vocabulaire reste pauvre : elle lit toujours les mêmes livres.',
    reciproque: 'Ceux qui lisent beaucoup ont un vocabulaire riche. Élise lit beaucoup. Elle a donc un vocabulaire riche.',
    autreValidite: 'Les oiseaux ont des ailes. Cet animal n’a pas d’ailes. Ce n’est donc pas un oiseau.',
    autreForme: 'Élise a un vocabulaire riche. Tous ses amis en ont donc un aussi.',
  },
  {
    argument: 'Cette entreprise a augmenté ses prix et ses ventes ont baissé. La hausse des prix a donc fait fuir les clients.',
    structure: 'A puis B ; donc A cause B (causalité tirée d’une succession)',
    parallele: 'La commune a installé des ralentisseurs et les accidents ont diminué. Les ralentisseurs ont donc fait baisser les accidents.',
    memeSujet: 'Cette entreprise a augmenté ses prix parce que ses matières premières coûtaient plus cher.',
    reciproque: 'Les ventes de cette entreprise ont baissé. Elle a donc dû augmenter ses prix pour compenser.',
    autreValidite: 'Cette entreprise a augmenté ses prix. Ses prix sont donc plus élevés qu’avant.',
    autreForme: 'Toutes les entreprises du secteur ont augmenté leurs prix. Celle-ci l’a donc fait aussi.',
  },
  {
    argument: 'Ou bien on réduit les dépenses, ou bien on augmente les impôts. On ne réduira pas les dépenses. On augmentera donc les impôts.',
    structure: 'A ou B ; non A ; donc B (disjonction)',
    parallele: 'Ou bien le train est en retard, ou bien je me suis trompé d’heure. Le train n’est pas en retard. Je me suis donc trompé d’heure.',
    memeSujet: 'Augmenter les impôts réduit le pouvoir d’achat, ce qui freine la consommation.',
    reciproque: 'Ou bien on réduit les dépenses, ou bien on augmente les impôts. On augmentera les impôts. On ne réduira donc pas les dépenses.',
    autreValidite: 'On réduira les dépenses et on augmentera les impôts. On augmentera donc les impôts.',
    autreForme: 'Si on augmente les impôts, la croissance ralentira. La croissance a ralenti. On a donc augmenté les impôts.',
  },
]

export const analogie: Famille = {
  skillId: 'tm.raisonnement.raisonnement_par_analogie',
  nom: 'même structure',
  produire(a) {
    const x = a.choix(ANALOGIES)
    const { options, bonneReponse, diagnostics } = qcmTexte(a, x.parallele, [
      [x.memeSujet, MOTIFS.memeSujet],
      [x.reciproque, MOTIFS.reciproque],
      [x.autreValidite, MOTIFS.autreValidite],
      [x.autreForme, MOTIFS.autreForme],
    ])
    return {
      section: 'raisonnement',
      skillId: analogie.skillId,
      typeItem: 'qcm',
      enonce: `${x.argument}\nLequel des raisonnements suivants a la même structure que celui-ci ?`,
      options,
      bonneReponse,
      diagnostics,
      rappel: `Structure : ${x.structure}.`,
      explication:
        `1. Oublier le sujet, et réduire l’argument à sa forme : ${x.structure}.\n` +
        `2. Chercher la proposition qui a exactement cette forme, sur un autre sujet : « ${x.parallele} »\n` +
        `3. Le leurre le plus attirant reprend le même thème : c’est le contenu qui ressemble, pas le raisonnement. ` +
        `Les autres prennent la règle à l’envers, changent sa validité ou suivent une autre figure.\n` +
        `Si l’argument d’origine est fautif, le bon parallèle doit l’être de la même façon.`,
      difficulte: 3,
    }
  },
}
