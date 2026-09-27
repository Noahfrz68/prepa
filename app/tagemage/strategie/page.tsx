import Link from 'next/link'
import { reussiteAFroidParSection, syntheseStrategie } from '@/core/stats/queries'
import { RENCONTRES_HABITUDE, tauxAFroid, type ReussiteAFroid } from '@/core/stats/afroid'
import {
  LIBELLE_NIVEAU,
  REUSSITE_ATTENDUE,
  SEUIL_FIABILITE,
  SEUIL_PUITS,
  type Niveau,
} from '@/core/stats/calculs'
import { HASARD } from '@/core/scoring/tagemage'
import { SECTIONS_PAR_ID } from '@/exams/tagemage'
import { decimal } from '@/app/_composants/nombres'

export const dynamic = 'force-dynamic'

const pourcent = (x: number) => `${Math.round(x * 100)} %`
const secondes = (ms: number) => `${Math.round(ms / 1000)} s`

export default function PageStrategie() {
  const s = syntheseStrategie('tagemage')
  const froid = reussiteAFroidParSection('tagemage')

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <Link href="/tagemage" className="text-sm text-doux hover:text-texte">
        ← TAGE MAGE
      </Link>

      <header className="mt-6 mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Stratégie de score</h1>
        <p className="mt-1 text-sm text-doux">
          Calculé sur tes {s.nTentatives} tentative{s.nTentatives > 1 ? 's' : ''}. Aucune de ces
          valeurs n’est estimée ni générée : elles sortent toutes de tes réponses. La réussite y
          compte les sauts comme des questions ratées, comme partout ailleurs — sauf la
          calibration, où un saut ne déclare aucune confiance.
        </p>
      </header>

      {s.nTentatives === 0 ? (
        <Vide />
      ) : (
        <div className="space-y-10">
          <Calibration s={s} />
          <RegleRemplissage s={s} />
          <PuitsDeTemps s={s} />
          <Leviers s={s} froid={tauxAFroid(froid)} />
          <AFroid lignes={froid} />
          <Competences s={s} />
        </div>
      )}
    </main>
  )
}

function Vide() {
  return (
    <div className="rounded-xl border border-bord bg-carte px-5 py-6">
      <p className="font-medium">Rien à mesurer pour l’instant.</p>
      <p className="mt-2 text-sm leading-relaxed text-doux">
        Cet écran ne devient utile qu’à partir d’une trentaine de tentatives par niveau de
        confiance. C’est le seuil en dessous duquel un taux de réussite ne veut rien dire.
      </p>
      <Link
        href="/tagemage"
        className="mt-4 inline-block rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-fond hover:opacity-90"
      >
        Lancer une série
      </Link>
    </div>
  )
}

/* ------------------------------------------------------------ outils -- */

const ecartLisible = (x: number) =>
  `${x > 0 ? '+' : x < 0 ? '−' : ''}${Math.abs(Math.round(x * 100))} pts`

/**
 * Rouge pour ce qui coûte : la surconfiance en haut de l'échelle, la
 * sous-confiance en bas. Moins de 5 points d'écart, c'est du bruit.
 */
function couleurEcart(c: { n: number; niveau: number; tauxReussite: number }): string {
  if (c.n === 0) return ''
  const e = c.tauxReussite - REUSSITE_ATTENDUE[c.niveau as Niveau]
  if (Math.abs(e) < 0.05) return 'text-juste'
  return (c.niveau >= 3 ? e < 0 : e > 0) ? 'text-faux' : 'text-blanc'
}

/* ---------------------------------------------------------- sections -- */

