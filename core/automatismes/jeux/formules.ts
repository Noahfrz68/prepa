import { nombre, type Alea } from '@/core/generation/alea'
import { court, exposant } from '../ecriture'
import type { Jeu, Question } from '../types'

/**
 * Jeu 10 — les formules flash.
 *
 * Toutes les formules dont le calcul du TAGE MAGE a besoin, telles que les
 * donne le cours : géométrie, dénombrement, probabilités, suites, vitesses,
 * pourcentages, moyennes, arithmétique, second degré. Deux questions par
 * formule : la reconnaître parmi cinq (les leurres sont les confusions
 * classiques), et l'appliquer à des nombres simples.
 *
 * Le fait travaillé est la formule (`formule:cone`, `appli:cone`) : la
 * reconnaître et savoir s'en servir sont deux réflexes distincts.
 */

export interface Application {
  enonce: string
  /** Les données tirées, pour que les tests recalculent la réponse de leur côté. */
  donnees: Record<string, number>
  valeur: number
  /** Le calcul détaillé, pour la correction. */
  calcul: string
  /** Réponse en nombre de π : « 12π » se tape 12. */
  enPi?: boolean
  /** Réponse qui peut être négative : clavier avec signe. */
  relatif?: boolean
}

export interface Formule {
  id: string
  /** La question de reconnaissance : « Volume d'un cône (rayon r, hauteur h) ». */
  quoi: string
  formule: string
  /** Les confusions classiques, quatre au moins. */
  leurres: string[]
  /** Le piège ou le moyen de s'en souvenir, pour la correction. */
  rappel: string
  appliquer?: (a: Alea) => Application
  table?: string
}

const DENOMBREMENT = 'Dénombrement'

const fact = (n: number): number => (n <= 1 ? 1 : n * fact(n - 1))
const comb = (n: number, k: number) => fact(n) / (fact(k) * fact(n - k))
const pi = (k: number) => `${nombre(k)}π`

