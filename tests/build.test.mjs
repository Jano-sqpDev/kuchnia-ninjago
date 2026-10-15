// Testy całego buildu: wynik dla przykładów, pomijanie błędnych przepisów (errors.json), zdjęcia po nazwie i HEIC.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, readdirSync, copyFileSync } from 'node:fs';
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
const SLUGS = readdirSync(join(root, 'recipes')).filter((p) => p.endsWith('.md')).map((p) => p.replace(/\.md$/, '')).sort();

test('build przykładów: search.json, data/*.json, strony /p/<slug>/, zdjęcia, mockup', async () => {
  const out = mkdtempSync(join(tmpdir(), 'kitchen-out-'));
  const w = build({ KITCHEN_OUT_DIR: out });
  assert.equal(w.status, 0, w.stderr);

  ['index.html', '404.html', 'app.js', 'app.css', 'apple-touch-icon-152.png'].forEach((p) => assert.ok(existsSync(join(out, p)), p));
  assert.ok(!existsSync(join(out, '.gitkeep')));
  assert.equal(readFileSync(join(out, 'mockup.html'), 'utf8'),
    readFileSync(join(root, 'docs', 'mockup-ui-v1.html'), 'utf8'));

  const index = JSON.parse(readFileSync(join(out, 'search.json'), 'utf8'));
  assert.equal(index.length, SLUGS.length);
  assert.deepEqual(readdirSync(join(out, 'data')).sort(), SLUGS.map((s) => s + '.json'));
  SLUGS.forEach((s) => assert.equal(readFileSync(join(out, 'p', s, 'index.html'), 'utf8'), readFileSync(join(out, 'index.html'), 'utf8')));

  const ninja = JSON.parse(readFileSync(join(out, 'data', 'ziemniaczki-brokuly-sync.json'), 'utf8'));
  assert.equal(ninja.id, 'ziemniaczki-brokuly-sync');
  assert.equal(ninja.ninja.zone1.label, 'Ziemniaki');
  const tm6 = JSON.parse(readFileSync(join(out, 'data', 'warzywa-varoma.json'), 'utf8'));
  assert.equal(tm6.steps[2].tm6.temperature, 'Varoma');

  // Lista potrzebuje porcji, czasów i miniatury; przepis bez zdjęcia nie ma thumb.
  const entry = index.find((x) => x.id === 'warzywa-varoma');
  assert.equal(entry.servings, 2);
  assert.equal(entry.prep_minutes + entry.cook_minutes, 33);
  assert.match(entry.thumb, /^\/img\/warzywa-varoma-300-[0-9a-f]{8}\.jpg$/);
  assert.match(tm6.image, /^\/img\/warzywa-varoma-1200-[0-9a-f]{8}\.jpg$/);
  assert.equal(tm6.thumb, entry.thumb);
  assert.ok(!('thumb' in index.find((x) => x.id === 'udka-z-ziemniakami')));
  assert.ok(!('image' in JSON.parse(readFileSync(join(out, 'data', 'udka-z-ziemniakami.json'), 'utf8'))));

  // Zdjęcia: JPEG (także ze źródła PNG), dłuższy bok 300 i 1200 px.
  const deser = JSON.parse(readFileSync(join(out, 'data', 'deser-twarogowy.json'), 'utf8'));
  for (const [fieldPath, side] of [[deser.thumb, 300], [deser.image, 1200]]) {
    const m = await sharp(join(out, fieldPath)).metadata();
    assert.equal(m.format, 'jpeg', fieldPath);
    assert.equal(Math.max(m.width, m.height), side, fieldPath);
  }
  // Do _site trafiają tylko wersje z buildu, nie źródła.
  assert.deepEqual(readdirSync(join(out, 'img')).filter((p) => !/-(300|1200)-[0-9a-f]{8}\.jpg$/.test(p)), []);
});

test('małe zdjęcie nie jest powiększane', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'kitchen-male-'));
  mkdirSync(join(dir, 'img'));
  await sharp({ create: { width: 400, height: 200, channels: 3, background: '#c44a1e' } }).png().toFile(join(dir, 'img', 'male.png'));
  writeFileSync(join(dir, 'deser-twarogowy.md'), readFileSync(join(root, 'recipes', 'deser-twarogowy.md'), 'utf8')
    .replace('image: img/deser-twarogowy.png', 'image: img/male.png'));
  const out = join(dir, 'out');
  const w = build({ KITCHEN_RECIPES_DIR: dir, KITCHEN_OUT_DIR: out });
  assert.equal(w.status, 0, w.stderr);
  const d = JSON.parse(readFileSync(join(out, 'data', 'deser-twarogowy.json'), 'utf8'));
  assert.equal((await sharp(join(out, d.thumb)).metadata()).width, 300);
  assert.equal((await sharp(join(out, d.image)).metadata()).width, 400);
});

