// La course en canvas. Le moteur tourne hors du state React ; ce composant ne fait que le brancher.
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { createRace, H, W, type RaceEvents, type RaceHandle } from './engine';
import { loadSprites } from './sprites';

type Props = Omit<RaceEvents, 'lanes'> & {
  lanes: string[][];
  // Bon couloir de chaque barrière, dès que le back l'a corrigée (null avant).
  verdicts: (number | null)[];
};

// Le parent peut changer de couloir (boutons tactiles) avec ref.current.move(-1 | 1).
export const Race = forwardRef<Pick<RaceHandle, 'move'>, Props>(function Race({ lanes, verdicts, ...events }, ref) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const race = useRef<RaceHandle | null>(null);
  const handlers = useRef(events);
  handlers.current = events;

  useImperativeHandle(ref, () => ({ move: (d) => race.current?.move(d) }), []);

  useEffect(() => {
    let stopped = false;
    loadSprites().then((sprites) => {
      if (stopped || !canvas.current) return;
      race.current = createRace(canvas.current, sprites, {
        lanes,
        onCount: (label) => handlers.current.onCount?.(label),
        onTick: (kmh, s) => handlers.current.onTick?.(kmh, s),
        onLane: (lane) => handlers.current.onLane?.(lane),
        onQuestion: (i) => handlers.current.onQuestion?.(i),
        onLock: (i, lane) => handlers.current.onLock?.(i, lane),
        onResolve: (i, ok, combo, lost) => handlers.current.onResolve?.(i, ok, combo, lost),
        onFinish: (ms) => handlers.current.onFinish?.(ms),
      });
    });
    return () => { stopped = true; race.current?.destroy(); race.current = null; };
  }, [lanes]);

  useEffect(() => {
    verdicts.forEach((lane, i) => { if (lane !== null) race.current?.verdict(i, lane); });
  }, [verdicts]);

  return (
    <canvas
      ref={canvas}
      width={W}
      height={H}
      aria-label="Piste de course vue de derrière le kart"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', imageRendering: 'pixelated' }}
    />
  );
});
