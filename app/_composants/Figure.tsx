/**
 * Le dessin d'une disposition de logique.
 *
 * Tout est en SVG et en `currentColor` : la figure suit la couleur du texte,
 * donc le thème sombre, elle reste nette à l'impression et à n'importe quelle
 * taille, et elle ne demande aucun fichier image. C'est ce qui permet d'en
 * engendrer des centaines au lieu d'en importer quinze.
 *
 * La fidélité visée est celle de l'épreuve : cadres épais autour des cases
 * dessinées, pas de cadre du tout autour des séries de lettres ou de nombres,
 * la verticale qui coupe l'horizontale exactement sur le « ? ».
 */

import type { Ancre, Case, Figure, Forme, Trait } from '@/core/figures/types'

/* ------------------------------------------------------------ mesures -- */

const TEXTE = { l: 78, h: 50, gx: 16, gy: 10 }
const GRAPHIQUE = { l: 78, h: 78, gx: 18, gy: 18 }

/** Une case porte-t-elle un dessin, ou seulement du texte ? */
function estGraphique(c: Case): boolean {
  return Boolean(
    c.forme || c.traits?.length || c.pastilles?.length || c.quartiers || c.domino || c.carte,
  )
}

function mesures(cases: Case[]) {
  return cases.some(estGraphique) ? GRAPHIQUE : TEXTE
}

/** Fraction (x, y) de la case pour chacun des neuf ancrages. */
const ANCRES: Record<Ancre, [number, number]> = {
  hg: [0.24, 0.3],
  hd: [0.76, 0.3],
  bg: [0.24, 0.76],
  bd: [0.76, 0.76],
  h: [0.5, 0.24],
  b: [0.5, 0.82],
  g: [0.16, 0.56],
  d: [0.84, 0.56],
  c: [0.5, 0.57],
}

/* -------------------------------------------------------------- formes -- */

