/**
 * Remplace la lettre x par le signe × entre deux nombres, dans les questions
 * TAGE MAGE déjà en banque (énoncé, informations, propositions, explication,
 * rappel). Les imports futurs sont normalisés à l'insertion ; ce script
 * rattrape ce qui est entré avant.
 *
 *   npx jiti scripts/normaliser-typographie.ts             → aperçu
 *   npx jiti scripts/normaliser-typographie.ts --appliquer → écrit
 *
 * Idempotent : relancé, il ne trouve plus rien à changer.
 */
import Database from 'better-sqlite3'
import path from 'node:path'
import { normaliserMultiplication } from '../core/import/typographie'

const appliquer = process.argv.includes('--appliquer')
const db = new Database(path.join(process.cwd(), 'data', 'app.db'))
db.pragma('busy_timeout = 5000')

const CHAMPS = ['enonce', 'info_1', 'info_2', 'options', 'explication_reference', 'rappel'] as const

const lignes = db
  .prepare(`SELECT id, ${CHAMPS.join(', ')} FROM item WHERE exam_id = 'tagemage'`)
  .all() as Array<Record<string, string | number | null>>

const changements: Array<{ id: number; champ: string; avant: string; apres: string }> = []
for (const l of lignes) {
  for (const champ of CHAMPS) {
    const v = l[champ]
    if (typeof v !== 'string') continue
    // Les propositions sont du JSON : on normalise chaque chaîne, pas le texte brut.
    const apres =
      champ === 'options'
        ? JSON.stringify((JSON.parse(v) as string[]).map(normaliserMultiplication))
        : normaliserMultiplication(v)
    if (apres !== v && !(champ === 'options' && apres === JSON.stringify(JSON.parse(v)))) {
      changements.push({ id: l.id as number, champ, avant: v, apres })
    }
  }
}

for (const c of changements) {
  const extrait = (t: string) => {
    const i = t.search(/\d\s?[x×]\s?\d/)
    return t.slice(Math.max(0, i - 20), i + 30).replace(/\s+/g, ' ')
  }
  console.log(`#${c.id} ${c.champ} : « ${extrait(c.avant)} » → « ${extrait(c.apres)} »`)
}
console.log(`\n${changements.length} champ(s) sur ${new Set(changements.map((c) => c.id)).size} question(s).`)

if (!appliquer) {
  console.log('Aperçu seulement. Relancer avec --appliquer pour écrire.')
  process.exit(0)
}

db.transaction(() => {
  for (const c of changements) {
    db.prepare(`UPDATE item SET ${c.champ} = ? WHERE id = ?`).run(c.apres, c.id)
  }
})()
console.log('Appliqué.')
