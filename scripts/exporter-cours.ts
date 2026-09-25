/**
 * Fabrique la fiche de révision hors ligne, en un seul fichier HTML.
 *
 * Le site a besoin d'un serveur et d'une base : PC éteint, il n'affiche rien.
 * Or la partie cours ne consulte la base que pour afficher des taux — le texte,
 * lui, ne dépend de rien. On l'exporte donc en un fichier autonome, à garder sur
 * un téléphone et à ouvrir n'importe où.
 *
 * Contraintes tenues :
 *   — aucune ressource externe (pas de police, pas de script, pas de CDN) :
 *     le fichier doit s'ouvrir sans réseau, depuis le stockage du téléphone ;
 *   — la base n'est ouverte qu'en LECTURE, et seulement pour compter les
 *     questions d'annale par type : cet export n'écrit rien et ne touche pas
 *     l'application ;
 *   — la recherche fonctionne hors ligne, parce que c'est l'usage réel — on
 *     vient chercher LA leçon qui correspond à ce qu'on vient de rater.
 *
 * Régénérer après toute modification des leçons :  npx jiti scripts/exporter-cours.ts
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import Database from 'better-sqlite3'
import { LECONS, PARCOURS, PAR_SKILL, TABLES, type Lecon } from '../exams/tagemage/lecons'
import { FICHES, REGLES_GENERALES } from '../exams/tagemage/cours'
import { FONDATIONS_LOGIQUE, ORDRE_DE_TEST } from '../exams/tagemage/lecons/logique'
import { SECTIONS } from '../exams/tagemage'

// Hors de la racine du projet : un export régénérable n'a rien à faire à côté
// du code, et `data/` n'est jamais versionné.
const SORTIE = 'data/exports/cours-tage-mage.html'

/**
 * Combien de questions d'annale la banque contient par type.
 *
 * En lecture seule, et tolérant : si la base est absente ou verrouillée,
 * l'export continue sans les mentions de provenance plutôt que d'échouer —
 * un cours qu'on ne peut plus exporter serait pire qu'un cours sans badge.
 */
function temoinsAnnale(): Map<string, number> {
  try {
    const d = new Database('data/app.db', { readonly: true, fileMustExist: true })
    d.pragma('busy_timeout = 5000')
    const lignes = d
      .prepare(
        `SELECT skill_id AS skill, COUNT(*) AS n FROM item
          WHERE exam_id = 'tagemage' AND source <> 'genere' AND skill_id IS NOT NULL
          GROUP BY skill_id`,
      )
      .all() as Array<{ skill: string; n: number }>
    d.close()
    return new Map(lignes.map((l) => [l.skill, l.n]))
  } catch {
    console.warn('base illisible : les mentions de provenance seront omises')
    return new Map()
  }
}

const TEMOINS = temoinsAnnale()

/* --------------------------------------------------------------- outils -- */

/** Le contenu porte des « < » et des « > » : « (2) x < 0 » se lirait comme une balise. */
const ech = (s: string) =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

/** Le texte à fouiller pour une leçon : on cherche dans le corps, pas dans les titres. */
function corpus(l: Lecon): string {
  return [
    l.titre,
    l.quoi,
    l.piege,
    ...l.regles.flatMap((r) => [r.titre, r.texte]),
    ...l.retrouver.flatMap((r) => [r.q, r.r]),
    l.exemple.enonce,
    ...l.exemple.etapes,
    l.exemple.reponse,
    l.aToi.enonce,
    l.aToi.reponse,
    ...(l.parCoeur ?? []),
  ]
    .join(' ')
    .toLowerCase()
}

/* ---------------------------------------------------------------- blocs -- */

