'use client'

import Link from 'next/link'
import { EnonceQuestion, Proposition } from '@/app/_composants/Enonce'
import type { Case, Figure } from '@/core/figures/types'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  OPTIONS_CONDITIONS_MINIMALES,
  RAPPEL_CONDITIONS_MINIMALES,
} from '@/exams/tagemage'
import { COUPURE_TOLEREE_MS, LIBELLE_MODE, type ModeEpreuve } from '@/exams/tagemage/epreuve'
import { poster } from '@/app/_composants/reseau'
import { lienBilanEpreuve } from '@/app/_composants/liens'
import Panne, { type EtatPanne } from '@/app/_composants/Panne'

const LETTRES = ['A', 'B', 'C', 'D', 'E'] as const

interface ItemEpreuve {
  id: number
  typeItem: 'qcm' | 'conditions_minimales'
  enonce: string
  contexteTexte: string | null
  info1: string | null
  info2: string | null
  options: string[]
  imageHash: string | null
  figure: Figure | null
  optionsFigure: Case[] | null
}

interface Etape {
  section: string
  numero: number
  libelle: string
  bloc: string
  questions: number
  secondes: number
  items: ItemEpreuve[]
  manquantes: number
}

/** État local d'une question pendant le sous-test. Rien n'est écrit avant la clôture. */
interface Reponse {
  reponse: string | null
  confiance: number | null
  saute: boolean
  marque: boolean
  tempsMs: number
}

type Phase = 'chargement' | 'erreur' | 'reprise' | 'brief' | 'question' | 'confiance' | 'envoi'

/* ------------------------------------------------------------ reprise -- */

/**
 * Sauvegarde locale d'une épreuve en cours.
 *
 * Rien n'est écrit en base avant la clôture d'un sous-test : c'est ce qui
 * garantit qu'aucune réponse n'y entre sans sa confiance. Mais un
 * rechargement, un onglet fermé ou une mise en veille effaçaient alors le
 * sous-test entier — jusqu'à vingt minutes — et laissaient une session
 * orpheline. Le navigateur garde donc l'état du sous-test en cours ; la base
 * reste la seule vérité sur ce qui a été ENREGISTRÉ.
 *
 * Le chronomètre est gelé pendant la coupure : c'est un outil de secours
 * après un accident, pas un moyen de réfléchir hors délai. La durée de la
 * coupure est donc transmise à la reprise : au-delà de quelques minutes
 * (COUPURE_TOLEREE_MS), l'épreuve n'est plus comptée en conditions réelles.
 * Au-delà du délai d'abandon (12 h, voir core/db/sessions.ts), elle ne se
 * reprend plus.
 */
interface Sauvegarde {
  sessionId: number
  complete: boolean
  iEtape: number
  iItem: number
  reponses: Reponse[]
  /** Temps restant du sous-test en cours ; null quand on est sur l'écran d'annonce. */
  restantMs: number | null
  sauveeLe: number
}

const DELAI_REPRISE_MS = 12 * 3600 * 1000
const cle = (mode: ModeEpreuve) => `prepa.epreuve.${mode}`
const cleEtapes = (mode: ModeEpreuve) => `prepa.epreuve.${mode}.etapes`

// Le stockage peut être indisponible (navigation privée, quota) : la reprise
// devient alors impossible, mais l'épreuve elle-même doit continuer.
function lireSauvegarde(mode: ModeEpreuve): { s: Sauvegarde; etapes: Etape[] } | null {
  try {
    const brut = localStorage.getItem(cle(mode))
    const etapes = localStorage.getItem(cleEtapes(mode))
    if (!brut || !etapes) return null
    const s = JSON.parse(brut) as Sauvegarde
    if (Date.now() - s.sauveeLe > DELAI_REPRISE_MS) return null
    return { s, etapes: JSON.parse(etapes) as Etape[] }
  } catch {
    return null
  }
}

