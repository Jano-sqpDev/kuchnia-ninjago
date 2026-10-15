// Testy całego buildu: wynik dla przykładów i niezerowy kod wyjścia przy błędzie.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function build(env) {
  return spawnSync(process.execPath, [join(root, 'tools', 'build.mjs')], {
    env: Object.assign({}, process.env, env),
    encoding: 'utf8',
  });
}

// Wszystkie przepisy z recipes/ (kolekcja rośnie); wzorcowe przykłady sprawdzane osobno niżej.
const SLUGI = readdirSync(join(root, 'recipes')).filter((p) => p.endsWith('.md')).map((p) => p.replace(/\.md$/, '')).sort();

test('build przykładów: search.json, data/*.json, strony /p/<slug>/, zdjęcia, mockup', async () => {
  const out = mkdtempSync(join(tmpdir(), 'kuchnia-out-'));
  const w = build({ KUCHNIA_OUT_DIR: out });
  assert.equal(w.status, 0, w.stderr);

  ['index.html', '404.html', 'app.js', 'app.css', 'apple-touch-icon-152.png'].forEach((p) => assert.ok(existsSync(join(out, p)), p));
  assert.ok(!existsSync(join(out, '.gitkeep')));
  assert.equal(readFileSync(join(out, 'mockup.html'), 'utf8'),
    readFileSync(join(root, 'docs', 'mockup-ui-v1.html'), 'utf8'));

  const indeks = JSON.parse(readFileSync(join(out, 'search.json'), 'utf8'));
  assert.equal(indeks.length, SLUGI.length);
  assert.deepEqual(readdirSync(join(out, 'data')).sort(), SLUGI.map((s) => s + '.json'));
  SLUGI.forEach((s) => assert.equal(readFileSync(join(out, 'p', s, 'index.html'), 'utf8'), readFileSync(join(out, 'index.html'), 'utf8')));

  const ninja = JSON.parse(readFileSync(join(out, 'data', 'ziemniaczki-brokuly-sync.json'), 'utf8'));
  assert.equal(ninja.id, 'ziemniaczki-brokuly-sync');
  assert.equal(ninja.ninja.zone1.label, 'Ziemniaki');
  const tm6 = JSON.parse(readFileSync(join(out, 'data', 'warzywa-varoma.json'), 'utf8'));
  assert.equal(tm6.steps[2].tm6.temperature, 'Varoma');

  // Lista potrzebuje porcji, czasów i miniatury; przepis bez zdjęcia nie ma thumb.
  const wpis = indeks.find((x) => x.id === 'warzywa-varoma');
  assert.equal(wpis.servings, 2);
  assert.equal(wpis.prep_minutes + wpis.cook_minutes, 33);
  assert.match(wpis.thumb, /^\/img\/warzywa-varoma-300-[0-9a-f]{8}\.jpg$/);
  assert.match(tm6.image, /^\/img\/warzywa-varoma-1200-[0-9a-f]{8}\.jpg$/);
  assert.equal(tm6.thumb, wpis.thumb);
  assert.ok(!('thumb' in indeks.find((x) => x.id === 'udka-z-ziemniakami')));
  assert.ok(!('image' in JSON.parse(readFileSync(join(out, 'data', 'udka-z-ziemniakami.json'), 'utf8'))));

  // Zdjęcia: JPEG (także ze źródła PNG), dłuższy bok 300 i 1200 px.
  const deser = JSON.parse(readFileSync(join(out, 'data', 'deser-twarogowy.json'), 'utf8'));
  for (const [sciezka, bok] of [[deser.thumb, 300], [deser.image, 1200]]) {
    const m = await sharp(join(out, sciezka)).metadata();
    assert.equal(m.format, 'jpeg', sciezka);
    assert.equal(Math.max(m.width, m.height), bok, sciezka);
  }
  // Do _site trafiają tylko wersje z buildu, nie źródła.
  assert.deepEqual(readdirSync(join(out, 'img')).filter((p) => !/-(300|1200)-[0-9a-f]{8}\.jpg$/.test(p)), []);
});

test('małe zdjęcie nie jest powiększane', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'kuchnia-male-'));
  mkdirSync(join(dir, 'img'));
  await sharp({ create: { width: 400, height: 200, channels: 3, background: '#c44a1e' } }).png().toFile(join(dir, 'img', 'male.png'));
  writeFileSync(join(dir, 'deser-twarogowy.md'), readFileSync(join(root, 'recipes', 'deser-twarogowy.md'), 'utf8')
    .replace('image: img/deser-twarogowy.png', 'image: img/male.png'));
  const out = join(dir, 'out');
  const w = build({ KUCHNIA_RECIPES_DIR: dir, KUCHNIA_OUT_DIR: out });
  assert.equal(w.status, 0, w.stderr);
  const d = JSON.parse(readFileSync(join(out, 'data', 'deser-twarogowy.json'), 'utf8'));
  assert.equal((await sharp(join(out, d.thumb)).metadata()).width, 300);
  assert.equal((await sharp(join(out, d.image)).metadata()).width, 400);
});

test('pusta kolekcja: build przechodzi, search.json to []', () => {
  const dir = mkdtempSync(join(tmpdir(), 'kuchnia-pusto-'));
  const w = build({ KUCHNIA_RECIPES_DIR: dir, KUCHNIA_OUT_DIR: join(dir, 'out') });
  assert.equal(w.status, 0, w.stderr);
  assert.deepEqual(JSON.parse(readFileSync(join(dir, 'out', 'search.json'), 'utf8')), []);
});

test('błędny przepis: build kończy się kodem 1 i podaje plik, pole, przyczynę', () => {
  const dir = mkdtempSync(join(tmpdir(), 'kuchnia-zle-'));
  const zly = readFileSync(join(root, 'recipes', 'warzywa-varoma.md'), 'utf8')
    .replace('      speed: 1\n      reverse', '      speed: 11\n      reverse')
    .replace(/^image: .*\r?\n/m, '');
  writeFileSync(join(dir, 'warzywa-varoma.md'), zly);

  const w = build({ KUCHNIA_RECIPES_DIR: dir, KUCHNIA_OUT_DIR: join(dir, 'out') });
  assert.equal(w.status, 1);
  assert.match(w.stderr, /warzywa-varoma\.md → steps\[2\]\.tm6\.speed: niepoprawna wartość 11/);
  assert.ok(!existsSync(join(dir, 'out')), 'przy błędzie nic nie powinno zostać zbudowane');
});
