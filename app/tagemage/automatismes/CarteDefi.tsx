import Link from 'next/link'
import { QUESTIONS_DEFI } from '@/core/automatismes/defi'
import type { EtatDefi } from '@/core/db/automatismes'
import { LIEN_DEFI, scoreLisible } from './format'

const jours = (n: number) => `${n} jour${n > 1 ? 's' : ''}`

/**
 * Le défi du jour : fait ou pas, la série de jours, le meilleur score.
 * `compacte` : une ligne, pour l'accueil TAGE MAGE.
 */
export default function CarteDefi({ etat, compacte = false }: { etat: EtatDefi; compacte?: boolean }) {
  const fait = etat.aujourdhui
  const serie =
    etat.serie > 0
      ? fait
        ? `${jours(etat.serie)} d’affilée`
        : `${jours(etat.serie)} d’affilée, à prolonger aujourd’hui`
      : null

  if (compacte) {
    return (
      <Link
        href={LIEN_DEFI}
        className={`flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 rounded-xl border bg-carte px-5 py-3 text-sm transition hover:border-accent ${
          fait ? 'border-bord' : 'border-accent'
        }`}
      >
        <span>
          <span className="font-medium">Défi du jour</span>
          <span className="text-doux">
            {' '}
            · {fait ? `fait : ${scoreLisible('defi', fait)}` : `${QUESTIONS_DEFI} questions d’automatismes`}
            {serie && ` · série : ${serie}`}
          </span>
        </span>
        <span className={fait ? 'text-doux' : 'text-accent'}>{fait ? 'Rejouer →' : 'Jouer →'}</span>
      </Link>
    )
  }

  return (
    <article className={`rounded-xl border bg-carte px-5 py-4 ${fait ? 'border-bord' : 'border-accent'}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-medium">Défi du jour</h2>
        <span className="text-xs text-doux">{QUESTIONS_DEFI} questions, les mêmes pour tous aujourd’hui</span>
      </div>
      <p className="mt-1 text-sm text-doux">
        Tiré dans tous les jeux. Seule la première partie du jour compte, pour le score comme pour la série.
      </p>
      <dl className="mt-3 space-y-0.5 text-xs text-doux">
        <div className="flex gap-2">
          <dt>Aujourd’hui :</dt>
          <dd className={fait ? 'chiffres text-texte' : ''}>{fait ? scoreLisible('defi', fait) : 'pas encore fait'}</dd>
        </div>
        {serie && (
          <div className="flex gap-2">
            <dt>Série :</dt>
            <dd className="chiffres text-texte">{serie}</dd>
          </div>
        )}
        {etat.meilleur && (
          <div className="flex gap-2">
            <dt>Meilleur défi :</dt>
            <dd className="chiffres">
              {scoreLisible('defi', etat.meilleur)} · {jours(etat.jours)} de défi au total
            </dd>
          </div>
        )}
      </dl>
      <Link
        href={LIEN_DEFI}
        className={`mt-4 inline-block rounded-lg px-4 py-2 text-sm transition ${
          fait
            ? 'border border-bord text-doux hover:border-accent hover:text-texte'
            : 'bg-accent font-medium text-fond hover:opacity-90'
        }`}
      >
        {fait ? 'Rejouer pour s’entraîner →' : 'Jouer le défi →'}
      </Link>
    </article>
  )
}