export const FORMULES: Formule[] = [
  /* ---------------------------------------------------------- aires -- */
  {
    id: 'aire_triangle',
    quoi: 'Aire d’un triangle (base b, hauteur h)',
    formule: 'b × h / 2',
    leurres: ['b × h', '(b + h) / 2', '2 × b × h', 'b × h / 3'],
    rappel: 'Un triangle, c’est la moitié du parallélogramme de même base et même hauteur.',
    appliquer(a) {
      const b = 2 * a.entier(2, 10)
      const h = a.entier(3, 15)
      return { enonce: `Triangle de base ${b} et de hauteur ${h} : aire ?`, donnees: { b, h }, valeur: (b * h) / 2, calcul: `${b} × ${h} / 2 = ${(b * h) / 2}` }
    },
  },
  {
    id: 'aire_parallelogramme',
    quoi: 'Aire d’un parallélogramme (base b, hauteur h)',
    formule: 'b × h',
    leurres: ['b × h / 2', '2 × (b + h)', 'b² × h', '(b + h) / 2'],
    rappel: 'La hauteur, pas le côté oblique : on redresse le parallélogramme en rectangle.',
    appliquer(a) {
      const b = a.entier(3, 15)
      const h = a.entier(2, 12)
      return { enonce: `Parallélogramme de base ${b} et de hauteur ${h} : aire ?`, donnees: { b, h }, valeur: b * h, calcul: `${b} × ${h} = ${b * h}` }
    },
  },
  {
    id: 'aire_trapeze',
    quoi: 'Aire d’un trapèze (bases B et b, hauteur h)',
    formule: '(B + b) × h / 2',
    leurres: ['(B + b) × h', 'B × b × h / 2', '(B − b) × h / 2', '(B + b) / 2 + h'],
    rappel: 'La moyenne des deux bases, multipliée par la hauteur.',
    appliquer(a) {
      const b = a.entier(2, 9)
      const B = b + 2 * a.entier(1, 5)
      const h = a.entier(2, 10)
      return {
        enonce: `Trapèze de bases ${B} et ${b}, de hauteur ${h} : aire ?`,
        donnees: { B, b, h },
        valeur: ((B + b) * h) / 2,
        calcul: `(${B} + ${b}) × ${h} / 2 = ${B + b} × ${h} / 2 = ${((B + b) * h) / 2}`,
      }
    },
  },
  {
    id: 'aire_losange',
    quoi: 'Aire d’un losange (diagonales D et d)',
    formule: 'D × d / 2',
    leurres: ['D × d', '(D + d) / 2', 'D² / 2', '(D + d) × 2'],
    rappel: 'Le losange occupe la moitié du rectangle construit sur ses diagonales.',
    appliquer(a) {
      const D = 2 * a.entier(3, 10)
      const d = a.entier(2, 9)
      return { enonce: `Losange de diagonales ${D} et ${d} : aire ?`, donnees: { D, d }, valeur: (D * d) / 2, calcul: `${D} × ${d} / 2 = ${(D * d) / 2}` }
    },
  },
  {
    id: 'aire_disque',
    quoi: 'Aire d’un disque (rayon r)',
    formule: 'πr²',
    leurres: ['2πr', 'πd²', 'πr² / 2', '4πr²'],
    rappel: 'Aire : r au CARRÉ (une surface) ; périmètre : 2πr (une longueur).',
    appliquer(a) {
      const r = a.entier(2, 10)
      return { enonce: `Disque de rayon ${r} : aire ?`, donnees: { r }, valeur: r * r, calcul: `π × ${r}² = ${pi(r * r)}`, enPi: true }
    },
  },
  {
    id: 'perimetre_cercle',
    quoi: 'Périmètre d’un cercle (rayon r)',
    formule: '2πr',
    leurres: ['πr²', 'πr', '2πr²', '4πr'],
    rappel: 'Le périmètre est une longueur : r à la puissance 1. Avec le diamètre : πd.',
    appliquer(a) {
      const r = a.entier(2, 15)
      return { enonce: `Cercle de rayon ${r} : périmètre ?`, donnees: { r }, valeur: 2 * r, calcul: `2 × π × ${r} = ${pi(2 * r)}`, enPi: true }
    },
  },
  {
    id: 'aire_sphere',
    quoi: 'Aire d’une sphère (rayon r)',
    formule: '4πr²',
    leurres: ['πr²', '2πr²', '4πr³ / 3', '4πr'],
    rappel: 'Quatre fois l’aire du grand disque de la sphère.',
    appliquer(a) {
      const r = a.entier(1, 6)
      return { enonce: `Sphère de rayon ${r} : aire ?`, donnees: { r }, valeur: 4 * r * r, calcul: `4 × π × ${r}² = ${pi(4 * r * r)}`, enPi: true }
    },
  },

  /* -------------------------------------------------------- volumes -- */
  {
    id: 'volume_pave',
    quoi: 'Volume d’un pavé droit (L, l, h)',
    formule: 'L × l × h',
    leurres: ['2(Ll + Lh + lh)', '(L + l + h) × 2', 'L × l × h / 3', 'L × l + h'],
    rappel: '2(Ll + Lh + lh), c’est l’aire de ses six faces, pas son volume.',
    appliquer(a) {
      const [L, l, h] = [a.entier(2, 10), a.entier(2, 8), a.entier(2, 6)]
      return { enonce: `Pavé de ${L} × ${l} × ${h} : volume ?`, donnees: { L, l, h }, valeur: L * l * h, calcul: `${L} × ${l} × ${h} = ${L * l * h}` }
    },
  },
  {
    id: 'volume_cylindre',
    quoi: 'Volume d’un cylindre (rayon r, hauteur h)',
    formule: 'πr² × h',
    leurres: ['2πr × h', 'πr² × h / 3', 'πr × h', '2πr² × h'],
    rappel: 'Aire de la base × hauteur, comme tout prisme droit.',
    appliquer(a) {
      const r = a.entier(1, 6)
      const h = a.entier(2, 10)
      return { enonce: `Cylindre de rayon ${r} et de hauteur ${h} : volume ?`, donnees: { r, h }, valeur: r * r * h, calcul: `π × ${r}² × ${h} = ${pi(r * r * h)}`, enPi: true }
    },
  },
  {
    id: 'volume_cone',
    quoi: 'Volume d’un cône (rayon r, hauteur h)',
    formule: 'πr² × h / 3',
    leurres: ['πr² × h', 'πr² × h / 2', 'πr × h / 3', '4πr³ / 3'],
    rappel: 'Un tiers du cylindre de même base et même hauteur — comme la pyramide.',
    appliquer(a) {
      const r = a.entier(1, 6)
      const h = 3 * a.entier(1, 4)
      return {
        enonce: `Cône de rayon ${r} et de hauteur ${h} : volume ?`,
        donnees: { r, h },
        valeur: (r * r * h) / 3,
        calcul: `π × ${r}² × ${h} / 3 = ${pi((r * r * h) / 3)}`,
        enPi: true,
      }
    },
  },
  {
    id: 'volume_pyramide',
    quoi: 'Volume d’une pyramide (aire de base B, hauteur h)',
    formule: 'B × h / 3',
    leurres: ['B × h', 'B × h / 2', 'B × h / 4', 'B + h / 3'],
    rappel: 'Un tiers du prisme de même base et même hauteur — comme le cône.',
    appliquer(a) {
      const c = a.entier(2, 9)
      const h = 3 * a.entier(1, 5)
      return {
        enonce: `Pyramide à base carrée de côté ${c}, de hauteur ${h} : volume ?`,
        donnees: { c, h },
        valeur: (c * c * h) / 3,
        calcul: `${c}² × ${h} / 3 = ${c * c} × ${h} / 3 = ${(c * c * h) / 3}`,
      }
    },
  },
  {
    id: 'volume_sphere',
    quoi: 'Volume d’une boule (rayon r)',
    formule: '4πr³ / 3',
    leurres: ['4πr²', 'πr³', '4πr² / 3', '2πr³ / 3'],
    rappel: 'Un volume : r au CUBE. 4πr² est l’aire de la sphère.',
    appliquer(a) {
      const r = a.choix([3, 6])
      return { enonce: `Boule de rayon ${r} : volume ?`, donnees: { r }, valeur: (4 * r ** 3) / 3, calcul: `4 × π × ${r}³ / 3 = ${pi((4 * r ** 3) / 3)}`, enPi: true }
    },
  },
  {
    id: 'facteur_aire',
    quoi: 'Longueurs multipliées par k : l’aire est multipliée par',
    formule: 'k²',
    leurres: ['k', 'k³', '2k', 'k / 2'],
    rappel: 'Une aire a deux dimensions : k × k.',
    appliquer(a) {
      const k = a.entier(2, 6)
      return { enonce: `Toutes les longueurs × ${k} : l’aire est multipliée par ?`, donnees: { k }, valeur: k * k, calcul: `${k}² = ${k * k}` }
    },
  },
  {
    id: 'facteur_volume',
    quoi: 'Longueurs multipliées par k : le volume est multiplié par',
    formule: 'k³',
    leurres: ['k²', 'k', '3k', 'k⁴'],
    rappel: 'Un volume a trois dimensions : k × k × k. Arêtes −10 % → volume × 0,9³ = 0,729.',
    appliquer(a) {
      const k = a.entier(2, 5)
      return { enonce: `Toutes les longueurs × ${k} : le volume est multiplié par ?`, donnees: { k }, valeur: k ** 3, calcul: `${k}³ = ${k ** 3}` }
    },
  },

  /* ----------------------------------------------- géométrie plane -- */
  {
    id: 'diagonale_carre',
    quoi: 'Diagonale d’un carré de côté c',
    formule: 'c√2',
    leurres: ['2c', 'c√3', 'c²', 'c / 2'],
    rappel: 'Pythagore dans le demi-carré : c² + c² = 2c².',
  },
  {
    id: 'hauteur_equilateral',
    quoi: 'Hauteur d’un triangle équilatéral de côté c',
    formule: 'c√3 / 2',
    leurres: ['c√2 / 2', 'c / 2', 'c√3', 'c√2'],
    rappel: 'Pythagore dans le demi-triangle : c² − (c/2)² = 3c²/4.',
  },
  {
    id: 'diagonale_cube',
    quoi: 'Grande diagonale d’un cube d’arête c',
    formule: 'c√3',
    leurres: ['c√2', '3c', 'c³', '2c'],
    rappel: 'Pythagore deux fois : c² + c² + c² = 3c².',
  },
  {
    id: 'thales',
    quoi: 'Thalès, (MN) parallèle à (BC) : AM / AB = AN / AC = ?',
    formule: 'MN / BC',
    leurres: ['MN / AB', 'BC / MN', 'MB / NC', 'AM / AN'],
    rappel: 'Les trois rapports comparent le petit triangle AMN au grand ABC, côté par côté.',
  },
  {
    id: 'somme_angles',
    quoi: 'Somme des angles d’un polygone à n côtés',
    formule: '(n − 2) × 180°',
    leurres: ['n × 180°', '(n − 1) × 180°', '(n − 2) × 90°', 'n × 90°'],
    rappel: 'On le découpe en n − 2 triangles depuis un sommet. Triangle : 180°, quadrilatère : 360°.',
    appliquer(a) {
      const n = a.entier(5, 12)
      return { enonce: `Polygone à ${n} côtés : somme des angles, en degrés ?`, donnees: { n }, valeur: (n - 2) * 180, calcul: `(${n} − 2) × 180 = ${nombre((n - 2) * 180)}°` }
    },
  },
  {
    id: 'diagonales_polygone',
    quoi: 'Nombre de diagonales d’un polygone à n côtés',
    formule: 'n(n − 3) / 2',
    leurres: ['n(n − 1) / 2', 'n(n − 3)', 'n(n − 2) / 2', '(n − 3) / 2'],
    rappel: 'Chaque sommet se relie aux n − 3 sommets non voisins ; chaque diagonale est comptée deux fois.',
    appliquer(a) {
      const n = a.entier(5, 12)
      return { enonce: `Polygone à ${n} côtés : nombre de diagonales ?`, donnees: { n }, valeur: (n * (n - 3)) / 2, calcul: `${n} × ${n - 3} / 2 = ${(n * (n - 3)) / 2}` }
    },
  },

  /* --------------------------------------------------- dénombrement -- */
  {
    id: 'permutations',
    quoi: 'Nombre de façons d’ordonner n éléments',
    formule: 'n!',
    leurres: ['n²', 'nⁿ', 'n(n − 1) / 2', '2ⁿ'],
    rappel: 'n choix pour la 1ʳᵉ place, n − 1 pour la 2ᵉ… 5! = 120.',
    table: DENOMBREMENT,
    appliquer(a) {
      const n = a.entier(3, 7)
      return { enonce: `Combien de façons d’aligner ${n} personnes ?`, donnees: { n }, valeur: fact(n), calcul: `${n}! = ${nombre(fact(n))}` }
    },
  },
  {
    id: 'arrangements',
    quoi: 'Choisir k éléments parmi n quand l’ordre compte (podium)',
    formule: 'n! / (n − k)!',
    leurres: ['n! / (k!(n − k)!)', 'nᵏ', 'n × k', 'k! / n!'],
    rappel: 'n × (n − 1) × … : autant de facteurs que de places. Podium de 3 parmi 10 : 10 × 9 × 8.',
    table: DENOMBREMENT,
    appliquer(a) {
      const n = a.entier(5, 10)
      const k = a.entier(2, 3)
      const v = fact(n) / fact(n - k)
      const facteurs = Array.from({ length: k }, (_, i) => n - i).join(' × ')
      return { enonce: `Podiums de ${k} places possibles parmi ${n} coureurs ?`, donnees: { n, k }, valeur: v, calcul: `${facteurs} = ${nombre(v)}` }
    },
  },
  {
    id: 'combinaisons',
    quoi: 'Choisir k éléments parmi n quand l’ordre ne compte pas (comité)',
    formule: 'n! / (k!(n − k)!)',
    leurres: ['n! / (n − k)!', 'nᵏ', 'n! / k!', 'n × k / 2'],
    rappel: 'Le même produit que pour un podium, divisé par k! : les ordres d’un même groupe ne comptent qu’une fois.',
    table: DENOMBREMENT,
    appliquer(a) {
      const n = a.entier(5, 10)
      const k = a.entier(2, 3)
      const facteurs = Array.from({ length: k }, (_, i) => n - i).join(' × ')
      return {
        enonce: `Comités de ${k} personnes possibles parmi ${n} ?`,
        donnees: { n, k },
        valeur: comb(n, k),
        calcul: `(${facteurs}) / ${k}! = ${nombre(fact(n) / fact(n - k))} / ${fact(k)} = ${comb(n, k)}`,
      }
    },
  },
  {
    id: 'repetition',
    quoi: 'Codes de k symboles pris parmi n, répétition permise',
    formule: 'nᵏ',
    leurres: ['kⁿ', 'n! / (n − k)!', 'n × k', 'n! / k!'],
    rappel: 'Chaque position a ses n choix, indépendamment des autres : 10⁴ codes à 4 chiffres.',
    table: DENOMBREMENT,
    appliquer(a) {
      const n = a.choix([2, 3, 4, 5, 10])
      const k = a.entier(2, 4)
      return { enonce: `Codes de ${k} caractères pris parmi ${n} symboles, répétition permise ?`, donnees: { n, k }, valeur: n ** k, calcul: `${n}${exposant(k)} = ${nombre(n ** k)}` }
    },
  },
  {
    id: 'poignees',
    quoi: 'Poignées de main échangées entre n personnes',
    formule: 'n(n − 1) / 2',
    leurres: ['n(n − 1)', 'n²', 'n!', '(n − 1) / 2'],
    rappel: 'C’est « 2 parmi n » : n(n − 1) compte chaque poignée deux fois.',
    table: DENOMBREMENT,
    appliquer(a) {
      const n = a.entier(4, 20)
      return { enonce: `Poignées de main entre ${n} personnes ?`, donnees: { n }, valeur: (n * (n - 1)) / 2, calcul: `${n} × ${n - 1} / 2 = ${(n * (n - 1)) / 2}` }
    },
  },

  /* --------------------------------------------------- probabilités -- */
  {
    id: 'proba_contraire',
    quoi: 'P(au moins un)',
    formule: '1 − P(aucun)',
    leurres: ['P(aucun)', '1 + P(aucun)', '1 / P(aucun)', 'P(un seul)'],
    rappel: 'Presque toujours le chemin court : « au moins une rouge » passe par « que des bleues ».',
  },
  {
    id: 'proba_et',
    quoi: 'A et B indépendants : P(A et B)',
    formule: 'P(A) × P(B)',
    leurres: ['P(A) + P(B)', 'P(A) + P(B) − 1', 'P(A) / P(B)', '1 − P(A) × P(B)'],
    rappel: 'ET on multiplie, OU (incompatibles) on additionne.',
  },
  {
    id: 'proba_ou',
    quoi: 'A et B incompatibles : P(A ou B)',
    formule: 'P(A) + P(B)',
    leurres: ['P(A) × P(B)', '1 − P(A) × P(B)', 'P(A) + P(B) − 1', 'max(P(A), P(B))'],
    rappel: 'OU entre événements qui ne peuvent arriver ensemble : on additionne.',
  },
  {
    id: 'proba_conditionnelle',
    quoi: 'P(A sachant B)',
    formule: 'P(A et B) / P(B)',
    leurres: ['P(A et B) / P(A)', 'P(A) × P(B)', 'P(A) / P(B)', 'P(A et B) × P(B)'],
    rappel: 'On se restreint au groupe B, et on y compte la part de A.',
  },

  /* --------------------------------------------------------- suites -- */
  {
    id: 'terme_arithmetique',
    quoi: 'Terme de rang n d’une suite arithmétique (u₁, raison r)',
    formule: 'u₁ + (n − 1) × r',
    leurres: ['u₁ + n × r', 'u₁ × rⁿ⁻¹', 'u₁ × (n − 1) × r', 'n × r'],
    rappel: 'Du 1er au 10e terme il y a 9 pas, pas 10.',
    appliquer(a) {
      const [u1, r, n] = [a.entier(1, 20), a.entier(2, 9), a.entier(8, 30)]
      const v = u1 + (n - 1) * r
      return { enonce: `u₁ = ${u1}, raison ${r} : u${indice(n)} ?`, donnees: { u1, r, n }, valeur: v, calcul: `${u1} + ${n - 1} × ${r} = ${v}` }
    },
  },
  {
    id: 'somme_arithmetique',
    quoi: 'Somme de n termes d’une suite arithmétique',
    formule: '(premier + dernier) × n / 2',
    leurres: ['(premier + dernier) × n', 'premier × n', '(dernier − premier) × n / 2', '(premier + dernier) / 2'],
    rappel: 'La moyenne des extrêmes, multipliée par le nombre de termes.',
    appliquer(a) {
      const r = a.entier(2, 5)
      const premier = a.entier(1, 10)
      const n = 2 * a.entier(4, 15)
      const dernier = premier + (n - 1) * r
      const v = ((premier + dernier) * n) / 2
      return {
        enonce: `${premier} + ${premier + r} + … + ${dernier} (${n} termes) ?`,
        donnees: { premier, dernier, n },
        valeur: v,
        calcul: `(${premier} + ${dernier}) × ${n} / 2 = ${nombre(v)}`,
      }
    },
  },
  {
    id: 'somme_entiers',
    quoi: '1 + 2 + … + n',
    formule: 'n(n + 1) / 2',
    leurres: ['n(n − 1) / 2', 'n²', 'n(n + 1)', '(n + 1) / 2'],
    rappel: '1 + 100, 2 + 99… : n/2 paires qui valent chacune n + 1. 1 + … + 100 = 5 050.',
    appliquer(a) {
      const n = a.choix([10, 20, 30, 40, 50, 60, 80, 99, 100, 200])
      const v = (n * (n + 1)) / 2
      return { enonce: `1 + 2 + … + ${n} ?`, donnees: { n }, valeur: v, calcul: `${n} × ${n + 1} / 2 = ${nombre(v)}` }
    },
  },
  {
    id: 'terme_geometrique',
    quoi: 'Terme de rang n d’une suite géométrique (u₁, raison q)',
    formule: 'u₁ × qⁿ⁻¹',
    leurres: ['u₁ × qⁿ', 'u₁ + (n − 1) × q', 'u₁ × q × n', 'qⁿ⁻¹'],
    rappel: 'Comme pour l’arithmétique : n − 1 pas du premier au n-ième.',
    appliquer(a) {
      const [u1, q, n] = [a.entier(1, 5), a.choix([2, 3]), a.entier(3, 6)]
      const v = u1 * q ** (n - 1)
      return { enonce: `u₁ = ${u1}, raison ${q} : u${indice(n)} ?`, donnees: { u1, q, n }, valeur: v, calcul: `${u1} × ${q}${exposant(n - 1)} = ${nombre(v)}` }
    },
  },
  {
    id: 'nombre_termes',
    quoi: 'Nombre de termes de a à b, de r en r',
    formule: '(b − a) / r + 1',
    leurres: ['(b − a) / r', '(b − a) / r − 1', 'b / r − a', '(b − a + 1) / r'],
    rappel: 'Le « + 1 » compte le premier terme : son oubli est l’erreur classique.',
    appliquer(a) {
      const r = a.entier(2, 7)
      const debut = a.entier(1, 20)
      const n = a.entier(10, 40)
      const fin = debut + (n - 1) * r
      return { enonce: `Combien de termes de ${debut} à ${fin}, de ${r} en ${r} ?`, donnees: { a: debut, b: fin, r }, valeur: n, calcul: `(${fin} − ${debut}) / ${r} + 1 = ${n}` }
    },
  },

  /* ----------------------------------------------- vitesses, débits -- */
  {
    id: 'temps',
    quoi: 'Temps de parcours (distance d, vitesse v)',
    formule: 'd / v',
    leurres: ['d × v', 'v / d', 'd − v', '2d / v'],
    rappel: 'd = v × t : on écrit celle dont on a besoin.',
    appliquer(a) {
      const v = a.choix([30, 40, 60, 80, 90, 120])
      const t = a.entier(2, 6)
      return { enonce: `${v * t} km à ${v} km/h : durée en heures ?`, donnees: { d: v * t, v }, valeur: t, calcul: `${v * t} / ${v} = ${t}` }
    },
  },
  {
    id: 'vitesse_moyenne',
    quoi: 'Vitesse moyenne d’un aller-retour, à v₁ puis v₂',
    formule: '2v₁v₂ / (v₁ + v₂)',
    leurres: ['(v₁ + v₂) / 2', 'v₁v₂ / (v₁ + v₂)', '√(v₁v₂)', '(v₁ + v₂) / (v₁v₂)'],
    rappel: 'Distance totale / temps total. Jamais la moyenne des vitesses : on passe plus de temps à l’allure lente.',
    appliquer(a) {
      const [v1, v2] = a.choix([
        [10, 30], [20, 30], [30, 60], [40, 60], [60, 90], [12, 60], [20, 80], [40, 120], [60, 120], [30, 70],
      ])
      const v = (2 * v1 * v2) / (v1 + v2)
      return {
        enonce: `Aller à ${v1} km/h, retour à ${v2} km/h : vitesse moyenne ?`,
        donnees: { v1, v2 },
        valeur: v,
        calcul: `2 × ${v1} × ${v2} / (${v1} + ${v2}) = ${nombre(2 * v1 * v2)} / ${v1 + v2} = ${court(v)}`,
      }
    },
  },
  {
    id: 'travail_conjoint',
    quoi: 'Durée à deux, si l’un met t₁ et l’autre t₂ seul',
    formule: 't₁t₂ / (t₁ + t₂)',
    leurres: ['(t₁ + t₂) / 2', 't₁ + t₂', '2t₁t₂ / (t₁ + t₂)', 't₂ − t₁'],
    rappel: 'Les débits s’additionnent (1/t₁ + 1/t₂), pas les durées. À deux, on va plus vite que le plus rapide seul.',
    appliquer(a) {
      const [t1, t2] = a.choix([
        [3, 6], [4, 12], [6, 12], [10, 15], [12, 24], [20, 30], [6, 6], [2, 6], [12, 6], [15, 10],
      ])
      const v = (t1 * t2) / (t1 + t2)
      return {
        enonce: `Une pompe remplit le bassin en ${t1} h, une autre en ${t2} h : à deux ?`,
        donnees: { t1, t2 },
        valeur: v,
        calcul: `${t1} × ${t2} / (${t1} + ${t2}) = ${t1 * t2} / ${t1 + t2} = ${court(v)} h`,
      }
    },
  },
  {
    id: 'melange',
    quoi: 'Concentration d’un mélange (volumes V₁, V₂ aux taux c₁, c₂)',
    formule: '(V₁c₁ + V₂c₂) / (V₁ + V₂)',
    leurres: ['(c₁ + c₂) / 2', '(V₁c₁ + V₂c₂) / 2', 'c₁ × c₂ / (c₁ + c₂)', 'V₁c₁ + V₂c₂'],
    rappel: 'On compte le produit pur, litre par litre, puis on divise par le volume total.',
    appliquer(a) {
      const [V1, c1, V2, c2] = a.choix([
        [3, 20, 2, 45], [1, 10, 1, 30], [2, 10, 3, 60], [4, 25, 1, 50], [3, 10, 1, 50], [2, 30, 2, 50], [1, 20, 4, 45],
      ])
      const v = (V1 * c1 + V2 * c2) / (V1 + V2)
      return {
        enonce: `${V1} L à ${c1} % et ${V2} L à ${c2} % : concentration du mélange, en % ?`,
        donnees: { V1, c1, V2, c2 },
        valeur: v,
        calcul: `(${V1} × ${c1} + ${V2} × ${c2}) / ${V1 + V2} = ${V1 * c1 + V2 * c2} / ${V1 + V2} = ${court(v)} %`,
      }
    },
  },

  /* ---------------------------------------------------- pourcentages -- */
  {
    id: 'variation',
    quoi: 'Variation en % d’une valeur V₁ à une valeur V₂',
    formule: '(V₂ − V₁) / V₁ × 100',
    leurres: ['(V₂ − V₁) / V₂ × 100', '(V₁ − V₂) / V₁ × 100', 'V₂ / V₁ × 100', '(V₂ − V₁) × 100'],
    rappel: 'On divise toujours par la valeur de DÉPART.',
    appliquer(a) {
      const v1 = 20 * a.entier(1, 20)
      const p = a.choix([5, 10, 20, 25, 50, -10, -20, -25, -50])
      const v2 = (v1 * (100 + p)) / 100
      return {
        enonce: `De ${nombre(v1)} à ${nombre(v2)} : variation en % ?`,
        donnees: { V1: v1, V2: v2 },
        valeur: p,
        calcul: `(${nombre(v2)} − ${nombre(v1)}) / ${nombre(v1)} × 100 = ${p > 0 ? '+' : '−'}${Math.abs(p)} %`,
        relatif: true,
      }
    },
  },
  {
    id: 'interets_composes',
    quoi: 'Capital C placé n ans à t % par an, intérêts composés',
    formule: 'C × (1 + t)ⁿ',
    leurres: ['C × (1 + n × t)', 'C × tⁿ', 'C × (1 + t) × n', 'C + n × t'],
    rappel: 'Les intérêts rapportent à leur tour : on multiplie n fois par 1 + t. C × (1 + nt), ce sont les intérêts simples.',
    appliquer(a) {
      const t = a.choix([10, 20])
      const n = a.entier(2, 3)
      const C = n === 3 ? 1000 : a.choix([100, 500, 1000])
      const v = Math.round(C * (1 + t / 100) ** n)
      return {
        enonce: `${nombre(C)} € placés ${n} ans à ${t} % composés : capital final ?`,
        donnees: { C, t, n },
        valeur: v,
        calcul: `${nombre(C)} × ${court(1 + t / 100)}${exposant(n)} = ${nombre(v)} €`,
      }
    },
  },

  /* -------------------------------------------------------- moyennes -- */
  {
    id: 'moyenne_ponderee',
    quoi: 'Moyenne de deux groupes (effectifs n₁, n₂ ; moyennes m₁, m₂)',
    formule: '(n₁m₁ + n₂m₂) / (n₁ + n₂)',
    leurres: ['(m₁ + m₂) / 2', '(n₁m₁ + n₂m₂) / 2', '(m₁ + m₂) / (n₁ + n₂)', 'n₁m₁ + n₂m₂'],
    rappel: 'On repasse par les totaux : ils s’additionnent, les moyennes non.',
    appliquer(a) {
      const [n1, m1, n2, m2] = a.choix([
        [20, 12, 30, 14], [10, 8, 30, 12], [15, 10, 5, 14], [40, 11, 10, 16], [25, 12, 25, 16], [30, 9, 20, 14],
      ])
      const v = (n1 * m1 + n2 * m2) / (n1 + n2)
      return {
        enonce: `${n1} élèves à ${m1} de moyenne, ${n2} à ${m2} : moyenne de l’ensemble ?`,
        donnees: { n1, m1, n2, m2 },
        valeur: v,
        calcul: `(${n1} × ${m1} + ${n2} × ${m2}) / ${n1 + n2} = ${n1 * m1 + n2 * m2} / ${n1 + n2} = ${court(v)}`,
      }
    },
  },

  /* ---------------------------------------------------- arithmétique -- */
  {
    id: 'pgcd_ppcm',
    quoi: 'PGCD(a, b) × PPCM(a, b)',
    formule: 'a × b',
    leurres: ['a + b', 'PPCM(a, b)²', 'a × b / 2', '(a × b)²'],
    rappel: 'Le contrôle imparable d’un PGCD ou d’un PPCM.',
    appliquer(a) {
      const [x, y, g] = a.choix([
        [12, 18, 6], [8, 12, 4], [15, 20, 5], [14, 21, 7], [24, 36, 12], [10, 25, 5], [16, 24, 8], [9, 12, 3],
      ])
      return {
        enonce: `PGCD(${x}, ${y}) = ${g} : PPCM(${x}, ${y}) ?`,
        donnees: { a: x, b: y, g },
        valeur: (x * y) / g,
        calcul: `${x} × ${y} / ${g} = ${(x * y) / g}`,
      }
    },
  },
  {
    id: 'nombre_multiples',
    quoi: 'Nombre de multiples de p entre 1 et n',
    formule: 'partie entière de n / p',
    leurres: ['n − p', 'n × p', 'n / p + 1', 'p / n'],
    rappel: 'Entre a et b : ⌊b/p⌋ − ⌊(a − 1)/p⌋.',
    appliquer(a) {
      const p = a.entier(3, 13)
      const n = a.entier(50, 500)
      return {
        enonce: `Multiples de ${p} entre 1 et ${n} ?`,
        donnees: { n, p },
        valeur: Math.floor(n / p),
        calcul: `${n} / ${p} = ${court(n / p)}, partie entière ${Math.floor(n / p)}`,
      }
    },
  },
  {
    id: 'nombre_diviseurs',
    quoi: 'Nombre de diviseurs de pᵃ × qᵇ (p, q premiers)',
    formule: '(a + 1)(b + 1)',
    leurres: ['a × b', 'a + b', 'a + b + 2', '2ᵃ⁺ᵇ'],
    rappel: 'Chaque diviseur choisit son exposant de p (0 à a) et de q (0 à b).',
    appliquer(a) {
      const [e2, e3] = [a.entier(1, 4), a.entier(1, 3)]
      const n = 2 ** e2 * 3 ** e3
      return {
        enonce: `Combien de diviseurs a ${nombre(n)} = 2${exposant(e2)} × 3${exposant(e3)} ?`,
        donnees: { a: e2, b: e3 },
        valeur: (e2 + 1) * (e3 + 1),
        calcul: `(${e2} + 1)(${e3} + 1) = ${(e2 + 1) * (e3 + 1)}`,
      }
    },
  },

  /* ---------------------------------------------- second degré, etc. -- */
  {
    id: 'somme_racines',
    quoi: 'ax² + bx + c = 0 : somme des racines',
    formule: '−b / a',
    leurres: ['b / a', 'c / a', '−c / a', '−b / (2a)'],
    rappel: 'Somme −b/a, produit c/a : on trouve souvent les racines de tête.',
    appliquer(a) {
      const [r1, r2] = racines(a)
      return {
        enonce: `${trinome(r1, r2)} = 0 : somme des racines ?`,
        donnees: { r1, r2 },
        valeur: r1 + r2,
        calcul: `−b / a = ${r1 + r2} (racines ${r1} et ${r2})`.replace(/-/g, '−'),
        relatif: true,
      }
    },
  },
  {
    id: 'produit_racines',
    quoi: 'ax² + bx + c = 0 : produit des racines',
    formule: 'c / a',
    leurres: ['−c / a', 'b / a', '−b / a', 'c × a'],
    rappel: 'Somme −b/a, produit c/a. Produit négatif : racines de signes contraires.',
    appliquer(a) {
      const [r1, r2] = racines(a)
      return {
        enonce: `${trinome(r1, r2)} = 0 : produit des racines ?`,
        donnees: { r1, r2 },
        valeur: r1 * r2,
        calcul: `c / a = ${r1 * r2} (racines ${r1} et ${r2})`.replace(/-/g, '−'),
        relatif: true,
      }
    },
  },
  {
    id: 'discriminant',
    quoi: 'Discriminant de ax² + bx + c',
    formule: 'b² − 4ac',
    leurres: ['b² + 4ac', '4ac − b²', 'b² − 2ac', 'b − 4ac'],
    rappel: 'En dernier recours : la somme et le produit, ou une identité remarquable, vont plus vite.',
    appliquer(a) {
      const [A, B, C] = [a.entier(1, 3), a.entier(-9, 9), a.entier(-6, 6)]
      const v = B * B - 4 * A * C
      return {
        enonce: `Discriminant de ${trinomeABC(A, B, C)} ?`,
        donnees: { a: A, b: B, c: C },
        valeur: v,
        calcul: `${B < 0 ? `(${B})` : B}² − 4 × ${A} × ${C < 0 ? `(${C})` : C} = ${v}`.replace(/-/g, '−'),
        relatif: true,
      }
    },
  },
  {
    id: 'produit_en_croix',
    quoi: 'a / b = c / x, donc x = ?',
    formule: 'b × c / a',
    leurres: ['a × c / b', 'a × b / c', 'b / (a × c)', 'a + c − b'],
    rappel: 'Le produit des « diagonales », divisé par le terme restant.',
    appliquer(a) {
      const x0 = a.entier(2, 12)
      const k = a.entier(2, 6)
      const A = a.entier(2, 9)
      const [b, c] = [A * k, x0 * A]
      // a / b = c / x avec a = A, b = A·k, c = x0·A : x = b·c / a = x0·A·k.
      const x = (b * c) / A
      return { enonce: `${A} / ${b} = ${c} / x : x ?`, donnees: { a: A, b, c }, valeur: x, calcul: `${b} × ${c} / ${A} = ${x}` }
    },
  },
]

