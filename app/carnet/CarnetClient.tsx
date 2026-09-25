'use client'

import Link from 'next/link'
import { EnonceRappel, Proposition } from '@/app/_composants/Enonce'
import { useCallback, useEffect, useRef, useState } from 'react'
import { poster, lire } from '@/app/_composants/reseau'
import { OPTIONS_CONDITIONS_MINIMALES } from '@/exams/tagemage'
import type { EntreeCarnet, OrdreCarnet, ResumeCarnet } from '@/core/db/carnet'

const LETTRES = ['A', 'B', 'C', 'D', 'E'] as const
const PAR_TRANCHE = 10

/**
 * Le carnet d'erreurs.
 *
 * Trois gestes, et rien d'autre : relire ce qu'on a raté, écrire pourquoi on
 * s'est trompé, et rejouer. Tout ajout au-delà de ces trois-là ferait du carnet
 * une seconde page de statistiques — or les statistiques existent déjà ailleurs,
 * et ce n'est pas ce qu'on vient chercher ici.
 */
export default function CarnetClient({
  entreesInitiales,
  resumeInitial,
}: {
  entreesInitiales: EntreeCarnet[]
  resumeInitial: ResumeCarnet
}) {
  const [entrees, setEntrees] = useState(entreesInitiales)
  const [resume, setResume] = useState(resumeInitial)
  const [section, setSection] = useState<string>('')
  const [type, setType] = useState<string>('')
  const [ordre, setOrdre] = useState<OrdreCarnet>('priorite')
  const [comprises, setComprises] = useState(false)
  const [chargement, setChargement] = useState(false)
  // Deux cents questions d'un bloc ne se lisent pas : on en montre dix, les
  // plus prioritaires, et le reste à la demande.
  const [visibles, setVisibles] = useState(PAR_TRANCHE)

  const recharger = useCallback(
    async (f: { section: string; type: string; ordre: OrdreCarnet; comprises: boolean }) => {
      setChargement(true)
      try {
        const p = new URLSearchParams()
        if (f.section) p.set('section', f.section)
        if (f.type) p.set('type', f.type)
        if (f.ordre !== 'priorite') p.set('ordre', f.ordre)
        if (f.comprises) p.set('comprises', '1')
        const data = await lire<{ entrees: EntreeCarnet[]; resume: ResumeCarnet }>(
          `/api/carnet?${p}`,
        )
        setEntrees(data.entrees)
        setResume(data.resume)
        setVisibles(PAR_TRANCHE)
      } finally {
        setChargement(false)
      }
    },
    [],
  )

  const changerFiltre = (
    changements: Partial<{ section: string; type: string; ordre: OrdreCarnet; comprises: boolean }>,
  ) => {
    const f = { section, type, ordre, comprises, ...changements }
    // Un type appartient à un sous-test : changer de sous-test l'efface.
    if (changements.section !== undefined && changements.type === undefined) f.type = ''
    setSection(f.section)
    setType(f.type)
    setOrdre(f.ordre)
    setComprises(f.comprises)
    void recharger(f)
  }

  const typesAffiches = resume.parType.filter((t) => !section || t.section === section)
  const lienRejouer =
    `/tagemage/drill?section=${section || 'toutes'}&carnet=1` +
    `&taille=${Math.min(15, type ? (resume.parType.find((t) => t.skillId === type)?.n ?? 15) : resume.aTravailler)}` +
    (type ? `&skills=${type}` : '')

  /** Retire l'entrée de la liste sans recharger : le geste doit être immédiat. */
  const apresCompris = (itemId: number, compris: boolean, nouveauResume: ResumeCarnet) => {
    setResume(nouveauResume)
    if (compris && !comprises) setEntrees((l) => l.filter((e) => e.itemId !== itemId))
    else setEntrees((l) => l.map((e) => (e.itemId === itemId ? { ...e, comprisLe: compris ? 'maintenant' : null } : e)))
  }

  if (resume.aTravailler === 0 && resume.comprises === 0) {
    return (
      <div className="rounded-xl border border-bord bg-carte px-5 py-6">
        <p className="text-sm leading-relaxed">
          Ton carnet est vide : aucune question ratée ni sautée pour l’instant.
        </p>
        <p className="mt-2 text-sm leading-relaxed text-doux">
          Il se remplira tout seul à ta prochaine série. Rien à configurer.
        </p>
        <Link
          href="/tagemage"
          className="mt-5 inline-block rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-fond hover:opacity-90"
        >
          Lancer une série
        </Link>
      </div>
    )
  }

  return (
    <div>
      <section className="mb-6 rounded-xl border border-bord bg-carte px-5 py-4">
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <p className="text-sm">
            <span className="chiffres text-2xl font-semibold">{resume.aTravailler}</span>{' '}
            <span className="text-doux">
              question{resume.aTravailler > 1 ? 's' : ''} à revoir
            </span>
            {resume.comprises > 0 && (
              <span className="text-doux">
                {' '}· <span className="chiffres text-juste">{resume.comprises}</span> comprise
                {resume.comprises > 1 ? 's' : ''}
              </span>
            )}
          </p>

          {resume.aTravailler > 0 && (
            <Link
              href={lienRejouer}
              className="rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-fond hover:opacity-90"
            >
              Rejouer {type ? 'ce type' : 'mes erreurs'}
            </Link>
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Filtre actif={section === ''} onClick={() => changerFiltre({ section: '' })}>
            Tous les sous-tests
          </Filtre>
          {resume.parSection.map((s) => (
            <Filtre
              key={s.section}
              actif={section === s.section}
              onClick={() => changerFiltre({ section: s.section })}
            >
              {s.libelle} <span className="chiffres text-doux">{s.n}</span>
            </Filtre>
          ))}
          <Filtre actif={comprises} onClick={() => changerFiltre({ comprises: !comprises })}>
            {comprises ? 'Masquer les comprises' : 'Montrer les comprises'}
          </Filtre>
        </div>

        {typesAffiches.length > 0 && (
          <div className="mt-4 border-t border-bord pt-3">
            <p className="mb-2 text-xs uppercase tracking-widest text-doux">
              Les types qui reviennent le plus
            </p>
            <div className="flex flex-wrap gap-2">
              {typesAffiches.map((t) => (
                <Filtre
                  key={t.skillId}
                  actif={type === t.skillId}
                  onClick={() => changerFiltre({ type: type === t.skillId ? '' : t.skillId })}
                >
                  {t.libelle} <span className="chiffres text-doux">{t.n}</span>
                </Filtre>
              ))}
            </div>
          </div>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-bord pt-3 text-xs text-doux">
          <span className="mr-1">Ordre :</span>
          <Filtre actif={ordre === 'priorite'} onClick={() => changerFiltre({ ordre: 'priorite' })}>
            Priorité
          </Filtre>
          <Filtre actif={ordre === 'recentes'} onClick={() => changerFiltre({ ordre: 'recentes' })}>
            Plus récentes
          </Filtre>
          {ordre === 'priorite' && (
            <span className="ml-1">
              pas encore réussies depuis, puis les plus souvent ratées, puis les plus récentes
            </span>
          )}
        </div>
      </section>

      {chargement && <p className="py-4 text-sm text-doux">Chargement…</p>}

      {!chargement && entrees.length === 0 && (
        <p className="rounded-xl border border-bord bg-carte px-5 py-4 text-sm text-doux">
          Rien à revoir avec ce filtre.
        </p>
      )}

      {!chargement && entrees.length > 0 && ordre === 'priorite' && (
        <h2 className="mb-3 text-sm uppercase tracking-widest text-doux">
          À revoir en priorité
        </h2>
      )}

      <ol className="space-y-3">
        {entrees.slice(0, visibles).map((e) => (
          <Entree key={e.itemId} e={e} onCompris={apresCompris} />
        ))}
      </ol>

      {entrees.length > visibles && (
        <button
          onClick={() => setVisibles((v) => v + 20)}
          className="mt-4 w-full rounded-lg border border-bord px-4 py-2.5 text-sm text-doux transition hover:text-texte"
        >
          Afficher {Math.min(20, entrees.length - visibles)} de plus ·{' '}
          <span className="chiffres">{entrees.length - visibles}</span> restantes
        </button>
      )}
    </div>
  )
}

function Filtre({
  actif,
  onClick,
  children,
}: {
  actif: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-xs transition ${
        actif ? 'border-accent text-accent' : 'border-bord text-doux hover:text-texte'
      }`}
    >
      {children}
    </button>
  )
}

function Entree({
  e,
  onCompris,
}: {
  e: EntreeCarnet
  onCompris: (itemId: number, compris: boolean, resume: ResumeCarnet) => void
}) {
  const [note, setNote] = useState(e.note ?? '')
  const [enregistre, setEnregistre] = useState<'repos' | 'en cours' | 'fait' | 'echec'>('repos')
  const [deplie, setDeplie] = useState(false)
  const minuteur = useRef<ReturnType<typeof setTimeout> | null>(null)

  // La note s'enregistre toute seule une seconde après la dernière frappe :
  // un bouton « enregistrer » sur un champ de ce genre se fait oublier, et la
  // note se perd au changement de page.
  useEffect(() => {
    if (note === (e.note ?? '')) return
    if (minuteur.current) clearTimeout(minuteur.current)
    minuteur.current = setTimeout(async () => {
      setEnregistre('en cours')
      try {
        await poster('/api/carnet', { action: 'noter', itemId: e.itemId, note })
        setEnregistre('fait')
      } catch {
        // Une note perdue n'est pas dramatique, mais le silence le serait :
        // l'étiquette reste sur « en cours » plutôt que d'annoncer « enregistré ».
        setEnregistre('echec')
      }
      setTimeout(() => setEnregistre('repos'), 2500)
    }, 1000)
    return () => {
      if (minuteur.current) clearTimeout(minuteur.current)
    }
  }, [note, e.note, e.itemId])

  const basculerCompris = async () => {
    const compris = !e.comprisLe
    try {
      const data = await poster<{ resume: ResumeCarnet }>('/api/carnet', {
        action: 'compris',
        itemId: e.itemId,
        compris,
      })
      if (data.resume) onCompris(e.itemId, compris, data.resume)
    } catch {
      // On ne touche pas à l'affichage : mieux vaut que la question reste
      // visible que de la faire disparaître sans qu'elle soit enregistrée.
    }
  }

  const options = e.typeItem === 'conditions_minimales' ? OPTIONS_CONDITIONS_MINIMALES : e.options
  const iBonne = LETTRES.indexOf(e.bonneReponse as (typeof LETTRES)[number])
  const iDonnee = e.derniereReponse
    ? LETTRES.indexOf(e.derniereReponse as (typeof LETTRES)[number])
    : -1

  return (
    <li
      className={`rounded-xl border bg-carte px-5 py-4 ${
        e.comprisLe ? 'border-bord opacity-70' : 'border-bord'
      }`}
    >
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 text-xs text-doux">
        <span>{e.sectionLibelle}</span>
        {e.nbEchecs > 0 && (
          <span className="text-faux">
            {e.nbEchecs} erreur{e.nbEchecs > 1 ? 's' : ''}
          </span>
        )}
        {e.nbSauts > 0 && (
          <span className="text-blanc">
            {e.nbSauts} saut{e.nbSauts > 1 ? 's' : ''}
          </span>
        )}
        {e.reussieDepuis && <span className="text-juste">réussie depuis</span>}
        {e.comprisLe && <span className="text-juste">comprise</span>}
      </div>

      <EnonceRappel
        enonce={e.enonce}
        figure={e.figure}
        imageHash={e.imageHash}
        annale={e.annale}
      />

      {e.typeItem === 'conditions_minimales' && (
        <div className="mt-2 space-y-1 text-sm text-doux">
          <p>(1) {e.info1}</p>
          <p>(2) {e.info2}</p>
        </div>
      )}

      <div className="mt-3 text-sm">
        <span className="text-doux">Bonne réponse : </span>
        <span className="text-juste">{e.bonneReponse}</span>
        {options[iBonne] && (
          <span className="text-juste">
            {' — '}
            <Proposition texte={options[iBonne]} c={e.optionsFigure?.[iBonne]} taille={48} />
          </span>
        )}
      </div>

      {e.derniereReponse && (
        <div className="mt-1 text-sm">
          <span className="text-doux">Ta réponse : </span>
          <span className="text-faux">{e.derniereReponse}</span>
          {options[iDonnee] && (
            <span className="text-faux">
              {' — '}
              <Proposition texte={options[iDonnee]} c={e.optionsFigure?.[iDonnee]} taille={48} />
            </span>
          )}
          {e.diagnostic && <span className="text-doux"> — {e.diagnostic}</span>}
        </div>
      )}

      {e.explication && (
        <div className="mt-3">
          <button
            onClick={() => setDeplie((v) => !v)}
            className="text-xs uppercase tracking-widest text-doux hover:text-texte"
          >
            {deplie ? '− La démarche' : '+ La démarche'}
          </button>
          {deplie && (
            <p className="mt-2 whitespace-pre-line border-t border-bord pt-3 text-sm leading-relaxed text-doux">
              {e.explication}
            </p>
          )}
        </div>
      )}

      <div className="mt-4">
        <label className="text-xs uppercase tracking-widest text-doux" htmlFor={`note-${e.itemId}`}>
          Pourquoi je me suis trompé
          {enregistre === 'en cours' && <span className="ml-2 normal-case tracking-normal">…</span>}
          {enregistre === 'fait' && (
            <span className="ml-2 normal-case tracking-normal text-juste">enregistré</span>
          )}
          {enregistre === 'echec' && (
            <span className="ml-2 normal-case tracking-normal text-faux">
              non enregistré — serveur injoignable
            </span>
          )}
        </label>
        <textarea
          id={`note-${e.itemId}`}
          value={note}
          onChange={(ev) => setNote(ev.target.value)}
          rows={2}
          placeholder="Ce que j’ai mal lu, la règle que j’ai oubliée…"
          className="mt-1.5 w-full resize-y rounded-lg border border-bord bg-fond px-3 py-2 text-sm outline-none placeholder:text-blanc focus:border-accent"
        />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          onClick={basculerCompris}
          className={`rounded-lg border px-3 py-2 text-sm transition ${
            e.comprisLe
              ? 'border-bord text-doux hover:text-texte'
              : 'border-juste text-juste hover:opacity-80'
          }`}
        >
          {e.comprisLe ? 'Remettre dans la pile' : 'J’ai compris'}
        </button>

        {e.skillId && (
          <Link
            href={`/tagemage/cours#${e.skillId}`}
            className="text-sm text-accent hover:underline"
          >
            {e.leconTitre ? `Revoir « ${e.leconTitre} »` : 'Revoir la leçon'} →
          </Link>
        )}
      </div>
    </li>
  )
}
