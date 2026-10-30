// Handlers MSW : pour l'instant seulement la session (écran titre).
// Les autres écrans du niveau 1 et leurs cas d'erreur arrivent avec la partie de Léo.
import { http, HttpResponse, type PathParams, type DefaultBodyType } from 'msw';
import type { components } from '../api/schema';

type S = components['schemas'];

export const handlers = [
  http.get<PathParams, DefaultBodyType, S['Player'] | S['Error']>('/api/session', () =>
    HttpResponse.json<S['Player']>({ playerId: 'p_42', pseudo: 'Neo', level: 7 })),
];
