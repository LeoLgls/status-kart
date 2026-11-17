# Définition de « terminé »

Un ticket est terminé quand sa PR est fusionnée dans `main` et que tout ceci est vrai :

- **Testé** : au moins un test couvre le nouveau comportement, et le CI est vert (lint du contrat,
  typecheck, tests, build).
- **Relu** : une personne de l'autre sous-groupe a approuvé la PR (le front relit le back, et
  l'inverse ; les deux pour le contrat).
- **Contrat à jour** : si un échange front / back change, `contracts/openapi.yaml` change dans la
  même PR, Spectral passe et les types du front sont régénérés.
- **Nommé proprement** : branche `type/portée-résumé`, commits `type(portée): résumé`.
- **Le ticket est fermé** par la PR (`Closes #n` dans la description) et passe en « Done » sur le
  tableau du sprint.

Le modèle de PR (`.github/pull_request_template.md`) reprend cette liste à cocher.
