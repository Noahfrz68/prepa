import type { Base } from '@/core/db/base'

/**
 * Fusion de deux bases : celle d'un autre appareil (E, « entrante ») dans
 * celle de cet appareil (L, « locale »).
 *
 * Aucune des deux n'écrase l'autre. Chaque table a sa règle :
 *
 *   — identité : l'`uid` pour les lignes créées au fil de l'usage (questions,
 *     séances, cartes…), une clé naturelle pour les autres (hash du média,
 *     exam_id, skill_id, semaine…). Les `id` locaux diffèrent d'un appareil à
 *     l'autre : toute référence (item_id, session_id, media_id…) est traduite ;
 *
 *   — conflits : quand la même ligne a changé des deux côtés, la modification
 *     la plus récente (`maj_le`) l'emporte. Les lignes qui ne changent jamais
 *     après leur création (réponses, révisions, journal d'étude) s'ajoutent
 *     simplement ;
 *
 *   — suppressions : une ligne supprimée d'un côté (registre `suppression`)
 *     l'est de l'autre, et n'y revient plus ;
 *
 *   — doublons : deux questions de même contenu créées chacune de son côté (la
 *     même annale importée deux fois, la même question engendrée) deviennent une
 *     seule, dont l'uid est le plus petit des deux — les deux appareils
 *     convergent ainsi vers le même.
 *
 * Tout se fait en une transaction : une fusion ratée ne laisse rien. E doit
 * être au même schéma que L (paquet.ts la migre avant). Les caches calculés
 * depuis l'historique (skill_state, état des cartes) sont à reconstruire après
 * (voir app/api/sync/route.ts).
 *
 * Ne sont pas fusionnés : `skill` et `rubric` (amorcés à l'identique sur chaque
 * appareil), `skill_state` (recalculé), `ai_job` (réponses d'IA en cache, liées
 * à des identifiants locaux), et l'état propre à chaque appareil
 * (`fichier_distant`, `synchronisation`).
 */

type Ligne = Record<string, unknown>

export interface BilanTable {
  ajoutees: number
  modifiees: number
  supprimees: number
}

export type Bilan = Record<string, BilanTable>

export function fusionner(L: Base, E: Base): Bilan {
  return L.transaction(() => {
    L.prepare('INSERT INTO sync_verrou (present) VALUES (1)').run()
    try {
      return new Fusion(L, E).tout()
    } finally {
      L.prepare('DELETE FROM sync_verrou').run()
    }
  })()
}

class Fusion {
  private bilan: Bilan = {}
  private colonnesCache = new Map<string, string[]>()
  private tombes = new Set<string>()

  private media = new Map<number, number>()
  private items = new Map<number, number>()
  private sessions = new Map<number, number>()
  private cartes = new Map<number, number>()
  private grilles = new Map<number, number>()
  private sujets = new Map<number, number>()

  constructor(
    private L: Base,
    private E: Base,
  ) {}

  tout(): Bilan {
    this.suppressions()
    this.fusionMedia()
    this.fusionItems()
    this.fusionSessions()
    this.fusionTentatives()
    this.fusionCarnet()
    this.fusionObjectifs()
    this.fusionProfil()
    this.fusionLecons()
    this.fusionPlans()
    this.fusionCartes()
    this.fusionRevisions()
    this.fusionEcrit()
    this.fusionMemoire()
    this.fusionAutomatismes()
    return this.bilan
  }

  /* ------------------------------------------------------------ outils -- */

  private compte(table: string): BilanTable {
    return (this.bilan[table] ??= { ajoutees: 0, modifiees: 0, supprimees: 0 })
  }

  private colonnes(table: string): string[] {
    let c = this.colonnesCache.get(table)
    if (!c) {
      const l = (this.L.pragma(`table_info("${table}")`) as Array<{ name: string }>).map((x) => x.name)
      const e = new Set((this.E.pragma(`table_info("${table}")`) as Array<{ name: string }>).map((x) => x.name))
      c = l.filter((x) => e.has(x))
      this.colonnesCache.set(table, c)
    }
    return c
  }

