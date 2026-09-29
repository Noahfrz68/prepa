'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { ouvrirBase } from '@/core/db/client-navigateur'
import { installerApi } from './api'

/**
 * Porte d'entrée de la version iPhone : ouvre la base, installe l'API locale,
 * et seulement ensuite affiche l'app.
 *
 * Tout le code lit la base de façon synchrone (`getDb()`), comme sur le PC.
 * Rien de ce qui la lit ne doit donc s'afficher avant qu'elle soit ouverte —
 * y compris au build, où cette porte reste fermée : le HTML statique ne
 * contient que l'écran d'ouverture, jamais de données.
 */
export default function Base({ children }: { children: ReactNode }) {
  const [etat, setEtat] = useState<'ouverture' | 'prete' | { erreur: string }>('ouverture')

  useEffect(() => {
    installerApi()
    ouvrirBase().then(
      () => setEtat('prete'),
      (e: unknown) => setEtat({ erreur: e instanceof Error ? e.message : String(e) }),
    )
  }, [])

  if (etat === 'prete') return children

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 text-center">
      {etat === 'ouverture' ? (
        <p className="text-sm text-doux">Ouverture de tes données…</p>
      ) : (
        <>
          <p className="font-semibold">Impossible d’ouvrir tes données.</p>
          <p className="mt-2 text-sm text-doux">{etat.erreur}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-6 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-fond"
          >
            Réessayer
          </button>
        </>
      )}
    </main>
  )
}
