import { deflateRawSync } from 'node:zlib'
import { describe, expect, it } from 'vitest'
import { anomaliesComprehension, parserComprehension } from './comprehension'
import { lireZip } from './zip'

/**
 * Une série minuscule, au format réel, avec deux textes que tout oppose : c'est
 * ce qui permet de vérifier l'appariement question ↔ texte, qui est le seul
 * risque sérieux de cet import.
 */
const SERIE = `# TAGE MAGE — Sous-test 1
## Épreuve de test

**Durée : 20 minutes.** Barème : +4 / −1 / 0.

---

## TEXTE A

La navigation hauturière a longtemps reposé sur l'estime, méthode qui consiste à déduire
sa position de sa vitesse et de son cap. Elle accumule les erreurs : une dérive de quelques
degrés déplace l'arrivée de plusieurs dizaines de milles après une semaine de mer.

L'invention du chronomètre de marine a changé cette donne. En conservant l'heure du port
de départ, il rendait la longitude calculable par simple comparaison avec l'heure locale.
Le problème n'était pas astronomique mais horloger.

---

**Question 1.** Quelle est l'idée directrice du texte ?

A. L'estime était une méthode fiable de navigation.
B. La longitude est devenue calculable grâce à un progrès de l'horlogerie.
C. Les marins ignoraient leur cap.
D. L'astronomie n'a joué aucun rôle en navigation.
E. La dérive est un phénomène négligeable.

**Question 2.** Que signifie, dans le texte, l'expression « le problème n'était pas astronomique mais horloger » ?

A. Les astronomes se sont trompés dans leurs calculs.
B. La solution supposait de conserver une heure de référence, non d'observer le ciel.
C. Les horlogers étaient meilleurs marins que les astronomes.
D. L'observation des astres était interdite en mer.
E. Le calcul de la latitude posait la même difficulté.

---

## TEXTE B

La fermentation lactique conserve les aliments en acidifiant le milieu au point d'y rendre
impossible le développement des bactéries de putréfaction. Le procédé ne demande ni froid
ni contenant hermétique, ce qui explique son universalité avant l'ère industrielle.

Elle modifie cependant le produit qu'elle protège. Un chou fermenté n'est pas un chou
conservé : c'est un autre aliment, dont la valeur nutritionnelle et le goût diffèrent de
l'original. La conservation n'est ici pas neutre.

---

**Question 3.** Selon le texte, pourquoi la fermentation était-elle universelle avant l'industrialisation ?

A. Parce qu'elle améliorait le goût des aliments.
B. Parce qu'elle ne demandait ni froid ni récipient étanche.
C. Parce qu'elle était la seule méthode connue.
D. Parce qu'elle augmentait la valeur nutritionnelle.
E. Parce qu'elle était imposée par les autorités sanitaires.

---
---

# CORRIGÉ

**1 — B.** Le texte oppose l'estime, qui accumule les erreurs, à la solution horlogère.
A est contredit par le premier paragraphe.
> *Règle ST1 :* une idée directrice couvre le texte entier, pas un seul paragraphe.

**2 — B.** « En conservant l'heure du port de départ, il rendait la longitude calculable. »

**3 — B.** « Le procédé ne demande ni froid ni contenant hermétique. »

---

## Grille de score

| Bonnes | Mauvaises |
|---|---|
`

describe('parserComprehension', () => {
  const r = parserComprehension('test.md', SERIE)

  it('sépare les textes support du questionnaire', () => {
    expect(r.textes.map((t) => t.cle)).toEqual(['A', 'B'])
    expect(r.textes[0].contenu).toContain('navigation hauturière')
    // Le passage s'arrête à la première question : sans cela, l'énoncé et les
    // propositions se retrouveraient dans le texte à lire.
    expect(r.textes[0].contenu).not.toContain('Question 1')
    expect(r.textes[0].contenu).not.toContain('idée directrice')
  })

  it('rattache chaque question à son propre texte', () => {
    expect(r.questions.map((q) => q.texteCle)).toEqual(['A', 'A', 'B'])
    expect(r.questions[2].contexte).toContain('fermentation lactique')
    expect(r.questions[2].contexte).not.toContain('navigation')
  })

  it('lit les cinq propositions dans l’ordre', () => {
    for (const q of r.questions) expect(q.options).toHaveLength(5)
    expect(r.questions[0].options[1]).toContain('progrès de l’horlogerie'.replace('’', "'"))
  })

  it('apparie le corrigé par numéro de question', () => {
    expect(r.questions.map((q) => q.bonneReponse)).toEqual(['B', 'B', 'B'])
  })

  it('garde la règle de méthode dans l’explication', () => {
    expect(r.questions[0].explication).toContain('Règle ST1')
    expect(r.questions[0].explication).toContain('couvre le texte entier')
    // Le balisage Markdown ne doit pas arriver jusqu'à l'écran.
    expect(r.questions[0].explication).not.toContain('**')
    expect(r.questions[0].explication).not.toContain('>')
  })

  it('ne signale aucune anomalie sur une série saine', () => {
    expect(anomaliesComprehension(r)).toEqual([])
  })
})

