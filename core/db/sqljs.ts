import type { Database as SqlJsDatabase, SqlValue } from 'sql.js'
import type { Base, ParametresSql, Requete, ResultatEcriture } from './base'

/**
 * Adaptateur sql.js → `Base` : la base du navigateur (version iPhone) avec la
 * sémantique de better-sqlite3, pour que le même code de requêtes tourne sur
 * les deux moteurs sans le savoir.
 *
 * Ce que sql.js fait autrement, et que l'adaptateur corrige :
 *
 *   — paramètres : better-sqlite3 lie `{ nom }` à `@nom` et lève si une valeur
 *     manque ou est en trop ; sql.js attend la clé préfixée et met NULL en
 *     silence. On calcule ici les index des paramètres comme SQLite les
 *     numérote, et on lève comme better-sqlite3 ;
 *   — types : better-sqlite3 refuse `true` et lie `undefined` comme NULL ;
 *     sql.js convertit le premier. Même règle ici, sans quoi un code qui passe
 *     dans le navigateur casserait sur le PC ;
 *   — `changes` : celui de better-sqlite3 vaut 0 quand l'instruction n'a rien
 *     écrit (un `ON CONFLICT DO NOTHING`), là où `sqlite3_changes` redonne le
 *     compte de l'écriture précédente ;
 *   — erreurs : les messages sont ceux de SQLite, mais sans `code`. On le
 *     reconstitue pour les cas que l'application distingue (app/api/erreurs.ts) ;
 *   — `export()` ferme et rouvre la base : requêtes préparées libérées,
 *     pragmas remis à leur défaut. Aucune requête n'est donc gardée préparée
 *     d'un appel à l'autre, et les pragmas posés sont réappliqués.
 */

export interface OptionsAdaptateur {
  /**
   * Appelé après chaque écriture validée — hors transaction, ou à la
   * validation de la transaction la plus externe. Le navigateur s'en sert
   * pour planifier l'enregistrement de la base.
   */
  surEcriture?: () => void
}

export interface BaseSqlJs extends Base {
  /** La base entière, sérialisée. Interdit pendant une transaction. */
  exporter(): Uint8Array
}

/** Erreur SQLite avec le `code` que better-sqlite3 aurait donné. */
export class ErreurSqlite extends Error {
  constructor(
    message: string,
    readonly code: string,
  ) {
    super(message)
    this.name = 'SqliteError'
  }
}

const CODES: Array<[RegExp, string]> = [
  [/FOREIGN KEY constraint failed/, 'SQLITE_CONSTRAINT_FOREIGNKEY'],
  [/UNIQUE constraint failed/, 'SQLITE_CONSTRAINT_UNIQUE'],
  [/NOT NULL constraint failed/, 'SQLITE_CONSTRAINT_NOTNULL'],
  [/CHECK constraint failed/, 'SQLITE_CONSTRAINT_CHECK'],
  [/constraint failed/, 'SQLITE_CONSTRAINT'],
  [/database is locked/, 'SQLITE_BUSY'],
  [/no such (table|column)|syntax error/, 'SQLITE_ERROR'],
]

function traduireErreur(e: unknown): unknown {
  if (!(e instanceof Error) || e instanceof ErreurSqlite || e instanceof RangeError || e instanceof TypeError) return e
  const trouve = CODES.find(([re]) => re.test(e.message))
  return trouve ? new ErreurSqlite(e.message, trouve[1]) : e
}

/* ------------------------------------------------------ Paramètres -- */

/**
 * Un paramètre de l'instruction, dans l'ordre où SQLite lui attribue son
 * index : `?` prend le plus grand index vu + 1 ; `?NNN` prend NNN ; un nom
 * prend le plus grand index + 1 à sa première apparition, et le garde.
 */
type Parametre = { index: number; nom: string | null }

interface Signature {
  /** Index des `?` anonymes, dans l'ordre du texte. */
  anonymes: number[]
  /** Index de chaque paramètre nommé, par nom sans préfixe. */
  nommes: Map<string, number>
  total: number
}

const signatures = new Map<string, Signature>()
const SIGNATURES_MAX = 500

