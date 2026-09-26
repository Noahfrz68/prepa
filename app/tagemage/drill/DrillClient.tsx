'use client'

import Link from 'next/link'
import { EnonceQuestion, EnonceRappel, Proposition } from '@/app/_composants/Enonce'
import type { Case, Figure } from '@/core/figures/types'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import DebriefIA from '@/app/_composants/DebriefIA'
import GroupeComprehension, { type ReponseGroupe } from './GroupeComprehension'
import { poster } from '@/app/_composants/reseau'
import Panne, { type EtatPanne } from '@/app/_composants/Panne'
import Difficulte from '@/app/_composants/Difficulte'
import TempsCorrection from '@/app/_composants/TempsCorrection'
import ManqueAGagner from '@/app/_composants/ManqueAGagner'
import type { DifficulteObservee } from '@/core/stats/difficulte'
import {
  OPTIONS_CONDITIONS_MINIMALES,
  RAPPEL_CONDITIONS_MINIMALES,
  SECONDES_PAR_QUESTION,
  SECTIONS_PAR_ID,
  lettreConditionsMinimales,
  type SectionTageMage,
} from '@/exams/tagemage'

const LETTRES = ['A', 'B', 'C', 'D', 'E'] as const

interface ItemDrill {
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

interface Correction {
  difficulte?: DifficulteObservee | null
  itemId: number
  enonce: string
  typeItem: 'qcm' | 'conditions_minimales'
  options: string[]
  figure: Figure | null
  optionsFigure: Case[] | null
  bonneReponse: string
  reponseDonnee: string | null
  aSaute: boolean
  estCorrect: boolean
  tempsMs: number
  confiance: number
  points: number
  explication: string | null
  rappel: string | null
  diagnostic: string | null
  skillId: string | null
}

interface Recap {
  resultat: {
    nbItems: number
    justes: number
    fausses: number
    blanches: number
    pointsBruts: number
    scoreExtrapole: number
    tauxReussite: number
  }
  tempsTotalMs: number
  corrections: Correction[]
}

type Phase = 'chargement' | 'erreur' | 'question' | 'confiance' | 'recap'

export default function DrillClient({
  section,
  taille,
  skills = [],
  carnet = false,
  revanche,
  sprint = false,
}: {
  section: SectionTageMage
  taille: number
  skills?: string[]
  carnet?: boolean
  /** Question ratée dont on rejoue le modèle (voir questionsDeRevanche). */
  revanche?: number
  /** Un seul chronomètre pour toute la série, 80 s par question, comme un sous-test. */
  sprint?: boolean
}) {
  const spec = SECTIONS_PAR_ID.get(section)
  // En mode carnet la série peut traverser les sous-tests : le bandeau annonce
  // alors le carnet, pas une section qui n’existe pas.
  const titre = carnet ? `Carnet d’erreurs${spec ? ` · ${spec.libelle}` : ''}` : spec?.libelle

  const [phase, setPhase] = useState<Phase>('chargement')
  const [erreur, setErreur] = useState<string>('')
  const [sessionId, setSessionId] = useState<number | null>(null)
  const [items, setItems] = useState<ItemDrill[]>([])
  const [index, setIndex] = useState(0)
  const [reponse, setReponse] = useState<string | null>(null)
  const [recap, setRecap] = useState<Recap | null>(null)
  const [ecoule, setEcoule] = useState(0)
  /** Temps écoulé depuis le début de la série, relevé par le même chronomètre. */
  const [ecouleSerie, setEcouleSerie] = useState(0)
  /** Un envoi qui n'est pas passé, et de quoi le rejouer sans rien perdre. */
  const [enPanne, setEnPanne] = useState<EtatPanne | null>(null)

  const debutItem = useRef<number>(Date.now())
  /** Début de la série : sert au rythme cumulé et au chronomètre du sprint. */
  const debutSerie = useRef<number>(0)
  const sprintClos = useRef(false)
  const tempsReponse = useRef<number>(0)
  const enCours = useRef(false)
  /** Conditions minimales : répondre par l'arbre de décision plutôt que par les cinq propositions. */
  const [arbre, setArbre] = useState(false)

  const item = items[index]

  /**
   * La compréhension se joue par TEXTES : un passage, ses cinq questions
   * dessous, comme à l'épreuve. On regroupe les items servis par leur texte
   * support — la sélection les a déjà rendus dans cet ordre.
   *
   * L'exception assumée est le travail ciblé : carnet d'erreurs ou révision
   * d'un seul type de question. On y accepte une question sous son texte,
   * faute de pouvoir réunir cinq questions du même type sur le même passage.
   */
  const groupes = useMemo(() => {
    if (section !== 'comprehension' || carnet || skills.length > 0) return null
    const parTexte: Array<{ texte: string; items: ItemDrill[] }> = []
    for (const it of items) {
      if (!it.contexteTexte) return null
      const dernier = parTexte[parTexte.length - 1]
      if (dernier && dernier.texte === it.contexteTexte) dernier.items.push(it)
      else parTexte.push({ texte: it.contexteTexte, items: [it] })
    }
    return parTexte.length > 0 ? parTexte : null
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, section, carnet, skills.join(',')])

  const [indexGroupe, setIndexGroupe] = useState(0)

  /** Enregistre les cinq tentatives d'un texte, puis passe au suivant. */
  const validerGroupe = useCallback(
    async (reponses: ReponseGroupe[]) => {
      if (sessionId === null || enCours.current) return
      enCours.current = true
      setEnPanne(null)
      try {
        for (const r of reponses) {
          await poster('/api/drill/attempt', { sessionId, ...r })
        }

        if (groupes && indexGroupe + 1 < groupes.length) {
          setIndexGroupe((i) => i + 1)
          window.scrollTo({ top: 0 })
        } else {
          setPhase('chargement')
          setRecap(await poster<Recap>('/api/drill/finish', { sessionId }))
          setPhase('recap')
        }
      } catch (e) {
        // Cinq réponses d'un coup : les perdre coûterait le texte entier.
        setEnPanne({
          message: (e as Error).message,
          rejouer: () => void validerGroupe(reponses),
        })
        setPhase('question')
      } finally {
        enCours.current = false
      }
    },
    [groupes, indexGroupe, sessionId],
  )

  /* ------------------------------------------------------- démarrage -- */

  // Le mode strict de React monte, démonte et remonte chaque composant en
  // développement — et une application locale tourne TOUJOURS en développement.
  // L'effet partait donc deux fois, et comme `/api/drill/start` crée une
  // session avant de répondre, chaque série en laissait une seconde, vide,
  // derrière elle. Deux tiers des sessions de la base étaient des fantômes.
  //
  // Annuler l'abonnement ne suffit pas : la requête est déjà partie. On garde
  // donc la PROMESSE dans une référence, et le second passage s'abonne à la
  // même — une seule requête, une seule session, et l'état est bien posé.
  const demande = useRef<{
    cle: string
    p: Promise<{ sessionId: number; items: ItemDrill[] }>
  } | null>(null)

  useEffect(() => {
    let annule = false
    const cle = `${section}|${taille}|${skills.join(',')}|${carnet}|${revanche ?? ''}`

    if (demande.current?.cle !== cle) {
      demande.current = {
        cle,
        p: poster<{ sessionId: number; items: ItemDrill[] }>('/api/drill/start', {
          section,
          taille,
          skills,
          carnet,
          revanche,
        }),
      }
    }

    demande.current.p.then(
      (data) => {
        if (annule) return
        setSessionId(data.sessionId)
        setItems(data.items)
        debutItem.current = Date.now()
        debutSerie.current = Date.now()
        setPhase('question')
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section, taille, skills.join(','), carnet, revanche])

  /* ---------------------------------------------------------- chrono -- */

  // Le chronomètre tourne aussi pendant la déclaration de confiance : en
  // sprint, c'est du temps de sous-test comme un autre.
  useEffect(() => {
    if (phase !== 'question' && phase !== 'confiance') return
    const t = setInterval(() => {
      const maintenant = Date.now()
      setEcoule(maintenant - debutItem.current)
      setEcouleSerie(maintenant - debutSerie.current)
    }, 200)
    return () => clearInterval(t)
  }, [phase, index])

  /* ------------------------------------------------ enregistrement -- */

  /**
   * Enregistre une réponse, puis avance.
   *
   * Le `try { … } finally` d'origine n'avait pas de `catch` : un serveur
   * injoignable une seconde faisait remonter « Failed to fetch » jusqu'à
   * l'écran d'erreur de Next.js, et la série entière était perdue. On reprend
   * donc trois fois, et si ça ne passe toujours pas on GARDE la réponse en
   * mémoire pour que l'utilisateur puisse la renvoyer — plutôt que de le
   * renvoyer à l'accueil avec vingt minutes de travail effacées.
   */
  const envoyer = useCallback(
    async (payload: { reponse: string | null; aSaute: boolean; tempsMs: number; confiance: number }) => {
      if (enCours.current || sessionId === null || !item) return
      enCours.current = true
      setEnPanne(null)
      try {
        await poster('/api/drill/attempt', { sessionId, itemId: item.id, ...payload })

        if (index + 1 < items.length) {
          setIndex((i) => i + 1)
          setReponse(null)
          debutItem.current = Date.now()
          setEcoule(0)
          setPhase('question')
        } else {
          setPhase('chargement')
          setRecap(await poster<Recap>('/api/drill/finish', { sessionId }))
          setPhase('recap')
        }
      } catch (e) {
        setEnPanne({ message: (e as Error).message, rejouer: () => void envoyer(payload) })
        // On revient à l'écran de la question : rester sur « chargement »
        // donnerait un écran vide sans moyen d'agir.
        setPhase(payload.aSaute ? 'question' : 'confiance')
      } finally {
        enCours.current = false
      }
    },
    [index, item, items.length, sessionId],
  )

  const repondre = useCallback(
    (lettre: string) => {
      tempsReponse.current = Date.now() - debutItem.current
      setReponse(lettre)
      setPhase('confiance')
    },
    [],
  )

  /**
   * Sauter n'ouvre pas l'écran de confiance : déclarer une certitude sur une
   * question qu'on abandonne n'a pas de sens. La tentative est enregistrée
   * avec confiance = 1, et les calculs de calibration excluent les sauts.
   */
  const sauter = useCallback(() => {
    void envoyer({
      reponse: null,
      aSaute: true,
      tempsMs: Date.now() - debutItem.current,
      confiance: 1,
    })
  }, [envoyer])

  const declarerConfiance = useCallback(
    (niveau: number) => {
      void envoyer({
        reponse,
        aSaute: false,
        tempsMs: tempsReponse.current,
        confiance: niveau,
      })
    },
    [envoyer, reponse],
  )

  /* ---------------------------------------------------------- sprint -- */

  const dureeSprintMs = items.length * SECONDES_PAR_QUESTION * 1000
  const restantSprintMs = sprint ? dureeSprintMs - ecouleSerie : 0

  /**
   * Fin du temps : comme à l'épreuve, ce qui n'a pas été traité est compté
   * non traité — la question en cours comprise, même si une lettre était
   * choisie sans que sa confiance soit déclarée. Puis la série se clôt.
   */
  const clore = useCallback(async () => {
    if (sprintClos.current || sessionId === null) return
    sprintClos.current = true
    enCours.current = true
    setPhase('chargement')
    try {
      for (let i = index; i < items.length; i++) {
        await poster('/api/drill/attempt', {
          sessionId,
          itemId: items[i].id,
          reponse: null,
          aSaute: true,
          nonTraitee: true,
          tempsMs: i === index ? Date.now() - debutItem.current : 0,
          confiance: 1,
        })
      }
      setRecap(await poster<Recap>('/api/drill/finish', { sessionId }))
      setPhase('recap')
    } catch (e) {
      setErreur((e as Error).message)
      setPhase('erreur')
    } finally {
      enCours.current = false
    }
  }, [index, items, sessionId])

  // Un sprint est un sous-test chronométré : le quitter par erreur le fausse.
  // Hors sprint, chaque réponse est déjà en base et rien ne se perd.
  useEffect(() => {
    if (!sprint || (phase !== 'question' && phase !== 'confiance')) return
    const retenir = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', retenir)
    return () => window.removeEventListener('beforeunload', retenir)
  }, [phase, sprint])

  useEffect(() => {
    if (!sprint || items.length === 0) return
    if (phase !== 'question' && phase !== 'confiance') return
    if (restantSprintMs <= 0 && !enCours.current) void clore()
  }, [clore, items.length, phase, restantSprintMs, sprint])

  /* -------------------------------------------------------- clavier -- */

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const k = e.key.toLowerCase()

      if (phase === 'question' && item) {
        const nb = item.typeItem === 'conditions_minimales' ? 5 : item.options.length
        const parChiffre = Number(k)
        if (Number.isInteger(parChiffre) && parChiffre >= 1 && parChiffre <= nb) {
          e.preventDefault()
          repondre(LETTRES[parChiffre - 1])
          return
        }
        const parLettre = LETTRES.indexOf(k.toUpperCase() as (typeof LETTRES)[number])
        if (parLettre >= 0 && parLettre < nb) {
          e.preventDefault()
          repondre(LETTRES[parLettre])
          return
        }
        if (k === ' ' || k === 'spacebar') {
          e.preventDefault()
          sauter()
        }
        return
      }

      if (phase === 'confiance') {
        const n = Number(k)
        if (Number.isInteger(n) && n >= 1 && n <= 4) {
          e.preventDefault()
          declarerConfiance(n)
          return
        }
        if (k === 'escape' || k === 'backspace') {
          e.preventDefault()
          setReponse(null)
          setPhase('question')
        }
      }
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [phase, item, repondre, sauter, declarerConfiance])

  /* ----------------------------------------------------------- vues -- */

  if (phase === 'chargement') {
    return <Coquille section={titre}><p className="text-doux">Chargement…</p></Coquille>
  }

  if (phase === 'erreur') {
    return (
      <Coquille section={titre}>
        <p className="text-faux">{erreur}</p>
        <Link href="/atelier" className="mt-4 inline-block text-sm text-accent hover:underline">
          Ouvrir l’atelier →
        </Link>
      </Coquille>
    )
  }

  if (phase === 'recap' && recap) {
    return (
      <VueRecap
        recap={recap}
        section={section}
        libelle={spec?.libelle ?? section}
        sessionId={sessionId}
      />
    )
  }

  if (!item) return null

  const options =
    item.typeItem === 'conditions_minimales' ? OPTIONS_CONDITIONS_MINIMALES : item.options
  const secondes = Math.floor(ecoule / 1000)
  const depassement = secondes > SECONDES_PAR_QUESTION
  // Rythme cumulé : le budget des questions déjà passées, moins le temps
  // écoulé depuis le début. Positif, tu as de l'avance ; négatif, du retard —
  // c'est ce retard-là qui laisse des questions non traitées en fin de sous-test.
  const avanceS = Math.round(index * SECONDES_PAR_QUESTION - ecouleSerie / 1000)
  const restantSprintS = Math.max(0, Math.ceil(restantSprintMs / 1000))

  // Compréhension : un texte et ses cinq questions, sans chronomètre par
  // question — à l'épreuve, les vingt minutes couvrent les trois textes, et
  // un compte à rebours par question inventerait une contrainte qui n'existe pas.
  if (groupes) {
    const g = groupes[indexGroupe]
    return (
      <Coquille section={titre}>
        <GroupeComprehension
          key={indexGroupe}
          texte={g.texte}
          items={g.items.map((i) => ({ id: i.id, enonce: i.enonce, options: i.options }))}
          numero={indexGroupe + 1}
          total={groupes.length}
          onTermine={validerGroupe}
        />
        {enPanne && <Panne etat={enPanne} />}
      </Coquille>
    )
  }

  return (
    <Coquille section={titre}>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-sm">
        <span className="chiffres text-doux">
          {sprint && <span className="mr-2 text-accent">Sprint</span>}
          Question {index + 1} / {items.length}
        </span>
        {sprint ? (
          <span
            className={`chiffres text-lg tabular-nums ${restantSprintS <= 120 ? 'text-faux' : 'text-texte'}`}
          >
            {Math.floor(restantSprintS / 60)}:{String(restantSprintS % 60).padStart(2, '0')}
          </span>
        ) : (
          <span className="flex items-baseline gap-4">
            {index > 0 && (
              <span
                className={`chiffres text-xs ${avanceS >= 0 ? 'text-juste' : 'text-blanc'}`}
                title={`Budget de ${SECONDES_PAR_QUESTION} s par question, cumulé depuis le début de la série`}
              >
                {avanceS >= 0 ? `${avanceS} s d’avance` : `${-avanceS} s de retard`}
              </span>
            )}
            <span className={`chiffres tabular-nums ${depassement ? 'text-blanc' : 'text-doux'}`}>
              {secondes} s
              <span className="ml-1 text-xs opacity-60">/ {SECONDES_PAR_QUESTION}</span>
            </span>
          </span>
        )}
      </div>

      <div className="h-1 w-full overflow-hidden rounded bg-carte-clair">
        {sprint ? (
          <div
            className={`h-full transition-all duration-200 ${restantSprintS <= 120 ? 'bg-faux' : 'bg-accent'}`}
            style={{ width: `${Math.max(0, (restantSprintMs / Math.max(1, dureeSprintMs)) * 100)}%` }}
          />
        ) : (
          <div
            className={`h-full transition-all duration-200 ${depassement ? 'bg-blanc' : 'bg-accent'}`}
            style={{ width: `${Math.min(100, (secondes / SECONDES_PAR_QUESTION) * 100)}%` }}
          />
        )}
      </div>

      {phase === 'question' ? (
        <>
          {item.contexteTexte && (
            <div className="mt-8 rounded-lg border border-bord bg-carte p-5 text-sm leading-relaxed text-doux">
              {item.contexteTexte}
            </div>
          )}

          <EnonceQuestion
            enonce={item.enonce}
            figure={item.figure}
            imageHash={item.imageHash}
          />

          {item.typeItem === 'conditions_minimales' && (
            <div className="mt-5 space-y-2 rounded-lg border border-bord bg-carte p-5 text-sm">
              <p>
                <span className="mr-2 text-doux">(1)</span>
                {item.info1}
              </p>
              <p>
                <span className="mr-2 text-doux">(2)</span>
                {item.info2}
              </p>
              <p className="mt-3 border-t border-bord pt-3 text-xs text-blanc">
                {RAPPEL_CONDITIONS_MINIMALES}
              </p>
              <button
                onClick={() => setArbre((a) => !a)}
                className="mt-3 text-xs text-accent hover:underline"
              >
                {arbre ? 'Revenir aux cinq propositions' : 'Répondre par l’arbre de décision A–E'}
              </button>
            </div>
          )}

          {item.typeItem === 'conditions_minimales' && arbre ? (
            <ArbreConditions key={item.id} onLettre={repondre} />
          ) : (
          <ul className="mt-6 space-y-2">
            {options.map((texte, i) => (
              <li key={i}>
                <button
                  onClick={() => repondre(LETTRES[i])}
                  className="flex w-full items-start gap-3 rounded-lg border border-bord bg-carte px-4 py-3 text-left text-sm transition hover:border-accent hover:bg-carte-clair"
                >
                  <span className="kbd mt-0.5">{i + 1}</span>
                  <span className="font-medium text-doux">{LETTRES[i]}.</span>
                  <span className="flex-1">
                    <Proposition texte={texte} c={item.optionsFigure?.[i]} />
                  </span>
                </button>
              </li>
            ))}
          </ul>
          )}

          {/* Sur un téléphone les deux blocs se télescopaient en colonnes
              étroites, et le rappel de touche n'y sert à rien : pas de clavier.
              On empile, et on masque « espace » sous la largeur d'une tablette. */}
          <div className="mt-6 flex flex-col gap-3 text-xs text-doux sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <button onClick={sauter} className="self-start rounded-lg border border-bord px-3 py-2 hover:text-texte sm:border-0 sm:px-0 sm:py-0">
              {/* Le masquage porte sur un conteneur : `.kbd` pose son propre
                  `display: inline-flex`, qui l'emporterait sur `hidden`. */}
              <span className="mr-2 hidden sm:inline">
                <span className="kbd">espace</span>
              </span>
              Sauter cette question
            </button>
            {/* Le barème ne pénalise plus l'erreur : sauter ne protège de rien.
                Le bouton reste — c'est lui qui remplit le carnet — mais l'aide
                doit dire ce qu'il faudrait faire le jour de l'épreuve. */}
            <span>
              Une mauvaise réponse ne coûte rien. Le jour J, coche toujours quelque chose.
            </span>
          </div>
        </>
      ) : (
        <VueConfiance reponse={reponse} onChoix={declarerConfiance} />
      )}

      {enPanne && <Panne etat={enPanne} />}
    </Coquille>
  )
}

/* -------------------------------------------------------- sous-vues -- */

function Coquille({ section, children }: { section?: string; children: React.ReactNode }) {
  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <div className="mb-8 flex items-center justify-between">
        <Link href="/tagemage" className="text-sm text-doux hover:text-texte">
          ← Quitter
        </Link>
        {section && <span className="text-sm text-doux">{section}</span>}
      </div>
      {children}
    </main>
  )
}

const NIVEAUX = [
  { n: 1, libelle: 'Au hasard', detail: 'Je n’ai rien pu éliminer' },
  { n: 2, libelle: 'Hésitant', detail: 'J’ai éliminé une ou deux propositions' },
  { n: 3, libelle: 'Assez sûr', detail: 'Je pense avoir la bonne' },
  { n: 4, libelle: 'Certain', detail: 'Je suis sûr de moi' },
]

function VueConfiance({
  reponse,
  onChoix,
}: {
  reponse: string | null
  onChoix: (n: number) => void
}) {
  return (
    <div className="mt-10">
      <p className="text-sm text-doux">
        Réponse enregistrée : <span className="font-medium text-texte">{reponse}</span>
      </p>
      <h2 className="mt-2 text-lg">À quel point es-tu sûr ?</h2>
      <p className="mt-1 text-xs text-doux">
        C’est la donnée qui permettra de calculer ton seuil de saut rentable. La correction
        n’arrive qu’en fin de série.
      </p>

      <ul className="mt-6 space-y-2">
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

      <p className="mt-5 text-xs text-doux">
        <span className="kbd mr-2">échap</span> revenir à la question
      </p>
    </div>
  )
}

function VueRecap({
  recap,
  section,
  libelle,
  sessionId,
}: {
  recap: Recap
  section: string
  libelle: string
  sessionId: number | null
}) {
  const { resultat, corrections, tempsTotalMs } = recap

  // Deux signaux calculés, pas devinés : ils préfigurent l'écran de stratégie
  // du lot 2.
  const surconfiance = corrections.filter((c) => !c.aSaute && !c.estCorrect && c.confiance === 4)
  const chance = corrections.filter((c) => !c.aSaute && c.estCorrect && c.confiance <= 2)

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <div className="mb-8 flex items-center justify-between">
        <Link href="/tagemage" className="text-sm text-doux hover:text-texte">
          ← TAGE MAGE
        </Link>
        <span className="text-sm text-doux">{libelle}</span>
      </div>

      <h1 className="text-2xl font-semibold">Série terminée</h1>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Tuile valeur={`${resultat.justes}`} libelle="justes" ton="juste" />
        <Tuile valeur={`${resultat.fausses}`} libelle="fausses" ton="faux" />
        <Tuile valeur={`${resultat.blanches}`} libelle="cases vides" ton="blanc" />
        <Tuile valeur={`${resultat.pointsBruts}`} libelle="points bruts" />
      </div>

      <ManqueAGagner cases={resultat.blanches} />

      <p className="mt-4 text-sm text-doux">
        Rythme moyen{' '}
        <span className="chiffres text-texte">
          {Math.round(tempsTotalMs / 1000 / Math.max(1, resultat.nbItems))} s
        </span>{' '}
        par question · score extrapolé{' '}
        <span className="chiffres text-texte">{resultat.scoreExtrapole}</span> / 600{' '}
        <span className="opacity-70">
          (estimation grossière sur {resultat.nbItems} question
          {resultat.nbItems > 1 ? 's' : ''})
        </span>
      </p>

      {(surconfiance.length > 0 || chance.length > 0) && (
        <div className="mt-6 space-y-2 rounded-xl border border-bord bg-carte px-5 py-4 text-sm">
          {surconfiance.length > 0 && (
            <p>
              <span className="text-faux">{surconfiance.length}</span> erreur
              {surconfiance.length > 1 ? 's' : ''} avec une confiance maximale — c’est le
              signal le plus coûteux au TAGE MAGE.
            </p>
          )}
          {chance.length > 0 && (
            <p>
              <span className="text-blanc">{chance.length}</span> bonne
              {chance.length > 1 ? 's' : ''} réponse{chance.length > 1 ? 's' : ''} obtenue
              {chance.length > 1 ? 's' : ''} sans certitude — à traiter comme des erreurs.
            </p>
          )}
        </div>
      )}

      {sessionId !== null && <DebriefIA sessionId={sessionId} />}
      <TempsCorrection sessionId={sessionId} />

      <h2 className="mt-10 mb-4 text-sm uppercase tracking-widest text-doux">Corrections</h2>
      <ol className="space-y-3">
        {corrections.map((c, i) => (
          <LigneCorrection key={c.itemId} numero={i + 1} c={c} />
        ))}
      </ol>

      <div className="mt-10 flex gap-3">
        <Link
          href={`/tagemage/drill?section=${section}`}
          className="rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-fond hover:opacity-90"
        >
          Nouvelle série
        </Link>
        <Link
          href="/carnet"
          className="rounded-lg border border-bord px-4 py-2.5 text-sm text-doux hover:text-texte"
        >
          Carnet d’erreurs
        </Link>
        <Link
          href="/tagemage"
          className="rounded-lg border border-bord px-4 py-2.5 text-sm text-doux hover:text-texte"
        >
          Retour
        </Link>
      </div>
    </main>
  )
}