  private tous(table: string, ordre = 'rowid'): Ligne[] {
    return this.E.prepare(`SELECT * FROM "${table}" ORDER BY ${ordre}`).all() as Ligne[]
  }

  /** Insère la ligne (sans son `id`, que L attribue) et rend l'id local. */
  private inserer(table: string, ligne: Ligne, exclure: string[] = ['id']): number {
    const cols = this.colonnes(table).filter((c) => !exclure.includes(c))
    const r = this.L.prepare(
      `INSERT INTO "${table}" (${cols.map((c) => `"${c}"`).join(', ')}) VALUES (${cols.map(() => '?').join(', ')})`,
    ).run(cols.map((c) => ligne[c] as never))
    this.compte(table).ajoutees++
    return Number(r.lastInsertRowid)
  }

  /** Recopie toutes les colonnes de la ligne (sauf les exclues) sur la ligne locale désignée. */
  private remplacer(table: string, ligne: Ligne, ou: string, valeurs: unknown[], exclure: string[] = ['id']) {
    const cols = this.colonnes(table).filter((c) => !exclure.includes(c))
    this.L.prepare(`UPDATE "${table}" SET ${cols.map((c) => `"${c}" = ?`).join(', ')} WHERE ${ou}`).run([
      ...cols.map((c) => ligne[c] as never),
      ...(valeurs as never[]),
    ])
    this.compte(table).modifiees++
  }

  /** La ligne entrante est-elle plus récente que la locale ? (NULL : jamais modifiée.) */
  private plusRecente(entrante: unknown, locale: unknown): boolean {
    return String(entrante ?? '') > String(locale ?? '')
  }

  private tombee(table: string, cle: unknown): boolean {
    return this.tombes.has(`${table}:${String(cle)}`)
  }

  /* ------------------------------------------------------ suppressions -- */

  /**
   * Les suppressions faites sur l'autre appareil, appliquées ici — sauf si la
   * ligne locale a été modifiée après. Le registre local les retient ensuite :
   * elles ne reviendront pas, et repartiront vers un troisième appareil.
   */
  private suppressions() {
    for (const t of this.L.prepare('SELECT nom_table, cle FROM suppression').all() as Array<{ nom_table: string; cle: string }>) {
      this.tombes.add(`${t.nom_table}:${t.cle}`)
    }

    const entrantes = this.E.prepare('SELECT nom_table, cle, supprime_le FROM suppression').all() as Array<{
      nom_table: string
      cle: string
      supprime_le: string
    }>

    for (const t of entrantes) {
      this.L.prepare('INSERT OR IGNORE INTO suppression (nom_table, cle, supprime_le) VALUES (?, ?, ?)').run(
        t.nom_table,
        t.cle,
        t.supprime_le,
      )
      this.tombes.add(`${t.nom_table}:${t.cle}`)

      let n = 0
      switch (t.nom_table) {
        case 'item': {
          const l = this.L.prepare('SELECT id, maj_le FROM item WHERE uid = ?').get(t.cle) as Ligne | undefined
          if (l && !this.plusRecente(l.maj_le, t.supprime_le)) {
            // Comme l'atelier : les réponses d'abord, qui ne suivent pas seules.
            this.L.prepare('DELETE FROM attempt WHERE item_id = ?').run(l.id as number)
            n = this.L.prepare('DELETE FROM item WHERE id = ?').run(l.id as number).changes
          }
          break
        }
        case 'exam_session':
        case 'vocab_card':
          n = this.L.prepare(
            `DELETE FROM ${t.nom_table} WHERE uid = ? AND IFNULL(maj_le, '') <= ?`,
          ).run(t.cle, t.supprime_le).changes
          break
        case 'lecon_session':
          n = this.L.prepare('DELETE FROM lecon_session WHERE uid = ?').run(t.cle).changes
          break
        case 'lecon_etude':
          n = this.L.prepare('DELETE FROM lecon_etude WHERE skill_id = ? AND maj_le <= ?').run(t.cle, t.supprime_le)
            .changes
          break
        case 'carnet_note':
          n = this.L.prepare(
            `DELETE FROM carnet_note WHERE item_id = (SELECT id FROM item WHERE uid = ?) AND maj_le <= ?`,
          ).run(t.cle, t.supprime_le).changes
          break
      }
      if (n > 0) this.compte(t.nom_table).supprimees += n
    }
  }

