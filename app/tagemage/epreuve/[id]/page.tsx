import Link from 'next/link'
import { EnonceRappel, Proposition } from '@/app/_composants/Enonce'
import { notFound } from 'next/navigation'
import { recapEpreuve, type CorrectionEpreuve } from '@/core/db/epreuve'
import { LIBELLE_MODE } from '@/exams/tagemage/epreuve'
import { MINIMUM_ESTIMATION, CIBLE_REUSSITE_LEVIER } from '@/core/stats/diagnostic'
import { REPERES } from '@/core/scoring/tagemage'
import { SECTIONS_PAR_ID } from '@/exams/tagemage'
import DebriefIA from '@/app/_composants/DebriefIA'

export const dynamic = 'force-dynamic'

const pourcent = (x: number) => `${Math.round(x * 100)} %`
const secondes = (ms: number) => `${Math.round(ms / 1000)} s`

export default async function PageRecap({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  let recap
  try {
    recap = recapEpreuve(Number(id))
  } catch {
    notFound()
  }

  const { scoreEstime: s, fatigue, totaux, ecart } = recap

  // Une épreuve abandonnée en route n'a pas de score : extrapoler 38 questions
  // prises dans les premiers sous-tests à l'épreuve entière donnait 568 sur
  // une épreuve jamais finie, comparé ensuite au diagnostic précédent comme
  // s'il s'agissait d'une mesure. On ne garde que ce qui reste vrai : les
  // réponses données et leurs corrections.
  if (!recap.terminee) return <EpreuveInterrompue recap={recap} />

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <Link href="/tagemage" className="text-sm text-doux hover:text-texte">
        ← TAGE MAGE
      </Link>

      <header className="mt-6 mb-8">
        <p className="text-sm uppercase tracking-widest text-doux">
          {LIBELLE_MODE[recap.mode]}
          {!recap.conditionsReelles && ' · format réduit'}
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          Score estimé{' '}
          <span className="chiffres">{s.score}</span>
          <span className="text-base font-normal text-doux"> / 600</span>
        </h1>
        <p className="mt-1 text-sm text-doux">
          Intervalle à 95 % : <span className="chiffres text-texte">{s.bas}</span> à{' '}
          <span className="chiffres text-texte">{s.haut}</span>. Extrapolé depuis {totaux.n}{' '}
          question{totaux.n > 1 ? 's' : ''}.
          {!s.fiable && ` En dessous de ${MINIMUM_ESTIMATION} questions, cet intervalle est trop large pour décider quoi que ce soit.`}
        </p>
        <p className="mt-2 text-xs text-doux">
          Repères : moyenne nationale {REPERES.moyenneNationale[0]}–{REPERES.moyenneNationale[1]} ·
          bon &gt; {REPERES.bon} · très bon &gt; {REPERES.tresBon} · top écoles &gt;{' '}
          {REPERES.topEcoles}
        </p>
      </header>

      {/* Répartition des points perdus : c'est la première question à trancher. */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <Tuile v={totaux.justes} l="justes" ton="juste" />
        <Tuile v={totaux.fausses} l="fausses" ton="faux" />
        <Tuile v={totaux.sautees} l="sautées" ton="blanc" />
        <Tuile v={totaux.nonTraitees} l="non traitées" ton="blanc" />
        <Tuile v={totaux.pointsBruts} l="points bruts" />
      </section>

      {totaux.nonTraitees > 0 && (
        <p className="mt-4 rounded-xl border border-bord bg-carte px-5 py-4 text-sm text-blanc">
          {totaux.nonTraitees} question{totaux.nonTraitees > 1 ? 's' : ''} non traitée
          {totaux.nonTraitees > 1 ? 's' : ''} faute de temps. Ce n’est pas un problème de
          connaissances mais de rythme, et ça se corrige plus vite.
        </p>
      )}

      {recap.precedent && (
        <p className="mt-4 text-sm text-doux">
          {LIBELLE_MODE[recap.mode]} précédent :{' '}
          <Link
            href={`/tagemage/epreuve/${recap.precedent.sessionId}`}
            className="text-accent hover:underline"
          >
            <span className="chiffres">{recap.precedent.score}</span> / 600
          </Link>
          {' · '}
          <span className={s.score >= recap.precedent.score ? 'text-juste' : 'text-faux'}>
            {s.score >= recap.precedent.score ? '+' : ''}
            {s.score - recap.precedent.score}
          </span>
        </p>
      )}

      {ecart && <EcartCible ecart={ecart} />}

      <DebriefIA sessionId={recap.sessionId} />

      <Fatigue fatigue={fatigue} />

      <Leviers leviers={recap.leviers} />

      <Corrections corrections={recap.corrections} />

      <div className="mt-10 flex flex-wrap gap-3">
        <Link
          href="/tagemage/strategie"
          className="rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-fond hover:opacity-90"
        >
          Voir la stratégie de score
        </Link>
        <Link
          href="/tagemage"
          className="rounded-lg border border-bord px-4 py-2.5 text-sm text-doux hover:text-texte"
        >
          Retour
        </Link>
      </div>
    </main>
  )
}

/* ------------------------------------------------------------ blocs -- */

function EpreuveInterrompue({ recap }: { recap: Awaited<ReturnType<typeof recapEpreuve>> }) {
  const { totaux } = recap
  const faits = recap.fatigue.points
  // Encore reprenable : la page d'épreuve la retrouve dans ce navigateur.
  const enCours = !recap.interrompue

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <Link href="/tagemage" className="text-sm text-doux hover:text-texte">
        ← TAGE MAGE
      </Link>

      <header className="mt-6 mb-8">
        <p className="text-sm uppercase tracking-widest text-doux">
          {LIBELLE_MODE[recap.mode]} · {enCours ? 'en cours' : 'non terminé'}
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          {enCours ? 'Épreuve en cours' : 'Épreuve interrompue'}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-doux">
          {faits.length} sous-test{faits.length > 1 ? 's' : ''} sur {recap.sousTestsPrevus}{' '}
          enregistré{faits.length > 1 ? 's' : ''}, {totaux.n} question{totaux.n > 1 ? 's' : ''}{' '}
          au total. Aucun score n’est estimé : les sous-tests manquants ne se devinent pas
          depuis les autres, et cette épreuve n’entre dans aucune comparaison. Tes réponses
          comptent quand même dans la stratégie de score et dans le carnet d’erreurs.
        </p>
      </header>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Tuile v={totaux.justes} l="justes" ton="juste" />
        <Tuile v={totaux.fausses} l="fausses" ton="faux" />
        <Tuile v={totaux.sautees} l="sautées" ton="blanc" />
        <Tuile v={totaux.nonTraitees} l="non traitées" ton="blanc" />
      </section>

      <Corrections corrections={recap.corrections} />

      <div className="mt-10 flex flex-wrap gap-3">
        <Link
          href={`/tagemage/epreuve?mode=${recap.mode}`}
          className="rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-fond hover:opacity-90"
        >
          {enCours ? 'Reprendre l’épreuve' : `Repasser un ${LIBELLE_MODE[recap.mode].toLowerCase()}`}
        </Link>
        <Link
          href="/tagemage"
          className="rounded-lg border border-bord px-4 py-2.5 text-sm text-doux hover:text-texte"
        >
          Retour
        </Link>
      </div>
    </main>
  )
}

