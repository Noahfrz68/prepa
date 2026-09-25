import Link from 'next/link'
import FichesClient, { type FicheAffichable } from '@/app/cours/FichesClient'
import { FICHES_TOEIC, REGLES_GENERALES_TOEIC } from '@/exams/toeic/cours'
import { etatParts } from '@/core/db/toeic'

export const dynamic = 'force-dynamic'

const MINIMUM_POUR_CLASSER = 10

export default function CoursToeic() {
  const etats = new Map(etatParts().map((e) => [e.id, e]))

  const fiches: FicheAffichable[] = FICHES_TOEIC.map((f) => {
    const e = etats.get(f.part)
    return {
      cle: f.part,
      titre: `Part ${f.numero} — ${f.libelle}`,
      soustitre: `${f.section === 'listening' ? 'Listening' : 'Reading'} · ${f.questions} questions à l’examen`,
      enjeu: f.enjeu,
      methode: f.methode,
      pieges: f.pieges,
      strategie: f.strategie,
      taux: (e?.nbTentatives ?? 0) >= MINIMUM_POUR_CLASSER ? (e?.tauxReussite ?? null) : null,
      nbTentatives: e?.nbTentatives ?? 0,
      prioritaire: false,
    }
  })

  const mesurees = fiches.filter((f) => f.taux !== null)
  const faible = mesurees.length > 0
    ? mesurees.reduce((pire, f) => (f.taux! < pire.taux! ? f : pire))
    : null
  if (faible) faible.prioritaire = true

  return (
    <main className="mx-auto max-w-3xl px-6 py-14">
      <Link href="/toeic" className="text-sm text-doux hover:text-texte">
        ← TOEIC
      </Link>

      <header className="mt-6 mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Cours et astuces</h1>
        <p className="mt-2 text-sm leading-relaxed text-doux">
          Le TOEIC ne sanctionne aucune erreur : toute la stratégie découle de là, et elle est à
          l’opposé de celle du TAGE MAGE. Ces fiches couvrent les sept parties, avec pour chacune
          le geste à prendre et le piège qui coûte le plus cher.
          {faible && (
            <>
              {' '}Tes mesures placent <span className="text-texte">{faible.titre}</span> en
              premier — la fiche est déjà ouverte.
            </>
          )}
        </p>
      </header>

      <section className="mb-10">
        <h2 className="mb-3 text-sm uppercase tracking-widest text-doux">
          Ce qui vaut pour toute l’épreuve
        </h2>
        <div className="space-y-3">
          {REGLES_GENERALES_TOEIC.map((r) => (
            <div key={r.titre} className="rounded-xl border border-bord bg-carte px-5 py-4">
              <p className="text-sm font-medium">{r.titre}</p>
              <p className="mt-1 text-sm leading-relaxed text-doux">{r.texte}</p>
            </div>
          ))}
        </div>
      </section>

      <h2 className="mb-3 text-sm uppercase tracking-widest text-doux">Par partie</h2>
      <FichesClient fiches={fiches} ouvertureInitiale={faible?.cle ?? null} />

      <p className="mt-10 text-xs leading-relaxed text-blanc">
        Le taux affiché à droite de chaque fiche est le tien, mesuré sur tes réponses. Il n’apparaît
        qu’à partir de {MINIMUM_POUR_CLASSER} questions répondues sur la partie.
      </p>
    </main>
  )
}
