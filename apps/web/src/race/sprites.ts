// Images du niveau 1, servies depuis public/assets et chargées une seule fois.
export const ASSETS = {
  kart: '/assets/toad.png',          // 25 images de 50 × 51 : 0 de dos, 24 de face
  carapace: '/assets/carapace.png',
  buisson: '/assets/buisson.png',
  ciel: '/assets/fond-ciel.png',
  decor: '/assets/fond-decor.png',
  proche: '/assets/fond-proche.png',
  solRoute: '/assets/sol-route.png',  // coupe du bord de route (38 premières colonnes : asphalte)
  solHerbe: '/assets/sol-herbe.png',  // carreau d'herbe répété au-delà
} as const;

export type Sprites = Record<keyof typeof ASSETS, HTMLImageElement>;

let loading: Promise<Sprites> | null = null;

export function loadSprites(): Promise<Sprites> {
  loading ??= Promise.all(
    Object.entries(ASSETS).map(([name, src]) => new Promise<[string, HTMLImageElement]>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve([name, img]);
      img.onerror = () => reject(new Error(`Image introuvable : ${src}`));
      img.src = src;
    })),
  ).then((list) => Object.fromEntries(list) as Sprites);
  return loading;
}
