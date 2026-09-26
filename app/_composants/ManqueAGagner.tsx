import { MANQUE_CASE_VIDE } from '@/core/scoring/tagemage'

const fr = (x: number) => x.toLocaleString('fr-FR', { maximumFractionDigits: 1 })

/**
 * « Case vide = manque à gagner », chiffré sur la série ou l'épreuve.
 *
 * Sans pénalité, une case vide ne protège de rien : elle rapporte 0 là où une
 * croix au hasard rapporte 0,8 point en moyenne. Dire « sautée » laissait
 * croire à une décision prudente ; c'est une perte, et on la montre.
 */
export default function ManqueAGagner({ cases }: { cases: number }) {
  if (cases <= 0) return null
  return (
    <p className="mt-4 rounded-xl border border-bord bg-carte px-5 py-4 text-sm leading-relaxed">
      <span className="font-medium text-blanc">Case vide = manque à gagner.</span>{' '}
      <span className="text-doux">
        {cases} case{cases > 1 ? 's' : ''} laissée{cases > 1 ? 's' : ''} vide{cases > 1 ? 's' : ''}{' '}
        × {fr(MANQUE_CASE_VIDE)} point ={' '}
        <span className="chiffres text-texte">{fr(cases * MANQUE_CASE_VIDE)}</span>{' '}
        {cases * MANQUE_CASE_VIDE >= 2 ? 'points bruts perdus' : 'point brut perdu'} en moyenne. Une croix au hasard
        ne coûte rien : quand le temps presse, coche avant de passer.
      </span>
    </p>
  )
}
