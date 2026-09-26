/**
 * Raisonnement — résoudre un paradoxe.
 *
 * Le type n'avait aucune question en banque : le plan le taisait, le cours
 * l'enseignait sans exercice. Chaque paradoxe est rédigé avec sa résolution
 * et quatre leurres typés, fidèles à la leçon (exams/tagemage/lecons) :
 *
 *   — « un seul fait » : explique l'un des deux faits, laisse l'autre entier ;
 *   — « nie un fait » : résout en contestant l'un des faits de l'énoncé, ce que
 *     la bonne réponse ne fait jamais ;
 *   — « hors sujet » : vrai et plausible, sans rapport avec la contradiction ;
 *   — « aggrave » : rend la contradiction plus forte au lieu de la dissoudre.
 *
 * La résolution passe presque toujours par une variable non mentionnée :
 * population, période, définition, effet de composition, taux contre effectif.
 */

import { qcmTexte } from './qcm'
import type { Famille } from './types'

const SKILL = 'tm.raisonnement.resoudre_un_paradoxe'

interface Paradoxe {
  faitA: string
  faitB: string
  /** La variable cachée qui réconcilie les deux faits. */
  cle: string
  resolution: string
  unSeulFait: string
  nieUnFait: string
  horsSujet: string
  aggrave: string
}

const MOTIFS = {
  unSeulFait: 'cette proposition rend compte d’un seul des deux faits : l’autre reste inexpliqué',
  nieUnFait: 'elle résout la contradiction en niant l’un des deux faits — or l’énoncé les tient tous deux pour vrais',
  horsSujet: 'vrai peut-être, mais sans rapport avec la contradiction : ni l’un ni l’autre fait n’en est éclairé',
  aggrave: 'loin de réconcilier les deux faits, elle rend leur coexistence encore plus surprenante',
} as const

