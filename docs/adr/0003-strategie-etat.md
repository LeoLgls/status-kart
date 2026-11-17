# ADR 0003 : stratégie d'état

Statut : proposée

## Contexte

Le niveau 1 doit être jouable de bout en bout sur le vrai back. Aujourd'hui `App.tsx` garde tout dans
des `useState`, réponses de l'API comprises. Il faut décider où vit chaque donnée avant d'ajouter la
course en canvas et les autres écrans.

## Classement des données

| Donnée | Type | Où elle vit |
|---|---|---|
| Pilote (`getSession`) | serveur | cache de requêtes |
| Partie et ses 6 questions (`startRun`) | serveur | cache de requêtes |
| Verdict d'une barrière (`answerQuestion`) | serveur | cache de requêtes |
| Résultat du niveau (`finishRun`) | serveur | cache de requêtes |
| `fsq_token` | URL | lu dans `?fsq_token=`, retiré de l'adresse, gardé en `sessionStorage` |
| Scénario de mock (`?scenario=`) | URL | lu au démarrage des mocks |
| Son coupé, pilote choisi | globale | contexte React, gardé en `localStorage` |
| Écran affiché (titre, course, fin) | locale | `useState` dans `App` |
| Barrière en cours, couloir choisi | locale | `useState` dans la course |
| Position, vitesse, turbo, boost, carapace | locale | variables de la boucle `requestAnimationFrame`, hors state React |

## Décision

- **État serveur : TanStack Query.** `useQuery` pour `getSession`, `useMutation` pour `startRun`,
  `answerQuestion` et `finishRun`. Rien de l'API ne va dans un store global : le cache est la seule
  copie.
- **État global : un contexte React** pour les réglages du joueur (son, pilote). Pas de Redux ni de
  Zustand : il n'y a presque rien à partager.
- **État local : `useState`** pour les écrans et la barrière en cours. La physique de la course
  reste dans la boucle d'animation, pour ne pas re-rendre React à chaque image.
- **URL :** seulement le jeton à l'arrivée depuis le hub, et le scénario des mocks en dev.
- **Pas de temps réel :** une partie se joue seul, chaque barrière est un aller-retour HTTP. Pas de
  messages ni de fonction `apply`.
- **Mocks :** MSW est retiré opération par opération dès que le back répond : `getSession`,
  `startRun`, `answerQuestion`, puis `finishRun`.

## Conséquences

- Ajouter `@tanstack/react-query` au front et un `QueryClientProvider` dans `main.tsx`.
- Les erreurs 401, 409 et 502 du contrat arrivent par `error` de la requête ou de la mutation.
- Un ticket par opération pour passer du mock au vrai back.
