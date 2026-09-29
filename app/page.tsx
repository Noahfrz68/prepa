import Link from 'next/link'
import { etatExamens } from '@/core/db/queries'
import { dernierScoreSurAnnales, historiqueScores, scoreEstime } from '@/core/db/scores'
import { jourLisible } from '@/app/_composants/dates'
import { lienBilanEpreuve } from '@/app/_composants/liens'
import { LIBELLE_NATURE } from '@/core/stats/nature'
import {
  JOURS_AVANT_RAPPEL,
  joursSansActivite,
  planDeLaSemaine,
} from '@/core/db/semaine'
import { prochaineSeance, type Seance } from './plan/prochaine'
import { rangerSessionsAbandonnees } from '@/core/db/sessions'
import { resumeCarnet } from '@/core/db/carnet'
import type { ScoreHistorique } from '@/core/db/scores'
import PremierPas, { type Etape } from './PremierPas'
import Progression from './Progression'
import { duree as heures } from '@/app/_composants/nombres'

export const dynamic = 'force-dynamic'

export default function Accueil() {
  // Les séances quittées en route depuis plus de 12 h sont rangées avant tout
  // calcul : vides, supprimées ; entamées, marquées interrompues.
  rangerSessionsAbandonnees()
  const examens = etatExamens()
  // Le même plan que /plan, lu au même endroit. L'accueil calculait le sien
  // avec l'ancien arbitrage du lot 7 : 2 h 51 prévues ici, 9 h 59 là-bas, et
  // une « séance à faire maintenant » que /plan rangeait déjà dans « Fait ».
  const plan = planDeLaSemaine()
  const prochaine = prochaineSeance(plan.taches)
  const inactif = joursSansActivite()
  const carnet = resumeCarnet()
  // Même source que l'arbitrage : afficher « non estimé » ici pendant que le
  // plan raisonne sur un écart chiffré serait une contradiction visible.
  const scores = new Map(examens.map((e) => [e.examId, scoreEstime(e.examId)]))
  const historiques = new Map(examens.map((e) => [e.examId, historiqueScores(e.examId)]))
  const banqueVide = examens.every((e) => e.nbItems === 0)
  const etape = prochaineEtape(examens, scores, prochaine)

  return (
    <main className="mx-auto max-w-4xl px-6 py-14">
      <header className="mb-10">
        <h1 className="text-2xl font-semibold tracking-tight">Préparation</h1>
        <p className="mt-1 text-sm text-doux">
          Instrument de mesure et coach de stratégie de score.
        </p>
      </header>

      {/* Rappel de régularité : l'application est locale et ne peut rien
          envoyer ; c'est donc à l'ouverture qu'elle le dit. */}
      {inactif !== null && inactif >= JOURS_AVANT_RAPPEL && (
        <p className="mb-4 rounded-xl border border-blanc px-5 py-3 text-sm leading-relaxed text-blanc">
          Aucune séance depuis <span className="chiffres">{inactif}</span> jours. La régularité
          compte plus que la durée : même une série de quinze questions aujourd’hui entretient
          le rythme — et un jour de plus sans rien, c’est l’habitude qui se défait.
        </p>
      )}

      {etape && <PremierPas etape={etape} />}

      {/* Le plan hebdomadaire, arbitré entre les deux préparations. C'est la
          seule chose que les deux modules partagent. */}
      <section className="mb-8 rounded-xl border border-bord bg-carte px-5 py-4">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <span className="text-xs uppercase tracking-widest text-doux">
            {banqueVide ? 'État de la banque' : 'Plan de la semaine'}
          </span>
          <span className="flex gap-4">
            <Link href="/objectifs" className="text-sm text-doux hover:text-texte">
              Objectifs
            </Link>
            <Link href="/reglages" className="text-sm text-doux hover:text-texte">
              Réglages
            </Link>
            <Link href="/carnet" className="text-sm text-doux hover:text-texte">
              Carnet
              {/* Les reprises du jour, pas le total : 230 erreurs en attente ne disent
                  pas quoi faire aujourd'hui, 15 reprises dues si. */}
              {carnet.aRejouerAujourdhui > 0 ? (
                <span
                  className="chiffres ml-1.5 rounded-full bg-faux/15 px-1.5 py-0.5 text-xs text-faux"
                  title={`${carnet.aRejouerAujourdhui} reprises aujourd’hui · ${carnet.aTravailler} erreurs à revoir au total`}
                >
                  {carnet.aRejouerAujourdhui} aujourd’hui
                </span>
              ) : (
                carnet.aTravailler > 0 && (
                  <span
                    className="chiffres ml-1.5 text-xs text-doux"
                    title={`${carnet.aTravailler} erreurs à revoir, aucune reprise due aujourd’hui`}
                  >
                    {carnet.aTravailler}
                  </span>
                )
              )}
            </Link>
            <Link href="/atelier" className="text-sm text-accent hover:underline">
              Mes questions →
            </Link>
          </span>
        </div>

        {banqueVide ? (
          <p className="mt-3 text-sm text-doux">
            Aucune question en banque. Le plan, la stratégie et le calendrier restent vides tant
            qu’il n’y a rien à mesurer.
          </p>
        ) : (
          <>
            <div className="mt-3 flex flex-wrap items-baseline gap-x-6 gap-y-1 text-sm">
              <span className="text-doux">
                <span className="chiffres text-texte">{heures(plan.minutesPlanifiees)}</span>{' '}
                prévues
              </span>
              <span className="text-doux">
                <span className="chiffres text-texte">{heures(plan.minutesFaites)}</span>{' '}
                faites
                {plan.minutesDeclarees > 0 && (
                  <>
                    {' '}+ <span className="chiffres text-texte">{heures(plan.minutesDeclarees)}</span>{' '}
                    déclarées
                  </>
                )}
              </span>
              <span className="text-doux">
                <span className="chiffres text-texte">
                  {plan.taches.filter((t) => t.fait).length} / {plan.taches.length}
                </span>{' '}
                tâches
              </span>
            </div>

            {plan.minutesPlanifiees > 0 && (
              <div className="mt-3 h-1.5 overflow-hidden rounded bg-carte-clair">
                <div
                  className="h-full bg-accent"
                  style={{
                    width: `${Math.min(100, (plan.minutesFaites / plan.minutesPlanifiees) * 100)}%`,
                  }}
                />
              </div>
            )}

            <div className="mt-3 flex flex-wrap items-baseline justify-between gap-3 text-sm">
              {/* La prochaine séance est déjà le « À faire maintenant » du haut de page :
                  la répéter ici l'affichait deux fois de suite. */}
              {prochaine ? (
                etape?.href === prochaine.href ? (
                  <span />
                ) : (
                  <Link href={prochaine.href} className="text-accent hover:underline">
                    → {prochaine.libelle}
                    <span className="ml-2 text-xs text-doux">{prochaine.detail}</span>
                  </Link>
                )
              ) : (
                <span className="text-doux">Tout le plan de la semaine est fait.</span>
              )}
              <Link href="/plan" className="text-sm text-doux hover:text-texte">
                Voir le plan →
              </Link>
            </div>
          </>
        )}
      </section>

      <div className="grid gap-5 sm:grid-cols-2">
        {examens.map((e) => (
          <CarteExamen
            key={e.examId}
            examen={e}
            scoreEstime={scores.get(e.examId) ?? null}
            historique={historiques.get(e.examId) ?? []}
            surAnnales={e.examId === 'tagemage' ? dernierScoreSurAnnales('tagemage') : null}
          />
        ))}
      </div>

      <footer className="mt-12 text-xs leading-relaxed text-doux">
        Tes données restent sur cette machine et tout fonctionne hors ligne. Seule exception,
        facultative : le débrief du tuteur, qui envoie le bilan d’une série au fournisseur d’IA
        que tu as configuré dans les réglages — sans clé, rien ne part. La synthèse vocale du
        Listening tourne en local, sans compte ni clé.
      </footer>
    </main>
  )
}

