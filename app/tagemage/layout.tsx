import Link from 'next/link'
import { etatExamens } from '@/core/db/queries'
import { jourLisible } from '@/app/_composants/dates'

// Le compte à rebours se lit à chaque affichage : figé au build, il mentirait
// dès le lendemain.
export const dynamic = 'force-dynamic'

/**
 * Le J−X sur toutes les pages TAGE MAGE, pas seulement l'accueil : c'est
 * pendant une série ou devant la stratégie qu'on a besoin de se rappeler ce
 * qui reste. Discret, et absent des pages imprimées.
 */
export default function LayoutTageMage({ children }: { children: React.ReactNode }) {
  const examen = etatExamens().find((e) => e.examId === 'tagemage')
  const n = examen?.joursRestants ?? null

  return (
    <>
      {examen?.dateExamen && n !== null && (
        <div className="sans-impression border-b border-bord">
          <div className="mx-auto flex max-w-4xl justify-end px-6 py-1.5 text-xs text-doux">
            <Link href="/objectifs" className="hover:text-texte" title="Modifier la date d’examen">
              TAGE MAGE ·{' '}
              {n > 0 ? (
                <span className="chiffres font-medium text-texte">J−{n}</span>
              ) : n === 0 ? (
                <span className="font-medium text-accent">Jour J</span>
              ) : (
                <span className="text-faux">date passée, à mettre à jour</span>
              )}{' '}
              · {jourLisible(examen.dateExamen, 'toujours')}
              {examen.dateProvisoire && ' (provisoire)'}
            </Link>
          </div>
        </div>
      )}
      {children}
    </>
  )
}
