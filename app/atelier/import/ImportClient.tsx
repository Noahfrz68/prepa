'use client'

import Link from 'next/link'
import { useRef, useState } from 'react'

interface ItemParse {
  enonce: string
  options: string[]
  bonneReponse: string
  typeItem: 'qcm' | 'conditions_minimales'
  info1?: string
  info2?: string
  explication?: string
}

interface Section {
  id: string
  libelle: string
}

interface Skill {
  id: string
  section: string
  libelle: string
}

const EXEMPLE_COLLE = `1. Un train parcourt 240 km en 3 h. Quelle est sa vitesse moyenne ?
A) 60 km/h
B) 70 km/h
C) 80 km/h
D) 90 km/h
E) 100 km/h
Réponse : C
Explication : 240 / 3 = 80

2. Le prix d'un article passe de 80 € à 100 €. Quelle est la hausse ?
A) 20 %
B) 25 %
C) 80 %
D) 125 %
E) Aucune
Réponse : B`

const EXEMPLE_CSV = `enonce;option_a;option_b;option_c;option_d;option_e;bonne_reponse;explication
Vitesse moyenne sur 240 km en 3 h ?;60;70;80;90;100;C;240 / 3 = 80`

export default function ImportClient({
  examId,
  sections,
  skills,
  sectionInitiale,
}: {
  examId: string
  sections: Section[]
  skills: Skill[]
  sectionInitiale?: string
}) {
  const [section, setSection] = useState(sectionInitiale ?? sections[0]?.id ?? '')
  const [skillId, setSkillId] = useState('')
  const [format, setFormat] = useState<'colle' | 'csv'>('colle')
  const [texte, setTexte] = useState('')
  const [apercu, setApercu] = useState<ItemParse[] | null>(null)
  const [avertissements, setAvertissements] = useState<string[]>([])
  const [message, setMessage] = useState('')
  const [occupe, setOccupe] = useState(false)
  const fichier = useRef<HTMLInputElement>(null)

  const skillsSection = skills.filter((s) => s.section === section)

  async function appeler(apercuSeulement: boolean) {
    if (!texte.trim()) return
    setOccupe(true)
    setMessage('')
    try {
      const r = await fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          texte,
          format,
          examId,
          section,
          skillId: skillId || null,
          apercuSeulement,
        }),
      })
      const data = await r.json()
      if (!r.ok) {
        setMessage(data.erreur ?? 'Échec.')
        return
      }
      setApercu(data.items)
      setAvertissements(data.avertissements ?? [])
      if (!apercuSeulement) {
        setMessage(
          data.inseres > 0
            ? `${data.inseres} question${data.inseres > 1 ? 's' : ''} ajoutée${data.inseres > 1 ? 's' : ''}.`
            : 'Rien n’a été ajouté.',
        )
        if (data.inseres > 0) {
          setTexte('')
          setApercu(null)
        }
      }
    } finally {
      setOccupe(false)
    }
  }

  function chargerFichier(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    const lecteur = new FileReader()
    lecteur.onload = () => {
      setTexte(String(lecteur.result ?? ''))
      setFormat(f.name.toLowerCase().endsWith('.csv') ? 'csv' : 'colle')
    }
    lecteur.readAsText(f, 'utf-8')
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <Link href="/atelier" className="text-sm text-doux hover:text-texte">
        ← Mes questions
      </Link>

      <header className="mt-6 mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Coller des questions</h1>
        <p className="mt-1 text-sm text-doux">
          Colle un bloc de questions ou un CSV, ou ouvre un fichier texte depuis ton disque. Rien
          n’est téléchargé depuis Internet. Pour une annale en PDF ou une série de compréhension,
          passe par{' '}
          <Link href="/atelier" className="text-accent hover:underline">
            Mes questions
          </Link>
          .
        </p>
        <div className="mt-4 flex rounded-lg border border-bord p-1">
          {[
            { id: 'tagemage', libelle: 'TAGE MAGE' },
            { id: 'toeic_lr', libelle: 'TOEIC' },
          ].map((e) => (
            <a
              key={e.id}
              href={`/atelier/import?exam=${e.id}`}
              className={`rounded px-3 py-1.5 text-sm transition ${
                examId === e.id ? 'bg-carte-clair text-texte' : 'text-doux hover:text-texte'
              }`}
            >
              {e.libelle}
            </a>
          ))}
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-xs uppercase tracking-widest text-doux">
            Sous-test
          </span>
          <select
            value={section}
            onChange={(e) => {
              setSection(e.target.value)
              setSkillId('')
            }}
            className="w-full rounded-lg border border-bord bg-carte px-3 py-2.5 text-sm"
          >
            {sections.map((s) => (
              <option key={s.id} value={s.id}>
                {s.libelle}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs uppercase tracking-widest text-doux">
            Type de question <span className="normal-case opacity-70">(facultatif)</span>
          </span>
          <select
            value={skillId}
            onChange={(e) => setSkillId(e.target.value)}
            className="w-full rounded-lg border border-bord bg-carte px-3 py-2.5 text-sm"
          >
            <option value="">— non taguée —</option>
            {skillsSection.map((s) => (
              <option key={s.id} value={s.id}>
                {s.libelle}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="flex rounded-lg border border-bord p-1">
          {(['colle', 'csv'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFormat(f)}
              className={`rounded px-3 py-1.5 text-sm transition ${
                format === f ? 'bg-carte-clair text-texte' : 'text-doux hover:text-texte'
              }`}
            >
              {f === 'colle' ? 'Texte collé' : 'CSV'}
            </button>
          ))}
        </div>

        <button
          onClick={() => fichier.current?.click()}
          className="rounded-lg border border-bord px-3 py-2 text-sm text-doux transition hover:text-texte"
        >
          Ouvrir un fichier…
        </button>
        <input
          ref={fichier}
          type="file"
          accept=".csv,.txt,.tsv,text/plain,text/csv"
          onChange={chargerFichier}
          className="hidden"
        />

        <button
          onClick={() => setTexte(format === 'csv' ? EXEMPLE_CSV : EXEMPLE_COLLE)}
          className="text-sm text-doux underline-offset-4 hover:text-texte hover:underline"
        >
          Insérer un exemple
        </button>
      </div>

      <textarea
        value={texte}
        onChange={(e) => setTexte(e.target.value)}
        rows={14}
        spellCheck={false}
        placeholder={
          format === 'csv'
            ? 'enonce;option_a;option_b;…;bonne_reponse'
            : '1. Énoncé…\nA) …\nB) …\nRéponse : B'
        }
        className="mt-4 w-full rounded-lg border border-bord bg-carte px-4 py-3 font-mono text-sm leading-relaxed outline-none focus:border-accent"
      />

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          onClick={() => appeler(true)}
          disabled={occupe || !texte.trim()}
          className="rounded-lg border border-bord px-4 py-2.5 text-sm text-doux transition hover:text-texte disabled:opacity-40"
        >
          Prévisualiser
        </button>
        <button
          onClick={() => appeler(false)}
          disabled={occupe || !texte.trim()}
          className="rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-fond transition hover:opacity-90 disabled:opacity-40"
        >
          Importer
        </button>
        {message && <span className="text-sm text-juste">{message}</span>}
      </div>

      {avertissements.length > 0 && (
        <div className="mt-6 rounded-xl border border-bord bg-carte px-5 py-4">
          <p className="text-sm font-medium text-blanc">
            {avertissements.length} bloc{avertissements.length > 1 ? 's' : ''} non importé
            {avertissements.length > 1 ? 's' : ''}
          </p>
          <ul className="mt-2 space-y-1 text-sm text-doux">
            {avertissements.map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
        </div>
      )}

      {apercu && apercu.length > 0 && (
        <div className="mt-6">
          <h2 className="mb-3 text-sm uppercase tracking-widest text-doux">
            Aperçu — {apercu.length} question{apercu.length > 1 ? 's' : ''}
          </h2>
          <ol className="space-y-3">
            {apercu.map((it, i) => (
              <li key={i} className="rounded-xl border border-bord bg-carte px-5 py-4 text-sm">
                <p className="leading-relaxed">{it.enonce}</p>
                {it.typeItem === 'conditions_minimales' ? (
                  <div className="mt-2 space-y-1 text-doux">
                    <p>(1) {it.info1}</p>
                    <p>(2) {it.info2}</p>
                    <p className="text-xs text-blanc">Conditions minimales — propositions A-E figées</p>
                  </div>
                ) : (
                  <ul className="mt-2 space-y-0.5 text-doux">
                    {it.options.map((o, j) => (
                      <li key={j}>
                        {String.fromCharCode(65 + j)}. {o}
                      </li>
                    ))}
                  </ul>
                )}
                <p className="mt-2 text-juste">Réponse : {it.bonneReponse}</p>
              </li>
            ))}
          </ol>
        </div>
      )}
    </main>
  )
}
