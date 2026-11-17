// Le back sert le build du front sans gêner /api ni le manifeste.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const dist = mkdtempSync(join(tmpdir(), 'status-kart-dist-'));
let back, base;

before(async () => {
  writeFileSync(join(dist, 'index.html'), '<!doctype html><title>Status Kart</title>');
  writeFileSync(join(dist, 'jeu.js'), 'console.log("course")');
  process.env.WEB_DIST = dist;
  process.env.FSQ_GAME_KEY = 'cle-de-test';
  const { default: app } = await import('../src/app.js');
  back = await new Promise((r) => { const s = app.listen(0, () => r(s)); });
  base = `http://127.0.0.1:${back.address().port}`;
});
after(() => { back.close(); rmSync(dist, { recursive: true, force: true }); });

test('GET / renvoie le HTML du front', async () => {
  const res = await fetch(`${base}/`);
  assert.equal(res.status, 200);
  assert.match(await res.text(), /Status Kart/);
});

test('un fichier du build est servi tel quel', async () => {
  const res = await fetch(`${base}/jeu.js`);
  assert.equal(res.status, 200);
  assert.match(await res.text(), /course/);
});

test('une autre URL du front retombe sur index.html', async () => {
  const res = await fetch(`${base}/resultats`);
  assert.match(await res.text(), /Status Kart/);
});

test('/api et le manifeste ne passent pas par le front', async () => {
  assert.equal((await fetch(`${base}/api/session`)).status, 401);
  assert.equal((await (await fetch(`${base}/fsq-manifest.json`)).json()).id, 'status-kart');
  const inconnue = await fetch(`${base}/api/inconnue`);
  assert.equal(inconnue.status, 404);
  assert.doesNotMatch(await inconnue.text(), /Status Kart/);
});
