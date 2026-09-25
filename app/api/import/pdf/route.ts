import { NextResponse } from 'next/server'
import { reponseErreur } from '@/app/api/erreurs'
import { ErreurRequete } from '@/core/erreurs'
import { parserPdf, texteDuPdf } from '@/core/import/pdf'
import { extraireFigures } from '@/core/import/figures'
import { insererDepuisPdf, insererFigures } from '@/core/db/contenu'
import type { SectionTageMage } from '@/exams/tagemage'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Limite de taille, pour ne pas charger un document démesuré en mémoire. */
const TAILLE_MAX = 40 * 1024 * 1024

export async function POST(request: Request) {
  try {
    const form = await request.formData()
    const fichier = form.get('fichier')
    const apercuSeulement = form.get('apercuSeulement') === 'true'

    if (!(fichier instanceof File)) {
      return NextResponse.json({ erreur: 'Aucun fichier reçu.' }, { status: 400 })
    }
    if (fichier.size > TAILLE_MAX) {
      return NextResponse.json({ erreur: 'Fichier trop volumineux (40 Mo maximum).' }, { status: 400 })
    }

    const donnees = new Uint8Array(await fichier.arrayBuffer())
    // Un fichier qui n'est pas un PDF lisible est une erreur de l'utilisateur,
    // pas du serveur : son message doit arriver à l'écran.
    let texte: string
    try {
      texte = await texteDuPdf(donnees)
    } catch (e) {
      throw new ErreurRequete(`PDF illisible : ${(e as Error).message}`)
    }
    const resultat = parserPdf(texte)

    const avertissements = [...resultat.avertissements]

    if (apercuSeulement || (resultat.questions.length === 0 && resultat.figures.length === 0)) {
      return NextResponse.json({
        ...resultat,
        // Les figures ne se résument pas en JSON : on n'en renvoie que le compte.
        figures: undefined,
        questions: resultat.questions.slice(0, 5),
        total: resultat.questions.length,
        totalFigures: resultat.figures.length,
        inseres: 0,
        doublons: 0,
        figuresInserees: 0,
      })
    }

    const insertion = insererDepuisPdf(resultat.questions)

    // Les questions à énoncé graphique demandent un rendu de page, découpé
    // question par question. C'est plus lent que l'extraction de texte : on ne
    // le fait que s'il y en a.
    let figuresInserees = 0
    if (resultat.figures.length > 0) {
      try {
        const images = await extraireFigures(
          donnees,
          resultat.figures.map((f) => ({ section: f.section as SectionTageMage, numero: f.numero })),
        )
        const r = insererFigures(resultat.figures, images)
        figuresInserees = r.inseres

        if (r.sansImage > 0) {
          avertissements.push(
            `${r.sansImage} question(s) à énoncé graphique sans image récupérable : elles ne sont pas importées, un item sans énoncé ni visuel serait inutilisable.`,
          )
        }
      } catch (e) {
        avertissements.push(
          `Rendu des figures impossible (${(e as Error).message}) : les ${resultat.figures.length} question(s) graphiques ne sont pas importées.`,
        )
      }
    }

    return NextResponse.json({
      ...resultat,
      avertissements,
      figures: undefined,
      questions: resultat.questions.slice(0, 5),
      total: resultat.questions.length,
      totalFigures: resultat.figures.length,
      figuresInserees,
      ...insertion,
    })
  } catch (e) {
    return reponseErreur(e)
  }
}