function ecrireSauvegarde(mode: ModeEpreuve, s: Sauvegarde) {
  try {
    localStorage.setItem(cle(mode), JSON.stringify(s))
  } catch {
    /* sans stockage, pas de reprise — l'épreuve continue */
  }
}

function ecrireEtapes(mode: ModeEpreuve, etapes: Etape[]) {
  try {
    localStorage.setItem(cleEtapes(mode), JSON.stringify(etapes))
  } catch {
    /* idem */
  }
}

function effacerSauvegarde(mode: ModeEpreuve) {
  try {
    localStorage.removeItem(cle(mode))
    localStorage.removeItem(cleEtapes(mode))
  } catch {
    /* rien à effacer */
  }
}

interface EtatSessionServeur {
  reprenable: boolean
  sectionsEnregistrees: string[]
}

type Preparation =
  | {
      type: 'reprise'
      s: Sauvegarde
      etapes: Etape[]
      etat: EtatSessionServeur
      /** Quand la reprise a été proposée : mesure la coupure hors du rendu. */
      constateeLe: number
    }
  | { type: 'nouvelle'; data: { sessionId: number; etapes: Etape[]; complete: boolean } }

async function demarrer(mode: ModeEpreuve): Promise<Preparation> {
  return {
    type: 'nouvelle',
    data: await poster<{ sessionId: number; etapes: Etape[]; complete: boolean }>(
      '/api/epreuve/start',
      { mode },
    ),
  }
}

/** Reprise possible ? Sinon, une épreuve neuve. */
async function preparer(mode: ModeEpreuve): Promise<Preparation> {
  const sauvegarde = lireSauvegarde(mode)
  if (sauvegarde) {
    const etat = await poster<EtatSessionServeur>('/api/session', {
      action: 'etat',
      sessionId: sauvegarde.s.sessionId,
    }).catch(() => null)
    if (etat?.reprenable) return { type: 'reprise', ...sauvegarde, etat, constateeLe: Date.now() }
    effacerSauvegarde(mode)
  }
  return demarrer(mode)
}

const vide = (): Reponse => ({
  reponse: null,
  confiance: null,
  saute: false,
  marque: false,
  tempsMs: 0,
})

const mmss = (s: number) =>
  `${Math.floor(Math.max(0, s) / 60)}:${String(Math.max(0, s) % 60).padStart(2, '0')}`

