'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

interface Groupe {
  titre: string
  touches: Array<[string[], string]>
}

const DRILL: Groupe[] = [
  {
    titre: 'Question',
    touches: [
      [['1', '…', '5'], 'Répondre A à E'],
      [['A', '…', 'E'], 'Répondre par la lettre'],
      [['espace'], 'Sauter la question'],
    ],
  },
  {
    titre: 'Confiance, après avoir répondu',
    touches: [
      [['1', '…', '4'], 'Déclarer sa confiance'],
      [['échap'], 'Revenir à la question'],
    ],
  },
]

const EPREUVE: Groupe[] = [
  {
    titre: 'Avant un sous-test',
    touches: [[['entrée'], 'Démarrer le sous-test']],
  },
  {
    titre: 'Question',
    touches: [
      [['1', '…', '5'], 'Répondre A à E'],
      [['A', '…', 'E'], 'Répondre par la lettre'],
      [['espace'], 'Sauter la question'],
      [['←', '→'], 'Question précédente, suivante'],
      [['M'], 'Marquer pour y revenir'],
    ],
  },
  {
    titre: 'Confiance, après avoir répondu',
    touches: [
      [['1', '…', '4'], 'Déclarer sa confiance'],
      [['échap'], 'Revenir à la question'],
    ],
  },
]

const ATELIER: Groupe[] = [
  {
    titre: 'File de relecture',
    touches: [
      [['1', '…', '5'], 'Choisir la bonne réponse'],
      [['entrée'], 'Valider la question'],
      [['suppr'], 'Supprimer la question'],
    ],
  },
]

function groupesDe(chemin: string): Groupe[] {
  if (chemin.startsWith('/tagemage/drill')) return DRILL
  // /tagemage/epreuve seul : le bilan d'une épreuve (/tagemage/epreuve/12) n'a pas de raccourcis.
  if (chemin === '/tagemage/epreuve') return EPREUVE
  if (chemin === '/atelier') return ATELIER
  return []
}

/**
 * « ? » affiche les raccourcis de la page, n'importe où dans l'application.
 *
 * Tant que la surimpression est ouverte, elle intercepte le clavier avant la
 * page (écoute en phase de capture) : taper « 1 » pour lire la liste ne doit
 * pas répondre A à la question en dessous.
 */
export default function Raccourcis() {
  const chemin = usePathname()
  const [ouvert, setOuvert] = useState(false)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const saisie =
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement ||
        (e.target instanceof HTMLElement && e.target.isContentEditable)
      if (e.key === '?' && !saisie && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault()
        e.stopImmediatePropagation()
        setOuvert((o) => !o)
        return
      }
      if (!ouvert) return
      e.preventDefault()
      e.stopImmediatePropagation()
      if (e.key === 'Escape') setOuvert(false)
    }
    window.addEventListener('keydown', onKey, { capture: true })
    return () => window.removeEventListener('keydown', onKey, { capture: true })
  }, [ouvert])

  if (!ouvert) return null
  const groupes = groupesDe(chemin)

  return (
    <div
      className="sans-impression fixed inset-0 z-50 flex items-center justify-center bg-fond/80 px-4"
      onClick={() => setOuvert(false)}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="titre-raccourcis"
        className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-xl border border-bord bg-carte p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-baseline justify-between gap-4">
          <h2 id="titre-raccourcis" className="text-lg font-semibold tracking-tight">
            Raccourcis clavier
          </h2>
          <button
            type="button"
            onClick={() => setOuvert(false)}
            className="text-sm text-doux hover:text-texte"
          >
            Fermer
          </button>
        </div>

        {groupes.length === 0 ? (
          <p className="mt-4 text-sm leading-relaxed text-doux">
            Cette page n’a pas de raccourci propre. Les séries, les épreuves et la file de
            relecture de l’atelier se pilotent entièrement au clavier.
          </p>
        ) : (
          groupes.map((g) => (
            <section key={g.titre} className="mt-5">
              <h3 className="mb-2 text-xs uppercase tracking-widest text-doux">{g.titre}</h3>
              <ul className="space-y-1.5">
                {g.touches.map(([touches, effet]) => (
                  <li key={effet} className="flex items-center justify-between gap-4 text-sm">
                    <span className="flex gap-1">
                      {touches.map((t, i) =>
                        t === '…' ? (
                          <span key={i} className="text-doux">
                            …
                          </span>
                        ) : (
                          <kbd key={i} className="kbd">
                            {t}
                          </kbd>
                        ),
                      )}
                    </span>
                    <span className="text-right text-doux">{effet}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))
        )}

        <p className="mt-6 border-t border-bord pt-4 text-xs text-doux">
          <kbd className="kbd">?</kbd> ouvre et ferme cette aide, <kbd className="kbd">échap</kbd> la
          ferme.
        </p>
      </div>
    </div>
  )
}
