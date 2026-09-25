import Link from 'next/link'
import { notFound } from 'next/navigation'
import { SECTIONS_PAR_ID, type SectionTageMage } from '@/exams/tagemage'
import { FICHES } from '@/exams/tagemage/cours'
import { LECONS } from '@/exams/tagemage/lecons'
import BoutonImprimer from '@/app/_composants/BoutonImprimer'

export const dynamic = 'force-dynamic'

/**
 * La fiche récapitulative d'un sous-test, à imprimer.
 *
 * Ce qu'on relit la veille, sur une ou deux pages : la conduite du sous-test
 * (fiche), puis pour chaque type de question sa règle, son piège et ce qui se
 * sait par cœur. Les exemples déroulés et les exercices restent en ligne — ils
 * se travaillent, ils ne se relisent pas.
 */
export default async function FicheImprimable({
  params,
}: {
  params: Promise<{ section: string }>
}) {
  const { section } = await params
  const spec = SECTIONS_PAR_ID.get(section as SectionTageMage)
  if (!spec) notFound()

  const fiche = FICHES.find((f) => f.section === section)
  const lecons = LECONS.filter((l) => l.section === section)

  return (
    <main className="mx-auto max-w-3xl px-6 py-10 print:max-w-none print:px-0 print:py-0">
      <div className="sans-impression mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link href="/tagemage/cours" className="text-sm text-doux hover:text-texte">
          ← Cours et astuces
        </Link>
        <BoutonImprimer libelle="Imprimer la fiche" />
      </div>

      <header className="mb-6 border-b border-bord pb-4">
        <p className="text-xs uppercase tracking-widest text-doux">
          TAGE MAGE · sous-test {spec.numero} · fiche récapitulative
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">{spec.libelle}</h1>
        {fiche && <p className="mt-2 text-sm leading-relaxed">{fiche.enjeu}</p>}
      </header>

      {fiche && (
        <section className="sans-coupure mb-6">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-widest">La conduite</h2>
          <ol className="list-decimal space-y-1 pl-5 text-sm leading-relaxed">
            {fiche.methode.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ol>
          <p className="mt-2 text-sm leading-relaxed">
            <span className="font-semibold">Stratégie : </span>
            {fiche.strategie}
          </p>
          <ul className="mt-2 space-y-1 text-sm leading-relaxed">
            {fiche.pieges.map((p) => (
              <li key={p.titre}>
                <span className="font-semibold">Piège — {p.titre}. </span>
                {p.texte}
              </li>
            ))}
          </ul>
        </section>
      )}

      <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest">
        Par type de question ({lecons.length})
      </h2>
      <div className="space-y-4">
        {lecons.map((l) => (
          <section key={l.skillId} className="sans-coupure rounded-lg border border-bord px-4 py-3">
            <h3 className="font-semibold">{l.titre}</h3>
            <p className="text-xs text-doux">{l.quoi}</p>
            <ul className="mt-2 space-y-1 text-sm leading-relaxed">
              {l.regles.map((r) => (
                <li key={r.titre}>
                  <span className="font-medium">{r.titre} : </span>
                  {r.texte}
                </li>
              ))}
            </ul>
            {l.parCoeur && l.parCoeur.length > 0 && (
              <p className="mt-2 text-sm">
                <span className="font-medium">Par cœur : </span>
                {l.parCoeur.join(' · ')}
              </p>
            )}
            <p className="mt-2 text-sm">
              <span className="font-medium">Piège : </span>
              {l.piege}
            </p>
          </section>
        ))}
      </div>
    </main>
  )
}
