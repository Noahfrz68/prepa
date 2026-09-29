import initSqlJs from 'sql.js'
import { adapterSqlJs } from './sqljs'

/**
 * Préparation du projet de tests « navigateur » (vitest.config.mts) : le
 * parcours de bout en bout y est rejoué avec sql.js à la place de
 * better-sqlite3. La base est posée dans le cache de connexion de client.ts,
 * qui la sert alors à tout le code — routes, requêtes, migrations — comme il
 * servirait la base du PC.
 */
const SQL = await initSqlJs()
const base = adapterSqlJs(new SQL.Database())
base.pragma('foreign_keys = ON')
;(globalThis as { __prepaDb?: unknown }).__prepaDb = base
