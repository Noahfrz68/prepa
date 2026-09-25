'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { poster } from '@/app/_composants/reseau'

export interface LeconAffichable {
  skillId: string
  section: string
  sectionLibelle: string
  titre: string
  quoi: string
  regles: Array<{ titre: string; texte: string }>
  exemple: { enonce: string; etapes: string[]; reponse: string }
  aToi: { enonce: string; indice: string; reponse: string }
  retrouver: Array<{ q: string; r: string }>
  piege: string
  parCoeur?: string[]
  /** Taux mesuré sur ce type de question, null tant qu'il n'y a pas assez de réponses. */
  taux: number | null
  nbReponses: number
  /** Vrai pour les leçons que les mesures désignent comme les plus faibles. */
  aTravailler: boolean
  /** Questions d'annale de ce type en banque. Zéro = leçon non adossée à du réel. */
  temoins: number
  /** Date de la première étude, null si jamais ouverte. Le plan s'en sert. */
  etudieeLe: string | null
  /** Minutes cumulées passées dessus. */
  minutesEtude: number
}

/**
 * Le cours, une leçon par type de question.
 *
 * Quarante-huit leçons ne se lisent pas d'affilée, et ce n'est pas l'usage
 * qu'on en fait : on vient chercher CELLE qui correspond à la question qu'on
 * vient de rater. D'où les deux entrées — la recherche, et le filtre « à
 * travailler » qui n'affiche que ce que les mesures désignent. Et d'où l'ancre
 * par sous-compétence : une correction ratée y renvoie directement.
 */
