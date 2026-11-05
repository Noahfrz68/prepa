'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { EnonceQuestion, Proposition } from '@/app/_composants/Enonce'
import Difficulte from '@/app/_composants/Difficulte'
import ChoixCause from '@/app/_composants/CauseErreur'
import { OPTIONS_CONDITIONS_MINIMALES } from '@/exams/tagemage'
import type { Case, Figure } from '@/core/figures/types'
import type { DifficulteObservee } from '@/core/stats/difficulte'
import type { CauseErreur } from '@/core/stats/causes'

/**
 * La correction d'une série ou d'une épreuve, une question à la fois.
 *
 * Demandé le 2026-11-05 : la liste empilée montrait chaque question en petit,
 * avec la seule bonne lettre. Ici la question revient telle qu'on l'a vue —
 * énoncé en grand, cinq propositions — avec la bonne en vert, la sienne en
 * rouge, et sous chaque proposition fausse l'erreur qui y mène. Puis, juste ou
 * faux, la démarche, le piège, l'astuce pour aller vite et ce qu'il faut
 * retenir : une bonne réponse trouvée en deux minutes est encore à améliorer.
 */

export interface FicheCorrection {
  itemId: number
  /** Le sous-test, pour les liens (leçon, revanche). */
  section: string
  /** Libellé du sous-test, affiché quand la correction en mêle plusieurs (épreuve). */
  libelleSection?: string
  enonce: string
  typeItem: 'qcm' | 'conditions_minimales'
  options: string[]
  info1?: string | null
  info2?: string | null
  figure: Figure | null
  optionsFigure: Case[] | null
  bonneReponse: string
  reponseDonnee: string | null
  aSaute: boolean
  /** Laissée vide faute de temps (épreuve), distincte d'un saut volontaire. */
  nonTraitee?: boolean
  estCorrect: boolean
  tempsMs: number
  confiance: number
  points: number
  explication: string | null
  rappel: string | null
  astuce?: string | null
  /** Ce que vaut chaque proposition fausse, par lettre. */
  diagnostics?: Record<string, string>
  /** Ce que vaut la proposition cochée (ancien champ, repli). */
  diagnostic?: string | null
  skillId: string | null
  difficulte?: DifficulteObservee | null
  cause?: CauseErreur | null
}

const LETTRES = ['A', 'B', 'C', 'D', 'E'] as const

type Etat = 'juste' | 'fausse' | 'sautée' | 'non traitée'

function etatDe(f: FicheCorrection): Etat {
  if (f.nonTraitee) return 'non traitée'
  if (f.aSaute || f.reponseDonnee === null) return 'sautée'
  return f.estCorrect ? 'juste' : 'fausse'
}

const TEINTE: Record<Etat, string> = {
  juste: 'border-juste/40 bg-juste/15 text-juste',
  fausse: 'border-faux/40 bg-faux/15 text-faux',
  'sautée': 'border-blanc/40 bg-blanc/15 text-blanc',
  'non traitée': 'border-blanc/40 bg-blanc/15 text-blanc',
}

/**
 * Sépare l'explication en démarche, piège et leçon.
 *
 * Les générateurs terminent la démarche par « Le piège : … » et, en conditions
 * minimales, par « À retenir : … ». Ces lignes deviennent leurs propres blocs ;
 * une explication qui n'en a pas (annale) reste entière dans la démarche.
 */
export function decouperExplication(texte: string | null): { demarche: string; piege: string | null; retenir: string | null } {
  if (!texte) return { demarche: '', piege: null, retenir: null }
  let piege: string | null = null
  let retenir: string | null = null
  const reste: string[] = []
  for (const ligne of texte.split('\n')) {
    const p = /^Le piège\s*:\s*(.+)$/i.exec(ligne.trim())
    const r = /^À retenir\s*:\s*(.+)$/i.exec(ligne.trim())
    if (p && !piege) piege = p[1].charAt(0).toUpperCase() + p[1].slice(1)
    else if (r && !retenir) retenir = r[1].charAt(0).toUpperCase() + r[1].slice(1)
    else reste.push(ligne)
  }
  return { demarche: reste.join('\n').trim(), piege, retenir }
}

