# Vitesse et score

## Vitesse

Pas d'accélérateur ni de frein : seules les réponses changent la vitesse.

- Vitesse de base : 120 km/h au niveau 1, 147 au niveau 2, 173 au niveau 3.
- Turbo : +7 % par bonne réponse, 5 crans au maximum, remis à zéro à chaque niveau.
- Boost : ×1,35 pendant 1 seconde après une bonne réponse.
- Carapace : tête-à-queue d'environ 1 seconde, et le turbo retombe à zéro.

## Score

Chaque niveau rapporte de 0 à 10 000 selon le temps :

```
score = 10 000 × (temps tout faux − temps du joueur) / (temps tout faux − temps parfait)
```

Le jeu simule les deux temps de référence au début du niveau :

| Niveau | Temps parfait | Temps tout faux |
|---|---|---|
| 1 | 58,2 s | 76,0 s |
| 2 | 54,6 s | 71,9 s |
| 3 | 48,3 s | 64,6 s |

Dans un niveau, les questions sont toutes à la même distance. Une erreur en début de niveau coûte
plus cher qu'à la fin, car le turbo est perdu plus tôt.

**scoreMax : 10 000**, car le hub reçoit un score par niveau.
