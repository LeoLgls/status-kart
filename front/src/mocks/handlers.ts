// Handlers MSW des écrans du niveau 1, construits sur les types du contrat.
// Un cas d'erreur par écran, choisi avec ?scenario=... dans l'URL :
//   jeton-expire      écran titre  : 401 INVALID_TOKEN
//   deja-repondu      écran course : 409 ALREADY_ANSWERED
//   hub-indisponible  écran fin    : 502 HUB_UNAVAILABLE
import { http, HttpResponse, delay, type PathParams, type DefaultBodyType } from 'msw';
import type { components } from '../api/schema';

type S = components['schemas'];
// Corps de réponse possibles d'un handler : le succès prévu par le contrat ou une erreur du contrat.
type Body<T> = T | S['Error'];
const scenario = new URLSearchParams(window.location.search).get('scenario');
const error = (status: number, code: S['Error']['error']['code'], message: string) =>
  HttpResponse.json<S['Error']>({ error: { code, message } }, { status });

const QUESTIONS = [
  { id: 'q_1', situation: 'GET /joueurs/42 : le joueur existe, on renvoie sa fiche.', lanes: ['404', '200', '500'], answer: 1, code: '200', name: 'OK', explanation: 'tout s’est bien passé, la ressource est renvoyée.' },
  { id: 'q_2', situation: 'GET /joueurs/999 : aucun joueur avec cet identifiant.', lanes: ['200', '500', '404'], answer: 2, code: '404', name: 'Not Found', explanation: 'la ressource demandée n’existe pas.' },
  { id: 'q_3', situation: 'Le serveur lève une exception que personne n’a gérée.', lanes: ['500', '404', '400'], answer: 0, code: '500', name: 'Internal Server Error', explanation: 'erreur côté serveur, le client n’y est pour rien.' },
  { id: 'q_4', situation: 'GET /classement sans aucun jeton de connexion.', lanes: ['200', '401', '500'], answer: 1, code: '401', name: 'Unauthorized', explanation: 'il faut s’authentifier d’abord.' },
  { id: 'q_5', situation: 'La page /regles a déménagé pour de bon vers /aide.', lanes: ['301', '404', '200'], answer: 0, code: '301', name: 'Moved Permanently', explanation: 'redirection permanente vers la nouvelle adresse.' },
  { id: 'q_6', situation: 'La base de données est en maintenance, reviens plus tard.', lanes: ['400', '404', '503'], answer: 2, code: '503', name: 'Service Unavailable', explanation: 'service temporairement indisponible.' },
];
const answered = new Map<string, number>();

export const handlers = [
  http.get<PathParams, DefaultBodyType, Body<S['Player']>>('/api/session', async () => {
    await delay(300);
    if (scenario === 'jeton-expire') return error(401, 'INVALID_TOKEN', 'Le jeton a expiré : relance le jeu depuis le hub');
    return HttpResponse.json<S['Player']>({ playerId: 'p_42', pseudo: 'Neo', level: 7 });
  }),

  http.post<PathParams, DefaultBodyType, Body<S['Run']>>('/api/runs', async ({ request }) => {
    const body = (await request.json()) as Partial<S['StartRunRequest']>;
    if (!Number.isInteger(body.level)) return error(422, 'VALIDATION_ERROR', 'level : entier entre 1 et 4 attendu');
    answered.clear();
    return HttpResponse.json<S['Run']>({
      runId: 'r_7f3a9c', level: 1, circuit: 'PRAIRIE',
      questions: QUESTIONS.map(({ id, situation, lanes }) => ({ id, situation, lanes })),
    }, { status: 201 });
  }),

  http.post<PathParams, DefaultBodyType, Body<S['Verdict']>>('/api/runs/:runId/answers', async ({ request }) => {
    const { questionId, lane } = (await request.json()) as S['AnswerRequest'];
    const q = QUESTIONS.find((x) => x.id === questionId);
    if (!q) return error(422, 'VALIDATION_ERROR', 'questionId inconnu');
    // Cas d'erreur de l'écran course : la 2e question est vue comme déjà corrigée (double envoi).
    if (answered.has(questionId) || (scenario === 'deja-repondu' && questionId === 'q_2')) {
      return error(409, 'ALREADY_ANSWERED', `La question ${questionId} a déjà été corrigée`);
    }
    answered.set(questionId, lane);
    return HttpResponse.json<S['Verdict']>({ correct: lane === q.answer, correctLane: q.answer, code: q.code, name: q.name, explanation: q.explanation });
  }),

  http.post<PathParams, DefaultBodyType, Body<S['RunResult']>>('/api/runs/:runId/finish', async () => {
    await delay(500);
    if (scenario === 'hub-indisponible') return error(502, 'HUB_UNAVAILABLE', 'Le hub ne répond pas, réessaie dans un instant');
    const correctCount = QUESTIONS.filter((q) => answered.get(q.id) === q.answer).length;
    const timeMs = 58200 + (6 - correctCount) * 2960;
    const score = Math.round(10000 * (76000 - timeMs) / (76000 - 58200));
    return HttpResponse.json<S['RunResult']>({ level: 1, correctCount, total: 6, timeMs, score, xpGained: Math.round(score * 0.012), sentToHub: true });
  }),
];
