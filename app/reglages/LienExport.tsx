'use client'

import { useState, type ReactNode } from 'react'

const IPHONE = process.env.NEXT_PUBLIC_CIBLE === 'iphone'

/**
 * Lien de téléchargement d'un export.
 *
 * Sur le PC, un simple lien : le serveur répond avec le fichier. Sur l'iPhone,
 * un lien ne passerait pas par l'API locale (app/_iphone/api.ts) — seul
 * `fetch` y passe. On lit donc l'export par `fetch`, puis on le propose au
 * téléchargement ; iOS l'offre à l'enregistrement dans Fichiers.
 */
export default function LienExport({ href, className, children }: { href: string; className?: string; children: ReactNode }) {
  const [erreur, setErreur] = useState('')

  if (!IPHONE) {
    return (
      <a href={href} download className={className}>
        {children}
      </a>
    )
  }

  async function telecharger() {
    setErreur('')
    try {
      const r = await fetch(href)
      if (!r.ok) throw new Error((await r.json().catch(() => null))?.erreur ?? `Erreur ${r.status}`)
      const nom = /filename="([^"]+)"/.exec(r.headers.get('Content-Disposition') ?? '')?.[1] ?? 'prepa-export'
      const url = URL.createObjectURL(await r.blob())
      const a = document.createElement('a')
      a.href = url
      a.download = nom
      a.click()
      setTimeout(() => URL.revokeObjectURL(url), 60_000)
    } catch (e) {
      setErreur(`Export impossible : ${(e as Error).message}`)
    }
  }

  return (
    <>
      <button type="button" onClick={telecharger} className={className}>
        {children}
      </button>
      {erreur && <span className="text-sm text-faux">{erreur}</span>}
    </>
  )
}
