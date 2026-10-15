// Testy walidatora przepisów: przykłady przechodzą, błędne dane są wykrywane.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, mkdirSync, readFileSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateRecipe, parseRecipeFile, loadRecipes } from '../tools/walidacja.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

// --- dane bazowe ---

function ninjaSync() {
  return {
    schema_version: 1,
    title: 'Test Ninja',
    servings: 2,
    prep_minutes: 10,
    cook_minutes: 20,
    tags: ['ninja'],
    ingredients: [{ name: 'ziemniaki', amount: 500, unit: 'g' }, { name: 'sól' }],
    ninja: {
      mode: 'sync',
      zone1: { label: 'Ziemniaki', function: 'Air Fry', temp_c: 200, minutes: 20 },
      zone2: { function: 'Roast', temp_c: 180, minutes: 10 },
    },
    steps: [{ text: 'Piecz.' }],
  };
}

function tm6() {
  return {
    schema_version: 1,
    title: 'Test TM6',
    servings: 2,
    prep_minutes: 5,
    cook_minutes: 10,
    tags: ['tm6'],
    ingredients: [{ name: 'woda', amount: 500, unit: 'ml' }],
    steps: [
      { text: 'Gotuj.', tm6: { duration_seconds: 300, temperature: 100, speed: 1 } },
      { text: 'Na parze.', tm6: { duration_seconds: 600, temperature: 'Varoma', speed: 'spoon', reverse: true } },
    ],
  };
}

// Waliduje i zwraca błędy; plik zawsze „test.md".
const waliduj = (data) => validateRecipe(data, { file: 'test.md', recipesDir: root });

// Sprawdza, że jest błąd dla danej ścieżki pola.
function oczekujBledu(data, sciezka) {
  const bledy = waliduj(data);
  const pasuje = bledy.some((b) => b.startsWith('test.md → ' + sciezka + ':'));
  assert.ok(pasuje, 'oczekiwano błędu dla "' + sciezka + '", są: ' + JSON.stringify(bledy, null, 2));
}

// --- przykłady z repo ---

test('przykładowe przepisy z recipes/ przechodzą walidację', () => {
  const { recipes, errors } = loadRecipes(join(root, 'recipes'));
  assert.deepEqual(errors, []);
  // Kolekcja rośnie — sprawdzamy, że wczytano wszystkie pliki i że są wzorcowe przykłady.
  assert.equal(recipes.length, readdirSync(join(root, 'recipes')).filter((p) => p.endsWith('.md')).length);
  const slugi = recipes.map((r) => r.slug);
  ['deser-twarogowy', 'udka-z-ziemniakami', 'warzywa-varoma', 'ziemniaczki-brokuly-sync']
    .forEach((s) => assert.ok(slugi.includes(s), s));
});

test('dane bazowe testów są poprawne', () => {
  assert.deepEqual(waliduj(ninjaSync()), []);
  assert.deepEqual(waliduj(tm6()), []);
});

test('format komunikatu: plik → ścieżka: przyczyna', () => {
  const r = tm6();
  r.steps[1].tm6.speed = 11;
  const bledy = waliduj(r);
  assert.equal(bledy.length, 1);
  assert.match(bledy[0], /^test\.md → steps\[1\]\.tm6\.speed: niepoprawna wartość 11/);
});

// --- A/B: wymagane pola, typy, nieznane klucze ---

test('brak wymaganych pól', () => {
  for (const pole of ['schema_version', 'title', 'servings', 'prep_minutes', 'cook_minutes', 'tags', 'ingredients', 'steps']) {
    const r = ninjaSync();
    delete r[pole];
    oczekujBledu(r, pole);
  }
});

test('schema_version musi być dokładnie 1', () => {
  for (const v of [2, '1', 1.5]) {
    const r = ninjaSync();
    r.schema_version = v;
    oczekujBledu(r, 'schema_version');
  }
});

test('puste teksty i puste listy', () => {
  let r = ninjaSync(); r.title = '  '; oczekujBledu(r, 'title');
  r = ninjaSync(); r.ingredients = []; oczekujBledu(r, 'ingredients');
  r = ninjaSync(); r.steps = []; oczekujBledu(r, 'steps');
  r = ninjaSync(); r.ingredients[0].name = ''; oczekujBledu(r, 'ingredients[0].name');
  r = ninjaSync(); r.steps[0].text = ''; oczekujBledu(r, 'steps[0].text');
});