test('pusta kolekcja: build przechodzi, search.json to []', () => {
  const dir = mkdtempSync(join(tmpdir(), 'kitchen-pusto-'));
  const w = build({ KITCHEN_RECIPES_DIR: dir, KITCHEN_OUT_DIR: join(dir, 'out') });
  assert.equal(w.status, 0, w.stderr);
  assert.deepEqual(JSON.parse(readFileSync(join(dir, 'out', 'search.json'), 'utf8')), []);
  assert.deepEqual(JSON.parse(readFileSync(join(dir, 'out', 'errors.json'), 'utf8')), []);
});

// Przepis z repo bez linii image (testy dokładają własne zdjęcia).
const example = (slug) => readFileSync(join(root, 'recipes', slug + '.md'), 'utf8').replace(/^image: .*\r?\n/m, '');
const readJson = (out, p) => JSON.parse(readFileSync(join(out, p), 'utf8'));

test('błędne przepisy nie przerywają buildu: są pominięte, reszta publikowana, błędy w errors.json', () => {
  const dir = mkdtempSync(join(tmpdir(), 'kitchen-bad-'));
  writeFileSync(join(dir, 'deser-twarogowy.md'), example('deser-twarogowy'));
  // zły parametr TM6
  writeFileSync(join(dir, 'warzywa-varoma.md'), example('warzywa-varoma').replace(/speed: 1(\r?\n\s+reverse)/, 'speed: 11$1'));
  // zła składnia YAML (niezamknięty cudzysłów)
  writeFileSync(join(dir, 'zupa.md'), '---\nschema_version: 1\ntitle: "Zupa\nservings: 2\n---\n');
  // nazwa pliku z wielkimi literami i spacją (typowe przy dodawaniu z telefonu)
  writeFileSync(join(dir, 'Pierogi Ruskie.md'), example('deser-twarogowy'));

  const out = join(dir, 'out');
  const w = build({ KITCHEN_RECIPES_DIR: dir, KITCHEN_OUT_DIR: out });
  assert.equal(w.status, 0, w.stderr);
  assert.match(w.stderr, /przepisy z błędem: 3/);

  assert.deepEqual(readJson(out, 'search.json').map((e) => e.id), ['deser-twarogowy']);
  assert.deepEqual(readdirSync(join(out, 'data')), ['deser-twarogowy.json']);
  assert.ok(!existsSync(join(out, 'p', 'warzywa-varoma')));

  const problems = readJson(out, 'errors.json');
  const tm6 = problems.find((p) => p.file === 'warzywa-varoma.md');
  assert.deepEqual(tm6, { file: 'warzywa-varoma.md', path: 'steps[2].tm6.speed', where: 'krok 3 → TM6 → obroty',
    reason: tm6.reason, skipped: true });
  assert.match(tm6.reason, /^niepoprawna wartość 11/);
  const yaml = problems.find((p) => p.file === 'zupa.md');
  assert.equal(yaml.path, '(YAML)');
  assert.equal(yaml.where, 'zapis pliku (YAML)');
  assert.match(yaml.reason, /niepoprawny YAML/);
  const name = problems.find((p) => p.file === 'Pierogi Ruskie.md');
  assert.match(name.reason, /zmień na pierogi-ruskie\.md/);
  assert.ok(problems.every((p) => p.skipped));
});

test('npm run validate nadal kończy się błędem przy złym przepisie', () => {
  const dir = mkdtempSync(join(tmpdir(), 'kitchen-validate-'));
  writeFileSync(join(dir, 'zupa.md'), '---\nschema_version: 1\ntitle: "Zupa\n---\n');
  const w = spawnSync(process.execPath, [join(root, 'tools', 'validate-cli.mjs')], {
    env: Object.assign({}, process.env, { KITCHEN_RECIPES_DIR: dir }), encoding: 'utf8',
  });
  assert.equal(w.status, 1);
  assert.match(w.stderr, /zupa\.md → \(YAML\): niepoprawny YAML/);
});