export default function LeconsClient({ lecons }: { lecons: LeconAffichable[] }) {
  const [ouverte, setOuverte] = useState<string | null>(null)
  const [recherche, setRecherche] = useState('')
  const [seulementFaibles, setSeulementFaibles] = useState(false)

  // Arriver depuis une correction doit ouvrir la leçon, pas seulement la
  // faire défiler sous les yeux repliée.
  useEffect(() => {
    const cible = window.location.hash.slice(1)
    if (!cible) return
    if (lecons.some((l) => l.skillId === cible)) {
      setOuverte(cible)
      // Après la peinture, sinon la carte n'a pas encore sa hauteur dépliée.
      requestAnimationFrame(() =>
        document.getElementById(cible)?.scrollIntoView({ block: 'start' }),
      )
    }
  }, [lecons])

  const nbFaibles = lecons.filter((l) => l.aTravailler).length

  const visibles = useMemo(() => {
    const q = recherche.trim().toLowerCase()
    return lecons.filter((l) => {
      if (seulementFaibles && !l.aTravailler) return false
      if (!q) return true
      // On cherche aussi dans le corps : « Pythagore » ou « subjonctif » ne
      // figurent pas dans les titres, et c'est pourtant ce qu'on tape.
      const corpus = [
        l.titre,
        l.sectionLibelle,
        l.quoi,
        l.piege,
        ...l.regles.flatMap((r) => [r.titre, r.texte]),
        ...l.retrouver.flatMap((r) => [r.q, r.r]),
        l.exemple.enonce,
        l.aToi.enonce,
        ...(l.parCoeur ?? []),
      ]
        .join(' ')
        .toLowerCase()
      return corpus.includes(q)
    })
  }, [lecons, recherche, seulementFaibles])

  const groupes = useMemo(() => {
    const m = new Map<string, LeconAffichable[]>()
    for (const l of visibles) {
      if (!m.has(l.section)) m.set(l.section, [])
      m.get(l.section)!.push(l)
    }
    return [...m.entries()]
  }, [visibles])

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <input
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          placeholder="Chercher une technique — Pythagore, subjonctif, contraposée…"
          className="min-w-0 flex-1 rounded-lg border border-bord bg-carte px-4 py-2.5 text-sm outline-none placeholder:text-blanc focus:border-accent"
        />
        {nbFaibles > 0 && (
          <button
            onClick={() => setSeulementFaibles((v) => !v)}
            className={`shrink-0 rounded-lg border px-3 py-2.5 text-sm transition ${
              seulementFaibles
                ? 'border-accent text-accent'
                : 'border-bord text-doux hover:text-texte'
            }`}
          >
            À travailler ({nbFaibles})
          </button>
        )}
      </div>

      {visibles.length === 0 && (
        <p className="rounded-xl border border-bord bg-carte px-5 py-4 text-sm text-doux">
          Aucune leçon ne contient « {recherche} ».
        </p>
      )}

      <div className="space-y-8">
        {groupes.map(([section, liste]) => (
          <section key={section}>
            <div className="mb-3 flex items-baseline justify-between gap-4">
              <h3 className="text-sm uppercase tracking-widest text-doux">
                {liste[0].sectionLibelle}
              </h3>
              <Link
                href={`/tagemage/drill?section=${section}`}
                className="shrink-0 text-xs text-doux hover:text-accent"
              >
                s’entraîner →
              </Link>
            </div>

            <div className="space-y-2">
              {liste.map((l) => (
                <Carte
                  key={l.skillId}
                  l={l}
                  ouverte={ouverte === l.skillId}
                  basculer={() => setOuverte(ouverte === l.skillId ? null : l.skillId)}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}

function Carte({
  l,
  ouverte,
  basculer,
}: {
  l: LeconAffichable
  ouverte: boolean
  basculer: () => void
}) {
  return (
    <article
      id={l.skillId}
      className={`overflow-hidden rounded-xl border bg-carte transition scroll-mt-4 ${
        l.aTravailler ? 'border-accent' : 'border-bord'
      }`}
    >
      <button
        onClick={basculer}
        className="flex w-full items-baseline justify-between gap-4 px-5 py-3.5 text-left"
      >
        <div className="min-w-0">
          <h4 className="text-sm font-medium">
            {l.titre}
            {l.aTravailler && (
              <span className="ml-3 align-middle text-xs uppercase tracking-wide text-accent">
                à travailler
              </span>
            )}
          </h4>
          <p className="mt-0.5 text-xs leading-relaxed text-doux">{l.quoi}</p>
        </div>

        <span className="chiffres shrink-0 text-sm text-doux">
          {l.taux === null ? (
            <span className="text-blanc">—</span>
          ) : (
            `${Math.round(l.taux * 100)} %`
          )}
        </span>
      </button>

      {ouverte && (
        <div className="border-t border-bord px-5 py-5">
          <Retrouver items={l.retrouver} />

          <div className="mt-6 space-y-4">
            {l.regles.map((r) => (
              <div key={r.titre}>
                <p className="text-sm font-medium">{r.titre}</p>
                <p className="mt-1 text-sm leading-relaxed text-doux">{r.texte}</p>
              </div>
            ))}
          </div>

          {l.parCoeur && l.parCoeur.length > 0 && (
            <div className="mt-6 rounded-lg border border-bord bg-fond px-4 py-3">
              <p className="text-xs uppercase tracking-widest text-doux">À savoir par cœur</p>
              <div className="mt-2 space-y-1">
                {l.parCoeur.map((ligne, i) => (
                  <p key={i} className="chiffres text-sm leading-relaxed">
                    {ligne}
                  </p>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 rounded-lg border border-bord bg-fond px-4 py-3">
            <p className="text-xs uppercase tracking-widest text-doux">
              Un exemple, résolu pas à pas
            </p>
            <p className="mt-2 text-sm leading-relaxed">{l.exemple.enonce}</p>
            <ol className="mt-3 space-y-1.5">
              {l.exemple.etapes.map((e, i) => (
                <li key={i} className="flex gap-3 text-sm leading-relaxed text-doux">
                  <span className="chiffres shrink-0">{i + 1}</span>
                  <span>{e}</span>
                </li>
              ))}
            </ol>
            <p className="mt-3 border-t border-bord pt-3 text-sm leading-relaxed">
              <span className="text-juste">Réponse — </span>
              {l.exemple.reponse}
            </p>
          </div>

          <AToi a={l.aToi} />

          <div className="mt-4 rounded-lg border border-bord bg-fond px-4 py-3">
            <p className="text-sm text-faux">Le piège</p>
            <p className="mt-1 text-sm leading-relaxed text-doux">{l.piege}</p>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-bord pt-3">
            <Etudiee lecon={l} />
            <Link
              href={`/tagemage/drill?section=${l.section}&skills=${l.skillId}`}
              className="rounded-lg bg-accent px-3.5 py-2 text-xs font-medium text-fond hover:opacity-90"
            >
              S’entraîner sur ce type
            </Link>
            <span className="text-xs text-blanc">
              {l.nbReponses === 0
                ? 'Tu n’as pas encore répondu à une question de ce type.'
                : l.taux === null
                  ? `${l.nbReponses} réponse${l.nbReponses > 1 ? 's' : ''} — trop peu pour un taux qui veuille dire quelque chose.`
                  : `Ton taux, mesuré sur ${l.nbReponses} question${l.nbReponses > 1 ? 's' : ''}.`}
            </span>
          </div>

          <Provenance temoins={l.temoins} />
        </div>
      )}
    </article>
  )
}

/**
 * Trois questions à se poser avant de lire.
 *
 * Relire un cours donne le sentiment de le savoir sans le savoir. La seule
 * parade est de se forcer à ressortir la réponse d'abord — d'où le pli fermé :
 * il ne s'agit pas de cacher pour faire joli, mais d'empêcher l'œil de lire la
 * réponse avant que la mémoire ait essayé.
 */
function Retrouver({ items }: { items: Array<{ q: string; r: string }> }) {
  const [ouverts, setOuverts] = useState<number[]>([])

  return (
    <div className="rounded-lg border border-bord bg-fond px-4 py-3">
      <p className="text-xs uppercase tracking-widest text-doux">
        D’abord, de mémoire
      </p>
      <p className="mt-1 text-xs leading-relaxed text-blanc">
        Réponds dans ta tête avant d’ouvrir. Se tromper ici ne coûte rien et fait retenir bien
        plus qu’une relecture.
      </p>
      <div className="mt-3 space-y-2">
        {items.map((it, i) => {
          const vu = ouverts.includes(i)
          return (
            <div key={i}>
              <button
                onClick={() => setOuverts(vu ? ouverts.filter((x) => x !== i) : [...ouverts, i])}
                className="flex w-full gap-3 text-left text-sm leading-relaxed hover:text-accent"
              >
                <span className="chiffres shrink-0 text-doux">{i + 1}</span>
                <span>{it.q}</span>
              </button>
              {vu && <p className="mt-1 pl-7 text-sm leading-relaxed text-juste">{it.r}</p>}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/**
 * Le second exercice, à faire seul.
 *
 * L'indice se déplie avant la réponse : sans lui, on abandonne et on lit la
 * solution, ce qui ramène à la lecture passive. Avec lui, on repart.
 */
function AToi({ a }: { a: { enonce: string; indice: string; reponse: string } }) {
  const [indice, setIndice] = useState(false)
  const [reponse, setReponse] = useState(false)

  return (
    <div className="mt-4 rounded-lg border border-accent/40 bg-fond px-4 py-3">
      <p className="text-xs uppercase tracking-widest text-accent">À toi, sans regarder</p>
      <p className="mt-2 text-sm leading-relaxed">{a.enonce}</p>

      <div className="mt-3 flex flex-wrap gap-3 text-xs">
        {!indice && (
          <button onClick={() => setIndice(true)} className="text-doux hover:text-texte">
            Un indice
          </button>
        )}
        {!reponse && (
          <button onClick={() => setReponse(true)} className="text-doux hover:text-texte">
            Voir la réponse
          </button>
        )}
      </div>

      {indice && <p className="mt-3 text-sm leading-relaxed text-doux">Indice — {a.indice}</p>}
      {reponse && (
        <p className="mt-3 border-t border-bord pt-3 text-sm leading-relaxed">
          <span className="text-juste">Réponse — </span>
          {a.reponse}
        </p>
      )}
    </div>
  )
}

/**
 * Ce sur quoi la leçon s'appuie, dit franchement.
 *
 * Les leçons ont été écrites de mémoire du concours. Sur les types dont la
 * banque ne contient aucune question d'annale, rien ne vient corroborer la
 * fréquence annoncée : le lecteur a le droit de savoir où la parole de l'auteur
 * est seule.
 */
function Provenance({ temoins }: { temoins: number }) {
  return (
    <p className="mt-2 text-xs leading-relaxed text-blanc">
      {temoins === 0
        ? '⚠ Aucune question d’annale de ce type dans ta banque : cette leçon repose sur la connaissance du concours, pas sur des questions réelles vérifiées. Sa méthode reste valable ; sa fréquence à l’épreuve n’est pas corroborée.'
        : `Adossée à ${temoins} question${temoins > 1 ? 's' : ''} d’annale de ce type dans ta banque.`}
    </p>
  )
}

/**
 * Le marquage d'une leçon comme étudiée, et le temps passé dessus.
 *
 * Sans cette trace, le plan hebdomadaire represcrit indéfiniment les mêmes
 * leçons : il n'a aucun moyen de savoir ce qui a été vu. Le chronomètre part à
 * l'ouverture de la carte et s'arrête au marquage — c'est une mesure grossière,
 * mais c'est la seule qui ne demande rien à l'utilisateur.
 */
function Etudiee({ lecon }: { lecon: LeconAffichable }) {
  const [etudiee, setEtudiee] = useState(lecon.etudieeLe !== null)
  const [occupe, setOccupe] = useState(false)
  const [echec, setEchec] = useState(false)
  const ouverture = useRef(Date.now())

  const basculer = async () => {
    setOccupe(true)
    try {
      const minutes = etudiee ? 0 : Math.min(60, (Date.now() - ouverture.current) / 60000)
      await poster('/api/plan', {
        action: 'lecon',
        skillId: lecon.skillId,
        etudiee: !etudiee,
        minutes,
      })
      setEtudiee((v) => !v)
      setEchec(false)
    } catch {
      // Le bouton ne doit pas mentir : sans enregistrement, pas de coche.
      setEchec(true)
    } finally {
      setOccupe(false)
    }
  }

  return (
    <button
      onClick={basculer}
      disabled={occupe}
      title={echec ? 'Non enregistré : le serveur n’a pas répondu.' : undefined}
      className={`rounded-lg border px-3.5 py-2 text-xs transition disabled:opacity-50 ${
        etudiee ? 'border-juste text-juste' : 'border-bord text-doux hover:text-texte'
      }`}
    >
      {echec ? '⚠ Non enregistrée' : etudiee ? '✓ Étudiée' : 'Marquer comme étudiée'}
    </button>
  )
}