function Calibration({ s }: { s: ReturnType<typeof syntheseStrategie> }) {
  const d = s.diagnostic

  const message: Record<typeof d.diagnostic, string> = {
    surconfiance: `Quand tu te dis sûr, tu réussis ${pourcent(
      Math.abs(d.ecartHaut),
    )} de moins que ce que cette certitude annonce. Tu t’attardes donc sur des questions que tu crois tenir et que tu perds : c’est du temps, plus que des points.`,
    sousconfiance: `Quand tu hésites, tu réussis ${pourcent(
      d.ecartBas,
    )} de plus que tu ne le crois. Tu perds du temps à vérifier ce que tu sais déjà, et tu expédies des questions que tu aurais eues.`,
    correcte:
      'Ta confiance déclarée correspond à ta réussite réelle, en haut comme en bas de l’échelle. C’est ce qui rend fiable l’arbitrage du temps : chercher, ou cocher et passer.',
    donnees_insuffisantes: `Moins de ${SEUIL_FIABILITE} tentatives sur le haut ou le bas de l’échelle : aucun diagnostic n’est possible pour l’instant.`,
  }

  const couleur =
    d.diagnostic === 'surconfiance'
      ? 'text-faux'
      : d.diagnostic === 'sousconfiance'
        ? 'text-blanc'
        : d.diagnostic === 'correcte'
          ? 'text-juste'
          : 'text-doux'

  return (
    <section>
      <h2 className="mb-3 text-sm uppercase tracking-widest text-doux">Calibration</h2>

      {/*
        La conclusion avant le calcul.

        L'écran ouvrait sur « p × 4 − (1 − p) × 1 », et servait ainsi une formule
        à quelqu'un venu chercher une consigne. Le contenu était bon, l'ordre
        inversé : d'abord ce qu'il faut faire, ensuite les chiffres qui le
        fondent, et le calcul en dernier pour qui veut vérifier.
      */}
      <div className="rounded-xl border border-bord bg-carte px-5 py-4">
        <p className="text-base leading-relaxed">
          Ne rends <span className="text-accent">jamais</span> une case vide : une erreur ne coûte plus rien.
        </p>
        <p className={`mt-2 text-sm leading-relaxed ${couleur}`}>{message[d.diagnostic]}</p>
      </div>

      <p className="mb-3 mt-6 text-xs uppercase tracking-widest text-doux">
        Le détail, niveau par niveau
      </p>

      <div className="overflow-x-auto rounded-xl border border-bord bg-carte">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-bord text-left text-xs uppercase tracking-wider text-doux">
              <th className="px-4 py-3 font-normal">Confiance</th>
              <th className="px-4 py-3 text-right font-normal">Tentatives</th>
              <th className="px-4 py-3 text-right font-normal">Réussite</th>
              <th className="px-4 py-3 text-right font-normal">Attendu</th>
              <th className="px-4 py-3 text-right font-normal">Écart</th>
            </tr>
          </thead>
          <tbody>
            {s.calibration.map((c) => (
              <tr key={c.niveau} className="border-b border-bord last:border-0">
                <td className="px-4 py-3">
                  <span className="kbd mr-2">{c.niveau}</span>
                  {LIBELLE_NIVEAU[c.niveau]}
                </td>
                <td className="chiffres px-4 py-3 text-right">
                  {c.n}
                  {!c.fiable && c.n > 0 && (
                    <span className="ml-1 text-xs text-blanc" title={`Moins de ${SEUIL_FIABILITE}`}>
                      ⚠
                    </span>
                  )}
                </td>
                <td className="chiffres px-4 py-3 text-right">
                  {c.n === 0 ? '—' : pourcent(c.tauxReussite)}
                </td>
                <td className="chiffres px-4 py-3 text-right text-doux">
                  {pourcent(REUSSITE_ATTENDUE[c.niveau as Niveau])}
                </td>
                <td className={`chiffres px-4 py-3 text-right ${couleurEcart(c)}`}>
                  {c.n === 0
                    ? '—'
                    : ecartLisible(c.tauxReussite - REUSSITE_ATTENDUE[c.niveau as Niveau])}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {s.calibration.some((c) => c.n > 0 && !c.fiable) && (
        <p className="mt-3 text-xs text-blanc">
          ⚠ Les niveaux marqués comptent moins de {SEUIL_FIABILITE} tentatives : leur écart est
          indicatif, pas exploitable.
        </p>
      )}

      {s.calibration.some((c) => c.verdict === 'cocher_et_passer') && (
        <p className="mt-3 text-sm text-blanc">
          Au niveau{' '}
          {s.calibration
            .filter((c) => c.verdict === 'cocher_et_passer')
            .map((c) => `« ${LIBELLE_NIVEAU[c.niveau]} »`)
            .join(' et ')}
          , tu ne fais pas mieux que le hasard : chercher n’y rapporte rien de plus que cocher.
          Coche et passe, le temps servira ailleurs.
        </p>
      )}

      <details className="mt-3 text-sm text-doux">
        <summary className="cursor-pointer text-xs uppercase tracking-widest hover:text-texte">
          Comment c’est calculé
        </summary>
        <p className="mt-2 leading-relaxed">
          La colonne « attendu » est le taux qu’un candidat bien calibré obtiendrait à ce niveau ;
          l’écart est ta réussite moins ce taux. Un écart négatif sur « assez sûr » ou « certain »
          est de la surconfiance, un écart positif sur « au hasard » ou « hésitant » de la
          sous-confiance. Depuis la suppression de la pénalité, répondre rapporte toujours, même
          au pur hasard ({pourcent(HASARD)} de chances, soit 0,8 point en moyenne) : la seule
          question qui reste est celle du TEMPS — à un niveau où tu ne fais pas mieux que le
          hasard, chercher ne rapporte rien de plus que cocher.
        </p>
      </details>
    </section>
  )
}

function RegleRemplissage({ s }: { s: ReturnType<typeof syntheseStrategie> }) {
  const r = s.regle

  return (
    <section>
      <h2 className="mb-1 text-sm uppercase tracking-widest text-doux">Règle du remplissage</h2>
      <p className="mb-4 text-sm text-doux">
        Ne rends jamais une case vide. Aucune exception, aucun niveau de doute.
      </p>

      <div className="rounded-xl border border-bord bg-carte px-5 py-4">
        {r.blanches === 0 ? (
          <p className="text-sm text-juste">
            Tu n’as laissé aucune case vide sur tes {r.total} question
            {r.total > 1 ? 's' : ''}. C’est exactement ce qu’il faut faire.
          </p>
        ) : (
          <>
            <p className="text-sm">
              <span className="chiffres text-lg font-semibold">{r.blanches}</span> case
              {r.blanches > 1 ? 's' : ''} laissée{r.blanches > 1 ? 's' : ''} vide
              {r.blanches > 1 ? 's' : ''} sur {r.total} ({pourcent(r.tauxBlanches)}).
            </p>
            <p className="mt-2 text-sm text-faux">
              Environ {decimal(r.coutEstime)} point{r.coutEstime >= 2 ? 's' : ''} brut
              {r.coutEstime >= 2 ? 's' : ''} jeté{r.coutEstime >= 2 ? 's' : ''} : une croix au
              hasard en rapporte 0,8 en moyenne, une case vide en rapporte 0.
            </p>
          </>
        )}

        <p className="mt-3 border-t border-bord pt-3 text-xs leading-relaxed text-doux">
          Une mauvaise réponse ne coûte plus rien depuis la suppression de la pénalité. Sauter
          garde son sens à l’entraînement — c’est ainsi que ton carnet d’erreurs se remplit — mais
          le jour de l’épreuve, une question sautée doit quand même recevoir une croix avant que
          le temps ne tombe.
        </p>
      </div>
    </section>
  )
}

function PuitsDeTemps({ s }: { s: ReturnType<typeof syntheseStrategie> }) {
  return (
    <section>
      <h2 className="mb-1 text-sm uppercase tracking-widest text-doux">Questions à expédier</h2>
      <p className="mb-4 text-sm text-doux">
        Les types de questions à la fois lents et peu réussis : plus de ×1,3 le temps médian de
        leur sous-test, moins de 50 % de réussite, sur au moins {SEUIL_PUITS} réponses. Ce ne
        sont pas des choses à travailler : coche au jugé et passe — le temps récupéré vaut plus
        que le point espéré.
      </p>

      {s.puits.length === 0 ? (
        <p className="rounded-xl border border-bord bg-carte px-5 py-4 text-sm text-doux">
          Aucun type de question à expédier pour l’instant. Un tel conseil ne se donne pas sur
          quelques réponses : il en faut au moins {SEUIL_PUITS} sur un même type.
        </p>
      ) : (
        <ul className="space-y-2">
          {s.puits.map((c) => (
            <li
              key={c.skillId}
              className="flex flex-wrap items-center gap-x-5 gap-y-1 rounded-xl border border-bord bg-carte px-5 py-3 text-sm"
            >
              <span className="flex-1 font-medium">{c.libelle}</span>
              <span className="chiffres text-faux">{pourcent(c.tauxReussite)}</span>
              <span className="chiffres text-blanc">
                {secondes(c.tempsMedianMs)} · ×{decimal(c.ratioTemps)} la médiane en{' '}
                {SECTIONS_PAR_ID.get(c.section as never)?.libelle.toLowerCase() ?? c.section}
              </span>
              <span className="chiffres text-doux">{c.n} tentatives</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

/** Points perdus sur 15 questions, à un taux de réussite donné (barème +4 / 0 / 0). */
const pertesSur15 = (taux: number) => 15 * 4 * (1 - taux)

function Leviers({
  s,
  froid,
}: {
  s: ReturnType<typeof syntheseStrategie>
  froid: Map<string, { taux: number; n: number }>
}) {
  // Classés par la perte à froid quand elle est mesurée : c'est elle que
  // l'épreuve fera payer, sur des scénarios que tu n'auras jamais vus.
  const leviers = [...s.leviers].sort(
    (a, b) =>
      (froid.has(b.section) ? pertesSur15(froid.get(b.section)!.taux) : b.pointsPerdus) -
      (froid.has(a.section) ? pertesSur15(froid.get(a.section)!.taux) : a.pointsPerdus),
  )
  return (
    <section>
      <h2 className="mb-1 text-sm uppercase tracking-widest text-doux">
        Où tu perds tes points
      </h2>
      <p className="mb-4 text-sm text-doux">
        Points perdus sur un sous-test de 15 questions : à ta réussite globale, et à froid — sur des
        scénarios jamais vus, comme le jour de l’épreuve — quand elle est mesurée. Le classement suit
        la perte à froid : c’est elle que l’épreuve fera payer. À l’épreuve, chaque sous-test pèse
        autant, quel que soit le temps que tu y as passé à l’entraînement.
      </p>

      <div className="space-y-2">
        {leviers.map((l) => (
          <div key={l.section} className="rounded-xl border border-bord bg-carte px-5 py-4">
            <div className="flex flex-wrap items-baseline gap-x-5 gap-y-1 text-sm">
              <span className="chiffres w-4 text-doux">{l.numero}</span>
              <span className="flex-1 font-medium">{l.libelle}</span>
              <span className="chiffres text-faux">
                −{Math.round(l.pointsPerdus)} pts / 15 questions
              </span>
              <span className="chiffres text-doux">{pourcent(l.tauxReussite)} de réussite</span>
              <span className="chiffres text-doux">{l.n} vues</span>
            </div>
            {froid.has(l.section) && (
              <p className="mt-1 text-xs text-doux">
                À froid :{' '}
                <span className="chiffres text-faux">
                  −{Math.round(pertesSur15(froid.get(l.section)!.taux))} pts / 15 questions
                </span>{' '}
                ({pourcent(froid.get(l.section)!.taux)} sur {froid.get(l.section)!.n} scénarios jamais vus)
              </p>
            )}

            <div className="mt-2 h-1 w-full overflow-hidden rounded bg-carte-clair">
              <div className="h-full bg-faux" style={{ width: `${l.partDesPertes * 100}%` }} />
            </div>

            {l.recommandationBlanches.n > 0 && l.recommandationBlanches.expediees > 0 && (
              <p className="mt-3 text-xs text-doux">
                Sur 15 questions, tu en abordes environ{' '}
                <span className="text-blanc">{l.recommandationBlanches.expediees}</span> sans faire
                mieux que le hasard : coche-les d’un trait et garde le temps pour les autres.
                {!l.recommandationBlanches.fiable &&
                  ' Base encore trop mince pour en faire une consigne.'}
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}

function Competences({ s }: { s: ReturnType<typeof syntheseStrategie> }) {
  // Les types mesurés sur assez de réponses d'abord, par réussite croissante ;
  // les autres ensuite. Sans cet ordre, un type vu une fois et raté (0 %)
  // passait en tête, devant de vraies faiblesses mesurées vingt fois.
  const faibles = [
    ...s.competences.filter((c) => c.n >= SEUIL_PUITS),
    ...s.competences.filter((c) => c.n < SEUIL_PUITS).sort((a, b) => b.n - a.n),
  ].slice(0, 12)

  return (
    <section>
      <h2 className="mb-1 text-sm uppercase tracking-widest text-doux">Par type de question</h2>
      <p className="mb-4 text-sm text-doux">
        Temps médian, nombre de réponses et réussite. Les types mesurés sur au moins{' '}
        {SEUIL_PUITS} réponses viennent en premier, par réussite croissante ; ⚠ signale un taux
        calculé sur trop peu de réponses pour être pris au sérieux.
      </p>

      {faibles.length === 0 ? (
        <p className="rounded-xl border border-bord bg-carte px-5 py-4 text-sm text-doux">
          Aucune tentative sur une question taguée. Renseigne le type de question au moment de
          l’import pour alimenter cette vue.
        </p>
      ) : (
        <ul className="space-y-1.5">
          {faibles.map((c) => (
            <li
              key={c.skillId}
              className="flex items-center gap-4 rounded-lg border border-bord bg-carte px-4 py-2.5 text-sm"
            >
              <span className="flex-1">{c.libelle}</span>
              <span className="chiffres w-14 text-right text-doux">{secondes(c.tempsMedianMs)}</span>
              <span className="chiffres w-12 text-right">
                {c.n}
                {c.n < SEUIL_PUITS && (
                  <span className="ml-1 text-xs text-blanc" title={`Moins de ${SEUIL_PUITS} réponses`}>
                    ⚠
                  </span>
                )}
              </span>
              <span
                className={`chiffres w-14 text-right ${
                  c.n < SEUIL_PUITS
                    ? 'text-doux'
                    : c.tauxReussite < 0.5
                      ? 'text-faux'
                      : c.tauxReussite < 0.75
                        ? 'text-blanc'
                        : 'text-juste'
                }`}
              >
                {pourcent(c.tauxReussite)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

/** Moins de réponses que ça : taux non affiché. */
const MINIMUM_A_FROID = 10

function AFroid({ lignes }: { lignes: ReussiteAFroid[] }) {
  const ordre = new Map(SECTIONS_PAR_ID)
  const triees = [...lignes].sort(
    (a, b) => (ordre.get(a.section as never)?.numero ?? 0) - (ordre.get(b.section as never)?.numero ?? 0),
  )
  const taux = (c: { n: number; justes: number }) =>
    c.n < MINIMUM_A_FROID ? '—' : `${Math.round((c.justes / c.n) * 100)} %`
  return (
    <section>
      <h2 className="mb-1 text-sm uppercase tracking-widest text-doux">Réussite à froid</h2>
      <p className="mb-3 text-sm leading-relaxed text-doux">
        Le jour de l’épreuve, tout est nouveau. « À froid » : la première fois que tu rencontres un
        scénario (un texte en compréhension). « Avec l’habitude » : à partir de la{' '}
        {RENCONTRES_HABITUDE + 1}ᵉ rencontre du même scénario, avec d’autres nombres. L’écart mesure ce
        que la familiarité ajoute — c’est la réussite à froid qui prédit l’épreuve. En expression et en
        logique, la consigne est la même pour tout un type : la mesure n’y a pas de sens.
      </p>
      <div className="overflow-x-auto rounded-xl border border-bord bg-carte">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-bord text-left text-xs uppercase tracking-wider text-doux">
              <th className="px-4 py-3 font-normal">Sous-test</th>
              <th className="px-4 py-3 text-right font-normal">À froid</th>
              <th className="px-4 py-3 text-right font-normal">Avec l’habitude</th>
              <th className="px-4 py-3 text-right font-normal">Écart</th>
            </tr>
          </thead>
          <tbody>
            {triees.map((l) => {
              const f = l.froid.n >= MINIMUM_A_FROID ? l.froid.justes / l.froid.n : null
              const h = l.habitude.n >= MINIMUM_A_FROID ? l.habitude.justes / l.habitude.n : null
              return (
                <tr key={l.section} className="border-b border-bord last:border-0">
                  <td className="px-4 py-2.5">{SECTIONS_PAR_ID.get(l.section as never)?.libelle ?? l.section}</td>
                  <td className="chiffres px-4 py-2.5 text-right">
                    {taux(l.froid)} <span className="text-xs text-doux">({l.froid.n})</span>
                  </td>
                  <td className="chiffres px-4 py-2.5 text-right text-doux">
                    {taux(l.habitude)} <span className="text-xs">({l.habitude.n})</span>
                  </td>
                  <td className="chiffres px-4 py-2.5 text-right">
                    {f !== null && h !== null ? (
                      <span className={h - f > 0.15 ? 'text-blanc' : 'text-doux'}>
                        {h - f >= 0 ? '+' : '−'}
                        {Math.abs(Math.round((h - f) * 100))} pts
                      </span>
                    ) : (
                      <span className="text-doux">—</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-doux">
        Taux affiché à partir de {MINIMUM_A_FROID} réponses ; entre parenthèses, le nombre de réponses. Un
        écart de plus de 15 points signale une réussite qui tient surtout à l’habitude du scénario.
      </p>
    </section>
  )
}
