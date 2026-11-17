// Routes du niveau 1 contre un hub simulé qui enregistre ce que le back lui envoie.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';

const sent = [];
const hub = createServer((req, res) => {
  let body = '';
  req.on('data', (c) => { body += c; });
  req.on('end', () => {
    sent.push({ path: req.url, headers: req.headers, body: body && JSON.parse(body) });
    res.setHeader('Content-Type', 'application/json');
    if (req.headers.authorization !== 'Bearer bon-jeton') {
      res.statusCode = 401;
      return res.end(JSON.stringify({ error: { code: 'INVALID_TOKEN', message: 'jeton invalide' } }));
    }
    if (req.url === '/api/v1/me') return res.end(JSON.stringify({ playerId: 'p_42', pseudo: 'Neo', level: 7 }));
    res.statusCode = 201;
    res.end(JSON.stringify({ accepted: true, xpGained: 120 }));
  });
});

let back, base;
const call = (method, path, body, token = 'bon-jeton') => fetch(`${base}${path}`, {
  method,
  headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) },
  body: body && JSON.stringify(body),
});

before(async () => {
  await new Promise((r) => hub.listen(0, r));
  process.env.HUB_URL = `http://127.0.0.1:${hub.address().port}`;
  process.env.FSQ_GAME_KEY = 'cle-de-test';
  const { default: app } = await import('../src/app.js');   // après HUB_URL : hub.js le lit au chargement
  back = await new Promise((r) => { const s = app.listen(0, () => r(s)); });
  base = `http://127.0.0.1:${back.address().port}`;
});
after(() => { back.close(); hub.close(); });

test('GET /fsq-manifest.json sert le manifeste', async () => {
  const res = await call('GET', '/fsq-manifest.json');
  assert.equal(res.status, 200);
  assert.equal((await res.json()).id, 'status-kart');
});

test('GET /api/session sans jeton : 401 INVALID_TOKEN', async () => {
  const res = await call('GET', '/api/session', null, null);
  assert.equal(res.status, 401);
  assert.equal((await res.json()).error.code, 'INVALID_TOKEN');
});

test('GET /api/session : le joueur vient de /api/v1/me', async () => {
  const res = await call('GET', '/api/session');
  assert.equal(res.status, 200);
  assert.equal((await res.json()).pseudo, 'Neo');
});

test('POST /api/runs refuse un niveau en texte : 422', async () => {
  const res = await call('POST', '/api/runs', { level: '1' });
  assert.equal(res.status, 422);
  assert.equal((await res.json()).error.code, 'VALIDATION_ERROR');
});

test('un niveau complet : questions sans réponses, 409 au double envoi, score envoyé au hub', async () => {
  const run = await (await call('POST', '/api/runs', { level: 1 })).json();
  assert.equal(run.questions.length, 6);
  assert.ok(run.questions.every((q) => !('answer' in q)), 'le front ne doit jamais recevoir la réponse');

  for (const q of run.questions) {
    const res = await call('POST', `/api/runs/${run.runId}/answers`, { questionId: q.id, lane: 0 });
    assert.equal(res.status, 200);
  }
  const again = await call('POST', `/api/runs/${run.runId}/answers`, { questionId: 'q_1', lane: 0 });
  assert.equal(again.status, 409);

  const res = await call('POST', `/api/runs/${run.runId}/finish`);
  assert.equal(res.status, 200);
  const result = await res.json();
  assert.ok(result.score >= 0 && result.score <= 10000);
  assert.equal(result.sentToHub, true);

  const score = sent.find((r) => r.path === '/api/v1/scores');
  assert.equal(score.headers['x-game-key'], 'cle-de-test');
  assert.deepEqual(Object.keys(score.body).sort(), ['durationMs', 'gameId', 'level', 'score']);
  assert.equal(score.body.gameId, 'status-kart');
});
