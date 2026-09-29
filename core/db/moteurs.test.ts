import { readFileSync } from 'node:fs'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Base } from './base'
import { MOTEURS, baseDeTest } from './moteurs-test'
import { MIGRATIONS } from './migrations.gen'
import { lireMigrations } from './migrer.mjs'
import { ouvrirBaseNavigateur, stockageMemoire } from './navigateur'
import { CHEMIN_MODULE, contenuModuleMigrations } from '../../scripts/generer-migrations.mjs'

/**
 * Le même code de requêtes tourne sur le PC (better-sqlite3) et sur l'iPhone
 * (sql.js). Ces tests verrouillent ce qui doit être identique entre les deux :
 * le schéma, la liaison des paramètres, les valeurs rendues, les erreurs, les
 * transactions. Chaque cas est joué sur les deux moteurs et doit donner
 * exactement le même résultat.
 */

/** Joue `fn` sur les deux moteurs, au schéma courant, et rend les deux résultats. */
async function surLesDeux<T>(fn: (b: Base) => T): Promise<[T, T]> {
  const res: T[] = []
  for (const m of MOTEURS) {
    const b = await baseDeTest(m)
    try {
      res.push(fn(b))
    } finally {
      b.close()
    }
  }
  return res as [T, T]
}

/** Le résultat, ou le type et le message de l'erreur levée. */
function issue(fn: () => unknown): unknown {
  try {
    return { ok: fn() }
  } catch (e) {
    return { erreur: (e as Error).constructor.name, message: (e as Error).message }
  }
}

function item(b: Base, id: number) {
  b.prepare(
    `INSERT INTO item (id, exam_id, section, type_item, enonce, options, bonne_reponse, source, statut)
     VALUES (?, 'tagemage', 'calcul', 'qcm', ?, '["a","b","c","d","e"]', 'A', 'genere', 'valide')`,
  ).run(id, `Q${id}`)
}

describe('migrations embarquées', () => {
  it('migrations.gen.ts est à jour avec core/db/migrations/ (sinon : npm run migrations:gen)', () => {
    // Le fichier lui-même peut être en \r\n (checkout Windows) : on compare le contenu.
    expect(readFileSync(CHEMIN_MODULE, 'utf8').replace(/\r\n/g, '\n')).toBe(contenuModuleMigrations())
    expect(MIGRATIONS.map((m) => m.nom)).toEqual(lireMigrations().map((m) => m.nom))
  })
})

