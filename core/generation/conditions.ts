/**
 * Sous-test 4 — Conditions minimales.
 *
 * La question n'est jamais « combien ça fait » mais « peut-on répondre ». Un
 * générateur qui tirerait la lettre au hasard serait donc faux par construction :
 * il faut que la suffisance de chaque information soit une propriété du
 * problème, pas une étiquette collée dessus.
 *
 * D'où le schéma commun à tous les moules : chacun fournit six faits dont le
 * statut est connu — deux qui suffisent seuls, deux qui ne suffisent qu'ensemble,
 * deux qui ne suffisent jamais. Les cinq réponses possibles sont alors des
 * combinaisons, et la lettre se déduit au lieu d'être choisie.
 *
 *   A = [suffisant, insuffisant]      D = [suffisant, suffisant]
 *   B = [insuffisant, suffisant]      E = [insuffisant, insuffisant]
 *   C = [partiel, partiel]
 */

import { de, euros, nombre, pgcd, pluriel, type Alea } from './alea'
import type { Famille, Lettre, QuestionGeneree } from './types'

const S = 'conditions_minimales' as const

const PRENOMS = ['Sarah', 'Karim', 'Élodie', 'Marc', 'Nadia', 'Julien', 'Rachel', 'Bilal']

/** Les six faits d'un moule, avec leur statut connu par construction. */
interface Moule {
  question: string
  /** Suffit à elle seule. */
  suffisant1: string
  suffisant2: string
  /** Ne suffit pas seule, mais le couple des deux suffit. */
  partiel1: string
  partiel2: string
  /** Ne suffit pas, même accompagnée de l'autre inutile. */
  inutile1: string
  inutile2: string
  /**
   * Pourquoi chaque fait a le statut qu'il a.
   *
   * Sans ces cinq phrases, la correction ne peut dire que « (1) suffit » — ce
   * qui est la réponse, pas une explication. Or dans ce sous-test la réponse
   * EST le raisonnement : savoir que la lettre est C n'apprend rien, savoir
   * pourquoi un périmètre seul laisse une infinité de rectangles s'applique à
   * la question suivante.
   */
  carS1: string
  carS2: string
  /** Ce qui manque quand la partielle est seule. */
  manqueP1: string
  manqueP2: string
  /** Ce que leur réunion apporte. */
  ensemble: string
  /** Ce qu'il faut retenir, indépendamment de la lettre tirée. */
  lecon: string
}

const RAISONS: Record<Lettre, string> = {
  A: "l'information (1) suffit à elle seule ; l'information (2) n'apporte rien qui permette de conclure",
  B: "l'information (2) suffit à elle seule ; l'information (1) n'apporte rien qui permette de conclure",
  C: 'aucune des deux ne suffit isolément, mais leur réunion détermine la réponse',
  D: 'chacune des deux informations suffit, prise séparément',
  E: 'même réunies, les deux informations laissent plusieurs réponses possibles',
}

/**
 * Ce que vaut un fait « inutile », dans tous les moules.
 *
 * Ils sont tous de la même espèce — un encadrement, une inégalité, une borne —
 * et c'est précisément ce qui les rend inutiles : ils rétrécissent le champ des
 * possibles sans jamais le réduire à un seul cas.
 */
const CAR_INUTILE =
  'c’est une borne, pas une valeur : elle restreint le champ des possibles sans le réduire à un seul cas'

/**
 * Assemble une question à partir d'un moule et de la lettre visée.
 *
 * La lettre n'est pas une décoration : elle dicte quels faits sont retenus, et
 * la justification est écrite à partir du statut réel de chacun.
 */
