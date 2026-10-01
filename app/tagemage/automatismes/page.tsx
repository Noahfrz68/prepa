import Link from 'next/link'
import { FORMATS, JEUX, MELANGE, type FormatPartie, type PartieJeuId } from '@/core/automatismes'
import { etatDefi, statsAutomatismes, type StatsJeu } from '@/core/db/automatismes'
import { decimal } from '@/app/_composants/nombres'
import { jourLisible } from '@/app/_composants/dates'
import { chronoLisible, lienJeu, scoreLisible } from './format'
import CarteDefi from './CarteDefi'

export const dynamic = 'force-dynamic'

const FORMATS_PARTIE = Object.keys(FORMATS) as FormatPartie[]

/**
 * Les automatismes : ce qui doit sortir sans calcul le jour J.
 *
 * Des parties courtes, à faire en échauffement ou dans un temps mort. Elles
 * n'entrent ni dans le journal d'étude ni dans le plan de la semaine : c'est
 * un entraînement des réflexes, pas une séance.
 */
export default function PageAutomatismes() {
  const stats = statsAutomatismes([MELANGE.id, ...JEUX.map((j) => j.id)])
  const defi = etatDefi()

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
          s’arrête pendant les corrections. Ce qui a été raté ou trop lent revient plus souvent, dans
          la partie même ; ce qui est su revient de plus en plus rarement.
        </p>
      </header>

      <div className="mb-3">
        <CarteDefi etat={defi} />
      </div>

      <div className="mb-3">
        <Carte id={MELANGE.id} nom={MELANGE.nom} description={MELANGE.description} s={stats.get(MELANGE.id)!} misEnAvant />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {JEUX.map((j) => (
          <Carte key={j.id} id={j.id} nom={j.nom} description={j.description} s={stats.get(j.id)!} />
        ))}
      </div>

      <p className="mt-6 text-xs text-doux">
        Le temps passé ici ne compte ni dans le journal d’étude ni dans le plan de la semaine.
      </p>
    </main>
  )
}

function Carte({
  id,
  nom,
  description,
  s,
  misEnAvant = false,
}: {
  id: PartieJeuId
  nom: string
  description: string
  s: StatsJeu
  misEnAvant?: boolean
}) {
  return (
    <article
      className={`flex h-full flex-col rounded-xl border bg-carte px-5 py-4 ${misEnAvant ? 'border-accent' : 'border-bord'}`}
    >
      <h2 className="font-medium">{nom}</h2>
      <p className="mt-1 text-sm text-doux">{description}</p>

      {s.parties > 0 || s.aRevoir > 0 ? (
        <dl className="mt-3 space-y-0.5 text-xs text-doux">
          {FORMATS_PARTIE.map(
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
          <p>
            {s.parties > 0
              ? `${s.parties} partie${s.parties > 1 ? 's' : ''}, la dernière le ${jourLisible(s.dernierePartie!)}`
              : 'Pas encore de partie'}
            {s.aRevoir > 0 && (
              <span className="text-blanc">
                {' '}
                · {s.aRevoir} fait{s.aRevoir > 1 ? 's' : ''} à revoir
              </span>
            )}
          </p>
        </dl>
      ) : (
        <p className="mt-3 text-xs text-doux">Pas encore joué.</p>
      )}

      <div className="mt-4 flex gap-2 pt-1 sm:mt-auto">
        {FORMATS_PARTIE.map((f) => (
          <Link
            key={f}
            href={lienJeu(id, f)}
            className={`rounded-lg border px-3 py-2 text-sm transition hover:border-accent hover:text-texte ${
              misEnAvant && f === 'chrono' ? 'border-accent text-texte' : 'border-bord text-doux'
            }`}
          >
            {FORMATS[f].libelle} →
          </Link>
        ))}
      </div>
    </article>
  )
}