describe('parité des moteurs', () => {
  it('produit le même schéma', async () => {
    const [pc, nav] = await surLesDeux((b) =>
      b.prepare(`SELECT type, name, tbl_name, sql FROM sqlite_master ORDER BY type, name`).all(),
    )
    expect(pc.length).toBeGreaterThan(20)
    expect(nav).toEqual(pc)
  })

  it('lie les paramètres de la même façon : positionnels, tableau, nommés, mélangés', async () => {
    const [pc, nav] = await surLesDeux((b) => {
      const s = b.prepare(`SELECT ? AS a, ? AS b`)
      const n = b.prepare(`SELECT @x AS x, @y AS y, @x || '!' AS x2`)
      const mixte = b.prepare(`SELECT ? AS a, @nom AS nom, ? AS b`)
      return [
        s.get(1, 'deux'),
        s.get([3, null]),
        n.get({ x: 'ici', y: 2.5, inutile: 'ignoré' }),
        mixte.get(1, { nom: 'n' }, 2),
        b.prepare(`SELECT '?' AS q, ':pas' AS p, "@non" AS c FROM (SELECT 1 AS "@non") WHERE ? = 1`).get(1),
        b.prepare(`SELECT 1 AS un -- un ? en commentaire\n WHERE ? = 1`).get(1),
      ]
    })
    expect(nav).toEqual(pc)
    expect(pc[2]).toEqual({ x: 'ici', y: 2.5, x2: 'ici!' })
    expect(pc[3]).toEqual({ a: 1, nom: 'n', b: 2 })
  })

  it('traite les paramètres fautifs pareil : mêmes refus, mêmes erreurs, mêmes tolérances', async () => {
    const [pc, nav] = await surLesDeux((b) => {
      const s = b.prepare(`SELECT ? AS a, ? AS b`)
      const n = b.prepare(`SELECT @x AS x`)
      return [
        issue(() => s.get(1)),
        issue(() => s.get(1, 2, 3)),
        issue(() => n.get({})),
        issue(() => n.get()),
        issue(() => s.get(true as unknown as number, 1)),
        issue(() => s.get(undefined as unknown as number, 1)),
        issue(() => n.get({ x: undefined })),
        issue(() => b.prepare(`SELECT 1 AS un`).get({ x: 1 })),
      ]
    })
    expect(nav).toEqual(pc)
    for (const r of pc.slice(0, 5)) expect(r).toHaveProperty('erreur')
  })

  it('rend les mêmes valeurs : entiers, réels, texte, NULL, absence de ligne', async () => {
    const [pc, nav] = await surLesDeux((b) => [
      b.prepare(`SELECT 42 AS e, 1.5 AS r, 'é’' AS t, NULL AS n, 9007199254740991 AS grand`).get(),
      b.prepare(`SELECT 1 AS x WHERE 0`).get(),
      b.prepare(`SELECT 1 AS x WHERE 0`).all(),
      b.prepare(`SELECT value AS v FROM json_each('[3,1,2]') ORDER BY v`).all(),
    ])
    expect(nav).toEqual(pc)
    expect(pc[1]).toBeUndefined()
  })

  it('rend les mêmes octets pour un BLOB', async () => {
    const [pc, nav] = await surLesDeux((b) => {
      const v = b.prepare(`SELECT ? AS o`).get(new Uint8Array([0, 1, 255])) as { o: Uint8Array }
      return Array.from(v.o)
    })
    expect(nav).toEqual(pc)
    expect(pc).toEqual([0, 1, 255])
  })

  it('compte `changes` et `lastInsertRowid` pareil, y compris quand rien n’est écrit', async () => {
    const [pc, nav] = await surLesDeux((b) => {
      item(b, 1)
      const s = b.prepare(`INSERT INTO exam_session (exam_id, type, sections) VALUES ('tagemage', 'drill', '[]')`)
      const r1 = s.run()
      const r2 = s.run()
      const rep = b.prepare(
        `INSERT INTO attempt (session_id, item_id, est_correct, temps_ms, confiance, points_gagnes)
         VALUES (?, 1, 1, 1000, 3, 4) ON CONFLICT (session_id, item_id) DO NOTHING`,
      )
      const lecture = b.prepare(`SELECT 1`).run()
      return [
        r1,
        r2,
        rep.run(r1.lastInsertRowid as number).changes,
        rep.run(r1.lastInsertRowid as number).changes,
        lecture.changes,
        b.prepare(`UPDATE exam_session SET interrompue = 1`).run().changes,
        b.prepare(`DELETE FROM exam_session WHERE id = 999`).run().changes,
      ].map((v) => (typeof v === 'object' ? { changes: v.changes, id: Number(v.lastInsertRowid) } : v))
    })
    expect(nav).toEqual(pc)
    expect(pc.slice(2)).toEqual([1, 0, 0, 2, 0])
  })

  it('reconstitue le code des erreurs que l’application distingue', async () => {
    const [pc, nav] = await surLesDeux((b) => [
      issue(() =>
        b
          .prepare(
            `INSERT INTO attempt (session_id, item_id, est_correct, temps_ms, confiance, points_gagnes)
             VALUES (999, 999, 1, 1000, 3, 4)`,
          )
          .run(),
      ),
      (() => {
        try {
          b.prepare(`INSERT INTO attempt (session_id, item_id, est_correct, temps_ms, confiance, points_gagnes)
                     VALUES (999, 999, 1, 1000, 3, 4)`).run()
        } catch (e) {
          return (e as { code?: string }).code
        }
      })(),
    ])
    expect(nav[1]).toBe('SQLITE_CONSTRAINT_FOREIGNKEY')
    expect(nav[1]).toBe(pc[1])
    expect((nav[0] as { message: string }).message).toBe((pc[0] as { message: string }).message)
  })

  it('valide, annule et imbrique les transactions pareil', async () => {
    const [pc, nav] = await surLesDeux((b) => {
      const inserer = b.prepare(`INSERT INTO exam_session (exam_id, type, sections) VALUES ('tagemage', 'drill', ?)`)
      const compte = () => (b.prepare(`SELECT COUNT(*) AS n FROM exam_session`).get() as { n: number }).n

      b.transaction((s: string) => inserer.run(s))('["a"]')
      const apresValidation = compte()

      const ratee = issue(() =>
        b.transaction(() => {
          inserer.run('["b"]')
          throw new Error('échec voulu')
        })(),
      )
      const apresAnnulation = compte()

      // Une transaction interne qui échoue n'annule que sa part.
      b.transaction(() => {
        inserer.run('["c"]')
        issue(() =>
          b.transaction(() => {
            inserer.run('["d"]')
            throw new Error('interne')
          })(),
        )
      })()
      const sections = b.prepare(`SELECT sections FROM exam_session ORDER BY id`).all()

      const rend = b.transaction(() => 7)()
      return [apresValidation, ratee, apresAnnulation, sections, rend]
    })
    expect(nav).toEqual(pc)
    expect(pc[3]).toEqual([{ sections: '["a"]' }, { sections: '["c"]' }])
  })

  it('répond aux pragmas pareil', async () => {
    const [pc, nav] = await surLesDeux((b) => [
      b.pragma('foreign_keys', { simple: true }),
      b.pragma('foreign_key_check'),
      b.pragma('user_version', { simple: true }),
    ])
    expect(nav).toEqual(pc)
    expect(pc[0]).toBe(1)
  })
})