test('liczby: servings >= 1, minuty >= 0 i całkowite', () => {
  let r = ninjaSync(); r.servings = 0; oczekujBledu(r, 'servings');
  r = ninjaSync(); r.prep_minutes = -1; oczekujBledu(r, 'prep_minutes');
  r = ninjaSync(); r.cook_minutes = 2.5; oczekujBledu(r, 'cook_minutes');
  r = ninjaSync(); r.servings = '2'; oczekujBledu(r, 'servings');
});

test('nieznane klucze na każdym poziomie', () => {
  let r = ninjaSync(); r.id = 'x'; oczekujBledu(r, 'id');
  r = ninjaSync(); r.ingredients[0].ilosc = 1; oczekujBledu(r, 'ingredients[0].ilosc');
  r = ninjaSync(); r.steps[0].nr = 1; oczekujBledu(r, 'steps[0].nr');
  r = ninjaSync(); r.ninja.extra = 1; oczekujBledu(r, 'ninja.extra');
  r = ninjaSync(); r.ninja.zone1.akcje = []; oczekujBledu(r, 'ninja.zone1.akcje');
  r = tm6(); r.steps[0].tm6.obroty = 5; oczekujBledu(r, 'steps[0].tm6.obroty');
});

test('pola opcjonalne: poprawne przechodzą, puste są błędem', () => {
  const r = ninjaSync();
  r.description = 'Opis';
  r.source = 'ChatGPT';
  r.ingredients[0].note = 'małe';
  r.ingredients[0].group = 'Sos';
  r.steps[0].internal_temp_c = 75;
  r.steps[0].timer_seconds = 600;
  assert.deepEqual(waliduj(r), []);

  let z = ninjaSync(); z.description = ''; oczekujBledu(z, 'description');
  z = ninjaSync(); z.ingredients[0].group = null; oczekujBledu(z, 'ingredients[0].group');
  z = ninjaSync(); z.ninja.zone1.label = ''; oczekujBledu(z, 'ninja.zone1.label');
});

test('kroki: internal_temp_c i timer_seconds', () => {
  let r = ninjaSync(); r.steps[0].internal_temp_c = '75'; oczekujBledu(r, 'steps[0].internal_temp_c');
  r = ninjaSync(); r.steps[0].internal_temp_c = 750; oczekujBledu(r, 'steps[0].internal_temp_c');
  r = ninjaSync(); r.steps[0].timer_seconds = 0; oczekujBledu(r, 'steps[0].timer_seconds');
  r = ninjaSync(); r.steps[0].timer_seconds = 1.5; oczekujBledu(r, 'steps[0].timer_seconds');
});

// --- B: ilości ---

test('błędne ilości składników', () => {
  for (const v of [0, -5, '1,5', '200 g', null]) {
    const r = ninjaSync();
    r.ingredients[0].amount = v;
    oczekujBledu(r, 'ingredients[0].amount');
  }
});

test('ułamek 1.5 jest poprawną ilością', () => {
  const r = ninjaSync();
  r.ingredients[0].amount = 1.5;
  assert.deepEqual(waliduj(r), []);
});

test('unit wymagany przy amount, zabroniony bez amount', () => {
  let r = ninjaSync(); delete r.ingredients[0].unit; oczekujBledu(r, 'ingredients[0].unit');
  r = ninjaSync(); r.ingredients[1].unit = 'szczypta'; oczekujBledu(r, 'ingredients[1].unit');
});

// --- C: tagi ---

test('tagi: duplikaty, thermomix, aliasy Ninja, wielkie litery', () => {
  let r = ninjaSync(); r.tags = ['ninja', 'obiad', 'obiad']; oczekujBledu(r, 'tags[2]');
  r = tm6(); r.tags = ['tm6', 'thermomix']; oczekujBledu(r, 'tags[1]');
  r = ninjaSync(); r.tags = ['ninja', 'airfryer']; oczekujBledu(r, 'tags[1]');
  r = ninjaSync(); r.tags = ['ninja', 'Obiad']; oczekujBledu(r, 'tags[1]');
  r = ninjaSync(); r.tags = 'ninja'; oczekujBledu(r, 'tags');
});

test('pusta lista tagów jest dozwolona (bez urządzeń)', () => {
  const r = ninjaSync();
  delete r.ninja;
  r.tags = [];
  assert.deepEqual(waliduj(r), []);
});

// --- D: Ninja ---

test('tag ninja bez panelu i panel bez tagu', () => {
  let r = ninjaSync(); delete r.ninja; oczekujBledu(r, 'tags');
  r = ninjaSync(); r.tags = []; oczekujBledu(r, 'ninja');
});

