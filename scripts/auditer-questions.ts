/**
 * Audit de cohérence de la banque de questions.
 *
 * On ne cherche pas des fautes de goût : uniquement des défauts qui rendent une
 * question INRÉPONDABLE ou FAUSSE — une figure invoquée mais absente, deux
 * propositions identiques, une unité qui ne correspond pas à la grandeur
 * demandée, une phrase coupée en plein milieu, une consigne manquante.
 *
 * Il existe parce qu'une banque importée d'un PDF se dégrade en silence : le
 * lecteur tronque une proposition longue, perd un soulignement, laisse une
 * figure derrière lui, et rien ne le signale. Quarante et une questions sur
 * deux cent trente-cinq étaient dans ce cas sans que rien ne l'indique.
 *
 *   npm run audit:questions
 *
 * Toute alerte demande une lecture humaine : le script ne corrige rien, et
 * plusieurs de ses motifs produisent des faux positifs assumés — mieux vaut
 * signaler à tort que taire un défaut.
 */
import Database from 'better-sqlite3'
import path from 'node:path'
import { ALERTE_LETTRE_DOMINANTE, alerteRepartition } from '../core/import/permutation'

interface Item {
  id: number
  section: string
  source: string
  type_item: string
  enonce: string
  contexte_texte: string | null
  options: string | null
  bonne_reponse: string
  explication_reference: string | null
  media_id: number | null
  figure: string | null
}

const db = new Database(path.join(process.cwd(), 'data', 'app.db'), { readonly: true })
db.pragma('busy_timeout = 5000')
const items = db
  .prepare(
    `SELECT id, section, source, type_item, enonce, contexte_texte, options,
            bonne_reponse, explication_reference, media_id, figure
       FROM item WHERE exam_id = 'tagemage'`,
  )
  .all() as Item[]

const defauts = new Map<string, Array<{ id: number; section: string; detail: string }>>()
const noter = (code: string, it: Item, detail: string) => {
  if (!defauts.has(code)) defauts.set(code, [])
  defauts.get(code)!.push({ id: it.id, section: it.section, detail })
}

/** « ci-dessous » désigne souvent les propositions, pas un dessin. */
const RE_FIGURE = /\b(la figure|le sch[ée]ma|le graphique|partie gris[ée]e|partie hachur[ée]e|zone gris[ée]e|comme indiqu[ée] sur)\b/i

const RE_CONSIGNE =
  /\b(choisis|indiquez|indique|trouvez|trouve|compl[ée]t|remplissez|remplis|quelle?|combien|lequel|laquelle|parmi|s[ée]lectionn|que vaut|que repr[ée]sente)/i

const unite = (s: string) => {
  if (/cm³|m³|dm³|litres?\b/i.test(s)) return 'volume'
  if (/cm²|m²|km²|dm²/i.test(s)) return 'aire'
  if (/\bcm\b|\bm\b|\bkm\b|\bmm\b/i.test(s)) return 'longueur'
  return null
}

