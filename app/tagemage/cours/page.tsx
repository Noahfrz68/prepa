import Link from 'next/link'
import Logique from '@/app/cours/Logique'
import FichesClient, { type FicheAffichable } from '@/app/cours/FichesClient'
import LeconsClient, { type LeconAffichable } from '@/app/cours/LeconsClient'
import Parcours, { type EtapeAffichable } from '@/app/cours/Parcours'
import Tables from '@/app/cours/Tables'
import { FICHES, REGLES_GENERALES } from '@/exams/tagemage/cours'
import { LECONS, PARCOURS, PAR_SKILL, TABLES } from '@/exams/tagemage/lecons'
import { etatSectionsTageMage, mesuresParSkill, temoinsAnnale } from '@/core/db/queries'
import { etudeDesLecons } from '@/core/db/semaine'

export const dynamic = 'force-dynamic'

/** En dessous, un taux mesuré ne veut rien dire : on ne classe pas dessus. */
const MINIMUM_POUR_CLASSER = 10

/**
 * Une leçon n'est signalée « à travailler » qu'à partir de cinq réponses.
 *
 * Le seuil est plus bas que celui des sous-tests parce qu'une sous-compétence
 * reçoit dix fois moins de questions : attendre dix réponses par type ne
 * signalerait jamais rien. Cinq ne suffisent pas à mesurer, mais suffisent à
 * ORIENTER — et c'est tout ce qu'on demande à ce drapeau.
 */
const MINIMUM_PAR_LECON = 5
const SEUIL_FAIBLE = 0.6

