/**
 * Sert out-iphone/ comme le ferait GitHub Pages : des fichiers, rien d'autre.
 * Pour essayer le site statique avant de le publier.
 *
 *   npm run iphone:build && npm run iphone:servir   → http://127.0.0.1:3002
 *
 * Si le site a été construit avec PREPA_CHEMIN_BASE=/prepa, il est servi
 * sous ce même sous-chemin.
 */
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'

const racine = path.resolve('out-iphone')
const base = process.env.PREPA_CHEMIN_BASE ?? ''
const port = Number(process.env.PORT ?? 3002)

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.txt': 'text/plain; charset=utf-8',
  '.wasm': 'application/wasm',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
}

function fichier(chemin) {
  const p = path.join(racine, chemin)
  if (!p.startsWith(racine)) return null
  if (fs.existsSync(p) && fs.statSync(p).isFile()) return p
  const index = path.join(p, 'index.html')
  if (fs.existsSync(index)) return index
  return null
}

http
  .createServer((req, res) => {
    let chemin = decodeURIComponent(new URL(req.url, 'http://x').pathname)
    if (base) {
      if (!chemin.startsWith(base)) {
        res.writeHead(404).end()
        return
      }
      chemin = chemin.slice(base.length) || '/'
    }
    const trouve = fichier(chemin)
    const servi = trouve ?? path.join(racine, '404.html')
    res.writeHead(trouve ? 200 : 404, { 'Content-Type': TYPES[path.extname(servi)] ?? 'application/octet-stream' })
    fs.createReadStream(servi).pipe(res)
  })
  .listen(port, '127.0.0.1', () => console.log(`Site iPhone servi sur http://127.0.0.1:${port}${base}/`))
