import Link from 'next/link'
import { etatChaine, fournisseurActif } from '@/core/ia/fournisseurs'
import { historiqueMemoire } from '@/core/ia/tuteur'
import ChoixTheme from '@/app/_composants/ChoixTheme'
import { momentLisible } from '@/app/_composants/dates'

export const dynamic = 'force-dynamic'

export default function PageReglages() {
  const chaine = etatChaine()
  const actif = fournisseurActif()
  const memoires = historiqueMemoire('tagemage', 5)

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <Link href="/" className="text-sm text-doux hover:text-texte">
        ← Accueil
      </Link>

      <header className="mt-6 mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Réglages</h1>
        <p className="mt-1 text-sm leading-relaxed text-doux">
          L’IA est un supplément, jamais une dépendance. Tout ce que l’application calcule —
          scores, calibration, calendrier, plan — fonctionne sans elle et reste exact. Ce qu’un
          modèle ajoute, c’est l’interprétation.
        </p>
      </header>

      <section className="mb-8">
        <h2 className="mb-3 text-sm uppercase tracking-widest text-doux">Fournisseur</h2>

        <div
          className={`rounded-xl border px-5 py-4 ${
            actif.id === 'aucun' ? 'border-bord bg-carte' : 'border-juste bg-carte'
          }`}
        >
          {actif.id === 'aucun' ? (
            <>
              <p className="text-sm font-medium">Aucune IA configurée.</p>
              <p className="mt-1 text-sm text-doux">
                L’application est pleinement utilisable dans cet état. Les écrans de résultat
                affichent leurs chiffres, sans zone de débrief.
              </p>
            </>
          ) : (
            <>
              <p className="text-sm font-medium text-juste">Actif : {actif.libelle}</p>
              <p className="mt-1 text-sm text-doux">
                Le tuteur commente tes séries. Si le quota est atteint ou le service
                indisponible, l’écran reste identique, sans la zone de débrief.
              </p>
            </>
          )}
        </div>

        <ul className="mt-3 space-y-2">
          {chaine.map((f, i) => (
            <li
              key={f.id}
              className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg border border-bord bg-carte px-4 py-3 text-sm"
            >
              <span className="chiffres w-4 text-doux">{i + 1}</span>
              <span className="flex-1">{f.libelle}</span>
              {f.raisonIndisponibilite === null ? (
                <span className="text-xs text-juste">prêt</span>
              ) : (
                <span className="text-xs text-doux">{f.raisonIndisponibilite}</span>
              )}
            </li>
          ))}
        </ul>

        <div className="mt-4 rounded-xl border border-bord bg-carte px-5 py-4 text-sm leading-relaxed text-doux">
          <p>
            Les clés se posent dans un fichier <code className="text-texte">.env.local</code> à la
            racine du projet, jamais dans l’interface : elles ne doivent pas transiter par le
            navigateur. Le fichier{' '}
            <code className="text-texte">.env.local.exemple</code> liste les variables et ce
            qu’elles activent.
          </p>
          <p className="mt-3">
            Ordre de repli par défaut : Google AI Studio, puis Groq — tous deux gratuits pour le
            volume d’un utilisateur unique. Ollama est branchable mais désactivé : sur une machine
            sans GPU dédié, un modèle 7B tourne à 40-70 s par débrief avec un JSON peu fiable.
            Anthropic est payant et ne s’active qu’avec une clé délibérément posée.
          </p>
          <p className="mt-3">
            Next.js relit <code className="text-texte">.env.local</code> à chaud : recharge cette
            page après l’avoir modifié. Si le changement ne prend pas, redémarre{' '}
            <code className="text-texte">npm run dev</code>.
          </p>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="mb-1 text-sm uppercase tracking-widest text-doux">Affichage</h2>
        <p className="mb-3 text-sm leading-relaxed text-doux">
          Le thème suit celui du système par défaut. Le choix est gardé dans ce navigateur. Partout,{' '}
          <kbd className="kbd">?</kbd> affiche les raccourcis clavier de la page.
        </p>
        <ChoixTheme />
      </section>

      <section className="mb-8">
        <h2 className="mb-1 text-sm uppercase tracking-widest text-doux">Mes données</h2>
        <p className="mb-3 text-sm leading-relaxed text-doux">
          Toute ta progression tient dans un fichier. Une copie est faite chaque jour dans{' '}
          <code className="text-texte">data/sauvegardes/</code> (les 14 dernières sont gardées) ;
          l’export en fait une de plus, à ranger où tu veux.
        </p>
        <div className="flex flex-wrap gap-3">
          <a
            href="/api/export?format=sqlite"
            download
            className="rounded-lg border border-bord bg-carte px-4 py-2 text-sm hover:border-accent"
          >
            Exporter la base (.db)
          </a>
          <a
            href="/api/export?format=json"
            download
            className="rounded-lg border border-bord bg-carte px-4 py-2 text-sm hover:border-accent"
          >
            Exporter en JSON
          </a>
        </div>
        <p className="mt-3 text-xs leading-relaxed text-doux">
          La base se restaure en remplaçant <code className="text-texte">data/app.db</code> par la
          copie, application arrêtée (et en supprimant{' '}
          <code className="text-texte">app.db-wal</code> et{' '}
          <code className="text-texte">app.db-shm</code> s’ils existent). Le JSON sert à relire ou analyser ailleurs ; il ne contient
          pas les images.
        </p>
      </section>

      <section>
        <h2 className="mb-1 text-sm uppercase tracking-widest text-doux">Mémoire du tuteur</h2>
        <p className="mb-3 text-sm leading-relaxed text-doux">
          Le profil que le tuteur se fait de toi, en langage naturel. Versionné et jamais écrasé :
          on doit pouvoir relire ce qu’il croyait il y a un mois. Il ne contient aucune
          statistique — elles vivent en base et seraient périmées.
        </p>

        {memoires.length === 0 ? (
          <p className="rounded-xl border border-bord bg-carte px-5 py-4 text-sm text-doux">
            Aucune version pour l’instant. Le tuteur n’en écrit une que lorsqu’il observe quelque
            chose de durablement nouveau.
          </p>
        ) : (
          <ul className="space-y-3">
            {memoires.map((m) => (
              <li key={m.id} className="rounded-xl border border-bord bg-carte px-5 py-4">
                <div className="flex flex-wrap items-baseline gap-x-4 text-xs text-doux">
                  <span className="chiffres">version {m.version}</span>
                  <span>{momentLisible(m.genereLe)}</span>
                  <span>{m.declencheur}</span>
                  {m.modele && <span>{m.modele}</span>}
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">{m.contenu}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}
