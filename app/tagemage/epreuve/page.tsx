import EpreuveClient from './EpreuveClient'
import type { ModeEpreuve } from '@/exams/tagemage/epreuve'

export const dynamic = 'force-dynamic'

export default async function PageEpreuve({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>
}) {
  const { mode } = await searchParams
  const choisi: ModeEpreuve = mode === 'diagnostic' ? 'diagnostic' : 'blanc'

  return <EpreuveClient mode={choisi} />
}
