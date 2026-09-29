'use client'

import { useEffect, useRef, useState } from 'react'

const BASE = process.env.NEXT_PUBLIC_CHEMIN_BASE ?? ''
const CLE_CONSEIL = 'prepa:conseil-installation-vu'

/**
 * Installation et mises à jour de la version iPhone.
 *
 *   — enregistre le service worker (scripts/sw.modele.js), qui garde tout le
 *     site en cache : l'app s'ouvre ensuite sans réseau ;
 *   — quand une nouvelle version est prête, le propose au lieu de l'imposer :
 *     changer de code en pleine série ou en pleine épreuve serait pire que
 *     d'attendre ;
 *   — dans Safari, explique comment ajouter l'app à l'écran d'accueil : iOS ne
 *     le propose jamais de lui-même, et seule une app installée garde ses
 *     données durablement (Safari efface celles d'un site non visité depuis
 *     sept jours).
 */
export default function MiseAJour() {
  const [enAttente, setEnAttente] = useState<ServiceWorker | null>(null)
  const [conseil, setConseil] = useState(false)
  const miseAJourDemandee = useRef(false)

  useEffect(() => {
    // En développement, un service worker mettrait en cache un code qui change.
    if (process.env.NODE_ENV !== 'production' || !('serviceWorker' in navigator)) return

    let intervalle: ReturnType<typeof setInterval> | undefined
    // Rechargement seulement après « Mettre à jour » : à la première visite,
    // le service worker prend aussi le contrôle de la page (controllerchange),
    // et recharger alors coupait la toute première série.
    const surChangement = () => {
      if (miseAJourDemandee.current) window.location.reload()
    }
    navigator.serviceWorker.addEventListener('controllerchange', surChangement)

    navigator.serviceWorker
      .register(`${BASE}/sw.js`, { scope: `${BASE}/` })
      .then((inscription) => {
        const surveiller = (sw: ServiceWorker | null) => {
          if (!sw) return
          const verifier = () => {
            // Une version installée alors qu'une autre contrôle déjà la page : c'est une mise à jour.
            if (sw.state === 'installed' && navigator.serviceWorker.controller) setEnAttente(sw)
          }
          verifier()
          sw.addEventListener('statechange', verifier)
        }
        surveiller(inscription.waiting ?? inscription.installing)
        inscription.addEventListener('updatefound', () => surveiller(inscription.installing))
        // Une app gardée ouverte plusieurs jours doit quand même voir les nouvelles versions.
        intervalle = setInterval(() => void inscription.update().catch(() => {}), 60 * 60 * 1000)
      })
      .catch((e) => console.error('[hors ligne] service worker non enregistré :', e))
    return () => {
      clearInterval(intervalle)
      navigator.serviceWorker.removeEventListener('controllerchange', surChangement)
    }
  }, [])

  useEffect(() => {
    const autonome =
      (navigator as Navigator & { standalone?: boolean }).standalone === true ||
      window.matchMedia('(display-mode: standalone)').matches
    const ios = /iPhone|iPad|iPod/.test(navigator.userAgent)
    let vu = false
    try {
      vu = localStorage.getItem(CLE_CONSEIL) === '1'
    } catch {
      /* stockage indisponible : on montre le conseil, sans pouvoir s'en souvenir */
    }
    // Une seule fois, au montage : l'environnement ne change pas en cours de route.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (ios && !autonome && !vu) setConseil(true)
  }, [])

  function fermerConseil() {
    setConseil(false)
    try {
      localStorage.setItem(CLE_CONSEIL, '1')
    } catch {
      /* rien à faire */
    }
  }

  if (!enAttente && !conseil) return null

  return (
    <div className="sans-impression fixed inset-x-3 bottom-3 z-50 mx-auto max-w-md rounded-xl border border-bord bg-carte px-4 py-3 text-sm shadow-lg">
      {enAttente ? (
        <div className="flex items-center justify-between gap-3">
          <span>Une nouvelle version de l’app est prête.</span>
          <button
            type="button"
            onClick={() => {
              miseAJourDemandee.current = true
              enAttente.postMessage('activer')
            }}
            className="shrink-0 rounded-lg bg-accent px-3 py-1.5 font-medium text-fond"
          >
            Mettre à jour
          </button>
        </div>
      ) : (
        <div>
          <p>
            Pour l’installer : touche <span className="font-medium">Partager</span> puis{' '}
            <span className="font-medium">Sur l’écran d’accueil</span>. Installée, l’app marche hors ligne et garde tes
            données ; ouverte dans Safari, iOS peut les effacer après une semaine sans visite.
          </p>
          <button type="button" onClick={fermerConseil} className="mt-2 text-doux underline">
            Compris
          </button>
        </div>
      )}
    </div>
  )
}
