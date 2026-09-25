/**
 * Rééquilibre la position des bonnes réponses en compréhension de textes.
 *
 * La banque importée plaçait la bonne réponse en B dans la moitié des cas et
 * en E dans 2 % : répondre B par défaut rapportait plus que le hasard, et ce
 * biais se lisait dans le taux de réussite comme dans la calibration.
 *
 * Pour chaque question, le script permute les propositions, réécrit les
 * lettres citées dans l'explication, et réécrit les réponses déjà données
 * dans `attempt` — une réponse « A » désignait une proposition, pas une
 * position : elle doit continuer à désigner la même. `est_correct` n'est pas
 * touché, et ne peut pas l'être : il ne dépend pas de la lettre.
 *
 * Il corrige au passage deux défauts de contenu repérés à l'audit :
 *   — 2827 double exactement 2789 sur le même texte : il passe en `suspect`,
 *     ce qui le retire des séries et le fait remonter dans la file de relecture ;
 *   — l'explication de 2774 renvoie à « D pour la Q8 », une autre question
 *     dont la lettre va changer : le renvoi est retiré plutôt que laissé faux.
 *
 *   npx jiti scripts/equilibrer-reponses.ts             → aperçu, rien n'est écrit
 *   npx jiti scripts/equilibrer-reponses.ts --appliquer → écrit, une seule fois
 */
import Database from 'better-sqlite3'
import path from 'node:path'
import { aleaDepuis } from '../core/generation/alea'
import { equilibrer, lettrePermutee, partLettreDominante } from '../core/import/permutation'

const MARQUEUR = 'script:equilibrer-reponses-comprehension'
const GRAINE = 20260925
const appliquer = process.argv.includes('--appliquer')

const db = new Database(path.join(process.cwd(), 'data', 'app.db'))
db.pragma('foreign_keys = ON')
db.pragma('busy_timeout = 5000')

const deja = db.prepare(`SELECT 1 FROM _migration WHERE nom = ?`).get(MARQUEUR)
if (deja) {
  console.log('Déjà appliqué : rien à faire. Le relancer permuterait une seconde fois.')
  process.exit(0)
}

interface Ligne {
  id: number
  options: string
  bonne_reponse: string
  explication_reference: string | null
  diagnostics: string | null
}

const lignes = db
  .prepare(
    `SELECT id, options, bonne_reponse, explication_reference, diagnostics
       FROM item WHERE section = 'comprehension' ORDER BY id`,
  )
  .all() as Ligne[]

const distribution = (bonnes: string[]) =>
  ['A', 'B', 'C', 'D', 'E'].map((l) => `${l} ${bonnes.filter((b) => b === l).length}`).join(' · ')

// Le renvoi croisé de 2774 est retiré AVANT la permutation.
const RENVOI_2774 = ' (ici D pour la Q8)'
for (const l of lignes) {
  if (l.id === 2774 && l.explication_reference?.includes(RENVOI_2774)) {
    l.explication_reference = l.explication_reference.replace(RENVOI_2774, '')
  }
}

const resultats = equilibrer(
  lignes.map((l) => ({
    id: l.id,
    options: JSON.parse(l.options) as string[],
    bonneReponse: l.bonne_reponse,
    explication: l.explication_reference,
    diagnostics: l.diagnostics,
  })),
  aleaDepuis(GRAINE),
)

console.log(`Avant : ${distribution(lignes.map((l) => l.bonne_reponse))}`)
console.log(`Après : ${distribution(resultats.map((r) => r.question.bonneReponse))}`)
const dom = partLettreDominante(resultats.map((r) => r.question.bonneReponse))
console.log(`Lettre dominante après : ${dom?.lettre} (${Math.round((dom?.part ?? 0) * 100)} %)`)

const tentatives = db.prepare(
  `SELECT id, reponse_donnee FROM attempt WHERE item_id = ? AND reponse_donnee IS NOT NULL`,
)
let nbTentatives = 0
for (const r of resultats) nbTentatives += (tentatives.all(r.question.id) as unknown[]).length
console.log(`${resultats.length} questions, ${nbTentatives} réponses déjà données à réécrire.`)

if (!appliquer) {
  console.log('\nAperçu seulement. Relancer avec --appliquer pour écrire.')
  process.exit(0)
}

const majItem = db.prepare(
  `UPDATE item SET options = ?, bonne_reponse = ?, explication_reference = ?, diagnostics = ?
    WHERE id = ?`,
)
const majTentative = db.prepare(`UPDATE attempt SET reponse_donnee = ? WHERE id = ?`)

db.transaction(() => {
  for (const { question: q, permutation: p } of resultats) {
    if (!p) continue
    majItem.run(JSON.stringify(q.options), q.bonneReponse, q.explication ?? null, q.diagnostics ?? null, q.id)
    for (const t of tentatives.all(q.id) as Array<{ id: number; reponse_donnee: string }>) {
      majTentative.run(lettrePermutee(t.reponse_donnee, p), t.id)
    }
  }

  const doublon = db
    .prepare(`UPDATE item SET statut = 'suspect' WHERE id = 2827 AND statut = 'valide'`)
    .run()
  console.log(`2827 (doublon de 2789) mis en suspect : ${doublon.changes === 1 ? 'oui' : 'déjà fait'}`)

  // Contrôle final : aucune réponse juste ne doit avoir changé de statut.
  const incoherentes = db
    .prepare(
      `SELECT COUNT(*) AS n FROM attempt a JOIN item i ON i.id = a.item_id
        WHERE i.section = 'comprehension' AND a.reponse_donnee IS NOT NULL
          AND (a.reponse_donnee = i.bonne_reponse) <> (a.est_correct = 1)`,
    )
    .get() as { n: number }
  if (incoherentes.n > 0) {
    throw new Error(`${incoherentes.n} tentative(s) ne correspondent plus à leur correction : annulé.`)
  }

  db.prepare(`INSERT INTO _migration (nom) VALUES (?)`).run(MARQUEUR)
})()

console.log('Appliqué.')
