'use client'

import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'
import { LIBELLE_ACCENT, SECONDES_REPONSE, type Accent } from '@/exams/toeic/listening'

const LETTRES = ['A', 'B', 'C', 'D'] as const

interface ItemListening {
  id: number
  enonce: string
  options: string[]
}

interface Groupe {
  mediaId: number
  hash: string
  accent: Accent
  dureeMs: number | null
  items: ItemListening[]
  secondesPreparation: number
  questionsVisiblesAvant: boolean
}

interface Serie {
  sessionId: number
  part: string
  libelle: string
  groupes: Groupe[]
  ecartes: number
}

interface Reponse {
  reponse: string | null
  confiance: number | null
  tempsMs: number
}

type Phase = 'chargement' | 'erreur' | 'preparation' | 'ecoute' | 'reponse' | 'confiance' | 'envoi' | 'fini'

export default function ListeningClient({ part, groupes }: { part: string; groupes: number }) {
  const [phase, setPhase] = useState<Phase>('chargement')
  const [erreur, setErreur] = useState('')
  const [serie, setSerie] = useState<Serie | null>(null)

  const [iGroupe, setIGroupe] = useState(0)
  const [iItem, setIItem] = useState(0)
  const [reponses, setReponses] = useState<Map<number, Reponse>>(new Map())
  const [compteARebours, setCompteARebours] = useState(0)
  const [bilan, setBilan] = useState<{ justes: number; total: number } | null>(null)

  const audio = useRef<HTMLAudioElement | null>(null)
  const debutPreparation = useRef(0)
  const tempsPreparation = useRef<Map<number, number>>(new Map())
  const debutItem = useRef(0)
  const envoiEnCours = useRef(false)

  const groupe = serie?.groupes[iGroupe]
  const item = groupe?.items[iItem]

  /* ------------------------------------------------------- démarrage -- */

  useEffect(() => {
    let annule = false
    ;(async () => {
      try {
        const r = await fetch('/api/listening/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ part, groupes }),
        })
        const data = await r.json()
        if (annule) return
        if (!r.ok) {
          setErreur(data.erreur ?? 'Impossible de démarrer.')
          setPhase('erreur')
          return
        }
        setSerie(data)
        demarrerGroupe(data.groupes[0])
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
  }, [part, groupes])

  function demarrerGroupe(g: Groupe) {
    if (g.questionsVisiblesAvant && g.secondesPreparation > 0) {
      debutPreparation.current = Date.now()
      setCompteARebours(g.secondesPreparation)
      setPhase('preparation')
    } else {
      tempsPreparation.current.set(g.mediaId, 0)
      setPhase('ecoute')
    }
  }

  /* ----------------------------------------- compte à rebours de lecture -- */

  useEffect(() => {
    if (phase !== 'preparation') return

    const t = setInterval(() => {
      setCompteARebours((s) => {
        if (s <= 1) {
          clearInterval(t)
          lancerAudio()
          return 0
        }
        return s - 1
      })
    }, 1000)

    return () => clearInterval(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, iGroupe])

  const lancerAudio = useCallback(() => {
    if (!groupe) return
    // Temps réellement passé à lire les questions : c'est la mesure qui
    // distingue celui qui prépare de celui qui découvre après l'écoute.
    tempsPreparation.current.set(
      groupe.mediaId,
      debutPreparation.current > 0 ? Date.now() - debutPreparation.current : 0,
    )
    setPhase('ecoute')
  }, [groupe])

  /* ------------------------------------------------------------ écoute -- */

  useEffect(() => {
    if (phase !== 'ecoute' || !audio.current) return
    audio.current.play().catch(() => {
      // Lecture refusée par le navigateur : on n'insiste pas, on passe aux
      // questions. Mieux vaut une série gâchée qu'un blocage silencieux.
      setPhase('reponse')
      debutItem.current = Date.now()
    })
  }, [phase, iGroupe])

  const finAudio = useCallback(() => {
    setPhase('reponse')
    setIItem(0)
    debutItem.current = Date.now()
  }, [])

  /* --------------------------------------------------------- réponses -- */

  const repondre = useCallback(
    (lettre: string) => {
      if (!item) return
      setReponses((r) => {
        const copie = new Map(r)
        copie.set(item.id, {
          reponse: lettre,
          confiance: null,
          tempsMs: Date.now() - debutItem.current,
        })
        return copie
      })
      setPhase('confiance')
    },
    [item],
  )

  const terminer = useCallback(async () => {
    if (!serie || envoiEnCours.current) return
    envoiEnCours.current = true
    setPhase('envoi')

    const courant = await new Promise<Map<number, Reponse>>((resolve) => {
      setReponses((r) => {
        resolve(r)
        return r
      })
    })

    const tentatives = serie.groupes.flatMap((g) =>
      g.items.map((it) => {
        const rep = courant.get(it.id)
        const traitee = rep?.reponse != null && rep.confiance != null

        return {
          itemId: it.id,
          reponse: traitee ? rep!.reponse : null,
          nonTraitee: !traitee,
          tempsMs: rep?.tempsMs ?? 0,
          tempsPreparationMs: tempsPreparation.current.get(g.mediaId) ?? null,
          confiance: rep?.confiance ?? 1,
        }
      }),
    )

    await fetch('/api/listening/lot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: serie.sessionId, tentatives }),
    })

    setBilan({ total: tentatives.length, justes: 0 })
    setPhase('fini')
  }, [serie])

  const declarerConfiance = useCallback(
    (niveau: number) => {
      if (!item || !groupe || !serie) return

      setReponses((r) => {
        const copie = new Map(r)
        const existant = copie.get(item.id)
        if (existant) copie.set(item.id, { ...existant, confiance: niveau })
        return copie
      })

      if (iItem + 1 < groupe.items.length) {
        setIItem((i) => i + 1)
        debutItem.current = Date.now()
        setPhase('reponse')
        return
      }

      if (iGroupe + 1 < serie.groupes.length) {
        const suivant = serie.groupes[iGroupe + 1]
        setIGroupe((g) => g + 1)
        setIItem(0)
        demarrerGroupe(suivant)
        return
      }

      void terminer()
    },
    [groupe, iGroupe, iItem, item, serie, terminer],
  )

  /* -------------------------------------------------------- clavier -- */

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const k = e.key.toLowerCase()

      if (phase === 'preparation' && (k === 'enter' || k === ' ')) {
        e.preventDefault()
        lancerAudio()
        return
      }

      if (phase === 'reponse' && item) {
        const n = Number(k)
        if (Number.isInteger(n) && n >= 1 && n <= item.options.length) {
          e.preventDefault()
          repondre(LETTRES[n - 1])
          return
        }
        const l = LETTRES.indexOf(k.toUpperCase() as (typeof LETTRES)[number])
        if (l >= 0 && l < item.options.length) {
          e.preventDefault()
          repondre(LETTRES[l])
        }
        return
      }

      if (phase === 'confiance') {
        const n = Number(k)
        if (Number.isInteger(n) && n >= 1 && n <= 4) {
          e.preventDefault()
          declarerConfiance(n)
        }
      }
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [declarerConfiance, item, lancerAudio, phase, repondre])

  /* ----------------------------------------------------------- vues -- */

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
        <Link href="/toeic/audio" className="mt-4 inline-block text-sm text-accent hover:underline">
          Ouvrir l’atelier audio →
        </Link>
      </Centre>
    )
  }

  if (phase === 'fini' && bilan) {
    return (
      <Centre>
        <h1 className="text-2xl font-semibold">Série terminée</h1>
        <p className="mt-3 text-sm text-doux">
          {bilan.total} question{bilan.total > 1 ? 's' : ''} enregistrée
          {bilan.total > 1 ? 's' : ''}. La correction et l’analyse par accent sont sur la page
          TOEIC.
        </p>
        <div className="mt-8 flex gap-3">
          <Link
            href={`/toeic/listening?part=${part}`}
            className="rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-fond hover:opacity-90"
          >
            Nouvelle série
          </Link>
          <Link
            href="/toeic"
            className="rounded-lg border border-bord px-4 py-2.5 text-sm text-doux hover:text-texte"
          >
            Retour
          </Link>
        </div>
      </Centre>
    )
  }

  if (!serie || !groupe) return null

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 text-sm">
        <Link href="/toeic" className="text-doux hover:text-texte">
          ← Quitter
        </Link>
        <span className="text-doux">
          {serie.libelle} · enregistrement {iGroupe + 1}/{serie.groupes.length}
        </span>
        <span className="text-xs text-doux">accent {LIBELLE_ACCENT[groupe.accent]}</span>
      </div>

      {serie.ecartes > 0 && iGroupe === 0 && (
        <p className="mb-6 rounded-lg border border-bord bg-carte px-4 py-3 text-xs text-blanc">
          {serie.ecartes} question{serie.ecartes > 1 ? 's' : ''} écartée
          {serie.ecartes > 1 ? 's' : ''} faute d’audio synthétisé. Lire un transcript n’entraîne
          pas la compétence testée : mieux vaut l’écarter que la servir en silence.
        </p>
      )}

      {/* L'audio ne se joue qu'une fois : aucun contrôle, aucun rejeu. */}
      {phase === 'ecoute' && (
        <audio
          ref={audio}
          src={`/api/audio/${groupe.hash}`}
          onEnded={finAudio}
          onError={finAudio}
          className="hidden"
        />
      )}

      {phase === 'preparation' && (
        <Preparation
          groupe={groupe}
          secondes={compteARebours}
          onLancer={lancerAudio}
        />
      )}

      {phase === 'ecoute' && <Ecoute groupe={groupe} />}

      {phase === 'reponse' && item && (
        <Question
          item={item}
          numero={iItem + 1}
          total={groupe.items.length}
          onRepondre={repondre}
        />
      )}

      {phase === 'confiance' && item && (
        <Confiance
          lettre={reponses.get(item.id)?.reponse ?? null}
          onChoix={declarerConfiance}
        />
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

/**
 * Écran de préparation.
 *
 * C'est la compétence centrale des Part 3 et 4 : lire les questions pendant le
 * silence qui précède l'audio. Celui qui les découvre après l'écoute a déjà
 * perdu. Le temps réellement passé ici est mesuré.
 */
function Preparation({
  groupe,
  secondes,
  onLancer,
}: {
  groupe: Groupe
  secondes: number
  onLancer: () => void
}) {
  return (
    <div>
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="text-lg font-medium">Lis les questions maintenant</h2>
        <span className={`chiffres text-2xl ${secondes <= 5 ? 'text-faux' : 'text-texte'}`}>
          {secondes} s
        </span>
      </div>

      <div className="h-1 w-full overflow-hidden rounded bg-carte-clair">
        <div
          className="h-full bg-accent transition-all duration-1000 ease-linear"
          style={{ width: `${(secondes / groupe.secondesPreparation) * 100}%` }}
        />
      </div>

      <p className="mt-3 text-sm leading-relaxed text-doux">
        L’audio ne passera qu’une fois. Savoir ce qu’on cherche avant d’écouter est ce que cette
        partie teste réellement — pas la compréhension de l’anglais.
      </p>

      <ol className="mt-6 space-y-3">
        {groupe.items.map((it, i) => (
          <li key={it.id} className="rounded-lg border border-bord bg-carte px-4 py-3">
            <p className="text-sm">
              <span className="chiffres mr-2 text-doux">{i + 1}.</span>
              {it.enonce}
            </p>
            <ul className="mt-2 space-y-0.5 text-xs text-doux">
              {it.options.map((o, j) => (
                <li key={j}>
                  {LETTRES[j]}. {o}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>

      <button
        onClick={onLancer}
        className="mt-6 w-full rounded-lg bg-accent px-4 py-3 text-sm font-medium text-fond transition hover:opacity-90"
      >
        Lancer l’audio <span className="kbd ml-2">entrée</span>
      </button>
    </div>
  )
}

function Ecoute({ groupe }: { groupe: Groupe }) {
  return (
    <div className="py-10 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border-2 border-accent">
        <span className="h-3 w-3 animate-pulse rounded-full bg-accent" />
      </div>
      <p className="mt-6 text-lg">Écoute</p>
      <p className="mt-1 text-sm text-doux">
        Une seule fois, comme à l’examen. Pas de retour en arrière.
      </p>

      {groupe.questionsVisiblesAvant && (
        <ol className="mt-8 space-y-2 text-left">
          {groupe.items.map((it, i) => (
            <li key={it.id} className="rounded-lg border border-bord bg-carte px-4 py-2.5 text-sm">
              <span className="chiffres mr-2 text-doux">{i + 1}.</span>
              {it.enonce}
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}

function Question({
  item,
  numero,
  total,
  onRepondre,
}: {
  item: ItemListening
  numero: number
  total: number
  onRepondre: (l: string) => void
}) {
  return (
    <div>
      <p className="chiffres text-sm text-doux">
        Question {numero} / {total}
      </p>
      <h2 className="mt-2 text-lg leading-relaxed">{item.enonce}</h2>

      <ul className="mt-5 space-y-2">
        {item.options.map((texte, i) => (
          <li key={i}>
            <button
              onClick={() => onRepondre(LETTRES[i])}
              className="flex w-full items-start gap-3 rounded-lg border border-bord bg-carte px-4 py-3 text-left text-sm transition hover:border-accent hover:bg-carte-clair"
            >
              <span className="kbd mt-0.5">{i + 1}</span>
              <span className="font-medium text-doux">{LETTRES[i]}.</span>
              <span className="flex-1">{texte}</span>
            </button>
          </li>
        ))}
      </ul>

      <p className="mt-5 text-xs text-blanc">
        Aucune pénalité au TOEIC : réponds même si tu n’as pas compris. Tu as environ{' '}
        {SECONDES_REPONSE} secondes par question à l’examen.
      </p>
    </div>
  )
}

const NIVEAUX = [
  { n: 1, libelle: 'Au hasard', detail: 'Je n’ai pas compris' },
  { n: 2, libelle: 'Hésitant', detail: 'J’ai saisi des bribes' },
  { n: 3, libelle: 'Assez sûr', detail: 'J’ai compris l’essentiel' },
  { n: 4, libelle: 'Certain', detail: 'J’ai tout compris' },
]

function Confiance({ lettre, onChoix }: { lettre: string | null; onChoix: (n: number) => void }) {
  return (
    <div>
      <p className="text-sm text-doux">
        Réponse : <span className="font-medium text-texte">{lettre}</span>
      </p>
      <h2 className="mt-1 text-lg">À quel point es-tu sûr ?</h2>

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
    </div>
  )
}