function blocLecon(l: Lecon, n: number): string {
  const parCoeur = l.parCoeur?.length
    ? `<div class="encadre">
         <p class="etiquette">À savoir par cœur</p>
         ${l.parCoeur.map((x) => `<p class="mono">${ech(x)}</p>`).join('')}
       </div>`
    : ''

  const t = TEMOINS.get(l.skillId) ?? 0
  const provenance = TEMOINS.size === 0
    ? ''
    : t === 0
      ? `<p class="provenance alerte">⚠ Aucune question d’annale de ce type dans la banque : ` +
        `cette leçon repose sur la connaissance du concours, pas sur des questions réelles. ` +
        `Sa méthode reste valable ; sa fréquence à l’épreuve n’est pas corroborée.</p>`
      : `<p class="provenance">Adossée à ${t} question${t > 1 ? 's' : ''} d’annale de ce type.</p>`

  return `
<details class="lecon" id="${ech(l.skillId)}" data-cherche="${ech(corpus(l))}">
  <summary>
    <span class="num">${n}</span>
    <span class="titres">
      <span class="titre">${ech(l.titre)}${t === 0 && TEMOINS.size > 0 ? ' <span class="drapeau">non corroborée</span>' : ''}</span>
      <span class="quoi">${ech(l.quoi)}</span>
    </span>
  </summary>
  <div class="corps">
    <div class="encadre memoire">
      <p class="etiquette">D’abord, de mémoire</p>
      <p class="amorce">Réponds dans ta tête avant d’ouvrir. Se tromper ici ne coûte rien et fait
        retenir bien plus qu’une relecture.</p>
      ${l.retrouver
        .map(
          (r) => `<details class="pli">
                    <summary><span class="q">${ech(r.q)}</span></summary>
                    <p class="r">${ech(r.r)}</p>
                  </details>`,
        )
        .join('')}
    </div>

    ${l.regles
      .map(
        (r) => `<div class="regle">
                  <p class="regle-titre">${ech(r.titre)}</p>
                  <p class="regle-texte">${ech(r.texte)}</p>
                </div>`,
      )
      .join('')}
    ${parCoeur}
    <div class="encadre">
      <p class="etiquette">Un exemple, résolu pas à pas</p>
      <p class="enonce">${ech(l.exemple.enonce)}</p>
      <ol class="etapes">
        ${l.exemple.etapes.map((e) => `<li>${ech(e)}</li>`).join('')}
      </ol>
      <p class="reponse"><span>Réponse —</span> ${ech(l.exemple.reponse)}</p>
    </div>

    <div class="encadre atoi">
      <p class="etiquette accent">À toi, sans regarder</p>
      <p class="enonce">${ech(l.aToi.enonce)}</p>
      <details class="pli"><summary><span class="q">Un indice</span></summary>
        <p class="r">${ech(l.aToi.indice)}</p></details>
      <details class="pli"><summary><span class="q">Voir la réponse</span></summary>
        <p class="r">${ech(l.aToi.reponse)}</p></details>
    </div>

    <div class="encadre piege">
      <p class="etiquette rouge">Le piège</p>
      <p>${ech(l.piege)}</p>
    </div>
    ${provenance}
  </div>
</details>`
}

function blocConduite(sectionId: string, libelle: string): string {
  const f = FICHES.find((x) => x.section === sectionId)
  if (!f) return ''
  const cherche = [f.enjeu, ...f.methode, ...f.pieges.flatMap((p) => [p.titre, p.texte]), f.strategie]
    .join(' ')
    .toLowerCase()

  return `
<details class="lecon conduite" data-cherche="${ech(cherche)}">
  <summary>
    <span class="num">▸</span>
    <span class="titres">
      <span class="titre">La conduite — ${ech(libelle)}</span>
      <span class="quoi">${ech(f.enjeu)}</span>
    </span>
  </summary>
  <div class="corps">
    <p class="etiquette">La méthode, dans l’ordre</p>
    <ol class="etapes">${f.methode.map((m) => `<li>${ech(m)}</li>`).join('')}</ol>
    <p class="etiquette rouge" style="margin-top:1.4rem">Les pièges qui coûtent des points</p>
    ${f.pieges
      .map(
        (p) => `<div class="regle">
                  <p class="regle-titre">${ech(p.titre)}</p>
                  <p class="regle-texte">${ech(p.texte)}</p>
                </div>`,
      )
      .join('')}
    <div class="encadre" style="margin-top:1.4rem">
      <p class="etiquette">Ce qu’on décide avant de commencer</p>
      <p>${ech(f.strategie)}</p>
    </div>
  </div>
</details>`
}

/* ------------------------------------------------------------- document -- */

const sections = SECTIONS.map((s) => {
  const lecons = LECONS.filter((l) => l.section === s.id)
  return `
<section class="groupe" id="st${s.numero}">
  <h2>
    <span class="st">Sous-test ${s.numero}</span>
    ${ech(s.libelle)}
    <span class="bloc">${ech(s.bloc)} · ${s.questions} questions en ${s.minutes} min</span>
  </h2>
  ${blocConduite(s.id, s.libelle)}
  ${lecons.map((l, i) => blocLecon(l, i + 1)).join('')}
</section>`
}).join('')

