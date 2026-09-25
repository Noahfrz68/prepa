import AudioClient from './AudioClient'
import { etatAudio } from '@/core/audio/moteurs'
import { etatSynthese } from '@/core/db/listening'

export const dynamic = 'force-dynamic'

export default function PageAudio() {
  return <AudioClient etatInitial={etatAudio()} syntheseInitiale={etatSynthese()} />
}