function depuisMoule(m: Moule, cible: Lettre, skillId: string, difficulte: 1 | 2 | 3 | 4 | 5): QuestionGeneree {
  type Fait = { texte: string; verdict: string; suffit: boolean }

  const S1: Fait = { texte: m.suffisant1, verdict: m.carS1, suffit: true }
  const S2: Fait = { texte: m.suffisant2, verdict: m.carS2, suffit: true }
  const P1: Fait = { texte: m.partiel1, verdict: m.manqueP1, suffit: false }
  const P2: Fait = { texte: m.partiel2, verdict: m.manqueP2, suffit: false }
  const I1: Fait = { texte: m.inutile1, verdict: CAR_INUTILE, suffit: false }
  const I2: Fait = { texte: m.inutile2, verdict: CAR_INUTILE, suffit: false }

  const paires: Record<Lettre, [Fait, Fait]> = {
    A: [S1, I1],
    B: [I1, S2],
    C: [P1, P2],
    D: [S1, S2],
    E: [I1, I2],
  }

  const [f1, f2] = paires[cible]

  const reunion =
    cible === 'C'
      ? `4. Les deux ensemble : ${m.ensemble}. La réponse est donc déterminée — mais il a fallu les deux.`
      : cible === 'E'
        ? `4. Les deux ensemble : deux bornes réunies restent deux bornes. Plusieurs valeurs continuent ` +
          `de satisfaire l'énoncé, la question reste sans réponse unique.`
        : `4. On n'a pas besoin d'aller plus loin : dès qu'une information suffit seule, ` +
          `on ne teste plus la réunion.`

  const rappels: Record<Lettre, string> = {
    A: `(1) suffit seule, (2) est une borne. → A`,
    B: `(2) suffit seule, (1) est une borne. → B`,
    C: `Ni l'une ni l'autre seule, mais ensemble oui. → C`,
    D: `Chacune suffit de son côté. → D`,
    E: `Deux bornes : même réunies, elles ne concluent pas. → E`,
  }

  return {
    section: S,
    skillId,
    typeItem: 'conditions_minimales',
    enonce: m.question,
    options: [],
    info1: f1.texte,
    info2: f2.texte,
    bonneReponse: cible,
    rappel: rappels[cible],
    explication:
      `1. La question n'est pas « combien ça fait » mais « peut-on répondre ». ` +
      `On ne calcule rien : on teste chaque information séparément, puis leur réunion.\n` +
      `2. Information (1) seule — « ${f1.texte} » : ` +
      `${f1.suffit ? 'elle SUFFIT' : 'elle NE SUFFIT PAS'}, ${f1.verdict}.\n` +
      `3. Information (2) seule — « ${f2.texte} » : ` +
      `${f2.suffit ? 'elle SUFFIT' : 'elle NE SUFFIT PAS'}, ${f2.verdict}.\n` +
      `${reunion}\n` +
      `Réponse ${cible} : ${RAISONS[cible]}.\n` +
      `À retenir : ${m.lecon}`,
    difficulte,
  }
}

/* ------------------------------------------------- équations et systèmes -- */

function mouleAges(a: Alea): Moule {
  const enfant = a.entier(6, 16)
  const facteur = a.entier(2, 4)
  const parent = enfant * facteur
  const [p, e] = a.melanger(PRENOMS).slice(0, 2)
  const dans = a.entier(3, 10)

  return {
    question: `Quel est l'âge ${de(p)} ?`,
    suffisant1: `Dans ${pluriel(dans, 'an')}, ${p} aura ${pluriel(parent + dans, 'an')}.`,
    suffisant2: `${p} a ${facteur} fois l'âge de son enfant ${e}, et la somme de leurs âges vaut ${pluriel(parent + enfant, 'an')}.`,
    partiel1: `${p} a ${facteur} fois l'âge de son enfant ${e}.`,
    partiel2: `${e} a ${pluriel(enfant, 'an')}.`,
    inutile1: `${p} a plus de ${pluriel(a.entier(2, Math.max(3, enfant - 1)), 'an')}.`,
    inutile2: `L'écart d'âge entre ${p} et ${e} est inférieur à ${pluriel(a.entier(60, 90), 'an')}.`,
    carS1: `un âge futur se ramène à l'âge actuel en retranchant le nombre d'années : ` +
      `${nombre(parent + dans)} − ${nombre(dans)} = ${nombre(parent)}`,
    carS2: `un rapport ET une somme forment un système de deux équations à deux inconnues, ` +
      `qui se résout : ${facteur}e + e = ${nombre(parent + enfant)}, donc e = ${nombre(enfant)} et ${de(p)} = ${nombre(parent)}`,
    manqueP1: `un rapport ne fixe aucun des deux âges — ${facteur} fois 10 ans, ${facteur} fois 30 ans, ` +
      `tous conviennent tant qu'aucune valeur absolue n'est donnée`,
    manqueP2: `l'âge de ${e} ne dit rien de celui de ${p} tant qu'on ignore le lien entre les deux`,
    ensemble: `le rapport devient calculable dès qu'un des deux âges est chiffré — ` +
      `${facteur} × ${nombre(enfant)} = ${nombre(parent)}`,
    lecon: `un rapport entre deux âges ne fixe aucun des deux. Il faut une valeur absolue quelque part — ` +
      `un âge donné, une somme, un écart chiffré.`,
  }
}

