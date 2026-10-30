// Questions du niveau 1 : la situation, le bon code, deux leurres, l'explication du verdict.
export const NAMES = {
  200: 'OK', 301: 'Moved Permanently', 400: 'Bad Request', 401: 'Unauthorized',
  404: 'Not Found', 500: 'Internal Server Error', 503: 'Service Unavailable',
};

export const LEVELS = {
  1: {
    circuit: 'PRAIRIE',
    perfectMs: 58200,     // temps d'un sans-faute
    allWrongMs: 76000,    // temps d'un parcours tout faux
    bank: [
      { s: 'GET /joueurs/42 : le joueur existe, on renvoie sa fiche.', a: '200', o: ['404', '500'], e: 'tout s’est bien passé, la ressource est renvoyée.' },
      { s: 'GET /joueurs/999 : aucun joueur avec cet identifiant.', a: '404', o: ['200', '500'], e: 'la ressource demandée n’existe pas.' },
      { s: 'Le serveur lève une exception que personne n’a gérée.', a: '500', o: ['404', '400'], e: 'erreur côté serveur, le client n’y est pour rien.' },
      { s: 'GET /classement sans aucun jeton de connexion.', a: '401', o: ['200', '500'], e: 'il faut s’authentifier d’abord.' },
      { s: 'La page /regles a déménagé pour de bon vers /aide.', a: '301', o: ['404', '200'], e: 'redirection permanente vers la nouvelle adresse.' },
      { s: 'La base de données est en maintenance, reviens plus tard.', a: '503', o: ['404', '400'], e: 'service temporairement indisponible.' },
      { s: 'GET /logo.png : l’image est bien envoyée.', a: '200', o: ['301', '500'], e: 'succès, le fichier est renvoyé.' },
      { s: 'GET /quetes/xyz : rien n’existe à cette adresse.', a: '404', o: ['500', '301'], e: 'aucune ressource à cette adresse.' },
    ],
  },
};

export const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
};
