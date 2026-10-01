'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { aleaDepuis, type Alea } from '@/core/generation/alea'
import {
  DUREE_CHRONO_MS,
  FORMATS,
  QUESTIONS_SERIE,
  apresReponse,
  choisirQuestion,
  descriptionDe,
  jeuxDe,
  nomDe,
  seuilLent,
  verifier,
  type FormatPartie,
  type EtatsFaits,
  type PartieJeuId,
  type Question,
} from '@/core/automatismes'
import { defiDuJour, QUESTIONS_DEFI } from '@/core/automatismes/defi'
import type { FormatEnregistre, MeilleurScore, ResultatPartie } from '@/core/db/automatismes'
import { poster } from '@/app/_composants/reseau'
import { chronoLisible, lienJeu, scoreLisible } from '../format'

/**
 * Une partie d'automatismes.
 *
 * Tout se passe ici, sans appel au serveur avant la fin : la question
 * suivante est tirée dans le navigateur, la réponse vérifiée sur place. Deux
 * niveaux de correction — une ligne quand c'est juste, sans s'arrêter ; la
 * réponse et l'astuce quand c'est faux, chronomètre arrêté le temps de lire.
 *
 * Le défi du jour (`defi`) se joue ici aussi : ses dix questions sont fixées
 * par la date, au lieu d'être choisies par la répétition.
 */

type Etape = 'pret' | 'question' | 'correction' | 'fin'

/** Une Entrée plus rapprochée que ça de l'affichage vient de la frappe précédente. */
const DELAI_ENTREE_MS = 300

interface Reponse {
  question: Question
  saisie: string
  juste: boolean
  tempsMs: number
  lent: boolean
}

type Envoi = { etat: 'en_cours' } | { etat: 'fait'; resultat: ResultatPartie } | { etat: 'echec'; message: string }

