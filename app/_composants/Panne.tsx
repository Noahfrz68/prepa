'use client'

import { useState } from 'react'

export interface EtatPanne {
  message: string
  /** Rejoue exactement l'envoi qui a échoué, sans rien redemander. */
  rejouer: () => void
}

/**
 * Bandeau d'échec d'envoi, avec reprise.
 *
 * Ce qui se passait avant : le serveur ne répondait pas une seconde, l'erreur
 * remontait brute jusqu'à l'écran rouge de Next.js, et la série était perdue.
 * Ce qui compte ici n'est donc pas le message — c'est que la réponse soit
 * TOUJOURS en mémoire et qu'un bouton suffise à la renvoyer.
 */
export default function Panne({ etat }: { etat: EtatPanne }) {
  const [enCours, setEnCours] = useState(false)

  return (
    <div className="mt-6 rounded-xl border border-faux bg-carte px-5 py-4">
      <p className="text-sm font-medium text-faux">Ta réponse n’a pas pu être enregistrée</p>
      <p className="mt-1 text-sm leading-relaxed text-doux">{etat.message}</p>
      <p className="mt-2 text-sm leading-relaxed text-doux">
        Rien n’est perdu : elle est gardée ici. Relance ton serveur si besoin, puis réessaie —
        la série reprendra où elle en est.
      </p>

      <button
        onClick={() => {
          setEnCours(true)
          etat.rejouer()
          // Le bandeau disparaît si l'envoi passe ; sinon il revient avec le
          // message à jour. On relâche donc le bouton après un court délai.
          setTimeout(() => setEnCours(false), 1500)
        }}
        disabled={enCours}
        className="mt-3 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-fond transition hover:opacity-90 disabled:opacity-50"
      >
        {enCours ? 'Nouvel essai…' : 'Réessayer'}
      </button>
    </div>
  )
}
