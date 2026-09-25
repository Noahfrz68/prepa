'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface Ligne {
  examId: string
  libelle: string
  max: number
  dateExamen: string | null
  dateProvisoire: boolean
  scoreCible: number | null
  motif: string | null
}

export default function ObjectifsClient({
  initial,
  heuresInitiales,
}: {
  initial: Ligne[]
  heuresInitiales: number | null
}) {
  const router = useRouter()
  const [lignes, setLignes] = useState(initial)
  const [heures, setHeures] = useState<number | null>(heuresInitiales)
  const [message, setMessage] = useState('')
  const [erreur, setErreur] = useState('')
  const [occupe, setOccupe] = useState(false)

  const modifier = (examId: string, champ: keyof Ligne, valeur: unknown) =>
    setLignes((l) => l.map((x) => (x.examId === examId ? { ...x, [champ]: valeur } : x)))

  async function enregistrer() {
    setOccupe(true)
    setErreur('')
    setMessage('')
    try {
      const rp = await fetch('/api/profil', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ heuresDispoSemaine: heures }),
      })
      if (!rp.ok) {
        setErreur((await rp.json()).erreur)
        return
      }

      for (const l of lignes) {
        const r = await fetch('/api/objectif', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            examId: l.examId,
            dateExamen: l.dateExamen,
            dateProvisoire: l.dateProvisoire,
            scoreCible: l.scoreCible,
            motif: l.motif,
          }),
        })
        if (!r.ok) {
          setErreur(`${l.libelle} : ${(await r.json()).erreur}`)
          return
        }
      }
      setMessage('Objectifs enregistrés.')
      router.refresh()
    } finally {
      setOccupe(false)
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <Link href="/" className="text-sm text-doux hover:text-texte">
        ← Accueil
      </Link>

      <header className="mt-6 mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Objectifs</h1>
        <p className="mt-1 text-sm text-doux">
          La date et le score cible ne sont pas décoratifs : ils déterminent l’écart chiffré
          affiché après chaque épreuve, et l’arbitrage entre les deux préparations.
        </p>
      </header>

      <section className="mb-4 rounded-xl border border-bord bg-carte p-5">
        <h2 className="font-medium">Volume de travail</h2>
        <label className="mt-4 block max-w-xs">
          <span className="mb-1.5 block text-xs uppercase tracking-widest text-doux">
            Heures disponibles par semaine
          </span>
          <input
            type="number"
            min={1}
            max={80}
            step={0.5}
            value={heures ?? ''}
            onChange={(e) => setHeures(e.target.value === '' ? null : Number(e.target.value))}
            className="chiffres w-full rounded-lg border border-bord bg-carte-clair px-3 py-2.5 text-sm"
          />
        </label>
        <p className="mt-2 text-xs leading-relaxed text-doux">
          Déclare ce que tu peux vraiment tenir, pas ce que tu voudrais tenir. Le plan compare
          ensuite ce volume au temps réellement passé et se corrige tout seul.
        </p>
      </section>

      <div className="space-y-4">
        {lignes.map((l) => (
          <section key={l.examId} className="rounded-xl border border-bord bg-carte p-5">
            <h2 className="font-medium">{l.libelle}</h2>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-xs uppercase tracking-widest text-doux">
                  Date d’examen
                </span>
                <input
                  type="date"
                  value={l.dateExamen ?? ''}
                  onChange={(e) => modifier(l.examId, 'dateExamen', e.target.value || null)}
                  className="w-full rounded-lg border border-bord bg-carte-clair px-3 py-2.5 text-sm"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs uppercase tracking-widest text-doux">
                  Score cible <span className="normal-case opacity-70">(sur {l.max})</span>
                </span>
                <input
                  type="number"
                  min={0}
                  max={l.max}
                  value={l.scoreCible ?? ''}
                  onChange={(e) =>
                    modifier(l.examId, 'scoreCible', e.target.value === '' ? null : Number(e.target.value))
                  }
                  className="chiffres w-full rounded-lg border border-bord bg-carte-clair px-3 py-2.5 text-sm"
                />
              </label>
            </div>

            <label className="mt-3 flex items-center gap-2 text-sm text-doux">
              <input
                type="checkbox"
                checked={l.dateProvisoire}
                onChange={(e) => modifier(l.examId, 'dateProvisoire', e.target.checked)}
                className="accent-[var(--accent)]"
              />
              Date provisoire — je ne suis pas encore inscrit
            </label>

            <label className="mt-3 block">
              <span className="mb-1.5 block text-xs uppercase tracking-widest text-doux">
                Motif <span className="normal-case opacity-70">(écoles visées, exigence)</span>
              </span>
              <input
                type="text"
                value={l.motif ?? ''}
                onChange={(e) => modifier(l.examId, 'motif', e.target.value)}
                className="w-full rounded-lg border border-bord bg-carte-clair px-3 py-2.5 text-sm"
              />
            </label>
          </section>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <button
          onClick={enregistrer}
          disabled={occupe}
          className="rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-fond transition hover:opacity-90 disabled:opacity-40"
        >
          Enregistrer
        </button>
        {message && <span className="text-sm text-juste">{message}</span>}
        {erreur && <span className="text-sm text-faux">{erreur}</span>}
      </div>
    </main>
  )
}
