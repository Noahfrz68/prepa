import Link from 'next/link'
import { etatSectionsTageMage } from '@/core/db/queries'
import { historiqueEpreuves } from '@/core/db/epreuve'
import { SECONDES_PAR_QUESTION } from '@/exams/tagemage'
import {
  QUESTIONS_DIAGNOSTIC,
  QUESTIONS_DIAGNOSTIC_COMPREHENSION,
  composerEpreuve,
  dureeTotaleMinutes,
} from '@/exams/tagemage/epreuve'

export const dynamic = 'force-dynamic'

export default function HubTageMage() {
  const sections = etatSectionsTageMage()
  const total = sections.reduce((acc, s) => acc + s.nbItems, 0)
  const historique = historiqueEpreuves(5)
  const dureeBlanc = dureeTotaleMinutes(composerEpreuve('blanc'))
  const dureeDiagnostic = dureeTotaleMinutes(composerEpreuve('diagnostic'))

  return (
    <main className="mx-auto max-w-4xl px-6 py-14">
      <Link href="/" className="text-sm text-doux hover:text-texte">
        ← Accueil
      </Link>

      <header className="mt-6 mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">TAGE MAGE</h1>
          <p className="mt-1 text-sm text-doux">
            Barème +4 / 0 / 0 · {SECONDES_PAR_QUESTION} s par question · une erreur ne coûte
            rien, une case vide si.
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/plan"
            className="rounded-lg border border-bord px-4 py-2.5 text-sm text-doux transition hover:border-accent hover:text-texte"
          >
            Plan de la semaine →
          </Link>
          <Link
            href="/tagemage/strategie"
            className="rounded-lg border border-bord px-4 py-2.5 text-sm text-doux transition hover:border-accent hover:text-texte"
          >
            Stratégie de score →
          </Link>
          <Link
            href="/tagemage/cours"
            className="rounded-lg border border-bord px-4 py-2.5 text-sm text-doux transition hover:border-accent hover:text-texte"
          >
            Cours et astuces →
          </Link>
        </div>
      </header>

      {total === 0 && (
        <div className="mb-8 rounded-xl border border-bord bg-carte px-5 py-4 text-sm">
          <p className="font-medium">La banque est vide.</p>
          <p className="mt-1 text-doux">
            Colle un bloc de questions ou un CSV pour commencer.{' '}
            <Link href="/import" className="text-accent hover:underline">
              Ouvrir l’atelier d’import →
            </Link>
          </p>
        </div>
      )}

      {total > 0 && (
        <section className="mb-10">
          <h2 className="mb-3 text-sm uppercase tracking-widest text-doux">Épreuves</h2>

          <div className="grid gap-3 sm:grid-cols-2">
            <Epreuve
              href="/tagemage/epreuve?mode=diagnostic"
              titre="Diagnostic"
              detail={`6 sous-tests · ${QUESTIONS_DIAGNOSTIC} questions, ${QUESTIONS_DIAGNOSTIC_COMPREHENSION} en compréhension · ${dureeDiagnostic} min`}
              texte="Score estimé avec intervalle, cartographie des faiblesses et trois leviers. Même cadence que l’épreuve réelle."
            />
            <Epreuve
              href="/tagemage/epreuve?mode=blanc"
              titre="Blanc complet"
              detail={`90 questions · ${dureeBlanc} min, sans pause`}
              texte="Conditions réelles, enchaînées, sans retour arrière entre sous-tests. C’est le seul format qui mesure la fatigue."
            />
          </div>

          {historique.length > 0 && (
            <ul className="mt-4 space-y-1.5">
              {historique.map((h) => (
                <li key={h.sessionId}>
                  <Link
                    href={`/tagemage/epreuve/${h.sessionId}`}
                    className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg border border-bord bg-carte px-4 py-2.5 text-sm transition hover:border-accent"
                  >
                    <span className="flex-1">
                      {h.type === 'blanc' ? 'Blanc complet' : 'Diagnostic'}
                      {!h.conditionsReelles && (
                        <span className="ml-2 text-xs text-blanc">format réduit</span>
                      )}
                    </span>
                    <span className="chiffres text-doux">{h.n} questions</span>
                    <span className="chiffres text-doux">{h.debut.slice(0, 10)}</span>
                    <span className="chiffres w-20 text-right font-medium">
                      {h.scoreEchelle ?? '—'} / 600
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <h2 className="mb-3 text-sm uppercase tracking-widest text-doux">Entraînement ciblé</h2>
      <div className="space-y-3">
        {sections.map((s) => (
          <div
            key={s.id}
            className="flex flex-wrap items-center gap-4 rounded-xl border border-bord bg-carte px-5 py-4"
          >
            <span className="chiffres w-6 text-sm text-doux">{s.numero}</span>

            <div className="min-w-48 flex-1">
              <p className="font-medium">{s.libelle}</p>
              <p className="text-xs text-doux">{s.bloc}</p>
            </div>

            <div className="chiffres min-w-28 text-right text-sm text-doux">
              {s.nbItems} question{s.nbItems > 1 ? 's' : ''}
            </div>

            <div className="chiffres min-w-24 text-right text-sm">
              {s.tauxReussite !== null ? (
                <span className={s.tauxReussite >= 0.6 ? 'text-juste' : 'text-faux'}>
                  {Math.round(s.tauxReussite * 100)} %
                </span>
              ) : (
                <span className="text-doux">—</span>
              )}
            </div>

            {s.nbItems > 0 ? (
              <Link
                href={`/tagemage/drill?section=${s.id}`}
                className="rounded-lg bg-accent px-3.5 py-2 text-sm font-medium text-fond transition hover:opacity-90"
              >
                S’entraîner
              </Link>
            ) : (
              <Link
                href={`/import?section=${s.id}`}
                className="rounded-lg border border-bord px-3.5 py-2 text-sm text-doux transition hover:text-texte"
              >
                Importer
              </Link>
            )}
          </div>
        ))}
      </div>
    </main>
  )
}

function Epreuve({
  href,
  titre,
  detail,
  texte,
}: {
  href: string
  titre: string
  detail: string
  texte: string
}) {
  return (
    <Link
      href={href}
      className="flex flex-col rounded-xl border border-bord bg-carte p-5 transition hover:border-accent"
    >
      <span className="font-medium">{titre}</span>
      <span className="chiffres mt-0.5 text-xs text-doux">{detail}</span>
      <span className="mt-3 text-sm leading-relaxed text-doux">{texte}</span>
    </Link>
  )
}
