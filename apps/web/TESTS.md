# Tests du front (`apps/web`)

Trace des tests et de leurs résultats.

## Lancer

```bash
cd apps/web
npm install
npm run typecheck   # tsc --noEmit
npm test            # vitest run
npm run build       # vite build
```

## Ce qui est testé

`src/api.test.ts` : le client typé du contrat (`openapi-fetch` + `schema.d.ts`) appelle les handlers
MSW du niveau 1 côté Node (`msw/node`, environnement `jsdom`).

| Écran | Test | Attendu |
|---|---|---|
| Titre | renvoie le joueur de la session | `GET /api/session` → `playerId` au format `p_<n>` |
| Course | démarre un niveau de six questions à trois couloirs, sans les réponses | `POST /api/runs` → 201, 6 questions, 3 couloirs, pas de champ `answer` |
| Course | refuse un niveau envoyé en texte | `POST /api/runs` avec `level: "1"` → 422 `VALIDATION_ERROR` |
| Course | corrige un couloir puis refuse une deuxième réponse | 1re réponse correcte, 2e → 409 `ALREADY_ANSWERED` |
| Résultats | renvoie un score entre 0 et 10 000 | `POST /api/runs/{runId}/finish` → `0 ≤ score ≤ 10000`, `total = 6` |

## Résultats

### 2026-10-30 — branche `test/web-premiers-tests`

Environnement : Windows, Node v24.22.1, Vitest 3.2.7, Vite 6.4.5.

**Typecheck** : OK, aucune erreur.

**Tests** : 5/5 réussis.

```text
 ✓ src/api.test.ts (5 tests) 885ms
   ✓ écran titre (1)
     ✓ renvoie le joueur de la session  331ms
   ✓ écran course (3)
     ✓ démarre un niveau de six questions à trois couloirs, sans les réponses 8ms
     ✓ refuse un niveau envoyé en texte (422 VALIDATION_ERROR) 3ms
     ✓ corrige un couloir puis refuse une deuxième réponse (409 ALREADY_ANSWERED) 12ms
   ✓ écran résultats (1)
     ✓ renvoie un score entre 0 et 10 000  527ms

 Test Files  1 passed (1)
      Tests  5 passed (5)
   Duration  2.43s
```

**Build** : OK.

```text
✓ 28 modules transformed.
dist/index.html                  0.33 kB │ gzip:  0.24 kB
dist/assets/index-Dhq7USlz.js  153.37 kB │ gzip: 49.88 kB
```