/** La première question ratée : c'est là que la correction a le plus à dire. */
function premiereErreur(fiches: FicheCorrection[]): number {
  const i = fiches.findIndex((f) => etatDe(f) !== 'juste')
  return i < 0 ? 0 : i
}

export default function CorrectionPasAPas({ fiches }: { fiches: FicheCorrection[] }) {
  const [i, setI] = useState(() => premiereErreur(fiches))
  const n = fiches.length

  useEffect(() => {
    const touche = (e: KeyboardEvent) => {
      const cible = e.target as HTMLElement | null
      if (cible && /^(INPUT|TEXTAREA|SELECT)$/.test(cible.tagName)) return
      if (e.key === 'ArrowRight') setI((x) => Math.min(n - 1, x + 1))
      if (e.key === 'ArrowLeft') setI((x) => Math.max(0, x - 1))
    }
    window.addEventListener('keydown', touche)
    return () => window.removeEventListener('keydown', touche)
  }, [n])

  if (n === 0) return null
  const f = fiches[i]

  return (
    <section className="mt-10">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-sm uppercase tracking-widest text-doux">Corrections</h2>
        <span className="hidden text-xs text-doux sm:inline">
          <span className="kbd">←</span> <span className="kbd">→</span> pour naviguer
        </span>
      </div>

      <nav className="flex flex-wrap gap-1.5" aria-label="Questions">
        {fiches.map((x, k) => (
          <button
            key={x.itemId}
            onClick={() => setI(k)}
            aria-current={k === i ? 'true' : undefined}
            aria-label={`Question ${k + 1}, ${etatDe(x)}`}
            className={`chiffres h-8 w-8 rounded-full border text-xs ${TEINTE[etatDe(x)]} ${
              k === i ? 'ring-2 ring-texte ring-offset-2 ring-offset-fond' : ''
            }`}
          >
            {k + 1}
          </button>
        ))}
      </nav>

      <Fiche key={f.itemId} f={f} numero={i + 1} total={n} />

      <div className="mt-6 flex justify-between">
        <button
          onClick={() => setI((x) => Math.max(0, x - 1))}
          disabled={i === 0}
          className="rounded-lg border border-bord px-4 py-2.5 text-sm text-doux hover:text-texte disabled:opacity-40"
        >
          ← Précédente
        </button>
        <button
          onClick={() => setI((x) => Math.min(n - 1, x + 1))}
          disabled={i === n - 1}
          className="rounded-lg border border-bord px-4 py-2.5 text-sm text-doux hover:text-texte disabled:opacity-40"
        >
          Suivante →
        </button>
      </div>
    </section>
  )
}

