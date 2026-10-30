// Client typé à partir du contrat : une route ou un champ renommé dans openapi.yaml casse le build.
import createClient from 'openapi-fetch';
import type { paths, components } from './schema';

export type Player = components['schemas']['Player'];
export type Run = components['schemas']['Run'];
export type Verdict = components['schemas']['Verdict'];
export type RunResult = components['schemas']['RunResult'];
export type ApiError = components['schemas']['Error'];

// Le fsq_token est lu une fois dans l'URL puis retiré de la barre d'adresse.
function readToken(): string | null {
  const url = new URL(window.location.href);
  const token = url.searchParams.get('fsq_token');
  if (token) {
    sessionStorage.setItem('fsq_token', token);
    url.searchParams.delete('fsq_token');
    window.history.replaceState(null, '', url);
  }
  return token ?? sessionStorage.getItem('fsq_token');
}

const token = readToken();
export const api = createClient<paths>({ headers: token ? { Authorization: `Bearer ${token}` } : {} });