const tables = TABLES.map(
  (t) => `
<details class="lecon" data-cherche="${ech((t.titre + ' ' + t.pourquoi + ' ' + t.lignes.join(' ')).toLowerCase())}">
  <summary>
    <span class="num">≡</span>
    <span class="titres">
      <span class="titre">${ech(t.titre)}</span>
      <span class="quoi">${ech(t.pourquoi)}</span>
    </span>
  </summary>
  <div class="corps">
    ${t.lignes.map((x) => `<p class="mono">${ech(x)}</p>`).join('')}
  </div>
</details>`,
).join('')

const parcours = PARCOURS.map(
  (e, i) => `
<details class="lecon etape"${i === 0 ? ' open' : ''} data-cherche="${ech((e.titre + ' ' + e.pourquoi).toLowerCase())}">
  <summary>
    <span class="num">${i + 1}</span>
    <span class="titres">
      <span class="titre">${ech(e.titre.replace(/^\d+\.\s*/, ''))}</span>
      <span class="quoi">${e.skillIds.length} leçon${e.skillIds.length > 1 ? 's' : ''} · ${ech(e.duree)}</span>
    </span>
  </summary>
  <div class="corps">
    <p class="regle-texte">${ech(e.pourquoi)}</p>
    <ul class="liens">
      ${e.skillIds
        .map((id) => `<li><a href="#${ech(id)}">${ech(PAR_SKILL.get(id)?.titre ?? id)}</a></li>`)
        .join('')}
    </ul>
  </div>
</details>`,
).join('')

const reglesGenerales = REGLES_GENERALES.map(
  (r) => `<div class="regle">
            <p class="regle-titre">${ech(r.titre)}</p>
            <p class="regle-texte">${ech(r.texte)}</p>
          </div>`,
).join('')

// Le socle du sous-test de logique : les quatre gestes communs à ses seize
// familles, et l'itinéraire de recherche. Hors ligne, c'est la page qu'on relit
// la veille — elle ne dépend d'aucune mesure et tient en un écran.
const fondationsLogique = FONDATIONS_LOGIQUE.map(
  (f) => `<div class="regle">
            <p class="regle-titre">${ech(f.titre)}</p>
            <p class="regle-texte">${ech(f.texte)}</p>
          </div>`,
).join('')

const ordreDeTest = ORDRE_DE_TEST.map(
  (o) => `
<details class="lecon" data-cherche="${ech(('ordre de test ' + o.sur + ' ' + o.essais.join(' ')).toLowerCase())}">
  <summary>
    <span class="titres">
      <span class="titre">${ech(o.sur)}</span>
      <span class="quoi">${o.essais.length} essais, dans cet ordre</span>
    </span>
  </summary>
  <div class="corps">
    <ol>${o.essais.map((e) => `<li>${ech(e)}</li>`).join('')}</ol>
  </div>
</details>`,
).join('')

