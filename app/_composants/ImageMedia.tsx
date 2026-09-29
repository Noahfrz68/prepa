'use client'

import { useSourceMedia } from './media'

/**
 * Une figure d'annale, servie par `/api/image/…` — ou, sur l'iPhone, lue dans
 * le stockage du téléphone (voir media.ts).
 */
export default function ImageMedia({ hash, alt, className }: { hash: string; alt: string; className?: string }) {
  const src = useSourceMedia(`/api/image/${hash}`)
  if (src === undefined) return <div className="h-24" aria-busy="true" aria-label={alt} />
  if (src === null) {
    return (
      <p className="px-4 py-6 text-sm text-neutral-600">
        Image absente de cet appareil — elle arrivera avec la prochaine synchronisation.
      </p>
    )
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} className={className} />
}