/**
 * Désigne l'unique action qui a du sens maintenant.
 *
 * Trois états seulement, dans cet ordre : il n'y a rien à travailler, il y a de
 * quoi travailler mais rien à mesurer, ou la mesure existe et le plan sait quoi
 * faire. Chacun rend le précédent caduc, et aucun ne se devine depuis l'accueil
 * tel qu'il était.
 */
function prochaineEtape(
  examens: ReturnType<typeof etatExamens>,
  scores: Map<string, number | null>,
  seance: Seance | null,
): Etape | null {
  if (examens.every((e) => e.nbItems === 0)) {
    return {
      amorce: 'Commence ici',
      titre: 'Aucune question en banque',
      detail:
        'Rien ne peut être mesuré tant qu’il n’y a rien à travailler. Importe une annale ou fabrique un premier lot.',
      href: '/atelier',
      bouton: 'Ouvrir l’atelier',
    }
  }

  // Un examen fourni mais jamais mesuré : le diagnostic passe avant tout, parce
  // que le plan et la stratégie ne savent rien dire sans lui.
  const aMesurer = examens.find((e) => e.nbItems >= 40 && scores.get(e.examId) == null)
  if (aMesurer) {
    return {
      amorce: 'Commence ici',
      titre: `Diagnostic ${aMesurer.libelle}`,
      detail:
        aMesurer.examId === 'tagemage'
          ? '6 sous-tests, 40 questions, 53 minutes. Il donne le score estimé, la carte des faiblesses et le premier plan — rien d’autre ne peut le faire.'
          : 'Une série par partie suffit à situer ton niveau et à lancer l’estimation de score.',
      // Sans mode, la page d'épreuve lance un BLANC de deux heures : le bouton
      // « Passer le diagnostic » y menait jusqu'ici.
      href: aMesurer.examId === 'tagemage' ? '/tagemage/epreuve?mode=diagnostic' : '/toeic',
      bouton: 'Passer le diagnostic',
    }
  }

  if (seance) {
    return {
      amorce: 'À faire maintenant',
      titre: seance.libelle,
      detail: `${seance.detail} · La prochaine tâche de ton plan de la semaine, dans l’ordre où il l’a composé.`,
      href: seance.href,
      bouton: 'Lancer la séance',
    }
  }

  return null
}

