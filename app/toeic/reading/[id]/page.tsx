import { notFound } from 'next/navigation'
import RecapClient from './RecapClient'
import { recapReading } from '@/core/db/toeic'

export const dynamic = 'force-dynamic'

export default async function PageRecapReading({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const sessionId = Number(id)

  if (!Number.isInteger(sessionId) || sessionId <= 0) notFound()

  // On ne capture volontairement pas les autres erreurs : les avaler en 404
  // masquerait un vrai défaut derrière une page « introuvable ».
  let recap
  try {
    recap = recapReading(sessionId)
  } catch (e) {
    if ((e as Error).message.includes('introuvable')) notFound()
    throw e
  }

  return <RecapClient recap={recap} />
}
