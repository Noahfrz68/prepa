import Link from 'next/link'
import PlanClient from './PlanClient'
import { calendrierJusquExamen, historiqueSemaines, planDeLaSemaine } from '@/core/db/semaine'

export const dynamic = 'force-dynamic'

const jourLisible = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
  })

const heures = (min: number) =>
  min >= 60
    ? `${Math.floor(min / 60)} h${min % 60 ? String(Math.round(min % 60)).padStart(2, '0') : ''}`
    : `${Math.round(min)} min`

export default function PagePlan() {
  const plan = planDeLaSemaine()
  // La semaine en cours est déjà affichée en détail : l'historique ne sert
  // qu'à voir si le rythme tient d'une semaine sur l'autre.
  const passees = historiqueSemaines(6).filter((s) => s.semaineDu !== plan.semaineDu)
  const calendrier = calendrierJusquExamen()

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <Link href="/" className="text-sm text-doux hover:text-texte">
        ← Accueil
      </Link>

      <header className="mt-6 mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">
          Semaine du {jourLisible(plan.semaineDu)}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-doux">
          Composé lundi à partir de ton temps disponible, de ce qu’il te reste à étudier et de ce
          que tes réponses montrent de plus faible. Il ne bouge plus de la semaine.
        </p>
      </header>

      <PlanClient initial={plan} />

      {calendrier && calendrier.length > 1 && (
        <section className="mt-12">
          <h2 className="mb-1 text-sm uppercase tracking-widest text-doux">Jusqu’à l’examen</h2>
          <p className="mb-3 text-xs leading-relaxed text-doux">
            Projection : les règles du plan rejouées semaine après semaine, en supposant chaque
            semaine faite comme prévue. Elle bouge à chaque épreuve passée ou manquée.
          </p>
          <div className="overflow-x-auto rounded-xl border border-bord bg-carte">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-bord text-left text-xs uppercase tracking-wider text-doux">
                  <th className="px-4 py-3 font-normal">Semaine du</th>
                  <th className="px-4 py-3 text-right font-normal">Échéance</th>
                  <th className="px-4 py-3 font-normal">Épreuve</th>
                  <th className="px-4 py-3 text-right font-normal">Leçons restantes</th>
                </tr>
              </thead>
              <tbody>
                {calendrier.map((s, i) => (
                  <tr
                    key={s.semaineDu}
                    className={`border-b border-bord last:border-0 ${i === 0 ? 'bg-carte-clair' : ''}`}
                  >
                    <td className="px-4 py-2.5">
                      {jourLisible(s.semaineDu)}
                      {i === 0 && <span className="ml-2 text-xs text-doux">cette semaine</span>}
                    </td>
                    <td className="chiffres px-4 py-2.5 text-right text-doux">
                      {s.examen ? '—' : `J−${s.semainesRestantes} sem.`}
                    </td>
                    <td className="px-4 py-2.5">
                      {s.examen ? (
                        <span className="font-medium text-accent">Examen</span>
                      ) : s.epreuve === 'blanc' ? (
                        'Blanc complet'
                      ) : s.epreuve === 'diagnostic' ? (
                        'Diagnostic'
                      ) : (
                        <span className="text-doux">—</span>
                      )}
                    </td>
                    <td className="chiffres px-4 py-2.5 text-right text-doux">{s.leconsRestantes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {passees.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-3 text-sm uppercase tracking-widest text-doux">Semaines passées</h2>
          <div className="overflow-x-auto rounded-xl border border-bord bg-carte">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-bord text-left text-xs uppercase tracking-wider text-doux">
                  <th className="px-4 py-3 font-normal">Semaine</th>
                  <th className="px-4 py-3 text-right font-normal">Prévu</th>
                  <th className="px-4 py-3 text-right font-normal">Fait</th>
                  <th className="px-4 py-3 text-right font-normal">Temps passé</th>
                  <th className="px-4 py-3 text-right font-normal">Tâches</th>
                </tr>
              </thead>
              <tbody>
                {passees.map((s) => (
                  <tr key={s.semaineDu} className="border-b border-bord last:border-0">
                    <td className="px-4 py-3">{jourLisible(s.semaineDu)}</td>
                    <td className="chiffres px-4 py-3 text-right text-doux">
                      {heures(s.minutesPlanifiees)}
                    </td>
                    <td
                      className={`chiffres px-4 py-3 text-right ${
                        s.minutesFaites >= s.minutesPlanifiees * 0.7 ? 'text-juste' : 'text-blanc'
                      }`}
                    >
                      {heures(s.minutesFaites)}
                    </td>
                    <td className="chiffres px-4 py-3 text-right text-doux">
                      {heures(s.minutesMesurees)}
                    </td>
                    <td className="chiffres px-4 py-3 text-right text-doux">
                      {s.tachesFaites} / {s.taches}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </main>
  )
}
