/**
 * Calcul — modèles supplémentaires pour les types qui n'en avaient qu'un.
 *
 * Probabilités, géométrie plane, aires et volumes, suites : chacun de ces
 * types tenait en un seul scénario (l'urne, le triangle rectangle, le
 * rectangle à périmètre donné, la progression arithmétique). Une série ciblée
 * servait neuf fois le même problème avec d'autres nombres, et la réussite
 * mesurait la familiarité avec le scénario plus que la méthode.
 *
 * Mêmes principes que calcul.ts : la réponse est calculée à partir des
 * paramètres, les leurres sont des erreurs de méthode nommées. Les énoncés
 * commencent autrement que les modèles existants, pour que le tirage les
 * reconnaisse comme des modèles distincts (core/scheduler/tirage.ts).
 */

import { fraction, nombre } from './alea'
import { qcm, qcmTexte } from './qcm'
import type { Famille } from './types'

const S = 'calcul' as const

/* ------------------------------------- probabilités : au moins une -- */

export const auMoinsUne: Famille = {
  skillId: 'tm.calcul.probabilites',
  nom: 'au moins un succès, par l’événement contraire',
  produire(a) {
    const verts = a.entier(2, 6)
    const noirs = a.entier(3, 8)
    const total = verts + noirs
    const cas = total * (total - 1)
    const aucun = noirs * (noirs - 1)
    const reponse = fraction(cas - aucun, cas)

    const { options, bonneReponse, diagnostics } = qcmTexte(
      a,
      reponse,
      [
        [fraction(verts * (verts - 1), cas), 'c’est la probabilité de DEUX jetons verts ; « au moins un » accepte aussi un seul'],
        [fraction(aucun, cas), 'c’est la probabilité de n’en tirer AUCUN : il fallait encore la retrancher de 1'],
        [fraction(2 * verts * noirs, cas), 'c’est « exactement un » jeton vert : le cas de deux verts a été oublié'],
        [fraction(total * total - noirs * noirs, total * total), 'le complément a été calculé AVEC remise : le second tirage garde ' + total + ' jetons'],
      ],
      () => fraction(a.entier(1, cas - 1), cas),
    )

    return {
      section: S,
      skillId: auMoinsUne.skillId,
      typeItem: 'qcm',
      enonce:
        `On tire successivement deux jetons, sans remise, d'un sac contenant ${verts} jetons verts ` +
        `et ${noirs} jetons noirs. Quelle est la probabilité d'obtenir au moins un jeton vert ?`,
      options,
      bonneReponse,
      diagnostics,
      rappel: `« Au moins un » → 1 − P(aucun) = 1 − ${noirs}/${total} × ${noirs - 1}/${total - 1} = ${reponse}.`,
      explication:
        `1. « Au moins un » regroupe deux cas (un vert, ou deux verts). Le chemin court passe par le ` +
        `contraire : « aucun vert », c'est-à-dire deux noirs.\n` +
        `2. P(deux noirs) = ${noirs}/${total} × ${noirs - 1}/${total - 1} = ${aucun}/${cas}. Sans remise, ` +
        `les deux nombres baissent d'une unité au second tirage.\n` +
        `3. P(au moins un vert) = 1 − ${aucun}/${cas} = ${cas - aucun}/${cas} = ${reponse}.\n` +
        `Le réflexe : dès que l'énoncé dit « au moins un », calculer le contraire et le retrancher de 1. ` +
        `L'erreur la plus fréquente est de s'arrêter à P(aucun), ou de ne compter que « exactement un ».`,
      difficulte: 3,
    }
  },
}

/* --------------------------------------- probabilités : deux dés -- */

export const deuxDes: Famille = {
  skillId: 'tm.calcul.probabilites',
  nom: 'somme de deux dés',
  produire(a) {
    // 7 exclu : sa probabilité (1/6) coïnciderait avec le leurre « un seul dé ».
    const somme = a.choix([3, 4, 5, 6, 8, 9, 10, 11])
    const favorables = 6 - Math.abs(somme - 7)
    const paires = Math.ceil(favorables / 2)
    const reponse = fraction(favorables, 36)
    const couples = Array.from({ length: 6 }, (_, i) => i + 1)
      .filter((x) => somme - x >= 1 && somme - x <= 6)
      .map((x) => `(${x} ; ${somme - x})`)
      .join(', ')

    const { options, bonneReponse, diagnostics } = qcmTexte(
      a,
      reponse,
      [
        ['1/11', 'les onze sommes possibles (de 2 à 12) ont été supposées également probables — elles ne le sont pas'],
        [fraction(paires, 21), 'les paires ont été comptées sans ordre (21 paires) : or (2 ; 5) et (5 ; 2) sont deux issues distinctes'],
        [fraction(paires, 36), 'les issues favorables ont été comptées sans ordre, mais divisées par les 36 issues ordonnées'],
        ['1/6', 'c’est la probabilité d’une face donnée sur UN dé'],
      ],
      () => fraction(a.entier(1, 35), 36),
    )

    return {
      section: S,
      skillId: deuxDes.skillId,
      typeItem: 'qcm',
      enonce: `On lance deux dés équilibrés à six faces. Quelle est la probabilité que la somme des deux faces soit égale à ${somme} ?`,
      options,
      bonneReponse,
      diagnostics,
      rappel: `36 issues ordonnées, dont ${favorables} donnent ${somme} : ${favorables}/36 = ${reponse}.`,
      explication:
        `1. Deux dés distincts donnent 6 × 6 = 36 issues, toutes également probables — à condition de ` +
        `les compter DANS L'ORDRE : (1 ; 2) et (2 ; 1) sont deux issues différentes.\n` +
        `2. Les issues de somme ${somme} : ${couples}, soit ${favorables}.\n` +
        `3. P = ${favorables}/36 = ${reponse}.\n` +
        `Les sommes ne sont pas équiprobables : 7 sort six fois sur 36, 2 et 12 une seule fois. ` +
        `Le repère : le nombre d'issues vaut 6 − |somme − 7|.`,
      difficulte: 3,
    }
  },
}

