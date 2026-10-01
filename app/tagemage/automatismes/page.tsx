import Link from 'next/link'
import { FORMATS, JEUX, MELANGE, type FormatPartie, type PartieJeuId } from '@/core/automatismes'
import { etatDefi, jeuxConseilles, statsAutomatismes, type Conseil, type StatsJeu } from '@/core/db/automatismes'
import { decimal } from '@/app/_composants/nombres'
import { jourLisible } from '@/app/_composants/dates'
import { chronoLisible, lienJeu, motifConseil, scoreLisible } from './format'
import CarteDefi from './CarteDefi'

export const dynamic = 'force-dynamic'

const FORMATS_PARTIE = Object.keys(FORMATS) as FormatPartie[]

const nomJeu = (id: PartieJeuId) => JEUX.find((j) => j.id === id)?.nom ?? id

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
  const conseils = jeuxConseilles()
  const conseilDe = new Map(conseils.map((c) => [c.jeu as PartieJeuId, c]))
  // Les jeux conseillés d'abord, dans l'ordre de leur poids ; les autres ensuite.
  const jeux = [...JEUX].sort(
    (x, y) => (conseilDe.has(y.id) ? 1 : 0) - (conseilDe.has(x.id) ? 1 : 0) || (conseilDe.get(y.id)?.poids ?? 0) - (conseilDe.get(x.id)?.poids ?? 0),
  )

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
        <Carte
          id={MELANGE.id}
          nom={MELANGE.nom}
          description={MELANGE.description}
          s={stats.get(MELANGE.id)!}
          misEnAvant
          note={
            conseils.length > 0
              ? `D’après tes erreurs récentes, il penche vers : ${conseils.map((c) => nomJeu(c.jeu)).join(', ')}.`
              : undefined
          }
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {jeux.map((j) => (
          <Carte
            key={j.id}
            id={j.id}
            nom={j.nom}
            description={j.description}
            s={stats.get(j.id)!}
            conseil={conseilDe.get(j.id)}
          />
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
  conseil,
  note,
}: {
  id: PartieJeuId
  nom: string
  description: string
  s: StatsJeu
  misEnAvant?: boolean
  /** Ce jeu est désigné par les erreurs réelles. */
  conseil?: Conseil
  note?: string
}) {
  return (
    <article
      className={`flex h-full flex-col rounded-xl border bg-carte px-5 py-4 ${misEnAvant || conseil ? 'border-accent' : 'border-bord'}`}
    >
      <h2 className="font-medium">{nom}</h2>
      <p className="mt-1 text-sm text-doux">{description}</p>
      {conseil && <p className="mt-2 text-sm text-accent">Conseillé : {motifConseil(conseil)}.</p>}
      {note && <p className="mt-2 text-sm text-accent">{note}</p>}

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