for (const it of items) {
  const opts: string[] = it.options ? JSON.parse(it.options) : []
  const texte = `${it.contexte_texte ?? ''}\n${it.enonce}`
  const e = it.enonce.trim()
  // Quand l'image porte la question entière, son texte n'est qu'un repère :
  // lui reprocher ses propositions vides ou sa consigne absente n'a aucun sens.
  const imagePorteTout = Boolean(it.media_id) && /^Figure\s+—/.test(e)

  if (RE_FIGURE.test(texte) && !it.media_id && !it.figure) {
    noter('figure-absente', it, texte.match(RE_FIGURE)![0])
  }

  if (opts.length > 0 && !imagePorteTout) {
    const vus = new Map<string, number>()
    for (const o of opts) {
      const c = o.trim().toLowerCase()
      vus.set(c, (vus.get(c) ?? 0) + 1)
    }
    const doubles = [...vus.entries()].filter(([, n]) => n > 1)
    if (doubles.length > 0) {
      noter('propositions-doubles', it, doubles.map(([o, n]) => `${n}× « ${o.slice(0, 40)} »`).join(' · '))
    }
  }

  for (const o of opts) {
    const t = o.trim()
    if (/[,;]\s*(et|ou|mais|qui|que|de|à|le|la|les|un|une|des)$/i.test(t) || /\.\.\.$|…$/.test(t)) {
      noter('proposition-tronquee', it, `« …${t.slice(-45)} »`)
      break
    }
  }

  // La grandeur demandée est celle de la DERNIÈRE phrase : « un rectangle a un
  // périmètre de 88 cm … quelle est son aire ? » demande une aire.
  const question = e.split(/(?<=[.?!])\s+/).filter(Boolean).pop() ?? e
  const demande = /\baire\b|surface/i.test(question)
    ? 'aire'
    : /volume|capacit[ée]/i.test(question)
      ? 'volume'
      : /p[ée]rim[èe]tre|longueur|circonf[ée]rence|distance|hauteur|rayon|diam[èe]tre/i.test(question)
        ? 'longueur'
        : null
  if (demande && opts.length > 0) {
    const u = opts.map(unite).filter(Boolean)
    if (u.length >= 3 && u.every((x) => x === u[0]) && u[0] !== demande) {
      noter('unite-incoherente', it, `on demande une ${demande}, les propositions sont en ${u[0]} (${opts[0]})`)
    }
  }

  if (it.type_item === 'qcm' && !imagePorteTout) {
    if (opts.length !== 5) noter('propositions-manquantes', it, `${opts.length} proposition(s)`)
    const r = 'ABCDE'.indexOf(it.bonne_reponse)
    if (r < 0 || r >= opts.length) noter('reponse-hors-propositions', it, `réponse « ${it.bonne_reponse} »`)
  }

  // Un énoncé qui finit par « : » est une phrase à compléter par la
  // proposition : c'est un format légitime, pas une consigne manquante.
  if (!imagePorteTout && !/\?/.test(texte) && !/:\s*$/.test(e) && !RE_CONSIGNE.test(texte)) {
    noter('consigne-absente', it, e.slice(0, 60))
  }

  if (!it.explication_reference?.trim()) noter('sans-correction', it, '')
}

/* ------------------------------------------- répartition des réponses -- */

// Une lettre qui porte trop de bonnes réponses se devine sans lire la question.
const bonnesParSection = new Map<string, string[]>()
for (const it of items) {
  if (!bonnesParSection.has(it.section)) bonnesParSection.set(it.section, [])
  bonnesParSection.get(it.section)!.push(it.bonne_reponse)
}
for (const [section, bonnes] of bonnesParSection) {
  const a = alerteRepartition(bonnes)
  if (a) {
    defauts.set('lettre-dominante', [
      ...(defauts.get('lettre-dominante') ?? []),
      {
        id: 0,
        section,
        detail: `${a.lettre} porte ${Math.round(a.part * 100)} % des ${a.n} bonnes réponses (seuil ${Math.round(ALERTE_LETTRE_DOMINANTE * 100)} %)`,
      },
    ])
  }
}

/* ---------------------------------------------------------------- sortie -- */

const ordre = [...defauts.entries()].sort((a, b) => b[1].length - a[1].length)
console.log(`${items.length} questions examinées\n`)

if (ordre.length === 0) {
  console.log('Aucun défaut détecté.')
} else {
  for (const [code, liste] of ordre) {
    const parSection: Record<string, number> = {}
    for (const d of liste) parSection[d.section] = (parSection[d.section] ?? 0) + 1
    console.log(`${code.padEnd(26)} ${String(liste.length).padStart(4)}   ${JSON.stringify(parSection)}`)
    for (const d of liste.slice(0, 5)) console.log(`${' '.repeat(28)}#${d.id} ${d.detail}`)
    console.log()
  }
  const touches = new Set([...defauts.values()].flat().map((d) => d.id))
  console.log(`questions portant au moins une alerte : ${touches.size} / ${items.length}`)
}
