/**
 * Couche IA dégradable.
 *
 * PRINCIPE P5 : l'IA est un supplément, jamais une dépendance. L'application
 * doit être entièrement fonctionnelle et utile sans aucun appel de modèle.
 * Tout ce qui vit ici est additif : si rien n'est configuré, le fournisseur
 * `aucun` répond « indisponible » et l'interface affiche son contenu
 * statistique, qui constitue déjà l'essentiel de la valeur.
 *
 * Contrainte de budget : 0 €/mois. La chaîne par défaut privilégie donc les
 * paliers gratuits, et aucun fournisseur payant n'est actif sans que
 * l'utilisateur ait délibérément posé une clé.
 */

export type IdFournisseur = 'gemini-free' | 'groq-free' | 'ollama-local' | 'anthropic' | 'aucun'

export interface ResultatIA {
  texte: string
  modele: string
  jetonsEntree?: number
  jetonsSortie?: number
}

export interface Fournisseur {
  id: IdFournisseur
  libelle: string
  /** Décrit pourquoi il est indisponible, ou null s'il est prêt. */
  indisponible(): string | null
  completer(systeme: string, message: string): Promise<ResultatIA>
}

/** Longueur maximale demandée : les paliers gratuits ont des quotas serrés. */
export const JETONS_SORTIE_MAX = 1200

/* ------------------------------------------------------------- aucun -- */

export const AUCUN: Fournisseur = {
  id: 'aucun',
  libelle: 'Aucune IA',
  indisponible: () => 'Aucun fournisseur configuré.',
  async completer() {
    throw new Error('Aucun fournisseur IA configuré.')
  },
}

/* ------------------------------------------------------ Google Gemini -- */

/**
 * Palier gratuit de Google AI Studio. Recommandé comme fournisseur principal :
 * le quota journalier suffit largement à un utilisateur unique qui déclenche
 * quelques débriefs par jour, et la qualité dépasse nettement ce qu'un petit
 * modèle local produit sur du matériel sans GPU dédié.
 */
function gemini(): Fournisseur {
  const cle = process.env.GEMINI_API_KEY?.trim()
  const modele = process.env.GEMINI_MODELE?.trim() || 'gemini-3.8-flash' // dernier Flash stable, gratuit (vérifié le 26/09/2026)

  return {
    id: 'gemini-free',
    libelle: `Google AI Studio (${modele})`,
    indisponible: () => (cle ? null : 'GEMINI_API_KEY absente de .env.local'),
    async completer(systeme, message) {
      const r = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modele}:generateContent`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-goog-api-key': cle! },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: systeme }] },
            contents: [{ role: 'user', parts: [{ text: message }] }],
            generationConfig: { maxOutputTokens: JETONS_SORTIE_MAX, temperature: 0.4 },
          }),
        },
      )

      if (!r.ok) throw new Error(`Gemini ${r.status} : ${(await r.text()).slice(0, 200)}`)

      const data = (await r.json()) as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
        usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number }
      }

      const texte = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('') ?? ''
      if (!texte.trim()) throw new Error('Réponse Gemini vide.')

      return {
        texte,
        modele,
        jetonsEntree: data.usageMetadata?.promptTokenCount,
        jetonsSortie: data.usageMetadata?.candidatesTokenCount,
      }
    },
  }
}

/* -------------------------------------------------------------- Groq -- */

/** Repli quand le quota Gemini est atteint. API compatible OpenAI. */
function groq(): Fournisseur {
  const cle = process.env.GROQ_API_KEY?.trim()
  const modele = process.env.GROQ_MODELE?.trim() || 'llama-3.3-70b-versatile'

  return {
    id: 'groq-free',
    libelle: `Groq (${modele})`,
    indisponible: () => (cle ? null : 'GROQ_API_KEY absente de .env.local'),
    async completer(systeme, message) {
      const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cle}` },
        body: JSON.stringify({
          model: modele,
          max_tokens: JETONS_SORTIE_MAX,
          temperature: 0.4,
          messages: [
            { role: 'system', content: systeme },
            { role: 'user', content: message },
          ],
        }),
      })

      if (!r.ok) throw new Error(`Groq ${r.status} : ${(await r.text()).slice(0, 200)}`)

      const data = (await r.json()) as {
        choices?: Array<{ message?: { content?: string } }>
        usage?: { prompt_tokens?: number; completion_tokens?: number }
      }

      const texte = data.choices?.[0]?.message?.content ?? ''
      if (!texte.trim()) throw new Error('Réponse Groq vide.')

      return {
        texte,
        modele,
        jetonsEntree: data.usage?.prompt_tokens,
        jetonsSortie: data.usage?.completion_tokens,
      }
    },
  }
}

/* ------------------------------------------------------------ Ollama -- */

/**
 * Modèle local. Prévu, mais **désactivé par défaut** : sur le matériel cible
 * (Ryzen 8845HS, iGPU non exploitable par ROCm sous Windows, ~6 Go de RAM
 * libre) un modèle 7B quantifié tourne sur CPU à 40-70 s par débrief, avec un
 * suivi d'instructions et une fiabilité du JSON nettement inférieurs.
 * À activer si la machine change.
 */