/* --------------------------------------------------------- géométrie -- */

function mouleRectangle(a: Alea): Moule {
  const largeur = a.entier(4, 25)
  const k = a.entier(2, 4)
  const longueur = largeur * k
  const perimetre = 2 * (largeur + longueur)

  return {
    question: `Quelle est l'aire d'un rectangle ?`,
    suffisant1: `Sa longueur mesure ${nombre(longueur)} cm et sa largeur ${nombre(largeur)} cm.`,
    suffisant2: `Son périmètre vaut ${nombre(perimetre)} cm et sa longueur vaut ${k} fois sa largeur.`,
    partiel1: `Son périmètre vaut ${nombre(perimetre)} cm.`,
    partiel2: `Sa longueur vaut ${k} fois sa largeur.`,
    inutile1: `Son périmètre dépasse ${nombre(a.entier(4, perimetre - 2))} cm.`,
    inutile2: `Sa longueur dépasse ${nombre(a.entier(1, Math.max(2, largeur - 1)))} cm.`,
    carS1: `les deux côtés sont donnés, l'aire s'en déduit directement : ` +
      `${nombre(longueur)} × ${nombre(largeur)} = ${nombre(longueur * largeur)} cm²`,
    carS2: `le périmètre et le rapport forment un système : 2(l + ${k}l) = ${nombre(perimetre)} donne ` +
      `l = ${nombre(largeur)} et L = ${nombre(longueur)}`,
    manqueP1: `un même périmètre se partage entre une infinité de rectangles — ` +
      `${nombre(largeur)} × ${nombre(longueur)} et ${nombre(largeur + 1)} × ${nombre(longueur - 1)} ont le même contour ` +
      `et pas la même aire`,
    manqueP2: `un rapport de forme ne fixe aucune dimension : le rectangle peut être grand ou petit`,
    ensemble: `le rapport ramène le périmètre à une seule inconnue, et l'équation se résout`,
    lecon: `un périmètre laisse une infinité de rectangles : il faut une seconde relation entre les deux côtés.`,
  }
}

/* ------------------------------------------ pourcentages et variations -- */

function moulePourcentage(a: Alea): Moule {
  const remise = a.choix([10, 20, 25, 40, 50])
  const initial = a.entier(4, 40) * 25
  const solde = initial * (1 - remise / 100)
  const economie = initial - solde

  return {
    question: `Quel était le prix initial d'un article avant sa remise ?`,
    suffisant1: `La remise de ${remise} % a fait économiser ${euros(economie)}.`,
    suffisant2: `Après une remise de ${remise} %, l'article coûte ${euros(solde)}.`,
    partiel1: `L'article a subi une remise de ${remise} %.`,
    partiel2: `L'article coûte ${euros(solde)} après remise.`,
    inutile1: `Le prix initial est un multiple de ${a.choix([5, 25])} euros.`,
    inutile2: `Le prix initial dépasse ${euros(a.entier(10, Math.max(20, Math.floor(initial / 2))))}.`,
    carS1: `une remise exprimée en euros ET son taux donnent le prix : ` +
      `${euros(economie)} représentent ${remise} % du prix initial, donc celui-ci vaut ` +
      `${euros(economie)} ÷ ${remise / 100} = ${euros(initial)}`,
    carS2: `le prix soldé et le taux se remontent par division : ` +
      `${euros(solde)} ÷ ${nombre(1 - remise / 100, 2)} = ${euros(initial)}`,
    manqueP1: `un taux est une proportion, pas un montant : ${remise} % s'applique aussi bien à 40 € qu'à 4 000 €`,
    manqueP2: `un prix soldé ne dit pas de quelle hauteur il est descendu — ${euros(solde)} peut sortir ` +
      `d'une remise de 10 % comme de 50 %`,
    ensemble: `le taux fournit le coefficient, le prix soldé fournit le montant : ` +
      `${euros(solde)} ÷ ${nombre(1 - remise / 100, 2)} = ${euros(initial)}`,
    lecon: `un taux seul ne donne aucun montant, et un prix soldé seul ne dit pas de quel taux il descend : ` +
      `c'est le couple qui remonte au prix initial. Une remise exprimée en euros, elle, se suffit à elle-même.`,
  }
}

