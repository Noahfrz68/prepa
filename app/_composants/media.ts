'use client'

import { useEffect, useState } from 'react'

const IPHONE = process.env.NEXT_PUBLIC_CIBLE === 'iphone'

/**
 * Adresse à donner à un <img> ou un <audio> pour une figure ou un audio servi
 * par l'API (`/api/image/…`, `/api/audio/…`).
 *
 * Sur le PC, c'est l'adresse elle-même. Sur l'iPhone, il n'y a pas de serveur
 * derrière : le navigateur charge ces balises sans passer par `fetch`, donc
 * sans l'API locale (app/_iphone/api.ts). On lit donc le fichier par `fetch`,
 * qui, lui, est servi sur place, et on en fait une adresse locale (blob:).
 *
 * Rend `undefined` pendant la lecture, `null` si le fichier est introuvable
 * (un audio pas encore synchronisé, par exemple).
 */
export function useSourceMedia(src: string | null): string | null | undefined {
  const [local, setLocal] = useState<{ src: string; url: string | null } | null>(null)

  useEffect(() => {
    if (!IPHONE || !src) return
    let actif = true
    let url: string | null = null
    fetch(src)
      .then((r) => (r.ok ? r.blob() : null))
      .then((b) => {
        if (!actif) return
        url = b ? URL.createObjectURL(b) : null
        setLocal({ src, url })
      })
      .catch(() => actif && setLocal({ src, url: null }))
    return () => {
      actif = false
      if (url) URL.revokeObjectURL(url)
    }
  }, [src])

  if (!IPHONE || !src) return src
  return local?.src === src ? local.url : undefined
}
