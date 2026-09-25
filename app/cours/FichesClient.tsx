'use client'

import { useState } from 'react'

export interface FicheAffichable {
  cle: string
  titre: string
  soustitre: string
  enjeu: string
  methode: string[]
  pieges: Array<{ titre: string; texte: string }>
  strategie: string
  /** Taux de réussite mesuré, null tant qu'il n'y a pas assez de tentatives. */
  taux: number | null
  nbTentatives: number
  /** Vrai pour la fiche que les mesures désignent comme la plus faible. */
  prioritaire: boolean
}

/**
 * Les fiches sont dépliables, une à la fois.
 *
 * Tout afficher ferait une page de huit mille signes qu'on ne lit pas ; la
 * fiche la plus faible est ouverte d'entrée, parce que c'est celle qu'on est
 * venu chercher même quand on ne le sait pas encore.
 */
export default function FichesClient({
  fiches,
  ouvertureInitiale,
}: {
  fiches: FicheAffichable[]
  ouvertureInitiale: string | null
}) {
  const [ouverte, setOuverte] = useState<string | null>(ouvertureInitiale)

  return (
    <div className="space-y-3">
      {fiches.map((f) => {
        const deplie = ouverte === f.cle
        return (
          <article
            key={f.cle}
            className={`overflow-hidden rounded-xl border bg-carte transition ${
              f.prioritaire ? 'border-accent' : 'border-bord'
            }`}
          >
            <button
              onClick={() => setOuverte(deplie ? null : f.cle)}
              className="flex w-full items-baseline justify-between gap-4 px-5 py-4 text-left"
            >
              <div className="min-w-0">
                <h2 className="text-base font-medium">
                  {f.titre}
                  {f.prioritaire && (
                    <span className="ml-3 align-middle text-xs uppercase tracking-wide text-accent">
                      à travailler
                    </span>
                  )}
                </h2>
                <p className="mt-0.5 text-xs text-doux">{f.soustitre}</p>
              </div>

              <span className="chiffres shrink-0 text-sm text-doux">
                {f.taux === null ? (
                  <span className="text-blanc">non mesuré</span>
                ) : (
                  `${Math.round(f.taux * 100)} %`
                )}
              </span>
            </button>

            {deplie && (
              <div className="border-t border-bord px-5 py-5">
                <p className="text-sm leading-relaxed">{f.enjeu}</p>

                <h3 className="mt-6 text-xs uppercase tracking-widest text-doux">La méthode</h3>
                <ol className="mt-3 space-y-2">
                  {f.methode.map((etape, i) => (
                    <li key={i} className="flex gap-3 text-sm leading-relaxed">
                      <span className="chiffres shrink-0 text-doux">{i + 1}</span>
                      <span>{etape}</span>
                    </li>
                  ))}
                </ol>

                <h3 className="mt-6 text-xs uppercase tracking-widest text-doux">
                  Les pièges qui coûtent des points
                </h3>
                <div className="mt-3 space-y-3">
                  {f.pieges.map((p) => (
                    <div key={p.titre} className="rounded-lg border border-bord bg-fond px-4 py-3">
                      <p className="text-sm text-faux">{p.titre}</p>
                      <p className="mt-1 text-sm leading-relaxed text-doux">{p.texte}</p>
                    </div>
                  ))}
                </div>

                <h3 className="mt-6 text-xs uppercase tracking-widest text-doux">
                  Ce qu’on décide avant de commencer
                </h3>
                <p className="mt-2 text-sm leading-relaxed">{f.strategie}</p>

                <p className="mt-5 border-t border-bord pt-3 text-xs text-blanc">
                  {f.nbTentatives === 0
                    ? 'Aucune tentative sur ce sous-test : le taux affiché reste vide tant que tu ne l’as pas travaillé.'
                    : `Mesuré sur ${f.nbTentatives} question${f.nbTentatives > 1 ? 's' : ''} répondue${f.nbTentatives > 1 ? 's' : ''}.`}
                </p>
              </div>
            )}
          </article>
        )
      })}
    </div>
  )
}