/* ------------------------------------------- géométrie : le disque -- */

export const disque: Famille = {
  skillId: 'tm.calcul.geometrie_plane',
  nom: 'périmètre et aire du disque',
  produire(a) {
    // À partir de 3 : pour r = 2, r² et 2r coïncident et deux leurres disparaissent.
    const rayon = a.entier(3, 12)
    const perimetre = a.chance(0.5)
    const u = perimetre ? 'cm' : 'cm²'
    const pi = (k: number) => `${nombre(k)} π ${u}`
    const bonne = perimetre ? pi(2 * rayon) : pi(rayon * rayon)

    const { options, bonneReponse, diagnostics } = qcmTexte(
      a,
      bonne,
      perimetre
        ? [
            [pi(rayon), 'la formule a perdu son 2 : le périmètre vaut 2πr, pas πr'],
            [pi(4 * rayon), `le diamètre (${nombre(2 * rayon)} cm) a été pris pour le rayon`],
            [pi(rayon * rayon), 'c’est l’aire (πr²), pas le périmètre'],
            [pi(2 * rayon * rayon), 'la formule du périmètre a été mêlée à celle de l’aire : 2πr²'],
          ]
        : [
            [pi(4 * rayon * rayon), `le diamètre (${nombre(2 * rayon)} cm) a été élevé au carré à la place du rayon`],
            [pi(2 * rayon), 'c’est le périmètre (2πr), pas l’aire'],
            [pi(2 * rayon * rayon), 'un 2 s’est glissé dans l’aire : c’est πr², sans facteur 2'],
            [pi(rayon), 'le rayon n’a pas été élevé au carré'],
          ],
      // Complément du même ordre de grandeur : un « 147 π » s'écarte sans réfléchir.
      () => pi(a.entier(Math.max(1, rayon - 2), perimetre ? 4 * rayon + 2 : rayon * rayon + 2 * rayon)),
    )

    return {
      section: S,
      skillId: disque.skillId,
      typeItem: 'qcm',
      enonce: `Un disque a pour rayon ${nombre(rayon)} cm. ` + (perimetre ? `Quel est son périmètre ?` : `Quelle est son aire ?`),
      options,
      bonneReponse,
      diagnostics,
      rappel: perimetre
        ? `Périmètre = 2πr = 2 × π × ${nombre(rayon)} = ${bonne}.`
        : `Aire = πr² = π × ${nombre(rayon)}² = ${bonne}.`,
      explication: perimetre
        ? `1. Le périmètre d'un cercle vaut 2πr, soit π fois le diamètre.\n` +
          `2. 2 × π × ${nombre(rayon)} = ${bonne}.\n` +
          `Les propositions sont écrites en « π cm » : inutile de remplacer π par 3,14, il suffit de comparer ` +
          `le coefficient. Le contrôle d'unité départage aussi : un périmètre est en cm, une aire en cm².`
        : `1. L'aire d'un disque vaut πr² : c'est le RAYON qu'on élève au carré.\n` +
          `2. π × ${nombre(rayon)}² = π × ${nombre(rayon * rayon)} = ${bonne}.\n` +
          `L'erreur classique : élever le diamètre au carré, ce qui quadruple l'aire. Si l'énoncé donnait le ` +
          `diamètre, il faudrait d'abord le diviser par 2.`,
      difficulte: 2,
    }
  },
}

/* ----------------------------------------- volumes : pavé en litres -- */