const genere = new Date().toLocaleDateString('fr-FR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

const html = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="color-scheme" content="light dark">
<title>TAGE MAGE — cours et astuces</title>
<style>
/* Palette claire par défaut, sombre si le téléphone le demande. Les deux sont
   définies en entier : une couleur qui n'existerait que dans un bloc média
   disparaîtrait dans l'autre thème. */
:root {
  --fond: #fbfaf8;
  --carte: #ffffff;
  --encadre: #f4f2ee;
  --texte: #1a1a19;
  --doux: #55534e;
  --pale: #8b8880;
  --bord: #e2ded6;
  --accent: #8a5a2b;
  --rouge: #a33a2a;
  --vert: #2f6b45;
}
@media (prefers-color-scheme: dark) {
  :root {
    --fond: #14140f;
    --carte: #1c1c17;
    --encadre: #232320;
    --texte: #f0eee8;
    --doux: #b3b0a6;
    --pale: #7d7a72;
    --bord: #33322c;
    --accent: #d99a5b;
    --rouge: #e4806c;
    --vert: #7cc294;
  }
}
* { box-sizing: border-box; }
html { -webkit-text-size-adjust: 100%; }
body {
  margin: 0;
  background: var(--fond);
  color: var(--texte);
  font: 16px/1.65 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  padding: 0 0 5rem;
  overflow-wrap: break-word;
}
.page { max-width: 46rem; margin: 0 auto; padding: 0 1.05rem; }

header { padding: 2.4rem 0 1.2rem; }
h1 { font-size: 1.55rem; line-height: 1.25; margin: 0 0 .55rem; letter-spacing: -.01em; }
.sous { color: var(--doux); font-size: .93rem; margin: 0; }
.meta { color: var(--pale); font-size: .78rem; margin: .9rem 0 0; }

/* La barre reste sous la main pendant qu'on fait défiler : on cherche une
   leçon au moment où l'on bute, pas en revenant en haut de page. */
.barre {
  position: sticky; top: 0; z-index: 10;
  background: var(--fond);
  padding: .7rem 0 .55rem;
  border-bottom: 1px solid var(--bord);
}
#q {
  width: 100%; padding: .72rem .9rem;
  font: inherit; font-size: .95rem;
  color: var(--texte); background: var(--carte);
  border: 1px solid var(--bord); border-radius: .6rem;
  outline: none; -webkit-appearance: none;
}
#q:focus { border-color: var(--accent); }
#q::placeholder { color: var(--pale); }
.chips { display: flex; gap: .38rem; overflow-x: auto; padding: .55rem 0 .1rem; scrollbar-width: none; }
.chips::-webkit-scrollbar { display: none; }
.chips a, .chips button {
  flex: 0 0 auto; font: inherit; font-size: .78rem;
  color: var(--doux); background: var(--carte);
  border: 1px solid var(--bord); border-radius: 999px;
  padding: .32rem .72rem; text-decoration: none; cursor: pointer;
}
.chips a:active, .chips button:active { border-color: var(--accent); color: var(--accent); }
#compte { color: var(--pale); font-size: .78rem; padding: .5rem 0 0; }

.groupe { margin: 2.4rem 0 0; scroll-margin-top: 6.5rem; }
.groupe h2 {
  font-size: 1.12rem; margin: 0 0 .75rem; line-height: 1.3;
  display: flex; flex-direction: column; gap: .15rem;
}
.st { color: var(--accent); font-size: .72rem; text-transform: uppercase; letter-spacing: .1em; font-weight: 600; }
.bloc { color: var(--pale); font-size: .76rem; font-weight: 400; }

.intro { background: var(--carte); border: 1px solid var(--bord); border-radius: .75rem; padding: .3rem 1rem 1rem; }

.lecon {
  background: var(--carte); border: 1px solid var(--bord);
  border-radius: .75rem; margin-bottom: .5rem; overflow: hidden;
}
.lecon[open] { border-color: var(--accent); }
.lecon.conduite summary .titre { color: var(--accent); }
summary {
  display: flex; gap: .7rem; align-items: baseline;
  padding: .85rem 1rem; cursor: pointer; list-style: none;
}
summary::-webkit-details-marker { display: none; }
.num {
  flex: 0 0 auto; min-width: 1.35rem;
  color: var(--pale); font-size: .82rem;
  font-variant-numeric: tabular-nums;
}
.titres { display: flex; flex-direction: column; gap: .12rem; min-width: 0; }
.titre { font-weight: 600; font-size: .97rem; }
.quoi { color: var(--doux); font-size: .84rem; line-height: 1.45; }

.corps { padding: 0 1rem 1.1rem; border-top: 1px solid var(--bord); padding-top: .95rem; }
.regle { margin-bottom: 1rem; }
.regle-titre { font-weight: 600; font-size: .92rem; margin: 0 0 .18rem; }
.regle-texte { color: var(--doux); font-size: .9rem; margin: 0; }

.encadre {
  background: var(--encadre); border: 1px solid var(--bord);
  border-radius: .55rem; padding: .8rem .9rem; margin-top: 1.1rem;
}
.encadre p { margin: 0; font-size: .9rem; color: var(--doux); }
.etiquette {
  font-size: .68rem; text-transform: uppercase; letter-spacing: .1em;
  color: var(--pale); margin: 0 0 .5rem !important; font-weight: 600;
}
.etiquette.rouge { color: var(--rouge); }
.enonce { color: var(--texte) !important; }
.etapes { margin: .6rem 0 0; padding-left: 1.2rem; }
.etapes li { color: var(--doux); font-size: .9rem; margin-bottom: .32rem; }
.reponse {
  margin-top: .75rem !important; padding-top: .65rem;
  border-top: 1px solid var(--bord); color: var(--texte) !important;
}
.reponse span { color: var(--vert); font-weight: 600; }
.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: .82rem; line-height: 1.75; color: var(--texte) !important;
  margin: 0 !important;
}

