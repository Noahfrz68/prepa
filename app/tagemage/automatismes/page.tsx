import Link from 'next/link'
import { FORMATS, JEUX, type FormatPartie } from '@/core/automatismes'
import { statsAutomatismes } from '@/core/db/automatismes'
import { decimal } from '@/app/_composants/nombres'
import { jourLisible } from '@/app/_composants/dates'
import { chronoLisible, lienJeu, scoreLisible } from './format'

export const dynamic = 'force-dynamic'

/**
 * Les automatismes : ce qui doit sortir sans calcul le jour J.
 *
 * Des parties courtes, à faire en échauffement ou dans un temps mort. Elles
 * n'entrent ni dans le journal d'étude ni dans le plan de la semaine : c'est
 * un entraînement des réflexes, pas une séance.
 */
export default function PageAutomatismes() {
  const stats = statsAutomatismes(JEUX.map((j) => j.id))
  const formats = Object.keys(FORMATS) as FormatPartie[]

  return (
    <main className="mx-auto max-w-4xl px-6 py-14">
      <Link href="/tagemage" className="text-sm text-doux hover:text-texte">
        ← TAGE MAGE
      </Link>

      <header className="mt-6 mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Automatismes</h1>
        <p className="mt-1 text-sm leading-relaxed text-doux">
          Ce qui se sait par cœur ne coûte rien ; ce qui se recalcule coûte dix secondes. Des parties
          courtes, en échauffement ou dans un temps mort : {FORMATS.chrono.libelle} pour{' '}
          {FORMATS.chrono.but}, ou {FORMATS.serie.libelle} pour {FORMATS.serie.but}. Le chronomètre
          s’arrête pendant les corrections.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2">
        {JEUX.map((j) => {
          const s = stats.get(j.id)!
          return (
            <article key={j.id} className="flex flex-col rounded-xl border border-bord bg-carte px-5 py-4">
              <h2 className="font-medium">{j.nom}</h2>
              <p className="mt-1 text-sm text-doux">{j.description}</p>

              {s.parties > 0 ? (
                <dl className="mt-3 space-y-0.5 text-xs text-doux">
                  {formats.map(
                    (f) =>
                      s.records[f] && (
                        <div key={f} className="flex gap-2">
                          <dt>Record {FORMATS[f].libelle} :</dt>
                          <dd className="chiffres text-texte">{scoreLisible(f, s.records[f]!)}</dd>
                        </div>
                      ),
                  )}
                  {s.reussite !== null && s.tempsMoyenMs !== null && (
                    <div className="flex gap-2">
                      <dt>30 derniers jours :</dt>
                      <dd className="chiffres">
                        {decimal(s.reussite * 100, 0)} % de justes · {chronoLisible(s.tempsMoyenMs)} par question
                      </dd>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <dt>
                      {s.parties} partie{s.parties > 1 ? 's' : ''}, la dernière le {jourLisible(s.dernierePartie!)}
                      {s.aRevoir > 0 && (
                        <span className="text-blanc">
                          {' '}
                          · {s.aRevoir} fait{s.aRevoir > 1 ? 's' : ''} à revoir
                        </span>
                      )}
                    </dt>
                  </div>
                </dl>
              ) : (
                <p className="mt-3 text-xs text-doux">Pas encore joué.</p>
              )}

              <div className="mt-4 flex gap-2 pt-1 sm:mt-auto">
                {formats.map((f) => (
                  <Link
                    key={f}
                    href={lienJeu(j.id, f)}
                    className="rounded-lg border border-bord px-3 py-2 text-sm text-doux transition hover:border-accent hover:text-texte"
                  >
                    {FORMATS[f].libelle} →
                  </Link>
                ))}
              </div>
            </article>
          )
        })}
      </div>

      <p className="mt-6 text-xs text-doux">
        Le temps passé ici ne compte ni dans le journal d’étude ni dans le plan de la semaine.
      </p>
    </main>
  )
}
