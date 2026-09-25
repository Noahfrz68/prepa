'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

/**
 * Zone de débrief du tuteur.
 *
 * Additive par construction (principe P5) : elle s'ajoute à un écran dont le
 * contenu statistique se suffit déjà. Elle n'affiche jamais d'erreur bloquante,
 * ne fait jamais attendre, et disparaît discrètement si aucun fournisseur n'est
 * configuré. Aucun chiffre affiché ailleurs ne dépend d'elle.
 */

interface Donnees {
  categorieDominante?: string
  actionPrioritaire?: string
  skillsCiblees?: string[]
  alerteCalibration?: string
}

interface Debrief {
  statut: 'en_attente' | 'en_cours' | 'fait' | 'echoue' | 'abandonne'
  texte: string | null
  donnees: Donnees | null
  fournisseur: string | null
  modele: string | null
  erreur: string | null
}

const LIBELLE_CATEGORIE: Record<string, string> = {
  lacune: 'Lacune',
  methode: 'Erreur de méthode',
  inattention: 'Inattention',
  temps: 'Problème de temps',
  piege: 'Piège de l’énoncé',
  chance: 'Réponses obtenues par chance',
  lexique: 'Vocabulaire',
  non_traite: 'Questions non traitées',
}

export default function DebriefIA({ sessionId }: { sessionId: number }) {
  const [disponible, setDisponible] = useState<boolean | null>(null)
  const [debrief, setDebrief] = useState<Debrief | null>(null)
  const [enCours, setEnCours] = useState(false)
  const lance = useRef(false)

  useEffect(() => {
    let annule = false
    ;(async () => {
      try {
        const r = await fetch(`/api/ia/debrief?sessionId=${sessionId}`)
        const data = await r.json()
        if (annule) return

        setDisponible(data.disponible)
        setDebrief(data.debrief)

        // Rien en cache et un fournisseur prêt : on lance, une seule fois.
        if (data.disponible && !data.debrief && !lance.current) {
          lance.current = true
          setEnCours(true)
          const p = await fetch('/api/ia/debrief', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId }),
          })
          const res = await p.json()
          if (!annule) setDebrief(res.debrief)
        }
      } catch {
        // Le réseau a lâché : on ne dit rien de plus que « indisponible ».
        if (!annule) setDisponible(false)
      } finally {
        if (!annule) setEnCours(false)
      }
    })()
    return () => {
      annule = true
    }
  }, [sessionId])

  if (disponible === null) return null

  if (!disponible) {
    return (
      <section className="mt-10 rounded-xl border border-bord bg-carte px-5 py-4">
        <h2 className="text-sm uppercase tracking-widest text-doux">Débrief du tuteur</h2>
        <p className="mt-2 text-sm text-doux">
          Aucun fournisseur d’IA configuré. Tout ce qui précède est calculé sans modèle et reste
          exact.{' '}
          <Link href="/reglages" className="text-accent hover:underline">
            Configurer un fournisseur →
          </Link>
        </p>
      </section>
    )
  }

  if (enCours || debrief?.statut === 'en_cours') {
    return (
      <section className="mt-10 rounded-xl border border-bord bg-carte px-5 py-4">
        <h2 className="text-sm uppercase tracking-widest text-doux">Débrief du tuteur</h2>
        <p className="mt-2 text-sm text-doux">Analyse en cours…</p>
      </section>
    )
  }

  if (!debrief || debrief.statut === 'echoue' || debrief.statut === 'abandonne') {
    return (
      <section className="mt-10 rounded-xl border border-bord bg-carte px-5 py-4">
        <h2 className="text-sm uppercase tracking-widest text-doux">Débrief du tuteur</h2>
        <p className="mt-2 text-sm text-doux">
          Le tuteur n’a pas répondu{debrief?.erreur ? ` (${debrief.erreur})` : ''}. Sans
          conséquence : les chiffres ci-dessus ne dépendent pas de lui.
        </p>
      </section>
    )
  }

  const d = debrief.donnees

  return (
    <section className="mt-10">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="text-sm uppercase tracking-widest text-doux">Débrief du tuteur</h2>
        <span className="text-xs text-doux">
          {debrief.fournisseur} · {debrief.modele}
        </span>
      </div>

      <div className="rounded-xl border border-bord bg-carte px-5 py-4">
        {debrief.texte?.split(/\n{2,}/).map((paragraphe, i) => (
          <p key={i} className={`text-sm leading-relaxed ${i > 0 ? 'mt-3' : ''}`}>
            {paragraphe}
          </p>
        ))}

        {d && (d.categorieDominante || d.actionPrioritaire) && (
          <div className="mt-4 border-t border-bord pt-4">
            {d.categorieDominante && (
              <p className="text-xs uppercase tracking-widest text-doux">
                {LIBELLE_CATEGORIE[d.categorieDominante] ?? d.categorieDominante}
              </p>
            )}
            {d.actionPrioritaire && (
              <p className="mt-1 text-sm font-medium">{d.actionPrioritaire}</p>
            )}
            {d.skillsCiblees && d.skillsCiblees.length > 0 && (
              <p className="mt-1 text-xs text-doux">{d.skillsCiblees.join(' · ')}</p>
            )}
          </div>
        )}
      </div>

      <p className="mt-2 text-xs text-doux">
        Interprétation d’un modèle. Les chiffres, eux, viennent de la base — si les deux se
        contredisent, ce sont les chiffres qui ont raison.
      </p>
    </section>
  )
}
