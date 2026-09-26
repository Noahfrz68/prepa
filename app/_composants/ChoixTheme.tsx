'use client'

import { useSyncExternalStore } from 'react'
import { appliquerTheme, themeEnregistre, type Theme } from './theme'

const OPTIONS: Array<{ id: Theme; libelle: string }> = [
  { id: 'systeme', libelle: 'Comme le système' },
  { id: 'clair', libelle: 'Clair' },
  { id: 'sombre', libelle: 'Sombre' },
]

// Le choix vit dans le navigateur : on le lit comme un état externe, ce qui
// évite de le recopier dans un état React au montage.
const abonnes = new Set<() => void>()
function abonner(f: () => void) {
  abonnes.add(f)
  return () => abonnes.delete(f)
}

export default function ChoixTheme() {
  const theme = useSyncExternalStore(abonner, themeEnregistre, () => 'systeme' as Theme)

  return (
    <div role="radiogroup" aria-label="Thème" className="flex flex-wrap gap-2">
      {OPTIONS.map((o) => (
        <button
          key={o.id}
          type="button"
          role="radio"
          aria-checked={theme === o.id}
          onClick={() => {
            appliquerTheme(o.id)
            abonnes.forEach((f) => f())
          }}
          className={`rounded-lg border px-4 py-2 text-sm ${
            theme === o.id
              ? 'border-accent text-texte'
              : 'border-bord bg-carte text-doux hover:text-texte'
          }`}
        >
          {o.libelle}
        </button>
      ))}
    </div>
  )
}
