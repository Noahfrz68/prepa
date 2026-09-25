import { notFound } from 'next/navigation'
import DrillClient from './DrillClient'
import { SECTIONS_PAR_ID, type SectionTageMage } from '@/exams/tagemage'

export const dynamic = 'force-dynamic'

export default async function PageDrill({
  searchParams,
}: {
  searchParams: Promise<{ section?: string; taille?: string; skills?: string; carnet?: string }>
}) {
  const { section, taille, skills, carnet } = await searchParams

  const depuisCarnet = carnet === '1'

  // Le carnet peut rejouer des erreurs de tous les sous-tests à la fois :
  // `section=toutes` n'est valide que dans ce mode.
  const sectionValide =
    !!section && (SECTIONS_PAR_ID.has(section as SectionTageMage) || (depuisCarnet && section === 'toutes'))
  if (!sectionValide) notFound()

  const n = Math.max(1, Math.min(90, Number(taille) || 15))

  const cibles = skills ? skills.split(',').filter(Boolean) : []

  return (
    <DrillClient
      section={section as SectionTageMage}
      taille={n}
      skills={cibles}
      carnet={depuisCarnet}
    />
  )
}
