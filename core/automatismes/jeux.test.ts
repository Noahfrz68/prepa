import { describe, expect, it } from 'vitest'
import { aleaDepuis, ALPHABET } from '@/core/generation/alea'
import { TABLES } from '@/exams/tagemage/lecons'
import { ECART_MIN, JEUX, jeu, questionSuivante, seuilLent, serie, verifier } from './index'
import type { Attendu, Question } from './types'

const TIRAGES = 3000

/** Toutes les questions d'un jeu sur un grand tirage, toujours le même. */
function tirage(id: string): Question[] {
  const j = jeu(id)!
  const a = aleaDepuis(20261001)
  return Array.from({ length: TIRAGES }, () => j.produire(a))
}

const TOUTES = new Map(JEUX.map((j) => [j.id, tirage(j.id)]))
const toutes = () => [...TOUTES.values()].flat()

/** Les nombres d'un énoncé, milliers recollés et virgule lue : « 1 024 ÷ 8 » → [1024, 8]. */
function nombresDe(texte: string): number[] {
  return (texte.replace(/(\d)[   ](?=\d{3})/g, '$1').match(/[+−-]?\d+(?:,\d+)?/g) ?? []).map((s) =>
    Number(s.replace('−', '-').replace(',', '.')),
  )
}

function premierParCrible(n: number): boolean {
  if (n < 2) return false
  for (let d = 2; d < n; d++) if (n % d === 0) return false
  return true
}

/** La valeur attendue, recalculée sans passer par le générateur. */
function recalcul(q: Question): number | string | boolean | typeof SANS_RECALCUL {
  const [genre, param] = q.cle.split(':')
  const n = Number(param)
  const nb = nombresDe(q.enonce)
  switch (genre) {
    case 'carre': return n * n
    case 'cube': return n ** 3
    case 'deux': return 2 ** n
    case 'racine': case 'racine3': case 'log2': return n
    case 'rang': return ALPHABET.indexOf(param) + 1
    case 'lettre': return ALPHABET[n - 1]
    case 'rebours': return 26 - ALPHABET.indexOf(param)
    case 'premier': return premierParCrible(n)
    case 'divisible': return nb[0] % nb[1] === 0
    case 'decomposition': return nb[0]
    case 'pourcent': { const [a, b] = param.split('/').map(Number); return (100 * a) / b }
    case 'decimal': { const [a, b] = param.split('/').map(Number); return a / b }
    case 'fraction': { const [a, b] = param.split('/').map(Number); return a / b }
    case 'coef': return 1 + n / 100
    case 'annulation': return (100 / (100 + n) - 1) * 100
    case 'table': case 'x5': case 'x25': case 'x11': case 'produit': return nb[0] * nb[1]
    case 'division': return nb[0] / nb[1]
    case 'pourcentage': return (nb[0] * nb[1]) / 100
    case 'successives': return ((100 + nb[0]) * (100 + nb[1])) / 100 - 100
    case 'ordre': return plusProche(q, exactOrdre(param, nb))
    case 'suite': return suivant(param, q.enonce, nb)
    case 'calendrier': return jourAttendu(param, q.enonce, nb)
    case 'pythagore': return pythagoreAttendu(q.enonce, nb)
    case 'identite': return param.startsWith('carre') ? nb[0] ** 2 : param === 'conjugues' ? nb[0] * nb[1] : optionEgale(q)
    // Les formules ont leur fichier de tests : on y recalcule chaque application depuis ses données.
    case 'formule': case 'appli': return SANS_RECALCUL
  }
  throw new Error(`Clé inconnue : ${q.cle}`)
}

/** La valeur exacte d'un calcul d'ordre de grandeur, lue dans l'énoncé. */
function exactOrdre(genre: string, nb: number[]): number {
  switch (genre) {
    case 'produit': return nb[0] * nb[1]
    case 'quotient': return nb[0] / nb[1]
    case 'pourcentage': return (nb[0] * nb[1]) / 100
    case 'racine': return Math.sqrt(nb[0])
  }
  throw new Error(genre)
}

/** L'indice de la proposition la plus proche, en rapport. */
function plusProche(q: Question, exact: number): number {
  const ecarts = q.choix!.map((c) => Math.abs(Math.log(Number(c.replace(/\s/g, '').replace(',', '.')) / exact)))
  return ecarts.indexOf(Math.min(...ecarts))
}

