import Link from 'next/link'
import { estimationReading, etatParts } from '@/core/db/toeic'
import { diagnosticAccent, etatPreparation, etatSynthese, statsParAccent } from '@/core/db/listening'
import { etatAudio } from '@/core/audio/moteurs'
import { LIBELLE_ACCENT } from '@/exams/toeic/listening'
import { etatVocabulaire } from '@/core/db/vocabulaire'
import { BUDGET_READING_MINUTES, MINUTES_READING } from '@/exams/toeic'
import { MINIMUM_ESTIMATION_TOEIC, REPERES_TOEIC } from '@/core/scoring/toeic'

export const dynamic = 'force-dynamic'

const pourcent = (x: number) => `${Math.round(x * 100)} %`

export default function HubToeic() {
  const parts = etatParts()
  const reading = parts.filter((p) => p.section === 'reading')
  const listening = parts.filter((p) => p.section === 'listening')
  const estimation = estimationReading()
  const vocab = etatVocabulaire()
  const totalReading = reading.reduce((acc, p) => acc + p.nbItems, 0)
  const audio = etatAudio()
  const synthese = etatSynthese()
  const accents = statsParAccent()
  const faible = diagnosticAccent()
  const preparation = etatPreparation()
  const banqueVide = parts.every((p) => p.nbItems === 0)

  return (
    <main className="mx-auto max-w-4xl px-6 py-14">
      <Link href="/" className="text-sm text-doux hover:text-texte">
        ← Accueil
      </Link>

      <header className="mt-6 mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
        <h1 className="text-2xl font-semibold tracking-tight">TOEIC</h1>
        <p className="mt-1 text-sm text-doux">
          Aucune pénalité pour une mauvaise réponse. Il ne faut donc{' '}
          <span className="text-texte">jamais laisser une case vide</span> — c’est l’inverse
          exact du TAGE MAGE, et l’erreur stratégique la plus coûteuse serait de transposer.
        </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/plan"
            className="rounded-lg border border-bord px-4 py-2.5 text-sm text-doux transition hover:border-accent hover:text-texte"
          >
            Plan de la semaine →
          </Link>
          <Link
            href="/toeic/cours"
            className="rounded-lg border border-bord px-4 py-2.5 text-sm text-doux transition hover:border-accent hover:text-texte"
          >
            Cours et astuces →
          </Link>
        </div>
      </header>

      {/*
        Banque vide : un seul bloc, et rien d'autre.

        L'écran affichait jusqu'ici « 0 question » sept fois, « aucune question
        en banque » trois fois et un bouton d'import par partie. Répété onze
        fois, un vide se lit comme une panne : on en conclut que le produit est
        cassé, pas qu'il attend son contenu. Une seule phrase et une seule
        action disent la même chose sans décourager.
      */}
      {banqueVide ? (
        <section className="rounded-xl border border-accent bg-carte px-6 py-6">
          <p className="text-xs uppercase tracking-widest text-accent">Prêt, mais vide</p>
          <h2 className="mt-1.5 text-lg font-semibold">
            Le module TOEIC n’a pas encore de questions
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-doux">
            Tout est en place — Reading parts 5 à 7, Listening parts 1 à 4 avec la synthèse vocale
            locale, le vocabulaire alimenté par tes erreurs. Il ne manque que la matière, et elle
            ne se télécharge pas : c’est toi qui ouvres les fichiers depuis ton disque.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/import?exam=toeic_lr"
              className="rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-fond transition hover:opacity-90"
            >
              Ajouter des questions Reading
            </Link>
            <Link
              href="/toeic/audio"
              className="rounded-lg border border-bord px-5 py-2.5 text-sm text-doux transition hover:border-accent hover:text-texte"
            >
              Ajouter des scripts Listening →
            </Link>
          </div>

          <p className="mt-5 border-t border-bord pt-4 text-xs leading-relaxed text-blanc">
            En attendant, les fiches de méthode par partie sont complètes et se travaillent sans
            aucune question : budget de temps, pièges par partie, gestes à prendre.{' '}
            <Link href="/toeic/cours" className="text-accent hover:underline">
              Cours et astuces →
            </Link>
          </p>
        </section>
      ) : (
       <>
      {/* Estimation Reading */}
      <section className="mb-8 rounded-xl border border-bord bg-carte px-5 py-4">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <span className="text-xs uppercase tracking-widest text-doux">Reading — estimation</span>
          <span className="text-xs text-doux">
            B2 ≈ {REPERES_TOEIC.b2} · exigence courante {REPERES_TOEIC.exigenceCourante}
          </span>
        </div>

        {estimation.nItems === 0 ? (
          <p className="mt-3 text-sm text-doux">
            Aucune question traitée. L’estimation apparaîtra dès {MINIMUM_ESTIMATION_TOEIC}{' '}
            questions.
          </p>
        ) : (
          <>
            <p className="mt-2">
              <span className="chiffres text-3xl font-semibold">{estimation.scoreSection}</span>
              <span className="text-base font-normal text-doux"> / 495 en Reading</span>
            </p>
            <p className="mt-1 text-sm text-doux">
              Intervalle {estimation.bas}–{estimation.haut} · {pourcent(estimation.tauxReussite)} de
              réussite sur {estimation.nItems} question{estimation.nItems > 1 ? 's' : ''}.
              {!estimation.fiable &&
                ` En dessous de ${MINIMUM_ESTIMATION_TOEIC} questions, l’intervalle est trop large pour décider.`}
            </p>
            <p className="mt-2 text-xs text-doux">
              Estimation : la conversion officielle d’ETS n’est pas publiée et change à chaque
              session.
            </p>
          </>
        )}
      </section>

      {totalReading === 0 && (
        <div className="mb-8 rounded-xl border border-bord bg-carte px-5 py-4 text-sm">
          <p className="font-medium">Aucune question TOEIC en banque.</p>
          <p className="mt-1 text-doux">
            <Link href="/import?exam=toeic_lr" className="text-accent hover:underline">
              Ouvrir l’atelier d’import →
            </Link>
          </p>
        </div>
      )}

      {/* Reading */}
      <section className="mb-10">
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="text-sm uppercase tracking-widest text-doux">
            Reading · {MINUTES_READING} min pour 100 questions
          </h2>
          <span className="text-xs text-doux">
            Budget de référence : Part 5 ≤ {BUDGET_READING_MINUTES.p5} min · Part 6 ≤{' '}
            {BUDGET_READING_MINUTES.p6} · Part 7 ≥ {BUDGET_READING_MINUTES.p7}
          </span>
        </div>

        <div className="space-y-3">
          {reading.map((p) => (
            <div
              key={p.id}
              className="flex flex-wrap items-center gap-4 rounded-xl border border-bord bg-carte px-5 py-4"
            >
              <span className="chiffres w-6 text-sm text-doux">{p.numero}</span>

              <div className="min-w-48 flex-1">
                <p className="font-medium">{p.libelle}</p>
                <p className="text-xs text-doux">
                  {p.questions} questions à l’examen · budget {BUDGET_READING_MINUTES[p.id]} min
                </p>
              </div>

              <span className="chiffres min-w-28 text-right text-sm text-doux">
                {p.nbItems} question{p.nbItems > 1 ? 's' : ''}
              </span>

              <span className="chiffres min-w-16 text-right text-sm">
                {p.tauxReussite !== null ? (
                  <span className={p.tauxReussite >= 0.7 ? 'text-juste' : 'text-faux'}>
                    {pourcent(p.tauxReussite)}
                  </span>
                ) : (
                  <span className="text-doux">—</span>
                )}
              </span>

              {p.nbItems > 0 ? (
                <Link
                  href={`/toeic/reading?part=${p.id}`}
                  className="rounded-lg bg-accent px-3.5 py-2 text-sm font-medium text-fond transition hover:opacity-90"
                >
                  S’entraîner
                </Link>
              ) : (
                <Link
                  href={`/import?exam=toeic_lr&section=${p.id}`}
                  className="rounded-lg border border-bord px-3.5 py-2 text-sm text-doux transition hover:text-texte"
                >
                  Importer
                </Link>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Vocabulaire */}
      <section className="mb-10">
        <h2 className="mb-3 text-sm uppercase tracking-widest text-doux">Vocabulaire</h2>

        <Link
          href="/toeic/vocabulaire"
          className="block rounded-xl border border-bord bg-carte px-5 py-4 transition hover:border-accent"
        >
          <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1 text-sm">
            <span>
              <span className="chiffres text-2xl font-semibold">{vocab.dues}</span>
              <span className="text-doux"> à réviser</span>
            </span>
            <span className="text-doux">
              <span className="chiffres text-texte">{vocab.total}</span> carte
              {vocab.total > 1 ? 's' : ''} au total
            </span>
            {vocab.incompletes > 0 && (
              <span className="text-blanc">
                <span className="chiffres">{vocab.incompletes}</span> sans définition
              </span>
            )}
          </div>
          <p className="mt-2 text-sm text-doux">
            Alimenté par tes erreurs, jamais par une liste. Le vocabulaire est le levier n°1 en
            Reading — et une liste générique fait réviser ce que tu sais déjà.
          </p>
        </Link>
      </section>

      {/* Writing */}
      <section className="mb-10">
        <h2 className="mb-3 text-sm uppercase tracking-widest text-doux">
          Speaking &amp; Writing
        </h2>
        <Link
          href="/toeic/writing"
          className="block rounded-xl border border-bord bg-carte px-5 py-4 transition hover:border-accent"
        >
          <p className="font-medium">Writing</p>
          <p className="mt-2 text-sm leading-relaxed text-doux">
            Examen distinct du Listening &amp; Reading : autre inscription, autre session, et la
            plupart des écoles françaises n’exigent que le L&amp;R. À ne travailler que si tu le
            passes vraiment.
          </p>
        </Link>
      </section>

      {/* Listening */}
      <section>
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="text-sm uppercase tracking-widest text-doux">Listening</h2>
          <Link href="/toeic/audio" className="text-sm text-accent hover:underline">
            Atelier audio →
          </Link>
        </div>

        {audio.moteurServeur.raisonIndisponibilite !== null ? (
          <div className="rounded-xl border border-bord bg-carte px-5 py-4">
            <p className="text-sm text-faux">Aucun moteur de synthèse configuré.</p>
            <p className="mt-1 text-sm text-doux">
              {audio.moteurServeur.raisonIndisponibilite}. Le Listening reste bloqué tant qu’aucune
              voix n’est disponible : lire un transcript n’entraîne pas la compétence testée.
            </p>
          </div>
        ) : (
          <>
            {audio.accentsNonCouverts.length > 0 && (
              <p className="mb-3 rounded-lg border border-bord bg-carte px-4 py-3 text-xs text-blanc">
                Accents non couverts :{' '}
                {audio.accentsNonCouverts.map((a) => LIBELLE_ACCENT[a]).join(' et ')} — ces voix
                n’existent pas dans le catalogue Piper. Le module en entraîne{' '}
                {audio.accentsDisponibles.length} sur 4.
              </p>
            )}

            <div className="space-y-3">
              {listening.map((p) => (
                <div
                  key={p.id}
                  className="flex flex-wrap items-center gap-4 rounded-xl border border-bord bg-carte px-5 py-4"
                >
                  <span className="chiffres w-6 text-sm text-doux">{p.numero}</span>

                  <div className="min-w-48 flex-1">
                    <p className="font-medium">{p.libelle}</p>
                    <p className="text-xs text-doux">{p.questions} questions à l’examen</p>
                  </div>

                  <span className="chiffres min-w-28 text-right text-sm text-doux">
                    {p.nbItems} question{p.nbItems > 1 ? 's' : ''}
                  </span>

                  <span className="chiffres min-w-16 text-right text-sm">
                    {p.tauxReussite !== null ? (
                      <span className={p.tauxReussite >= 0.7 ? 'text-juste' : 'text-faux'}>
                        {pourcent(p.tauxReussite)}
                      </span>
                    ) : (
                      <span className="text-doux">—</span>
                    )}
                  </span>

                  {p.nbItems > 0 ? (
                    <Link
                      href={`/toeic/listening?part=${p.id}`}
                      className="rounded-lg bg-accent px-3.5 py-2 text-sm font-medium text-fond transition hover:opacity-90"
                    >
                      Écouter
                    </Link>
                  ) : (
                    <Link
                      href="/toeic/audio"
                      className="rounded-lg border border-bord px-3.5 py-2 text-sm text-doux transition hover:text-texte"
                    >
                      Importer
                    </Link>
                  )}
                </div>
              ))}
            </div>

            {synthese.enAttente > 0 && (
              <p className="mt-3 text-sm text-blanc">
                {synthese.enAttente} enregistrement{synthese.enAttente > 1 ? 's' : ''} sans audio :
                leurs questions sont écartées des séries tant qu’ils ne sont pas synthétisés.
              </p>
            )}

            {/* Réussite par accent : une faiblesse sur un seul accent est un
                diagnostic actionnable qu'aucun outil ne donne. */}
            {accents.some((a) => a.n > 0) && (
              <div className="mt-4 rounded-xl border border-bord bg-carte px-5 py-4">
                <p className="text-xs uppercase tracking-widest text-doux">Réussite par accent</p>
                <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm">
                  {accents.map((a) => (
                    <span key={a.accent} className="text-doux">
                      {a.libelle}{' '}
                      <span className="chiffres text-texte">
                        {a.tauxReussite === null ? '—' : pourcent(a.tauxReussite)}
                      </span>
                      <span className="chiffres ml-1 text-xs opacity-60">n={a.n}</span>
                    </span>
                  ))}
                </div>
                {faible && (
                  <p className="mt-2 text-sm text-faux">
                    Ta réussite décroche nettement sur l’accent {faible.libelle}. C’est un problème
                    de perception, pas de compréhension : il se travaille par exposition ciblée.
                  </p>
                )}
              </div>
            )}

            {preparation.n > 0 && (
              <div className="mt-3 rounded-xl border border-bord bg-carte px-5 py-4 text-sm">
                <p className="text-doux">
                  Temps de préparation utilisé sur{' '}
                  <span className="chiffres text-texte">
                    {preparation.tauxUtilisation === null
                      ? '—'
                      : pourcent(preparation.tauxUtilisation)}
                  </span>{' '}
                  des enregistrements
                  {preparation.secondesMoyennes !== null &&
                    ` · ${preparation.secondesMoyennes} s en moyenne`}
                </p>
                {preparation.tauxUtilisation !== null && preparation.tauxUtilisation < 0.5 && (
                  <p className="mt-1 text-blanc">
                    Tu lances l’audio sans lire les questions plus d’une fois sur deux. C’est
                    précisément ce que les Part 3 et 4 testent : savoir ce qu’on cherche avant
                    d’écouter.
                  </p>
                )}
              </div>
            )}
          </>
        )}
      </section>

      </>
      )}
    </main>
  )
}
