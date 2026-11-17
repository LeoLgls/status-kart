// Score du niveau 1 : temps mesuré par le back, de startRun à finishRun.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { COUNTDOWN_MS, LEVELS, scoreFor } from '../src/questions.js';

const { perfectMs, allWrongMs } = LEVELS[1];

test('un sans-faute donne 10 000, compte à rebours compris', () => {
  assert.equal(scoreFor(1, COUNTDOWN_MS + perfectMs), 10000);
});

test('un parcours tout faux donne 0', () => {
  assert.equal(scoreFor(1, COUNTDOWN_MS + allWrongMs), 0);
});

test('à mi-chemin entre les deux temps : 5 000', () => {
  assert.equal(scoreFor(1, COUNTDOWN_MS + (perfectMs + allWrongMs) / 2), 5000);
});

test('le score reste entre 0 et 10 000', () => {
  assert.equal(scoreFor(1, 1000), 10000);
  assert.equal(scoreFor(1, 10 * 60 * 1000), 0);
});