function Tuile({ v, l, ton }: { v: number; l: string; ton?: string }) {
  const c =
    ton === 'juste' ? 'text-juste' : ton === 'faux' ? 'text-faux' : ton === 'blanc' ? 'text-blanc' : ''
  return (
    <div className="rounded-xl border border-bord bg-carte px-4 py-3">
      <p className={`chiffres text-2xl font-semibold ${c}`}>{v}</p>
      <p className="text-xs text-doux">{l}</p>
    </div>
  )
}

function EcartCible({ ecart }: { ecart: NonNullable<Awaited<ReturnType<typeof recapEpreuve>>['ecart']> }) {
  return (
    <section className="mt-10">
      <h2 className="mb-3 text-sm uppercase tracking-widest text-doux">Écart à ta cible</h2>

      {ecart.atteint ? (
        <p className="rounded-xl border border-bord bg-carte px-5 py-4 text-sm text-juste">
          Ta cible de {ecart.cible} est atteinte sur cette épreuve. Il reste à la tenir en
          conditions réelles, plusieurs fois.
        </p>
      ) : (
        <div className="rounded-xl border border-bord bg-carte px-5 py-4">
          <p className="text-sm">
            Il te manque <span className="chiffres font-semibold">{ecart.pointsEchelleManquants}</span>{' '}
            points pour atteindre {ecart.cible}, soit{' '}
            <span className="chiffres font-semibold text-blanc">
              {ecart.bonnesReponsesSupplementaires}
            </span>{' '}
            bonnes réponses de plus sur l’épreuve — environ{' '}
            <span className="chiffres text-blanc">{ecart.parSousTest}</span> par sous-test.
          </p>
          <p className="mt-3 border-t border-bord pt-3 text-xs leading-relaxed text-doux">
            Calculé en convertissant des mauvaises réponses en bonnes, ce qui rapporte 4 points
            bruts à chaque fois — autant qu’une case vide remplie juste. Ce n’est pas une projection dans le temps : estimer où tu seras
            à la date de l’examen demande une pente de progression mesurée sur plusieurs
            semaines, que le planificateur fournira.
          </p>
        </div>
      )}
    </section>
  )
}