export const PARADOXES: Paradoxe[] = [
  {
    faitA: 'Depuis dix ans, le nombre d’accidents de vélo augmente chaque année dans cette ville.',
    faitB: 'Pourtant, la pratique du vélo n’y a jamais été aussi sûre.',
    cle: 'taux contre effectif',
    resolution: 'Le nombre de trajets à vélo a été multiplié par quatre sur la période, bien plus que le nombre d’accidents.',
    unSeulFait: 'Les cyclistes circulent davantage aux heures de pointe qu’il y a dix ans.',
    nieUnFait: 'Les statistiques d’accidents de la ville sont peu fiables et surestiment la hausse.',
    horsSujet: 'Le prix moyen d’un vélo a fortement augmenté depuis dix ans.',
    aggrave: 'Le nombre de cyclistes est resté stable sur la période.',
  },
  {
    faitA: 'Dans chacune des régions du pays, le salaire moyen a augmenté l’an dernier.',
    faitB: 'Pourtant, le salaire moyen national a baissé sur la même période.',
    cle: 'effet de composition',
    resolution: 'Beaucoup de salariés se sont installés dans les régions où les salaires sont les plus bas.',
    unSeulFait: 'Les entreprises des régions les plus riches ont accordé des augmentations importantes.',
    nieUnFait: 'Le salaire moyen national est calculé avec une méthode différente, qui le fausse.',
    horsSujet: 'Le coût de la vie a augmenté dans toutes les régions.',
    aggrave: 'La répartition des salariés entre les régions n’a pas changé.',
  },
  {
    faitA: 'Les patients soignés dans cet hôpital réputé ont un taux de décès plus élevé que dans les cliniques voisines.',
    faitB: 'Pourtant, cet hôpital soigne mieux chaque pathologie que les cliniques voisines.',
    cle: 'population différente',
    resolution: 'L’hôpital accueille les cas les plus graves, que les cliniques voisines lui adressent.',
    unSeulFait: 'L’hôpital dispose d’équipements plus modernes que les cliniques voisines.',
    nieUnFait: 'Les taux de décès de l’hôpital sont mal comptabilisés et devraient être plus bas.',
    horsSujet: 'Les cliniques voisines ont des délais d’attente plus courts.',
    aggrave: 'L’hôpital et les cliniques reçoivent exactement les mêmes profils de patients.',
  },
  {
    faitA: 'Les élèves de ce lycée qui suivent des cours particuliers ont de moins bonnes notes que les autres.',
    faitB: 'Pourtant, chaque élève progresse nettement après avoir commencé ces cours.',
    cle: 'population différente',
    resolution: 'Ce sont surtout les élèves en difficulté qui s’inscrivent aux cours particuliers.',
    unSeulFait: 'Les professeurs particuliers sont souvent des étudiants de très bon niveau.',
    nieUnFait: 'Les notes des élèves suivant des cours particuliers ont été mal relevées.',
    horsSujet: 'Les cours particuliers coûtent cher aux familles.',
    aggrave: 'Les élèves inscrits aux cours avaient le même niveau que les autres au départ.',
  },
  {
    faitA: 'Cette ville compte de plus en plus de logements vacants.',
    faitB: 'Pourtant, il y est de plus en plus difficile de trouver un logement.',
    cle: 'définition différente',
    resolution: 'Les logements vacants sont surtout de grands appartements anciens, alors que la demande porte sur de petites surfaces.',
    unSeulFait: 'De nombreux étudiants arrivent chaque année dans la ville.',
    nieUnFait: 'Le recensement des logements vacants compte à tort des logements occupés.',
    horsSujet: 'Les loyers ont augmenté dans toutes les villes du pays.',
    aggrave: 'Les logements vacants correspondent exactement aux logements recherchés.',
  },
  {
    faitA: 'Le taux de chômage de ce pays a baissé cette année.',
    faitB: 'Pourtant, le nombre de personnes sans emploi y a augmenté.',
    cle: 'taux contre effectif',
    resolution: 'La population active a augmenté plus vite que le nombre de personnes sans emploi.',
    unSeulFait: 'De nombreuses entreprises ont recruté au cours de l’année.',
    nieUnFait: 'Le taux de chômage publié par l’institut de statistique est erroné.',
    horsSujet: 'Le salaire minimum a été revalorisé au début de l’année.',
    aggrave: 'La population active est restée exactement la même sur l’année.',
  },
  {
    faitA: 'Ce vaccin protège efficacement contre la maladie.',
    faitB: 'Pourtant, la majorité des malades hospitalisés cet hiver étaient vaccinés.',
    cle: 'population différente',
    resolution: 'La quasi-totalité de la population est vaccinée, si bien que même une faible part de vaccinés malades dépasse le nombre de malades non vaccinés.',
    unSeulFait: 'Le vaccin a été testé sur plusieurs dizaines de milliers de volontaires.',
    nieUnFait: 'Le vaccin n’a en réalité aucune efficacité contre la maladie.',
    horsSujet: 'L’hiver a été particulièrement froid cette année.',
    aggrave: 'Seule une petite minorité de la population est vaccinée.',
  },
  {
    faitA: 'Cette chaîne de magasins a fermé un tiers de ses boutiques en deux ans.',
    faitB: 'Pourtant, son chiffre d’affaires a nettement progressé sur la même période.',
    cle: 'variable non mentionnée',
    resolution: 'La chaîne a développé une boutique en ligne qui réalise désormais la moitié de ses ventes.',
    unSeulFait: 'Les loyers des centres-villes ont fortement augmenté ces dernières années.',
    nieUnFait: 'Le chiffre d’affaires annoncé par la chaîne a été gonflé.',
    horsSujet: 'La chaîne a changé de directeur général l’an dernier.',
    aggrave: 'La chaîne ne vend ses produits que dans ses boutiques physiques.',
  },
  {
    faitA: 'Les habitants de cette région vivent plus longtemps que la moyenne nationale.',
    faitB: 'Pourtant, la région compte proportionnellement plus de décès chaque année que le reste du pays.',
    cle: 'population différente',
    resolution: 'De nombreux retraités viennent s’y installer, si bien que la population y est bien plus âgée qu’ailleurs.',
    unSeulFait: 'Le climat de la région est particulièrement doux.',
    nieUnFait: 'L’espérance de vie de la région est mal calculée et en réalité inférieure à la moyenne.',
    horsSujet: 'La région attire chaque été de nombreux touristes étrangers.',
    aggrave: 'La pyramide des âges de la région est identique à celle du pays.',
  },
  {
    faitA: 'Les ventes de parapluies augmentent les jours de forte chaleur dans cette ville.',
    faitB: 'Pourtant, il n’y pleut presque jamais en été.',
    cle: 'usage différent',
    resolution: 'Les habitants utilisent leur parapluie pour se protéger du soleil.',
    unSeulFait: 'Les commerçants mettent les parapluies en vitrine au début de l’été.',
    nieUnFait: 'Il pleut en réalité fréquemment dans cette ville pendant l’été.',
    horsSujet: 'Les parapluies sont fabriqués principalement à l’étranger.',
    aggrave: 'Les habitants n’utilisent leur parapluie que les jours de pluie.',
  },
  {
    faitA: 'Cette autoroute a été élargie de deux à trois voies pour réduire les embouteillages.',
    faitB: 'Pourtant, les embouteillages y sont aujourd’hui aussi longs qu’avant les travaux.',
    cle: 'effet induit',
    resolution: 'L’élargissement a attiré de nombreux automobilistes qui empruntaient auparavant d’autres itinéraires.',
    unSeulFait: 'Les travaux d’élargissement ont duré plus de deux ans.',
    nieUnFait: 'L’autoroute n’a en réalité jamais été élargie.',
    horsSujet: 'Le prix des péages a augmenté après les travaux.',
    aggrave: 'Le nombre de véhicules empruntant l’autoroute a diminué depuis les travaux.',
  },
  {
    faitA: 'Les films de ce réalisateur reçoivent des critiques de plus en plus mauvaises.',
    faitB: 'Pourtant, chacun de ses films attire plus de spectateurs que le précédent.',
    cle: 'public différent',
    resolution: 'Son public se fie à la notoriété du réalisateur et aux bandes-annonces, pas aux critiques.',
    unSeulFait: 'Les critiques de cinéma sont devenues plus sévères ces dernières années.',
    nieUnFait: 'Les chiffres de fréquentation de ses films ont été surestimés.',
    horsSujet: 'Le prix des places de cinéma a augmenté.',
    aggrave: 'Ses spectateurs choisissent leurs films uniquement d’après les critiques.',
  },
]

