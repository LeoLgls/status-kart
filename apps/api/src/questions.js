// Questions du niveau 1 : la situation, le bon code, deux leurres, l'explication du verdict.
export const NAMES = {
  200: 'OK', 301: 'Moved Permanently', 400: 'Bad Request', 401: 'Unauthorized',
  404: 'Not Found', 500: 'Internal Server Error', 503: 'Service Unavailable',
};

export const LEVELS = {
  1: {
    circuit: 'PRAIRIE',
    perfectMs: 58200,     // course d'un sans-faute, simulée avec la physique du prototype
    allWrongMs: 76000,    // course d'un parcours tout faux
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

// Le chrono du back part à startRun, donc avant le compte à rebours du front (3, 2, 1, GO : 3,5 s).
export const COUNTDOWN_MS = 3500;

// Score de 0 à 10 000 selon le temps mesuré par le back, compte à rebours retiré.
export const scoreFor = (level, timeMs) => {
  const { perfectMs, allWrongMs } = LEVELS[level];
  const ratio = (allWrongMs - (timeMs - COUNTDOWN_MS)) / (allWrongMs - perfectMs);
  return Math.round(10000 * Math.max(0, Math.min(1, ratio)));
};

export const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
};
