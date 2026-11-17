// Le moteur garde la physique du jeu : mêmes temps de référence que le back (apps/api/src/questions.js).
import { describe, expect, it } from 'vitest';
import { accelerate, buildTrack, LEVEL1, simulate, targetSpeed } from './engine';

describe('moteur de la course', () => {
  it('place 6 barrières, chacune avec sa zone verrouillée avant l\'objet', () => {
    const { gates, trackEnd } = buildTrack(LEVEL1);
    expect(gates).toHaveLength(6);
    for (const g of gates) expect(g.itemSeg).toBeGreaterThan(g.lockStart);
    expect(trackEnd).toBeGreaterThan(gates[5].itemSeg * 200);
  });

  it('un sans-faute et un tout-faux donnent les temps de référence du back', () => {
    expect(Math.abs(simulate(LEVEL1, true) - 58200)).toBeLessThan(100);
    expect(Math.abs(simulate(LEVEL1, false) - 76000)).toBeLessThan(100);
  });

  it('le turbo plafonne à 5 crans et la carapace ralentit', () => {
    expect(targetSpeed(LEVEL1, 9, false, false)).toBe(targetSpeed(LEVEL1, 5, false, false));
    expect(targetSpeed(LEVEL1, 0, false, true)).toBeLessThan(LEVEL1.speed);
    expect(accelerate(0, 3600, 0.1)).toBeCloseTo(260);
  });
});
