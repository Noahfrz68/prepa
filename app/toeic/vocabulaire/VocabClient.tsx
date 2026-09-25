'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { Carte, EtatVocabulaire } from '@/core/db/vocabulaire'

type Vue = 'liste' | 'revision' | 'termine'

export default function VocabClient({
  etat,
  dues,
  toutes,
}: {
  etat: EtatVocabulaire
  dues: Carte[]
  toutes: Carte[]
}) {
  const router = useRouter()
  const [vue, setVue] = useState<Vue>('liste')
  const [index, setIndex] = useState(0)
  const [revele, setRevele] = useState(false)
  const [bilan, setBilan] = useState({ sues: 0, ratees: 0 })
  const debut = useRef(Date.now())
  const enCours = useRef(false)

  const carte = dues[index]

  const repondre = useCallback(
    async (su: boolean) => {
      if (enCours.current || !carte) return
      enCours.current = true
      try {
        await fetch('/api/vocab/revision', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cardId: carte.id, su, tempsMs: Date.now() - debut.current }),
        })
        setBilan((b) => ({
          sues: b.sues + (su ? 1 : 0),
          ratees: b.ratees + (su ? 0 : 1),
        }))

        if (index + 1 < dues.length) {
          setIndex((i) => i + 1)
          setRevele(false)
          debut.current = Date.now()
        } else {
          setVue('termine')
          router.refresh()
        }
      } finally {
        enCours.current = false
      }
    },
    [carte, dues.length, index, router],
  )

  useEffect(() => {
    if (vue !== 'revision') return
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const k = e.key.toLowerCase()

      if (!revele) {
        if (k === ' ' || k === 'enter') {
          e.preventDefault()
          setRevele(true)
        }
        return
      }
      if (k === '1' || k === 'n') {
        e.preventDefault()
        void repondre(false)
      } else if (k === '2' || k === 'o' || k === 'y') {
        e.preventDefault()
        void repondre(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [repondre, revele, vue])

  /* ------------------------------------------------------- révision -- */

  if (vue === 'revision' && carte) {
    return (
      <main className="mx-auto max-w-xl px-6 py-16">
        <div className="mb-8 flex items-center justify-between text-sm text-doux">
          <button onClick={() => setVue('liste')} className="hover:text-texte">
            ← Arrêter
          </button>
          <span className="chiffres">
            {index + 1} / {dues.length}
          </span>
        </div>

        <div className="rounded-xl border border-bord bg-carte px-6 py-10 text-center">
          <p className="text-3xl font-semibold">{carte.terme}</p>
          {carte.forme !== 'mot' && (
            <p className="mt-1 text-xs uppercase tracking-widest text-doux">
              {carte.forme.replace('_', ' ')}
            </p>
          )}

          {revele ? (
            <div className="mt-6 space-y-3 border-t border-bord pt-6 text-sm">
              {carte.traductionFr && <p className="text-lg">{carte.traductionFr}</p>}
              {carte.definitionEn && <p className="text-doux">{carte.definitionEn}</p>}
              {!carte.traductionFr && !carte.definitionEn && (
                <p className="text-blanc">
                  Cette carte n’a ni traduction ni définition. Complète-la depuis la liste pour
                  qu’elle serve à quelque chose.
                </p>
              )}
              {carte.exemple && (
                <p className="mt-4 border-t border-bord pt-4 text-left text-xs italic text-doux">
                  {carte.exemple}
                </p>
              )}
            </div>
          ) : (
            <button
              onClick={() => setRevele(true)}
              className="mt-8 text-sm text-accent hover:underline"
            >
              Révéler <span className="kbd ml-1">espace</span>
            </button>
          )}
        </div>

        {revele && (
          <div className="mt-6 grid grid-cols-2 gap-3">
            <button
              onClick={() => void repondre(false)}
              className="rounded-lg border border-faux px-4 py-3 text-sm text-faux transition hover:bg-carte"
            >
              <span className="kbd mr-2">1</span> Pas su
            </button>
            <button
              onClick={() => void repondre(true)}
              className="rounded-lg border border-juste px-4 py-3 text-sm text-juste transition hover:bg-carte"
            >
              <span className="kbd mr-2">2</span> Su
            </button>
          </div>
        )}
      </main>
    )
  }

  if (vue === 'termine') {
    return (
      <main className="mx-auto max-w-xl px-6 py-20 text-center">
        <h1 className="text-2xl font-semibold">Session terminée</h1>
        <p className="mt-3 text-sm text-doux">
          <span className="chiffres text-juste">{bilan.sues}</span> sue
          {bilan.sues > 1 ? 's' : ''} ·{' '}
          <span className="chiffres text-faux">{bilan.ratees}</span> à revoir. Les cartes ratées
          reviennent demain, les autres sont espacées.
        </p>
        <Link
          href="/toeic"
          className="mt-8 inline-block rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-fond hover:opacity-90"
        >
          Retour au TOEIC
        </Link>
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
        <h1 className="text-2xl font-semibold tracking-tight">Vocabulaire</h1>
        <p className="mt-1 text-sm leading-relaxed text-doux">
          Alimenté par tes erreurs, jamais par une liste. Chaque carte vient d’une question que
          tu as ratée, avec la phrase d’origine comme exemple.
        </p>
      </header>

      <section className="mb-8 rounded-xl border border-bord bg-carte px-5 py-4">
        <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2 text-sm">
          <span>
            <span className="chiffres text-2xl font-semibold">{etat.dues}</span>
            <span className="text-doux"> à réviser</span>
          </span>
          <span className="text-doux">
            <span className="chiffres text-texte">{etat.total}</span> carte
            {etat.total > 1 ? 's' : ''}
          </span>
          {etat.incompletes > 0 && (
            <span className="text-blanc">
              <span className="chiffres">{etat.incompletes}</span> sans définition ni traduction
            </span>
          )}
        </div>

        {dues.length > 0 ? (
          <button
            onClick={() => {
              setIndex(0)
              setRevele(false)
              setBilan({ sues: 0, ratees: 0 })
              debut.current = Date.now()
              setVue('revision')
            }}
            className="mt-4 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-fond transition hover:opacity-90"
          >
            Réviser {dues.length} carte{dues.length > 1 ? 's' : ''}
          </button>
        ) : (
          <p className="mt-3 text-sm text-doux">
            {etat.total === 0
              ? 'Aucune carte pour l’instant. Elles apparaîtront après une série Reading, sur les questions ratées en Part 5 et 6.'
              : 'Rien à réviser aujourd’hui.'}
          </p>
        )}
      </section>

      {etat.aVenir.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-sm uppercase tracking-widest text-doux">Programmées</h2>
          <ul className="flex flex-wrap gap-2">
            {etat.aVenir.map((c) => (
              <li
                key={c.terme}
                className="rounded-lg border border-bord bg-carte px-3 py-1.5 text-sm"
              >
                {c.terme}{' '}
                <span className="chiffres text-xs text-doux">
                  {c.dansJours <= 1 ? 'demain' : `dans ${c.dansJours} j`}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-sm uppercase tracking-widest text-doux">
          Toutes les cartes — {toutes.length}
        </h2>
        {toutes.length === 0 ? (
          <p className="rounded-xl border border-bord bg-carte px-5 py-4 text-sm text-doux">
            Aucune carte.
          </p>
        ) : (
          <ul className="space-y-2">
            {toutes.map((c) => (
              <LigneCarte key={c.id} carte={c} onChange={() => router.refresh()} />
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}

function LigneCarte({ carte, onChange }: { carte: Carte; onChange: () => void }) {
  const [edite, setEdite] = useState(false)
  const [traduction, setTraduction] = useState(carte.traductionFr ?? '')
  const [definition, setDefinition] = useState(carte.definitionEn ?? '')
  const [occupe, setOccupe] = useState(false)

  async function enregistrer() {
    setOccupe(true)
    try {
      await fetch('/api/vocab/carte', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: carte.id,
          traductionFr: traduction || null,
          definitionEn: definition || null,
        }),
      })
      setEdite(false)
      onChange()
    } finally {
      setOccupe(false)
    }
  }

  async function supprimer() {
    setOccupe(true)
    try {
      await fetch('/api/vocab/carte', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: carte.id }),
      })
      onChange()
    } finally {
      setOccupe(false)
    }
  }

  const incomplete = !carte.traductionFr && !carte.definitionEn

  return (
    <li className="rounded-xl border border-bord bg-carte px-4 py-3 text-sm">
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <span className="font-medium">{carte.terme}</span>
        {carte.traductionFr && <span className="text-doux">{carte.traductionFr}</span>}
        {incomplete && <span className="text-xs text-blanc">à compléter</span>}
        <span className="flex-1" />
        <span className="chiffres text-xs text-doux">
          {carte.nRevisions} révision{carte.nRevisions > 1 ? 's' : ''}
          {carte.prochaineRevision && ` · ${carte.prochaineRevision.slice(5)}`}
        </span>
        <button onClick={() => setEdite((v) => !v)} className="text-xs text-doux hover:text-texte">
          {edite ? 'Annuler' : 'Modifier'}
        </button>
      </div>

      {carte.exemple && !edite && (
        <p className="mt-1.5 text-xs italic text-doux">{carte.exemple}</p>
      )}

      {edite && (
        <div className="mt-3 space-y-2">
          <input
            value={traduction}
            onChange={(e) => setTraduction(e.target.value)}
            placeholder="Traduction française"
            className="w-full rounded-lg border border-bord bg-carte-clair px-3 py-2 text-sm"
          />
          <input
            value={definition}
            onChange={(e) => setDefinition(e.target.value)}
            placeholder="Définition en anglais"
            className="w-full rounded-lg border border-bord bg-carte-clair px-3 py-2 text-sm"
          />
          <div className="flex gap-3">
            <button
              onClick={() => void enregistrer()}
              disabled={occupe}
              className="rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-fond disabled:opacity-40"
            >
              Enregistrer
            </button>
            <button
              onClick={() => void supprimer()}
              disabled={occupe}
              className="text-xs text-faux hover:underline disabled:opacity-40"
            >
              Supprimer la carte
            </button>
          </div>
        </div>
      )}
    </li>
  )
}
