# Status Kart

Une course de kart en pixel art pour apprendre les codes de statut HTTP. Une situation s'affiche,
chacun des trois couloirs propose un code, et il faut être dans le bon avant la barrière.

## Notion du cours

Les codes de statut HTTP, qu'un contrat d'API doit fixer entre le front et le back. Le jeu fait
travailler les familles (2xx, 3xx, 4xx, 5xx) et les codes qu'on confond souvent : 401/403,
400/404, 200/201/204, 409/412.

## Mécanique

Le kart avance tout seul, le joueur change seulement de couloir. Juste avant la barrière, le
couloir se verrouille.

- Bon couloir : boost et un cran de turbo, jusqu'à 5.
- Mauvais couloir : carapace, tête-à-queue, et le turbo retombe à zéro.

Le verdict reste 2,5 secondes à l'écran avec une courte explication du bon code.

## Niveaux

Trois niveaux de six questions, chacun sur un circuit différent.

D'un niveau à l'autre, le kart va plus vite, donc il reste moins de temps pour lire, et les
mauvais codes ressemblent davantage au bon.

## Score

Le score d'un niveau dépend du temps mis pour le finir, entre 0 et 10 000 :

```
score = 10 000 × (temps tout faux − temps du joueur) / (temps tout faux − temps parfait)
```

Six bonnes réponses donnent 10 000, six erreurs donnent 0. À la fin de chaque niveau, le back
envoie le score au hub.

**scoreMax : 10 000** (par niveau)