test('nieznany tryb Ninja', () => {
  for (const v of ['osobno', 'SYNC', 'dual', undefined]) {
    const r = ninjaSync();
    if (v === undefined) delete r.ninja.mode; else r.ninja.mode = v;
    oczekujBledu(r, 'ninja.mode');
  }
});

test('strefy: single bez zone2, pozostałe tryby z zone2', () => {
  let r = ninjaSync(); r.ninja.mode = 'single'; oczekujBledu(r, 'ninja.zone2');
  r = ninjaSync(); r.ninja.mode = 'single'; delete r.ninja.zone2; assert.deepEqual(waliduj(r), []);
  for (const tryb of ['sync', 'match', 'independent']) {
    r = ninjaSync(); r.ninja.mode = tryb; delete r.ninja.zone2; oczekujBledu(r, 'ninja.zone2');
  }
  r = ninjaSync(); delete r.ninja.zone1; oczekujBledu(r, 'ninja.zone1');
});

test('strefy: funkcja, temperatura, minuty', () => {
  let r = ninjaSync(); r.ninja.zone1.function = 'Grill'; oczekujBledu(r, 'ninja.zone1.function');
  r = ninjaSync(); r.ninja.zone1.function = 'air fry'; oczekujBledu(r, 'ninja.zone1.function');
  r = ninjaSync(); r.ninja.zone2.temp_c = 39; oczekujBledu(r, 'ninja.zone2.temp_c');
  r = ninjaSync(); r.ninja.zone2.temp_c = 241; oczekujBledu(r, 'ninja.zone2.temp_c');
  r = ninjaSync(); r.ninja.zone2.temp_c = '200'; oczekujBledu(r, 'ninja.zone2.temp_c');
  r = ninjaSync(); r.ninja.zone1.minutes = 0; oczekujBledu(r, 'ninja.zone1.minutes');
  r = ninjaSync(); r.ninja.zone1.minutes = 12.5; oczekujBledu(r, 'ninja.zone1.minutes');
  r = ninjaSync(); delete r.ninja.zone1.minutes; oczekujBledu(r, 'ninja.zone1.minutes');
});

test('match wymaga identycznych ustawień stref (label może się różnić)', () => {
  const r = ninjaSync();
  r.ninja.mode = 'match';
  r.ninja.zone2 = { label: 'Inne', function: 'Air Fry', temp_c: 200, minutes: 20 };
  assert.deepEqual(waliduj(r), []);
  r.ninja.zone2.minutes = 15;
  oczekujBledu(r, 'ninja.zone2.minutes');
});

// --- E: TM6 ---

test('tag tm6 bez kroków tm6 i kroki tm6 bez tagu', () => {
  let r = tm6(); r.steps.forEach((s) => delete s.tm6); oczekujBledu(r, 'tags');
  r = tm6(); r.tags = []; oczekujBledu(r, 'tags');
});

test('TM6: duration_seconds', () => {
  for (const v of [0, -1, 2.5, '30 s', undefined]) {
    const r = tm6();
    if (v === undefined) delete r.steps[0].tm6.duration_seconds; else r.steps[0].tm6.duration_seconds = v;
    oczekujBledu(r, 'steps[0].tm6.duration_seconds');
  }
});

test('TM6: temperature', () => {
  for (const v of [36, 121, 'varoma', 'VAROMA', '100', null]) {
    const r = tm6();
    r.steps[0].tm6.temperature = v;
    oczekujBledu(r, 'steps[0].tm6.temperature');
  }
  const r = tm6();
  delete r.steps[0].tm6.temperature; // bez grzania
  assert.deepEqual(waliduj(r), []);
});

test('TM6: speed', () => {
  for (const v of [0, 0.5, 11, 2.3, '7', 'lyzka', 'Turbo']) {
    const r = tm6();
    r.steps[0].tm6.speed = v;
    oczekujBledu(r, 'steps[0].tm6.speed');
  }
  for (const v of [1, 1.5, 10, 'spoon', 'turbo']) {
    const r = tm6();
    r.steps[0].tm6.speed = v;
    assert.deepEqual(waliduj(r), [], 'speed ' + v);
  }
});

test('TM6: speed wymagany tylko bez mode', () => {
  let r = tm6(); delete r.steps[0].tm6.speed; oczekujBledu(r, 'steps[0].tm6.speed');
  r = tm6(); delete r.steps[0].tm6.speed; r.steps[0].tm6.mode = 'Wyrabianie';
  assert.deepEqual(waliduj(r), []);
});