export default function EpreuveClient({ mode }: { mode: ModeEpreuve }) {
  const router = useRouter()

  const [phase, setPhase] = useState<Phase>('chargement')
  const [erreur, setErreur] = useState('')
  const [sessionId, setSessionId] = useState<number | null>(null)
  const [etapes, setEtapes] = useState<Etape[]>([])
  const [complete, setComplete] = useState(true)

  const [iEtape, setIEtape] = useState(0)
  const [iItem, setIItem] = useState(0)
  const [reponses, setReponses] = useState<Reponse[]>([])
  const [restant, setRestant] = useState(0)
  /** Un lot qui n'est pas passé, et de quoi le rejouer sans perdre le sous-test. */
  const [enPanne, setEnPanne] = useState<EtatPanne | null>(null)

  const debutItem = useRef(0)
  /** La clôture courante, pour « Réessayer » : rappelée telle qu'elle est au clic. */
  const cloturerCourant = useRef<() => Promise<void>>(async () => {})
  const finSection = useRef<number>(0)
  const cloture = useRef(false)

  const etape = etapes[iEtape]
  const item = etape?.items[iItem]

  /* ------------------------------------------------------- démarrage -- */

  // Même raison qu'au drill : le mode strict fait partir l'effet deux fois, et
  // `/api/epreuve/start` crée une session à chaque appel. On garde la promesse
  // dans une référence pour que le second passage s'abonne à la première
  // requête au lieu d'en lancer une nouvelle.
  const demande = useRef<{ cle: string; p: Promise<Preparation> } | null>(null)
  /** Une épreuve retrouvée dans ce navigateur, en attente du choix : reprendre ou recommencer. */
  const [aReprendre, setAReprendre] = useState<Extract<Preparation, { type: 'reprise' }> | null>(
    null,
  )

  const installerNouvelle = useCallback(
    (data: { sessionId: number; etapes: Etape[]; complete: boolean }) => {
      setSessionId(data.sessionId)
      setEtapes(data.etapes)
      setComplete(data.complete)
      setIEtape(0)
      setIItem(0)
      setReponses(data.etapes[0].items.map(vide))
      ecrireEtapes(mode, data.etapes)
      setPhase('brief')
    },
    [mode],
  )

  useEffect(() => {
    let annule = false

    if (demande.current?.cle !== mode) {
      demande.current = { cle: mode, p: preparer(mode) }
    }

    demande.current.p.then(
      (prep) => {
        if (annule) return
        if (prep.type === 'reprise') {
          setAReprendre(prep)
          setPhase('reprise')
        } else {
          installerNouvelle(prep.data)
        }
      },
      (e: unknown) => {
        if (annule) return
        setErreur((e as Error).message)
        setPhase('erreur')
      },
    )

    return () => {
      annule = true
    }
  }, [mode, installerNouvelle])

  /** Reprend l'épreuve sauvegardée là où la base et le navigateur la situent. */
  const reprendre = useCallback(async () => {
    if (!aReprendre) return
    const { s, etapes: sauvees, etat } = aReprendre

    // La base fait foi sur ce qui est enregistré : si le lot du sous-test en
    // cours est parti juste avant la coupure, on passe au suivant.
    let i = s.iEtape
    while (i < sauvees.length && etat.sectionsEnregistrees.includes(sauvees[i].section)) i++

    // La sauvegarde est réécrite chaque seconde : son heure date la coupure.
    await poster('/api/session', {
      action: 'coupure',
      sessionId: s.sessionId,
      ms: Math.max(0, Date.now() - s.sauveeLe),
    }).catch(() => undefined)

    setSessionId(s.sessionId)
    setEtapes(sauvees)
    setComplete(s.complete)
    setAReprendre(null)

    if (i >= sauvees.length) {
      // Tout était enregistré : il ne manquait que la clôture.
      setPhase('envoi')
      try {
        await poster('/api/epreuve/finish', { sessionId: s.sessionId })
        effacerSauvegarde(mode)
        router.push(lienBilanEpreuve(s.sessionId))
      } catch (e) {
        setErreur((e as Error).message)
        setPhase('erreur')
      }
      return
    }

    setIEtape(i)
    if (i === s.iEtape && s.restantMs !== null) {
      // Même sous-test, en plein passage : réponses et temps restant retrouvés.
      setReponses(s.reponses)
      setIItem(s.iItem)
      finSection.current = Date.now() + Math.max(0, s.restantMs)
      debutItem.current = Date.now()
      setRestant(Math.ceil(Math.max(0, s.restantMs) / 1000))
      setPhase('question')
    } else {
      setReponses(i === s.iEtape ? s.reponses : sauvees[i].items.map(vide))
      setIItem(0)
      setPhase('brief')
    }
  }, [aReprendre, mode, router])

  /** Abandonne l'épreuve retrouvée et en lance une neuve. */
  const recommencer = useCallback(async () => {
    if (!aReprendre) return
    setPhase('chargement')
    await poster('/api/session', { action: 'abandonner', sessionId: aReprendre.s.sessionId }).catch(
      () => undefined,
    )
    effacerSauvegarde(mode)
    setAReprendre(null)
    try {
      const prep = await demarrer(mode)
      if (prep.type === 'nouvelle') installerNouvelle(prep.data)
    } catch (e) {
      setErreur((e as Error).message)
      setPhase('erreur')
    }
  }, [aReprendre, installerNouvelle, mode])

  /** Abandon depuis l'écran d'annonce : la session est rangée tout de suite. */
  const abandonner = useCallback(async () => {
    if (sessionId !== null) {
      await poster('/api/session', { action: 'abandonner', sessionId }).catch(() => undefined)
    }
    effacerSauvegarde(mode)
    router.push('/tagemage')
  }, [mode, router, sessionId])

  /* ------------------------------------------------------ sauvegarde -- */

  // L'état du sous-test en cours, à chaque changement et chaque seconde.
  useEffect(() => {
    if (sessionId === null) return
    if (phase !== 'brief' && phase !== 'question' && phase !== 'confiance') return
    ecrireSauvegarde(mode, {
      sessionId,
      complete,
      iEtape,
      iItem,
      reponses,
      restantMs: phase === 'brief' ? null : Math.max(0, finSection.current - Date.now()),
      sauveeLe: Date.now(),
    })
  }, [complete, iEtape, iItem, mode, phase, reponses, restant, sessionId])

  // Fermer l'onglet en plein passage demande confirmation. La reprise existe,
  // mais un geste involontaire ne doit pas suspendre une épreuve.
  useEffect(() => {
    if (sessionId === null) return
    if (phase !== 'question' && phase !== 'confiance' && phase !== 'envoi') return
    const retenir = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', retenir)
    return () => window.removeEventListener('beforeunload', retenir)
  }, [phase, sessionId])

  /* ------------------------------------------- comptabilisation du temps -- */

  const capitaliserTemps = useCallback((index: number) => {
    const ecoule = Date.now() - debutItem.current
    debutItem.current = Date.now()
    setReponses((r) => {
      if (!r[index]) return r
      const copie = [...r]
      copie[index] = { ...copie[index], tempsMs: copie[index].tempsMs + ecoule }
      return copie
    })
  }, [])

  /* --------------------------------------------------- clôture du lot -- */

  const cloturerSection = useCallback(async () => {
    if (cloture.current || sessionId === null || !etape) return
    cloture.current = true
    capitaliserTemps(iItem)
    setPhase('envoi')

    // On lit l'état le plus frais possible via le setter, plutôt que la closure.
    const courant = await new Promise<Reponse[]>((resolve) => {
      setReponses((r) => {
        resolve(r)
        return r
      })
    })

    const tentatives = etape.items.map((it, i) => {
      const rep = courant[i] ?? vide()
      const repondue = rep.reponse !== null && rep.confiance !== null

      return {
        itemId: it.id,
        reponse: repondue ? rep.reponse : null,
        aSaute: !repondue,
        // Un saut assumé et une question jamais atteinte valent 0 toutes les deux,
        // mais elles ne racontent pas la même chose dans le bilan.
        motifBlanc: repondue ? null : rep.saute ? ('saute' as const) : ('non_traite' as const),
        tempsMs: rep.tempsMs,
        confiance: rep.confiance ?? 1,
      }
    })

    // C'est ici que se joue le plus gros risque de perte : quinze réponses
    // d'un sous-test partent en un seul appel. Sans reprise ni rattrapage,
    // une coupure d'une seconde effaçait vingt minutes d'épreuve.
    try {
      setEnPanne(null)
      await poster('/api/epreuve/lot', { sessionId, tentatives })

      if (iEtape + 1 < etapes.length) {
        setIEtape((n) => n + 1)
        setIItem(0)
        setReponses(etapes[iEtape + 1].items.map(vide))
        cloture.current = false
        setPhase('brief')
      } else {
        await poster('/api/epreuve/finish', { sessionId })
        effacerSauvegarde(mode)
        router.push(lienBilanEpreuve(sessionId))
      }
    } catch (e) {
      // On garde l'état intact et on rouvre la porte : `cloture` repasse à
      // false pour que la reprise puisse rejouer le même envoi.
      cloture.current = false
      setEnPanne({ message: (e as Error).message, rejouer: () => void cloturerCourant.current() })
      setPhase('question')
    }
  }, [capitaliserTemps, etape, etapes, iEtape, iItem, mode, router, sessionId])
  useEffect(() => {
    cloturerCourant.current = cloturerSection
  }, [cloturerSection])

  /* ------------------------------------------------------ chronomètre -- */

  useEffect(() => {
    if (phase !== 'question' && phase !== 'confiance') return

    const tick = () => {
      const s = Math.ceil((finSection.current - Date.now()) / 1000)
      setRestant(s)
      // Un envoi en panne rouvre `cloture` pour permettre la reprise : sans
      // cette garde, le minuteur relancerait la clôture toutes les 250 ms et
      // le bouton « Réessayer » serait inatteignable.
      if (s <= 0 && !enPanne) void cloturerSection()
    }

    tick()
    const t = setInterval(tick, 250)
    return () => clearInterval(t)
  }, [phase, cloturerSection, enPanne])

  /* ------------------------------------------------------- navigation -- */

  const allerA = useCallback(
    (index: number) => {
      if (!etape || index < 0 || index >= etape.items.length) return
      capitaliserTemps(iItem)
      setIItem(index)
      setPhase('question')
    },
    [capitaliserTemps, etape, iItem],
  )

  /** Après une réponse, on saute à la prochaine question encore vierge. */
  const avancer = useCallback(
    (depuis: number, etat: Reponse[]) => {
      if (!etape) return
      for (let k = 1; k <= etape.items.length; k++) {
        const j = (depuis + k) % etape.items.length
        const r = etat[j]
        if (r && r.reponse === null && !r.saute) {
          allerA(j)
          return
        }
      }
      allerA(Math.min(depuis + 1, etape.items.length - 1))
    },
    [allerA, etape],
  )

  const repondre = useCallback(
    (lettre: string) => {
      capitaliserTemps(iItem)
      setReponses((r) => {
        const copie = [...r]
        copie[iItem] = { ...copie[iItem], reponse: lettre, saute: false }
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

  const sauter = useCallback(() => {
    capitaliserTemps(iItem)
    setReponses((r) => {
      const copie = [...r]
      copie[iItem] = { ...copie[iItem], reponse: null, confiance: null, saute: true }
      setTimeout(() => avancer(iItem, copie), 0)
      return copie
    })
  }, [avancer, capitaliserTemps, iItem])

  const marquer = useCallback(() => {
    setReponses((r) => {
      const copie = [...r]
      copie[iItem] = { ...copie[iItem], marque: !copie[iItem].marque }
      return copie
    })
  }, [iItem])

  const demarrerSection = useCallback(() => {
    if (!etape) return
    finSection.current = Date.now() + etape.secondes * 1000
    debutItem.current = Date.now()
    setRestant(etape.secondes)
    setPhase('question')
  }, [etape])

  /* ---------------------------------------------------------- clavier -- */

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const k = e.key.toLowerCase()

      if (phase === 'brief') {
        if (k === 'enter' || k === ' ') {
          e.preventDefault()
          demarrerSection()
        }
        return
      }

      // Pendant la déclaration de confiance, la navigation est verrouillée :
      // c'est ce qui garantit qu'une réponse ne peut pas être enregistrée sans
      // sa confiance.
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

      const nb = item.typeItem === 'conditions_minimales' ? 5 : item.options.length
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

      if (k === ' ') {
        e.preventDefault()
        sauter()
      } else if (k === 'arrowright') {
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
  }, [
    allerA,
    declarerConfiance,
    demarrerSection,
    iItem,
    item,
    marquer,
    phase,
    repondre,
    sauter,
  ])

  /* ------------------------------------------------------------- vues -- */

  const traitees = useMemo(
    () => reponses.filter((r) => (r.reponse !== null && r.confiance !== null) || r.saute).length,
    [reponses],
  )

  if (phase === 'chargement' || phase === 'envoi') {
    return (
      <Centre>
        <p className="text-doux">{phase === 'envoi' ? 'Enregistrement du sous-test…' : 'Préparation…'}</p>
      </Centre>
    )
  }

  if (phase === 'erreur') {
    return (
      <Centre>
        <p className="text-faux">{erreur}</p>
        <Link href="/atelier" className="mt-4 inline-block text-sm text-accent hover:underline">
          Ouvrir l’atelier →
        </Link>
      </Centre>
    )
  }

  if (phase === 'reprise' && aReprendre) {
    const { s, etapes: sauvees, etat } = aReprendre
    const faits = sauvees.filter((e) => etat.sectionsEnregistrees.includes(e.section)).length
    const minutes = Math.round((aReprendre.constateeLe - s.sauveeLe) / 60000)
    return (
      <main className="mx-auto max-w-xl px-6 py-20">
        <p className="text-sm uppercase tracking-widest text-doux">{LIBELLE_MODE[mode]}</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">Une épreuve est en cours</h1>
        <p className="mt-3 text-sm leading-relaxed text-doux">
          Commencée dans ce navigateur, quittée{' '}
          {minutes < 1
            ? 'à l’instant'
            : minutes < 60
              ? `il y a ${minutes} min`
              : `il y a ${Math.round(minutes / 60)} h`}
          .{' '}
          {faits} sous-test{faits > 1 ? 's' : ''} sur {sauvees.length} déjà enregistré
          {faits > 1 ? 's' : ''}
          {s.restantMs !== null &&
            ` ; le sous-test en cours reprend avec ses réponses et ${Math.ceil(s.restantMs / 60000)} min restantes`}
          . Le chronomètre était arrêté pendant l’interruption.
        </p>
        {minutes * 60000 > COUPURE_TOLEREE_MS && (
          <p className="mt-3 rounded-lg border border-bord bg-carte px-4 py-3 text-sm leading-relaxed text-blanc">
            Plus de {Math.round(COUPURE_TOLEREE_MS / 60000)} minutes de coupure : chronomètre arrêté, tu as pu
            réfléchir hors du temps. L’épreuve gardera son score, mais ne comptera plus en conditions
            réelles.
          </p>
        )}
        <button
          onClick={() => void reprendre()}
          className="mt-8 w-full rounded-lg bg-accent px-4 py-3 text-sm font-medium text-fond transition hover:opacity-90"
        >
          Reprendre l’épreuve
        </button>
        <button
          onClick={() => void recommencer()}
          className="mt-3 w-full rounded-lg border border-bord px-4 py-3 text-sm text-doux transition hover:text-texte"
        >
          L’abandonner et en commencer une nouvelle
        </button>
        <p className="mt-3 text-xs leading-relaxed text-doux">
          Abandonnée, elle garde ses réponses déjà enregistrées pour la stratégie et le carnet,
          mais ne compte comme aucune épreuve passée.
        </p>
      </main>
    )
  }

  if (!etape) return null

  if (phase === 'brief') {
    return (
      <Brief
        etape={etape}
        position={iEtape + 1}
        total={etapes.length}
        mode={mode}
        complete={complete}
        onDemarrer={demarrerSection}
        onAbandonner={() => void abandonner()}
      />
    )
  }

  const options =
    item!.typeItem === 'conditions_minimales' ? OPTIONS_CONDITIONS_MINIMALES : item!.options
  const urgence = restant <= 120

  return (
    <main className="mx-auto max-w-2xl px-6 py-8">
      <div className="mb-4 flex items-center justify-between text-sm">
        <span className="text-doux">
          <span className="chiffres">{etape.numero}</span>. {etape.libelle}
          <span className="ml-2 opacity-60">
            sous-test {iEtape + 1}/{etapes.length}
          </span>
        </span>
        <span className={`chiffres text-lg tabular-nums ${urgence ? 'text-faux' : 'text-texte'}`}>
          {mmss(restant)}
        </span>
      </div>

      <div className="h-1 w-full overflow-hidden rounded bg-carte-clair">
        <div
          className={`h-full transition-all ${urgence ? 'bg-faux' : 'bg-accent'}`}
          style={{ width: `${Math.max(0, (restant / etape.secondes) * 100)}%` }}
        />
      </div>

      {enPanne && <Panne etat={enPanne} />}

      <Grille
        reponses={reponses}
        courant={iItem}
        actif={phase === 'question'}
        onAller={allerA}
      />

      {phase === 'question' ? (
        <>
          {item!.contexteTexte && (
            <>
              {/* La sélection sert désormais trois textes de cinq questions,
                  comme à l'épreuve. Le dire ici évite de croire qu'on change de
                  passage à chaque question — et signale qu'une lecture va
                  resservir quatre fois. */}
              <RepereTexte items={etape.items} courant={item!} />
              <div className="mt-2 max-h-64 overflow-y-auto rounded-lg border border-bord bg-carte p-5 text-sm leading-relaxed text-doux">
                {item!.contexteTexte}
              </div>
            </>
          )}

          <EnonceQuestion
            enonce={item!.enonce}
            figure={item!.figure}
            imageHash={item!.imageHash}
            className="mt-6"
          />

          {item!.typeItem === 'conditions_minimales' && (
            <div className="mt-4 space-y-2 rounded-lg border border-bord bg-carte p-5 text-sm">
              <p>
                <span className="mr-2 text-doux">(1)</span>
                {item!.info1}
              </p>
              <p>
                <span className="mr-2 text-doux">(2)</span>
                {item!.info2}
              </p>
              <p className="mt-3 border-t border-bord pt-3 text-xs text-blanc">
                {RAPPEL_CONDITIONS_MINIMALES}
              </p>
            </div>
          )}

          <ul className="mt-5 space-y-2">
            {options.map((texte, i) => {
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
                    <span className="flex-1">
                      <Proposition texte={texte} c={item!.optionsFigure?.[i]} />
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-xs text-doux">
            <div className="flex gap-4">
              <button onClick={sauter} className="hover:text-texte">
                <span className="kbd mr-1.5">espace</span> Sauter
              </button>
              <button onClick={marquer} className="hover:text-texte">
                <span className="kbd mr-1.5">M</span>
                {reponses[iItem]?.marque ? 'Retirer la marque' : 'Marquer'}
              </button>
              <span>
                <span className="kbd mr-1.5">←</span>
                <span className="kbd mr-1.5">→</span> Naviguer
              </span>
            </div>
            <button
              onClick={() => void cloturerSection()}
              className="rounded-lg border border-bord px-3 py-1.5 text-doux transition hover:border-faux hover:text-texte"
            >
              Valider le sous-test ({traitees}/{etape.items.length})
            </button>
          </div>
        </>
      ) : (
        <Confiance
          lettre={reponses[iItem]?.reponse}
          onChoix={declarerConfiance}
        />
      )}
    </main>
  )
}

/* --------------------------------------------------------- sous-vues -- */

/**
 * « Texte 2 / 3 · question 3 sur 5 de ce texte ».
 *
 * Sans ce repère, la sélection groupée est invisible : on croit changer de
 * passage à chaque question alors que celui qu'on vient de lire va resservir
 * quatre fois. C'est cette information-là qui permet d'investir dans la lecture.
 */
function RepereTexte({ items, courant }: { items: ItemEpreuve[]; courant: ItemEpreuve }) {
  const textes = [...new Set(items.map((i) => i.contexteTexte).filter(Boolean))]
  if (textes.length < 2) return null

  const duTexte = items.filter((i) => i.contexteTexte === courant.contexteTexte)

  return (
    <p className="mt-6 text-xs uppercase tracking-widest text-doux">
      Texte {textes.indexOf(courant.contexteTexte) + 1} / {textes.length} · question{' '}
      {duTexte.findIndex((i) => i.id === courant.id) + 1} sur {duTexte.length} de ce texte
    </p>
  )
}

function Centre({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center px-6 text-center">
      {children}
    </main>
  )
}

function Brief({
  etape,
  position,
  total,
  mode,
  complete,
  onDemarrer,
  onAbandonner,
}: {
  etape: Etape
  position: number
  total: number
  mode: ModeEpreuve
  complete: boolean
  onDemarrer: () => void
  onAbandonner: () => void
}) {
  return (
    <main className="mx-auto max-w-xl px-6 py-20">
      <p className="text-sm uppercase tracking-widest text-doux">
        {LIBELLE_MODE[mode]} · sous-test {position} / {total}
      </p>

      <h1 className="mt-3 text-3xl font-semibold tracking-tight">
        <span className="chiffres mr-2 text-doux">{etape.numero}.</span>
        {etape.libelle}
      </h1>
      <p className="mt-1 text-sm text-doux">{etape.bloc}</p>

      <div className="mt-8 grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-bord bg-carte px-5 py-4">
          <p className="chiffres text-2xl font-semibold">{etape.items.length}</p>
          <p className="text-xs text-doux">questions</p>
        </div>
        <div className="rounded-xl border border-bord bg-carte px-5 py-4">
          <p className="chiffres text-2xl font-semibold">{Math.round(etape.secondes / 60)}</p>
          <p className="text-xs text-doux">minutes</p>
        </div>
      </div>

      {etape.manquantes > 0 && (
        <p className="mt-4 rounded-lg border border-bord bg-carte px-4 py-3 text-sm text-blanc">
          {etape.manquantes} question{etape.manquantes > 1 ? 's' : ''} manque
          {etape.manquantes > 1 ? 'nt' : ''} en banque pour ce sous-test. Le score restera une
          estimation sur un échantillon réduit.
        </p>
      )}

      {position === 1 && !complete && (
        <p className="mt-3 text-xs text-doux">
          L’épreuve n’est pas au format complet : elle ne sera pas comptée comme passée en
          conditions réelles.
        </p>
      )}

      <div className="mt-8 rounded-xl border border-bord bg-carte px-5 py-4 text-sm leading-relaxed text-doux">
        Le chronomètre démarre dès que tu lances le sous-test et ne s’arrête plus. À la fin du
        temps, ce qui n’a pas été traité est compté comme non traité — c’est une information
        différente d’un saut assumé, et le bilan les sépare. Aucune correction avant la fin de
        l’épreuve.
      </div>

      <button
        onClick={onDemarrer}
        className="mt-8 w-full rounded-lg bg-accent px-4 py-3 text-sm font-medium text-fond transition hover:opacity-90"
      >
        Lancer le sous-test <span className="kbd ml-2">entrée</span>
      </button>

      <button
        onClick={onAbandonner}
        className="mt-4 block w-full text-center text-xs text-doux hover:text-texte"
      >
        Abandonner
      </button>
    </main>
  )
}

function Grille({
  reponses,
  courant,
  actif,
  onAller,
}: {
  reponses: Reponse[]
  courant: number
  actif: boolean
  onAller: (i: number) => void
}) {
  return (
    <div className="mt-5 flex flex-wrap gap-1.5">
      {reponses.map((r, i) => {
        const traitee = r.reponse !== null && r.confiance !== null
        const couleur = traitee
          ? 'bg-accent text-fond border-accent'
          : r.saute
            ? 'border-blanc text-blanc'
            : 'border-bord text-doux'

        return (
          <button
            key={i}
            disabled={!actif}
            onClick={() => onAller(i)}
            title={r.marque ? 'Marquée pour révision' : undefined}
            className={`chiffres relative h-7 w-7 rounded border text-xs transition disabled:cursor-default ${couleur} ${
              i === courant ? 'ring-2 ring-texte ring-offset-2 ring-offset-[var(--fond)]' : ''
            }`}
          >
            {i + 1}
            {r.marque && (
              <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-blanc" />
            )}
          </button>
        )
      })}
    </div>
  )
}

const NIVEAUX = [
  { n: 1, libelle: 'Au hasard', detail: 'Je n’ai rien pu éliminer' },
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
        <span className="kbd mr-2">échap</span> annuler la réponse · le chronomètre continue
      </p>
    </div>
  )
}
