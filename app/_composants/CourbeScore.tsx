import type { ScoreHistorique } from '@/core/db/scores'
import { descriptionComposition, LIBELLE_NATURE } from '@/core/stats/nature'

/**
 * La courbe du score dans le temps, chaque épreuve avec son intervalle à 95 %.
 *
 * Un score seul se lit comme une mesure exacte ; il ne l'est pas. Sur un
 * diagnostic de 40 questions, l'intervalle couvre près de ±70 points : deux
 * épreuves dont les moustaches se chevauchent largement ne disent pas encore
 * qu'on a progressé. La courbe montre donc la marge avec le point.
 *
 * Deux natures d'épreuve (core/stats/nature.ts) : sur annales, en points
 * pleins ; surtout des questions générées, en points creux. La ligne ne relie
 * que des épreuves de même nature — les relier ferait lire un progrès là où
 * la banque a changé. Une légende apparaît dès que les deux se côtoient.
 *
 * Choix de forme : une seule série par nature, légende seulement si besoin ;
 * axe du temps réel, pour qu'un trou de trois semaines se voie ; cible en
 * pointillé, en encre discrète ; seul le dernier point porte son étiquette.
 * Chaque point a une zone de survol large avec le détail, et un tableau des
 * valeurs est dépliable pour qui ne lit pas le graphique.
 */

/**
 * Largeur de dessin, en unités du viewBox. Le SVG est ensuite mis à la largeur
 * de son conteneur : dessiné pour 600 et affiché dans 360 px, son texte de 11
 * tombait à 6 px. On dessine donc à peu près à la taille d'affichage.
 */
const LARGEUR_DEFAUT = 600
const MARGE = { haut: 16, droite: 64, bas: 26, gauche: 36 }
/** Écart vertical minimal entre deux étiquettes de la marge droite (hauteur d’une ligne de 12 px). */
const ECART_ETIQUETTES = 17

const jourCourt = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
const jourLong = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })

