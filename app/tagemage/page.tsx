import Link from 'next/link'
import { etatExamens, etatSectionsTageMage } from '@/core/db/queries'
import { historiqueScores } from '@/core/db/arbitrage'
import CourbeScore from '@/app/_composants/CourbeScore'
import { historiqueEpreuves } from '@/core/db/epreuve'
import { texteLongComprehension } from '@/core/db/selection'
import { SECONDES_PAR_QUESTION } from '@/exams/tagemage'
import { SEUIL_FIABILITE } from '@/core/stats/calculs'
import {
  QUESTIONS_DIAGNOSTIC,
  QUESTIONS_DIAGNOSTIC_COMPREHENSION,
  composerEpreuve,
  dureeTotaleMinutes,
} from '@/exams/tagemage/epreuve'

export const dynamic = 'force-dynamic'

/** En dessous, le taux d'un sous-test est affiché avec ⚠ (même seuil que la calibration). */
const ECHANTILLON_FIABLE = SEUIL_FIABILITE

/**
 * « 21 septembre », ou « 21 septembre 2025 » hors de l'année en cours.
 * SQLite écrit l'heure en UTC sans le dire : on la lit comme telle, puis on
 * l'affiche à l'heure locale — une épreuve passée à 1 h du matin reste du jour.
 */
function jourLisible(sqliteUtc: string): string {
  const d = new Date(`${sqliteUtc.replace(' ', 'T')}Z`)
  if (Number.isNaN(d.getTime())) return sqliteUtc.slice(0, 10)
  return d.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    ...(d.getFullYear() !== new Date().getFullYear() ? { year: 'numeric' as const } : {}),
  })
}

export default function HubTageMage() {
  const sections = etatSectionsTageMage()
  const total = sections.reduce((acc, s) => acc + s.nbItems, 0)
  const historique = historiqueEpreuves(5)
  const courbe = historiqueScores('tagemage', 20)
  const cible = etatExamens().find((e) => e.examId === 'tagemage')?.scoreCible ?? null
  const dureeBlanc = dureeTotaleMinutes(composerEpreuve('blanc'))
  // Un texte long de sept questions validé remplace le texte de cinq : la
  // carte annonce ce que le diagnostic servira vraiment.
  const questionsComprehension =
    texteLongComprehension(QUESTIONS_DIAGNOSTIC) !== null
      ? QUESTIONS_DIAGNOSTIC
      : QUESTIONS_DIAGNOSTIC_COMPREHENSION
  const dureeDiagnostic =
    dureeTotaleMinutes(composerEpreuve('diagnostic')) +
    Math.round(
      ((questionsComprehension - QUESTIONS_DIAGNOSTIC_COMPREHENSION) * SECONDES_PAR_QUESTION) / 60,
    )

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
            rien : ne laisse jamais une case vide, une croix au hasard vaut 0,8 point en moyenne.
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
            <Link href="/atelier" className="text-accent hover:underline">
              Ouvrir l’atelier →
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
              detail={`6 sous-tests · ${QUESTIONS_DIAGNOSTIC} questions${
                questionsComprehension === QUESTIONS_DIAGNOSTIC
                  ? ' (un texte long en compréhension)'
                  : `, ${QUESTIONS_DIAGNOSTIC_COMPREHENSION} en compréhension`
              } · ${dureeDiagnostic} min`}
              texte="Score estimé avec intervalle, cartographie des faiblesses et trois leviers. Même cadence que l’épreuve réelle."
            />
            <Epreuve
              href="/tagemage/epreuve?mode=blanc"
              titre="Blanc complet"
              detail={`90 questions · ${dureeBlanc} min, sans pause`}
              texte="Conditions réelles, enchaînées, sans retour arrière entre sous-tests. C’est le seul format qui mesure la fatigue."
            />
          </div>
          <p className="mt-2 text-xs text-doux">
            Au crayon, comme le jour J :{' '}
            <Link href="/tagemage/papier?mode=diagnostic" className="text-accent hover:underline">
              diagnostic sur papier
            </Link>{' '}
            ·{' '}
            <Link href="/tagemage/papier?mode=blanc" className="text-accent hover:underline">
              blanc sur papier
            </Link>
            {' '}— sujet imprimé, feuille de réponses saisie ensuite.
          </p>

          {courbe.length >= 2 && (
            <div className="mt-4 rounded-xl border border-bord bg-carte px-5 py-4">
              <p className="text-sm font-medium">Ton score dans le temps</p>
              <p className="mb-3 mt-0.5 text-xs text-doux">
                Chaque épreuve avec son intervalle à 95 %. Tant que deux intervalles se
                chevauchent largement, l’écart entre leurs scores peut n’être que du bruit.
              </p>
              {/* Deux dessins, un par largeur d'écran : le texte garde sa taille. */}
              <div className="sm:hidden">
                <CourbeScore points={courbe} cible={cible} largeurDessin={290} hauteur={170} />
              </div>
              <div className="hidden sm:block">
                <CourbeScore points={courbe} cible={cible} />
              </div>
            </div>
          )}

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
                        <span
                          className="ml-2 text-xs text-blanc"
                          title="La banque manquait de questions pour au moins un sous-test"
                        >
                          banque incomplète
                        </span>
                      )}
                    </span>
                    <span className="chiffres text-doux">{h.n} questions</span>
                    <span className="text-doux">{jourLisible(h.debut)}</span>
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

      <h2 className="mb-1 text-sm uppercase tracking-widest text-doux">Entraînement ciblé</h2>
      <p className="mb-3 text-xs text-doux">
        Réussite = bonnes réponses sur questions servies, sauts compris — la même définition
        partout dans l’application. ⚠ = moins de {ECHANTILLON_FIABLE} réponses : le taux est
        indicatif.
      </p>
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
                  {s.nbTentatives < ECHANTILLON_FIABLE && (
                    <span
                      className="ml-1 text-xs text-blanc"
                      title={`${s.nbTentatives} réponses seulement`}
                    >
                      ⚠
                    </span>
                  )}
                </span>
              ) : (
                <span className="text-doux">—</span>
              )}
            </div>

            {s.nbItems > 0 ? (
              <span className="flex items-center gap-2">
                {/* Sprint : 15 questions sous un seul chronomètre de 20 minutes,
                    comme un sous-test. La compréhension se joue par textes. */}
                {s.id !== 'comprehension' && s.nbItems >= 15 && (
                  <Link
                    href={`/tagemage/drill?section=${s.id}&taille=15&sprint=1`}
                    className="rounded-lg border border-bord px-3 py-2 text-sm text-doux transition hover:border-accent hover:text-texte"
                    title="15 questions, 20 minutes d’un seul bloc, comme à l’épreuve"
                  >
                    Sprint 20 min
                  </Link>
                )}
                <Link
                  href={`/tagemage/drill?section=${s.id}`}
                  className="rounded-lg bg-accent px-3.5 py-2 text-sm font-medium text-fond transition hover:opacity-90"
                >
                  S’entraîner
                </Link>
              </span>
            ) : (
              <Link
                href={`/atelier/import?section=${s.id}`}
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
