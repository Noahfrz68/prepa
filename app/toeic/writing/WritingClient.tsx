'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  GRILLES,
  LONGUEUR_ATTENDUE,
  compterMots,
  type NoteCritere,
  type TypeTacheWriting,
} from '@/exams/toeic/writing'

interface Sujet {
  id: number
  type: TypeTacheWriting
  numero: number
  libelle: string
  consigne: string
  dureeReponseS: number
  noteMax: number
  dejaFait: number
}

interface ProductionComplete {
  id: number
  type: TypeTacheWriting
  libelleTache: string
  consigne: string
  contenu: string
  tempsMs: number
  notes: NoteCritere[] | null
  noteGlobale: number | null
  noteMax: number
  feedback: string | null
  fournisseur: string | null
  modele: string | null
  creeLe: string
}

type Vue = 'liste' | 'redaction' | 'resultat'

const mmss = (s: number) =>
  `${Math.floor(Math.max(0, s) / 60)}:${String(Math.max(0, s) % 60).padStart(2, '0')}`

export default function WritingClient({
  sujets,
  historique,
  estimation,
  iaDisponible,
}: {
  sujets: Sujet[]
  historique: ProductionComplete[]
  estimation: { score: number; n: number; fiable: boolean }
  iaDisponible: boolean
}) {
  const router = useRouter()
  const [vue, setVue] = useState<Vue>('liste')
  const [sujet, setSujet] = useState<Sujet | null>(null)
  const [texte, setTexte] = useState('')
  const [restant, setRestant] = useState(0)
  const [resultat, setResultat] = useState<ProductionComplete | null>(null)
  const [erreurNotation, setErreurNotation] = useState<string | null>(null)
  const [occupe, setOccupe] = useState(false)
  const debut = useRef(0)
  const envoiEnCours = useRef(false)

  /* -------------------------------------------------------- chrono -- */

  useEffect(() => {
    if (vue !== 'redaction' || !sujet) return

    const t = setInterval(() => {
      const ecoule = Math.floor((Date.now() - debut.current) / 1000)
      setRestant(sujet.dureeReponseS - ecoule)
    }, 500)

    return () => clearInterval(t)
  }, [vue, sujet])

  const rendre = useCallback(async () => {
    if (!sujet || envoiEnCours.current || !texte.trim()) return
    envoiEnCours.current = true
    setOccupe(true)
    setErreurNotation(null)

    try {
      const r = await fetch('/api/writing/production', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          promptTaskId: sujet.id,
          contenu: texte,
          tempsMs: Date.now() - debut.current,
        }),
      })
      const data = await r.json()
      if (!r.ok) {
        setErreurNotation(data.erreur)
        return
      }

      setVue('resultat')

      // La notation vient après : la production est déjà en sécurité, et
      // l'écran de résultat s'affiche sans attendre un modèle.
      const n = await fetch('/api/writing/notation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: data.id }),
      })
      const notation = await n.json()
      setResultat(notation.production)
      if (notation.resultat?.statut !== 'fait') {
        setErreurNotation(notation.resultat?.erreur ?? null)
      }
      router.refresh()
    } finally {
      envoiEnCours.current = false
      setOccupe(false)
    }
  }, [router, sujet, texte])

  /* ---------------------------------------------------------- vues -- */

  if (vue === 'redaction' && sujet) {
    const mots = compterMots(texte)
    const attendu = LONGUEUR_ATTENDUE[sujet.type]
    const depassement = restant < 0

    return (
      <main className="mx-auto max-w-3xl px-6 py-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 text-sm">
          <button onClick={() => setVue('liste')} className="text-doux hover:text-texte">
            ← Abandonner
          </button>
          <span className="text-doux">{sujet.libelle}</span>
          <span className={`chiffres tabular-nums ${depassement ? 'text-faux' : 'text-texte'}`}>
            {depassement ? `+${mmss(-restant)}` : mmss(restant)}
          </span>
        </div>

        <div className="h-1 w-full overflow-hidden rounded bg-carte-clair">
          <div
            className={`h-full transition-all ${depassement ? 'bg-faux' : 'bg-accent'}`}
            style={{
              width: `${Math.max(0, Math.min(100, (restant / sujet.dureeReponseS) * 100))}%`,
            }}
          />
        </div>

        <div className="mt-5 whitespace-pre-wrap rounded-xl border border-bord bg-carte px-5 py-4 text-sm leading-relaxed">
          {sujet.consigne}
        </div>

        <textarea
          value={texte}
          onChange={(e) => setTexte(e.target.value)}
          rows={18}
          spellCheck={false}
          placeholder="Write your answer in English…"
          className="mt-4 w-full rounded-lg border border-bord bg-carte px-4 py-3 text-sm leading-relaxed outline-none focus:border-accent"
        />

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm">
          <span className={`chiffres ${mots < attendu.min ? 'text-blanc' : 'text-doux'}`}>
            {mots} mot{mots > 1 ? 's' : ''} · {attendu.cible} attendus
          </span>
          <button
            onClick={() => void rendre()}
            disabled={occupe || !texte.trim()}
            className="rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-fond transition hover:opacity-90 disabled:opacity-40"
          >
            {occupe ? 'Enregistrement…' : 'Rendre'}
          </button>
        </div>

        {depassement && (
          <p className="mt-3 text-sm text-faux">
            Temps dépassé. À l’examen, la copie serait fermée : rends-la pour mesurer où tu en
            étais.
          </p>
        )}
      </main>
    )
  }

  if (vue === 'resultat') {
    return (
      <main className="mx-auto max-w-3xl px-6 py-12">
        <button onClick={() => setVue('liste')} className="text-sm text-doux hover:text-texte">
          ← Writing
        </button>

        <h1 className="mt-6 text-2xl font-semibold tracking-tight">
          {resultat?.noteGlobale !== null && resultat !== null ? (
            <>
              <span className="chiffres">{resultat.noteGlobale}</span>
              <span className="text-base font-normal text-doux"> / {resultat.noteMax}</span>
            </>
          ) : (
            'Production enregistrée'
          )}
        </h1>

        {resultat?.notes && resultat.notes.length > 0 && (
          <section className="mt-6">
            <h2 className="mb-3 text-sm uppercase tracking-widest text-doux">Par critère</h2>
            <ul className="space-y-2">
              {GRILLES[resultat.type].map((c) => {
                const n = resultat.notes!.find((x) => x.id === c.id)
                return (
                  <li key={c.id} className="rounded-xl border border-bord bg-carte px-5 py-4">
                    <div className="flex flex-wrap items-baseline justify-between gap-3">
                      <span className="font-medium">{c.libelle}</span>
                      <span
                        className={`chiffres text-sm ${
                          (n?.note ?? 0) >= c.noteMax ? 'text-juste' : 'text-faux'
                        }`}
                      >
                        {n?.note ?? 0} / {c.noteMax}
                      </span>
                    </div>
                    {n?.justification && (
                      <p className="mt-1.5 text-sm text-doux">{n.justification}</p>
                    )}
                  </li>
                )
              })}
            </ul>
          </section>
        )}

        {resultat?.feedback && (
          <section className="mt-6">
            <h2 className="mb-3 text-sm uppercase tracking-widest text-doux">Débrief</h2>
            <div className="rounded-xl border border-bord bg-carte px-5 py-4">
              {resultat.feedback.split(/\n+/).map((p, i) => (
                <p key={i} className={`text-sm leading-relaxed ${i > 0 ? 'mt-2' : ''}`}>
                  {p}
                </p>
              ))}
              <p className="mt-3 border-t border-bord pt-3 text-xs text-doux">
                {resultat.fournisseur} · {resultat.modele} — interprétation d’un modèle. La
                notation officielle d’ETS suit une grille que nous n’avons pas.
              </p>
            </div>
          </section>
        )}

        {erreurNotation && (
          <p className="mt-6 rounded-xl border border-bord bg-carte px-5 py-4 text-sm text-doux">
            Aucune note :{' '}
            {iaDisponible
              ? erreurNotation
              : 'aucun fournisseur d’IA configuré. Ta production est conservée et relisible.'}{' '}
            {!iaDisponible && (
              <Link href="/reglages" className="text-accent hover:underline">
                Configurer un fournisseur →
              </Link>
            )}
          </p>
        )}

        {resultat && (
          <section className="mt-8">
            <h2 className="mb-3 text-sm uppercase tracking-widest text-doux">Ta production</h2>
            <div className="whitespace-pre-wrap rounded-xl border border-bord bg-carte px-5 py-4 text-sm leading-relaxed">
              {resultat.contenu}
            </div>
          </section>
        )}

        <button
          onClick={() => setVue('liste')}
          className="mt-8 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-fond hover:opacity-90"
        >
          Retour aux sujets
        </button>
      </main>
    )
  }

  /* ---------------------------------------------------------- liste -- */

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <Link href="/toeic" className="text-sm text-doux hover:text-texte">
        ← TOEIC
      </Link>

      <header className="mt-6 mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Writing</h1>
        <p className="mt-1 text-sm leading-relaxed text-doux">
          Le TOEIC Speaking &amp; Writing est un examen distinct du Listening &amp; Reading :
          autre inscription, autre session. La plupart des écoles françaises n’exigent que le
          L&amp;R — ne travaille cette épreuve que si tu la passes vraiment.
        </p>
      </header>

      {estimation.n > 0 && (
        <section className="mb-8 rounded-xl border border-bord bg-carte px-5 py-4">
          <p>
            <span className="chiffres text-3xl font-semibold">{estimation.score}</span>
            <span className="text-base font-normal text-doux"> / 200 estimés</span>
          </p>
          <p className="mt-1 text-sm text-doux">
            Sur {estimation.n} production{estimation.n > 1 ? 's' : ''} notée
            {estimation.n > 1 ? 's' : ''}.
            {!estimation.fiable && ' Trop peu pour en tirer une conclusion.'}
          </p>
          <p className="mt-2 text-xs text-doux">
            Estimation grossière : le barème officiel d’ETS n’est pas publié, et une poignée de
            tâches ne prédit pas une épreuve entière.
          </p>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-sm uppercase tracking-widest text-doux">Sujets</h2>

        {sujets.length === 0 ? (
          <p className="rounded-xl border border-bord bg-carte px-5 py-4 text-sm text-doux">
            Aucun sujet en banque.
          </p>
        ) : (
          <ul className="space-y-2">
            {sujets.map((s) => (
              <li key={s.id} className="rounded-xl border border-bord bg-carte px-5 py-4">
                <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                  <span className="chiffres text-sm text-doux">{s.numero}</span>
                  <span className="flex-1 font-medium">{s.libelle}</span>
                  <span className="chiffres text-sm text-doux">
                    {Math.round(s.dureeReponseS / 60)} min · {s.noteMax} pts
                  </span>
                  {s.dejaFait > 0 && (
                    <span className="chiffres text-xs text-doux">{s.dejaFait} fait</span>
                  )}
                </div>

                <p className="mt-2 line-clamp-2 text-sm text-doux">
                  {s.consigne.split('\n')[0].slice(0, 120)}…
                </p>

                <button
                  onClick={() => {
                    setSujet(s)
                    setTexte('')
                    setResultat(null)
                    setErreurNotation(null)
                    debut.current = Date.now()
                    setRestant(s.dureeReponseS)
                    setVue('redaction')
                  }}
                  className="mt-3 rounded-lg bg-accent px-3.5 py-2 text-sm font-medium text-fond transition hover:opacity-90"
                >
                  Commencer
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {historique.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-3 text-sm uppercase tracking-widest text-doux">Productions</h2>
          <ul className="space-y-1.5">
            {historique.map((p) => (
              <li key={p.id}>
                <button
                  onClick={() => {
                    setResultat(p)
                    setErreurNotation(p.noteGlobale === null ? 'production non notée' : null)
                    setVue('resultat')
                  }}
                  className="flex w-full flex-wrap items-center gap-x-4 gap-y-1 rounded-lg border border-bord bg-carte px-4 py-2.5 text-left text-sm transition hover:border-accent"
                >
                  <span className="flex-1">{p.libelleTache}</span>
                  <span className="chiffres text-xs text-doux">{p.creeLe.slice(0, 10)}</span>
                  <span className="chiffres w-16 text-right">
                    {p.noteGlobale === null ? (
                      <span className="text-doux">non notée</span>
                    ) : (
                      `${p.noteGlobale}/${p.noteMax}`
                    )}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Speaking : ce qui manque, et pourquoi. */}
      <section className="mt-10">
        <h2 className="mb-3 text-sm uppercase tracking-widest text-doux">Speaking</h2>
        <div className="rounded-xl border border-bord bg-carte px-5 py-4 text-sm leading-relaxed text-doux">
          <p>
            Non construit. Noter une production orale demanderait une transcription automatique
            locale — un second téléchargement, et un traitement lourd sur cette machine.
          </p>
          <p className="mt-2">
            Surtout, deux des onze tâches portent sur la prononciation et l’intonation, qu’aucun
            modèle ne peut juger à partir d’une transcription : il n’entend rien. Livrer une note
            sur ces critères serait livrer un chiffre inventé. Les épreuves écrites, elles, sont
            intégralement évaluables sur ce qui est produit.
          </p>
        </div>
      </section>
    </main>
  )
}
