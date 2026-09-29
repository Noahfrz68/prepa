import type { NextConfig } from 'next'

/**
 * Deux cibles, un seul code :
 *
 *   — PC (par défaut) : serveur Next local, base better-sqlite3 dans data/ ;
 *   — iPhone (`PREPA_CIBLE=iphone`) : site statique (`out-iphone/`), publié sur
 *     GitHub Pages, où tout tourne dans le navigateur — la base est sql.js,
 *     enregistrée dans le stockage du téléphone.
 *
 * La cible iPhone ne retient comme pages que les fichiers `*.iphone.tsx`
 * (pageExtensions) : chacun enveloppe la page PC du même dossier pour qu'elle
 * s'exécute côté navigateur, une fois la base ouverte (app/_iphone/). Les
 * routes d'API et le proxy, propres au serveur, n'en font donc pas partie ;
 * les appels à /api/… sont servis dans le navigateur par app/_iphone/api.ts.
 */
const IPHONE = process.env.PREPA_CIBLE === 'iphone'

/** Sous-chemin du site publié : https://<compte>.github.io/<dépôt>/ */
const CHEMIN_BASE = process.env.PREPA_CHEMIN_BASE ?? ''

const pc: NextConfig = {
  // Modules qui doivent rester hors du bundle serveur :
  //   better-sqlite3 est un binaire natif ;
  //   pdf-parse charge un worker pdfjs par chemin de fichier, que le bundler
  //   ne sait pas suivre.
  serverExternalPackages: ['better-sqlite3', 'pdf-parse', 'pdfjs-dist'],
}

const iphone: NextConfig = {
  output: 'export',
  basePath: CHEMIN_BASE,
  // `/plan/` → out-iphone/plan/index.html : ce que GitHub Pages sait servir.
  trailingSlash: true,
  pageExtensions: ['iphone.tsx'],
  distDir: 'out-iphone',
  env: {
    NEXT_PUBLIC_CIBLE: 'iphone',
    NEXT_PUBLIC_CHEMIN_BASE: CHEMIN_BASE,
  },
  turbopack: {
    resolveAlias: {
      // La connexion à la base : sql.js au lieu de better-sqlite3.
      '@/core/db/client': './core/db/client-navigateur.ts',
      // Piper est un programme du PC : l'iPhone n'a pas de moteur de synthèse.
      '@/core/audio/moteurs': './core/audio/moteurs-navigateur.ts',
    },
  },
}

export default IPHONE ? iphone : pc
