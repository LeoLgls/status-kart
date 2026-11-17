// @vitest-environment jsdom
// Choix des opérations simulées avec VITE_MOCK.
import { describe, expect, it, vi } from 'vitest';

vi.mock('msw/browser', () => ({ setupWorker: () => ({}) }));
const { mockedOperations } = await import('./browser');

describe('mocks opération par opération', () => {
  it('sans réglage, les quatre opérations sont simulées', () => {
    expect(mockedOperations(undefined)).toEqual(['getSession', 'startRun', 'answerQuestion', 'finishRun']);
  });

  it('une liste ne garde que ces opérations', () => {
    expect(mockedOperations('startRun, finishRun')).toEqual(['startRun', 'finishRun']);
  });

  it('un nom inconnu est ignoré', () => {
    expect(mockedOperations('getSession,nimporte')).toEqual(['getSession']);
  });
});