function signature(sql: string): Signature {
  const connue = signatures.get(sql)
  if (connue) return connue

  const params: Parametre[] = []
  let max = 0
  const vus = new Map<string, number>()
  const n = sql.length
  let i = 0

  while (i < n) {
    const c = sql[i]

    // Chaînes et identifiants citaient des `?` ou des `:` qui n'en sont pas.
    if (c === "'" || c === '"' || c === '`') {
      i++
      while (i < n) {
        if (sql[i] === c) {
          if (sql[i + 1] === c) i += 2
          else break
        } else i++
      }
      i++
      continue
    }
    if (c === '[') {
      const fin = sql.indexOf(']', i + 1)
      i = fin < 0 ? n : fin + 1
      continue
    }
    if (c === '-' && sql[i + 1] === '-') {
      const fin = sql.indexOf('\n', i + 2)
      i = fin < 0 ? n : fin + 1
      continue
    }
    if (c === '/' && sql[i + 1] === '*') {
      const fin = sql.indexOf('*/', i + 2)
      i = fin < 0 ? n : fin + 2
      continue
    }

    if (c === '?') {
      let j = i + 1
      while (j < n && sql[j] >= '0' && sql[j] <= '9') j++
      if (j > i + 1) {
        const index = Number(sql.slice(i + 1, j))
        max = Math.max(max, index)
        params.push({ index, nom: null })
      } else {
        params.push({ index: ++max, nom: null })
      }
      i = j
      continue
    }

    if (c === '@' || c === ':' || c === '$') {
      let j = i + 1
      while (j < n && /[\p{L}\p{N}_]/u.test(sql[j])) j++
      if (j > i + 1) {
        const nom = sql.slice(i + 1, j)
        let index = vus.get(nom)
        if (index === undefined) {
          index = ++max
          vus.set(nom, index)
        }
        params.push({ index, nom })
        i = j
        continue
      }
    }

    i++
  }

  const sig: Signature = {
    anonymes: params.filter((p) => p.nom === null).map((p) => p.index),
    nommes: vus,
    total: max,
  }
  if (signatures.size >= SIGNATURES_MAX) signatures.clear()
  signatures.set(sql, sig)
  return sig
}

function estObjetNomme(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v) && !(v instanceof Uint8Array)
}

function valeurSql(v: unknown, ou: string): SqlValue {
  // better-sqlite3 lie `undefined` comme NULL : même chose ici.
  if (v === undefined) return null
  if (v === null || typeof v === 'number' || typeof v === 'string') return v
  if (v instanceof Uint8Array) return v
  if (typeof v === 'bigint') {
    if (v > BigInt(Number.MAX_SAFE_INTEGER) || v < BigInt(Number.MIN_SAFE_INTEGER)) {
      throw new RangeError(`Entier trop grand pour la base du navigateur (${ou})`)
    }
    return Number(v)
  }
  // Même refus que better-sqlite3, avec le même message.
  throw new TypeError('SQLite3 can only bind numbers, strings, bigints, buffers, and null')
}

/** Les valeurs à lier, rangées par index SQLite (position 0 = index 1). */
function lier(sql: string, args: ParametresSql[]): SqlValue[] {
  const sig = signature(sql)
  const positionnels: unknown[] = []
  let nommes: Record<string, unknown> | null = null

  for (const a of args) {
    if (Array.isArray(a)) positionnels.push(...a)
    else if (estObjetNomme(a)) {
      if (nommes) throw new TypeError('You cannot specify named parameters in two different objects')
      nommes = a
    } else positionnels.push(a)
  }

  if (positionnels.length < sig.anonymes.length) throw new RangeError('Too few parameter values were provided')
  if (positionnels.length > sig.anonymes.length) throw new RangeError('Too many parameter values were provided')
  if (nommes === null && sig.nommes.size > 0) throw new TypeError('Missing named parameters')

  const valeurs: SqlValue[] = new Array(sig.total).fill(null)
  sig.anonymes.forEach((index, k) => {
    valeurs[index - 1] = valeurSql(positionnels[k], `paramètre ${k + 1}`)
  })
  for (const [nom, index] of sig.nommes) {
    if (!(nom in nommes!)) throw new RangeError(`Missing named parameter "${nom}"`)
    valeurs[index - 1] = valeurSql(nommes![nom], `@${nom}`)
  }
  return valeurs
}

/* ------------------------------------------------------- Adaptateur -- */

