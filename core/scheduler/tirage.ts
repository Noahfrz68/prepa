/**
 * Tirage équilibré des questions d'une épreuve.
 *
 * Le tirage d'origine — les moins vues d'abord, puis au hasard — ignorait le
 * type de question. Un diagnostic du 21 septembre a ainsi servi quatre
 * questions de pourcentages sur sept en calcul, dont deux fois le même modèle
 * (« augmente de x %, puis diminue de y % »). Le score mesurait alors une
 * sous-compétence plutôt qu'un sous-test, et changeait d'une épreuve à
 * l'autre selon ce que le hasard avait tiré.
 *
 * On répartit donc les questions entre les sous-compétences, au prorata de
 * leur poids à l'examen, et on n'accepte jamais deux fois le même modèle
 * d'énoncé dans une épreuve tant qu'il reste autre chose à servir.
 */

import type { Alea } from '@/core/generation/alea'

export interface Candidat {
  id: number
  skillId: string | null
  enonce: string
  /** Nombre de fois où la question a déjà été servie. */
  vu: number
}

/**
 * Signature du modèle d'un énoncé : ses premiers mots, chiffres retirés.
 * « Un vélo coûte 1 400 €. Son prix augmente de 20 % » et « Un vélo coûte
 * 900 €… » partagent la même ; « Un réfrigérateur coûte… » non. C'est
 * volontairement grossier : deux énoncés qui commencent pareil se ressemblent
 * assez pour ne pas figurer dans la même épreuve.
 */
export function modeleEnonce(enonce: string, nbMots = 4): string {
  return enonce
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z' ]+/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, nbMots)
    .join(' ')
}

/**
 * Ordre des sous-compétences à servir, pondéré par leur poids à l'examen :
 * tirage sans remise (clé u^(1/poids)), répété tant qu'il faut des questions.
 */
function ordreDesCompetences(
  poids: Map<string, number>,
  n: number,
  alea: Alea,
): string[] {
  const ordre: string[] = []
  while (ordre.length < n && poids.size > 0) {
    const tour = [...poids.entries()]
      .map(([skill, w]) => ({ skill, cle: Math.pow(Math.max(1e-9, aleaUnitaire(alea)), 1 / Math.max(w, 1e-3)) }))
      .sort((a, b) => b.cle - a.cle)
      .map((x) => x.skill)
    ordre.push(...tour)
  }
  return ordre.slice(0, n)
}

/** Réel dans ]0, 1[ tiré de l'Alea, qui ne fournit que des entiers. */
function aleaUnitaire(alea: Alea): number {
  return (alea.entier(1, 1_000_000) - 0.5) / 1_000_000
}

/**
 * Choisit `n` questions parmi les candidates.
 *
 * Priorités, dans l'ordre :
 *   1. couvrir le plus de sous-compétences possible, les plus pesantes d'abord ;
 *   2. dans une sous-compétence, ne pas répéter un modèle déjà servi ;
 *   3. les moins vues, puis au hasard.
 *
 * Quand une contrainte ne peut pas être tenue (banque trop petite), on la
 * relâche plutôt que de rendre moins de questions que demandé.
 */
export function tirageEquilibre(
  candidats: Candidat[],
  n: number,
  poidsCompetences: Map<string, number>,
  alea: Alea,
): Candidat[] {
  if (n <= 0 || candidats.length === 0) return []

  // Les moins vues d'abord, le hasard départage.
  const melanges = alea.melanger(candidats).sort((a, b) => a.vu - b.vu)

  const parSkill = new Map<string, Candidat[]>()
  for (const c of melanges) {
    const cle = c.skillId ?? '∅'
    if (!parSkill.has(cle)) parSkill.set(cle, [])
    parSkill.get(cle)!.push(c)
  }

  const poids = new Map<string, number>()
  for (const skill of parSkill.keys()) poids.set(skill, poidsCompetences.get(skill) ?? 1)

  const choisis: Candidat[] = []
  const pris = new Set<number>()
  // Un modèle se juge À L'INTÉRIEUR d'une sous-compétence : en expression,
  // l'orthographe, la syntaxe et les accords commencent tous par « Parmi les
  // propositions suivantes… » sans être le même exercice. Les comparer entre
  // eux faisait retomber le tirage sur les seuls synonymes.
  const modeles = new Set<string>()
  const cleModele = (c: Candidat) => `${c.skillId ?? '∅'}|${modeleEnonce(c.enonce)}`

  const prendre = (c: Candidat) => {
    choisis.push(c)
    pris.add(c.id)
    modeles.add(cleModele(c))
  }

  for (const skill of ordreDesCompetences(poids, n, alea)) {
    const liste = parSkill.get(skill)!.filter((c) => !pris.has(c.id))
    // Un modèle déjà servi cède la place : mieux vaut une autre compétence
    // qu'un énoncé que l'on vient de voir avec d'autres nombres.
    const c = liste.find((x) => !modeles.has(cleModele(x)))
    if (c) prendre(c)
  }

  // Complément quand certaines compétences n'avaient pas assez de questions.
  for (const c of melanges) {
    if (choisis.length >= n) break
    if (!pris.has(c.id) && !modeles.has(cleModele(c))) prendre(c)
  }
  for (const c of melanges) {
    if (choisis.length >= n) break
    if (!pris.has(c.id)) prendre(c)
  }

  return choisis.slice(0, n)
}