/** Le terme suivant, recalculé depuis les termes affichés. */
function suivant(genre: string, enonce: string, t: number[]): number | string {
  if (genre.startsWith('lettres_')) {
    const r = (enonce.match(/[A-Z]/g) ?? []).map((l) => ALPHABET.indexOf(l) + 1)
    const x = {
      lettres_saut: r[4] + (r[4] - r[3]),
      lettres_croissant: r[4] + (r[4] - r[3]) + 1,
      lettres_rebours: r[4] - (r[3] - r[4]),
      lettres_alternee: r[4] + (r[1] - r[0]),
    }[genre]!
    return ALPHABET[x - 1]
  }
  switch (genre) {
    case 'arithmetique': return t[4] + (t[4] - t[3])
    case 'geometrique': return t[4] * (t[4] / t[3])
    case 'ecart_croissant': return t[4] + (t[4] - t[3]) + (t[4] - t[3] - (t[3] - t[2]))
    case 'alternee': return t[4] + (t[1] - t[0])
    case 'fibonacci': return t[3] + t[4]
    case 'entrelacees': return t[3] + (t[3] - t[1])
    case 'puissances': {
      const carres = t.every((x, i) => Math.sqrt(x) === Math.sqrt(t[0]) + i)
      return carres ? (Math.sqrt(t[4]) + 1) ** 2 : (Math.round(Math.cbrt(t[4])) + 1) ** 3
    }
  }
  throw new Error(genre)
}

const JOURS = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche']
const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']

/** Les dates « 3 février 2027 » d'un énoncé, en jours de la semaine (lundi = 0) selon le vrai calendrier. */
function joursDesDates(enonce: string): number[] {
  return [...enonce.matchAll(/(\d+|1er) ([a-zéû]+) (\d{4})/g)].map(([, j, m, an]) =>
    (new Date(Date.UTC(Number(an), MOIS.indexOf(m), j === '1er' ? 1 : Number(j))).getUTCDay() + 6) % 7,
  )
}

function jourAttendu(genre: string, enonce: string, nb: number[]): number {
  if (genre === 'dates') return joursDesDates(enonce)[1]
  const j = JOURS.indexOf(enonce.match(/sommes ([a-z]+)/)![1])
  const k = nb.at(-1)!
  return (((genre === 'dans' ? j + k : j - k) % 7) + 7) % 7
}

/** Marque les clés recalculées ailleurs. */
const SANS_RECALCUL = Symbol('sans recalcul')

/** Triplets : hypoténuse, côté manquant, ou « est-il rectangle ». */
function pythagoreAttendu(enonce: string, nb: number[]): number | boolean {
  if (enonce.startsWith('Un triangle de côtés')) {
    const [x, y, z] = [...nb].sort((a, b) => a - b)
    return x * x + y * y === z * z
  }
  if (enonce.includes('hypoténuse ?')) return Math.sqrt(nb[0] ** 2 + nb[1] ** 2)
  return Math.sqrt(nb[0] ** 2 - nb[1] ** 2)
}

/** Une expression en x, telle qu'écrite (« (2x − 3)² », « 4x² + 12x + 9 »), évaluée en x. */
export function evaluer(expr: string, x: number): number {
  const js = expr
    .replace(/ = \?$/, '')
    .replace(/−/g, '-')
    .replace(/²/g, '**2')
    .replace(/(\d|\))(?=[x(])/g, '$1*')
  return new Function('x', `return ${js}`)(x) as number
}

/** L'indice de l'unique proposition égale à l'énoncé, comparées en deux points. */
function optionEgale(q: Question): number {
  const egales = q.choix!.map((c, i) =>
    [1.37, -2.11].every((x) => Math.abs(evaluer(c, x) - evaluer(q.enonce, x)) < 1e-9) ? i : -1,
  ).filter((i) => i >= 0)
  if (egales.length !== 1) throw new Error(`${q.enonce} : ${egales.length} propositions égales (${q.choix!.join(' | ')})`)
  return egales[0]
}

function valeurDe(at: Attendu): number | string | boolean {
  switch (at.genre) {
    case 'fraction': return at.numerateur / at.denominateur
    default: return at.valeur
  }
}

