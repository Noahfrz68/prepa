/**
 * Icônes de l'app installée sur l'iPhone (écran d'accueil) : trois barres
 * montantes — une progression mesurée — aux couleurs du thème sombre.
 *
 *   node scripts/icones.mjs   → public/icones/*.png (versionnés)
 *
 * Tout tient dans les 80 % centraux, la zone qu'iOS et Android ne rognent
 * jamais quand ils arrondissent ou découpent l'icône.
 */
import fs from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'

const FOND = '#0f1115'
const ACCENT = '#6ea8fe'
const DOUX = '#2a3140'

const SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="${FOND}"/>
  <rect x="112" y="304" width="72" height="96" rx="12" fill="${DOUX}"/>
  <rect x="220" y="232" width="72" height="168" rx="12" fill="${ACCENT}" opacity="0.7"/>
  <rect x="328" y="136" width="72" height="264" rx="12" fill="${ACCENT}"/>
  <rect x="100" y="412" width="312" height="10" rx="5" fill="${DOUX}"/>
</svg>`

const dossier = path.join('public', 'icones')
fs.mkdirSync(dossier, { recursive: true })
fs.writeFileSync(path.join(dossier, 'icone.svg'), SVG)

for (const taille of [180, 192, 512]) {
  await sharp(Buffer.from(SVG)).resize(taille, taille).png().toFile(path.join(dossier, `icone-${taille}.png`))
}
console.log(`[icones] ${dossier} : 180, 192, 512`)