/** « u₁₂ » : l'indice en chiffres inférieurs. */
function indice(n: number): string {
  return [...String(n)].map((c) => '₀₁₂₃₄₅₆₇₈₉'[Number(c)]).join('')
}

/** Deux racines entières distinctes, non nulles. */
function racines(a: Alea): [number, number] {
  let r1: number, r2: number
  do {
    r1 = a.entier(-6, 9)
    r2 = a.entier(-6, 9)
  } while (r1 === r2 || r1 === 0 || r2 === 0)
  return [r1, r2]
}

/** « x² − 7x + 10 » à partir des racines. */
function trinome(r1: number, r2: number): string {
  return trinomeABC(1, -(r1 + r2), r1 * r2)
}

function trinomeABC(A: number, B: number, C: number): string {
  const morceaux = [A === 1 ? 'x²' : `${A}x²`]
  if (B !== 0) morceaux.push(`${B < 0 ? '−' : '+'} ${Math.abs(B) === 1 ? '' : Math.abs(B)}x`)
  if (C !== 0) morceaux.push(`${C < 0 ? '−' : '+'} ${Math.abs(C)}`)
  return morceaux.join(' ')
}

const PAR_ID = new Map(FORMULES.map((f) => [f.id, f]))

function reconnaitre(a: Alea, f: Formule): Question {
  const options = a.melanger([f.formule, ...a.melanger(f.leurres).slice(0, 4)])
  return {
    jeu: 'formules',
    cle: `formule:${f.id}`,
    enonce: `${f.quoi} ?`,
    attendu: { genre: 'choix', valeur: options.indexOf(f.formule) },
    saisie: 'choix',
    choix: options,
    reponse: f.formule,
    solution: `${f.quoi} : ${f.formule}`,
    astuce: `${f.formule}. ${f.rappel}`,
    table: f.table,
  }
}