function Tuile({ valeur, libelle, ton }: { valeur: string; libelle: string; ton?: string }) {
  const couleur = ton === 'juste' ? 'text-juste' : ton === 'faux' ? 'text-faux' : ton === 'blanc' ? 'text-blanc' : ''
  return (
    <div className="rounded-xl border border-bord bg-carte px-4 py-3">
      <p className={`chiffres text-2xl font-semibold ${couleur}`}>{valeur}</p>
      <p className="text-xs text-doux">{libelle}</p>
    </div>
  )
}

function LigneCorrection({ numero, c }: { numero: number; c: Correction }) {
  const etat = c.aSaute ? 'sautée' : c.estCorrect ? 'juste' : 'fausse'
  const couleur = c.aSaute ? 'text-blanc' : c.estCorrect ? 'text-juste' : 'text-faux'

  const options =
    c.typeItem === 'conditions_minimales' ? OPTIONS_CONDITIONS_MINIMALES : c.options
  const indexBonne = LETTRES.indexOf(c.bonneReponse as (typeof LETTRES)[number])

  return (
    <li className="rounded-xl border border-bord bg-carte px-5 py-4">
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 text-xs text-doux">
        <span className="chiffres">#{numero}</span>
        <span className={couleur}>{etat}</span>
        <span className="chiffres">
          {c.points > 0 ? '+' : ''}
          {c.points} pt
        </span>
        <span className="chiffres">{Math.round(c.tempsMs / 1000)} s</span>
        {!c.aSaute && <span>confiance {c.confiance}/4</span>}
        <Difficulte d={c.difficulte} />
      </div>

      <EnonceRappel enonce={c.enonce} figure={c.figure} />

      <div className="mt-2 text-sm">
        <span className="text-doux">Bonne réponse : </span>
        <span className="text-juste">{c.bonneReponse}</span>
        {options[indexBonne] && (
          <span className="text-juste">
            {' — '}
            <Proposition texte={options[indexBonne]} c={c.optionsFigure?.[indexBonne]} taille={48} />
          </span>
        )}
      </div>

      {!c.estCorrect && !c.aSaute && c.reponseDonnee && (
        <div className="mt-1 text-sm">
          <span className="text-doux">Ta réponse : </span>
          <span className="text-faux">{c.reponseDonnee}</span>
          {c.diagnostic && <span className="text-doux"> — {c.diagnostic}</span>}
        </div>
      )}

      <Correctif c={c} />

      {/* Le moment où l'on est le plus prêt à lire une leçon, c'est juste après
          avoir raté la question qu'elle explique. Sans ce lien, il faut savoir
          que la leçon existe, deviner son nom, et la retrouver à la main. */}
      {!c.estCorrect && c.skillId && (
        <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs">
          <Link href={`/tagemage/cours#${c.skillId}`} className="text-accent hover:underline">
            Revoir la leçon →
          </Link>
          <Link
            href={`/tagemage/drill?section=${sectionDe(c.skillId)}&revanche=${c.itemId}&taille=3`}
            className="text-accent hover:underline"
            title="Trois questions du même type, du même modèle d’énoncé d’abord"
          >
            Revanche : même modèle →
          </Link>
          <Link
            href={`/tagemage/drill?section=${sectionDe(c.skillId)}&skills=${c.skillId}`}
            className="text-doux hover:text-texte"
          >
            Refaire une série de ce type
          </Link>
        </p>
      )}
    </li>
  )
}

