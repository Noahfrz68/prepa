import { NextResponse } from 'next/server'
import { reponseErreur } from '@/app/api/erreurs'
import { anomaliesComprehension, parserComprehension } from '@/core/import/comprehension'
import type { ResultatComprehension } from '@/core/import/comprehension'
import { lireZip } from '@/core/import/zip'
import { insererComprehension } from '@/core/db/comprehension'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Une série de compréhension pèse quelques dizaines de kilo-octets ; au-delà, ce n'en est pas une. */
const TAILLE_MAX = 20 * 1024 * 1024

function estMarkdown(nom: string) {
  return /\.(md|markdown|txt)$/i.test(nom)
}

export async function POST(request: Request) {
  try {
    const form = await request.formData()
    const fichier = form.get('fichier')
    const apercuSeulement = form.get('apercuSeulement') === 'true'

    if (!(fichier instanceof File)) {
      return NextResponse.json({ erreur: 'Aucun fichier reçu.' }, { status: 400 })
    }
    if (fichier.size > TAILLE_MAX) {
      return NextResponse.json({ erreur: 'Fichier trop volumineux (20 Mo maximum).' }, { status: 400 })
    }

    const donnees = Buffer.from(await fichier.arrayBuffer())
    const avertissements: string[] = []
    const sources: Array<{ nom: string; contenu: string }> = []

    if (/\.zip$/i.test(fichier.name)) {
      const archive = lireZip(donnees)
      avertissements.push(...archive.avertissements)
      for (const f of archive.fichiers) {
        if (!estMarkdown(f.nom)) continue
        sources.push({ nom: f.nom.split('/').pop() ?? f.nom, contenu: f.contenu.toString('utf8') })
      }
      if (sources.length === 0) {
        return NextResponse.json(
          { erreur: 'Aucun fichier Markdown dans l’archive.' },
          { status: 400 },
        )
      }
    } else if (estMarkdown(fichier.name)) {
      sources.push({ nom: fichier.name, contenu: donnees.toString('utf8') })
    } else {
      return NextResponse.json(
        { erreur: `Format non pris en charge : ${fichier.name}. Attendu : .md, .txt ou .zip.` },
        { status: 400 },
      )
    }

    // Un fichier sans question est un sommaire ou une préface : il n'a rien à
    // faire en banque, mais ce n'est pas une erreur non plus.
    const resultats: ResultatComprehension[] = []
    const ignores: string[] = []
    for (const s of sources.sort((a, b) => a.nom.localeCompare(b.nom))) {
      const r = parserComprehension(s.nom, s.contenu)
      if (r.questions.length === 0) {
        ignores.push(s.nom)
        continue
      }
      resultats.push(r)
    }

    if (resultats.length === 0) {
      return NextResponse.json(
        { erreur: 'Aucune question trouvée. Attendu : « ## TEXTE … », « **Question N.** », « # CORRIGÉ ».' },
        { status: 400 },
      )
    }

    const anomalies = resultats.flatMap(anomaliesComprehension)
    if (ignores.length > 0) {
      avertissements.push(`Sans question, donc ignoré${ignores.length > 1 ? 's' : ''} : ${ignores.join(', ')}.`)
    }

    const resume = {
      fichiers: resultats.map((r) => ({
        nom: r.fichier,
        textes: r.textes.length,
        questions: r.questions.length,
      })),
      totalTextes: resultats.reduce((n, r) => n + r.textes.length, 0),
      totalQuestions: resultats.reduce((n, r) => n + r.questions.length, 0),
      anomalies: anomalies.slice(0, 20),
      nbAnomalies: anomalies.length,
      avertissements,
    }

    if (apercuSeulement) {
      return NextResponse.json({ ...resume, inseres: 0, doublons: 0 })
    }

    const insertion = insererComprehension(resultats)

    return NextResponse.json({
      ...resume,
      ...insertion,
      avertissements: [...avertissements, ...insertion.avertissements],
    })
  } catch (e) {
    return reponseErreur(e)
  }
}
