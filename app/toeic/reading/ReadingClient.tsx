'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { NB_PROPOSITIONS } from '@/core/scoring/toeic'

const LETTRES = ['A', 'B', 'C', 'D', 'E'] as const

interface ItemReading {
  id: number
  enonce: string
  contexteTexte: string | null
  options: string[]
}

interface Serie {
  sessionId: number
  part: string
  libelle: string
  budgetMinutes: number
  items: ItemReading[]
  manquantes: number
}

interface Reponse {
  reponse: string | null
  confiance: number | null
  marque: boolean
  tempsMs: number
}

type Phase = 'chargement' | 'erreur' | 'question' | 'confiance' | 'cloture' | 'envoi'

const vide = (): Reponse => ({ reponse: null, confiance: null, marque: false, tempsMs: 0 })

const mmss = (s: number) =>
  `${Math.floor(Math.max(0, s) / 60)}:${String(Math.max(0, s) % 60).padStart(2, '0')}`

export default function ReadingClient({ part, taille }: { part: string; taille: number }) {
  const router = useRouter()

  const [phase, setPhase] = useState<Phase>('chargement')
  const [erreur, setErreur] = useState('')
  const [serie, setSerie] = useState<Serie | null>(null)
  const [iItem, setIItem] = useState(0)
  const [reponses, setReponses] = useState<Reponse[]>([])
  const [ecoule, setEcoule] = useState(0)

  // Posés au démarrage de la série (pas pendant le rendu).
  const debutItem = useRef(0)
  const debutSerie = useRef(0)
  const envoiEnCours = useRef(false)

  const item = serie?.items[iItem]

  /* ------------------------------------------------------- démarrage -- */

  useEffect(() => {
    let annule = false
    ;(async () => {
      try {
        const r = await fetch('/api/toeic/serie/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ part, taille }),
        })
        const data = await r.json()
        if (annule) return
        if (!r.ok) {
          setErreur(data.erreur ?? 'Impossible de démarrer.')
          setPhase('erreur')
          return
        }
        setSerie(data)
        setReponses(data.items.map(vide))
        debutItem.current = Date.now()
        debutSerie.current = Date.now()
        setPhase('question')
      } catch (e) {
        if (!annule) {
          setErreur((e as Error).message)
          setPhase('erreur')
        }
      }
    })()
    return () => {
      annule = true
    }
  }, [part, taille])

  /* ---------------------------------------------------------- chrono -- */

  useEffect(() => {
    if (phase !== 'question' && phase !== 'confiance') return
    const t = setInterval(() => setEcoule(Math.floor((Date.now() - debutSerie.current) / 1000)), 250)
    return () => clearInterval(t)
  }, [phase])

  const capitaliserTemps = useCallback((index: number) => {
    const delta = Date.now() - debutItem.current
    debutItem.current = Date.now()
    setReponses((r) => {
      if (!r[index]) return r
      const copie = [...r]
      copie[index] = { ...copie[index], tempsMs: copie[index].tempsMs + delta }
      return copie
    })
  }, [])

  const allerA = useCallback(
    (index: number) => {
      if (!serie || index < 0 || index >= serie.items.length) return
      capitaliserTemps(iItem)
      setIItem(index)
      setPhase('question')
    },
    [capitaliserTemps, iItem, serie],
  )

  const avancer = useCallback(
    (depuis: number, etat: Reponse[]) => {
      if (!serie) return
      for (let k = 1; k <= serie.items.length; k++) {
        const j = (depuis + k) % serie.items.length
        if (etat[j] && etat[j].reponse === null) {
          allerA(j)
          return
        }
      }
      allerA(Math.min(depuis + 1, serie.items.length - 1))
    },
    [allerA, serie],
  )

  const repondre = useCallback(
    (lettre: string) => {
      capitaliserTemps(iItem)
      setReponses((r) => {
        const copie = [...r]
        copie[iItem] = { ...copie[iItem], reponse: lettre }
        return copie
      })
      setPhase('confiance')
    },
    [capitaliserTemps, iItem],
  )

  const declarerConfiance = useCallback(
    (niveau: number) => {
      capitaliserTemps(iItem)
      setReponses((r) => {
        const copie = [...r]
        copie[iItem] = { ...copie[iItem], confiance: niveau }
        setTimeout(() => avancer(iItem, copie), 0)
        return copie
      })
    },
    [avancer, capitaliserTemps, iItem],
  )

  const marquer = useCallback(() => {
    setReponses((r) => {
      const copie = [...r]
      copie[iItem] = { ...copie[iItem], marque: !copie[iItem].marque }
      return copie
    })
  }, [iItem])

  /* ------------------------------------------------------- clôture -- */

  const envoyer = useCallback(
    async (remplirAuHasard: boolean) => {
      if (!serie || envoiEnCours.current) return
      envoiEnCours.current = true
      setPhase('envoi')

      const courant = await new Promise<Reponse[]>((resolve) => {
        setReponses((r) => {
          resolve(r)
          return r
        })
      })

      const tentatives = serie.items.map((it, i) => {
        const rep = courant[i] ?? vide()
        const traitee = rep.reponse !== null && rep.confiance !== null

        if (traitee) {
          return {
            itemId: it.id,
            reponse: rep.reponse,
            nonTraitee: false,
            tempsMs: rep.tempsMs,
            confiance: rep.confiance!,
          }
        }

        // Remplir au hasard reproduit ce qu'il faut faire à l'examen : une
        // case vide et une mauvaise réponse valent zéro, donc ne pas cocher
        // est une perte sèche. La confiance est 1, ce qui est la vérité.
        if (remplirAuHasard) {
          return {
            itemId: it.id,
            reponse: LETTRES[Math.floor(Math.random() * Math.min(NB_PROPOSITIONS, it.options.length))],
            nonTraitee: false,
            tempsMs: rep.tempsMs,
            confiance: 1,
          }
        }

        return {
          itemId: it.id,
          reponse: null,
          nonTraitee: true,
          tempsMs: rep.tempsMs,
          confiance: 1,
        }
      })

      await fetch('/api/toeic/serie/lot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: serie.sessionId, tentatives }),
      })

      router.push(`/toeic/reading/${serie.sessionId}`)
    },
    [router, serie],
  )

  /* -------------------------------------------------------- clavier -- */

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const k = e.key.toLowerCase()

      if (phase === 'confiance') {
        const n = Number(k)
        if (Number.isInteger(n) && n >= 1 && n <= 4) {
          e.preventDefault()
          declarerConfiance(n)
        } else if (k === 'escape' || k === 'backspace') {
          e.preventDefault()
          setReponses((r) => {
            const copie = [...r]
            copie[iItem] = { ...copie[iItem], reponse: null }
            return copie
          })
          setPhase('question')
        }
        return
      }

      if (phase !== 'question' || !item) return

      const nb = item.options.length
      const chiffre = Number(k)
      if (Number.isInteger(chiffre) && chiffre >= 1 && chiffre <= nb) {
        e.preventDefault()
        repondre(LETTRES[chiffre - 1])
        return
      }
      const lettre = LETTRES.indexOf(k.toUpperCase() as (typeof LETTRES)[number])
      if (lettre >= 0 && lettre < nb) {
        e.preventDefault()
        repondre(LETTRES[lettre])
        return
      }

      if (k === 'arrowright') {
        e.preventDefault()
        allerA(iItem + 1)
      } else if (k === 'arrowleft') {
        e.preventDefault()
        allerA(iItem - 1)
      } else if (k === 'm') {
        e.preventDefault()
        marquer()
      }
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [allerA, declarerConfiance, iItem, item, marquer, phase, repondre])

  /* ----------------------------------------------------------- vues -- */

  const traitees = useMemo(
    () => reponses.filter((r) => r.reponse !== null && r.confiance !== null).length,
    [reponses],
  )

  if (phase === 'chargement' || phase === 'envoi') {
    return (
      <Centre>
        <p className="text-doux">{phase === 'envoi' ? 'Enregistrement…' : 'Préparation…'}</p>
      </Centre>
    )
  }

  if (phase === 'erreur') {
    return (
      <Centre>
        <p className="text-faux">{erreur}</p>
        <Link href="/import?exam=toeic_lr" className="mt-4 inline-block text-sm text-accent hover:underline">
          Ouvrir l’atelier d’import →
        </Link>
      </Centre>
    )
  }

  if (!serie || !item) return null

  const restantes = serie.items.length - traitees
  const budgetSecondes = serie.budgetMinutes * 60
  const depassement = ecoule > budgetSecondes

  if (phase === 'cloture') {
    return (
      <Cloture
        restantes={restantes}
        total={serie.items.length}
        onRemplir={() => void envoyer(true)}
        onLaisser={() => void envoyer(false)}
        onReprendre={() => setPhase('question')}
      />
    )
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-8">
      <div className="mb-4 flex items-center justify-between text-sm">
        <Link href="/toeic" className="text-doux hover:text-texte">
          ← Quitter
        </Link>
        <span className="text-doux">
          {serie.libelle} · {iItem + 1}/{serie.items.length}
        </span>
        <span className={`chiffres tabular-nums ${depassement ? 'text-faux' : 'text-texte'}`}>
          {mmss(ecoule)}
          <span className="ml-1 text-xs opacity-60">/ {serie.budgetMinutes} min</span>
        </span>
      </div>

      <div className="h-1 w-full overflow-hidden rounded bg-carte-clair">
        <div
          className={`h-full transition-all ${depassement ? 'bg-faux' : 'bg-accent'}`}
          style={{ width: `${Math.min(100, (ecoule / budgetSecondes) * 100)}%` }}
        />
      </div>

      {depassement && (
        <p className="mt-2 text-xs text-faux">
          Budget dépassé. En Reading le temps est commun aux trois parts : ce que tu prends ici,
          tu le retires de la Part 7.
        </p>
      )}

      <div className="mt-5 flex flex-wrap gap-1.5">
        {reponses.map((r, i) => {
          const traitee = r.reponse !== null && r.confiance !== null
          return (
            <button
              key={i}
              disabled={phase !== 'question'}
              onClick={() => allerA(i)}
              className={`chiffres relative h-7 w-7 rounded border text-xs transition ${
                traitee ? 'border-accent bg-accent text-fond' : 'border-bord text-doux'
              } ${i === iItem ? 'ring-2 ring-texte ring-offset-2 ring-offset-[var(--fond)]' : ''}`}
            >
              {i + 1}
              {r.marque && (
                <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-blanc" />
              )}
            </button>
          )
        })}
      </div>

      {phase === 'question' ? (
        <>
          {item.contexteTexte && (
            <div className="mt-6 max-h-72 overflow-y-auto rounded-lg border border-bord bg-carte p-5 text-sm leading-relaxed">
              {item.contexteTexte}
            </div>
          )}

          <h2 className="mt-6 text-lg leading-relaxed">{item.enonce}</h2>

          <ul className="mt-5 space-y-2">
            {item.options.map((texte, i) => {
              const choisie = reponses[iItem]?.reponse === LETTRES[i]
              return (
                <li key={i}>
                  <button
                    onClick={() => repondre(LETTRES[i])}
                    className={`flex w-full items-start gap-3 rounded-lg border px-4 py-3 text-left text-sm transition ${
                      choisie
                        ? 'border-accent bg-carte-clair'
                        : 'border-bord bg-carte hover:border-accent hover:bg-carte-clair'
                    }`}
                  >
                    <span className="kbd mt-0.5">{i + 1}</span>
                    <span className="font-medium text-doux">{LETTRES[i]}.</span>
                    <span className="flex-1">{texte}</span>
                  </button>
                </li>
              )
            })}
          </ul>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-xs text-doux">
            <div className="flex gap-4">
              <button onClick={marquer} className="hover:text-texte">
                <span className="kbd mr-1.5">M</span>
                {reponses[iItem]?.marque ? 'Retirer la marque' : 'Marquer'}
              </button>
              <span>
                <span className="kbd mr-1.5">←</span>
                <span className="kbd mr-1.5">→</span> Naviguer
              </span>
              {/* Pas de bouton « sauter » : au TOEIC, sauter n'existe pas. */}
              <span className="text-blanc">Une mauvaise réponse ne coûte rien : réponds toujours.</span>
            </div>
            <button
              onClick={() => setPhase('cloture')}
              className="rounded-lg border border-bord px-3 py-1.5 text-doux transition hover:border-accent hover:text-texte"
            >
              Terminer ({traitees}/{serie.items.length})
            </button>
          </div>
        </>
      ) : (
        <Confiance lettre={reponses[iItem]?.reponse} onChoix={declarerConfiance} />
      )}
    </main>
  )
}