export default function CoursTageMage() {
  const etats = new Map(etatSectionsTageMage().map((e) => [e.id, e]))
  const mesures = mesuresParSkill()
  const etude = etudeDesLecons()
  const temoins = temoinsAnnale()

  const tauxDe = (skillId: string) => {
    const m = mesures.get(skillId)
    return (m?.n ?? 0) >= MINIMUM_PAR_LECON ? m!.justes / m!.n : null
  }

  const lecons: LeconAffichable[] = LECONS.map((l) => {
    const taux = tauxDe(l.skillId)
    return {
      skillId: l.skillId,
      section: l.section,
      sectionLibelle: etats.get(l.section)?.libelle ?? l.section,
      titre: l.titre,
      quoi: l.quoi,
      regles: l.regles,
      exemple: l.exemple,
      aToi: l.aToi,
      retrouver: l.retrouver,
      piege: l.piege,
      parCoeur: l.parCoeur,
      taux,
      nbReponses: mesures.get(l.skillId)?.n ?? 0,
      aTravailler: taux !== null && taux < SEUIL_FAIBLE,
      temoins: temoins.get(l.skillId) ?? 0,
      etudieeLe: etude.get(l.skillId)?.etudieeLe ?? null,
      minutesEtude: etude.get(l.skillId)?.minutes ?? 0,
    }
  })

  const etapes: EtapeAffichable[] = PARCOURS.map((e) => ({
    titre: e.titre,
    pourquoi: e.pourquoi,
    duree: e.duree,
    lecons: e.skillIds.map((id) => ({
      skillId: id,
      titre: PAR_SKILL.get(id)?.titre ?? id,
      taux: tauxDe(id),
    })),
  }))

  const sansTemoin = LECONS.filter((l) => (temoins.get(l.skillId) ?? 0) === 0).length

  const fiches: FicheAffichable[] = FICHES.map((f) => {
    const e = etats.get(f.section)
    return {
      cle: f.section,
      titre: e?.libelle ?? f.section,
      soustitre: `Sous-test ${e?.numero ?? '—'} · ${e?.bloc ?? ''}`,
      enjeu: f.enjeu,
      methode: f.methode,
      pieges: f.pieges,
      strategie: f.strategie,
      taux: (e?.nbTentatives ?? 0) >= MINIMUM_POUR_CLASSER ? (e?.tauxReussite ?? null) : null,
      nbTentatives: e?.nbTentatives ?? 0,
      prioritaire: false,
    }
  })

  // La fiche mise en avant est celle que les mesures désignent, pas celle qu'on
  // suppose difficile. Sans assez de tentatives, aucune n'est mise en avant :
  // afficher une priorité inventée serait pire que de n'en afficher aucune.
  const mesurees = fiches.filter((f) => f.taux !== null)
  const faible = mesurees.length > 0
    ? mesurees.reduce((pire, f) => (f.taux! < pire.taux! ? f : pire))
    : null
  if (faible) faible.prioritaire = true

  // L'ordre de l'épreuve est celui que la préparation doit suivre : classer par
  // faiblesse ferait perdre le repère du déroulé réel.
  return (
    <main className="mx-auto max-w-3xl px-6 py-14">
      <Link href="/tagemage" className="text-sm text-doux hover:text-texte">
        ← TAGE MAGE
      </Link>

      <header className="mt-6 mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Cours et astuces</h1>
        <p className="mt-2 text-sm leading-relaxed text-doux">
          Le TAGE MAGE n’évalue aucun programme scolaire — mais il teste des techniques, et elles
          sont en nombre fini. Cette page les contient toutes : {LECONS.length} leçons, une par
          type de question, chacune avec sa règle, un exemple déroulé et le piège qu’elle tend.
          {faible && (
            <>
              {' '}Tes mesures placent <span className="text-texte">{faible.titre}</span> en
              premier — sa fiche de conduite est déjà ouverte plus bas.
            </>
          )}
        </p>
      </header>

      <section className="mb-12">
        <h2 className="mb-1 text-sm uppercase tracking-widest text-doux">Par où commencer</h2>
        <p className="mb-4 text-xs leading-relaxed text-blanc">
          L’ordre suit le rendement, pas le programme : d’abord ce qui se gagne par la méthode,
          en dernier ce qui demande des mois de langue. C’est un jugement, pas une mesure.
        </p>
        <Parcours etapes={etapes} />
      </section>

      {/* La logique est le seul sous-test où le niveau de départ ne compte
          presque pas et la procédure compte presque tout. Ce socle-là vaut pour
          ses seize familles à la fois : le laisser dans chaque leçon obligerait
          à le lire seize fois, et à ne jamais le voir en entier. */}
      <section className="mb-12">
        <h2 className="mb-1 text-sm uppercase tracking-widest text-doux">
          Le sous-test de logique, de A à Z
        </h2>
        <p className="mb-4 text-xs leading-relaxed text-blanc">
          Aucune connaissance n’y est exigée, et c’est ce qui le rend difficile : sans procédure,
          on fixe la série en espérant que la règle apparaisse. Voici les quatre gestes communs aux
          seize familles, et l’itinéraire de recherche à suivre quand rien ne saute aux yeux.
        </p>
        <Logique />
      </section>

      <section className="mb-12">
        <h2 className="mb-1 text-sm uppercase tracking-widest text-doux">
          Les techniques, une par type de question
        </h2>
        <p className="mb-4 text-xs leading-relaxed text-blanc">
          C’est le cœur de la page. Cherche par mot-clé quand tu viens de rater une question, ou
          ouvre le filtre « à travailler » : il n’affiche que les types où tes réponses passent
          sous {Math.round(SEUIL_FAIBLE * 100)} %.
        </p>
        <LeconsClient lecons={lecons} />
      </section>

      <section className="mb-12">
        <h2 className="mb-1 text-sm uppercase tracking-widest text-doux">
          La boîte à outils
        </h2>
        <p className="mb-4 text-xs leading-relaxed text-blanc">
          Ce qui doit être su sans réfléchir. À 80 secondes par question, ce qui se recalcule coûte
          une question sur cinq.
        </p>
        <Tables tables={TABLES} />
      </section>

      <section className="mb-12">
        <h2 className="mb-3 text-sm uppercase tracking-widest text-doux">
          Ce qui vaut pour toute l’épreuve
        </h2>
        <div className="space-y-3">
          {REGLES_GENERALES.map((r) => (
            <div key={r.titre} className="rounded-xl border border-bord bg-carte px-5 py-4">
              <p className="text-sm font-medium">{r.titre}</p>
              <p className="mt-1 text-sm leading-relaxed text-doux">{r.texte}</p>
            </div>
          ))}
        </div>
      </section>

      <h2 className="mb-1 text-sm uppercase tracking-widest text-doux">
        La conduite, sous-test par sous-test
      </h2>
      <p className="mb-4 text-xs leading-relaxed text-blanc">
        Non plus comment résoudre, mais dans quel ordre traiter les questions et à quel moment
        renoncer.
      </p>
      <FichesClient fiches={fiches} ouvertureInitiale={faible?.cle ?? null} />

      <p className="mt-10 text-xs leading-relaxed text-blanc">
        Les taux affichés sont les tiens, mesurés sur tes réponses. Une fiche de sous-test n’en
        montre qu’à partir de {MINIMUM_POUR_CLASSER} questions répondues, une leçon à partir de{' '}
        {MINIMUM_PAR_LECON} : en dessous, un pourcentage serait du bruit présenté comme un
        diagnostic.
      </p>
      <p className="mt-3 text-xs leading-relaxed text-blanc">
        Sur la provenance : ces leçons ont été écrites à partir de la connaissance du concours,
        pas d’un dépouillement d’annales. {sansTemoin} des {LECONS.length} portent sur des types
        dont ta banque ne contient aucune question réelle — elles sont signalées. Leur méthode
        reste valable ; c’est leur poids à l’épreuve qui n’est corroboré par rien.
      </p>
    </main>
  )
}