/** Une réponse à coup sûr fausse, pour vérifier qu'elle est refusée. */
function fausse(at: Attendu): string {
  switch (at.genre) {
    case 'nombre': return String(at.valeur + 1)
    case 'fraction': return `${at.numerateur + 1}/${at.denominateur}`
    case 'lettre': return at.valeur === 'A' ? 'B' : 'A'
    case 'ouinon': return at.valeur ? 'non' : 'oui'
    case 'facteurs': return `2 × ${at.valeur}`
    case 'choix': return String(at.valeur + 1)
  }
}

describe('automatismes — chaque question est juste', () => {
  it.each(JEUX.map((j) => j.id))('%s : la valeur attendue est la bonne', (id) => {
    for (const q of TOUTES.get(id as never)!) {
      const v = valeurDe(q.attendu)
      const r = recalcul(q)
      if (r === SANS_RECALCUL) continue
      if (typeof r === 'number') expect(v as number, `${q.cle} · ${q.enonce}`).toBeCloseTo(r, 9)
      else expect(v, `${q.cle} · ${q.enonce}`).toBe(r)
    }
  })

  it('accepte la réponse affichée, refuse une réponse fausse', () => {
    for (const q of toutes()) {
      const affichee = q.attendu.genre === 'choix' ? String(q.attendu.valeur) : q.reponse.replace(/^[≈×]\s*/, '')
      expect(verifier(q.attendu, affichee), `${q.enonce} → « ${q.reponse} »`).toBe(true)
      expect(verifier(q.attendu, fausse(q.attendu)), `${q.enonce} → ${fausse(q.attendu)}`).toBe(false)
    }
  })

  it('écrit des corrections propres, et renvoie à une table qui existe', () => {
    const titres = new Set(TABLES.map((t) => t.titre))
    for (const q of toutes()) {
      for (const texte of [q.enonce, q.reponse, q.solution, q.astuce]) {
        expect(texte, q.cle).toBeTruthy()
        expect(texte, q.cle).not.toMatch(/undefined|NaN|Infinity|\d\.\d/)
      }
      if (q.table) expect(titres.has(q.table), q.table).toBe(true)
    }
  })

  // Le pavé décimal de l'iPhone n'a pas de « − » : une réponse négative y
  // serait impossible à taper.
  it('propose un clavier avec signe dès qu’une réponse peut être négative', () => {
    for (const q of toutes()) {
      if (q.attendu.genre === 'nombre' && q.attendu.valeur < 0) expect(q.saisie, q.enonce).toBe('relatif')
    }
  })

  it('montre la réponse dans la correction longue des faits à apprendre', () => {
    for (const q of toutes().filter((q) => /^(carre|cube|deux|rang|lettre|rebours|pourcentage|successives)/.test(q.cle))) {
      expect(q.astuce, q.cle).toContain(q.reponse)
    }
  })
})

describe('automatismes — jeux à propositions', () => {
  it('ordres de grandeur : cinq valeurs distinctes, une seule à moins de 25 % de la valeur exacte', () => {
    for (const q of TOUTES.get('ordres')!) {
      expect(q.choix, q.enonce).toHaveLength(5)
      expect(new Set(q.choix).size, q.enonce).toBe(5)
      const [genre] = q.cle.split(':').slice(1)
      const exact = exactOrdre(genre, nombresDe(q.enonce))
      const proches = q.choix!.filter((c) => {
        const v = Number(c.replace(/\s/g, '').replace(',', '.'))
        return Math.abs(v / exact - 1) < 0.25
      })
      expect(proches, `${q.enonce} : ${q.choix!.join(' / ')}`).toEqual([q.reponse])
    }
  })

  it('calendrier : le jour annoncé dans l’énoncé est le vrai', () => {
    for (const q of TOUTES.get('calendrier')!.filter((x) => x.cle === 'calendrier:dates')) {
      const annonce = JOURS.indexOf(q.enonce.match(/est un ([a-z]+)\./)![1])
      expect(annonce, q.enonce).toBe(joursDesDates(q.enonce)[0])
    }
  })

  it('suites : des termes positifs, et des lettres dans l’alphabet', () => {
    for (const q of TOUTES.get('suites')!) {
      if (q.attendu.genre === 'nombre') expect(q.attendu.valeur, q.enonce).toBeGreaterThan(0)
      else expect(q.attendu.genre === 'lettre' && ALPHABET.includes(q.attendu.valeur), q.enonce).toBe(true)
    }
  })
})