/* Les plis de récupération active. Cacher la réponse n'est pas un ornement :
   c'est ce qui force la mémoire à essayer avant que l'œil ne lise. */
.pli { margin-top: .5rem; border-top: 1px solid var(--bord); padding-top: .5rem; }
.pli:first-of-type { border-top: 0; }
.pli > summary { padding: 0; display: flex; gap: .5rem; }
.pli > summary::before { content: '▸'; color: var(--pale); flex: 0 0 auto; }
.pli[open] > summary::before { content: '▾'; }
.pli .q { font-size: .9rem; color: var(--texte); }
.pli .r { margin: .35rem 0 0 1.1rem; font-size: .88rem; color: var(--vert); }
.memoire .amorce { font-size: .8rem; color: var(--pale); margin: 0 0 .7rem !important; }
.atoi { border-color: var(--accent); }
.etiquette.accent { color: var(--accent); }
.provenance { font-size: .76rem; color: var(--pale); margin-top: 1rem; }
.provenance.alerte { color: var(--rouge); }
.drapeau {
  font-size: .62rem; text-transform: uppercase; letter-spacing: .08em;
  color: var(--rouge); border: 1px solid var(--rouge); border-radius: 999px;
  padding: .05rem .4rem; margin-left: .45rem; white-space: nowrap; font-weight: 600;
}
.liens { margin: .7rem 0 0; padding: 0; list-style: none; display: flex; flex-wrap: wrap; gap: .3rem .8rem; }
.liens a { font-size: .82rem; color: var(--accent); text-decoration: none; }
.liens a:active { text-decoration: underline; }

.vide { color: var(--pale); font-size: .9rem; padding: 1.5rem 0; }
footer { color: var(--pale); font-size: .78rem; margin-top: 3rem; border-top: 1px solid var(--bord); padding-top: 1rem; }

/* Imprimer ou enregistrer en PDF doit donner le cours entier, pas une liste
   de titres repliés. */
