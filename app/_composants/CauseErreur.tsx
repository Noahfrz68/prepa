'use client'

import { useState } from 'react'
import { poster } from '@/app/_composants/reseau'
import { causesDe, LIBELLE_CAUSE, type CauseErreur } from '@/core/stats/causes'

/**
 * « Pourquoi je me suis trompé », en un clic, dans la correction elle-même.
 *
 * La cause ne se déclarait que depuis le carnet : une note sur 230 erreurs.
 * C'est juste après l'erreur, la correction sous les yeux, qu'on sait si l'on
 * a mal lu, mal calculé ou ignoré la méthode — une semaine plus tard, on ne
 * s'en souvient plus. La cause rejoint le carnet (regroupement par cause,
 * remède de la cause dominante).
 */
export default function ChoixCause({
  itemId,
  section,
  initiale = null,
}: {
  itemId: number
  section: string
  /** Cause déjà déclarée, pour ne pas afficher un choix vide qui mentirait. */
  initiale?: CauseErreur | null
}) {
  const [cause, setCause] = useState<CauseErreur | null>(initiale)
  const [echec, setEchec] = useState(false)

  const choisir = async (c: CauseErreur | null) => {
    const avant = cause
    setCause(c)
    setEchec(false)
    try {
      await poster('/api/carnet', { action: 'cause', itemId, cause: c })
    } catch {
      // Sans enregistrement, le choix affiché ne doit pas mentir.
      setCause(avant)
      setEchec(true)
    }
  }

  return (
    <div className="mt-3 border-t border-bord pt-2">
      <p className="text-xs text-doux">Pourquoi ? {echec && <span className="text-faux">Non enregistré, réessaie.</span>}</p>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {causesDe(section).map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => void choisir(cause === c ? null : c)}
            className={`rounded-full border px-2.5 py-1 text-xs transition ${
              cause === c ? 'border-accent text-accent' : 'border-bord text-doux hover:text-texte'
            }`}
          >
            {LIBELLE_CAUSE[c]}
          </button>
        ))}
      </div>
    </div>
  )
}
