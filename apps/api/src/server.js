// Démarre le back de Status Kart (les routes sont dans app.js).
import app from './app.js';

const port = Number(process.env.PORT ?? 4000);
app.listen(port, () => console.log(`Back Status Kart sur http://localhost:${port} (hub : ${process.env.HUB_URL ?? 'http://localhost:4010'})`));
