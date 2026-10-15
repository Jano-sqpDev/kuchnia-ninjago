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

// Bez przeglądarki app.js odkłada czyste funkcje do kitchenTest i kończy.
const context = {};
runInNewContext(js, context);
// Obiekty z innego kontekstu vm mają inne prototypy — porównujemy po JSON.
const plain = (v) => JSON.parse(JSON.stringify(v));
const K = context.kitchenTest;

test('porcje: odmiana słowa', () => {
  assert.equal(K.servingsWord(1), 'porcja');
  assert.equal(K.servingsWord(2), 'porcje');
  assert.equal(K.servingsWord(4), 'porcje');
  assert.equal(K.servingsWord(5), 'porcji');
  assert.equal(K.servingsWord(12), 'porcji');
  assert.equal(K.servingsWord(22), 'porcje');
});

test('plakietka błędów: odmiana „przepis”', () => {
  assert.equal(K.problemsLabel(1), '1 przepis z błędem');
  assert.equal(K.problemsLabel(3), '3 przepisy z błędem');
  assert.equal(K.problemsLabel(5), '5 przepisów z błędem');
  assert.equal(K.problemsLabel(12), '12 przepisów z błędem');
  assert.equal(K.problemsLabel(22), '22 przepisy z błędem');
});

test('errors.json: grupowanie po plikach, pominięty jeśli choć jeden błąd pomija', () => {
  const groups = plain(K.groupProblems([
    { file: 'a.md', path: 'servings', where: 'porcje', reason: 'musi być >= 1', skipped: true },
    { file: 'b.md', path: 'image', where: 'zdjęcie', reason: 'HEIC', skipped: false },
    { file: 'a.md', path: 'title', where: 'tytuł', reason: 'brak', skipped: true },
    null, { path: 'x' },
  ]));
  assert.deepEqual(groups.map((g) => [g.file, g.skipped, g.items.length]), [['a.md', true, 2], ['b.md', false, 1]]);
  assert.deepEqual(groups[0].items[1], { where: 'tytuł', reason: 'brak', path: 'title' });
  assert.deepEqual(plain(K.groupProblems(null)), []);
});

test('przeliczanie ilości: bez zmiany porcji wartość z przepisu', () => {
  assert.equal(K.scaledAmount(500, 'g', 1), '500');
  assert.equal(K.scaledAmount(1.5, 'szt', 1), '1½');
  assert.equal(K.scaledAmount(0.25, 'łyżeczka', 1), '0,25');
  assert.equal(K.scaledAmount(1.5, 'kg', 1), '1,5');
});

test('przeliczanie ilości: sztuki i łyżki do połówek', () => {
  assert.equal(K.scaledAmount(8, 'szt', 3 / 4), '6');
  assert.equal(K.scaledAmount(1, 'łyżeczka', 3 / 4), '1');      // 0,75 → 1
  assert.equal(K.scaledAmount(1, 'łyżeczka', 1 / 4), '½');      // nigdy mniej niż ½
  assert.equal(K.scaledAmount(2, 'łyżki', 5 / 4), '2½');
  assert.equal(K.scaledAmount(3, 'szt', 1 / 2), '1½');
});

test('przeliczanie ilości: g/ml do okrągłych wartości', () => {
  assert.equal(K.scaledAmount(500, 'g', 3 / 2), '750');
  assert.equal(K.scaledAmount(600, 'g', 5 / 4), '750');
  assert.equal(K.scaledAmount(300, 'g', 1 / 2), '150');
  assert.equal(K.scaledAmount(120, 'g', 3 / 2), '180');
  assert.equal(K.scaledAmount(9, 'g', 3 / 2), '14');            // < 20 → co 1
  assert.equal(K.scaledAmount(15, 'g', 3 / 2), '25');           // 22,5 → co 5
  assert.equal(K.scaledAmount(10, 'ml', 7 / 2), '35');          // 20–100 → co 5
  assert.equal(K.scaledAmount(500, 'ml', 3), '1500');           // ≥ 500 → co 25
});

test('czas i obroty TM6', () => {
  assert.equal(K.tm6Time(300), '5:00');
  assert.equal(K.tm6Time(1080), '18:00');
  assert.equal(K.tm6Time(30), '0:30');
  assert.equal(K.tm6Time(95), '1:35');
  assert.equal(K.tm6Speed(1), '1');
  assert.equal(K.tm6Speed(1.5), '1,5');
  assert.equal(K.tm6Speed('spoon'), 'łyżka');
  assert.equal(K.tm6Speed('turbo'), 'Turbo');
});

test('stan z localStorage: śmieci i niepoprawne zapisy nie psują aplikacji', () => {
  assert.deepEqual(plain(K.normalizeState(null)), { openRecipe: null, recipes: {} });
  assert.deepEqual(plain(K.normalizeState('x')), { openRecipe: null, recipes: {} });
  const s = K.normalizeState({ openRecipe: '../zle', recipes: { 'udka': { step: 3, servings: 99 }, 'Z!': { step: 1 } } });
  assert.equal(s.openRecipe, null);
  assert.deepEqual(Object.keys(s.recipes), ['udka']);
  assert.equal(s.recipes.udka.step, 3);
  assert.equal(s.recipes.udka.servings, 12);
});