  /* ------------------------------------------------------------- media -- */

  /** Même hash, même script : même média. Un fichier connu d'un seul côté complète l'autre. */
  private fusionMedia() {
    for (const m of this.tous('media')) {
      const l = this.L.prepare(
        'SELECT id, chemin_fichier, duree_ms, voix, moteur_tts FROM media WHERE hash_script = ?',
      ).get(m.hash_script as string) as Ligne | undefined

      if (!l) {
        this.media.set(m.id as number, this.inserer('media', m))
        continue
      }
      this.media.set(m.id as number, l.id as number)

      const aCompleter = (['chemin_fichier', 'duree_ms', 'voix', 'moteur_tts'] as const).filter(
        (c) => l[c] === null && m[c] !== null,
      )
      if (aCompleter.length > 0) {
        this.L.prepare(`UPDATE media SET ${aCompleter.map((c) => `${c} = ?`).join(', ')} WHERE id = ?`).run([
          ...aCompleter.map((c) => m[c] as never),
          l.id as number,
        ])
        this.compte('media').modifiees++
      }
    }
  }

  /* ------------------------------------------------------------- items -- */

  private fusionItems() {
    const uidsEntrants = new Set(this.tous('item').map((i) => i.uid as string))
    const memeContenu = this.L.prepare(
      `SELECT id, uid, maj_le FROM item
        WHERE exam_id = ? AND section = ? AND enonce = ?
          AND IFNULL(info_1, '') = IFNULL(?, '') AND IFNULL(info_2, '') = IFNULL(?, '')
          AND IFNULL(options, '') = IFNULL(?, '') AND bonne_reponse = ? AND source = ?
        ORDER BY id`,
    )

    for (const brute of this.tous('item')) {
      if (this.tombee('item', brute.uid)) continue
      const i: Ligne = {
        ...brute,
        media_id: brute.media_id === null ? null : (this.media.get(brute.media_id as number) ?? null),
      }

      let l = this.L.prepare('SELECT id, uid, maj_le FROM item WHERE uid = ?').get(i.uid as string) as Ligne | undefined

      if (!l) {
        // Même contenu, créé de son côté : c'est la même question. Seules les
        // lignes que l'autre appareil n'a pas déjà sous leur propre uid comptent.
        const candidats = memeContenu.all(
          i.exam_id as string,
          i.section as string,
          i.enonce as string,
          i.info_1 as string,
          i.info_2 as string,
          i.options as string,
          i.bonne_reponse as string,
          i.source as string,
        ) as Ligne[]
        const jumeau = candidats.find((c) => !uidsEntrants.has(c.uid as string))
        if (jumeau) {
          const uid = [jumeau.uid as string, i.uid as string].sort()[0]
          if (uid !== jumeau.uid) this.L.prepare('UPDATE item SET uid = ? WHERE id = ?').run(uid, jumeau.id as number)
          l = { ...jumeau, uid }
        }
      }

      if (!l) {
        this.items.set(i.id as number, this.inserer('item', i))
        continue
      }

      this.items.set(i.id as number, l.id as number)
      if (this.plusRecente(i.maj_le, l.maj_le)) {
        this.remplacer('item', { ...i, uid: l.uid }, 'id = ?', [l.id], ['id'])
      }
    }
  }

  /* ---------------------------------------------------------- séances -- */

