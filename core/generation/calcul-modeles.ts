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

import { fraction, nombre, type Alea } from './alea'
import { qcm, qcmFraction, qcmTexte, type LeurreTexte } from './qcm'
import type { Famille, QuestionGeneree } from './types'

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
    const tirage = a.choix(['On tire successivement deux jetons, sans remise,', 'On tire simultanément deux jetons', 'On prend deux jetons au hasard, d’un seul geste,'])

    const { options, bonneReponse, diagnostics } = qcmFraction(
      a,
      [cas - aucun, cas],
      [
        [[verts * (verts - 1), cas], 'c’est la probabilité de DEUX jetons verts ; « au moins un » accepte aussi un seul'],
        [[aucun, cas], 'c’est la probabilité de n’en tirer AUCUN : il fallait encore la retrancher de 1'],
        [[2 * verts * noirs, cas], 'c’est « exactement un » jeton vert : le cas de deux verts a été oublié'],
        [[total * total - noirs * noirs, total * total], 'le complément a été calculé AVEC remise : le second tirage garde ' + total + ' jetons'],
      ],
      [cas, cas / 2],
      () => [a.entier(1, cas - 1), cas],
    )

    return {
      section: S,
      skillId: auMoinsUne.skillId,
      typeItem: 'qcm',
      enonce:
        `${tirage} d'un sac contenant ${verts} jetons verts ` +
        `et ${noirs} jetons noirs. Quelle est la probabilité d'obtenir au moins un jeton vert ?`,
      options,
      bonneReponse,
      diagnostics,
      rappel: `« Au moins un » → 1 − P(aucun) = 1 − ${noirs}/${total} × ${noirs - 1}/${total - 1} = ${reponse}.`,
      explication:
        `1. « Au moins un » regroupe deux cas (un vert, ou deux verts). Le chemin court passe par le ` +
        `contraire : « aucun vert », c'est-à-dire deux noirs.\n` +
        `2. P(deux noirs) = ${noirs}/${total} × ${noirs - 1}/${total - 1} = ${aucun}/${cas}. Tirer deux jetons d'un coup revient à tirer sans remise : ` +
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

    const { options, bonneReponse, diagnostics } = qcmFraction(
      a,
      [favorables, 36],
      [
        [[1, 11], 'les onze sommes possibles (de 2 à 12) ont été supposées également probables — elles ne le sont pas'],
        [[paires, 21], 'les paires ont été comptées sans ordre (21 paires) : or (2 ; 5) et (5 ; 2) sont deux issues distinctes'],
        [[paires, 36], 'les issues favorables ont été comptées sans ordre, mais divisées par les 36 issues ordonnées'],
        [[1, 6], 'c’est la probabilité d’une face donnée sur UN dé'],
      ],
      [36],
      () => [a.entier(1, 35), 36],
    )

    return {
      section: S,
      skillId: deuxDes.skillId,
      typeItem: 'qcm',
      enonce: `On lance deux dés équilibrés à six faces. Quelle est la probabilité que la somme des deux faces soit égale à ${somme} ?`,
      options,
      bonneReponse,
      diagnostics,
      rappel: `36 issues ordonnées, dont ${favorables} donnent ${somme} : ${favorables}/36${reponse === `${favorables}/36` ? "" : ` = ${reponse}`}.`,
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
  produire: (a) => disqueSansRayon(a),
}

/* ----------------------------------------- volumes : pavé en litres -- */

export const paveLitres: Famille = {
  skillId: 'tm.calcul.aires_et_volumes',
  nom: 'volume d’un pavé, en litres',
  produire: (a) => paveEnSituation(a),
}

/**
 * Le rayon était donné et la formule suffisait (difficulté 2). On part
 * désormais d'une autre grandeur — le périmètre, l'aire, ou deux cercles
 * concentriques — et il faut repasser par le rayon.
 */
function disqueSansRayon(a: Alea): QuestionGeneree {
  const forme = a.choix(['perimetre-vers-aire', 'aire-vers-perimetre', 'couronne'] as const)
  const pi = (k: number, u: string) => `${nombre(k)} π ${u}`

  let bonne: string
  let leurres: LeurreTexte[]
  let enonce: string
  let etapes: string[]
  let secours: () => string

  if (forme === 'couronne') {
    const r = a.entier(2, 8)
    const R = a.entier(r + 1, r + 6)
    bonne = pi(R * R - r * r, 'cm²')
    leurres = [
      [pi((R - r) * (R - r), 'cm²'), 'la différence des rayons a été élevée au carré : on retranche les AIRES, pas les rayons'],
      [pi(R * R + r * r, 'cm²'), 'les deux aires ont été additionnées au lieu d’être retranchées'],
      [pi(R * R, 'cm²'), 'c’est l’aire du grand disque, sans retirer le petit'],
      [pi(2 * (R - r), 'cm²'), 'c’est un calcul de périmètre, pas d’aire'],
    ]
    enonce = `Deux cercles ont le même centre, de rayons ${r} cm et ${R} cm. Quelle est l'aire de la couronne comprise entre eux ?`
    etapes = [
      `Aire de la couronne = aire du grand disque − aire du petit.`,
      `π × ${R}² − π × ${r}² = ${R * R} π − ${r * r} π = ${bonne}.`,
    ]
    secours = () => pi(a.entier(Math.max(1, R * R - r * r - 20), R * R + 10), 'cm²')
  } else {
    const r = a.entier(3, 12)
    if (forme === 'perimetre-vers-aire') {
      bonne = pi(r * r, 'cm²')
      leurres = [
        [pi(4 * r * r, 'cm²'), `le diamètre (${2 * r} cm) a été pris pour le rayon`],
        [pi(2 * r, 'cm²'), 'c’est le coefficient du périmètre, recopié comme une aire'],
        [pi(2 * r * r, 'cm²'), 'un 2 s’est glissé dans l’aire : c’est πr², sans facteur 2'],
        [pi(r, 'cm²'), 'le rayon n’a pas été élevé au carré'],
      ]
      enonce = `Un cercle a un périmètre de ${nombre(2 * r)} π cm. Quelle est l'aire du disque qu'il délimite ?`
      etapes = [`Périmètre = 2πr = ${2 * r} π, donc r = ${r} cm.`, `Aire = πr² = π × ${r}² = ${bonne}.`]
    } else {
      bonne = pi(2 * r, 'cm')
      leurres = [
        [pi(r, 'cm'), 'la formule a perdu son 2 : le périmètre vaut 2πr'],
        [pi(2 * r * r, 'cm'), `l’aire ${r * r} π a été prise pour le rayon`],
        [pi(4 * r, 'cm'), 'le rayon a été doublé deux fois'],
        [pi(r * r, 'cm'), 'c’est l’aire, recopiée comme un périmètre'],
      ]
      enonce = `Un disque a une aire de ${nombre(r * r)} π cm². Quel est le périmètre du cercle qui le borde ?`
      etapes = [`Aire = πr² = ${r * r} π, donc r² = ${r * r} et r = ${r} cm.`, `Périmètre = 2πr = 2 × π × ${r} = ${bonne}.`]
    }
    secours = () => pi(a.entier(Math.max(1, r - 2), 4 * r * r), forme === 'perimetre-vers-aire' ? 'cm²' : 'cm')
  }

  const { options, bonneReponse, diagnostics } = qcmTexte(a, bonne, leurres, secours)
  return {
    section: S,
    skillId: 'tm.calcul.geometrie_plane',
    typeItem: 'qcm',
    enonce,
    options,
    bonneReponse,
    diagnostics,
    rappel: etapes.join(' '),
    explication:
      etapes.map((e, i) => `${i + 1}. ${e}`).join('\n') +
      `\nLe piège : appliquer une formule à la grandeur donnée sans repasser par le rayon. ` +
      `Les propositions sont en « π » : on compare les coefficients, sans jamais remplacer π par 3,14.`,
    difficulte: 3,
  }
}

/**
 * Le volume d'un aquarium plein se calculait d'un produit et d'une
 * conversion (difficulté 2). On demande maintenant la hauteur atteinte par
 * l'eau versée, ou un volume aux dimensions données dans trois unités.
 */
function paveEnSituation(a: Alea): QuestionGeneree {
  if (a.chance(0.5)) {
    const [L, l] = [a.entier(3, 8) * 10, a.entier(2, 5) * 10]
    const h = a.entier(1, 5) * 5
    const litres = (L * l * h) / 1000
    if (!Number.isInteger(litres)) return paveEnSituation(a)
    const { options, bonneReponse, diagnostics } = qcm(
      a,
      h,
      [
        [h * 10, 'la conversion a été faite avec 100 cm³ par litre au lieu de 1 000'],
        [h / 10, 'les litres ont été convertis en dm³ mais la hauteur est restée en dm'],
        [Math.round((litres / (L + l)) * 10) / 10, 'les dimensions du fond ont été additionnées au lieu d’être multipliées'],
        [litres, 'le nombre de litres a été pris pour une hauteur'],
      ],
      (n) => `${nombre(n, Number.isInteger(n) ? 0 : 1)} cm`,
      { minimum: 0 },
    )
    return {
      section: S,
      skillId: 'tm.calcul.aires_et_volumes',
      typeItem: 'qcm',
      enonce: `On verse ${nombre(litres)} litres d'eau dans un aquarium vide, en forme de pavé, de ${L} cm de long et ${l} cm de large. Jusqu'à quelle hauteur l'eau monte-t-elle ?`,
      options,
      bonneReponse,
      diagnostics,
      rappel: `${nombre(litres)} L = ${nombre(litres * 1000)} cm³ ; ÷ (${L} × ${l} = ${L * l} cm²) = ${h} cm.`,
      explication:
        `1. Convertir le volume : 1 L = 1 000 cm³, donc ${nombre(litres)} L = ${nombre(litres * 1000)} cm³.\n` +
        `2. Le fond mesure ${L} × ${l} = ${nombre(L * l)} cm².\n` +
        `3. Volume = fond × hauteur, donc hauteur = ${nombre(litres * 1000)} ÷ ${nombre(L * l)} = ${h} cm.\n` +
        `Le piège : oublier la conversion, ou la faire avec 100 au lieu de 1 000. En dm, c'est immédiat : ` +
        `fond ${L / 10} × ${l / 10} = ${(L * l) / 100} dm², et ${nombre(litres)} dm³ ÷ ${(L * l) / 100} = ${h / 10} dm = ${h} cm.`,
      difficulte: 3,
    }
  }

  // Trois unités dans le même énoncé : m, dm et cm.
  const Lm = a.choix([1, 1.2, 1.5, 2])
  const ldm = a.entier(3, 8)
  const hcm = a.entier(2, 6) * 10
  const arrondi = (x: number) => Math.round(x * 1000) / 1000
  const litres = arrondi(Lm * 10 * ldm * (hcm / 10))
  // Attention : multiplier les trois nombres tels quels (m × dm × cm) redonne
  // exactement le bon résultat (le ×10 et le ÷10 se compensent) ; ce n'est
  // donc pas un leurre.
  const { options, bonneReponse, diagnostics } = qcm(
    a,
    litres,
    [
      [litres * 10, 'la profondeur est restée en centimètres au lieu de passer en décimètres'],
      [arrondi(litres / 10), 'la longueur est restée en mètres au lieu de passer en décimètres'],
      [arrondi((Lm * ldm * hcm) / 1000), 'les trois nombres ont été multipliés tels quels, puis divisés par 1 000 comme des cm³'],
      [litres * 100, 'longueur et profondeur ont toutes deux été mal converties'],
    ],
    (n) => `${nombre(n, Number.isInteger(n) ? 0 : 1)} L`,
    { minimum: 0 },
  )
  return {
    section: S,
    skillId: 'tm.calcul.aires_et_volumes',
    typeItem: 'qcm',
    enonce: `Un bac en forme de pavé mesure ${nombre(Lm, Number.isInteger(Lm) ? 0 : 1)} m de long, ${ldm} dm de large et ${hcm} cm de profondeur. Combien de litres contient-il une fois plein ?`,
    options,
    bonneReponse,
    diagnostics,
    rappel: `Tout en dm : ${nombre(Lm * 10)} × ${ldm} × ${hcm / 10} = ${nombre(litres)} dm³ = ${nombre(litres)} L.`,
    explication:
      `1. Ramener les trois dimensions à la même unité. Le décimètre est le bon choix : 1 dm³ = 1 L.\n` +
      `2. ${nombre(Lm, Number.isInteger(Lm) ? 0 : 1)} m = ${nombre(Lm * 10)} dm ; ${ldm} dm ; ${hcm} cm = ${hcm / 10} dm.\n` +
      `3. Volume : ${nombre(Lm * 10)} × ${ldm} × ${hcm / 10} = ${nombre(litres)} dm³, soit ${nombre(litres)} L.\n` +
      `Le piège : convertir une dimension et pas les autres, ou travailler en cm³ puis oublier de diviser par 1 000. ` +
      `Tout passer en dm, c'est un seul type de conversion et aucune division à la fin.`,
    difficulte: 3,
  }
}

/* --------------------------------------------- suites géométriques -- */

export const suiteGeometrique: Famille = {
  skillId: 'tm.calcul.suites_et_progressions',
  nom: 'progression géométrique',
  produire(a) {
    // Le terme direct (« combien le 7ᵉ jour ? ») se réglait d'une puissance
    // (difficulté 2). Restent deux formes à reconstruire : le seuil (quel
    // jour le nombre dépasse-t-il N ?) et la balle, qu'on remonte à l'envers.
    if (a.chance(0.5)) return seuilGeometrique(a)
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
      // La suite n'est jamais nommée : il faut la reconnaître dans la situation,
      // et compter soi-même les étapes — c'est là que se loge le piège.
      enonce: a.choix([
        `Une balle est lâchée ; à chaque rebond, elle remonte à une hauteur ${q === 2 ? 'deux' : 'trois'} fois plus petite. ` +
          `Après le ${n - 1}ᵉ rebond, elle remonte à ${nombre(u1)} cm. De quelle hauteur, en cm, avait-elle été lâchée ?`,
      ]),
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
      difficulte: 3,
    }
  },
}

