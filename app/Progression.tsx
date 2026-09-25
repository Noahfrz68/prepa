import type { ScoreHistorique } from '@/core/db/arbitrage'

/**
 * La courbe des épreuves passées, en une ligne.
 *
 * L'accueil disait où l'on en est et quoi faire cette semaine, jamais d'où l'on
 * vient. C'est pourtant la progression qui fait revenir — et sur une
 * préparation de plusieurs mois, un score isolé ne dit rien : 136 sur 600 est
 * décourageant seul, encourageant après 110.
 *
 * Deux épreuves au minimum, sans quoi il n'y a pas de progression à montrer —
 * seulement un point, et un point ne se lit pas.
 */
export default function Progression({
  historique,
  maximum,
}: {
  historique: ScoreHistorique[]
  maximum: number
}) {
  if (historique.length < 2) return null

  const scores = historique.map((h) => h.score)
  const dernier = scores[scores.length - 1]
  const precedent = scores[scores.length - 2]
  const ecart = dernier - precedent

  // L'échelle part du plus bas score observé, pas de zéro : sur une plage de
  // 0 à 600, un gain de quinze points serait invisible.
  const bas = Math.min(...scores)
  const haut = Math.max(...scores)
  const amplitude = Math.max(haut - bas, 1)

  return (
    <div className="mt-4 border-t border-bord pt-3">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-xs uppercase tracking-widest text-doux">
          {historique.length} dernières épreuves
        </span>
        <span className="text-xs text-doux">
          {ecart === 0 ? (
            'stable'
          ) : (
            <span className={ecart > 0 ? 'text-juste' : 'text-faux'}>
              {ecart > 0 ? '+' : '−'}
              <span className="chiffres">{Math.abs(ecart)}</span> depuis la précédente
            </span>
          )}
        </span>
      </div>

      <div className="mt-2 flex items-end gap-1.5" aria-hidden>
        {scores.map((s, i) => (
          <div
            key={i}
            className={`flex-1 rounded-sm ${i === scores.length - 1 ? 'bg-accent' : 'bg-bord'}`}
            style={{ height: `${8 + ((s - bas) / amplitude) * 22}px` }}
          />
        ))}
      </div>

      <p className="chiffres mt-2 text-xs text-doux">
        {scores.join(' → ')} <span className="text-blanc">/ {maximum}</span>
      </p>
    </div>
  )
}
