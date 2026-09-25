'use client'

import Link from 'next/link'
import { useState } from 'react'
import { poster } from '@/app/_composants/reseau'
import type { PlanHebdomadaire, TacheEnregistree } from '@/core/db/semaine'
import { lienTache } from './liens'

const heures = (min: number) => {
  const h = Math.floor(min / 60)
  const m = Math.round(min % 60)
  if (h === 0) return `${m} min`
  return m === 0 ? `${h} h` : `${h} h${String(m).padStart(2, '0')}`
}

const LIBELLE_TYPE: Record<TacheEnregistree['type'], string> = {
  cours: 'Cours',
  entrainement: 'Entraînement',
  diagnostic: 'Épreuve',
  blanc: 'Épreuve',
}

/**
 * Le plan de la semaine, figé au lundi.
 *
 * Trois blocs, dans l'ordre où l'on s'en sert : ce qui reste à faire, ce qui
 * est fait, et pourquoi le plan dit ce qu'il dit. Le total d'heures par
 * sous-test est donné en tête — c'est le chiffre qu'on vient chercher, il ne
 * doit pas se reconstituer en additionnant des lignes.
 */
export default function PlanClient({ initial }: { initial: PlanHebdomadaire }) {
  const [plan, setPlan] = useState(initial)
  const [occupe, setOccupe] = useState(false)
  const [echec, setEchec] = useState<string | null>(null)

  const appeler = async (corps: Record<string, unknown>) => {
    setOccupe(true)
    setEchec(null)
    try {
      const data = await poster<{ plan: PlanHebdomadaire }>('/api/plan', corps)
      if (data.plan) setPlan(data.plan)
    } catch (e) {
      setEchec((e as Error).message)
    } finally {
      setOccupe(false)
    }
  }

  const restantes = plan.taches.filter((t) => !t.fait)
  const faites = plan.taches.filter((t) => t.fait)
  const avancement =
    plan.minutesPlanifiees === 0 ? 0 : plan.minutesFaites / plan.minutesPlanifiees

  // Le total par sous-test, toutes natures confondues : c'est la réponse à
  // « combien d'heures sur quoi ».
  const parSection = new Map<string, { libelle: string; cours: number; series: number }>()
  for (const t of plan.taches) {
    if (!t.section) continue
    const nom = t.libelle.replace(/^Cours — /, '').replace(/^\d+ séries? — /, '')
    const e = parSection.get(t.section) ?? { libelle: nom, cours: 0, series: 0 }
    if (t.type === 'cours') e.cours += t.minutes
    else e.series += t.minutes
    parSection.set(t.section, e)
  }

  const epreuves = plan.taches.filter((t) => t.type === 'blanc' || t.type === 'diagnostic')

  return (
    <div>
      {echec && (
        <p className="mb-5 rounded-xl border border-faux bg-carte px-5 py-3 text-sm text-faux">
          {echec} Ton plan n’a pas changé — réessaie quand le serveur répond.
        </p>
      )}

      {/* ------------------------------------------------ en-tête -- */}
      <section className="mb-8 rounded-xl border border-bord bg-carte px-5 py-4">
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <p className="text-sm">
            <span className="chiffres text-2xl font-semibold">{heures(plan.minutesPlanifiees)}</span>{' '}
            <span className="text-doux">planifiées sur {heures(plan.budgetMinutes)} disponibles</span>
          </p>
          <p className="text-sm text-doux">
            <span className="chiffres text-texte">{heures(plan.minutesFaites)}</span> faites ·{' '}
            {faites.length} / {plan.taches.length} tâches
          </p>
        </div>
        <p className="mt-1 text-xs text-doux">
          Le « fait » se lit dans tes séances : séries closes, leçons marquées étudiées,
          épreuves terminées. Temps réellement passé cette semaine :{' '}
          <span className="chiffres text-texte">{heures(plan.minutesMesurees)}</span>.
        </p>

        <div className="mt-3 h-1.5 w-full overflow-hidden rounded bg-carte-clair">
          <div
            className="h-full bg-accent transition-all"
            style={{ width: `${Math.min(100, avancement * 100)}%` }}
          />
        </div>

        {plan.budgetMinutes === 0 && (
          <p className="mt-3 text-sm text-faux">
            Aucune heure déclarée :{' '}
            <Link href="/reglages" className="underline">
              renseigne ton temps disponible
            </Link>{' '}
            pour que le plan ait quelque chose à répartir.
          </p>
        )}
      </section>

      {/* ------------------------------ la réponse chiffrée, en tête -- */}
      {parSection.size > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-sm uppercase tracking-widest text-doux">
            Combien d’heures, sur quoi
          </h2>
          <div className="overflow-x-auto rounded-xl border border-bord bg-carte">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-bord text-left text-xs uppercase tracking-wider text-doux">
                  <th className="px-4 py-3 font-normal">Sous-test</th>
                  <th className="px-4 py-3 text-right font-normal">Cours</th>
                  <th className="px-4 py-3 text-right font-normal">Séries</th>
                  <th className="px-4 py-3 text-right font-normal">Total</th>
                </tr>
              </thead>
              <tbody>
                {[...parSection.entries()].map(([section, e]) => (
                  <tr key={section} className="border-b border-bord last:border-0">
                    <td className="px-4 py-3">{e.libelle}</td>
                    <td className="chiffres px-4 py-3 text-right text-doux">
                      {e.cours ? heures(e.cours) : '—'}
                    </td>
                    <td className="chiffres px-4 py-3 text-right text-doux">
                      {e.series ? heures(e.series) : '—'}
                    </td>
                    <td className="chiffres px-4 py-3 text-right">{heures(e.cours + e.series)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="mt-3 text-sm text-doux">
            {epreuves.length === 0
              ? 'Aucune épreuve complète cette semaine — la raison est plus bas.'
              : `${epreuves.length} épreuve${epreuves.length > 1 ? 's' : ''} : ${epreuves.map((e) => e.libelle.toLowerCase()).join(', ')}.`}
          </p>
        </section>
      )}

      {/* ------------------------------------------------- à faire -- */}
      {restantes.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-sm uppercase tracking-widest text-doux">À faire</h2>
          <ol className="space-y-2">
            {restantes.map((t) => (
              <Ligne key={t.id} t={t} occupe={occupe} onCocher={appeler} />
            ))}
          </ol>
        </section>
      )}

      {faites.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-sm uppercase tracking-widest text-doux">Fait</h2>
          <ol className="space-y-2">
            {faites.map((t) => (
              <Ligne key={t.id} t={t} occupe={occupe} onCocher={appeler} />
            ))}
          </ol>
        </section>
      )}

      {plan.notes.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-sm uppercase tracking-widest text-doux">
            Pourquoi ce plan dit ça
          </h2>
          <div className="space-y-2">
            {plan.notes.map((n, i) => (
              <p
                key={i}
                className="rounded-xl border border-bord bg-carte px-5 py-3 text-sm leading-relaxed text-doux"
              >
                {n}
              </p>
            ))}
          </div>
        </section>
      )}

      <div className="flex flex-wrap items-center gap-4 border-t border-bord pt-5">
        <button
          onClick={() => appeler({ action: 'refaire' })}
          disabled={occupe}
          className="rounded-lg border border-bord px-4 py-2.5 text-sm text-doux transition hover:text-texte disabled:opacity-50"
        >
          Refaire le plan de la semaine
        </button>
        <span className="text-xs leading-relaxed text-blanc">
          Le plan est composé le lundi et ne bouge plus. Le refaire efface ce que tu as coché — à
          n’utiliser que si ta semaine a changé d’allure.
        </span>
      </div>
    </div>
  )
}

