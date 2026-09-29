import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'

/**
 * Lint du projet : `npm run lint`.
 *
 * Next.js 16 ne lance plus de lint au build (`next lint` a disparu) : sans
 * cette configuration, les `eslint-disable` du code ne désactivaient rien, et
 * les règles des hooks React — celles qui auraient signalé le double
 * démarrage des séries — ne tournaient jamais.
 */
export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // Version déclarée plutôt que détectée : la détection automatique
    // d'eslint-plugin-react appelle une API retirée d'ESLint 10.
    settings: { react: { version: '19.2' } },
  },
  {
    // Convention du projet : un paramètre préfixé « _ » est volontairement
    // inutilisé (une signature gardée pour les appelants).
    rules: {
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
  globalIgnores([
    '.next/**',
    'out/**',
    // Le site statique de la version iPhone (npm run iphone:build), et le
    // worker pdfjs que son build copie dans public/.
    'out-iphone/**',
    '.next-iphone/**',
    '.next-pc-abri/**',
    'public/pdf.worker.min.mjs',
    'build/**',
    'next-env.d.ts',
    'node_modules/**',
    // Données de travail et binaires téléchargés, jamais du code du projet.
    'data/**',
    'outils/**',
  ]),
])