describe('automatismes — racines', () => {
  it('tranche entre les deux candidats du bon côté', () => {
    const racines = TOUTES.get('puissances')!.filter((q) => q.cle.startsWith('racine:'))
    for (const q of racines) {
      const n = Number(q.cle.split(':')[1])
      if (n <= 10 || n % 5 === 0) continue
      expect(q.astuce, q.enonce).toMatch(new RegExp(`→ \\d+ ou \\d+\\. .* → ${n}\\.$`))
      expect(q.astuce, q.enonce).toContain(String(n))
    }
  })
})

describe('automatismes — couverture', () => {
  const cles = (id: string) => new Set(TOUTES.get(id as never)!.map((q) => q.cle))

  it('tire chaque lettre, chaque carré jusqu’à 30, chaque cube jusqu’à 12', () => {
    for (const l of ALPHABET) {
      for (const g of ['rang', 'rebours']) expect(cles('lettres').has(`${g}:${l}`), `${g}:${l}`).toBe(true)
    }
    for (let n = 11; n <= 30; n++) expect(cles('puissances').has(`carre:${n}`), `carre:${n}`).toBe(true)
    for (let n = 2; n <= 12; n++) expect(cles('puissances').has(`cube:${n}`), `cube:${n}`).toBe(true)
    for (let n = 1; n <= 12; n++) expect(cles('puissances').has(`deux:${n}`), `deux:${n}`).toBe(true)
  })

  it('connaît exactement les premiers de 11 à 97', () => {
    const premiers = TOUTES.get('premiers')!
      .filter((q) => q.cle.startsWith('premier:') && q.attendu.genre === 'ouinon' && q.attendu.valeur)
      .map((q) => Number(q.cle.split(':')[1]))
    expect([...new Set(premiers)].sort((a, b) => a - b)).toEqual([
      11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97,
    ])
  })

  it('pose les pièges classiques', () => {
    for (const n of [49, 51, 57, 77, 87, 91]) expect(cles('premiers').has(`premier:${n}`), String(n)).toBe(true)
  })

  it('répartit à peu près les oui et les non', () => {
    const ouinon = TOUTES.get('premiers')!.filter((q) => q.attendu.genre === 'ouinon')
    const oui = ouinon.filter((q) => q.attendu.genre === 'ouinon' && q.attendu.valeur).length
    expect(oui / ouinon.length).toBeGreaterThan(0.4)
    expect(oui / ouinon.length).toBeLessThan(0.6)
  })
})

describe('automatismes — enchaînement', () => {
  it('ne reprend pas un fait vu dans les dernières questions', () => {
    for (const id of ['lettres', 'puissances', 'fractions']) {
      const qs = serie(jeu(id)!, aleaDepuis(7), 500)
      qs.forEach((q, i) => {
        const avant = qs.slice(Math.max(0, i - ECART_MIN), i).map((x) => x.cle)
        expect(avant, `${id} n°${i}`).not.toContain(q.cle)
      })
    }
  })

  it('ne répète jamais deux fois de suite le même fait', () => {
    for (const j of JEUX) {
      const qs = serie(j, aleaDepuis(11), 500)
      for (let i = 1; i < qs.length; i++) expect(qs[i].cle, `${j.id} n°${i}`).not.toBe(qs[i - 1].cle)
    }
  })

  it('rejoue la même série à graine égale', () => {
    for (const j of JEUX) {
      const a = serie(j, aleaDepuis(42), 30).map((q) => q.enonce)
      const b = serie(j, aleaDepuis(42), 30).map((q) => q.enonce)
      expect(a).toEqual(b)
    }
  })

  it('applique le seuil long aux décompositions', () => {
    const q = questionSuivante(jeu('premiers')!, aleaDepuis(1), [])
    expect(seuilLent(q)).toBe(q.cle === 'decomposition' ? 15000 : 5000)
    const d = TOUTES.get('premiers')!.find((x) => x.cle === 'decomposition')!
    expect(seuilLent(d)).toBe(15000)
  })
})
