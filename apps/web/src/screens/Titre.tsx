// Écran titre : le pilote vient de getSession, « JOUER » lance startRun.
import type { Run } from '../api/client';
import { useSession, useStartRun } from '../api/queries';
import { ErrorBox } from './ErrorBox';

export function Titre({ onStart }: { onStart: (run: Run) => void }) {
  const session = useSession();
  const start = useStartRun();

  return (
    <main className="wrap">
      <div className="screen">
        <h1 className="logo">STATUS KART</h1>
        {session.isPending && <p className="pill">CONNEXION AU HUB…</p>}
        {session.data && <p className="pill">PILOTE {session.data.pseudo.toUpperCase()} · NIVEAU {session.data.level}</p>}
        <ul className="bars">
          <li>Une situation HTTP s’affiche</li>
          <li>3 couloirs, 3 codes : prends le bon</li>
          <li><b className="g">Bon code</b> : boost et turbo</li>
          <li><b className="r">Mauvais code</b> : carapace, turbo à zéro</li>
        </ul>
        <ErrorBox error={session.error ?? start.error} />
        {session.data && (
          <button className="start" onClick={() => start.mutate(1, { onSuccess: onStart })} disabled={start.isPending}>
            JOUER
          </button>
        )}
      </div>
    </main>
  );
}