/* --------------------------------------------------------- sous-vues -- */

function Centre({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center px-6 text-center">
      {children}
    </main>
  )
}

const NIVEAUX = [
  { n: 1, libelle: 'Au hasard', detail: 'J’ai coché sans savoir' },
  { n: 2, libelle: 'Hésitant', detail: 'J’ai éliminé une ou deux propositions' },
  { n: 3, libelle: 'Assez sûr', detail: 'Je pense avoir la bonne' },
  { n: 4, libelle: 'Certain', detail: 'Je suis sûr de moi' },
]

function Confiance({
  lettre,
  onChoix,
}: {
  lettre: string | null | undefined
  onChoix: (n: number) => void
}) {
  return (
    <div className="mt-8">
      <p className="text-sm text-doux">
        Réponse : <span className="font-medium text-texte">{lettre}</span>
      </p>
      <h2 className="mt-1 text-lg">À quel point es-tu sûr ?</h2>
      <p className="mt-1 text-xs text-doux">
        Au TOEIC la confiance ne sert pas à décider de répondre — il faut toujours répondre.
        Elle sert à distinguer ce que tu sais de ce que tu as deviné juste.
      </p>

      <ul className="mt-5 space-y-2">
        {NIVEAUX.map((niv) => (
          <li key={niv.n}>
            <button
              onClick={() => onChoix(niv.n)}
              className="flex w-full items-center gap-3 rounded-lg border border-bord bg-carte px-4 py-3 text-left text-sm transition hover:border-accent hover:bg-carte-clair"
            >
              <span className="kbd">{niv.n}</span>
              <span className="font-medium">{niv.libelle}</span>
              <span className="text-xs text-doux">{niv.detail}</span>
            </button>
          </li>
        ))}
      </ul>

      <p className="mt-4 text-xs text-doux">
        <span className="kbd mr-2">échap</span> annuler la réponse
      </p>
    </div>
  )
}