function appliquer(a: Alea, f: Formule): Question {
  const ap = f.appliquer!(a)
  const lu = ap.enPi ? pi(ap.valeur) : ap.relatif && ap.valeur > 0 ? `+${court(ap.valeur)}` : court(ap.valeur).replace('-', '−')
  return {
    jeu: 'formules',
    cle: `appli:${f.id}`,
    enonce: ap.enonce,
    aide: ap.enPi ? 'En π : 12π se tape 12 (ou 12π)' : ap.relatif ? 'Avec son signe (+ ou −)' : undefined,
    attendu: { genre: 'nombre', valeur: ap.valeur, tolerance: Number.isInteger(ap.valeur) ? undefined : 0.01 },
    saisie: ap.relatif ? 'relatif' : 'nombre',
    reponse: lu,
    solution: `${ap.calcul}`,
    astuce: `${f.formule} : ${ap.calcul}. ${f.rappel}`,
    table: f.table,
  }
}

export const formules: Jeu = {
  id: 'formules',
  nom: 'Formules flash',
  description: 'Aires, volumes, dénombrement, probabilités, suites, vitesses, moyennes, second degré : reconnaître et appliquer.',
  seuilLentMs: 15000,
  defiDepuis: '2026-10-03',
  produire(a) {
    const f = a.choix(FORMULES)
    return f.appliquer && a.chance(0.5) ? appliquer(a, f) : reconnaitre(a, f)
  },
  produireCle(a, cle) {
    const [genre, id] = cle.split(':')
    const f = PAR_ID.get(id)
    if (!f) return null
    if (genre === 'formule') return reconnaitre(a, f)
    if (genre === 'appli' && f.appliquer) return appliquer(a, f)
    return null
  },
}