test('zdjęcie po nazwie pliku: recipes/img/<slug>.JPG bez pola image', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'kitchen-auto-'));
  mkdirSync(join(dir, 'img'));
  writeFileSync(join(dir, 'deser-twarogowy.md'), example('deser-twarogowy'));
  await sharp({ create: { width: 1600, height: 900, channels: 3, background: '#2f7cc2' } }).jpeg().toFile(join(dir, 'img', 'deser-twarogowy.JPG'));
  // przepis bez zdjęcia obok — nie dostaje cudzego
  writeFileSync(join(dir, 'udka-z-ziemniakami.md'), example('udka-z-ziemniakami'));

  const out = join(dir, 'out');
  const w = build({ KITCHEN_RECIPES_DIR: dir, KITCHEN_OUT_DIR: out });
  assert.equal(w.status, 0, w.stderr);
  const d = readJson(out, 'data/deser-twarogowy.json');
  assert.match(d.image, /^\/img\/deser-twarogowy-1200-[0-9a-f]{8}\.jpg$/);
  assert.equal((await sharp(join(out, d.image)).metadata()).width, 1200);
  assert.ok(!('image' in readJson(out, 'data/udka-z-ziemniakami.json')));
  assert.deepEqual(readJson(out, 'errors.json'), []);
});

test('HEIC z iPhone\'a: konwersja do JPEG (pole image i zdjęcie po nazwie)', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'kitchen-heic-'));
  mkdirSync(join(dir, 'img'));
  copyFileSync(join(root, 'tests', 'fixtures', 'zdjecie.heic'), join(dir, 'img', 'deser-twarogowy.HEIC'));
  copyFileSync(join(root, 'tests', 'fixtures', 'zdjecie.heic'), join(dir, 'img', 'inne.heic'));
  writeFileSync(join(dir, 'deser-twarogowy.md'), example('deser-twarogowy'));
  writeFileSync(join(dir, 'warzywa-varoma.md'), example('warzywa-varoma').replace('schema_version: 1', 'schema_version: 1\nimage: img/inne.heic'));

  const out = join(dir, 'out');
  const w = build({ KITCHEN_RECIPES_DIR: dir, KITCHEN_OUT_DIR: out });
  assert.equal(w.status, 0, w.stderr);
  assert.deepEqual(readJson(out, 'errors.json'), []);
  for (const slug of ['deser-twarogowy', 'warzywa-varoma']) {
    const d = readJson(out, 'data/' + slug + '.json');
    const m = await sharp(join(out, d.thumb)).metadata();
    assert.equal(m.format, 'jpeg', slug);
    assert.equal(m.width, 300, slug); // źródło 480×360
  }
});

test('zepsute zdjęcie: przepis zostaje na liście bez zdjęcia, błąd w errors.json', () => {
  const dir = mkdtempSync(join(tmpdir(), 'kitchen-badimg-'));
  mkdirSync(join(dir, 'img'));
  // nagłówek HEIC, ale treść nie do odczytania
  writeFileSync(join(dir, 'img', 'deser-twarogowy.heic'), Buffer.concat([Buffer.from([0, 0, 0, 24]), Buffer.from('ftypheic'), Buffer.alloc(64, 7)]));
  // WebP po nazwie — Safari 12 go nie pokaże
  writeFileSync(join(dir, 'img', 'warzywa-varoma.jpg'), Buffer.from('RIFF\0\0\0\0WEBPVP8 '));
  writeFileSync(join(dir, 'deser-twarogowy.md'), example('deser-twarogowy'));
  writeFileSync(join(dir, 'warzywa-varoma.md'), example('warzywa-varoma'));

  const out = join(dir, 'out');
  const w = build({ KITCHEN_RECIPES_DIR: dir, KITCHEN_OUT_DIR: out });
  assert.equal(w.status, 0, w.stderr);
  assert.deepEqual(readJson(out, 'search.json').map((e) => e.id).sort(), ['deser-twarogowy', 'warzywa-varoma']);
  const problems = readJson(out, 'errors.json');
  assert.equal(problems.length, 2);
  assert.ok(problems.every((p) => p.skipped === false && p.path === 'image' && p.where === 'zdjęcie'));
  assert.match(problems.find((p) => p.file === 'deser-twarogowy.md').reason, /HEIC.*zapisz je jako JPEG/);
  assert.match(problems.find((p) => p.file === 'warzywa-varoma.md').reason, /nie jest prawdziwym JPEG\/PNG\/HEIC/);
  assert.ok(!('image' in readJson(out, 'data/deser-twarogowy.json')));
});