/**
 * « Quel jour le nombre dépasse-t-il N ? » On ne calcule pas un terme, on
 * cherche le premier qui franchit un seuil : écrire les termes jusqu'au
 * dépassement, et ne pas se tromper d'une unité sur le rang.
 */
function seuilGeometrique(a: Alea): QuestionGeneree {
  const u1 = a.entier(2, 9)
  const q = a.choix([2, 3])
  const n = a.entier(4, q === 2 ? 9 : 6)
  // Le seuil tombe strictement entre le terme n − 1 et le terme n.
  const avant = u1 * q ** (n - 2)
  const apres = u1 * q ** (n - 1)
  const seuil = Math.round((avant + (apres - avant) * a.choix([0.3, 0.5, 0.7])) / 10) * 10 || avant + 1
  const N = seuil > avant && seuil < apres ? seuil : avant + 1
  const abonnes = a.chance(0.5)
  const jour = (k: number) => (k === 1 ? '1ᵉʳ jour' : `${k}ᵉ jour`)

  const { options, bonneReponse, diagnostics } = qcm(
    a,
    n,
    [
      [n - 1, `c’est le dernier jour SOUS le seuil : ${nombre(avant)} ne dépasse pas ${nombre(N)}`],
      [n + 1, 'un jour de trop : le seuil est déjà franchi la veille'],
      [n - 2, `le ${jour(n - 2)} ne donne que ${nombre(avant / q)} : les multiplications ont été comptées comme des jours`],
    ],
    jour,
    { minimum: 2 },
  )
  const termes = Array.from({ length: n }, (_, i) => nombre(u1 * q ** i)).join(', ')
  return {
    section: S,
    skillId: 'tm.calcul.suites_et_progressions',
    typeItem: 'qcm',
    enonce: abonnes
      ? `Le 1ᵉʳ jour, une page compte ${nombre(u1)} abonnés ; chaque jour, ce nombre est multiplié par ${q === 2 ? 'deux' : 'trois'}. Quel jour dépasse-t-il pour la première fois ${nombre(N)} abonnés ?`
      : `Le 1ᵉʳ jour, ${nombre(u1)} personnes connaissent une rumeur ; chaque jour, ce nombre ${q === 2 ? 'double' : 'triple'}. Quel jour plus de ${nombre(N)} personnes la connaissent-elles pour la première fois ?`,
    options,
    bonneReponse,
    diagnostics,
    rappel: `${termes} : le ${jour(n)} est le premier au-dessus de ${nombre(N)}.`,
    explication:
      `1. Le jour k, le nombre vaut ${nombre(u1)} × ${q}^(k − 1) : le 1ᵉʳ jour n'a subi aucune multiplication.\n` +
      `2. On écrit les termes jusqu'à franchir ${nombre(N)} : ${termes}.\n` +
      `3. Le ${jour(n - 1)} donne ${nombre(avant)}, encore sous le seuil ; le ${jour(n)} donne ${nombre(apres)}, au-dessus.\n` +
      `Le piège : répondre le ${jour(n - 1)}, ou compter les multiplications au lieu des jours. Le rang dépasse d'une unité le nombre de multiplications.`,
    difficulte: 3,
  }
}

export const MODELES_CALCUL_SUPPLEMENTAIRES: Famille[] = [auMoinsUne, deuxDes, disque, paveLitres, suiteGeometrique]
