// État serveur : chaque opération du contrat passe par le cache de TanStack Query (ADR 0003).
// Rien de l'API ne va dans un store global.
import { useMutation, useQuery } from '@tanstack/react-query';
import { api, type ApiError } from './client';

// openapi-fetch renvoie { data, error } : on lève l'erreur du contrat pour que TanStack la range dans `error`.
function unwrap<T>({ data, error }: { data?: T; error?: ApiError }): T {
  if (error) throw error;
  return data as T;
}

export const isApiError = (e: unknown): e is ApiError =>
  typeof e === 'object' && e !== null && 'error' in e && typeof (e as ApiError).error?.code === 'string';

// getSession : le pilote, lu une fois et gardé en cache.
export const useSession = () => useQuery({
  queryKey: ['session'],
  queryFn: async () => unwrap(await api.GET('/api/session')),
  staleTime: Infinity,
  retry: false,
});

// startRun : six questions sans les réponses.
export const useStartRun = () => useMutation({
  mutationFn: async (level: number) => unwrap(await api.POST('/api/runs', { body: { level } })),
});

// answerQuestion : le verdict d'une barrière.
export const useAnswer = () => useMutation({
  mutationFn: async (v: { runId: string; questionId: string; lane: number }) => unwrap(await api.POST('/api/runs/{runId}/answers', {
    params: { path: { runId: v.runId } }, body: { questionId: v.questionId, lane: v.lane },
  })),
});

// finishRun : score calculé par le back et envoyé au hub.
export const useFinish = () => useMutation({
  mutationFn: async (runId: string) => unwrap(await api.POST('/api/runs/{runId}/finish', { params: { path: { runId } } })),
});
