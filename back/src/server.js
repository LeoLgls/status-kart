// Back de Status Kart : implémente contracts/openapi.yaml et seul à parler au hub.
import express from 'express';
import { randomBytes } from 'node:crypto';
import { getMe, postScore, HubError } from './hub.js';
import { LEVELS, NAMES, shuffle } from './questions.js';
import { manifest, validateManifest } from './manifest.js';

const app = express();
app.use(express.json());

const fail = (res, status, code, message) => res.status(status).json({ error: { code, message } });

// Le manifeste doit respecter le schéma du hub : on refuse de démarrer sinon.
const manifestErrors = validateManifest();
if (manifestErrors.length) throw new Error(`Manifeste invalide : ${manifestErrors.join(', ')}`);
app.get('/fsq-manifest.json', (req, res) => res.json(manifest));

// Le fsq_token arrive dans Authorization: Bearer et n'est renvoyé qu'au hub.
const tokenOf = (req) => (req.get('Authorization') ?? '').replace(/^Bearer\s+/i, '') || null;
const requireToken = (req, res, next) => {
  req.token = tokenOf(req);
  if (!req.token) return fail(res, 401, 'INVALID_TOKEN', 'Jeton absent : relance le jeu depuis le hub');
  next();
};
const hubFailure = (res, err) => {
  if (err instanceof HubError && err.status === 401) return fail(res, 401, 'INVALID_TOKEN', 'Le jeton a expiré : relance le jeu depuis le hub');
  console.error('Hub :', err.status, err.code, err.message);
  return fail(res, 502, 'HUB_UNAVAILABLE', 'Le hub ne répond pas, réessaie dans un instant');
};

// Niveaux en cours (en mémoire pour l'instant ; SQLite ensuite, cf. ADR 0001).
const runs = new Map();

// GET /api/session (getSession)
app.get('/api/session', requireToken, async (req, res) => {
  try {
    res.json(await getMe(req.token));
  } catch (err) {
    hubFailure(res, err);
  }
});

// POST /api/runs (startRun) : six questions sans les réponses
app.post('/api/runs', requireToken, (req, res) => {
  const { level, ...rest } = req.body ?? {};
  if (!Number.isInteger(level) || level < 1 || level > 4 || Object.keys(rest).length) {
    return fail(res, 422, 'VALIDATION_ERROR', 'level : entier entre 1 et 4 attendu');
  }
  const cfg = LEVELS[level];
  if (!cfg) return fail(res, 422, 'VALIDATION_ERROR', `Le niveau ${level} n'est pas encore disponible`);
  const runId = `r_${randomBytes(3).toString('hex')}`;
  const questions = shuffle(cfg.bank).slice(0, 6).map((q, i) => {
    const lanes = shuffle([q.a, ...q.o]);
    return { id: `q_${i + 1}`, situation: q.s, lanes, answer: lanes.indexOf(q.a), code: q.a, explanation: q.e };
  });
  runs.set(runId, { token: req.token, level, startedAt: Date.now(), questions, answers: new Map(), finished: false });
  res.status(201).json({
    runId, level, circuit: cfg.circuit,
    questions: questions.map(({ id, situation, lanes }) => ({ id, situation, lanes })),
  });
});

const findRun = (req, res) => {
  const run = runs.get(req.params.runId);
  if (!run || run.token !== req.token) { fail(res, 404, 'RUN_NOT_FOUND', 'Aucun niveau en cours avec cet identifiant'); return null; }
  return run;
};

// POST /api/runs/:runId/answers (answerQuestion)
app.post('/api/runs/:runId/answers', requireToken, (req, res) => {
  const run = findRun(req, res);
  if (!run) return;
  const { questionId, lane, ...rest } = req.body ?? {};
  const q = run.questions.find((x) => x.id === questionId);
  if (!q || !Number.isInteger(lane) || lane < 0 || lane > 2 || Object.keys(rest).length) {
    return fail(res, 422, 'VALIDATION_ERROR', 'questionId connu et lane entier entre 0 et 2 attendus');
  }
  if (run.answers.has(questionId)) return fail(res, 409, 'ALREADY_ANSWERED', `La question ${questionId} a déjà été corrigée`);
  run.answers.set(questionId, lane);
  res.json({ correct: lane === q.answer, correctLane: q.answer, code: q.code, name: NAMES[q.code], explanation: q.explanation });
});

// POST /api/runs/:runId/finish (finishRun) : score calculé ici, puis envoyé au hub
app.post('/api/runs/:runId/finish', requireToken, async (req, res) => {
  const run = findRun(req, res);
  if (!run) return;
  const missing = run.questions.length - run.answers.size;
  if (run.finished || missing > 0) {
    return fail(res, 409, 'RUN_NOT_FINISHABLE', run.finished ? 'Ce niveau est déjà terminé' : `Il reste ${missing} questions sans réponse`);
  }
  const cfg = LEVELS[run.level];
  const timeMs = Date.now() - run.startedAt;
  const correctCount = run.questions.filter((q) => run.answers.get(q.id) === q.answer).length;
  const ratio = (cfg.allWrongMs - timeMs) / (cfg.allWrongMs - cfg.perfectMs);
  const score = Math.round(10000 * Math.max(0, Math.min(1, ratio)));
  try {
    const hub = await postScore(run.token, { level: run.level, score, durationMs: timeMs });
    run.finished = true;
    res.json({ level: run.level, correctCount, total: run.questions.length, timeMs, score, xpGained: hub.xpGained, sentToHub: hub.accepted });
  } catch (err) {
    hubFailure(res, err);
  }
});

const port = Number(process.env.PORT ?? 4000);
app.listen(port, () => console.log(`Back Status Kart sur http://localhost:${port} (hub : ${process.env.HUB_URL ?? 'http://localhost:4010'})`));
