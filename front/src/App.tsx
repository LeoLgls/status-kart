// Les trois écrans du niveau 1, branchés sur le contrat (MSW en dev). La course en canvas viendra
// remplacer l'écran « course » ; ici chaque barrière est un choix de couloir.
import { useEffect, useState } from 'react';
import { api, type Player, type Run, type Verdict, type RunResult, type ApiError } from './api/client';

type Screen =
  | { name: 'titre' }
  | { name: 'course'; run: Run; index: number; verdict: Verdict | null }
  | { name: 'fin'; result: RunResult };

const box: React.CSSProperties = { maxWidth: 560, margin: '40px auto', fontFamily: 'system-ui, sans-serif', lineHeight: 1.5 };
const lane: React.CSSProperties = { flex: 1, padding: '18px 0', fontSize: 22, fontWeight: 700, cursor: 'pointer' };

function ErrorBox({ error }: { error: ApiError | null }) {
  if (!error) return null;
  return <p role="alert" style={{ background: '#fde2e2', color: '#8a1111', padding: 12, borderRadius: 6 }}>{error.error.message} <small>({error.error.code})</small></p>;
}

export default function App() {
  const [player, setPlayer] = useState<Player | null>(null);
  const [screen, setScreen] = useState<Screen>({ name: 'titre' });
  const [error, setError] = useState<ApiError | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.GET('/api/session').then(({ data, error }) => (data ? setPlayer(data) : setError(error ?? null)));
  }, []);

  async function start() {
    setBusy(true); setError(null);
    const { data, error } = await api.POST('/api/runs', { body: { level: 1 } });
    setBusy(false);
    if (data) setScreen({ name: 'course', run: data, index: 0, verdict: null });
    else setError(error ?? null);
  }

  async function answer(laneIndex: number) {
    if (screen.name !== 'course' || screen.verdict) return;
    const q = screen.run.questions[screen.index];
    const { data, error } = await api.POST('/api/runs/{runId}/answers', {
      params: { path: { runId: screen.run.runId } }, body: { questionId: q.id, lane: laneIndex },
    });
    if (data) setScreen({ ...screen, verdict: data });
    else setError(error ?? null);
  }

  async function next() {
    if (screen.name !== 'course') return;
    setError(null);
    if (screen.index + 1 < screen.run.questions.length) return setScreen({ ...screen, index: screen.index + 1, verdict: null });
    setBusy(true);
    const { data, error } = await api.POST('/api/runs/{runId}/finish', { params: { path: { runId: screen.run.runId } } });
    setBusy(false);
    if (data) setScreen({ name: 'fin', result: data });
    else setError(error ?? null);
  }

  if (screen.name === 'titre') {
    return (
      <main style={box}>
        <h1>Status Kart</h1>
        {player && <p>Pilote : <b>{player.pseudo}</b> (niveau {player.level})</p>}
        <ErrorBox error={error} />
        {player && <button onClick={start} disabled={busy}>Jouer le niveau 1</button>}
      </main>
    );
  }

  if (screen.name === 'course') {
    const q = screen.run.questions[screen.index];
    const v = screen.verdict;
    return (
      <main style={box}>
        <p>{screen.run.circuit} · question {screen.index + 1}/{screen.run.questions.length}</p>
        <h2>{q.situation}</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          {q.lanes.map((code, i) => (
            <button key={i} style={{ ...lane, background: v ? (i === v.correctLane ? '#3ddc84' : '#ddd') : '#ffd23f' }} onClick={() => answer(i)} disabled={!!v}>{code}</button>
          ))}
        </div>
        {v && <p><b>{v.correct ? 'Boost !' : 'Carapace !'}</b> {v.code} {v.name} : {v.explanation}</p>}
        <ErrorBox error={error} />
        {(v || error) && <button onClick={next} disabled={busy}>{screen.index + 1 < screen.run.questions.length ? 'Barrière suivante' : 'Arrivée'}</button>}
      </main>
    );
  }

  const r = screen.result;
  return (
    <main style={box}>
      <h1>Niveau {r.level} terminé</h1>
      <p>Temps {(r.timeMs / 1000).toFixed(1)} s · bons couloirs {r.correctCount}/{r.total}</p>
      <p>Score <b>{r.score}</b> / 10 000 · +{r.xpGained} XP {r.sentToHub ? '(envoyé au hub)' : ''}</p>
      <button onClick={() => setScreen({ name: 'titre' })}>Rejouer</button>
    </main>
  );
}