function CarteExamen({
  examen,
  scoreEstime,
  historique,
  surAnnales = null,
}: {
  examen: ReturnType<typeof etatExamens>[number]
  scoreEstime: number | null
  historique: ScoreHistorique[]
  /** Dernier score sur annales : le repère comparable à l'épreuve réelle. */
  surAnnales?: { sessionId: number; score: number; jour: string } | null
}) {
  const derniere = historique[historique.length - 1] ?? null
  const href = examen.examId === 'tagemage' ? '/tagemage' : '/toeic'
  const maximum = examen.examId === 'tagemage' ? 600 : 990

  return (
    <section className="flex flex-col rounded-xl border border-bord bg-carte p-6">
      <h2 className="text-lg font-semibold">{examen.libelle}</h2>

      <div className="mt-4 flex-1">
        {scoreEstime !== null ? (
          <p className="chiffres text-3xl font-semibold">
            {scoreEstime}
            <span className="ml-1 text-base font-normal text-doux">/ {maximum}</span>
          </p>
        ) : examen.nbItems === 0 ? (
          // Un examen sans questions n'attend pas un diagnostic, il attend du
          // contenu. Réclamer une mesure impossible ne mène nulle part.
          <p className="text-sm text-doux">
            <span className="text-blanc">À alimenter</span> — aucune question en banque, donc
            aucune mesure possible.
          </p>
        ) : (
          <p className="text-sm text-doux">
            Score non encore estimé — passe un diagnostic pour l’obtenir.
          </p>
        )}
        {/* Le dernier score peut venir d'une épreuve surtout générée, mieux
            réussie que les annales : on le dit, et on donne à côté le dernier
            score sur annales, seul comparable à l'épreuve réelle. */}
        {scoreEstime !== null && derniere && examen.examId === 'tagemage' && (
          <p className="mt-1 text-xs leading-relaxed text-doux">
            Dernière épreuve, {LIBELLE_NATURE[derniere.nature]}.
            {derniere.nature === 'generees' &&
              (surAnnales ? (
                <>
                  {' '}Sur annales :{' '}
                  <Link href={lienBilanEpreuve(surAnnales.sessionId)} className="text-texte hover:underline">
                    <span className="chiffres">{surAnnales.score}</span> / {maximum}
                  </Link>{' '}
                  ({jourLisible(surAnnales.jour)}) — le repère comparable à l’épreuve réelle.
                </>
              ) : (
                ' Aucune épreuve sur annales : ce score surestime probablement ton niveau.'
              ))}
          </p>
        )}
        {scoreEstime !== null && examen.examId === 'toeic_lr' && (
          <p className="mt-1 text-xs text-doux">
            Extrapolé depuis le Reading seul : le Listening n’a pas encore de questions en banque.
          </p>
        )}

        <p className="mt-2 text-sm text-doux">
          {examen.scoreCible ? `Cible ${examen.scoreCible}` : 'Cible non définie'}
          {' · '}
          {examen.joursRestants !== null
            ? `J−${examen.joursRestants}${examen.dateProvisoire ? ' (date provisoire)' : ''}`
            : 'Date non renseignée'}
        </p>

        <Progression historique={historique} maximum={maximum} cible={examen.scoreCible} />
      </div>

      <Link
        href={href}
        className="mt-6 inline-flex items-center justify-center rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-fond transition hover:opacity-90"
      >
        Entrer
      </Link>
    </section>
  )
}
