import EpreuvePapier from './EpreuvePapier'
import type { ModeEpreuve } from '@/exams/tagemage/epreuve'

export const dynamic = 'force-dynamic'

export default async function PagePapier({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>
}) {
  const { mode } = await searchParams
  const choisi: ModeEpreuve = mode === 'diagnostic' ? 'diagnostic' : 'blanc'
  return <EpreuvePapier mode={choisi} />
}