describe('base du navigateur', () => {
  afterEach(() => vi.useRealTimers())

  it('applique les migrations à l’ouverture, et une seule fois', async () => {
    const stockage = stockageMemoire()
    const a = await ouvrirBaseNavigateur({ stockage, delaiMs: 0 })
    const noms = a.base.prepare(`SELECT nom FROM _migration ORDER BY nom`).all()
    expect(noms).toHaveLength(MIGRATIONS.length)
    await a.fermer()

    const b = await ouvrirBaseNavigateur({ stockage, delaiMs: 0 })
    expect(b.base.prepare(`SELECT nom FROM _migration ORDER BY nom`).all()).toEqual(noms)
    await b.fermer()
  })

  it('conserve les données d’une ouverture à l’autre', async () => {
    const stockage = stockageMemoire()
    const a = await ouvrirBaseNavigateur({ stockage, delaiMs: 0 })
    item(a.base, 7)
    await a.fermer()

    const b = await ouvrirBaseNavigateur({ stockage, delaiMs: 0 })
    expect(b.base.prepare(`SELECT enonce FROM item WHERE id = 7`).get()).toEqual({ enonce: 'Q7' })
    await b.fermer()
  })

  it('regroupe les écritures rapprochées en un seul enregistrement', async () => {
    vi.useFakeTimers()
    const stockage = stockageMemoire()
    const nav = await ouvrirBaseNavigateur({ stockage, delaiMs: 400 })
    await vi.runAllTimersAsync()
    const avant = stockage.ecritures

    for (let i = 1; i <= 20; i++) item(nav.base, i)
    expect(stockage.ecritures).toBe(avant)
    await vi.advanceTimersByTimeAsync(400)
    expect(stockage.ecritures).toBe(avant + 1)
    await nav.fermer()
  })

  it('garde les clés étrangères actives après un enregistrement', async () => {
    const nav = await ouvrirBaseNavigateur({ stockage: stockageMemoire(), delaiMs: 0 })
    item(nav.base, 1)
    await nav.enregistrer()
    expect(nav.base.pragma('foreign_keys', { simple: true })).toBe(1)
    expect(() =>
      nav.base
        .prepare(
          `INSERT INTO attempt (session_id, item_id, est_correct, temps_ms, confiance, points_gagnes)
           VALUES (999, 1, 1, 1000, 3, 4)`,
        )
        .run(),
    ).toThrow(/FOREIGN KEY/)
    await nav.fermer()
  })

  it('ne perd pas une écriture si l’enregistrement échoue : elle repart au suivant', async () => {
    let echouer = true
    const memoire = stockageMemoire()
    const stockage = {
      lire: memoire.lire,
      async ecrire(o: Uint8Array) {
        if (echouer) throw new Error('stockage plein')
        await memoire.ecrire(o)
      },
    }
    const erreurs: unknown[] = []
    const nav = await ouvrirBaseNavigateur({ stockage, delaiMs: 0, surErreur: (e) => erreurs.push(e) })
    item(nav.base, 3)
    await nav.enregistrer()
    expect(erreurs).toHaveLength(1)

    echouer = false
    await nav.enregistrer()
    const relue = await ouvrirBaseNavigateur({ stockage: memoire, delaiMs: 0 })
    expect(relue.base.prepare(`SELECT id FROM item`).all()).toEqual([{ id: 3 }])
    await relue.fermer()
    await nav.fermer()
  })
})
