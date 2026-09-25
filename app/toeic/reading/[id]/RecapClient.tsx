'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import type { RecapReading } from '@/core/db/toeic'
import DebriefIA from '@/app/_composants/DebriefIA'

const secondes = (ms: number) => `${Math.round(ms / 1000)} s`
const pourcent = (x: number) => `${Math.round(x * 100)} %`

export default function RecapClient({ recap }: { recap: RecapReading }) {
  const router = useRouter()
  const [ajoutes, setAjoutes] = useState<Record<number, boolean>>({})
  const [occupe, setOccupe] = useState<number | null>(null)

  async function ajouterAuVocabulaire(c: RecapReading['corrections'][number]) {
    if (!c.termeCandidat) return
    setOccupe(c.itemId)
    try {
      const r = await fetch('/api/vocab/carte', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          terme: c.termeCandidat,
          exemple: c.enonce,
          origineItemId: c.itemId,
        }),
      })
      if (r.ok) {
        setAjoutes((a) => ({ ...a, [c.itemId]: true }))
        router.refresh()
      }
    } finally {
      setOccupe(null)
    }
  }

  const { totaux, estimation } = recap
  const candidats = recap.corrections.filter((c) => c.termeCandidat && !c.dejaEnVocabulaire)

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <Link href="/toeic" className="text-sm text-doux hover:text-texte">
        ← TOEIC
      </Link>

      <header className="mt-6 mb-8">
        <p className="text-sm uppercase tracking-widest text-doux">
          Part {recap.numero} · {recap.libelle}
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          <span className="chiffres">{pourcent(recap.tauxReussite)}</span> de réussite
        </h1>
        {estimation.nItems > 0 && (
          <p className="mt-1 text-sm text-doux">
            Extrapolé à une section Reading complète :{' '}
            <span className="chiffres text-texte">{estimation.scoreSection}</span> / 495
            {' '}(intervalle {estimation.bas}–{estimation.haut}).
            {!estimation.fiable && ' Échantillon trop mince pour en tirer une décision.'}
          </p>
        )}
      </header>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Tuile v={totaux.justes} l="justes" ton="juste" />
        <Tuile v={totaux.fausses} l="fausses" ton="faux" />
        <Tuile v={totaux.nonTraitees} l="non traitées" ton="blanc" />
        <Tuile v={Math.round(recap.tempsTotalMs / 60000)} l="minutes" />
      </section>

      {/* Le budget temps est le levier n°1 du Reading. */}
      <section className="mt-6 rounded-xl border border-bord bg-carte px-5 py-4">
        <p className="text-sm">
          Budget de référence pour cette série :{' '}
          <span className="chiffres text-texte">{recap.budgetMinutes} min</span> · réalisé{' '}
          <span className={`chiffres ${recap.retardMinutes > 0 ? 'text-faux' : 'text-juste'}`}>
            {Math.round(recap.tempsTotalMs / 60000)} min
          </span>
        </p>
        <p className="mt-2 text-sm text-doux">
          {recap.retardMinutes > 0
            ? `Tu es à ${recap.retardMinutes} min au-dessus. En Reading le temps est commun aux trois parts : ce dépassement se retire de la Part 7, où les questions valent exactement autant.`
            : 'Rythme tenu. C’est ce qui permet de finir la Part 7, là où se perdent le plus de points.'}
        </p>
      </section>

      {totaux.nonTraitees > 0 && (
        <p className="mt-4 rounded-xl border border-bord bg-carte px-5 py-4 text-sm text-faux">
          {totaux.nonTraitees} case{totaux.nonTraitees > 1 ? 's' : ''} laissée
          {totaux.nonTraitees > 1 ? 's' : ''} vide{totaux.nonTraitees > 1 ? 's' : ''}. Cocher au
          hasard t’aurait rapporté environ{' '}
          <span className="chiffres">{recap.gainRemplissage.toFixed(1)}</span> bonne
          {recap.gainRemplissage >= 2 ? 's' : ''} réponse{recap.gainRemplissage >= 2 ? 's' : ''}{' '}
          sans aucun risque. C’est la seule erreur totalement gratuite du TOEIC.
        </p>
      )}

      {candidats.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-1 text-sm uppercase tracking-widest text-doux">Vocabulaire</h2>
          <p className="mb-4 text-sm text-doux">
            En Part 5 et 6, la bonne réponse <em>est</em> le mot cible. Ces termes t’ont fait
            rater une question : ils font des cartes utiles, contrairement à une liste générique.
          </p>
          <ul className="space-y-2">
            {candidats.map((c) => (
              <li
                key={c.itemId}
                className="flex flex-wrap items-center gap-3 rounded-lg border border-bord bg-carte px-4 py-3 text-sm"
              >
                <span className="font-medium">{c.termeCandidat}</span>
                <span className="flex-1 text-xs text-doux">{c.enonce}</span>
                {ajoutes[c.itemId] ? (
                  <span className="text-xs text-juste">ajouté</span>
                ) : (
                  <button
                    onClick={() => void ajouterAuVocabulaire(c)}
                    disabled={occupe === c.itemId}
                    className="rounded-lg border border-bord px-3 py-1.5 text-xs text-doux transition hover:border-accent hover:text-texte disabled:opacity-40"
                  >
                    Ajouter au vocabulaire
                  </button>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <DebriefIA sessionId={recap.sessionId} />

      <section className="mt-10">
        <h2 className="mb-4 text-sm uppercase tracking-widest text-doux">Corrections</h2>
        <ol className="space-y-2">
          {recap.corrections.map((c, i) => {
            const etat = c.nonTraitee ? 'non traitée' : c.estCorrect ? 'juste' : 'fausse'
            const couleur = c.nonTraitee ? 'text-blanc' : c.estCorrect ? 'text-juste' : 'text-faux'
            const iBonne = ['A', 'B', 'C', 'D', 'E'].indexOf(c.bonneReponse)

            return (
              <li key={c.itemId} className="rounded-xl border border-bord bg-carte px-5 py-3">
                <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 text-xs text-doux">
                  <span className="chiffres">#{i + 1}</span>
                  <span className={couleur}>{etat}</span>
                  <span className="chiffres">{secondes(c.tempsMs)}</span>
                  {!c.nonTraitee && <span>confiance {c.confiance}/4</span>}
                </div>

                <p className="mt-2 text-sm leading-relaxed">{c.enonce}</p>

                <p className="mt-1.5 text-sm">
                  <span className="text-doux">Bonne réponse : </span>
                  <span className="text-juste">
                    {c.bonneReponse}
                    {c.options[iBonne] ? ` — ${c.options[iBonne]}` : ''}
                  </span>
                  {!c.estCorrect && !c.nonTraitee && c.reponseDonnee && (
                    <>
                      <span className="text-doux"> · ta réponse : </span>
                      <span className="text-faux">{c.reponseDonnee}</span>
                    </>
                  )}
                </p>

                {c.explication && (
                  <p className="mt-2 border-t border-bord pt-2 text-sm text-doux">{c.explication}</p>
                )}
              </li>
            )
          })}
        </ol>
      </section>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link
          href={`/toeic/reading?part=${recap.part}`}
          className="rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-fond hover:opacity-90"
        >
          Nouvelle série
        </Link>
        <Link
          href="/toeic/vocabulaire"
          className="rounded-lg border border-bord px-4 py-2.5 text-sm text-doux hover:text-texte"
        >
          Vocabulaire
        </Link>
        <Link
          href="/toeic"
          className="rounded-lg border border-bord px-4 py-2.5 text-sm text-doux hover:text-texte"
        >
          Retour
        </Link>
      </div>
    </main>
  )
}

function Tuile({ v, l, ton }: { v: number; l: string; ton?: string }) {
  const c =
    ton === 'juste' ? 'text-juste' : ton === 'faux' ? 'text-faux' : ton === 'blanc' ? 'text-blanc' : ''
  return (
    <div className="rounded-xl border border-bord bg-carte px-4 py-3">
      <p className={`chiffres text-2xl font-semibold ${c}`}>{v}</p>
      <p className="text-xs text-doux">{l}</p>
    </div>
  )
}
