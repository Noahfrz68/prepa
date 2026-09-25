import { LIBELLE_DIFFICULTE, type DifficulteObservee } from '@/core/stats/difficulte'

/**
 * La difficulté observée d'une question, en une étiquette.
 *
 * Tant que la question a peu de réponses, l'estimation reste proche du taux de
 * son type : l'étiquette le dit (« indicatif ») plutôt que d'afficher une
 * certitude tirée d'une seule réponse.
 */
export default function Difficulte({ d }: { d: DifficulteObservee | null | undefined }) {
  if (!d) return null
  return (
    <span
      title={`Réussie ${d.justes} fois sur ${d.n}, estimée à ${Math.round(d.reussiteEstimee * 100)} % en tenant compte de ton taux sur ce type de question.`}
    >
      difficulté {LIBELLE_DIFFICULTE[d.niveau]}
      {!d.fiable && <span className="opacity-60"> (indicatif)</span>}
    </span>
  )
}
