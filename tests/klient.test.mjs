// Testy kodu klienckiego (src/app.js, src/app.css): czyste funkcje i zgodność z Safari 12.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const js = readFileSync(join(root, 'src', 'app.js'), 'utf8');
const css = readFileSync(join(root, 'src', 'app.css'), 'utf8');

// Bez przeglądarki app.js odkłada czyste funkcje do kuchniaTest i kończy.
const kontekst = {};
runInNewContext(js, kontekst);
// Obiekty z innego kontekstu vm mają inne prototypy — porównujemy po JSON.
const zwykly = (v) => JSON.parse(JSON.stringify(v));
const K = kontekst.kuchniaTest;

test('porcje: odmiana słowa', () => {
  assert.equal(K.porcjeSlowo(1), 'porcja');
  assert.equal(K.porcjeSlowo(2), 'porcje');
  assert.equal(K.porcjeSlowo(4), 'porcje');
  assert.equal(K.porcjeSlowo(5), 'porcji');
  assert.equal(K.porcjeSlowo(12), 'porcji');
  assert.equal(K.porcjeSlowo(22), 'porcje');
});

test('przeliczanie ilości: bez zmiany porcji wartość z przepisu', () => {
  assert.equal(K.ilosc(500, 'g', 1), '500');
  assert.equal(K.ilosc(1.5, 'szt', 1), '1½');
  assert.equal(K.ilosc(0.25, 'łyżeczka', 1), '0,25');
  assert.equal(K.ilosc(1.5, 'kg', 1), '1,5');
});

test('przeliczanie ilości: sztuki i łyżki do połówek', () => {
  assert.equal(K.ilosc(8, 'szt', 3 / 4), '6');
  assert.equal(K.ilosc(1, 'łyżeczka', 3 / 4), '1');      // 0,75 → 1
  assert.equal(K.ilosc(1, 'łyżeczka', 1 / 4), '½');      // nigdy mniej niż ½
  assert.equal(K.ilosc(2, 'łyżki', 5 / 4), '2½');
  assert.equal(K.ilosc(3, 'szt', 1 / 2), '1½');
});

test('przeliczanie ilości: g/ml do okrągłych wartości', () => {
  assert.equal(K.ilosc(500, 'g', 3 / 2), '750');
  assert.equal(K.ilosc(600, 'g', 5 / 4), '750');
  assert.equal(K.ilosc(300, 'g', 1 / 2), '150');
  assert.equal(K.ilosc(120, 'g', 3 / 2), '180');
  assert.equal(K.ilosc(9, 'g', 3 / 2), '14');            // < 20 → co 1
  assert.equal(K.ilosc(15, 'g', 3 / 2), '25');           // 22,5 → co 5
  assert.equal(K.ilosc(10, 'ml', 7 / 2), '35');          // 20–100 → co 5
  assert.equal(K.ilosc(500, 'ml', 3), '1500');           // ≥ 500 → co 25
});

test('czas i obroty TM6', () => {
  assert.equal(K.czasTm6(300), '5:00');
  assert.equal(K.czasTm6(1080), '18:00');
  assert.equal(K.czasTm6(30), '0:30');
  assert.equal(K.czasTm6(95), '1:35');
  assert.equal(K.obrotyTm6(1), '1');
  assert.equal(K.obrotyTm6(1.5), '1,5');
  assert.equal(K.obrotyTm6('spoon'), 'łyżka');
  assert.equal(K.obrotyTm6('turbo'), 'Turbo');
});

test('stan z localStorage: śmieci i stare zapisy nie psują aplikacji', () => {
  assert.deepEqual(zwykly(K.poprawStan(null)), { ekran: 'lista', przepisy: {} });
  assert.deepEqual(zwykly(K.poprawStan('x')), { ekran: 'lista', przepisy: {} });
  const s = K.poprawStan({ ekran: '../zle', przepisy: { 'udka': { krok: 3, porcje: 99 }, 'Z!': { krok: 1 } } });
  assert.equal(s.ekran, 'lista');
  assert.deepEqual(Object.keys(s.przepisy), ['udka']);
  assert.equal(s.przepisy.udka.krok, 3);
  assert.equal(s.przepisy.udka.porcje, 12);
});

test('esc: znaki HTML', () => {
  assert.equal(K.esc('<a href="x">&</a>'), '&lt;a href=&quot;x&quot;&gt;&amp;&lt;/a&gt;');
});

// Zakazy z CLAUDE.md — esbuild obniża część składni, ale tych rzeczy nie chcemy w źródle wcale.
test('src/app.js: brak składni i API, których nie ma Safari 12', () => {
  const kod = js.replace(/\/\/.*$/gm, '').replace(/'(?:[^'\\\n]|\\.)*'/g, "''");
  const zakazane = [
    [/\?\./, '?.'], [/\?\?/, '??'], [/#[a-zA-Z_]\w*\s*[=(;]/, 'pola prywatne #x'],
    [/\ballSettled\b/, 'Promise.allSettled'], [/\breplaceAll\b/, 'replaceAll'], [/\bmatchAll\b/, 'matchAll'],
    [/\(\?<[=!]/, 'lookbehind'], [/\bimport\s*\(/, 'import()'], [/^\s*(import|export)\s/m, 'moduły'],
    [/\bglobalThis\b/, 'globalThis'], [/\bserviceWorker\b/, 'service worker'],
  ];
  zakazane.forEach(([re, nazwa]) => assert.ok(!re.test(kod), 'zakazane w app.js: ' + nazwa));
});

test('src/app.js: localStorage tylko wewnątrz try', () => {
  js.split('\n').forEach((linia, i) => {
    if (/localStorage\./.test(linia)) assert.match(linia, /\btry\s*\{/, 'linia ' + (i + 1) + ': localStorage bez try/catch');
  });
});

test('src/app.css: brak CSS, którego nie ma Safari 12', () => {
  const kod = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const zakazane = [
    [/(^|[;{\s])gap\s*:/, 'gap (we flexboxie nie działa — tu w ogóle go nie używamy)'],
    [/aspect-ratio/, 'aspect-ratio'], [/\b(clamp|min|max)\(/, 'clamp()/min()/max()'],
    [/:(is|where|has)\(/, ':is/:where/:has'], [/(^|[;{\s])inset\s*:/, 'inset'],
    [/\b(lab|lch|color-mix)\(/, 'lab()/lch()/color-mix()'],
  ];
  zakazane.forEach(([re, nazwa]) => assert.ok(!re.test(kod), 'zakazane w app.css: ' + nazwa));
});

test('elementy reagujące na dotyk mają cursor: pointer (pułapka iOS 12)', () => {
  assert.match(css, /\[data-act\], \[data-open\], \[data-step\], button \{ cursor: pointer; \}/);
});