/** « tm.calcul.systemes » → « calcul ». Le sous-test est encodé dans l'identifiant. */
function sectionDe(skillId: string): string {
  return skillId.split('.')[1] ?? ''
}

/**
 * Le texte de correction, réglé sur ce qui vient de se passer.
 *
 * Juste : une ligne, le réflexe. Relire cinq lignes de démarche pour confirmer
 * ce qu'on vient de faire correctement, c'est du temps de révision dépensé à
 * zéro — et c'est ainsi qu'on prend l'habitude de sauter les corrections.
 *
 * Faux ou sauté : la démarche entière. À ce moment-là, connaître le bon
 * résultat ne sert à rien ; ce qu'il faut voir, c'est où le chemin bifurque.
 */
function Correctif({ c }: { c: Pick<Correction, 'estCorrect' | 'explication' | 'rappel'> }) {
  const texte = c.estCorrect ? (c.rappel ?? c.explication) : (c.explication ?? c.rappel)
  if (!texte) return null

  return (
    <div className="mt-3 border-t border-bord pt-3">
      {!c.estCorrect && (
        <p className="mb-1.5 text-xs uppercase tracking-widest text-doux">La démarche</p>
      )}
      <p className="whitespace-pre-line text-sm leading-relaxed text-doux">{texte}</p>
    </div>
  )
}