  private fusionSessions() {
    for (const s of this.tous('exam_session')) {
      if (this.tombee('exam_session', s.uid)) continue
      const l = this.L.prepare('SELECT id, maj_le FROM exam_session WHERE uid = ?').get(s.uid as string) as
        | Ligne
        | undefined
      if (!l) {
        this.sessions.set(s.id as number, this.inserer('exam_session', s))
        continue
      }
      this.sessions.set(s.id as number, l.id as number)
      if (this.plusRecente(s.maj_le, l.maj_le)) this.remplacer('exam_session', s, 'id = ?', [l.id])
    }
  }

  /** Une réponse est désignée par sa séance et sa question ; elle ne change jamais. */
  private fusionTentatives() {
    const cols = this.colonnes('attempt').filter((c) => c !== 'id')
    const inserer = this.L.prepare(
      `INSERT INTO attempt (${cols.join(', ')}) VALUES (${cols.map(() => '?').join(', ')})
       ON CONFLICT (session_id, item_id) DO NOTHING`,
    )
    for (const a of this.tous('attempt')) {
      const session = this.sessions.get(a.session_id as number)
      const item = this.items.get(a.item_id as number)
      if (session === undefined || item === undefined) continue
      const ligne: Ligne = { ...a, session_id: session, item_id: item }
      if (inserer.run(cols.map((c) => ligne[c] as never)).changes > 0) this.compte('attempt').ajoutees++
    }
  }

  /* ----------------------------------------------------------- carnet -- */

  private fusionCarnet() {
    const uidDe = this.E.prepare('SELECT uid FROM item WHERE id = ?')
    for (const n of this.tous('carnet_note')) {
      const item = this.items.get(n.item_id as number)
      if (item === undefined) continue
      const ligne: Ligne = { ...n, item_id: item }
      const l = this.L.prepare('SELECT maj_le FROM carnet_note WHERE item_id = ?').get(item) as Ligne | undefined
      if (!l) {
        const uid = (uidDe.get(n.item_id as number) as Ligne | undefined)?.uid
        if (this.tombee('carnet_note', uid)) continue
        this.inserer('carnet_note', ligne, [])
      } else if (this.plusRecente(n.maj_le, l.maj_le)) {
        this.remplacer('carnet_note', ligne, 'item_id = ?', [item], [])
      }
    }
  }

  /* ------------------------------------------------- objectifs, profil -- */

  private fusionObjectifs() {
    for (const g of this.tous('exam_goal')) {
      const l = this.L.prepare('SELECT maj_le FROM exam_goal WHERE exam_id = ?').get(g.exam_id as string) as
        | Ligne
        | undefined
      if (!l) this.inserer('exam_goal', g, [])
      else if (this.plusRecente(g.maj_le, l.maj_le)) this.remplacer('exam_goal', g, 'exam_id = ?', [g.exam_id], [])
    }
  }

  private fusionProfil() {
    for (const p of this.tous('user_profile')) {
      const l = this.L.prepare('SELECT maj_le FROM user_profile WHERE id = ?').get(p.id as number) as Ligne | undefined
      if (!l) this.inserer('user_profile', p, [])
      else if (this.plusRecente(p.maj_le, l.maj_le)) this.remplacer('user_profile', p, 'id = ?', [p.id], [])
    }
  }

  /* ------------------------------------------------------------ leçons -- */

  private fusionLecons() {
    for (const e of this.tous('lecon_etude')) {
      const l = this.L.prepare('SELECT maj_le FROM lecon_etude WHERE skill_id = ?').get(e.skill_id as string) as
        | Ligne
        | undefined
      if (!l) {
        if (!this.tombee('lecon_etude', e.skill_id)) this.inserer('lecon_etude', e, [])
      } else if (this.plusRecente(e.maj_le, l.maj_le)) {
        this.remplacer('lecon_etude', e, 'skill_id = ?', [e.skill_id], [])
      }
    }
    for (const s of this.tous('lecon_session')) {
      if (this.tombee('lecon_session', s.uid)) continue
      if (!this.L.prepare('SELECT 1 FROM lecon_session WHERE uid = ?').get(s.uid as string)) this.inserer('lecon_session', s)
    }
  }

