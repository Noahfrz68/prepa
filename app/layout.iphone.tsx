import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'
import RootLayout, { metadata as metadataPc } from './layout'
import Base from './_iphone/Base'
import MiseAJour from './_iphone/MiseAJour'

const BASE = process.env.NEXT_PUBLIC_CHEMIN_BASE ?? ''

/** Ce qu'iOS lit pour installer l'app sur l'écran d'accueil. */
export const metadata: Metadata = {
  ...metadataPc,
  manifest: `${BASE}/manifest.webmanifest`,
  appleWebApp: { capable: true, title: 'Prépa', statusBarStyle: 'black' },
  icons: { icon: `${BASE}/icones/icone-192.png`, apple: `${BASE}/icones/icone-180.png` },
}

export const viewport: Viewport = {
  themeColor: '#0f1115',
}

/** Le layout du PC, avec la porte d'ouverture de la base autour des pages. */
export default function LayoutIphone({ children }: { children: ReactNode }) {
  return (
    <RootLayout>
      <Base>{children}</Base>
      <MiseAJour />
    </RootLayout>
  )
}
