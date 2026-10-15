// Testy całego buildu: wynik dla przykładów i niezerowy kod wyjścia przy błędzie.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, readFileSync, existsSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function build(env) {
  return spawnSync(process.execPath, [join(root, 'tools', 'build.mjs')], {
    env: Object.assign({}, process.env, env),
    encoding: 'utf8',
  });
}

test('build przykładów: search.json, trzy data/*.json i strona z Etapu 1', () => {
  const out = mkdtempSync(join(tmpdir(), 'kuchnia-out-'));
  const w = build({ KUCHNIA_OUT_DIR: out });
  assert.equal(w.status, 0, w.stderr);

  assert.ok(existsSync(join(out, 'index.html')));
  assert.ok(existsSync(join(out, 'apple-touch-icon-152.png')));
  assert.ok(!existsSync(join(out, 'netlify.toml')));

  const indeks = JSON.parse(readFileSync(join(out, 'search.json'), 'utf8'));
  assert.equal(indeks.length, 3);
  assert.deepEqual(readdirSync(join(out, 'data')).sort(),
    ['deser-twarogowy.json', 'warzywa-varoma.json', 'ziemniaczki-brokuly-sync.json']);

  const ninja = JSON.parse(readFileSync(join(out, 'data', 'ziemniaczki-brokuly-sync.json'), 'utf8'));
  assert.equal(ninja.id, 'ziemniaczki-brokuly-sync');
  assert.equal(ninja.ninja.zone1.label, 'Ziemniaki');
  const tm6 = JSON.parse(readFileSync(join(out, 'data', 'warzywa-varoma.json'), 'utf8'));
  assert.equal(tm6.steps[2].tm6.temperature, 'Varoma');
});

test('błędny przepis: build kończy się kodem 1 i podaje plik, pole, przyczynę', () => {
  const dir = mkdtempSync(join(tmpdir(), 'kuchnia-zle-'));
  const zly = readFileSync(join(root, 'recipes', 'warzywa-varoma.md'), 'utf8')
    .replace('      speed: 1\n      reverse', '      speed: 11\n      reverse');
  writeFileSync(join(dir, 'warzywa-varoma.md'), zly);

  const w = build({ KUCHNIA_RECIPES_DIR: dir, KUCHNIA_OUT_DIR: join(dir, 'out') });
  assert.equal(w.status, 1);
  assert.match(w.stderr, /warzywa-varoma\.md → steps\[2\]\.tm6\.speed: niepoprawna wartość 11/);
  assert.ok(!existsSync(join(dir, 'out')), 'przy błędzie nic nie powinno zostać zbudowane');
});
