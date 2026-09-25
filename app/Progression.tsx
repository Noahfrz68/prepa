import type { ScoreHistorique } from '@/core/db/arbitrage'
import CourbeScore from '@/app/_composants/CourbeScore'

/**
 * La courbe des épreuves passées, en compact.
 *
 * L'accueil disait où l'on en est et quoi faire cette semaine, jamais d'où l'on
 * vient. C'est pourtant la progression qui fait revenir — et sur une
 * préparation de plusieurs mois, un score isolé ne dit rien : 136 sur 600 est
 * décourageant seul, encourageant après 110.
 *
 * Chaque point porte son intervalle à 95 % : sans lui, un écart de trente
 * points entre deux diagnostics de 40 questions se lisait comme un progrès
 * alors qu'il tient dans la marge d'erreur.
 *
 * Deux épreuves au minimum, sans quoi il n'y a pas de progression à montrer —
 * seulement un point, et un point ne se lit pas.
 */
export default function Progression({
  historique,
  maximum,
  cible = null,
}: {
  historique: ScoreHistorique[]
  maximum: number
  cible?: number | null
}) {
  if (historique.length < 2) return null

  const dernier = historique[historique.length - 1]
  const precedent = historique[historique.length - 2]
  const ecart = dernier.score - precedent.score
  // Écart plus petit que la demi-largeur des deux intervalles : on le dit.
  const dansLaMarge =
    dernier.bas !== null &&
    precedent.haut !== null &&
    dernier.bas <= precedent.haut &&
    precedent.bas !== null &&
    dernier.haut !== null &&
    precedent.bas <= dernier.haut &&
    Math.abs(ecart) < Math.min(dernier.score - dernier.bas, precedent.haut - precedent.score)

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
            <span className={dansLaMarge ? 'text-doux' : ecart > 0 ? 'text-juste' : 'text-faux'}>
              {ecart > 0 ? '+' : '−'}
              <span className="chiffres">{Math.abs(ecart)}</span> depuis la précédente
              {dansLaMarge && ' · dans la marge d’erreur'}
            </span>
          )}
        </span>
      </div>

      <div className="mt-2">
        <CourbeScore
          points={historique}
          cible={cible}
          maximum={maximum}
          hauteur={140}
          largeurDessin={360}
          compacte
        />
      </div>
    </div>
  )
}