test('TM6: reverse musi być boolean', () => {
  for (const v of ['nie', 0, null]) {
    const r = tm6();
    r.steps[0].tm6.reverse = v;
    oczekujBledu(r, 'steps[0].tm6.reverse');
  }
});

test('oba urządzenia w jednym przepisie', () => {
  const r = ninjaSync();
  r.tags = ['ninja', 'tm6'];
  r.steps.push({ text: 'Sos.', tm6: { duration_seconds: 30, speed: 7 } });
  assert.deepEqual(waliduj(r), []);
});

// --- parsowanie pliku ---

test('front matter: brak, zły YAML, powtórzony klucz', () => {
  assert.ok(parseRecipeFile('title: x\n').error);
  assert.ok(parseRecipeFile('---\ntitle: [x\n---\n').error);
  assert.match(parseRecipeFile('---\ntitle: a\ntitle: b\n---\n').error, /YAML/);
});

test('front matter: CRLF, BOM, notatki pod spodem, --- w tekście', () => {
  const w = parseRecipeFile('﻿---\r\ntitle: "a---b"\r\n---\r\nNotatka.\r\n');
  assert.equal(w.error, undefined);
  assert.equal(w.data.title, 'a---b');
  assert.equal(w.body, 'Notatka.');
});

test('YAML: "Varoma" bez cudzysłowu to tekst, 1.5 to liczba', () => {
  const w = parseRecipeFile('---\na: Varoma\nb: 1.5\nc: 1,5\n---\n');
  assert.deepEqual(w.data, { a: 'Varoma', b: 1.5, c: '1,5' });
});

// --- F: katalog przepisów: slugi i zdjęcia ---

function katalog(pliki) {
  const dir = mkdtempSync(join(tmpdir(), 'kuchnia-test-'));
  for (const [nazwa, tresc] of Object.entries(pliki)) {
    mkdirSync(dirname(join(dir, nazwa)), { recursive: true });
    writeFileSync(join(dir, nazwa), tresc);
  }
  return dir;
}

// Bez linii image — testy dopisują własne zdjęcie.
const DESER = readFileSync(join(root, 'recipes', 'deser-twarogowy.md'), 'utf8').replace(/^image: .*\r?\n/m, '');
const zeZdjeciem = (sciezka) => DESER.replace('schema_version: 1', 'schema_version: 1\nimage: ' + sciezka);

test('slug: niedozwolone znaki w nazwie pliku', () => {
  const { errors } = loadRecipes(katalog({ 'Deser Twarogowy.md': DESER }));
  assert.ok(errors.some((e) => e.includes('(nazwa pliku)')), JSON.stringify(errors));
});

test('slug: powtórzony (różna wielkość liter)', () => {
  const dir = katalog({ 'deser.md': DESER, 'DESER.md': DESER });
  const { errors } = loadRecipes(dir);
  // Na Windows/macOS drugi plik nadpisze pierwszy — wtedy test nie ma czego sprawdzać.
  if (loadRecipes(dir).recipes.length + errors.length < 2) return;
  assert.ok(errors.some((e) => e.includes('powtarza się')), JSON.stringify(errors));
});

test('w recipes/ tylko pliki .md', () => {
  const { errors } = loadRecipes(katalog({ 'deser.md': DESER, 'notatki.txt': 'x' }));
  assert.ok(errors.some((e) => e.startsWith('notatki.txt')));
});

test('image: poprawny JPEG i PNG przechodzą', () => {
  const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0]);
  const png = readFileSync(join(root, 'public', 'apple-touch-icon.png'));
  const { errors } = loadRecipes(katalog({
    'a.md': zeZdjeciem('img/a.jpg'), 'img/a.jpg': jpeg,
    'b.md': zeZdjeciem('img/b.png'), 'img/b.png': png,
  }));
  assert.deepEqual(errors, []);
});

test('image: brak pliku, zły format, ścieżka poza img/', () => {
  const webp = Buffer.from('RIFF\0\0\0\0WEBPVP8 ');
  const { errors } = loadRecipes(katalog({
    'a.md': zeZdjeciem('img/brak.jpg'),
    'b.md': zeZdjeciem('img/b.webp'), 'img/b.webp': webp,
    'c.md': zeZdjeciem('img/c.jpg'), 'img/c.jpg': webp,
    'd.md': zeZdjeciem('../public/apple-touch-icon.png'),
  }));
  for (const plik of ['a.md', 'b.md', 'c.md', 'd.md']) {
    assert.ok(errors.some((e) => e.startsWith(plik + ' → image:')), plik + ': ' + JSON.stringify(errors));
  }
});