/* ------------------------------------------ arithmétique et divisibilité -- */

function mouleEntier(a: Alea): Moule {
  const d = a.choix([4, 6, 7, 8, 9, 11])
  const n = d * a.entier(4, 12)

  // L'intervalle est ouvert, large d'au moins trois entiers — sinon (1)
  // suffirait seule et le moule mentirait — mais plus étroit que 2d, ce qui
  // garantit qu'il ne contient qu'UN multiple de d : celui-là même, n.
  const avant = a.entier(2, d - 1)
  const apres = a.entier(2, d - 1)
  const bas = n - avant
  const haut = n + apres

  const c = a.entier(3, 30)

  return {
    question: `Un entier n est donné. Quelle est sa valeur ?`,
    suffisant1: `Le double de n augmenté de ${nombre(c)} vaut ${nombre(2 * n + c)}.`,
    suffisant2: `n est le seul multiple de ${d} strictement compris entre ${nombre(bas)} et ${nombre(haut)}.`,
    partiel1: `n est strictement compris entre ${nombre(bas)} et ${nombre(haut)}.`,
    partiel2: `n est un multiple de ${d}.`,
    inutile1: `n est supérieur à ${nombre(a.entier(1, Math.max(2, bas - 1)))}.`,
    inutile2: `n est inférieur à ${nombre(a.entier(haut + 10, haut + 400))}.`,
    carS1: `c'est une équation à une inconnue : 2n + ${nombre(c)} = ${nombre(2 * n + c)} donne n = ${nombre(n)}`,
    carS2: `le mot « seul » fait tout le travail : il garantit qu'un unique nombre convient, ` +
      `et c'est ${nombre(n)}`,
    manqueP1: `l'intervalle contient ${nombre(haut - bas - 1)} entiers, on ne sait pas lequel est n`,
    manqueP2: `les multiples de ${d} sont infiniment nombreux`,
    ensemble: `un seul multiple de ${d} tombe entre ${nombre(bas)} et ${nombre(haut)} — c'est ${nombre(n)}. ` +
      `Le point à vérifier est justement là : si l'intervalle en contenait deux, la réponse serait E`,
    lecon: `un encadrement et une divisibilité ne se suffisent qu'à condition qu'un seul multiple ` +
      `tombe dans l'intervalle. C'est cela qu'il faut vérifier — pas calculer n, qui n'est jamais demandé.`,
  }
}

/* ----------------------------------------- statistiques et probabilités -- */

function mouleMoyenne(a: Alea): Moule {
  const moitie = a.entier(6, 15)
  const eleves = 2 * moitie
  const moyenne = a.entier(9, 15)
  const somme = eleves * moyenne
  const ecart = a.entier(1, 4)

  return {
    question: `Quelle est la moyenne d'une classe à un devoir ?`,
    suffisant1: `La somme des notes vaut ${nombre(somme)} et la classe compte ${eleves} élèves.`,
    // Indépendante de la première : deux demi-groupes de même effectif, dont la
    // moyenne d'ensemble est la moyenne des deux moyennes.
    suffisant2: `La classe se partage en deux groupes de ${moitie} élèves, de moyennes ` +
      `${nombre(moyenne - ecart)} et ${nombre(moyenne + ecart)}.`,
    partiel1: `La classe compte ${eleves} élèves.`,
    partiel2: `La somme des notes obtenues vaut ${nombre(somme)}.`,
    inutile1: `Toutes les notes sont comprises entre 0 et 20, et ${a.entier(2, moitie)} élèves ont eu la moyenne.`,
    inutile2: `${a.entier(2, moitie)} élèves au moins ont obtenu la même note.`,
    carS1: `une moyenne est un total divisé par un effectif, et les deux sont donnés : ` +
      `${nombre(somme)} ÷ ${eleves} = ${nombre(moyenne)}`,
    carS2: `les deux groupes ont le MÊME effectif, donc la moyenne d'ensemble est la moyenne des deux : ` +
      `(${nombre(moyenne - ecart)} + ${nombre(moyenne + ecart)}) ÷ 2 = ${nombre(moyenne)}. ` +
      `Avec des effectifs différents il aurait fallu pondérer, et l'information n'aurait plus suffi`,
    manqueP1: `un effectif sans total ne donne aucune moyenne`,
    manqueP2: `un total sans effectif ne donne aucune moyenne non plus`,
    ensemble: `total ÷ effectif = ${nombre(somme)} ÷ ${eleves} = ${nombre(moyenne)}`,
    lecon: `une moyenne est un total divisé par un effectif : il faut les deux. ` +
      `Deux moyennes ne se moyennent que si les effectifs sont égaux — sinon il faut les pondérer.`,
  }
}