function polygone(cx: number, cy: number, r: number, n: number, depart = -90): string {
  return Array.from({ length: n }, (_, i) => {
    const a = ((depart + (360 / n) * i) * Math.PI) / 180
    return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`
  }).join(' ')
}

function etoile(cx: number, cy: number, r: number): string {
  return Array.from({ length: 10 }, (_, i) => {
    const rayon = i % 2 === 0 ? r : r * 0.42
    const a = ((-90 + 36 * i) * Math.PI) / 180
    return `${(cx + rayon * Math.cos(a)).toFixed(1)},${(cy + rayon * Math.sin(a)).toFixed(1)}`
  }).join(' ')
}

const TRAIT_FORME = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinejoin: 'round' as const,
}

function dessinForme(forme: Forme, l: number, h: number, cle: string) {
  const cx = l / 2
  const cy = h / 2
  const r = Math.min(l, h) / 2 - 11

  if (forme === 'carre') {
    return <rect key={cle} x={cx - r} y={cy - r} width={r * 2} height={r * 2} {...TRAIT_FORME} />
  }
  if (forme === 'rectangle') {
    return (
      <rect
        key={cle}
        x={cx - r * 1.25}
        y={cy - r * 0.68}
        width={r * 2.5}
        height={r * 1.36}
        {...TRAIT_FORME}
      />
    )
  }
  if (forme === 'cercle') return <circle key={cle} cx={cx} cy={cy} r={r} {...TRAIT_FORME} />
  if (forme === 'ovale') {
    return <ellipse key={cle} cx={cx} cy={cy} rx={r * 1.2} ry={r * 0.72} {...TRAIT_FORME} />
  }
  if (forme === 'triangle') {
    return <polygon key={cle} points={polygone(cx, cy + r * 0.15, r * 1.12, 3)} {...TRAIT_FORME} />
  }
  if (forme === 'losange') {
    return <polygon key={cle} points={polygone(cx, cy, r * 1.1, 4)} {...TRAIT_FORME} />
  }
  if (forme === 'pentagone') {
    return <polygon key={cle} points={polygone(cx, cy, r * 1.05, 5)} {...TRAIT_FORME} />
  }
  if (forme === 'hexagone') {
    return <polygon key={cle} points={polygone(cx, cy, r * 1.05, 6)} {...TRAIT_FORME} />
  }
  if (forme === 'heptagone') {
    return <polygon key={cle} points={polygone(cx, cy, r * 1.05, 7)} {...TRAIT_FORME} />
  }
  if (forme === 'octogone') {
    return <polygon key={cle} points={polygone(cx, cy, r * 1.05, 8)} {...TRAIT_FORME} />
  }
  if (forme === 'etoile') {
    return <polygon key={cle} points={etoile(cx, cy, r * 1.12)} {...TRAIT_FORME} />
  }
  if (forme === 'croix') {
    const e = r * 0.38
    const p: Array<[number, number]> = [
      [cx - e, cy - r],
      [cx + e, cy - r],
      [cx + e, cy - e],
      [cx + r, cy - e],
      [cx + r, cy + e],
      [cx + e, cy + e],
      [cx + e, cy + r],
      [cx - e, cy + r],
      [cx - e, cy + e],
      [cx - r, cy + e],
      [cx - r, cy - e],
      [cx - e, cy - e],
    ]
    return (
      <polygon
        key={cle}
        points={p.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ')}
        {...TRAIT_FORME}
      />
    )
  }
  const p: Array<[number, number]> = [
    [cx - r, cy - r * 0.42],
    [cx + r * 0.2, cy - r * 0.42],
    [cx + r * 0.2, cy - r * 0.85],
    [cx + r, cy],
    [cx + r * 0.2, cy + r * 0.85],
    [cx + r * 0.2, cy + r * 0.42],
    [cx - r, cy + r * 0.42],
  ]
  return (
    <polygon
      key={cle}
      points={p.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ')}
      {...TRAIT_FORME}
    />
  )
}

function dessinTrait(t: Trait, l: number, h: number, cle: string) {
  const m = 6
  const coords: Record<Trait, [number, number, number, number]> = {
    montante: [m, h - m, l - m, m],
    descendante: [m, m, l - m, h - m],
    verticale: [l / 2, m, l / 2, h - m],
    horizontale: [m, h / 2, l - m, h / 2],
  }
  const [x1, y1, x2, y2] = coords[t]
  return (
    <line
      key={cle}
      x1={x1}
      y1={y1}
      x2={x2}
      y2={y2}
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
    />
  )
}

/** Les sept dispositions de points d'un domino, de 0 à 6. */
const POINTS_DOMINO: Array<Array<[number, number]>> = [
  [],
  [[0.5, 0.5]],
  [
    [0.28, 0.28],
    [0.72, 0.72],
  ],
  [
    [0.28, 0.28],
    [0.5, 0.5],
    [0.72, 0.72],
  ],
  [
    [0.28, 0.28],
    [0.72, 0.28],
    [0.28, 0.72],
    [0.72, 0.72],
  ],
  [
    [0.28, 0.28],
    [0.72, 0.28],
    [0.5, 0.5],
    [0.28, 0.72],
    [0.72, 0.72],
  ],
  [
    [0.28, 0.24],
    [0.72, 0.24],
    [0.28, 0.5],
    [0.72, 0.5],
    [0.28, 0.76],
    [0.72, 0.76],
  ],
]

const ENSEIGNES = { pique: '♠', coeur: '♥', carreau: '♦', trefle: '♣' }

/* ------------------------------------------------------------- la case -- */

function CaseDessin({ c, l, h }: { c: Case; l: number; h: number }) {
  const elements: React.ReactNode[] = []

  // Cadre. Une série de lettres ou de nombres n'en porte pas à l'épreuve ; une
  // case dessinée en porte un épais. C'est le défaut, l'appelant peut l'imposer.
  const cadre = c.cadre ?? (estGraphique(c) ? 'epais' : 'aucun')
  if (cadre !== 'aucun') {
    elements.push(
      <rect
        key="cadre"
        x={1.5}
        y={1.5}
        width={l - 3}
        height={h - 3}
        fill="none"
        stroke="currentColor"
        strokeWidth={cadre === 'epais' ? 3 : 1.5}
      />,
    )
  }

  if (c.domino) {
    elements.push(
      <line
        key="sep"
        x1={6}
        y1={h / 2}
        x2={l - 6}
        y2={h / 2}
        stroke="currentColor"
        strokeWidth={2}
      />,
    )
    const moities: Array<[number, number]> = [
      [0, c.domino[0]],
      [1, c.domino[1]],
    ]
    for (const [moitie, valeur] of moities) {
      for (const [fx, fy] of POINTS_DOMINO[Math.max(0, Math.min(6, valeur))]) {
        elements.push(
          <circle
            key={`p${moitie}-${fx}-${fy}`}
            cx={8 + fx * (l - 16)}
            cy={moitie * (h / 2) + 6 + fy * (h / 2 - 12)}
            r={3.2}
            fill="currentColor"
          />,
        )
      }
    }
  }

  if (c.carte) {
    elements.push(
      <text
        key="cv"
        x={l / 2}
        y={h * 0.36}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={19}
        fill="currentColor"
      >
        {c.carte.valeur}
      </text>,
      <text
        key="ce"
        x={l / 2}
        y={h * 0.68}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={22}
        fill="currentColor"
      >
        {ENSEIGNES[c.carte.enseigne]}
      </text>,
    )
  }

  if (c.quartiers) {
    elements.push(
      <line key="d1" x1={5} y1={5} x2={l - 5} y2={h - 5} stroke="currentColor" strokeWidth={1.6} />,
      <line key="d2" x1={l - 5} y1={5} x2={5} y2={h - 5} stroke="currentColor" strokeWidth={1.6} />,
    )
    const places: Array<['h' | 'g' | 'd' | 'b', number, number]> = [
      ['h', 0.5, 0.2],
      ['g', 0.2, 0.52],
      ['d', 0.8, 0.52],
      ['b', 0.5, 0.84],
    ]
    for (const [k, fx, fy] of places) {
      const v = c.quartiers[k]
      if (v === undefined || v === '') continue
      elements.push(
        <text
          key={`q${k}`}
          x={fx * l}
          y={fy * h}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={15}
          fill="currentColor"
        >
          {v}
        </text>,
      )
    }
  }

  if (c.forme) {
    const dessin = dessinForme(c.forme, l, h, 'forme')
    elements.push(
      c.rotation ? (
        <g key="forme-g" transform={`rotate(${c.rotation} ${l / 2} ${h / 2})`}>
          {dessin}
        </g>
      ) : (
        dessin
      ),
    )
  }

  if (c.traits) for (const t of c.traits) elements.push(dessinTrait(t, l, h, `t-${t}`))

  if (c.lettre) {
    elements.push(
      <text
        key="lettre"
        x={l / 2}
        y={h * 0.55}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={15}
        fill="currentColor"
      >
        {c.lettre}
      </text>,
    )
  }

  if (c.pastilles) {
    for (const p of c.pastilles) {
      const [fx, fy] = ANCRES[p]
      elements.push(
        <circle
          key={`pa-${p}`}
          cx={fx * l}
          cy={fy * h}
          r={3.4}
          fill="none"
          stroke="currentColor"
          strokeWidth={1.6}
        />,
      )
    }
  }

  if (c.inconnue) {
    elements.push(
      <text
        key="inconnue"
        x={l / 2}
        y={h * 0.55}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={24}
        fill="currentColor"
      >
        ?
      </text>,
    )
  }

  if (c.texte !== undefined && c.texte !== '') {
    const [fx, fy] = ANCRES[c.position ?? 'c']
    elements.push(
      <text
        key="texte"
        x={fx * l}
        y={fy * h}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={18}
        fill="currentColor"
      >
        {c.texte}
      </text>,
    )
  }

  return <>{elements}</>
}

/* --------------------------------------------------------- dispositions -- */

interface Place {
  c: Case
  x: number
  y: number
}

interface Plan {
  places: Place[]
  largeur: number
  hauteur: number
  l: number
  h: number
  /** Flèches horizontales d'une analogie : [x de départ, x d'arrivée, y]. */
  fleches: Array<[number, number, number]>
}

/**
 * La case cherchée porte le cadre de ses voisines.
 *
 * Un « ? » sans cadre au milieu de cases encadrées se lit comme un blanc dans
 * la mise en page plutôt que comme une case à remplir — et à l'épreuve, la case
 * manquante est encadrée comme les autres. Sur une série de lettres ou de
 * nombres, qui n'a aucun cadre, le « ? » n'en prend pas non plus.
 */
function accorderCadres(cases: Case[]): Case[] {
  if (!cases.some(estGraphique)) return cases
  return cases.map((c) => (c.inconnue && c.cadre === undefined ? { ...c, cadre: 'epais' } : c))
}

function disposer(f: Figure): Plan {
  const fleches: Array<[number, number, number]> = []

  if (f.type === 'croix') {
    const { l, h, gx, gy } = mesures([...f.ligne, ...f.colonne])
    const ligne = accorderCadres(f.ligne)
    const colonne = accorderCadres(f.colonne)
    const nc = ligne.length
    const nr = colonne.length
    const places: Place[] = []
    ligne.forEach((c, i) => places.push({ c, x: i * (l + gx), y: f.iColonne * (h + gy) }))
    colonne.forEach((c, j) => {
      // La case d'intersection est déjà posée par la ligne : la reposer la
      // dessinerait deux fois, et un « ? » doublé se voit.
      if (j === f.iColonne) return
      places.push({ c, x: f.iLigne * (l + gx), y: j * (h + gy) })
    })
    return {
      places,
      largeur: nc * l + (nc - 1) * gx,
      hauteur: nr * h + (nr - 1) * gy,
      l,
      h,
      fleches,
    }
  }

  if (f.type === 'bande') {
    const { l, h, gx } = mesures(f.cases)
    const cases = accorderCadres(f.cases)
    const places = cases.map((c, i) => ({ c, x: i * (l + gx), y: 0 }))
    return {
      places,
      largeur: cases.length * l + (cases.length - 1) * gx,
      hauteur: h,
      l,
      h,
      fleches,
    }
  }

  if (f.type === 'matrice') {
    const { l, h, gx, gy } = mesures(f.lignes.flat())
    const lignes = f.lignes.map(accorderCadres)
    const nc = Math.max(...lignes.map((r) => r.length))
    const places: Place[] = []
    lignes.forEach((rangee, j) =>
      rangee.forEach((c, i) => places.push({ c, x: i * (l + gx), y: j * (h + gy) })),
    )
    return {
      places,
      largeur: nc * l + (nc - 1) * gx,
      hauteur: f.lignes.length * h + (f.lignes.length - 1) * gy,
      l,
      h,
      fleches,
    }
  }

  // Analogie : a → b, un blanc, c → ?
  const cases = accorderCadres([f.a, f.b, f.c, { inconnue: true }])
  const { l, h } = mesures(cases)
  const fleche = 46
  const ecart = 42
  const xs = [0, l + fleche, l + fleche + l + ecart, l + fleche + l + ecart + l + fleche]
  const places = cases.map((c, i) => ({ c, x: xs[i], y: 0 }))
  fleches.push([l, xs[1], h / 2], [xs[2] + l, xs[3], h / 2])
  return { places, largeur: xs[3] + l, hauteur: h, l, h, fleches }
}

/* --------------------------------------------------------- le composant -- */

/** La figure d'un énoncé, dessinée à la largeur disponible. */
export function FigureLogique({ figure, titre }: { figure: Figure; titre?: string }) {
  const { places, largeur, hauteur, l, h, fleches } = disposer(figure)
  const m = 8

  return (
    <svg
      viewBox={`${-m} ${-m} ${largeur + m * 2} ${hauteur + m * 2}`}
      width="100%"
      // Sur un téléphone, laisser la figure rétrécir jusqu'à la largeur
      // disponible la rend illisible : une croix de cinq groupes tombait à dix
      // pixels de haut. Le plancher la fait déborder, et son conteneur défile
      // horizontalement — mieux vaut un glissement du doigt qu'une loupe.
      style={{
        maxWidth: `${Math.min(largeur + m * 2, 640)}px`,
        minWidth: `${Math.min(largeur + m * 2, 360)}px`,
        height: 'auto',
      }}
      role="img"
      aria-label={titre ?? 'Figure de logique'}
      className="text-texte"
    >
      {fleches.map(([x1, x2, y], i) => (
        <g key={`f${i}`} stroke="currentColor" strokeWidth={1.6} fill="none">
          <line x1={x1 + 8} y1={y} x2={x2 - 10} y2={y} />
          <polyline
            points={`${x2 - 18},${y - 5} ${x2 - 10},${y} ${x2 - 18},${y + 5}`}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </g>
      ))}
      {places.map((p, i) => (
        <g key={i} transform={`translate(${p.x} ${p.y})`}>
          <CaseDessin c={p.c} l={l} h={h} />
        </g>
      ))}
    </svg>
  )
}

/** Une case seule, à hauteur fixe : les cinq propositions d'un QCM figuré. */
export function CaseSeule({ c, taille = 62 }: { c: Case; taille?: number }) {
  const graphique = estGraphique(c)
  const l = graphique ? 64 : 92
  const h = graphique ? 64 : 38
  return (
    <svg
      viewBox={`-2 -2 ${l + 4} ${h + 4}`}
      width={((l + 4) / (h + 4)) * taille}
      height={taille}
      role="img"
      aria-label="Proposition"
      className="text-texte"
    >
      <CaseDessin c={c} l={l} h={h} />
    </svg>
  )
}
