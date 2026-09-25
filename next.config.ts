import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Modules qui doivent rester hors du bundle serveur :
  //   better-sqlite3 est un binaire natif ;
  //   pdf-parse charge un worker pdfjs par chemin de fichier, que le bundler
  //   ne sait pas suivre.
  serverExternalPackages: ['better-sqlite3', 'pdf-parse', 'pdfjs-dist'],
}

export default nextConfig