function Fatigue({ fatigue }: { fatigue: Awaited<ReturnType<typeof recapEpreuve>>['fatigue'] }) {
  const points = (x: number) => `${Math.round(Math.abs(x) * 100)} points`
  // En comparaison relative, l'écart se lit « par rapport à tes habitudes » :
  // la difficulté propre de chaque sous-test est déjà retirée.
  const message = fatigue.relatif
    ? {
        degradation: `En seconde moitié, tu réussis ${points(fatigue.ecart)} de moins que d’habitude sur les mêmes sous-tests, par rapport à la première moitié. C’est de l’endurance, pas des connaissances : le remède est de passer des épreuves entières, pas de réviser davantage.`,
        progression: `Tu montes en régime : ${points(fatigue.ecart)} de mieux que tes habitudes en seconde moitié. Tes premiers sous-tests te coûtent un temps de chauffe.`,
        stable:
          'Comparé à ta réussite habituelle dans chaque sous-test, rien ne se dégrade au fil de l’épreuve. L’endurance n’est pas ton problème.',
        donnees_insuffisantes: 'Pas assez de sous-tests passés pour analyser la fatigue.',
      }[fatigue.verdict]
    : {
        degradation: `Ta réussite baisse de ${points(fatigue.ecart)} entre la première et la seconde moitié. Prudence : sans assez d’historique par sous-test, on ne peut pas séparer la fatigue de la difficulté propre des derniers sous-tests.`,
        progression: `${points(fatigue.ecart)} de mieux en seconde moitié. Sans historique par sous-test, la difficulté des sous-tests peut expliquer une partie de l’écart.`,
        stable: 'Ta performance ne se dégrade pas au fil de l’épreuve.',
        donnees_insuffisantes: 'Pas assez de sous-tests passés pour analyser la fatigue.',
      }[fatigue.verdict]

  const couleur =
    fatigue.verdict === 'degradation'
      ? 'text-faux'
      : fatigue.verdict === 'progression'
        ? 'text-blanc'
        : fatigue.verdict === 'stable'
          ? 'text-juste'
          : 'text-doux'

  const max = Math.max(1, ...fatigue.points.map((p) => p.tauxReussite))

  return (
    <section className="mt-10">
      <h2 className="mb-1 text-sm uppercase tracking-widest text-doux">Courbe de fatigue</h2>
      <p className="mb-4 text-sm text-doux">
        Réussite par sous-test, dans l’ordre chronologique de passage
        {fatigue.relatif && ', comparée à ta réussite habituelle dans chacun (trait pointillé)'}.
      </p>

      <div className="rounded-xl border border-bord bg-carte px-5 py-5">
        <div className="flex items-end gap-2" style={{ height: 120 }}>
          {fatigue.points.map((p) => (
            <div key={p.section} className="flex flex-1 flex-col items-center justify-end gap-1.5">
              <span className="chiffres text-xs text-doux">{pourcent(p.tauxReussite)}</span>
              <div className="relative w-full" style={{ height: 90 }}>
                <div
                  className={`absolute bottom-0 w-full rounded-t ${
                    p.tauxHabituel != null && p.tauxReussite < p.tauxHabituel - 0.1
                      ? 'bg-faux'
                      : 'bg-accent'
                  }`}
                  style={{ height: `${Math.max(3, (p.tauxReussite / max) * 90)}px` }}
                />
                {p.tauxHabituel != null && (
                  <div
                    className="absolute left-0 right-0 border-t-2 border-dashed border-texte opacity-70"
                    style={{ bottom: `${(p.tauxHabituel / max) * 90}px` }}
                    title={`Habituellement ${pourcent(p.tauxHabituel)}`}
                  />
                )}
              </div>
              <span className="chiffres text-xs text-doux">{p.position}</span>
            </div>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 border-t border-bord pt-3 text-xs text-doux">
          {fatigue.points.map((p) => (
            <span key={p.section}>
              <span className="chiffres">{p.position}</span>. {p.libelle}
              <span className="ml-1 opacity-60">{secondes(p.tempsMoyenMs)}/q</span>
              {p.tauxHabituel != null && (
                <span className="ml-1 opacity-60">· habituellement {pourcent(p.tauxHabituel)}</span>
              )}
            </span>
          ))}
        </div>
      </div>

      <p className={`mt-3 text-sm ${couleur}`}>{message}</p>

      {fatigue.nonTraiteesSecondeMoitie > 0 && (
        <p className="mt-1 text-sm text-blanc">
          {fatigue.nonTraiteesSecondeMoitie} question
          {fatigue.nonTraiteesSecondeMoitie > 1 ? 's' : ''} non traitée
          {fatigue.nonTraiteesSecondeMoitie > 1 ? 's' : ''} en seconde moitié.
        </p>
      )}
    </section>
  )
}

function Leviers({ leviers }: { leviers: Awaited<ReturnType<typeof recapEpreuve>>['leviers'] }) {
  if (leviers.length === 0) return null

  return (
    <section className="mt-10">
      <h2 className="mb-1 text-sm uppercase tracking-widest text-doux">Trois leviers</h2>
      <p className="mb-4 text-sm text-doux">
        Points récupérables si ce sous-test passait à {pourcent(CIBLE_REUSSITE_LEVIER)} de
        réussite. L’hypothèse est affichée : ce n’est pas un pronostic sur toi.
      </p>

      <ol className="space-y-2">
        {leviers.map((l, i) => (
          <li
            key={l.section}
            className="flex flex-wrap items-center gap-x-5 gap-y-1 rounded-xl border border-bord bg-carte px-5 py-4 text-sm"
          >
            <span className="chiffres w-4 text-doux">{i + 1}</span>
            <span className="flex-1 font-medium">{l.libelle}</span>
            <span className="text-doux">{l.raison}</span>
            <span className="chiffres text-juste">+{l.pointsRecuperables} pts bruts</span>
          </li>
        ))}
      </ol>
    </section>
  )
}

function Corrections({ corrections }: { corrections: CorrectionEpreuve[] }) {
  const parSection = new Map<string, CorrectionEpreuve[]>()
  for (const c of corrections) {
    if (!parSection.has(c.section)) parSection.set(c.section, [])
    parSection.get(c.section)!.push(c)
  }

  return (
    <section className="mt-10">
      <h2 className="mb-4 text-sm uppercase tracking-widest text-doux">Corrections</h2>

      <div className="space-y-6">
        {[...parSection.entries()].map(([section, liste]) => (
          <div key={section}>
            <h3 className="mb-2 text-sm font-medium text-doux">
              {SECTIONS_PAR_ID.get(section as never)?.libelle ?? section}
            </h3>
            <ol className="space-y-2">
              {liste.map((c, i) => (
                <Ligne key={c.itemId} numero={i + 1} c={c} />
              ))}
            </ol>
          </div>
        ))}
      </div>
    </section>
  )
}

function Ligne({ numero, c }: { numero: number; c: CorrectionEpreuve }) {
  const etat = c.motifBlanc === 'non_traite' ? 'non traitée' : c.aSaute ? 'sautée' : c.estCorrect ? 'juste' : 'fausse'
  const couleur = c.aSaute ? 'text-blanc' : c.estCorrect ? 'text-juste' : 'text-faux'
  const options = c.typeItem === 'conditions_minimales' ? [] : c.options
  const iBonne = ['A', 'B', 'C', 'D', 'E'].indexOf(c.bonneReponse)

  return (
    <li className="rounded-xl border border-bord bg-carte px-5 py-3">
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 text-xs text-doux">
        <span className="chiffres">#{numero}</span>
        <span className={couleur}>{etat}</span>
        <span className="chiffres">
          {c.points > 0 ? '+' : ''}
          {c.points}
        </span>
        <span className="chiffres">{secondes(c.tempsMs)}</span>
        {!c.aSaute && <span>confiance {c.confiance}/4</span>}
      </div>

      <EnonceRappel enonce={c.enonce} figure={c.figure} />

      <div className="mt-1.5 text-sm">
        <span className="text-doux">Bonne réponse : </span>
        <span className="text-juste">{c.bonneReponse}</span>
        {options[iBonne] && (
          <span className="text-juste">
            {' — '}
            <Proposition texte={options[iBonne]} c={c.optionsFigure?.[iBonne]} taille={48} />
          </span>
        )}
        {!c.estCorrect && !c.aSaute && c.reponseDonnee && (
          <>
            <span className="text-doux"> · ta réponse : </span>
            <span className="text-faux">{c.reponseDonnee}</span>
          </>
        )}
      </div>

      {c.diagnostic && !c.estCorrect && (
        <p className="mt-1 text-sm text-doux">Ce que vaut cette proposition : {c.diagnostic}</p>
      )}

      {/* Juste : le réflexe en une ligne. Faux ou sauté : la démarche entière —
          c'est là qu'on apprend quelque chose, pas en relisant ce qu'on a su faire. */}
      {(c.estCorrect ? (c.rappel ?? c.explication) : (c.explication ?? c.rappel)) && (
        <div className="mt-2 border-t border-bord pt-2">
          {!c.estCorrect && (
            <p className="mb-1.5 text-xs uppercase tracking-widest text-doux">La démarche</p>
          )}
          <p className="whitespace-pre-line text-sm leading-relaxed text-doux">
            {c.estCorrect ? (c.rappel ?? c.explication) : (c.explication ?? c.rappel)}
          </p>
        </div>
      )}

      {!c.estCorrect && c.skillId && (
        <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
          <Link href={`/tagemage/cours#${c.skillId}`} className="text-accent hover:underline">
            Revoir la leçon →
          </Link>
          <Link
            href={`/tagemage/drill?section=${c.section}&skills=${c.skillId}`}
            className="text-doux hover:text-texte"
          >
            Refaire une série de ce type
          </Link>
        </p>
      )}
    </li>
  )
}
