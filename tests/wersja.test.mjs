// Testy numeru wersji: format wyświetlania i wstrzyknięcie przy buildzie.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { wersjaWyswietlana, wersjaZPackageJson, ZNACZNIK } from '../tools/wersja.mjs';

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
  assert.ok(html.includes('<div class="wersja">' + wersjaZPackageJson(join(root, 'package.json')) + '</div>'));
  assert.ok(!html.includes(ZNACZNIK));
});
