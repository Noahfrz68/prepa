/**
 * Lecture défensive du JSON rangé en base.
 *
 * Une colonne JSON peut contenir n'importe quoi : une ligne saisie à la main,
 * une structure d'une version précédente du schéma, une troncature. Une
 * figure illisible doit faire disparaître le dessin, jamais la page — la
 * question garde son énoncé textuel et reste répondable.
 */

import type { Case, Figure } from './types'

export function lireFigure(brut: unknown): Figure | null {
  if (typeof brut !== 'string' || brut.trim() === '') return null
  try {
    const f = JSON.parse(brut) as Figure
    if (!f || typeof f !== 'object' || typeof (f as { type?: unknown }).type !== 'string') return null
    return f
  } catch {
    return null
  }
}

export function lireCases(brut: unknown): Case[] | null {
  if (typeof brut !== 'string' || brut.trim() === '') return null
  try {
    const c = JSON.parse(brut) as Case[]
    return Array.isArray(c) && c.length > 0 ? c : null
  } catch {
    return null
  }
}