function nouvelUid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`
}

export default function JeuClient({
  jeuId,
  format,
  record,
  etats,
  defi,
}: {
  jeuId: PartieJeuId
  format: FormatEnregistre
  record: MeilleurScore | null
  etats: EtatsFaits
  /** Pour le défi : son jour, et la première partie du jour si elle a déjà eu lieu. */
  defi?: { jour: string; dejaFait: MeilleurScore | null }
}) {
  const jeux = useMemo(() => jeuxDe(jeuId), [jeuId])
  const jourDefi = defi?.jour
  const questionsDefi = useMemo(() => (jourDefi ? defiDuJour(jourDefi) : null), [jourDefi])
  // Nombre de questions d'une partie, null au chrono (la partie s'arrête au temps).
  const nbQuestions = format === 'serie' ? QUESTIONS_SERIE : format === 'defi' ? QUESTIONS_DEFI : null
  // Copie locale, tenue à jour à chaque réponse : un fait raté revient dans
  // la même partie, sans attendre le prochain affichage de la page.
  const etatsFaits = useRef<EtatsFaits>({ ...etats })
  const [etape, setEtape] = useState<Etape>('pret')
  const [question, setQuestion] = useState<Question | null>(null)
  const [saisie, setSaisie] = useState('')
  const [reponses, setReponses] = useState<Reponse[]>([])
  const [envoi, setEnvoi] = useState<Envoi | null>(null)
  // Temps de jeu cumulé des questions répondues ; celui de la question en
  // cours s'y ajoute en direct (`maintenant − debutQuestion`).
  const [jeuMs, setJeuMs] = useState(0)
  const [maintenant, setMaintenant] = useState(0)

  const alea = useRef<Alea | null>(null)
  const [debutQuestion, setDebutQuestion] = useState(0)
  const uid = useRef('')
  const champ = useRef<HTMLInputElement>(null)

  const enCoursMs = etape === 'question' ? Math.max(0, maintenant - debutQuestion) : 0
  const ecouleMs = jeuMs + enCoursMs
  const restantMs = Math.max(0, DUREE_CHRONO_MS - ecouleMs)

  const poserQuestion = useCallback(
    (deja: Reponse[]) => {
      const q =
        questionsDefi?.[deja.length] ??
        choisirQuestion(jeux, alea.current!, deja.map((r) => r.question.cle), etatsFaits.current, Date.now())
      setQuestion(q)
      setSaisie('')
      const t = performance.now()
      setDebutQuestion(t)
      setMaintenant(t)
      setEtape('question')
    },
    [jeux, questionsDefi],
  )

  const commencer = useCallback(() => {
    alea.current = aleaDepuis((Math.random() * 2 ** 32) >>> 0)
    uid.current = nouvelUid()
    setReponses([])
    setJeuMs(0)
    setEnvoi(null)
    poserQuestion([])
  }, [poserQuestion])

  const envoyer = useCallback(
    async (liste: Reponse[], dureeMs: number) => {
      setEnvoi({ etat: 'en_cours' })
      try {
        const resultat = await poster<ResultatPartie>('/api/automatismes/partie', {
          uid: uid.current,
          jeu: jeuId,
          format,
          defiDu: jourDefi,
          dureeMs: Math.round(dureeMs),
          reponses: liste.map((r) => ({
            jeu: r.question.jeu,
            cle: r.question.cle,
            reponse: r.saisie,
            juste: r.juste,
            tempsMs: Math.round(r.tempsMs),
            lent: r.lent,
          })),
        })
        setEnvoi({ etat: 'fait', resultat })
      } catch (e) {
        setEnvoi({ etat: 'echec', message: (e as Error).message })
      }
    },
    [jeuId, format, jourDefi],
  )

  const terminer = useCallback(
    (liste: Reponse[], dureeMs: number) => {
      setEtape('fin')
      setQuestion(null)
      if (liste.length > 0) void envoyer(liste, dureeMs)
    },
    [envoyer],
  )

  // Le chronomètre : un battement tous les dixièmes, seulement pendant une question.
  useEffect(() => {
    if (etape !== 'question') return
    const t = setInterval(() => setMaintenant(performance.now()), 100)
    return () => clearInterval(t)
  }, [etape])

  // Fin du temps : la question en cours n'est pas comptée. Le délai repart à
  // chaque question, du temps de jeu déjà consommé — corrections exclues.
  useEffect(() => {
    if (format !== 'chrono' || etape !== 'question') return
    const t = setTimeout(() => terminer(reponses, DUREE_CHRONO_MS), Math.max(0, DUREE_CHRONO_MS - jeuMs))
    return () => clearTimeout(t)
  }, [format, etape, jeuMs, reponses, terminer])

  useEffect(() => {
    if (etape === 'question') champ.current?.focus()
  }, [etape, question])

  const repondre = useCallback(
    (texte: string) => {
      if (etape !== 'question' || !question) return
      const tempsMs = performance.now() - debutQuestion
      const juste = verifier(question.attendu, texte)
      // Une proposition se garde par son texte (« mardi »), pas par son numéro.
      const lu = question.saisie === 'choix' ? (question.choix?.[Number(texte)] ?? '') : texte.trim()
      const r: Reponse = { question, saisie: lu, juste, tempsMs, lent: juste && tempsMs > seuilLent(question) }
      etatsFaits.current[question.cle] = apresReponse(etatsFaits.current[question.cle], juste, r.lent, Date.now())
      const liste = [...reponses, r]
      const total = jeuMs + tempsMs
      setReponses(liste)
      setJeuMs(total)

      if (format === 'chrono' && total >= DUREE_CHRONO_MS) return terminer(liste, DUREE_CHRONO_MS)
      if (nbQuestions !== null && liste.length >= nbQuestions) {
        if (juste) return terminer(liste, total)
        // La dernière erreur se lit aussi : la fin vient après la correction.
        return setEtape('correction')
      }
      if (juste) poserQuestion(liste)
      else setEtape('correction')
    },
    [etape, question, debutQuestion, reponses, jeuMs, format, nbQuestions, terminer, poserQuestion],
  )

  const continuer = useCallback(() => {
    if (nbQuestions !== null && reponses.length >= nbQuestions) terminer(reponses, jeuMs)
    else poserQuestion(reponses)
  }, [nbQuestions, reponses, jeuMs, terminer, poserQuestion])

  // Entrée commence, continue après une correction, rejoue à la fin. Pas de
  // focus automatique sur ces boutons : l'Entrée qui valide une réponse
  // fausse les aurait activés aussitôt, et la correction aurait été sautée.
  // Même raison pour le délai : une frappe déjà lancée ne passe pas l'écran.
  useEffect(() => {
    const action = etape === 'pret' || etape === 'fin' ? commencer : etape === 'correction' ? continuer : null
    if (!action) return
    const affichee = performance.now()
    const touche = (e: KeyboardEvent) => {
      if (e.key !== 'Enter' || e.repeat || performance.now() - affichee < DELAI_ENTREE_MS) return
      e.preventDefault()
      action()
    }
    window.addEventListener('keydown', touche)
    return () => window.removeEventListener('keydown', touche)
  }, [etape, commencer, continuer])

  // Au clavier : O et N pour oui / non, 1 à 7 pour une proposition.
  useEffect(() => {
    if (etape !== 'question' || (question?.saisie !== 'ouinon' && question?.saisie !== 'choix')) return
    const touche = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase()
      if (question.saisie === 'choix') {
        const i = Number(k) - 1
        if (Number.isInteger(i) && i >= 0 && i < (question.choix?.length ?? 0)) repondre(String(i))
      } else if (k === 'o' || k === 'y') repondre('oui')
      else if (k === 'n') repondre('non')
    }
    window.addEventListener('keydown', touche)
    return () => window.removeEventListener('keydown', touche)
  }, [etape, question, repondre])

  const soumettre = (e: FormEvent) => {
    e.preventDefault()
    repondre(saisie)
  }

  const derniere = reponses.at(-1)
  const justes = reponses.filter((r) => r.juste).length

  return (
    <main className="mx-auto max-w-2xl px-6 py-14">
      <Link href="/tagemage/automatismes" className="text-sm text-doux hover:text-texte">
        ← Automatismes
      </Link>

      <header className="mt-6 mb-6 flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-xl font-semibold tracking-tight">{format === 'defi' ? 'Défi du jour' : nomDe(jeuId)}</h1>
        <span className="text-sm text-doux">
          {format === 'defi'
            ? `${QUESTIONS_DEFI} questions, les mêmes pour tous aujourd’hui`
            : `${FORMATS[format].libelle} · ${FORMATS[format].but}`}
        </span>
      </header>

      {etape === 'pret' && (
        <section className="rounded-xl border border-bord bg-carte px-5 py-6">
          <p className="text-sm leading-relaxed text-doux">
            {format === 'defi'
              ? `${QUESTIONS_DEFI} questions tirées dans tous les jeux, le plus vite possible. Seule la première partie du jour compte, pour le score comme pour la série de jours.`
              : descriptionDe(jeuId)}{' '}
            {format === 'chrono'
              ? 'Réponds au plus grand nombre en 60 secondes de jeu.'
              : format === 'serie'
                ? `${QUESTIONS_SERIE} questions, le plus vite possible.`
                : ''}{' '}
            Entrée valide ; une réponse vide compte comme « je ne sais pas » et affiche la correction.
          </p>
          {defi?.dejaFait && (
            <p className="mt-3 text-sm text-blanc">
              Déjà fait aujourd’hui : {scoreLisible('defi', defi.dejaFait)}. Tu peux le rejouer pour t’entraîner ;
              cette partie ne comptera pas.
            </p>
          )}
          <p className="mt-3 text-sm">
            {record ? (
              <>
                Record : <span className="chiffres font-medium">{scoreLisible(format, record)}</span>
              </>
            ) : (
              <span className="text-doux">
                {format === 'defi' ? 'Premier défi : pas encore de record.' : 'Pas encore de record dans ce format.'}
              </span>
            )}
          </p>
          <button
            onClick={commencer}
            className="mt-5 rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-fond hover:opacity-90"
          >
            Commencer
          </button>
        </section>
      )}

      {(etape === 'question' || etape === 'correction') && question && (
        <>
          <Compteur
            total={nbQuestions}
            justes={justes}
            nb={reponses.length}
            ecouleMs={ecouleMs}
            restantMs={restantMs}
            pause={etape === 'correction'}
          />

          {/* Correction courte de la réponse précédente, quand elle était juste. */}
          <p className="mb-3 h-5 text-sm">
            {etape === 'question' && derniere?.juste && (
              <span className={derniere.lent ? 'text-blanc' : 'text-juste'}>
                ✓ {derniere.question.solution}
                {derniere.lent && ` — juste mais lent (${chronoLisible(derniere.tempsMs)}), à revoir`}
              </span>
            )}
          </p>

          <section className="rounded-xl border border-bord bg-carte px-5 py-6">
            <p
              className={`chiffres font-semibold tracking-tight ${question.enonce.length > 40 ? 'text-xl leading-snug' : 'text-3xl'}`}
            >
              {question.enonce}
            </p>
            {question.aide && <p className="mt-1 text-xs text-doux">{question.aide}</p>}

            {etape === 'question' &&
              (question.saisie === 'choix' ? (
                <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {question.choix!.map((c, i) => (
                    <button
                      key={c}
                      onClick={() => repondre(String(i))}
                      className="chiffres rounded-lg border border-bord px-3 py-3 text-left text-base font-medium transition hover:border-accent"
                    >
                      <span className="mr-2 text-xs text-doux">{i + 1}</span>
                      {c}
                    </button>
                  ))}
                </div>
              ) : question.saisie === 'ouinon' ? (
                <div className="mt-5 grid grid-cols-2 gap-3">
                  {(['oui', 'non'] as const).map((v) => (
                    <button
                      key={v}
                      onClick={() => repondre(v)}
                      className="rounded-lg border border-bord py-4 text-lg font-medium transition hover:border-accent"
                    >
                      {v === 'oui' ? 'Oui' : 'Non'}
                      <span className="ml-2 text-xs text-doux">{v === 'oui' ? 'O' : 'N'}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <form onSubmit={soumettre} className="mt-5 flex gap-3">
                  <input
                    ref={champ}
                    value={saisie}
                    onChange={(e) => setSaisie(e.target.value)}
                    inputMode={question.saisie === 'nombre' ? 'decimal' : 'text'}
                    autoCapitalize={question.saisie === 'texte' ? 'characters' : 'off'}
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck={false}
                    enterKeyHint="go"
                    aria-label="Ta réponse"
                    className="chiffres min-w-0 flex-1 rounded-lg border border-bord bg-fond px-4 py-3 text-xl outline-none focus:border-accent"
                  />
                  <button
                    type="submit"
                    className="rounded-lg bg-accent px-5 text-sm font-medium text-fond hover:opacity-90"
                  >
                    Valider
                  </button>
                </form>
              ))}

            {etape === 'correction' && derniere && (
              <div className="mt-5 border-t border-bord pt-4 text-sm leading-relaxed">
                <p>
                  <span className="text-faux">
                    ✗ {derniere.saisie ? `Ta réponse : ${derniere.saisie}` : 'Sans réponse'}
                  </span>
                  <span className="text-doux"> · </span>
                  Réponse : <span className="chiffres font-medium text-juste">{derniere.question.reponse}</span>
                </p>
                <p className="mt-2">{derniere.question.astuce}</p>
                {derniere.question.table && (
                  <p className="mt-2 text-xs text-doux">
                    À revoir dans Cours et astuces : table « {derniere.question.table} ».
                  </p>
                )}
                <button
                  onClick={continuer}
                  className="mt-4 rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-fond hover:opacity-90"
                >
                  Continuer
                </button>
                <span className="ml-3 text-xs text-doux">Entrée · chronomètre arrêté</span>
              </div>
            )}
          </section>

          <button
            onClick={() => {
              setReponses([])
              terminer([], 0)
            }}
            className="mt-4 text-xs text-doux hover:text-texte"
            title="La partie n’est pas enregistrée"
          >
            Abandonner la partie
          </button>
        </>
      )}

      {etape === 'fin' && (
        <Bilan
          format={format}
          jeuId={jeuId}
          reponses={reponses}
          dureeMs={format === 'chrono' ? DUREE_CHRONO_MS : jeuMs}
          envoi={envoi}
          record={record}
          rejouer={commencer}
          renvoyer={() => void envoyer(reponses, format === 'chrono' ? DUREE_CHRONO_MS : jeuMs)}
        />
      )}
    </main>
  )
}

function Compteur({
  total,
  justes,
  nb,
  ecouleMs,
  restantMs,
  pause,
}: {
  /** Questions de la partie ; null au chrono. */
  total: number | null
  justes: number
  nb: number
  ecouleMs: number
  restantMs: number
  pause: boolean
}) {
  const part = total === null ? restantMs / DUREE_CHRONO_MS : nb / total
  return (
    <div className="mb-3">
      <div className="flex items-baseline justify-between text-sm">
        <span className="chiffres">
          {total === null ? (
            <span className={`text-lg tabular-nums ${restantMs <= 10_000 ? 'text-faux' : ''}`}>
              {Math.ceil(restantMs / 1000)} s
            </span>
          ) : (
            <span className="text-lg tabular-nums">
              {/* Pendant une correction, la question corrigée est encore la courante. */}
              {pause ? nb : Math.min(nb + 1, total)} / {total}
            </span>
          )}
          {pause && <span className="ml-2 text-xs text-doux">en pause</span>}
        </span>
        <span className="chiffres text-doux">
          <span className="text-juste">✓ {justes}</span>
          {nb - justes > 0 && <span className="ml-3 text-faux">✗ {nb - justes}</span>}
          {total !== null && <span className="ml-3 tabular-nums">{chronoLisible(ecouleMs)}</span>}
        </span>
      </div>
      <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-carte-clair">
        <div className="h-full bg-accent transition-all duration-100" style={{ width: `${part * 100}%` }} />
      </div>
    </div>
  )
}

function Bilan({
  format,
  jeuId,
  reponses,
  dureeMs,
  envoi,
  record,
  rejouer,
  renvoyer,
}: {
  format: FormatEnregistre
  jeuId: PartieJeuId
  reponses: Reponse[]
  dureeMs: number
  envoi: Envoi | null
  record: MeilleurScore | null
  rejouer: () => void
  renvoyer: () => void
}) {
  // Après un défi, on propose le Mélange au chrono ; ailleurs, l'autre format du même jeu.
  const autre: FormatPartie = format === 'chrono' ? 'serie' : 'chrono'

  if (reponses.length === 0) {
    return (
      <section className="rounded-xl border border-bord bg-carte px-5 py-6 text-sm">
        <p className="text-doux">Partie abandonnée : rien n’a été enregistré.</p>
        <Actions rejouer={rejouer} jeuId={jeuId} autre={autre} />
      </section>
    )
  }

  const justes = reponses.filter((r) => r.juste).length
  const score = { justes, nb: reponses.length, dureeMs }
  const aRevoir = reponses.filter((r) => !r.juste || r.lent)
  const tempsMoyen = reponses.reduce((s, r) => s + r.tempsMs, 0) / reponses.length
  let suite = 0
  let meilleureSuite = 0
  for (const r of reponses) {
    suite = r.juste ? suite + 1 : 0
    meilleureSuite = Math.max(meilleureSuite, suite)
  }

  return (
    <section className="space-y-4">
      <div className="rounded-xl border border-bord bg-carte px-5 py-6">
        <p className="chiffres text-3xl font-semibold tracking-tight">{scoreLisible(format, score)}</p>
        <p className="mt-1 text-sm text-doux">
          {reponses.length} réponse{reponses.length > 1 ? 's' : ''} · {chronoLisible(tempsMoyen)} par question en
          moyenne · meilleure suite : {meilleureSuite}
        </p>

        <p className="mt-3 text-sm">
          {envoi?.etat === 'en_cours' && <span className="text-doux">Enregistrement…</span>}
          {envoi?.etat === 'fait' && envoi.resultat.defi && (
            <span className="mb-1 block">
              {envoi.resultat.defi.premiere ? (
                <>
                  Série :{' '}
                  <span className="chiffres font-medium">
                    {envoi.resultat.defi.serie} jour{envoi.resultat.defi.serie > 1 ? 's' : ''} d’affilée
                  </span>
                  .
                </>
              ) : (
                <span className="text-blanc">
                  Partie d’entraînement : le défi était déjà fait aujourd’hui, seule la première partie compte.
                </span>
              )}
            </span>
          )}
          {envoi?.etat === 'fait' &&
            (envoi.resultat.nouveauRecord ? (
              <span className="font-medium text-juste">
                {envoi.resultat.precedent
                  ? `Nouveau record ! Le précédent : ${scoreLisible(format, envoi.resultat.precedent)}.`
                  : format === 'defi'
                    ? 'Premier défi enregistré.'
                    : 'Premier score enregistré dans ce format.'}
              </span>
            ) : (
              <span className="text-doux">
                {(envoi.resultat.precedent ?? record) &&
                  `Record : ${scoreLisible(format, (envoi.resultat.precedent ?? record)!)}.`}
              </span>
            ))}
          {envoi?.etat === 'echec' && (
            <span className="text-faux">
              Partie non enregistrée : {envoi.message}{' '}
              <button onClick={renvoyer} className="text-accent hover:underline">
                Réessayer
              </button>
            </span>
          )}
        </p>

        <Actions rejouer={rejouer} jeuId={jeuId} autre={autre} />
      </div>

      {aRevoir.length > 0 && (
        <div className="rounded-xl border border-bord bg-carte px-5 py-4">
          <h2 className="text-sm font-medium">À revoir</h2>
          <ul className="mt-3 space-y-3 text-sm leading-relaxed">
            {aRevoir.map((r, i) => (
              <li key={i} className="border-t border-bord pt-3 first:border-0 first:pt-0">
                {r.juste ? (
                  <p className="text-blanc">
                    ✓ {r.question.solution} — juste, mais en {chronoLisible(r.tempsMs)}
                  </p>
                ) : (
                  <>
                    <p>
                      <span className="chiffres">{r.question.enonce}</span>{' '}
                      <span className="text-faux">{r.saisie ? `✗ ${r.saisie}` : '✗ sans réponse'}</span>{' '}
                      <span className="chiffres text-juste">→ {r.question.reponse}</span>
                    </p>
                    <p className="text-doux">{r.question.astuce}</p>
                  </>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}

function Actions({ rejouer, jeuId, autre }: { rejouer: () => void; jeuId: PartieJeuId; autre: FormatPartie }) {
  return (
    <div className="mt-5 flex flex-wrap items-center gap-3">
      <button
        onClick={rejouer}
        className="rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-fond hover:opacity-90"
      >
        Rejouer
      </button>
      <Link
        href={lienJeu(jeuId, autre)}
        className="rounded-lg border border-bord px-4 py-2.5 text-sm text-doux transition hover:border-accent hover:text-texte"
      >
        {FORMATS[autre].libelle} →
      </Link>
      <Link href="/tagemage/automatismes" className="text-sm text-doux hover:text-texte">
        Tous les jeux
      </Link>
    </div>
  )
}
