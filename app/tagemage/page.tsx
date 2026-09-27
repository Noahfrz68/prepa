import Link from 'next/link'
import { etatExamens, etatSectionsTageMage } from '@/core/db/queries'
import { historiqueScores } from '@/core/db/scores'
import CourbeScore from '@/app/_composants/CourbeScore'
import { jourLisible } from '@/app/_composants/dates'
import { historiqueEpreuves } from '@/core/db/epreuve'
import { questionsEnAttente, reserveAnnales, texteLongComprehension } from '@/core/db/selection'
import { reussiteAFroidParSection } from '@/core/stats/queries'
import { tauxAFroid } from '@/core/stats/afroid'
import { planDeLaSemaine } from '@/core/db/semaine'
import { prochaineSeance } from '@/app/plan/prochaine'
import { SECONDES_PAR_QUESTION, SECTIONS } from '@/exams/tagemage'
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

export default function HubTageMage() {
  const sections = etatSectionsTageMage()
  const total = sections.reduce((acc, s) => acc + s.nbItems, 0)
  const historique = historiqueEpreuves(5)
  const courbe = historiqueScores('tagemage', 20)
  const cible = etatExamens().find((e) => e.examId === 'tagemage')?.scoreCible ?? null
  const dureeBlanc = dureeTotaleMinutes(composerEpreuve('blanc'))
  // Réserve d'annales jamais vues : ce qui permet une épreuve comparable.
  const attente = questionsEnAttente()
  const froid = tauxAFroid(reussiteAFroidParSection('tagemage'))
  const reserve = reserveAnnales()
  const reserveMin = Math.min(...SECTIONS.map((s) => reserve.get(s.id) ?? 0))
  const diagnosticSurAnnales = SECTIONS.every(
    (s) => (reserve.get(s.id) ?? 0) >= (s.id === 'comprehension' ? QUESTIONS_DIAGNOSTIC_COMPREHENSION : QUESTIONS_DIAGNOSTIC),
  )
  // La même séance que l'accueil : la première tâche non faite du plan.
  const prochaine = total > 0 ? prochaineSeance(planDeLaSemaine().taches) : null
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
            rien : case vide = manque à gagner, une croix au hasard vaut 0,8 point en moyenne.
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

      {/* Des questions écrites ou importées attendent une relecture : rien n'est
          servi sans elle, et elles ne comptent dans aucune série tant qu'elles
          n'ont pas été validées. */}
      {attente.aRelire + attente.suspectes > 0 && (
        <Link
          href="/atelier"
          className="mb-4 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 rounded-xl border border-bord bg-carte px-5 py-3 text-sm transition hover:border-accent"
        >
          <span>
            <span className="chiffres font-medium">{attente.aRelire + attente.suspectes}</span> question
            {attente.aRelire + attente.suspectes > 1 ? 's attendent' : ' attend'} ta relecture
            {attente.suspectes > 0 && (
              <span className="text-doux">
                {' '}
                (dont {attente.suspectes} signalée{attente.suspectes > 1 ? 's' : ''} suspecte
                {attente.suspectes > 1 ? 's' : ''})
              </span>
            )}
            <span className="text-doux"> : elles ne sont servies qu’une fois validées.</span>
          </span>
          <span className="text-accent">Ouvrir l’atelier →</span>
        </Link>
      )}

      {prochaine && (
        <Link
          href={prochaine.href}
          className="mb-8 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 rounded-xl border border-accent bg-carte px-5 py-4 transition hover:bg-carte-clair"
        >
          <span>
            <span className="block text-xs uppercase tracking-widest text-doux">
              Prochaine séance du plan
            </span>
            <span className="mt-1 block font-medium">{prochaine.libelle}</span>
          </span>
          <span className="text-sm text-doux">
            {prochaine.detail.replace(/^TAGE MAGE · /, '')}{' '}
            <span className="text-accent">Commencer →</span>
          </span>
        </Link>
      )}

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

          {/* La réserve d'annales jamais vues : sans elle, une épreuve se compose
              surtout de questions générées, mieux réussies, et ne se compare
              qu'aux épreuves de même nature. */}
          <div className="mt-4 rounded-xl border border-bord bg-carte px-5 py-4 text-sm leading-relaxed">
            <p className="font-medium">
              Réserve d’annales jamais vues{' '}
              <span className="chiffres text-doux">
                {SECTIONS.reduce((a, s) => a + (reserve.get(s.id) ?? 0), 0)} questions
              </span>
            </p>
            <p className="mt-1 text-xs text-doux">
              {SECTIONS.map((s) => `${s.libelle} ${reserve.get(s.id) ?? 0}`).join(' · ')}
            </p>
            <p className="mt-2 text-doux">
              {diagnosticSurAnnales
                ? 'Assez pour un diagnostic entièrement sur annales : les épreuves les servent en premier, et les séries n’y touchent pas.'
                : `Pas assez pour un diagnostic entièrement sur annales (il en faut ${QUESTIONS_DIAGNOSTIC} par sous-test, ${QUESTIONS_DIAGNOSTIC_COMPREHENSION} en compréhension ; le plus bas en compte ${reserveMin}). Les épreuves se complètent de questions générées et ne se comparent qu’entre elles. Importer une annale en PDF dans l’atelier remplit la réserve : les séries n’y touchent pas.`}
            </p>
            {!diagnosticSurAnnales && (
              <Link href="/atelier" className="mt-2 inline-block text-sm text-accent hover:underline">
                Importer une annale en PDF →
              </Link>
            )}
          </div>

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
                      {h.papier && <span className="ml-2 text-xs text-doux">sur papier</span>}
                      {h.nature === 'generees' && (
                        <span
                          className="ml-2 text-xs text-doux"
                          title="Ne se compare qu’aux autres épreuves de questions générées"
                        >
                          questions générées
                        </span>
                      )}
                      {h.horsDelai ? (
                        <span
                          className="ml-2 text-xs text-blanc"
                          title="Reprise après une coupure de plus de 5 minutes, chronomètre arrêté"
                        >
                          hors conditions réelles
                        </span>
                      ) : (
                        !h.conditionsReelles && (
                          <span
                            className="ml-2 text-xs text-blanc"
                            title="La banque manquait de questions pour au moins un sous-test"
                          >
                            banque incomplète
                          </span>
                        )
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
        indicatif. « À froid » : sur des scénarios jamais vus, comme le jour de l’épreuve — c’est ce
        taux-là que le plan utilise quand il est mesuré.
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
              {froid.has(s.id) && (
                <span
                  className="block text-xs text-doux"
                  title={`${froid.get(s.id)!.n} réponses sur des scénarios jamais vus`}
                >
                  à froid {Math.round(froid.get(s.id)!.taux * 100)} %
                </span>
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
