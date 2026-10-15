// Testy numeru wersji: format wyświetlania i wstrzyknięcie przy buildzie.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { wersjaWyswietlana, wersjaZPackageJson, idBuildu, wstawWersje } from '../tools/wersja.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

test('wersja wyświetlana: bez łatki .0, z łatką gdy jest', () => {
  assert.equal(wersjaWyswietlana('0.1.0'), 'v0.1');
  assert.equal(wersjaWyswietlana('0.1.2'), 'v0.1.2');
  assert.equal(wersjaWyswietlana('1.10.0'), 'v1.10');
  assert.throws(() => wersjaWyswietlana('0.1'));
});

test('build wstrzykuje wersję z package.json do strony', () => {
  const out = mkdtempSync(join(tmpdir(), 'kuchnia-wersja-'));
  const w = spawnSync(process.execPath, [join(root, 'tools', 'build.mjs')], {
    env: Object.assign({}, process.env, { KUCHNIA_OUT_DIR: out }), encoding: 'utf8',
  });
  assert.equal(w.status, 0, w.stderr);
  const html = readFileSync(join(out, 'index.html'), 'utf8');
  const { build, version } = JSON.parse(readFileSync(join(out, 'version.json'), 'utf8'));
  assert.equal(version, wersjaZPackageJson(join(root, 'package.json')));
  assert.match(build, /^[0-9a-f]{8}$/);
  assert.ok(html.includes('<div class="wersja">' + version + ' · ' + build.slice(0, 4) + '</div>'));
  assert.ok(html.includes('data-build="' + build + '"'));
  assert.ok(html.includes('/app.js?' + build) && html.includes('/app.css?' + build));
  assert.ok(!html.includes('{{'));
  // Strony przepisów i 404 to ta sama powłoka — z tym samym identyfikatorem.
  assert.equal(readFileSync(join(out, '404.html'), 'utf8'), html);
});

function zbuduj(env) {
  const out = mkdtempSync(join(tmpdir(), 'kuchnia-build-'));
  const w = spawnSync(process.execPath, [join(root, 'tools', 'build.mjs')], {
    env: Object.assign({}, process.env, { KUCHNIA_OUT_DIR: out }, env), encoding: 'utf8',
  });
  assert.equal(w.status, 0, w.stderr);
  return JSON.parse(readFileSync(join(out, 'version.json'), 'utf8')).build;
}

test('identyfikator buildu: ten sam wynik → ten sam id, zmiana przepisu → nowy id', () => {
  assert.equal(zbuduj({}), zbuduj({}));
  const dir = mkdtempSync(join(tmpdir(), 'kuchnia-id-'));
  const deser = readFileSync(join(root, 'recipes', 'deser-twarogowy.md'), 'utf8').replace(/^image: .*\r?\n/m, '');
  writeFileSync(join(dir, 'deser-twarogowy.md'), deser);
  const przed = zbuduj({ KUCHNIA_RECIPES_DIR: dir });
  writeFileSync(join(dir, 'deser-twarogowy.md'), deser.replace('prep_minutes: 5', 'prep_minutes: 6'));
  assert.notEqual(zbuduj({ KUCHNIA_RECIPES_DIR: dir }), przed);
});

test('idBuildu i wstawWersje', () => {
  assert.equal(idBuildu(['a', 'b']), idBuildu(['a', 'b']));
  assert.notEqual(idBuildu(['ab', '']), idBuildu(['a', 'b']));
  assert.equal(wstawWersje('{{WERSJA}}|{{BUILD_KROTKI}}|{{BUILD}}', 'v1.2', 'abcdef12'), 'v1.2|abcd|abcdef12');
});