describe('anomaliesComprehension', () => {
  // Le défaut à attraper : une question accrochée au mauvais passage. Elle
  // reste parfaitement lisible, et seul le recoupement lexical la révèle.
  it('détecte une question rattachée au mauvais texte', () => {
    const r = parserComprehension('test.md', SERIE)
    const permute = {
      ...r,
      questions: r.questions.map((q, i) =>
        i === 2 ? { ...q, texteCle: 'A', contexte: r.textes[0].contenu } : q,
      ),
    }

    const motifs = anomaliesComprehension(permute).map((a) => a.motif)
    expect(motifs.join(' ')).toMatch(/correspond mieux au texte B/)
  })

  it('signale une question sans réponse au corrigé', () => {
    const sansCorrige = parserComprehension('test.md', SERIE.split('# CORRIGÉ')[0])
    const motifs = anomaliesComprehension(sansCorrige).map((a) => a.motif)
    expect(motifs).toContain('aucune réponse au corrigé')
  })
})

/* ------------------------------------------------------------------ zip -- */

/** Construit une archive minimale, pour éprouver le lecteur sur les deux méthodes. */
function fabriquerZip(entrees: Array<{ nom: string; contenu: string; compresse: boolean }>): Buffer {
  const locaux: Buffer[] = []
  const centraux: Buffer[] = []
  let decalage = 0

  for (const e of entrees) {
    const nom = Buffer.from(e.nom, 'utf8')
    const brut = Buffer.from(e.contenu, 'utf8')
    const donnees = e.compresse ? deflateRawSync(brut) : brut

    const local = Buffer.alloc(30)
    local.writeUInt32LE(0x04034b50, 0)
    local.writeUInt16LE(e.compresse ? 8 : 0, 8)
    local.writeUInt32LE(donnees.length, 18)
    local.writeUInt32LE(brut.length, 22)
    local.writeUInt16LE(nom.length, 26)
    locaux.push(local, nom, donnees)

    const central = Buffer.alloc(46)
    central.writeUInt32LE(0x02014b50, 0)
    central.writeUInt16LE(e.compresse ? 8 : 0, 10)
    central.writeUInt32LE(donnees.length, 20)
    central.writeUInt32LE(brut.length, 24)
    central.writeUInt16LE(nom.length, 28)
    central.writeUInt32LE(decalage, 42)
    centraux.push(central, nom)

    decalage += 30 + nom.length + donnees.length
  }

  const corps = Buffer.concat(locaux)
  const repertoire = Buffer.concat(centraux)
  const fin = Buffer.alloc(22)
  fin.writeUInt32LE(0x06054b50, 0)
  fin.writeUInt16LE(entrees.length, 8)
  fin.writeUInt16LE(entrees.length, 10)
  fin.writeUInt32LE(repertoire.length, 12)
  fin.writeUInt32LE(corps.length, 16)

  return Buffer.concat([corps, repertoire, fin])
}

describe('lireZip', () => {
  it('lit les entrées stockées et compressées', () => {
    const archive = fabriquerZip([
      { nom: 'dossier/brut.md', contenu: 'texte non compressé', compresse: false },
      { nom: 'dossier/serre.md', contenu: SERIE, compresse: true },
    ])

    const { fichiers, avertissements } = lireZip(archive)
    expect(avertissements).toEqual([])
    expect(fichiers.map((f) => f.nom)).toEqual(['dossier/brut.md', 'dossier/serre.md'])
    expect(fichiers[0].contenu.toString('utf8')).toBe('texte non compressé')
    expect(fichiers[1].contenu.toString('utf8')).toBe(SERIE)
  })

  it('refuse une archive sans répertoire central', () => {
    expect(() => lireZip(Buffer.from('ceci n’est pas une archive'))).toThrow(/répertoire central/)
  })
})
