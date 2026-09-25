'use client'

import { useState } from 'react'

export interface EtapeAffichable {
  titre: string
  pourquoi: string
  duree: string
  lecons: Array<{ skillId: string; titre: string; taux: number | null }>
}

/**
 * Un ordre d'attaque, replié par défaut.
 *
 * Quarante-huit leçons à plat n'ont pas d'entrée : on ouvre la page, on ne sait
 * pas par où commencer, et on lit celle du sous-test qu'on préfère — c'est-à-dire
 * celui où l'on est déjà bon. L'ordre proposé suit le RENDEMENT, pas le
 * programme : d'abord ce qui se gagne par la méthode, en dernier ce qui demande
 * des mois de langue.
 */
export default function Parcours({ etapes }: { etapes: EtapeAffichable[] }) {
  const [ouverte, setOuverte] = useState<string | null>(etapes[0]?.titre ?? null)

  return (
    <div className="space-y-2">
      {etapes.map((e) => {
        const deplie = ouverte === e.titre
        const mesurees = e.lecons.filter((l) => l.taux !== null)
        const faibles = mesurees.filter((l) => l.taux! < 0.6).length

        return (
          <article key={e.titre} className="overflow-hidden rounded-xl border border-bord bg-carte">
            <button
              onClick={() => setOuverte(deplie ? null : e.titre)}
              className="flex w-full items-baseline justify-between gap-4 px-5 py-3.5 text-left"
            >
              <div className="min-w-0">
                <h3 className="text-sm font-medium">{e.titre}</h3>
                <p className="mt-0.5 text-xs text-doux">
                  {e.lecons.length} leçon{e.lecons.length > 1 ? 's' : ''} · {e.duree}
                  {faibles > 0 && (
                    <span className="text-accent"> · {faibles} à travailler</span>
                  )}
                </p>
              </div>
              <span className="shrink-0 text-xs text-doux">{deplie ? '−' : '+'}</span>
            </button>

            {deplie && (
              <div className="border-t border-bord px-5 py-4">
                <p className="text-sm leading-relaxed text-doux">{e.pourquoi}</p>
                <ul className="mt-3 flex flex-wrap gap-x-3 gap-y-1.5">
                  {e.lecons.map((l) => (
                    <li key={l.skillId} className="text-xs">
                      <a
                        href={`#${l.skillId}`}
                        className={`hover:underline ${
                          l.taux !== null && l.taux < 0.6 ? 'text-accent' : 'text-doux hover:text-texte'
                        }`}
                      >
                        {l.titre}
                        {l.taux !== null && (
                          <span className="chiffres"> · {Math.round(l.taux * 100)} %</span>
                        )}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </article>
        )
      })}
    </div>
  )
}