test('migracja zapisu sprzed v0.2.3: przepis, krok i porcje zostają', () => {
  const old = { ekran: 'udka-z-ziemniakami', przepisy: {
    'udka-z-ziemniakami': { krok: 3, porcje: 6, tytul: 'Udka z ziemniakami', krokow: 5, t: 1700 },
    'deser-twarogowy': { krok: 0, porcje: null, tytul: 'Deser', krokow: 4, t: 1600 },
  } };
  assert.deepEqual(plain(K.migrateLegacyState(old)), { openRecipe: 'udka-z-ziemniakami', recipes: {
    'udka-z-ziemniakami': { step: 3, servings: 6, title: 'Udka z ziemniakami', steps: 5, t: 1700 },
    'deser-twarogowy': { step: 0, servings: null, title: 'Deser', steps: 4, t: 1600 },
  } });
  // Lista (ekran 'lista') → brak otwartego przepisu; śmieci → pusty stan.
  assert.equal(K.migrateLegacyState({ ekran: 'lista', przepisy: {} }).openRecipe, null);
  assert.deepEqual(plain(K.migrateLegacyState(null)), { openRecipe: null, recipes: {} });
  assert.deepEqual(plain(K.migrateLegacyState({ ekran: 5, przepisy: 'x' })), { openRecipe: null, recipes: {} });
});

test('klucze localStorage: nowe angielskie, stare polskie tylko do migracji', () => {
  assert.ok(js.includes("STATE_KEY = 'kitchen-state'"));
  assert.ok(js.includes("THEME_KEY = 'kitchen-theme'"));
  assert.ok(js.includes("RELOAD_KEY = 'kitchen-reload'"));
  assert.ok(js.includes("LEGACY_KEYS = { state: 'kuchnia-stan', theme: 'kuchnia-motyw', reload: 'kuchnia-przeladowanie' }"));
  assert.ok(js.includes('migrateStorage();'));
});

test('esc: znaki HTML', () => {
  assert.equal(K.esc('<a href="x">&</a>'), '&lt;a href=&quot;x&quot;&gt;&amp;&lt;/a&gt;');
});

// Zakazy z CLAUDE.md — esbuild obniża część składni, ale tych rzeczy nie chcemy w źródle wcale.
test('src/app.js: brak składni i API, których nie ma Safari 12', () => {
  const code = js.replace(/\/\/.*$/gm, '').replace(/'(?:[^'\\\n]|\\.)*'/g, "''");
  const forbidden = [
    [/\?\./, '?.'], [/\?\?/, '??'], [/#[a-zA-Z_]\w*\s*[=(;]/, 'pola prywatne #x'],
    [/\ballSettled\b/, 'Promise.allSettled'], [/\breplaceAll\b/, 'replaceAll'], [/\bmatchAll\b/, 'matchAll'],
    [/\(\?<[=!]/, 'lookbehind'], [/\bimport\s*\(/, 'import()'], [/^\s*(import|export)\s/m, 'moduły'],
    [/\bglobalThis\b/, 'globalThis'], [/\bserviceWorker\b/, 'service worker'],
  ];
  forbidden.forEach(([re, label]) => assert.ok(!re.test(code), 'zakazane w app.js: ' + label));
});

test('src/app.js: localStorage tylko wewnątrz try', () => {
  js.split('\n').forEach((line, i) => {
    if (/localStorage\./.test(line)) assert.match(line, /\btry\s*\{/, 'linia ' + (i + 1) + ': localStorage bez try/catch');
  });
});

test('src/app.css: brak CSS, którego nie ma Safari 12', () => {
  const code = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const forbidden = [
    [/(^|[;{\s])gap\s*:/, 'gap (we flexboxie nie działa — tu w ogóle go nie używamy)'],
    [/aspect-ratio/, 'aspect-ratio'], [/\b(clamp|min|max)\(/, 'clamp()/min()/max()'],
    [/:(is|where|has)\(/, ':is/:where/:has'], [/(^|[;{\s])inset\s*:/, 'inset'],
    [/\b(lab|lch|color-mix)\(/, 'lab()/lch()/color-mix()'],
  ];
  forbidden.forEach(([re, label]) => assert.ok(!re.test(code), 'zakazane w app.css: ' + label));
});

test('elementy reagujące na dotyk mają cursor: pointer (pułapka iOS 12)', () => {
  assert.match(css, /\[data-act\], \[data-open\], \[data-step\], button \{ cursor: pointer; \}/);
});

test('dane pobierane z identyfikatorem buildu, version.json zawsze świeży', () => {
  assert.match(js, /'\/search\.json\?b=' \+ BUILD/);
  assert.match(js, /'\/data\/' \+ slug \+ '\.json\?b=' \+ BUILD/);
  assert.match(js, /'\/version\.json\?t=' \+ Date\.now\(\)/);
});