/* ------------------------------------------- proportionnalité et ratios -- */

function mouleRatio(a: Alea): Moule {
  const p = a.entier(2, 6)
  let q = a.entier(2, 7)
  for (let essai = 0; pgcd(p, q) !== 1 && essai < 30; essai++) q = a.entier(2, 9)
  if (pgcd(p, q) !== 1) q = p + 1 // deux entiers consécutifs sont premiers entre eux
  const parts = p + q
  const unite = a.entier(5, 25)
  const total = parts * unite
  const femmes = q * unite
  const ecart = Math.abs(q - p) * unite

  return {
    question: `Combien de femmes compte une association ?`,
    suffisant1: `L'association compte ${nombre(total)} membres, dont ${nombre(femmes)} femmes.`,
    suffisant2: `Le rapport hommes / femmes est de ${p} pour ${q}, et il y a ${nombre(ecart)} ` +
      `${q > p ? 'femmes de plus que d’hommes' : 'hommes de plus que de femmes'}.`,
    partiel1: `Le rapport entre le nombre d'hommes et celui de femmes est de ${p} pour ${q}.`,
    partiel2: `L'association compte ${nombre(total)} membres.`,
    inutile1: `L'association compte au moins ${nombre(a.entier(2, Math.max(3, unite)))} femmes.`,
    inutile2: `L'effectif total est inférieur à ${nombre(a.entier(total + 20, total + 900))}.`,
    carS1: `le nombre de femmes est écrit noir sur blanc : ${nombre(femmes)}`,
    carS2: `un rapport ET un écart chiffré suffisent : l'écart de ${nombre(ecart)} correspond à ` +
      `${Math.abs(q - p)} part(s), donc une part vaut ${nombre(unite)} et les femmes en font ${q}, soit ${nombre(femmes)}`,
    manqueP1: `un rapport de ${p} pour ${q} vaut pour ${nombre(parts)} membres comme pour ${nombre(parts * 100)} : ` +
      `il donne des proportions, pas des effectifs`,
    manqueP2: `un total ne se répartit pas tout seul entre hommes et femmes`,
    ensemble: `le total se découpe en ${p} + ${q} = ${parts} parts de ${nombre(unite)}, ` +
      `et les femmes en occupent ${q}, soit ${nombre(femmes)}`,
    lecon: `un rapport est une proportion, pas un effectif : il faut un total ou un écart absolu ` +
      `pour le convertir en nombre de personnes.`,
  }
}

/* ------------------------------------------- suffisance vs résolution -- */

function mouleSomme(a: Alea): Moule {
  const x = a.entier(6, 40)
  const y = a.entier(2, x - 1)
  const somme = x + y
  const difference = x - y
  const differenceCarres = x * x - y * y

  return {
    question: `Deux nombres x et y étant donnés, que vaut x + y ?`,
    suffisant1: `x + y = ${nombre(somme)}.`,
    suffisant2: `x = ${nombre(x)} et y = ${nombre(y)}.`,
    partiel1: `x − y = ${nombre(difference)}.`,
    partiel2: `x² − y² = ${nombre(differenceCarres)}.`,
    inutile1: `x et y sont des entiers strictement compris entre 0 et ${nombre(a.entier(x + 5, x + 200))}.`,
    inutile2: `x dépasse y d'au moins ${nombre(a.entier(1, Math.max(1, difference)))}.`,
    carS1: `la somme est donnée telle quelle — inutile de chercher x et y, c'est la somme qu'on demande`,
    carS2: `les deux nombres sont connus, leur somme aussi : ${nombre(x)} + ${nombre(y)} = ${nombre(somme)}`,
    manqueP1: `une différence de ${nombre(difference)} laisse une infinité de couples : ` +
      `(${nombre(x)} ; ${nombre(y)}) mais aussi (${nombre(x + 1)} ; ${nombre(y + 1)}), dont les sommes diffèrent`,
    manqueP2: `x² − y² = ${nombre(differenceCarres)} se factorise en (x + y)(x − y), ` +
      `mais sans connaître l'un des deux facteurs on ne remonte pas à l'autre`,
    ensemble: `x² − y² = (x + y)(x − y), donc x + y = ${nombre(differenceCarres)} ÷ ${nombre(difference)} = ${nombre(somme)}. ` +
      `On obtient la somme sans jamais avoir calculé x ni y — c'est exactement ce que le sous-test veut faire voir`,
    lecon: `la question porte sur x + y, pas sur x et y séparément. Une information peut donc suffire ` +
      `sans jamais livrer les deux nombres — c'est le piège central du sous-test : ` +
      `on cherche la réponse, pas les inconnues.`,
  }
}

