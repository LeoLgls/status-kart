# ADR 0001 : choix de la stack

Statut : provisoire

## Contexte

Le front doit afficher une course en pseudo-3D et quelques écrans autour. Le back doit garder la
`X-Game-Key`, calculer le score et appeler le hub. L'équipe a déjà utilisé React et Express sur
l'exercice du classement.

## Décision

- **Front** : React + TypeScript avec Vite. La course est dessinée dans un canvas. Les menus, la
  question et le HUD sont en React.
- **Back** : Node.js + Express.
- **Stockage** : SQLite, pour garder les parties et éviter d'envoyer deux fois le même score.
- Le back sert le build du front : un seul service à déployer.

## Alternatives

- Canvas sans framework : plus léger, mais tous les écrans seraient à coder à la main.
- Phaser : ne sait pas faire la route en pseudo-3D, il faudrait l'écrire quand même.
- Next.js : trop complet pour ce projet.
- Fastify : l'équipe connaît mieux Express.
- PostgreSQL : trop lourd pour trois tables.

## Conséquences

- L'équipe part sur des outils qu'elle maîtrise.
- La boucle de jeu doit rester en dehors du state React, sinon React re-rend 60 fois par seconde.
- L'hébergeur doit conserver le fichier SQLite.