function Fiche({ f, numero, total }: { f: FicheCorrection; numero: number; total: number }) {
  const etat = etatDe(f)
  const options = f.typeItem === 'conditions_minimales' ? OPTIONS_CONDITIONS_MINIMALES : f.options
  const iBonne = LETTRES.indexOf(f.bonneReponse as (typeof LETTRES)[number])
  const iDonnee = f.reponseDonnee ? LETTRES.indexOf(f.reponseDonnee as (typeof LETTRES)[number]) : -1
  const { demarche, piege, retenir } = decouperExplication(f.explication)
  const aRetenir = retenir ?? f.rappel
  const pourquoi = (k: number): string | null => {
    const l = LETTRES[k]
    return f.diagnostics?.[l] ?? (k === iDonnee ? (f.diagnostic ?? null) : null)
  }

  return (
    <article className="mt-5 rounded-xl border border-bord bg-carte px-5 py-6 sm:px-8">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-doux">
        <span className="chiffres">
          Question {numero} / {total}
        </span>
        {f.libelleSection && <span>{f.libelleSection}</span>}
        <span className={`rounded-md border px-2 py-0.5 ${TEINTE[etat]}`}>{etat}</span>
        <span className="chiffres">
          {f.points > 0 ? '+' : ''}
          {f.points} pt
        </span>
        <span className="chiffres">{Math.round(f.tempsMs / 1000)} s</span>
        {!f.aSaute && !f.nonTraitee && <span>confiance {f.confiance}/4</span>}
        <Difficulte d={f.difficulte} />
      </div>

      <EnonceQuestion enonce={f.enonce} figure={f.figure} className="mt-5" />

      {f.typeItem === 'conditions_minimales' && (
        <div className="mt-5 space-y-2 rounded-lg border border-bord bg-fond p-5 text-sm">
          <p>
            <span className="mr-2 text-doux">(1)</span>
            {f.info1}
          </p>
          <p>
            <span className="mr-2 text-doux">(2)</span>
            {f.info2}
          </p>
        </div>
      )}

      <ul className="mt-6 space-y-2">
        {options.map((texte, k) => {
          const bonne = k === iBonne
          const sienne = k === iDonnee
          const ton = bonne ? TEINTE.juste : sienne ? TEINTE.fausse : 'border-bord bg-fond'
          const motif = !bonne ? pourquoi(k) : null
          return (
            <li key={k} className={`flex items-start gap-3 rounded-lg border px-4 py-3 text-sm ${ton}`}>
              <span className="mt-0.5 w-5 font-medium">{LETTRES[k]}.</span>
              <span className="flex-1">
                <span className={bonne || sienne ? '' : 'text-texte'}>
                  <Proposition texte={texte} c={f.optionsFigure?.[k]} />
                </span>
                {motif && <span className="mt-1 block text-xs text-doux">{motif}</span>}
              </span>
              {(bonne || sienne) && (
                <span className="shrink-0 text-xs">
                  {bonne && sienne ? 'ta réponse · juste' : bonne ? 'bonne réponse' : 'ta réponse'}
                </span>
              )}
            </li>
          )
        })}
      </ul>

      <div className="mt-6 space-y-3">
        {demarche && <Bloc titre="La démarche" texte={demarche} ton="border-bord bg-fond text-texte" />}
        {piege && <Bloc titre="Le piège" texte={piege} ton={TEINTE.fausse} />}
        {f.astuce && <Bloc titre="L’astuce pour aller vite" texte={f.astuce} ton="border-accent/40 bg-accent/10 text-accent" />}
        {aRetenir && <Bloc titre="À retenir" texte={aRetenir} ton={TEINTE.juste} />}
      </div>

      {etat !== 'juste' && f.skillId && (
        <p className="mt-5 flex flex-wrap gap-x-4 gap-y-1 text-xs">
          <Link href={`/tagemage/cours#${f.skillId}`} className="text-accent hover:underline">
            Revoir la leçon →
          </Link>
          <Link
            href={`/tagemage/drill?section=${f.section}&revanche=${f.itemId}&taille=3`}
            className="text-accent hover:underline"
            title="Trois questions du même type, du même modèle d’énoncé d’abord"
          >
            Revanche : même modèle →
          </Link>
          <Link href={`/tagemage/drill?section=${f.section}&skills=${f.skillId}`} className="text-doux hover:text-texte">
            Refaire une série de ce type
          </Link>
        </p>
      )}
      {etat !== 'juste' && <ChoixCause itemId={f.itemId} section={f.section} initiale={f.cause ?? null} />}
    </article>
  )
}

function Bloc({ titre, texte, ton }: { titre: string; texte: string; ton: string }) {
  return (
    <div className={`rounded-lg border px-4 py-3 ${ton}`}>
      <p className="mb-1 text-xs font-medium uppercase tracking-widest">{titre}</p>
      <p className="whitespace-pre-line text-sm leading-relaxed text-texte">{texte}</p>
    </div>
  )
}
