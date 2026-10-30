// Les deux seuls appels au hub prévus par integration-v1.yaml.
const HUB_URL = process.env.HUB_URL ?? 'http://localhost:4010';
export const GAME_ID = 'status-kart';

export class HubError extends Error {
  constructor(status, body) {
    super(body?.error?.message ?? `Le hub a répondu ${status}`);
    this.status = status;
    this.code = body?.error?.code;
  }
}

async function call(path, init) {
  let res;
  try {
    res = await fetch(`${HUB_URL}${path}`, init);
  } catch {
    throw new HubError(0, null);           // hub injoignable
  }
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new HubError(res.status, body);
  return body;
}

// GET /api/v1/me : qui joue
export const getMe = (token) => call('/api/v1/me', { headers: { Authorization: `Bearer ${token}` } });

// POST /api/v1/scores : le score d'un niveau, avec le jeton et la clé du jeu
export const postScore = (token, { level, score, durationMs }) => call('/api/v1/scores', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token}`,
    'X-Game-Key': process.env.FSQ_GAME_KEY ?? '',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ gameId: GAME_ID, level, score, durationMs }),
});
