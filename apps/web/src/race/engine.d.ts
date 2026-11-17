// Types du moteur de course (engine.js).
import type { Sprites } from './sprites';

export interface LevelConfig {
  speed: number;
  curve: number;
  approach: number;
  fill: number;
  arcs: [number, number][][];
}

export interface RaceEvents {
  lanes: string[][];
  onCount?: (label: string | null) => void;
  onTick?: (speedKmh: number, timeS: number) => void;
  onLane?: (lane: number) => void;
  onQuestion?: (index: number) => void;
  onLock?: (index: number, lane: number) => void;
  onResolve?: (index: number, correct: boolean, combo: number, lostTurbo: number) => void;
  onFinish?: (timeMs: number) => void;
}

export interface RaceHandle {
  verdict(index: number, correctLane: number): void;
  move(direction: -1 | 1): void;
  destroy(): void;
}

export const W: number;
export const H: number;
export const SEG: number;
export const PLAYER_Z: number;
export const COUNTDOWN_S: number;
export const VERDICT_S: number;
export const TURBO_MAX: number;
export const TURBO_STEP: number;
export const LEVEL1: LevelConfig;
export function targetSpeed(cfg: LevelConfig, combo: number, boosting: boolean, spinning: boolean): number;
export function accelerate(speed: number, target: number, dt: number): number;
export function buildTrack(cfg: LevelConfig, count?: number): {
  segments: unknown[];
  gates: { blockStart: number; lockStart: number; itemSeg: number }[];
  finish: number;
  trackEnd: number;
};
export function simulate(cfg: LevelConfig, allRight: boolean): number;
export function createRace(canvas: HTMLCanvasElement, sprites: Sprites, events: RaceEvents): RaceHandle;
