'use client'

import { useState } from 'react'
import { FONDATIONS_LOGIQUE, ORDRE_DE_TEST } from '@/exams/tagemage/lecons/logique'

/**
 * Le socle du sous-test de logique, avant les seize leçons.
 *
 * Les leçons disent comment traiter chaque type de question. Il manquait ce qui
 * vaut pour les seize à la fois : les quatre gestes qui reviennent partout, et
 * l'itinéraire de recherche à suivre quand on ne voit rien. C'est le seul
 * contenu du sous-test qui mérite d'être relu la veille — il ne s'agit pas de
 * connaissances, mais de l'ordre dans lequel on essaie.
 *
 * L'ordre de test est replié par défaut : déroulé en entier, il fait six écrans
 * et personne ne le lit. On l'ouvre quand on vient de caler sur une question,
 * et c'est à ce moment-là qu'il sert.
 */
export default function Logique() {
  const [ouvert, setOuvert] = useState<string | null>(null)

  return (
    <div>
      <div className="space-y-3">
        {FONDATIONS_LOGIQUE.map((f) => (
          <div key={f.titre} className="rounded-xl border border-bord bg-carte px-5 py-4">
            <p className="text-sm font-medium">{f.titre}</p>
            <p className="mt-1 text-sm leading-relaxed text-doux">{f.texte}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-xl border border-bord bg-carte px-5 py-4">
        <p className="text-sm font-medium">L’ordre de test</p>
        <p className="mt-1 text-sm leading-relaxed text-doux">
          Ce qu’on essaie, et dans quel ordre, quand la règle ne saute pas aux yeux. C’est ce qui
          remplace l’inspiration : une liste finie d’essais, tous rapides, classés par fréquence
          réelle.
        </p>

        <div className="mt-4 space-y-2">
          {ORDRE_DE_TEST.map((o) => {
            const estOuvert = ouvert === o.sur
            return (
              <div key={o.sur} className="rounded-lg border border-bord">
                <button
                  onClick={() => setOuvert(estOuvert ? null : o.sur)}
                  className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left text-sm transition hover:text-accent"
                >
                  <span>{o.sur}</span>
                  <span className="chiffres text-xs text-doux">
                    {estOuvert ? '−' : `${o.essais.length} essais`}
                  </span>
                </button>

                {estOuvert && (
                  <ol className="list-decimal space-y-1.5 border-t border-bord px-4 py-3 pl-9 text-sm leading-relaxed text-doux">
                    {o.essais.map((e, i) => (
                      <li key={i}>{e}</li>
                    ))}
                  </ol>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