export default function CourbeScore({
  points,
  cible,
  maximum = 600,
  hauteur = 200,
  compacte = false,
  largeurDessin = LARGEUR_DEFAUT,
}: {
  points: ScoreHistorique[]
  cible: number | null
  maximum?: number
  hauteur?: number
  /** Version d'accueil : sans tableau ni dates intermédiaires. */
  compacte?: boolean
  /** À régler sur la largeur d'affichage attendue, en pixels. */
  largeurDessin?: number
}) {
  const L = largeurDessin
  if (points.length < 2) return null

  const H = hauteur
  const largeur = L - MARGE.gauche - MARGE.droite
  const hauteurUtile = H - MARGE.haut - MARGE.bas

  // Échelle verticale : de quoi contenir intervalles et cible, arrondie à 50.
  const valeurs = points.flatMap((p) => [p.bas ?? p.score, p.haut ?? p.score])
  if (cible !== null) valeurs.push(cible)
  const yMin = Math.max(0, Math.floor((Math.min(...valeurs) - 10) / 50) * 50)
  const yMax = Math.min(maximum, Math.ceil((Math.max(...valeurs) + 10) / 50) * 50)
  const y = (v: number) => MARGE.haut + hauteurUtile * (1 - (v - yMin) / Math.max(1, yMax - yMin))
  const pas = yMax - yMin > 300 ? 100 : 50
  const graduations: number[] = []
  for (let v = yMin; v <= yMax; v += pas) graduations.push(v)

  // Échelle horizontale : le temps réel ; repli sur le rang si tout tombe le même jour.
  const t = points.map((p) => new Date(`${p.jour}T00:00:00`).getTime())
  const tMin = Math.min(...t)
  const tMax = Math.max(...t)
  const x = (i: number) =>
    MARGE.gauche +
    (tMax > tMin ? ((t[i] - tMin) / (tMax - tMin)) * largeur : (i / (points.length - 1)) * largeur)

  const dernier = points.length - 1

  // Étiquettes de la cible et du dernier point : toutes deux dans la marge de
  // droite. Trop proches, on les écarte d'une ligne dans le sens qui les sépare.
  let yEtiquetteCible = cible !== null ? y(cible) + 4 : 0
  let yEtiquetteDernier = y(points[dernier].score) + 4
  if (cible !== null && Math.abs(yEtiquetteCible - yEtiquetteDernier) < ECART_ETIQUETTES) {
    if (yEtiquetteDernier >= yEtiquetteCible) yEtiquetteDernier = yEtiquetteCible + ECART_ETIQUETTES
    else yEtiquetteCible = yEtiquetteDernier + ECART_ETIQUETTES
  }
  // Un tracé par nature : chaque point rejoint la précédente épreuve de même nature.
  const traces = (['annales', 'generees'] as const).map((nature) => ({
    nature,
    d: points
      .map((p, i) => ({ p, i }))
      .filter(({ p }) => p.nature === nature)
      .map(({ p, i }, k) => `${k === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(p.score).toFixed(1)}`)
      .join(' '),
  }))
  const mixte = new Set(points.map((p) => p.nature)).size > 1
  const datesAffichees = compacte || points.length > 8 ? [0, dernier] : points.map((_, i) => i)

  return (
    <figure className="m-0">
      <svg
        viewBox={`0 0 ${L} ${H}`}
        className="h-auto w-full overflow-visible"
        role="img"
        aria-label={`Score de ${points[0].score} à ${points[dernier].score} sur ${maximum}, en ${points.length} épreuves`}
      >
        {/* Grille horizontale, en retrait. */}
        {graduations.map((v) => (
          <g key={v}>
            <line x1={MARGE.gauche} x2={L - MARGE.droite} y1={y(v)} y2={y(v)} stroke="var(--bord)" strokeWidth={1} />
            <text x={MARGE.gauche - 8} y={y(v) + 4} textAnchor="end" fontSize={11} fill="var(--texte-doux)">
              {v}
            </text>
          </g>
        ))}

        {/* Cible. */}
        {cible !== null && cible >= yMin && cible <= yMax && (
          <g>
            <line
              x1={MARGE.gauche}
              x2={L - MARGE.droite}
              y1={y(cible)}
              y2={y(cible)}
              stroke="var(--texte-doux)"
              strokeWidth={1.5}
              strokeDasharray="5 4"
            />
            <text x={L - MARGE.droite + 6} y={yEtiquetteCible} fontSize={11} fill="var(--texte-doux)">
              cible {cible}
            </text>
          </g>
        )}

        {/* Intervalles à 95 %. */}
        {points.map((p, i) =>
          p.bas !== null && p.haut !== null ? (
            <g key={`i${p.sessionId}`} stroke="var(--serie)" strokeOpacity={0.45} strokeWidth={2} strokeLinecap="round">
              <line x1={x(i)} x2={x(i)} y1={y(p.haut)} y2={y(p.bas)} />
              <line x1={x(i) - 4} x2={x(i) + 4} y1={y(p.haut)} y2={y(p.haut)} />
              <line x1={x(i) - 4} x2={x(i) + 4} y1={y(p.bas)} y2={y(p.bas)} />
            </g>
          ) : null,
        )}

        {/* Ligne et points : anneau de la couleur du fond pour détacher le point de sa moustache. */}
        {traces.map((t) =>
          t.d.includes('L') ? (
            <path
              key={t.nature}
              d={t.d}
              fill="none"
              stroke="var(--serie)"
              strokeWidth={2}
              strokeLinejoin="round"
              strokeDasharray={t.nature === 'generees' ? '4 4' : undefined}
            />
          ) : null,
        )}
        {points.map((p, i) =>
          p.nature === 'annales' ? (
            <circle
              key={`p${p.sessionId}`}
              cx={x(i)}
              cy={y(p.score)}
              r={4.5}
              fill="var(--serie)"
              stroke="var(--fond-carte)"
              strokeWidth={2}
            />
          ) : (
            <circle
              key={`p${p.sessionId}`}
              cx={x(i)}
              cy={y(p.score)}
              r={4}
              fill="var(--fond-carte)"
              stroke="var(--serie)"
              strokeWidth={2}
            />
          ),
        )}

        {/* Étiquette du dernier point seulement. */}
        <text
          x={x(dernier) + 10}
          y={yEtiquetteDernier}
          fontSize={12}
          fontWeight={600}
          fill="var(--texte)"
        >
          {points[dernier].score}
        </text>

        {/* Dates. */}
        {datesAffichees.map((i) => (
          <text
            key={`d${points[i].sessionId}`}
            x={x(i)}
            y={H - 6}
            textAnchor={i === 0 ? 'start' : i === dernier ? 'end' : 'middle'}
            fontSize={11}
            fill="var(--texte-doux)"
          >
            {jourCourt(points[i].jour)}
          </text>
        ))}

        {/* Zones de survol, plus larges que les points. */}
        {points.map((p, i) => (
          <circle key={`h${p.sessionId}`} cx={x(i)} cy={y(p.score)} r={14} fill="transparent">
            <title>
              {`${jourLong(p.jour)} · ${p.type === 'blanc' ? 'Blanc' : 'Diagnostic'} · ${p.score} / ${maximum}` +
                (p.bas !== null ? ` (intervalle ${p.bas}–${p.haut})` : '') +
                ` · ${descriptionComposition(p.partAnnales)}`}
            </title>
          </circle>
        ))}
      </svg>

      {mixte && (
        <figcaption className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-doux">
          <span className="inline-flex items-center gap-1.5">
            <svg width="10" height="10" aria-hidden="true">
              <circle cx="5" cy="5" r="4" fill="var(--serie)" />
            </svg>
            {LIBELLE_NATURE.annales}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <svg width="10" height="10" aria-hidden="true">
              <circle cx="5" cy="5" r="3.5" fill="none" stroke="var(--serie)" strokeWidth="1.5" />
            </svg>
            {LIBELLE_NATURE.generees}
          </span>
          <span>— deux natures ne se comparent pas entre elles.</span>
        </figcaption>
      )}

      {!compacte && (
        <details className="mt-2 text-xs text-doux">
          <summary className="cursor-pointer hover:text-texte">Voir les valeurs</summary>
          <table className="mt-2 w-full">
            <thead>
              <tr className="text-left">
                <th className="py-1 font-normal">Date</th>
                <th className="py-1 font-normal">Épreuve</th>
                <th className="py-1 text-right font-normal">Score</th>
                <th className="py-1 text-right font-normal">Intervalle à 95 %</th>
                <th className="py-1 text-right font-normal">Annales</th>
              </tr>
            </thead>
            <tbody>
              {points.map((p) => (
                <tr key={p.sessionId} className="border-t border-bord">
                  <td className="py-1">{jourLong(p.jour)}</td>
                  <td className="py-1">{p.type === 'blanc' ? 'Blanc complet' : 'Diagnostic'}</td>
                  <td className="chiffres py-1 text-right text-texte">{p.score}</td>
                  <td className="chiffres py-1 text-right">
                    {p.bas !== null ? `${p.bas} – ${p.haut}` : '—'}
                  </td>
                  <td className="chiffres py-1 text-right">{Math.round(p.partAnnales * 100)} %</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      )}
    </figure>
  )
}
