// @vitest-environment jsdom
// Le client typé contre les handlers MSW du niveau 1 : chaque réponse simulée respecte le contrat.
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { setupServer } from 'msw/node';
import createClient from 'openapi-fetch';
import type { paths } from './api/schema';
import { handlers } from './mocks/handlers';

const server = setupServer(...handlers);
// fetch est lu au moment de l'appel : MSW le remplace dans beforeAll, après la création du client
const api = createClient<paths>({ baseUrl: window.location.origin, fetch: (req) => globalThis.fetch(req) });

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('écran titre', () => {
  it('renvoie le joueur de la session', async () => {
    const { data, error } = await api.GET('/api/session');
    expect(error).toBeUndefined();
    expect(data?.playerId).toMatch(/^p_[0-9]+$/);
  });
});

describe('écran course', () => {
  it('démarre un niveau de six questions à trois couloirs, sans les réponses', async () => {
    const { data, response } = await api.POST('/api/runs', { body: { level: 1 } });
    expect(response.status).toBe(201);
    expect(data?.questions).toHaveLength(6);
    for (const q of data!.questions) {
      expect(q.lanes).toHaveLength(3);
      expect(q).not.toHaveProperty('answer');
    }
  });

  it('refuse un niveau envoyé en texte (422 VALIDATION_ERROR)', async () => {
    // le contrat attend un entier : on force le mauvais type pour vérifier l'erreur
    const { error, response } = await api.POST('/api/runs', { body: { level: '1' as unknown as number } });
    expect(response.status).toBe(422);
    expect(error?.error.code).toBe('VALIDATION_ERROR');
  });

  it('corrige un couloir puis refuse une deuxième réponse (409 ALREADY_ANSWERED)', async () => {
    const { data: run } = await api.POST('/api/runs', { body: { level: 1 } });
    const path = { params: { path: { runId: run!.runId } }, body: { questionId: 'q_1', lane: 1 } };
    const first = await api.POST('/api/runs/{runId}/answers', path);
    expect(first.data?.correct).toBe(true);
    const second = await api.POST('/api/runs/{runId}/answers', path);
    expect(second.response.status).toBe(409);
    expect(second.error?.error.code).toBe('ALREADY_ANSWERED');
  });
});

describe('écran résultats', () => {
  it('renvoie un score entre 0 et 10 000', async () => {
    const { data: run } = await api.POST('/api/runs', { body: { level: 1 } });
    for (const q of run!.questions) {
      await api.POST('/api/runs/{runId}/answers', { params: { path: { runId: run!.runId } }, body: { questionId: q.id, lane: 0 } });
    }
    const { data } = await api.POST('/api/runs/{runId}/finish', { params: { path: { runId: run!.runId } } });
    expect(data?.score).toBeGreaterThanOrEqual(0);
    expect(data?.score).toBeLessThanOrEqual(10000);
    expect(data?.total).toBe(6);
  });
});
