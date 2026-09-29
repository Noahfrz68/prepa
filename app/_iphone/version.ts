'use client'

import { useSyncExternalStore } from 'react'

/**
 * Version des données, version iPhone.
 *
 * Sur le PC, après une écriture, un composant appelle `router.refresh()` et le
 * serveur refait le rendu des pages avec les nouvelles données. Dans le site
 * statique, `refresh()` ne fait que recharger un rendu figé au build : rien ne
 * bougerait. Chaque écriture réussie passée par l'API locale incrémente donc
 * ce compteur, et les pages (pages.tsx) s'y abonnent pour se recalculer —
 * sans être remontées, donc sans perdre l'état d'une série en cours.
 */

let version = 0
const abonnes = new Set<() => void>()

export function signalerEcriture(): void {
  version++
  for (const f of abonnes) f()
}

function sAbonner(f: () => void) {
  abonnes.add(f)
  return () => abonnes.delete(f)
}

export function useVersionDonnees(): number {
  return useSyncExternalStore(
    sAbonner,
    () => version,
    () => 0,
  )
}