function Ligne({
  t,
  occupe,
  onCocher,
}: {
  t: TacheEnregistree
  occupe: boolean
  onCocher: (corps: Record<string, unknown>) => void
}) {
  const lien = lienTache(t)
  const unite =
    t.type === 'cours' ? 'leçon' : t.type === 'entrainement' ? 'série' : 'épreuve'
  const mesureFaite = t.mesure.faits >= t.mesure.sur
  // Ce que la base montre, en une ligne. Une tâche faite ne répète plus la
  // raison écrite lundi (« 10 leçons jamais étudiées » sous une tâche finie).
  const participe = t.type === 'cours' ? 'étudiée' : 'terminée'
  const pluriel = (n: number) => (n > 1 ? 's' : '')
  const avancement = mesureFaite
    ? // Au-delà du prévu, on dit ce qui a été fait plutôt qu'un « 9 / 1 ».
      `${t.mesure.faits} ${unite}${pluriel(t.mesure.faits)} ${participe}${pluriel(t.mesure.faits)} cette semaine, pour ${t.mesure.sur} prévue${pluriel(t.mesure.sur)}`
    : `${t.mesure.faits} / ${t.mesure.sur} ${unite}${pluriel(t.mesure.sur)} ${participe}${pluriel(t.mesure.sur)} cette semaine`

  return (
    <li
      className={`rounded-xl border bg-carte px-5 py-4 transition ${
        t.fait ? 'border-bord opacity-60' : 'border-bord'
      }`}
    >
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 text-xs text-doux">
        <span className="uppercase tracking-widest">{LIBELLE_TYPE[t.type]}</span>
        <span className="chiffres">{heures(t.minutes)}</span>
        <span className="chiffres">
          ×{t.quantite}
          {t.type === 'cours'
            ? ` leçon${t.quantite > 1 ? 's' : ''}`
            : t.type === 'entrainement'
              ? ` série${t.quantite > 1 ? 's' : ''}`
              : ''}
        </span>
      </div>

      <p className="mt-1.5 text-sm font-medium">{t.libelle}</p>
      {!t.fait && <p className="mt-1 text-sm leading-relaxed text-doux">{t.raison}</p>}
      <p className={`mt-1 text-xs ${mesureFaite ? 'text-juste' : 'text-doux'}`}>
        {avancement}
        {t.faitLe && !mesureFaite && ' · cochée à la main'}
      </p>
      {t.type === 'entrainement' && t.tauxActuel !== null && (
        <p
          className="mt-1 text-xs text-doux"
          title="Bonnes réponses sur questions servies, sauts compris"
        >
          Réussite aujourd’hui :{' '}
          <span className="chiffres text-texte">{Math.round(t.tauxActuel * 100)} %</span>
        </p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-4">
        {/* La case ne sert que pour ce que la mesure ne voit pas : une tâche
            mesurée comme faite n'a rien à décocher. */}
        {!mesureFaite && (
          <button
            onClick={() => onCocher({ action: 'cocher', id: t.id, fait: !t.faitLe })}
            disabled={occupe}
            title={t.faitLe ? undefined : 'Pour ce qui ne laisse pas de trace ici, comme un cours lu sur papier.'}
            className={`rounded-lg border px-3 py-2 text-sm transition disabled:opacity-50 ${
              t.faitLe
                ? 'border-bord text-doux hover:text-texte'
                : 'border-bord text-doux hover:border-juste hover:text-juste'
            }`}
          >
            {t.faitLe ? 'Pas fait, finalement' : 'Fait hors de l’app'}
          </button>
        )}

        {!t.fait && (
          <Link href={lien} className="text-sm text-accent hover:underline">
            {t.type === 'cours' ? 'Ouvrir le cours' : t.type === 'entrainement' ? 'Lancer' : 'Commencer'} →
          </Link>
        )}
      </div>
    </li>
  )
}
