import type { Metadata } from 'next'
import Script from 'next/script'
import './globals.css'
import Raccourcis from './_composants/Raccourcis'
import { SCRIPT_THEME } from './_composants/theme'

export const metadata: Metadata = {
  title: 'Prépa — TAGE MAGE & TOEIC',
  description: "Instrument de mesure et coach de stratégie de score.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // Le script de thème pose data-theme avant l'hydratation : l'écart est voulu.
    <html lang="fr" suppressHydrationWarning>
      <head>
        {/* Injecté dans le HTML initial, exécuté avant l'hydratation : pas de flash sombre. */}
        <Script id="theme" strategy="beforeInteractive">
          {SCRIPT_THEME}
        </Script>
      </head>
      <body className="min-h-screen bg-fond text-texte antialiased">
        {children}
        <Raccourcis />
      </body>
    </html>
  )
}
