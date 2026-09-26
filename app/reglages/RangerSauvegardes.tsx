'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { poster } from '@/app/_composants/reseau'

/** Âge au-delà duquel une copie nommée est proposée au rangement. */
const JOURS = 7

/**
 * Ranger les copies faites avant une opération risquée. En deux temps : on
 * montre d'abord ce qui partirait, et rien n'est supprimé sans confirmation.
 */
export default function RangerSauvegardes() {
  const router = useRouter()
  const [apercu, setApercu] = useState<string[] | null>(null)
  const [message, setMessage] = useState('')
  const [occupe, setOccupe] = useState(false)

  const voir = async () => {
    setOccupe(true)
    setMessage('')
    try {
      const r = await poster<{ fichiers: string[] }>('/api/sauvegardes', { action: 'apercu', jours: JOURS })
      setApercu(r.fichiers)
    } catch (e) {
      setMessage((e as Error).message)
    } finally {
      setOccupe(false)
    }
  }

  const ranger = async () => {
    setOccupe(true)
    try {
      const r = await poster<{ fichiers: string[] }>('/api/sauvegardes', { action: 'ranger', jours: JOURS })
      setMessage(`${r.fichiers.length} copie${r.fichiers.length > 1 ? 's' : ''} supprimée${r.fichiers.length > 1 ? 's' : ''}.`)
      setApercu(null)
      router.refresh()
    } catch (e) {
      setMessage((e as Error).message)
    } finally {
      setOccupe(false)
    }
  }

  return (
    <div className="mt-3 text-sm">
      {apercu === null ? (
        <button
          onClick={() => void voir()}
          disabled={occupe}
          className="rounded-lg border border-bord bg-carte px-4 py-2 hover:border-accent disabled:opacity-50"
        >
          Ranger les copies nommées de plus de {JOURS} jours…
        </button>
      ) : apercu.length === 0 ? (
        <p className="text-doux">Aucune copie nommée de plus de {JOURS} jours : rien à ranger.</p>
      ) : (
        <div className="rounded-xl border border-bord bg-carte px-4 py-3">
          <p>Seraient supprimées définitivement :</p>
          <ul className="mt-1 list-inside list-disc text-xs text-doux">
            {apercu.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => void ranger()}
              disabled={occupe}
              className="rounded-lg bg-faux px-3 py-1.5 text-xs font-medium text-fond disabled:opacity-50"
            >
              Supprimer ces {apercu.length} copies
            </button>
            <button onClick={() => setApercu(null)} className="rounded-lg border border-bord px-3 py-1.5 text-xs text-doux">
              Annuler
            </button>
          </div>
        </div>
      )}
      {message && <p className="mt-2 text-xs text-doux">{message}</p>}
    </div>
  )
}
