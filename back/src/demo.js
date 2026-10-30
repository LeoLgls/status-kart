// npm run demo : joue un niveau contre le back (lui-même branché sur le hub simulé par Prism).
const BACK = process.env.BACK_URL ?? 'http://localhost:4000';
const headers = { Authorization: 'Bearer jeton.de.demo', 'Content-Type': 'application/json' };
const show = (label, status, body) => console.log(`\n${label} → ${status}\n${JSON.stringify(body, null, 2)}`);
const api = async (method, path, body) => {
  const res = await fetch(`${BACK}${path}`, { method, headers, body: body && JSON.stringify(body) });
  return [res.status, await res.json()];
};

show('GET /fsq-manifest.json', ...(await api('GET', '/fsq-manifest.json')));
show('GET /api/session (le back appelle /api/v1/me)', ...(await api('GET', '/api/session')));
const [status, run] = await api('POST', '/api/runs', { level: 1 });
show('POST /api/runs', status, { runId: run.runId, circuit: run.circuit, premiereQuestion: run.questions[0] });
for (const q of run.questions) await api('POST', `/api/runs/${run.runId}/answers`, { questionId: q.id, lane: 1 });
console.log('\n6 réponses envoyées (couloir du centre à chaque fois)');
show('POST /api/runs/:id/finish (le back appelle /api/v1/scores)', ...(await api('POST', `/api/runs/${run.runId}/finish`)));
show('Erreur : level en texte', ...(await api('POST', '/api/runs', { level: '1' })));
