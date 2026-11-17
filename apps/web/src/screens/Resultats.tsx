// Écran de résultats. finishRun part dès le passage de la ligne (le back chronomètre jusque-là) :
// l'écran reçoit cette mutation et affiche son résultat, ou l'erreur avec un bouton pour réessayer.
import type { useFinish } from '../api/queries';
import { ErrorBox } from './ErrorBox';

// Une barrière ratée : le bon code et la situation, à revoir.
export type Miss = { code: string; situation: string };

type Props = {
  finish: ReturnType<typeof useFinish>;
  runId: string;
  circuit: string;
  misses: Miss[];
  onReplay: () => void;
};

export function Resultats({ finish, runId, circuit, misses, onReplay }: Props) {
  const r = finish.data;
  return (
    <main className="wrap">
      <div className="screen">
        <div className="card">
          <h2>{circuit} TERMINE</h2>
          {finish.isPending && <p className="muted">Calcul du score…</p>}
          <ErrorBox error={finish.error} onRetry={() => finish.mutate(runId)} />
          {r && (
            <div className="stats">
              <div><span>TEMPS</span>{(r.timeMs / 1000).toFixed(1).replace('.', ',')} s</div>
              <div><span>BONS COULOIRS</span>{r.correctCount} / {r.total}</div>
              <div><span>SCORE</span>{r.score}</div>
            </div>
          )}
          {r && <p>+{r.xpGained} XP</p>}
          {misses.length > 0 && (
            <>
              <p className="muted">À revoir :</p>
              <ul className="misses">{misses.map((m, i) => <li key={i}><b>{m.code}</b> {m.situation}</li>)}</ul>
            </>
          )}
          {r && <div className="btns"><button onClick={onReplay}>REJOUER</button></div>}
        </div>
      </div>
    </main>
  );
}