export const paradoxe: Famille = {
  skillId: SKILL,
  nom: 'résoudre un paradoxe',
  produire(a) {
    const p = a.choix(PARADOXES)
    const { options, bonneReponse, diagnostics } = qcmTexte(a, p.resolution, [
      [p.unSeulFait, MOTIFS.unSeulFait],
      [p.nieUnFait, MOTIFS.nieUnFait],
      [p.horsSujet, MOTIFS.horsSujet],
      [p.aggrave, MOTIFS.aggrave],
    ])

    return {
      section: 'raisonnement',
      skillId: SKILL,
      typeItem: 'qcm',
      enonce:
        `${p.faitA} ${p.faitB}\n` +
        `Laquelle des propositions suivantes, si elle était vraie, expliquerait le mieux ce constat apparemment contradictoire ?`,
      options,
      bonneReponse,
      diagnostics,
      rappel: `Les deux faits restent vrais : la clé est un ${p.cle}.`,
      explication:
        `1. Nommer les deux faits, tenus tous deux pour vrais : (A) ${p.faitA.replace(/\.$/, '')} ; ` +
        `(B) ${p.faitB.replace(/^Pourtant, /, '').replace(/\.$/, '')}.\n` +
        `2. Chercher la variable cachée qui les rend compatibles — ici, un ${p.cle}.\n` +
        `3. La résolution : « ${p.resolution} » Avec elle, A et B restent vrais en même temps.\n` +
        `Le test de compatibilité élimine les leurres : une proposition qui nie A ou B, ou qui n'explique ` +
        `que l'un des deux, n'est pas une résolution ; celle qui rendrait la coexistence plus surprenante ` +
        `encore va dans le mauvais sens.`,
      difficulte: 3,
    }
  },
}