function ollama(): Fournisseur {
  const hote = process.env.OLLAMA_HOTE?.trim() || 'http://localhost:11434'
  const modele = process.env.OLLAMA_MODELE?.trim()

  return {
    id: 'ollama-local',
    libelle: `Ollama local (${modele ?? 'non configuré'})`,
    indisponible: () => (modele ? null : 'OLLAMA_MODELE absent de .env.local'),
    async completer(systeme, message) {
      const r = await fetch(`${hote}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: modele,
          stream: false,
          options: { temperature: 0.4, num_predict: JETONS_SORTIE_MAX },
          messages: [
            { role: 'system', content: systeme },
            { role: 'user', content: message },
          ],
        }),
      })

      if (!r.ok) throw new Error(`Ollama ${r.status} : ${(await r.text()).slice(0, 200)}`)

      const data = (await r.json()) as {
        message?: { content?: string }
        prompt_eval_count?: number
        eval_count?: number
      }

      const texte = data.message?.content ?? ''
      if (!texte.trim()) throw new Error('Réponse Ollama vide.')

      return {
        texte,
        modele: modele!,
        jetonsEntree: data.prompt_eval_count,
        jetonsSortie: data.eval_count,
      }
    },
  }
}

/* --------------------------------------------------------- Anthropic -- */

/**
 * Fournisseur payant, présent pour le jour où le budget le permettrait.
 * Jamais actif sans clé explicitement posée.
 */
function anthropic(): Fournisseur {
  const cle = process.env.ANTHROPIC_API_KEY?.trim()
  const modele = process.env.ANTHROPIC_MODELE?.trim() || 'claude-opus-5-5'

  return {
    id: 'anthropic',
    libelle: `Anthropic (${modele})`,
    indisponible: () => (cle ? null : 'ANTHROPIC_API_KEY absente de .env.local'),
    async completer(systeme, message) {
      const { default: Anthropic } = await import('@anthropic-ai/sdk')
      const client = new Anthropic()

      try {
        const reponse = await client.messages.create({
          model: modele,
          max_tokens: JETONS_SORTIE_MAX,
          system: systeme,
          // Un débrief pédagogique court n'a pas besoin d'un effort élevé, et
          // le budget de ce projet reste la contrainte première.
          output_config: { effort: 'low' },
          messages: [{ role: 'user', content: message }],
        })

        const texte = reponse.content
          .filter((b): b is Extract<typeof b, { type: 'text' }> => b.type === 'text')
          .map((b) => b.text)
          .join('')

        if (!texte.trim()) throw new Error('Réponse Anthropic vide.')

        return {
          texte,
          modele,
          jetonsEntree: reponse.usage.input_tokens,
          jetonsSortie: reponse.usage.output_tokens,
        }
      } catch (e) {
        const { default: A } = await import('@anthropic-ai/sdk')
        if (e instanceof A.AuthenticationError) throw new Error('Clé Anthropic invalide.')
        if (e instanceof A.RateLimitError) throw new Error('Quota Anthropic atteint.')
        if (e instanceof A.APIError) throw new Error(`Anthropic ${e.status} : ${e.message}`)
        throw e
      }
    },
  }
}

/* ------------------------------------------------------------ chaîne -- */

const CONSTRUCTEURS: Record<Exclude<IdFournisseur, 'aucun'>, () => Fournisseur> = {
  'gemini-free': gemini,
  'groq-free': groq,
  'ollama-local': ollama,
  anthropic,
}

/**
 * Ordre de repli par défaut. Ollama est volontairement absent : il est
 * branchable mais pas actif (voir plus haut).
 */
export const CHAINE_PAR_DEFAUT: IdFournisseur[] = ['gemini-free', 'groq-free', 'anthropic']

function chaineConfiguree(): IdFournisseur[] {
  const brut = process.env.IA_CHAINE?.trim()
  if (!brut) return CHAINE_PAR_DEFAUT

  const demandes = brut
    .split(',')
    .map((s) => s.trim())
    .filter((s): s is Exclude<IdFournisseur, 'aucun'> => s in CONSTRUCTEURS)

  return demandes.length > 0 ? demandes : CHAINE_PAR_DEFAUT
}

export interface EtatFournisseur {
  id: IdFournisseur
  libelle: string
  raisonIndisponibilite: string | null
}

/** État de tous les fournisseurs de la chaîne, pour l'affichage des réglages. */
export function etatChaine(): EtatFournisseur[] {
  return chaineConfiguree().map((id) => {
    const f = CONSTRUCTEURS[id as Exclude<IdFournisseur, 'aucun'>]()
    return { id: f.id, libelle: f.libelle, raisonIndisponibilite: f.indisponible() }
  })
}

/**
 * Premier fournisseur disponible de la chaîne, ou `AUCUN`.
 *
 * Ne lève jamais : l'absence de fournisseur est un état normal du produit,
 * pas une erreur.
 */
export function fournisseurActif(): Fournisseur {
  for (const id of chaineConfiguree()) {
    const f = CONSTRUCTEURS[id as Exclude<IdFournisseur, 'aucun'>]()
    if (f.indisponible() === null) return f
  }
  return AUCUN
}

export function iaDisponible(): boolean {
  return fournisseurActif().id !== 'aucun'
}