export const paveLitres: Famille = {
  skillId: 'tm.calcul.aires_et_volumes',
  nom: 'volume d’un pavé, en litres',
  produire(a) {
    // Dimensions multiples de 10 : le volume tombe sur un nombre entier de litres.
    const [longueur, largeur, hauteur] = [a.entier(3, 8) * 10, a.entier(2, 5) * 10, a.entier(2, 6) * 10]
    const cm3 = longueur * largeur * hauteur
    const litres = cm3 / 1000

    const { options, bonneReponse, diagnostics } = qcm(
      a,
      litres,
      [
        [cm3 / 100, 'la conversion a divisé par 100 : or 1 L = 1 dm³ = 1 000 cm³'],
        [cm3, 'le volume est resté en cm³ : il fallait le convertir en litres'],
        [(longueur * largeur) / 1000, 'la hauteur a été oubliée : c’est la surface du fond, convertie comme un volume'],
        [cm3 / 10_000, 'la conversion a divisé par 10 000 au lieu de 1 000'],
      ],
      (n) => `${nombre(n, Number.isInteger(n) ? 0 : 2)} L`,
      { minimum: 0 },
    )

    return {
      section: S,
      skillId: paveLitres.skillId,
      typeItem: 'qcm',
      enonce:
        `Un aquarium a la forme d'un pavé de ${nombre(longueur)} cm de long, ${nombre(largeur)} cm de large ` +
        `et ${nombre(hauteur)} cm de haut. Quelle quantité d'eau contient-il une fois plein ?`,
      options,
      bonneReponse,
      diagnostics,
      rappel: `${nombre(longueur)} × ${nombre(largeur)} × ${nombre(hauteur)} = ${nombre(cm3)} cm³ = ${nombre(litres)} L (1 L = 1 000 cm³).`,
      explication:
        `1. Volume d'un pavé : longueur × largeur × hauteur = ${nombre(longueur)} × ${nombre(largeur)} × ` +
        `${nombre(hauteur)} = ${nombre(cm3)} cm³.\n` +
        `2. Conversion : 1 L = 1 dm³, et 1 dm³ = 10 cm × 10 cm × 10 cm = 1 000 cm³.\n` +
        `3. ${nombre(cm3)} ÷ 1 000 = ${nombre(litres)} L.\n` +
        `Le raccourci : convertir d'abord chaque dimension en dm (${nombre(longueur / 10)}, ${nombre(largeur / 10)}, ` +
        `${nombre(hauteur / 10)}) donne directement des litres : ${nombre(longueur / 10)} × ${nombre(largeur / 10)} × ` +
        `${nombre(hauteur / 10)} = ${nombre(litres)}.`,
      difficulte: 2,
    }
  },
}

/* --------------------------------------------- suites géométriques -- */

export const suiteGeometrique: Famille = {
  skillId: 'tm.calcul.suites_et_progressions',
  nom: 'progression géométrique',
  produire(a) {
    const u1 = a.entier(2, 6)
    const q = a.choix([2, 3])
    const n = a.entier(4, q === 2 ? 8 : 6)
    const un = u1 * q ** (n - 1)

    const { options, bonneReponse, diagnostics } = qcm(
      a,
      un,
      [
        [u1 * q ** n, `${n} multiplications au lieu de ${n - 1} : le premier terme n'en a subi aucune`],
        [u1 * q ** (n - 2), `une multiplication de trop peu : ${n - 2} au lieu de ${n - 1}`],
        [u1 + (n - 1) * q, 'la suite a été traitée comme arithmétique : on a ajouté la raison au lieu de multiplier'],
        [u1 * q * (n - 1), `la raison a été multipliée par ${n - 1} au lieu d'être élevée à la puissance ${n - 1}`],
      ],
      (v) => nombre(v),
      { minimum: 0 },
    )

    const termes = Array.from({ length: Math.min(n, 4) }, (_, i) => nombre(u1 * q ** i)).join(', ')

    return {
      section: S,
      skillId: suiteGeometrique.skillId,
      typeItem: 'qcm',
      enonce:
        `Une suite géométrique a pour premier terme ${nombre(u1)} et pour raison ${q}. ` +
        `Quelle est la valeur de son ${n}ᵉ terme ?`,
      options,
      bonneReponse,
      diagnostics,
      rappel: `u${n} = u1 × q^(${n} − 1) = ${nombre(u1)} × ${q}^${n - 1} = ${nombre(un)}.`,
      explication:
        `1. Dans une suite géométrique, on passe d'un terme au suivant en MULTIPLIANT par la raison : ` +
        `${termes}…\n` +
        `2. Du 1ᵉʳ au ${n}ᵉ terme, il y a ${n - 1} multiplications : u${n} = ${nombre(u1)} × ${q}^${n - 1}.\n` +
        `3. ${q}^${n - 1} = ${nombre(q ** (n - 1))}, donc u${n} = ${nombre(u1)} × ${nombre(q ** (n - 1))} = ${nombre(un)}.\n` +
        `Le piège est le même que pour les suites arithmétiques : compter ${n} étapes au lieu de ${n - 1}. ` +
        `Écrire les trois premiers termes à la main suffit à le déjouer.`,
      difficulte: 2,
    }
  },
}

export const MODELES_CALCUL_SUPPLEMENTAIRES: Famille[] = [auMoinsUne, deuxDes, disque, paveLitres, suiteGeometrique]
