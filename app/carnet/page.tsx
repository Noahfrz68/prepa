import Link from 'next/link'
import CarnetClient from './CarnetClient'
import { entreesCarnet, resumeCarnet } from '@/core/db/carnet'

export const dynamic = 'force-dynamic'

export default function PageCarnet() {
  const resume = resumeCarnet()
  const entrees = entreesCarnet()

  return (
    <main className="mx-auto max-w-3xl px-6 py-14">
      <Link href="/" className="text-sm text-doux hover:text-texte">
        ← Préparation
      </Link>

      <header className="mt-6 mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Carnet d’erreurs</h1>
        <p className="mt-2 text-sm leading-relaxed text-doux">
          Chaque question ratée ou sautée arrive ici et y reste jusqu’à ce que tu la coches. Une
          erreur qu’on ne revoit jamais se répète — c’est la seule raison d’être de cette page.
        </p>
      </header>

      <CarnetClient entreesInitiales={entrees} resumeInitial={resume} />
    </main>
  )
}