  /* ------------------------------------------------------------- plans -- */

  /**
   * Le plan d'une semaine est figé par le premier appareil qui l'a composé :
   * une semaine absente d'ici est reprise telle quelle, une semaine présente
   * des deux côtés garde sa version locale, et ne reçoit que les tâches
   * cochées de l'autre côté.
   *
   * Exception : un plan local VIDE (figé sur un appareil neuf, avant qu'il ait
   * reçu la moindre question) cède la place à celui de l'autre appareil.
   */
  private fusionPlans() {
    const tachesEntrantes = this.tous('plan_tache', 'semaine_du, ordre')
    for (const p of this.tous('study_plan')) {
      const semaine = p.semaine_du as string
      const siennes = tachesEntrantes.filter((x) => x.semaine_du === semaine)
      const existe = this.L.prepare('SELECT 1 FROM study_plan WHERE semaine_du = ?').get(semaine)
      const localesVides =
        existe && (this.L.prepare('SELECT COUNT(*) AS n FROM plan_tache WHERE semaine_du = ?').get(semaine) as { n: number }).n === 0

      if (existe && localesVides && siennes.length > 0) {
        this.remplacer('study_plan', p, 'semaine_du = ?', [semaine], [])
        for (const t of siennes) this.inserer('plan_tache', t)
        continue
      }
      if (!existe) {
        this.inserer('study_plan', p, [])
        for (const t of siennes) this.inserer('plan_tache', t)
        continue
      }
      for (const t of tachesEntrantes.filter((x) => x.semaine_du === p.semaine_du && x.fait_le !== null)) {
        const n = this.L.prepare(
          `UPDATE plan_tache SET fait_le = ?
            WHERE semaine_du = ? AND ordre = ? AND type = ? AND libelle = ? AND fait_le IS NULL`,
        ).run(t.fait_le as string, t.semaine_du as string, t.ordre as number, t.type as string, t.libelle as string)
          .changes
        if (n > 0) this.compte('plan_tache').modifiees += n
      }
    }
  }

  /* ------------------------------------------------------- vocabulaire -- */

  private fusionCartes() {
    const uidsEntrants = new Set(this.tous('vocab_card').map((c) => c.uid as string))
    for (const brute of this.tous('vocab_card')) {
      if (this.tombee('vocab_card', brute.uid)) continue
      const c: Ligne = {
        ...brute,
        origine_item_id:
          brute.origine_item_id === null ? null : (this.items.get(brute.origine_item_id as number) ?? null),
      }

      let l = this.L.prepare('SELECT id, uid, maj_le FROM vocab_card WHERE uid = ?').get(c.uid as string) as
        | Ligne
        | undefined
      if (!l) {
        // Un terme ne figure qu'une fois (index sur lower(terme)) : le même
        // terme ajouté des deux côtés est la même carte.
        const jumeau = this.L.prepare('SELECT id, uid, maj_le FROM vocab_card WHERE lower(terme) = lower(?)').get(
          c.terme as string,
        ) as Ligne | undefined
        if (jumeau && !uidsEntrants.has(jumeau.uid as string)) {
          const uid = [jumeau.uid as string, c.uid as string].sort()[0]
          if (uid !== jumeau.uid) this.L.prepare('UPDATE vocab_card SET uid = ? WHERE id = ?').run(uid, jumeau.id as number)
          l = { ...jumeau, uid }
        } else if (jumeau) {
          // Deux cartes distinctes de l'autre côté pour un même terme : on les confond ici.
          l = jumeau
        }
      }

      if (!l) {
        this.cartes.set(c.id as number, this.inserer('vocab_card', c))
        continue
      }
      this.cartes.set(c.id as number, l.id as number)
      if (this.plusRecente(c.maj_le, l.maj_le)) this.remplacer('vocab_card', { ...c, uid: l.uid }, 'id = ?', [l.id])
    }
  }

