// Écran titre branché sur le contrat (GET /api/session). Les écrans course et fin arrivent
// avec la partie de Léo.
import { useEffect, useState } from 'react';
import { api, type Player, type ApiError } from './api/client';

export default function App() {
  const [player, setPlayer] = useState<Player | null>(null);
  const [error, setError] = useState<ApiError | null>(null);

  useEffect(() => {
    api.GET('/api/session').then(({ data, error }) => (data ? setPlayer(data) : setError(error ?? null)));
  }, []);

  return (
    <main style={{ maxWidth: 560, margin: '40px auto', fontFamily: 'system-ui, sans-serif' }}>
      <h1>Status Kart</h1>
      {player && <p>Pilote : <b>{player.pseudo}</b> (niveau {player.level})</p>}
      {error && <p role="alert">{error.error.message} ({error.error.code})</p>}
    </main>
  );
}