/* --------------------------------- pièges de signe et cas particuliers -- */

function mouleSigne(a: Alea): Moule {
  const k = a.entier(3, 15)

  return {
    question: `Quelle est la valeur de x ?`,
    suffisant1: `x³ = ${nombre(-(k ** 3))}.`,
    suffisant2: `La valeur absolue de x vaut ${nombre(k)} et x est strictement négatif.`,
    partiel1: `x² = ${nombre(k * k)}.`,
    partiel2: `x est strictement négatif.`,
    inutile1: `x est un entier dont la valeur absolue est inférieure à ${nombre(a.entier(k + 1, k + 30))}.`,
    inutile2: `x² est strictement supérieur à ${nombre(a.entier(1, k * k - 1))}.`,
    carS1: `un cube conserve le signe : un nombre négatif au cube reste négatif, un positif reste positif. ` +
      `x³ = ${nombre(-(k ** 3))} n'a donc qu'une solution, x = −${nombre(k)}`,
    carS2: `la valeur absolue donne la grandeur, le signe donne le sens : les deux ensemble ne laissent ` +
      `qu'un nombre, −${nombre(k)}`,
    manqueP1: `un carré efface le signe : x² = ${nombre(k * k)} est vrai pour ${nombre(k)} ET pour −${nombre(k)}. ` +
      `Deux réponses possibles, donc pas de réponse`,
    manqueP2: `« négatif » ne donne aucune grandeur`,
    ensemble: `le carré donne les deux candidats ${nombre(k)} et −${nombre(k)}, le signe en élimine un : ` +
      `x = −${nombre(k)}`,
    lecon: `un carré ne détermine jamais le signe — x² = ${nombre(k * k)} admet ${nombre(k)} et −${nombre(k)} — ` +
      `alors qu'un cube le détermine. Oublier la racine négative fait répondre A ou B ` +
      `là où la bonne réponse est C.`,
  }
}

/* ------------------------------------------------------------ familles -- */

const LETTRES_CIBLES: Lettre[] = ['A', 'B', 'C', 'D', 'E']

function famille(
  nom: string,
  skillId: string,
  moule: (a: Alea) => Moule,
  difficulte: 1 | 2 | 3 | 4 | 5,
): Famille {
  return {
    skillId,
    nom,
    produire(a) {
      // La lettre est tirée uniformément : si le générateur penchait vers C,
      // l'entraînement apprendrait à répondre C, pas à raisonner.
      const cible = a.choix(LETTRES_CIBLES)
      return depuisMoule(moule(a), cible, skillId, difficulte)
    },
  }
}

export const FAMILLES_CONDITIONS: Famille[] = [
  famille('âges', 'tm.conditions_minimales.cm_equations_et_systemes', mouleAges, 2),
  famille('rectangle', 'tm.conditions_minimales.cm_geometrie', mouleRectangle, 3),
  famille('remise', 'tm.conditions_minimales.cm_pourcentages_et_variations', moulePourcentage, 3),
  famille('entier', 'tm.conditions_minimales.cm_arithmetique_et_divisibilite', mouleEntier, 4),
  famille('moyenne', 'tm.conditions_minimales.cm_statistiques_et_probabilites', mouleMoyenne, 2),
  famille('ratio', 'tm.conditions_minimales.cm_proportionnalite_et_ratios', mouleRatio, 3),
  famille('somme', 'tm.conditions_minimales.suffisance_vs_resolution', mouleSomme, 4),
  famille('signe', 'tm.conditions_minimales.pieges_de_signe_et_cas_particuliers', mouleSigne, 4),
]
