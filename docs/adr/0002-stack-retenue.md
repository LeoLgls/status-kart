# ADR 0002 : stack retenue

Statut : acceptée — remplace l'ADR 0001 (stack provisoire)

## Contexte

L'ADR 0001 fixait une stack provisoire en séance 1. Depuis, le contrat, les mocks des deux côtés,
les tests et le CI tournent sur cette stack. Le sprint 1 doit rendre le niveau 1 jouable de bout en
bout : la course en pseudo-3D du prototype passe dans le front et parle au vrai back.

## Grille

Note de 1 (mauvais) à 3 (bon) pour chaque critère.

**Front**

| Critère | React + Vite | Canvas seul | Phaser | Next.js |
|---|---|---|---|---|
| Course pseudo-3D (canvas) | 3 | 3 | 1 | 3 |
| Écrans autour (menus, questions, résultats) | 3 | 1 | 2 | 3 |
| Types générés du contrat, MSW | 3 | 2 | 2 | 3 |
| Tests et build dans le CI | 3 | 2 | 2 | 2 |
| L'équipe connaît déjà | 3 | 2 | 1 | 2 |
| Taille et complexité pour un mini-jeu | 3 | 3 | 2 | 1 |
| **Total** | **18** | 13 | 10 | 14 |

**Back**

| Critère | Express | Fastify | NestJS |
|---|---|---|---|
| Implémenter les 4 opérations du contrat | 3 | 3 | 3 |
| Appels au hub, `X-Game-Key` côté serveur | 3 | 3 | 3 |
| Tests sans dépendance (`node:test`) | 3 | 3 | 2 |
| L'équipe connaît déjà | 3 | 1 | 1 |
| Taille et complexité | 3 | 3 | 1 |
| **Total** | **15** | 13 | 10 |

**Stockage**

| Critère | SQLite | PostgreSQL | En mémoire |
|---|---|---|---|
| Survit à un redémarrage | 3 | 3 | 1 |
| Rien à installer en local ni dans le CI | 3 | 1 | 3 |
| Empêche d'envoyer deux fois un score | 3 | 3 | 2 |
| Déploiement | 2 | 2 | 3 |
| **Total** | **11** | 9 | 9 |

## Décision

- **Front** : React + TypeScript avec Vite. La course est un composant canvas porté depuis
  `prototype/status-kart.html`, sa boucle reste hors du state React. Types générés du contrat
  (`openapi-typescript`), client `openapi-fetch`, MSW en développement, tests avec Vitest.
- **Back** : Node.js + Express (JavaScript, modules ES), tests avec `node:test`.
- **Stockage** : SQLite, pour les parties et les scores déjà envoyés au hub.
- **Un seul service** : le back sert le build du front, sur la même origine que l'API.

## Conséquences

- Pas de changement d'outil : tout le travail des séances 2 et 3 est gardé.
- Deux tickets du sprint 1 découlent de cette décision : SQLite dans `apps/api` (les parties sont
  en mémoire aujourd'hui) et le build du front servi par Express.
- La boucle de jeu tourne dans `requestAnimationFrame` et ne passe dans React que les événements
  (barrière, verdict, arrivée), sinon React re-rendrait 60 fois par seconde.
- L'hébergeur doit garder le fichier SQLite entre deux déploiements.