export function adapterSqlJs(db: SqlJsDatabase, options: OptionsAdaptateur = {}): BaseSqlJs {
  /** Profondeur de transaction : 0 hors transaction. */
  let profondeur = 0
  /** Une écriture a eu lieu depuis la dernière notification. */
  let sale = false
  /** Pragmas posés (`nom = valeur`), à réappliquer après un export. */
  const pragmasPoses = new Map<string, string>()

  function notifierSiLibre() {
    if (profondeur === 0 && sale) {
      sale = false
      options.surEcriture?.()
    }
  }

  /** Prépare, lie, exécute `fn`, libère — même si `fn` lève. */
  function avecInstruction<T>(sql: string, args: ParametresSql[], fn: (s: ReturnType<SqlJsDatabase['prepare']>) => T): T {
    const valeurs = lier(sql, args)
    let s: ReturnType<SqlJsDatabase['prepare']> | null = null
    try {
      s = db.prepare(sql)
      if (valeurs.length > 0) s.bind(valeurs)
      return fn(s)
    } catch (e) {
      throw traduireErreur(e)
    } finally {
      s?.free()
    }
  }

  function scalaire(sql: string): number {
    const r = db.exec(sql)
    return Number(r[0]?.values[0]?.[0] ?? 0)
  }

  const base: BaseSqlJs = {
    prepare(sql: string): Requete {
      return {
        get(...args) {
          return avecInstruction(sql, args, (s) => (s.step() ? s.getAsObject() : undefined))
        },
        all(...args) {
          return avecInstruction(sql, args, (s) => {
            const lignes: unknown[] = []
            while (s.step()) lignes.push(s.getAsObject())
            return lignes
          })
        },
        run(...args): ResultatEcriture {
          const avant = scalaire('SELECT total_changes()')
          avecInstruction(sql, args, (s) => {
            while (s.step()) {
              /* une instruction RETURNING rend des lignes : on les passe */
            }
          })
          const r = db.exec('SELECT total_changes(), changes(), last_insert_rowid()')[0].values[0]
          const changes = Number(r[0]) === avant ? 0 : Number(r[1])
          if (changes > 0) {
            sale = true
            notifierSiLibre()
          }
          return { changes, lastInsertRowid: Number(r[2]) }
        },
      }
    },

    exec(sql: string) {
      try {
        db.exec(sql)
      } catch (e) {
        throw traduireErreur(e)
      }
      sale = true
      notifierSiLibre()
      return this
    },

    transaction<A extends unknown[], R>(fn: (...args: A) => R): (...args: A) => R {
      return (...args: A): R => {
        const point = profondeur === 0 ? null : `t${profondeur}`
        db.exec(point ? `SAVEPOINT ${point}` : 'BEGIN')
        profondeur++
        let resultat: R
        try {
          resultat = fn(...args)
          if (resultat && typeof (resultat as { then?: unknown }).then === 'function') {
            throw new TypeError('Transaction function cannot return a promise')
          }
        } catch (e) {
          profondeur--
          try {
            db.exec(point ? `ROLLBACK TO ${point}; RELEASE ${point}` : 'ROLLBACK')
          } catch {
            /* SQLite a déjà annulé la transaction de lui-même */
          }
          throw traduireErreur(e)
        }
        profondeur--
        db.exec(point ? `RELEASE ${point}` : 'COMMIT')
        notifierSiLibre()
        return resultat
      }
    },

    pragma(source: string, opts: { simple?: boolean } = {}) {
      const pose = /^\s*(\w+)\s*=\s*(.+?)\s*;?\s*$/.exec(source)
      if (pose) pragmasPoses.set(pose[1].toLowerCase(), pose[2])
      const lignes = base.prepare(`PRAGMA ${source}`).all() as Array<Record<string, unknown>>
      if (opts.simple) {
        const premiere = lignes[0]
        return premiere ? Object.values(premiere)[0] : undefined
      }
      return lignes
    },

    exporter(): Uint8Array {
      if (profondeur > 0) throw new Error('Export impossible pendant une transaction')
      const octets = db.export()
      // export() a fermé et rouvert la base : ses réglages sont perdus.
      for (const [nom, valeur] of pragmasPoses) db.exec(`PRAGMA ${nom} = ${valeur}`)
      return octets
    },

    close() {
      db.close()
    },
  }

  return base
}