@media print {
  .barre, .chips, #compte { display: none; }
  .lecon { break-inside: avoid; border-color: #ccc; }
  .corps { display: block !important; }
  /* Les réponses masquées doivent sortir sur le papier : un cours imprimé où
     la moitié du contenu reste repliée ne sert à rien. */
  details:not([open]) > *:not(summary) { display: block !important; }
  body { background: #fff; color: #000; }
}
</style>
</head>
<body>
<div class="page">

<header>
  <h1>TAGE MAGE — cours et astuces</h1>
  <p class="sous">
    Les ${LECONS.length} techniques du concours, une par type de question : la règle,
    un exemple déroulé, et le piège qu’elle tend. Plus la boîte à outils à savoir par cœur.
  </p>
  <p class="meta">
    Fiche hors ligne · aucune connexion requise · générée le ${genere}
  </p>
</header>

<div class="barre">
  <input id="q" type="search" placeholder="Chercher — Pythagore, subjonctif, contraposée…" autocomplete="off" autocapitalize="off" spellcheck="false">
  <div class="chips">
    <button type="button" id="tout-replier">Tout replier</button>
    <button type="button" id="tout-deplier">Tout déplier</button>
    <a href="#parcours">Par où commencer</a>
    <a href="#general">Toute l’épreuve</a>
    ${SECTIONS.map((s) => `<a href="#st${s.numero}">${s.numero}. ${ech(s.libelle)}</a>`).join('')}
    <a href="#logique-socle">Logique A→Z</a>
    <a href="#outils">Boîte à outils</a>
  </div>
  <p id="compte"></p>
</div>

<section class="groupe" id="parcours">
  <h2><span class="st">Par où commencer</span>Un ordre d’attaque<span class="bloc">Il suit le rendement, pas le programme : d’abord ce qui se gagne par la méthode, en dernier ce qui demande des mois de langue. C’est un jugement, pas une mesure.</span></h2>
  ${parcours}
</section>

<section class="groupe" id="general">
  <h2><span class="st">Avant tout</span>Ce qui vaut pour toute l’épreuve</h2>
  <div class="intro">${reglesGenerales}</div>
</section>

<section class="groupe" id="logique-socle">
  <h2><span class="st">Sous-test 6</span>La logique, de A à Z<span class="bloc">Aucune connaissance n’y est exigée, et c’est ce qui la rend difficile : sans procédure, on fixe la série en espérant que la règle apparaisse. Ces quatre gestes valent pour les seize familles, et l’ordre de test remplace l’inspiration.</span></h2>
  <div class="intro">${fondationsLogique}</div>
  ${ordreDeTest}
</section>

${sections}

<section class="groupe" id="outils">
  <h2><span class="st">Mémoire</span>La boîte à outils<span class="bloc">Ce qui doit être su sans réfléchir : à 80 secondes par question, ce qui se recalcule coûte une question sur cinq.</span></h2>
  ${tables}
</section>

<p class="vide" id="rien" hidden>Aucune leçon ne contient ce mot.</p>

<footer>
  Fiche personnelle, générée depuis ta propre application de préparation.
  Pour t’entraîner et suivre tes scores, ouvre le site sur ton ordinateur.
</footer>

</div>

<script>
(function () {
  var champ = document.getElementById('q');
  var compte = document.getElementById('compte');
  var rien = document.getElementById('rien');
  var lecons = [].slice.call(document.querySelectorAll('.lecon'));
  var groupes = [].slice.call(document.querySelectorAll('.groupe'));

  // Arriver par une ancre (#tm.calcul.systemes) doit OUVRIR la leçon, pas la
  // faire défiler repliée sous les yeux.
  function ouvrir(id) {
    if (!id) return false;
    var el = document.getElementById(id);
    if (!el) return false;
    el.open = true;
    // Les parents aussi : une leçon vit dans un groupe qui peut être masqué.
    var p = el.parentElement;
    while (p) { if (p.tagName === 'DETAILS') p.open = true; p = p.parentElement; }
    el.scrollIntoView();
    return true;
  }
  function ouvrirLAncre() { ouvrir(decodeURIComponent(location.hash.slice(1))); }
  window.addEventListener('hashchange', ouvrirLAncre);

  // On n'attend pas que le navigateur suive le lien : sur un fichier ouvert
  // depuis le stockage d'un téléphone, la navigation par fragment n'est pas
  // toujours honorée. On agit nous-mêmes, et le lien reste valide sans script.
  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest ? e.target.closest('a[href^="#"]') : null;
    if (!a) return;
    var id = decodeURIComponent(a.getAttribute('href').slice(1));
    if (ouvrir(id)) e.preventDefault();
  });

  function filtrer() {
    var q = champ.value.trim().toLowerCase();
    var vus = 0;

    lecons.forEach(function (el) {
      var ok = !q || (el.getAttribute('data-cherche') || '').indexOf(q) !== -1;
      el.hidden = !ok;
      if (ok) vus++;
      // Une recherche qui laisse tout replié n'aide pas : on ouvre ce qui reste.
      // Les étapes du parcours gardent leur état initial : la première est
      // ouverte exprès, c'est le point d'entrée de la page.
      if (q && ok) el.open = true;
      if (!q && !el.classList.contains('etape')) el.open = false;
    });

    // Un titre de sous-test sans leçon en dessous est une ligne orpheline.
    groupes.forEach(function (g) {
      if (g.id === 'general') { g.hidden = !!q; return; }
      var reste = [].slice.call(g.querySelectorAll('.lecon')).some(function (e) { return !e.hidden; });
      g.hidden = !reste;
    });

    rien.hidden = vus > 0;
    compte.textContent = q
      ? vus + (vus > 1 ? ' leçons trouvées' : ' leçon trouvée')
      : '${LECONS.length} leçons · ${SECTIONS.length} fiches de conduite · ${TABLES.length} tables';
  }

  champ.addEventListener('input', filtrer);
  document.getElementById('tout-deplier').addEventListener('click', function () {
    lecons.forEach(function (e) { if (!e.hidden) e.open = true; });
  });
  document.getElementById('tout-replier').addEventListener('click', function () {
    lecons.forEach(function (e) { e.open = false; });
  });

  filtrer();
  ouvrirLAncre();
})();
</script>
</body>
</html>`

mkdirSync('data/exports', { recursive: true })
writeFileSync(SORTIE, html, 'utf8')

const octets = Buffer.byteLength(html, 'utf8')
console.log(`${SORTIE} — ${LECONS.length} leçons, ${TABLES.length} tables, ${FICHES.length} fiches de conduite`)
console.log(`${(octets / 1024).toFixed(0)} Ko, autonome (aucune ressource externe)`)
