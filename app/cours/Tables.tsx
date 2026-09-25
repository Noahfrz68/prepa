'use client'

import { useState } from 'react'
import type { Table } from '@/exams/tagemage/lecons'

/**
 * La boîte à outils : ce qui doit être su sans réfléchir.
 *
 * Repliée par défaut, parce qu'on ne la lit pas — on l'ouvre pour réviser
 * avant une série, ou la veille de l'épreuve. Ce n'est pas du cours, c'est du
 * temps qu'on ne dépensera pas le jour J.
 */
export default function Tables({ tables }: { tables: Table[] }) {
  const [ouverte, setOuverte] = useState<string | null>(null)

  return (
    <div className="space-y-2">
      {tables.map((t) => {
        const deplie = ouverte === t.titre
        return (
          <article key={t.titre} className="overflow-hidden rounded-xl border border-bord bg-carte">
            <button
              onClick={() => setOuverte(deplie ? null : t.titre)}
              className="flex w-full items-baseline justify-between gap-4 px-5 py-3.5 text-left"
            >
              <div className="min-w-0">
                <h3 className="text-sm font-medium">{t.titre}</h3>
                <p className="mt-0.5 text-xs leading-relaxed text-doux">{t.pourquoi}</p>
              </div>
              <span className="shrink-0 text-xs text-doux">{deplie ? '−' : '+'}</span>
            </button>

            {deplie && (
              <div className="space-y-1.5 border-t border-bord px-5 py-4">
                {t.lignes.map((ligne, i) => (
                  <p key={i} className="chiffres text-sm leading-relaxed">
                    {ligne}
                  </p>
                ))}
              </div>
            )}
          </article>
        )
      })}
    </div>
  )
}