  private fusionRevisions() {
    for (const r of this.tous('vocab_revision')) {
      const carte = this.cartes.get(r.card_id as number)
      if (carte === undefined) continue
      if (this.L.prepare('SELECT 1 FROM vocab_revision WHERE uid = ?').get(r.uid as string)) continue
      this.inserer('vocab_revision', { ...r, card_id: carte })
    }
  }

  /* ------------------------------------------------------------- écrit -- */

  private fusionEcrit() {
    // Grilles et sujets sont amorcés sur chaque appareil : on ne fait que
    // retrouver leurs identifiants locaux (et ajouter un sujet importé).
    for (const g of this.tous('rubric')) {
      const l = this.L.prepare('SELECT id FROM rubric WHERE type_tache = ?').get(g.type_tache as string) as
        | Ligne
        | undefined
      this.grilles.set(g.id as number, l ? (l.id as number) : this.inserer('rubric', g))
    }
    for (const t of this.tous('prompt_task')) {
      const l = this.L.prepare('SELECT id FROM prompt_task WHERE type_tache = ? AND consigne = ?').get(
        t.type_tache as string,
        t.consigne as string,
      ) as Ligne | undefined
      const ligne: Ligne = {
        ...t,
        media_id: t.media_id === null ? null : (this.media.get(t.media_id as number) ?? null),
        rubric_id: t.rubric_id === null ? null : (this.grilles.get(t.rubric_id as number) ?? null),
      }
      this.sujets.set(t.id as number, l ? (l.id as number) : this.inserer('prompt_task', ligne))
    }

    for (const p of this.tous('production')) {
      const session = this.sessions.get(p.session_id as number)
      const sujet = this.sujets.get(p.prompt_task_id as number)
      if (session === undefined || sujet === undefined) continue
      const ligne: Ligne = { ...p, session_id: session, prompt_task_id: sujet }
      const l = this.L.prepare('SELECT id, maj_le FROM production WHERE uid = ?').get(p.uid as string) as
        | Ligne
        | undefined
      if (!l) this.inserer('production', ligne)
      else if (this.plusRecente(p.maj_le, l.maj_le)) this.remplacer('production', ligne, 'id = ?', [l.id])
    }
  }

  /* ------------------------------------------------------ mémoire tuteur -- */

  private fusionMemoire() {
    for (const m of this.tous('coach_memory')) {
      if (!this.L.prepare('SELECT 1 FROM coach_memory WHERE uid = ?').get(m.uid as string)) this.inserer('coach_memory', m)
    }
  }

  /* ------------------------------------------------------ automatismes -- */

  /**
   * Les parties d'automatismes ne changent jamais une fois jouées : celles
   * qui manquent s'ajoutent, avec leurs réponses. Les réponses désignent leur
   * partie par son uid, pas par un id local : rien à traduire. Records, faits
   * à revoir et série du défi se recalculent d'eux-mêmes depuis ces lignes.
   */
  private fusionAutomatismes() {
    for (const p of this.tous('automatisme_partie')) {
      if (!this.L.prepare('SELECT 1 FROM automatisme_partie WHERE uid = ?').get(p.uid as string)) {
        this.inserer('automatisme_partie', p)
      }
    }
    const cols = this.colonnes('automatisme_reponse').filter((c) => c !== 'id')
    const inserer = this.L.prepare(
      `INSERT INTO automatisme_reponse (${cols.join(', ')}) VALUES (${cols.map(() => '?').join(', ')})
       ON CONFLICT (partie_uid, ordre) DO NOTHING`,
    )
    for (const r of this.tous('automatisme_reponse')) {
      if (inserer.run(cols.map((c) => r[c] as never)).changes > 0) this.compte('automatisme_reponse').ajoutees++
    }
  }
}
