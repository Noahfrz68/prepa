'use client'

import { useEffect } from 'react'

/** Au-delà, l'onglet est resté ouvert sans lecture. */
const PLAFOND_MS = 30 * 60 * 1000
/** En deçà, on a seulement traversé la page. */
const PLANCHER_MS = 5 * 1000

/**
 * Chronomètre invisible de la lecture des corrections.
 *
 * Il ne compte que le temps où la page est VISIBLE : un onglet en arrière-plan
 * ne lit rien. Le temps part au serveur quand on quitte la page, par
 * `sendBeacon`, le seul envoi qui survit à la fermeture d'un onglet.
 */
export default function TempsCorrection({ sessionId }: { sessionId: number | null }) {
  useEffect(() => {
    if (sessionId === null) return
    let cumul = 0
    let depuis: number | null = document.visibilityState === 'visible' ? Date.now() : null
    let envoye = false

    const arreter = () => {
      if (depuis !== null) cumul += Date.now() - depuis
      depuis = null
    }
    const envoyer = () => {
      arreter()
      if (envoye || cumul < PLANCHER_MS) return
      envoye = true
      const corps = JSON.stringify({ action: 'correction', sessionId, ms: Math.min(cumul, PLAFOND_MS) })
      navigator.sendBeacon?.('/api/session', new Blob([corps], { type: 'application/json' }))
    }
    const visibilite = () => {
      if (document.visibilityState === 'visible') depuis = Date.now()
      else arreter()
    }

    document.addEventListener('visibilitychange', visibilite)
    window.addEventListener('pagehide', envoyer)
    return () => {
      document.removeEventListener('visibilitychange', visibilite)
      window.removeEventListener('pagehide', envoyer)
      // Navigation interne (lien de l'app) : le composant se démonte sans pagehide.
      envoyer()
    }
  }, [sessionId])

  return null
}