/**
 * L'arbre de décision des conditions minimales, question par question.
 *
 * Cinq propositions longues se comparent mal sous chronomètre ; trois
 * questions fermées, posées dans l'ordre de la procédure, mènent à la même
 * lettre sans relire les propositions. C'est un mode d'apprentissage : la
 * lettre obtenue passe ensuite par la déclaration de confiance, comme toute
 * réponse.
 */
function ArbreConditions({ onLettre }: { onLettre: (lettre: string) => void }) {
  const [un, setUn] = useState<boolean | null>(null)
  const [deux, setDeux] = useState<boolean | null>(null)

  const repondre = (u: boolean | null, d: boolean | null, ensemble: boolean | null) => {
    if (u === null || d === null) return
    const l = lettreConditionsMinimales(u, d, ensemble)
    if (l) onLettre(l)
  }

  return (
    <div className="mt-6 space-y-2">
      <Etape
        question="L’information (1), à elle seule, permet-elle de répondre ?"
        valeur={un}
        onChoix={(v) => {
          setUn(v)
          repondre(v, deux, null)
        }}
      />
      {un !== null && (
        <Etape
          question="L’information (2), à elle seule, permet-elle de répondre ?"
          valeur={deux}
          onChoix={(v) => {
            setDeux(v)
            repondre(un, v, null)
          }}
        />
      )}
      {un === false && deux === false && (
        <Etape
          question="Les deux informations ensemble permettent-elles de répondre ?"
          valeur={null}
          onChoix={(v) => repondre(false, false, v)}
        />
      )}
    </div>
  )
}

function Etape({
  question,
  valeur,
  onChoix,
}: {
  question: string
  valeur: boolean | null
  onChoix: (v: boolean) => void
}) {
  return (
    <div className="rounded-lg border border-bord bg-carte px-4 py-3">
      <p className="text-sm">{question}</p>
      <div className="mt-2 flex gap-2">
        {[
          { v: true, l: 'Oui' },
          { v: false, l: 'Non' },
        ].map((o) => (
          <button
            key={o.l}
            onClick={() => onChoix(o.v)}
            className={`rounded-lg border px-4 py-1.5 text-sm transition ${
              valeur === o.v ? 'border-accent text-accent' : 'border-bord text-doux hover:text-texte'
            }`}
          >
            {o.l}
          </button>
        ))}
      </div>
    </div>
  )
}