/**
 * Écran de clôture. C'est ici que se joue la leçon stratégique du TOEIC :
 * laisser une case vide ne protège de rien, donc ne pas cocher est une perte
 * sèche. On chiffre ce que le remplissage rapporterait.
 */
function Cloture({
  restantes,
  total,
  onRemplir,
  onLaisser,
  onReprendre,
}: {
  restantes: number
  total: number
  onRemplir: () => void
  onLaisser: () => void
  onReprendre: () => void
}) {
  if (restantes === 0) {
    return (
      <Centre>
        <p className="text-lg">Les {total} questions sont traitées.</p>
        <button
          onClick={onLaisser}
          className="mt-6 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-fond hover:opacity-90"
        >
          Voir la correction
        </button>
        <button onClick={onReprendre} className="mt-3 text-sm text-doux hover:text-texte">
          Revenir à la série
        </button>
      </Centre>
    )
  }

  return (
    <main className="mx-auto max-w-xl px-6 py-20">
      <h1 className="text-2xl font-semibold tracking-tight">
        <span className="chiffres">{restantes}</span> question{restantes > 1 ? 's' : ''} sans
        réponse
      </h1>

      <p className="mt-4 text-sm leading-relaxed text-doux">
        Au TOEIC, une mauvaise réponse et une case vide valent exactement zéro. Laisser une case
        vide ne protège donc de rien : c’est une perte sèche. En cochant au hasard, tu récupères
        en moyenne{' '}
        <span className="chiffres text-blanc">
          {(restantes / NB_PROPOSITIONS).toFixed(1)}
        </span>{' '}
        bonne{restantes / NB_PROPOSITIONS >= 2 ? 's' : ''} réponse
        {restantes / NB_PROPOSITIONS >= 2 ? 's' : ''}.
      </p>

      <div className="mt-8 space-y-3">
        <button
          onClick={onRemplir}
          className="w-full rounded-lg bg-accent px-4 py-3 text-sm font-medium text-fond transition hover:opacity-90"
        >
          Remplir au hasard et terminer
          <span className="ml-2 opacity-70">— ce qu’il faut faire à l’examen</span>
        </button>
        <button
          onClick={onReprendre}
          className="w-full rounded-lg border border-bord px-4 py-3 text-sm text-texte transition hover:border-accent"
        >
          Revenir à la série
        </button>
        <button
          onClick={onLaisser}
          className="w-full px-4 py-2 text-xs text-doux transition hover:text-texte"
        >
          Laisser vides et terminer — pour mesurer ce que ça coûte
        </button>
      </div>
    </main>
  )
}
