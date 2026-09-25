'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { LIBELLE_ACCENT, PARTS_LISTENING, type Accent } from '@/exams/toeic/listening'

interface EtatAudio {
  moteurServeur: { id: string; libelle: string; raisonIndisponibilite: string | null }
  accentsDisponibles: Accent[]
  accentsNonCouverts: Accent[]
  locuteursParAccent: Record<string, number>
}

interface EtatSynthese {
  total: number
  synthetises: number
  enAttente: number
  parAccent: Record<string, number>
}

const EXEMPLE = `[ACCENT: UK]
[1] Good morning. I'd like to book the large meeting room for Thursday afternoon.
[2] Certainly. How many people will be attending?
[1] About twelve. And we'll need a projector and a whiteboard.
[2] The projector is already installed. I'll have a whiteboard brought in.
---
Q. What does the man want to do?
A) Cancel a reservation
B) Reserve a meeting room
C) Purchase a projector
D) Reschedule a conference
Réponse : B

Q. What does the woman say she will do?
A) Install a projector
B) Arrange for a whiteboard
C) Contact the attendees
D) Send a confirmation
Réponse : B`

export default function AudioClient({
  etatInitial,
  syntheseInitiale,
}: {
  etatInitial: EtatAudio
  syntheseInitiale: EtatSynthese
}) {
  const router = useRouter()
  const [synthese, setSynthese] = useState(syntheseInitiale)
  const [texte, setTexte] = useState('')
  const [part, setPart] = useState('p3')
  const [accent, setAccent] = useState<Accent>(etatInitial.accentsDisponibles[0] ?? 'US')
  const [message, setMessage] = useState('')
  const [erreur, setErreur] = useState('')
  const [occupe, setOccupe] = useState(false)

  const pret = etatInitial.moteurServeur.raisonIndisponibilite === null

  async function importer() {
    if (!texte.trim()) return
    setOccupe(true)
    setErreur('')
    setMessage('')
    try {
      const r = await fetch('/api/listening/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texte, part, accentDefaut: accent }),
      })
      const data = await r.json()
      if (!r.ok) {
        setErreur(data.erreur)
        return
      }
      setMessage(
        `${data.medias} enregistrement${data.medias > 1 ? 's' : ''} et ${data.questions} question${data.questions > 1 ? 's' : ''} ajoutés.` +
          (data.avertissements.length > 0 ? ` ${data.avertissements.length} bloc(s) écarté(s).` : ''),
      )
      if (data.medias > 0) setTexte('')
      await rafraichir()
    } finally {
      setOccupe(false)
    }
  }

  async function rafraichir() {
    const r = await fetch('/api/audio/synthese')
    const data = await r.json()
    setSynthese(data.synthese)
    router.refresh()
  }

  async function synthetiser() {
    setOccupe(true)
    setErreur('')
    setMessage('')
    try {
      const r = await fetch('/api/audio/synthese', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ limite: 20 }),
      })
      const data = await r.json()
      if (!r.ok) {
        setErreur(data.erreur)
        return
      }
      setSynthese(data.synthese)
      setMessage(
        `${data.synthetises} audio synthétisé${data.synthetises > 1 ? 's' : ''}.` +
          (data.echecs.length > 0 ? ` ${data.echecs.length} échec(s) : ${data.echecs[0].erreur}` : ''),
      )
      router.refresh()
    } finally {
      setOccupe(false)
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <Link href="/toeic" className="text-sm text-doux hover:text-texte">
        ← TOEIC
      </Link>

      <header className="mt-6 mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Atelier audio</h1>
        <p className="mt-1 text-sm leading-relaxed text-doux">
          Les enregistrements sont synthétisés en local, une fois, et mis en cache : un script
          inchangé n’est jamais resynthétisé. Rien ne sort de cette machine.
        </p>
      </header>

      {/* État du moteur */}
      <section className="mb-8 rounded-xl border border-bord bg-carte px-5 py-4">
        <p className={`text-sm font-medium ${pret ? 'text-juste' : 'text-faux'}`}>
          {pret ? `Moteur prêt : ${etatInitial.moteurServeur.libelle}` : 'Aucun moteur de synthèse'}
        </p>
        {!pret && (
          <p className="mt-1 text-sm text-doux">
            {etatInitial.moteurServeur.raisonIndisponibilite} — voir{' '}
            <code className="text-texte">.env.local.exemple</code>.
          </p>
        )}

        {pret && (
          <>
            <p className="mt-3 text-sm text-doux">
              Accents disponibles :{' '}
              {etatInitial.accentsDisponibles
                .map(
                  (a) =>
                    `${LIBELLE_ACCENT[a]} (${etatInitial.locuteursParAccent[a]} voix)`,
                )
                .join(' · ')}
            </p>

            {etatInitial.accentsNonCouverts.length > 0 && (
              <p className="mt-2 text-sm text-blanc">
                Non couverts :{' '}
                {etatInitial.accentsNonCouverts.map((a) => LIBELLE_ACCENT[a]).join(' et ')}. Le
                catalogue Piper ne contient pas ces voix. Le TOEIC en utilise quatre : ce module
                n’en entraîne que {etatInitial.accentsDisponibles.length}. Faire passer une voix
                britannique pour de l’australien serait pire que de ne rien proposer — tu te
                croirais faible sur un accent que tu n’aurais jamais entendu.
              </p>
            )}
          </>
        )}
      </section>

      {/* Synthèse */}
      <section className="mb-10">
        <h2 className="mb-3 text-sm uppercase tracking-widest text-doux">Enregistrements</h2>

        <div className="rounded-xl border border-bord bg-carte px-5 py-4">
          <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2 text-sm">
            <span>
              <span className="chiffres text-2xl font-semibold text-juste">
                {synthese.synthetises}
              </span>
              <span className="text-doux"> synthétisés</span>
            </span>
            <span className="text-doux">
              <span className="chiffres text-blanc">{synthese.enAttente}</span> en attente
            </span>
            {Object.entries(synthese.parAccent).map(([a, n]) => (
              <span key={a} className="text-xs text-doux">
                {LIBELLE_ACCENT[a as Accent] ?? a} <span className="chiffres">{n}</span>
              </span>
            ))}
          </div>

          {synthese.enAttente > 0 && (
            <button
              onClick={() => void synthetiser()}
              disabled={occupe || !pret}
              className="mt-4 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-fond transition hover:opacity-90 disabled:opacity-40"
            >
              {occupe ? 'Synthèse en cours…' : `Synthétiser ${Math.min(20, synthese.enAttente)} audio`}
            </button>
          )}

          <p className="mt-3 text-xs leading-relaxed text-doux">
            La génération se fait par lot, jamais pendant un entraînement : le processeur est
            partagé avec le navigateur. Un item sans audio est écarté des séries plutôt que servi
            en transcript — lire au lieu d’écouter n’entraîne pas la compétence testée.
          </p>
        </div>
      </section>

      {/* Import */}
      <section>
        <h2 className="mb-1 text-sm uppercase tracking-widest text-doux">Importer des scripts</h2>
        <p className="mb-4 text-sm text-doux">
          Un bloc = un enregistrement et ses questions. Les marqueurs{' '}
          <code className="text-texte">[1]</code> et <code className="text-texte">[2]</code>{' '}
          désignent les locuteurs : ce sont eux qui déclenchent la synthèse à deux voix des
          conversations. Sépare deux enregistrements par deux lignes vides.
        </p>

        <div className="mb-4 grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-xs uppercase tracking-widest text-doux">Part</span>
            <select
              value={part}
              onChange={(e) => setPart(e.target.value)}
              className="w-full rounded-lg border border-bord bg-carte px-3 py-2.5 text-sm"
            >
              {PARTS_LISTENING.map((p) => (
                <option key={p.id} value={p.id}>
                  Part {p.numero} — {p.libelle}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs uppercase tracking-widest text-doux">
              Accent par défaut
            </span>
            <select
              value={accent}
              onChange={(e) => setAccent(e.target.value as Accent)}
              className="w-full rounded-lg border border-bord bg-carte px-3 py-2.5 text-sm"
            >
              {etatInitial.accentsDisponibles.map((a) => (
                <option key={a} value={a}>
                  {LIBELLE_ACCENT[a]}
                </option>
              ))}
            </select>
          </label>
        </div>

        <button
          onClick={() => setTexte(EXEMPLE)}
          className="mb-2 text-sm text-doux underline-offset-4 hover:text-texte hover:underline"
        >
          Insérer un exemple
        </button>

        <textarea
          value={texte}
          onChange={(e) => setTexte(e.target.value)}
          rows={14}
          spellCheck={false}
          placeholder={'[ACCENT: UK]\n[1] …\n[2] …\n---\nQ. …\nA) …\nRéponse : B'}
          className="w-full rounded-lg border border-bord bg-carte px-4 py-3 font-mono text-sm leading-relaxed outline-none focus:border-accent"
        />

        <div className="mt-4 flex flex-wrap items-center gap-4">
          <button
            onClick={() => void importer()}
            disabled={occupe || !texte.trim()}
            className="rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-fond transition hover:opacity-90 disabled:opacity-40"
          >
            Importer
          </button>
          {message && <span className="text-sm text-juste">{message}</span>}
          {erreur && <span className="text-sm text-faux">{erreur}</span>}
        </div>
      </section>
    </main>
  )
}
