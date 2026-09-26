import { fournisseurActif } from './fournisseurs'
import {
  GRILLES,
  LONGUEUR_ATTENDUE,
  TACHES_PAR_TYPE,
  compterMots,
  type NoteCritere,
} from '@/exams/toeic/writing'
import {
  enregistrerNotation,
  precedentesSurTache,
  production,
} from '@/core/db/writing'

/**
 * Notation d'une production écrite.
 *
 * Deux règles héritées de la couche IA (P5) :
 *   — sans fournisseur, la production est conservée et consultable, seule la
 *     note manque. On ne bloque pas l'entraînement sur la disponibilité d'un
 *     modèle ;
 *   — la note est portée par des critères, jamais par une impression globale,
 *     et chaque critère demande une justification citant le texte.
 *
 * La note finale est recalculée en TypeScript à partir des critères : le
 * modèle note les critères, il ne calcule pas le total.
 */

const PROMPT_NOTATION = `Tu notes une production écrite de TOEIC Writing.

Tu notes CRITÈRE PAR CRITÈRE, jamais globalement. Pour chaque critère : une note entière dans les bornes indiquées, et une justification d'une phrase qui CITE un passage précis de la production. Sans citation, la justification ne vaut rien.

Tu ne calcules aucun total : la note finale est calculée ailleurs à partir de tes critères.

Après les critères, écris trois à six lignes adressées à l'étudiant, en français :
— l'erreur la plus coûteuse, avec une reformulation corrigée d'un extrait ;
— ce qui fonctionne déjà et qu'il faut garder ;
— une consigne précise pour la prochaine production.

Pas de flatterie. Tutoie l'étudiant. Les exemples et reformulations restent en anglais.

Réponds avec un unique bloc \`\`\`json :

{
  "criteres": [{"id": "identifiant du critère", "note": 0, "justification": "une phrase citant le texte"}],
  "feedback": "le texte adressé à l'étudiant"
}

Le JSON doit être strictement valide. N'invente aucun identifiant de critère : utilise exactement ceux fournis.`

export interface ResultatNotation {
  statut: 'fait' | 'indisponible' | 'echoue'
  notes: NoteCritere[] | null
  noteGlobale: number | null
  feedback: string | null
  fournisseur: string | null
  modele: string | null
  erreur: string | null
}

function contexte(p: NonNullable<ReturnType<typeof production>>): string {
  const grille = GRILLES[p.type]
  const tache = TACHES_PAR_TYPE.get(p.type)!
  const attendu = LONGUEUR_ATTENDUE[p.type]
  const mots = compterMots(p.contenu)

  const precedentes = precedentesSurTache(p.promptTaskId, p.id).filter((x) => x.noteGlobale !== null)

  const lignes = [
    `<tache>${tache.libelle} · note maximale ${tache.noteMax}</tache>`,
    '<consigne>',
    p.consigne,
    '</consigne>',
    '<grille>',
    ...grille.map((c) => `${c.id} (0 à ${c.noteMax}) — ${c.libelle} : ${c.description}`),
    '</grille>',
    `<longueur>${mots} mots écrits, ${attendu.cible} attendus (minimum ${attendu.min})</longueur>`,
    `<temps>${Math.round(p.tempsMs / 60000)} min utilisées sur ${Math.round(tache.dureeReponseS / 60)}</temps>`,
    '<production>',
    p.contenu,
    '</production>',
  ]

  if (precedentes.length > 0) {
    lignes.push(
      `<historique>Productions antérieures sur ce sujet : ${precedentes
        .map((x) => `${x.noteGlobale}/${x.noteMax}`)
        .join(', ')}. Dis si elle progresse.</historique>`,
    )
  }

  return lignes.join('\n')
}

/** Ne lève jamais : l'absence de note est un état affichable, pas une erreur. */
export async function noterProduction(productionId: number): Promise<ResultatNotation> {
  const p = production(productionId)
  if (!p) {
    return {
      statut: 'echoue',
      notes: null,
      noteGlobale: null,
      feedback: null,
      fournisseur: null,
      modele: null,
      erreur: 'Production introuvable.',
    }
  }

  if (p.notes && p.noteGlobale !== null) {
    return {
      statut: 'fait',
      notes: p.notes,
      noteGlobale: p.noteGlobale,
      feedback: p.feedback,
      fournisseur: p.fournisseur,
      modele: p.modele,
      erreur: null,
    }
  }

  const fournisseur = fournisseurActif()
  if (fournisseur.id === 'aucun') {
    return {
      statut: 'indisponible',
      notes: null,
      noteGlobale: null,
      feedback: null,
      fournisseur: 'aucun',
      modele: null,
      erreur: fournisseur.indisponible(),
    }
  }

  try {
    const r = await fournisseur.completer(PROMPT_NOTATION, contexte(p))

    const bloc = r.texte.match(/```json\s*([\s\S]*?)```/i) ?? r.texte.match(/```\s*(\{[\s\S]*?\})\s*```/)
    if (!bloc) throw new Error('Réponse sans bloc JSON exploitable.')

    const objet = JSON.parse(bloc[1].trim()) as {
      criteres?: Array<{ id?: unknown; note?: unknown; justification?: unknown }>
      feedback?: unknown
    }

    // Deux garde-fous : on n'accepte que les critères de la grille, et on
    // borne la note au barème. Sans le second, l'écran afficherait « 9 / 1 »
    // alors que le total, lui, est correctement borné — l'affiché doit
    // correspondre au compté.
    const parId = new Map(GRILLES[p.type].map((c) => [c.id, c]))
    const notes: NoteCritere[] = (objet.criteres ?? [])
      .filter((c) => typeof c.id === 'string' && parId.has(c.id) && typeof c.note === 'number')
      .map((c) => ({
        id: c.id as string,
        note: Math.max(0, Math.min(parId.get(c.id as string)!.noteMax, c.note as number)),
        justification: typeof c.justification === 'string' ? c.justification : '',
      }))

    if (notes.length === 0) throw new Error('Aucun critère exploitable dans la réponse.')

    const feedback =
      typeof objet.feedback === 'string' && objet.feedback.trim()
        ? objet.feedback.trim()
        : r.texte.slice(0, bloc.index ?? r.texte.length).trim()

    const note = enregistrerNotation(p.id, p.type, notes, feedback, fournisseur.id, r.modele)

    return {
      statut: 'fait',
      notes,
      noteGlobale: note,
      feedback,
      fournisseur: fournisseur.id,
      modele: r.modele,
      erreur: null,
    }
  } catch (e) {
    return {
      statut: 'echoue',
      notes: null,
      noteGlobale: null,
      feedback: null,
      fournisseur: fournisseur.id,
      modele: null,
      erreur: (e as Error).message,
    }
  }
}
