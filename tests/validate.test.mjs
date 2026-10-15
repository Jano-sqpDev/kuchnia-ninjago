// Testy walidatora przepisów: przykłady przechodzą, błędne dane są wykrywane.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, mkdirSync, readFileSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateRecipe, validateTranslations, parseTagMap, tagWarnings, translateTags, parseRecipeFile, loadRecipes, describePath, suggestSlug, splitError, imageKind, findImageBySlug, NINJA_FUNCTIONS, NINJA_MODES, TURN_ACTIONS, UNITS } from '../tools/validate.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
// Przykłady wzorcowe — testy nie zakładają, że w recipes/ jest jakiś konkretny przepis (to kolekcja Janusza).
const FIXTURES = join(root, 'tests', 'fixtures', 'recipes');

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
const validate = (data) => validateRecipe(data, { file: 'test.md', recipesDir: root });

// Sprawdza, że jest błąd dla danej ścieżki pola.
function expectError(data, fieldPath) {
  const errs = validate(data);
  const matches = errs.some((b) => b.startsWith('test.md → ' + fieldPath + ':'));
  assert.ok(matches, 'oczekiwano błędu dla "' + fieldPath + '", są: ' + JSON.stringify(errs, null, 2));
}

// --- przepisy z repo i przykłady wzorcowe ---

// Twarda bramka dla recipes/ (npm test / npm run deploy): zero błędów. Kolekcja może być pusta; ostrzeżenia nie blokują.
test('przepisy z recipes/ przechodzą walidację (dowolna liczba, także zero)', () => {
  const dir = join(root, 'recipes');
  const { recipes, errors } = loadRecipes(dir);
  assert.deepEqual(errors, []);
  assert.equal(recipes.length, readdirSync(dir).filter((p) => p.endsWith('.md')).length);
});

test('przykłady wzorcowe (tests/fixtures/recipes) przechodzą walidację; tylko jeden bez tłumaczenia EN', () => {
  const { recipes, errors, warnings } = loadRecipes(FIXTURES);
  assert.deepEqual(errors, []);
  assert.deepEqual(recipes.map((r) => [r.slug, r.translated]), [
    ['deser-twarogowy', true], ['udka-z-ziemniakami', true], ['warzywa-varoma', true], ['ziemniaczki-brokuly-sync', false],
  ]);
  assert.deepEqual(warnings, ['ziemniaczki-brokuly-sync.md → translations.en: brak tłumaczenia EN — w trybie EN przepis wyświetla się po polsku']);
});

test('brak katalogu z przepisami = pusta kolekcja', () => {
  const { recipes, errors, warnings } = loadRecipes(join(tmpdir(), 'kitchen-nie-ma-takiego-katalogu'));
  assert.deepEqual([recipes, errors, warnings], [[], [], []]);
});

test('dane bazowe testów są poprawne', () => {
  assert.deepEqual(validate(ninjaSync()), []);
  assert.deepEqual(validate(tm6()), []);
});

test('format komunikatu: plik → ścieżka: przyczyna', () => {
  const r = tm6();
  r.steps[1].tm6.speed = 11;
  const errs = validate(r);
  assert.equal(errs.length, 1);
  assert.match(errs[0], /^test\.md → steps\[1\]\.tm6\.speed: niepoprawna wartość 11/);
});

// --- A/B: wymagane pola, typy, nieznane klucze ---

test('brak wymaganych pól', () => {
  for (const pole of ['schema_version', 'title', 'servings', 'prep_minutes', 'cook_minutes', 'tags', 'ingredients', 'steps']) {
    const r = ninjaSync();
    delete r[pole];
    expectError(r, pole);
  }
});

test('schema_version musi być dokładnie 1', () => {
  for (const v of [2, '1', 1.5]) {
    const r = ninjaSync();
    r.schema_version = v;
    expectError(r, 'schema_version');
  }
});

test('puste teksty i puste listy', () => {
  let r = ninjaSync(); r.title = '  '; expectError(r, 'title');
  r = ninjaSync(); r.ingredients = []; expectError(r, 'ingredients');
  r = ninjaSync(); r.steps = []; expectError(r, 'steps');
  r = ninjaSync(); r.ingredients[0].name = ''; expectError(r, 'ingredients[0].name');
  r = ninjaSync(); r.steps[0].text = ''; expectError(r, 'steps[0].text');
});

test('liczby: servings >= 1, minuty >= 0 i całkowite', () => {
  let r = ninjaSync(); r.servings = 0; expectError(r, 'servings');
  r = ninjaSync(); r.prep_minutes = -1; expectError(r, 'prep_minutes');
  r = ninjaSync(); r.cook_minutes = 2.5; expectError(r, 'cook_minutes');
  r = ninjaSync(); r.servings = '2'; expectError(r, 'servings');
});

test('nieznane klucze na każdym poziomie', () => {
  let r = ninjaSync(); r.id = 'x'; expectError(r, 'id');
  r = ninjaSync(); r.ingredients[0].ilosc = 1; expectError(r, 'ingredients[0].ilosc');
  r = ninjaSync(); r.steps[0].nr = 1; expectError(r, 'steps[0].nr');
  r = ninjaSync(); r.ninja.extra = 1; expectError(r, 'ninja.extra');
  r = ninjaSync(); r.ninja.zone1.akcje = []; expectError(r, 'ninja.zone1.akcje');
  r = tm6(); r.steps[0].tm6.obroty = 5; expectError(r, 'steps[0].tm6.obroty');
});

test('pola opcjonalne: poprawne przechodzą, puste są błędem', () => {
  const r = ninjaSync();
  r.description = 'Opis';
  r.source = 'ChatGPT';
  r.ingredients[0].note = 'małe';
  r.ingredients[0].group = 'Sos';
  r.steps[0].internal_temp_c = 75;
  r.steps[0].timer_seconds = 600;
  assert.deepEqual(validate(r), []);

  let z = ninjaSync(); z.description = ''; expectError(z, 'description');
  z = ninjaSync(); z.ingredients[0].group = null; expectError(z, 'ingredients[0].group');
  z = ninjaSync(); z.ninja.zone1.label = ''; expectError(z, 'ninja.zone1.label');
});

test('kroki: internal_temp_c i timer_seconds', () => {
  let r = ninjaSync(); r.steps[0].internal_temp_c = '75'; expectError(r, 'steps[0].internal_temp_c');
  r = ninjaSync(); r.steps[0].internal_temp_c = 750; expectError(r, 'steps[0].internal_temp_c');
  r = ninjaSync(); r.steps[0].timer_seconds = 0; expectError(r, 'steps[0].timer_seconds');
  r = ninjaSync(); r.steps[0].timer_seconds = 1.5; expectError(r, 'steps[0].timer_seconds');
});

// --- B: ilości ---

test('błędne ilości składników', () => {
  for (const v of [0, -5, '1,5', '200 g', null]) {
    const r = ninjaSync();
    r.ingredients[0].amount = v;
    expectError(r, 'ingredients[0].amount');
  }
});

test('ułamek 1.5 jest poprawną ilością', () => {
  const r = ninjaSync();
  r.ingredients[0].amount = 1.5;
  assert.deepEqual(validate(r), []);
});

test('unit wymagany przy amount, zabroniony bez amount', () => {
  let r = ninjaSync(); delete r.ingredients[0].unit; expectError(r, 'ingredients[0].unit');
  r = ninjaSync(); r.ingredients[1].unit = 'szczypta'; expectError(r, 'ingredients[1].unit');
});

// --- C: tagi ---

test('tagi: duplikaty, thermomix, aliasy Ninja, wielkie litery', () => {
  let r = ninjaSync(); r.tags = ['ninja', 'obiad', 'obiad']; expectError(r, 'tags[2]');
  r = tm6(); r.tags = ['tm6', 'thermomix']; expectError(r, 'tags[1]');
  r = ninjaSync(); r.tags = ['ninja', 'airfryer']; expectError(r, 'tags[1]');
  r = ninjaSync(); r.tags = ['ninja', 'Obiad']; expectError(r, 'tags[1]');
  r = ninjaSync(); r.tags = 'ninja'; expectError(r, 'tags');
});

test('pusta lista tagów jest dozwolona (bez urządzeń)', () => {
  const r = ninjaSync();
  delete r.ninja;
  r.tags = [];
  assert.deepEqual(validate(r), []);
});

// --- D: Ninja ---

test('tag ninja bez panelu i panel bez tagu', () => {
  let r = ninjaSync(); delete r.ninja; expectError(r, 'tags');
  r = ninjaSync(); r.tags = []; expectError(r, 'ninja');
});

test('nieznany tryb Ninja', () => {
  for (const v of ['osobno', 'SYNC', 'dual', undefined]) {
    const r = ninjaSync();
    if (v === undefined) delete r.ninja.mode; else r.ninja.mode = v;
    expectError(r, 'ninja.mode');
  }
});

test('strefy: single bez zone2, pozostałe tryby z zone2', () => {
  let r = ninjaSync(); r.ninja.mode = 'single'; expectError(r, 'ninja.zone2');
  r = ninjaSync(); r.ninja.mode = 'single'; delete r.ninja.zone2; assert.deepEqual(validate(r), []);
  for (const tryb of ['sync', 'match', 'independent']) {
    r = ninjaSync(); r.ninja.mode = tryb; delete r.ninja.zone2; expectError(r, 'ninja.zone2');
  }
  r = ninjaSync(); delete r.ninja.zone1; expectError(r, 'ninja.zone1');
});

test('strefy: funkcja, temperatura, minuty', () => {
  let r = ninjaSync(); r.ninja.zone1.function = 'Grill'; expectError(r, 'ninja.zone1.function');
  r = ninjaSync(); r.ninja.zone1.function = 'air fry'; expectError(r, 'ninja.zone1.function');
  r = ninjaSync(); r.ninja.zone2.temp_c = 39; expectError(r, 'ninja.zone2.temp_c');
  r = ninjaSync(); r.ninja.zone2.temp_c = 241; expectError(r, 'ninja.zone2.temp_c');
  r = ninjaSync(); r.ninja.zone2.temp_c = '200'; expectError(r, 'ninja.zone2.temp_c');
  r = ninjaSync(); r.ninja.zone1.minutes = 0; expectError(r, 'ninja.zone1.minutes');
  r = ninjaSync(); r.ninja.zone1.minutes = 12.5; expectError(r, 'ninja.zone1.minutes');
  r = ninjaSync(); delete r.ninja.zone1.minutes; expectError(r, 'ninja.zone1.minutes');
});

test('match wymaga identycznych ustawień stref (label może się różnić)', () => {
  const r = ninjaSync();
  r.ninja.mode = 'match';
  r.ninja.zone2 = { label: 'Inne', function: 'Air Fry', temp_c: 200, minutes: 20 };
  assert.deepEqual(validate(r), []);
  r.ninja.zone2.minutes = 15;
  expectError(r, 'ninja.zone2.minutes');
});

// --- E: TM6 ---

test('turn: poprawne warianty (flip / shake, required domyślnie, false = informacja)', () => {
  const r = ninjaSync(); // zone1: 20 min, zone2: 10 min
  r.ninja.zone1.turn = { action: 'flip', after_min: 10, required: true };
  r.ninja.zone2.turn = { action: 'shake', after_min: 5 };
  assert.deepEqual(validate(r), []);
  r.ninja.zone2.turn = { action: 'shake', after_min: 9, required: false };
  assert.deepEqual(validate(r), []);
});

test('turn: brak pola = bez obracania (stare przepisy bez zmian)', () => {
  const r = ninjaSync();
  assert.ok(!('turn' in r.ninja.zone1));
  assert.deepEqual(validate(r), []);
});

test('turn: błędne wartości', () => {
  const withTurn = (turn, zone = 'zone1') => { const r = ninjaSync(); r.ninja[zone].turn = turn; return r; };
  expectError(withTurn('po 10 min'), 'ninja.zone1.turn');
  expectError(withTurn({ after_min: 10 }), 'ninja.zone1.turn.action');
  expectError(withTurn({ action: 'obróć', after_min: 10 }), 'ninja.zone1.turn.action');
  expectError(withTurn({ action: 'Obróć', after_min: 10 }), 'ninja.zone1.turn.action');
  expectError(withTurn({ action: 'potrząśnij', after_min: 10 }), 'ninja.zone1.turn.action'); // stare słowa z v0.3 → kody
  expectError(withTurn({ action: 'Flip', after_min: 10 }), 'ninja.zone1.turn.action');
  expectError(withTurn({ action: 'turn', after_min: 10 }), 'ninja.zone1.turn.action');
  expectError(withTurn({ action: '', after_min: 10 }), 'ninja.zone1.turn.action');
  assert.match(validate(withTurn({ action: 'obróć', after_min: 10 })).join('\n'), /nieznana czynność "obróć" — dozwolone: flip, shake/);
  expectError(withTurn({ action: 'flip' }), 'ninja.zone1.turn.after_min');
  expectError(withTurn({ action: 'flip', after_min: 0 }), 'ninja.zone1.turn.after_min');
  expectError(withTurn({ action: 'flip', after_min: 7.5 }), 'ninja.zone1.turn.after_min');
  expectError(withTurn({ action: 'flip', after_min: 20 }), 'ninja.zone1.turn.after_min');      // = minutes strefy
  expectError(withTurn({ action: 'flip', after_min: 12 }, 'zone2'), 'ninja.zone2.turn.after_min'); // > 10 min strefy 2
  expectError(withTurn({ action: 'flip', after_min: 5, required: 'tak' }), 'ninja.zone1.turn.required');
  expectError(withTurn({ action: 'flip', after_min: 5, alarm: true }), 'ninja.zone1.turn.alarm');
  const errs = validate(withTurn({ action: 'flip', after_min: 25 }));
  assert.match(errs.join('\n'), /turn\.after_min: musi być mniejsze niż czas strefy \(20 min\), jest 25/);
});

test('turn: ścieżka po polsku na liście błędów', () => {
  assert.equal(describePath('ninja.zone2.turn.after_min'), 'Ninja → strefa 2 → obracanie → po ilu minutach');
});

test('tag tm6 bez kroków tm6 i kroki tm6 bez tagu', () => {
  let r = tm6(); r.steps.forEach((s) => delete s.tm6); expectError(r, 'tags');
  r = tm6(); r.tags = []; expectError(r, 'tags');
});

test('TM6: duration_seconds', () => {
  for (const v of [0, -1, 2.5, '30 s', undefined]) {
    const r = tm6();
    if (v === undefined) delete r.steps[0].tm6.duration_seconds; else r.steps[0].tm6.duration_seconds = v;
    expectError(r, 'steps[0].tm6.duration_seconds');
  }
});

test('TM6: temperature', () => {
  for (const v of [36, 121, 'varoma', 'VAROMA', '100', null]) {
    const r = tm6();
    r.steps[0].tm6.temperature = v;
    expectError(r, 'steps[0].tm6.temperature');
  }
  const r = tm6();
  delete r.steps[0].tm6.temperature; // bez grzania
  assert.deepEqual(validate(r), []);
});

test('TM6: speed', () => {
  for (const v of [0, 0.5, 11, 2.3, '7', 'lyzka', 'Turbo']) {
    const r = tm6();
    r.steps[0].tm6.speed = v;
    expectError(r, 'steps[0].tm6.speed');
  }
  for (const v of [1, 1.5, 10, 'spoon', 'turbo']) {
    const r = tm6();
    r.steps[0].tm6.speed = v;
    assert.deepEqual(validate(r), [], 'speed ' + v);
  }
});

test('TM6: speed wymagany tylko bez mode', () => {
  let r = tm6(); delete r.steps[0].tm6.speed; expectError(r, 'steps[0].tm6.speed');
  r = tm6(); delete r.steps[0].tm6.speed; r.steps[0].tm6.mode = 'Wyrabianie';
  assert.deepEqual(validate(r), []);
});

test('TM6: reverse musi być boolean', () => {
  for (const v of ['nie', 0, null]) {
    const r = tm6();
    r.steps[0].tm6.reverse = v;
    expectError(r, 'steps[0].tm6.reverse');
  }
});

test('oba urządzenia w jednym przepisie', () => {
  const r = ninjaSync();
  r.tags = ['ninja', 'tm6'];
  r.steps.push({ text: 'Sos.', tm6: { duration_seconds: 30, speed: 7 } });
  assert.deepEqual(validate(r), []);
});

// --- parsowanie pliku ---

test('front matter: brak, zły YAML, powtórzony klucz', () => {
  assert.ok(parseRecipeFile('title: x\n').error);
  assert.ok(parseRecipeFile('---\ntitle: [x\n---\n').error);
  assert.match(parseRecipeFile('---\ntitle: a\ntitle: b\n---\n').error, /YAML/);
});

test('błędy składni YAML po polsku, z numerem linii w pliku', () => {
  assert.equal(parseRecipeFile('---\nschema_version: 1\ntitle: Zupa: pomidorowa\n---\n').error,
    'niepoprawny YAML (linia 3): dwukropek w tekście bez cudzysłowu — weź cały tekst w cudzysłów "…" [Nested mappings are not allowed in compact mappings]');
  assert.match(parseRecipeFile('---\nservings: 2\nsteps:\n\t- text: a\n---\n').error, /^niepoprawny YAML \(linia 4\): wcięcie zrobione tabulatorem/);
  assert.match(parseRecipeFile('---\ntitle: "Zupa\n---\n').error, /brakuje znaku zamykającego/);
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

function tempRecipesDir(files) {
  const dir = mkdtempSync(join(tmpdir(), 'kitchen-test-'));
  for (const [name, content] of Object.entries(files)) {
    mkdirSync(dirname(join(dir, name)), { recursive: true });
    writeFileSync(join(dir, name), content);
  }
  return dir;
}

// Bez linii image — testy dopisują własne zdjęcie.
const DESSERT = readFileSync(join(FIXTURES, 'deser-twarogowy.md'), 'utf8').replace(/^image: .*\r?\n/m, '');
const withImage = (imagePath) => DESSERT.replace('schema_version: 1', 'schema_version: 1\nimage: ' + imagePath);

test('slug: niedozwolone znaki w nazwie pliku', () => {
  const { errors } = loadRecipes(tempRecipesDir({ 'Deser Twarogowy.md': DESSERT }));
  assert.ok(errors.some((e) => e.includes('(nazwa pliku)')), JSON.stringify(errors));
});

test('slug: wielkie litery w nazwie pliku nie przechodzą (więc nie ma duplikatów różniących się wielkością)', () => {
  const dir = tempRecipesDir({ 'deser.md': DESSERT, 'DESER.md': DESSERT });
  const { recipes, errors } = loadRecipes(dir);
  // Na Windows/macOS drugi plik nadpisze pierwszy — wtedy test nie ma czego sprawdzać.
  if (recipes.length + errors.length < 2) return;
  assert.deepEqual(recipes.map((r) => r.slug), ['deser']);
  assert.ok(errors.some((e) => e.startsWith('DESER.md → (nazwa pliku):')), JSON.stringify(errors));
});

test('loadRecipes: problems w formie dla strony (plik, ścieżka, opis po polsku, pominięty)', () => {
  const { recipes, problems } = loadRecipes(tempRecipesDir({ 'ok.md': DESSERT, 'zle.md': DESSERT.replace('servings: 2', 'servings: 0') }));
  assert.deepEqual(recipes.map((r) => r.slug), ['ok']);
  assert.deepEqual(problems, [{ file: 'zle.md', path: 'servings', where: 'porcje', reason: 'musi być >= 1, jest 0', skipped: true }]);
});

test('describePath: ścieżka pola po ludzku', () => {
  assert.equal(describePath('steps[2].tm6.speed'), 'krok 3 → TM6 → obroty');
  assert.equal(describePath('ingredients[0].amount'), 'składnik 1 → ilość');
  assert.equal(describePath('ninja.zone2.temp_c'), 'Ninja → strefa 2 → temperatura');
  assert.equal(describePath('tags[1]'), 'tag 2');
  assert.equal(describePath('(YAML)'), 'zapis pliku (YAML)');
  assert.equal(describePath('(nazwa pliku)'), 'nazwa pliku');
  assert.equal(describePath('kalorie'), '„kalorie”');
});

test('suggestSlug: propozycja nazwy pliku', () => {
  assert.equal(suggestSlug('Pierogi Ruskie'), 'pierogi-ruskie');
  assert.equal(suggestSlug('Łosoś z cukinią (Ninja)'), 'losos-z-cukinia-ninja');
  assert.equal(suggestSlug('  ŻUREK  '), 'zurek');
  assert.equal(suggestSlug('!!!'), 'nazwa-przepisu');
});

test('splitError: plik, ścieżka, przyczyna (dwukropek w przyczynie zostaje)', () => {
  assert.deepEqual(splitError('a.md → (YAML): niepoprawny YAML (linia 3): Nested mappings'),
    { file: 'a.md', path: '(YAML)', reason: 'niepoprawny YAML (linia 3): Nested mappings' });
});

test('imageKind: JPEG, PNG, HEIC, reszta odrzucona', () => {
  assert.equal(imageKind(Buffer.from([0xff, 0xd8, 0xff, 0xe0])), 'jpeg');
  assert.equal(imageKind(readFileSync(join(root, 'public', 'apple-touch-icon.png'))), 'png');
  assert.equal(imageKind(readFileSync(join(root, 'tests', 'fixtures', 'zdjecie.heic'))), 'heic');
  assert.equal(imageKind(Buffer.from('RIFF\0\0\0\0WEBPVP8 ')), null);
  assert.equal(imageKind(Buffer.from([0, 0, 0, 28, 0x66, 0x74, 0x79, 0x70, 0x61, 0x76, 0x69, 0x66])), null); // AVIF
});

test('findImageBySlug: rozszerzenie dowolną wielkością liter, JPEG przed PNG i HEIC', () => {
  const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0]);
  const dir = tempRecipesDir({ 'img/deser.PNG': jpeg, 'img/deser.jpeg': jpeg, 'img/zupa.HEIC': jpeg, 'img/deserowy.jpg': jpeg });
  assert.equal(findImageBySlug(dir, 'deser'), 'img/deser.jpeg');
  assert.equal(findImageBySlug(dir, 'zupa'), 'img/zupa.HEIC');
  assert.equal(findImageBySlug(dir, 'udka'), null);
  assert.equal(findImageBySlug(tempRecipesDir({ 'a.md': 'x' }), 'a'), null); // brak katalogu img/
});

test('zdjęcie po nazwie: przepis dostaje ścieżkę; zły plik → błąd, ale przepis zostaje', () => {
  const dir = tempRecipesDir({
    'deser.md': DESSERT, 'img/deser.JPG': Buffer.from([0xff, 0xd8, 0xff, 0xe0]),
    'zupa.md': DESSERT, 'img/zupa.png': Buffer.from('to nie jest png'),
  });
  const { recipes, problems } = loadRecipes(dir);
  assert.deepEqual(recipes.map((r) => [r.slug, r.image]), [['deser', 'img/deser.JPG'], ['zupa', null]]);
  assert.equal(problems.length, 1);
  assert.equal(problems[0].file, 'zupa.md');
  assert.equal(problems[0].skipped, false);
  assert.match(problems[0].reason, /zdjęcie po nazwie/);
});

// docs/FORMAT-PRZEPISU.md to ściąga dla ChatGPT/Codex — nie może rozjechać się z walidatorem.
test('docs/FORMAT-PRZEPISU.md: pierwsze zdanie, przykład przechodzi walidację, listy zgodne z walidatorem', () => {
  const doc = readFileSync(join(root, 'docs', 'FORMAT-PRZEPISU.md'), 'utf8').replace(/\r\n/g, '\n');
  assert.ok(doc.startsWith('Odpowiadaj samym plikiem .md gotowym do wklejenia, bez komentarzy.'));
  // Pełny przykład to blok yaml z komentarzem „# plik:" (inne bloki to fragmenty).
  const example = doc.split('```yaml\n').slice(1).map((b) => b.split('```')[0]).find((b) => b.includes('# plik: recipes/'));
  const fileName = /^# plik: recipes\/([a-z0-9-]+\.md)$/m.exec(example)[1];
  const { recipes, errors } = loadRecipes(tempRecipesDir({ [fileName]: example }));
  assert.deepEqual(errors, []);
  const r = recipes[0];
  assert.ok(r.data.ninja && r.data.steps.some((s) => s.tm6) && r.data.steps.some((s) => s.internal_temp_c), 'przykład pokazuje Ninja, TM6 i temperaturę w środku');
  assert.ok(r.data.ingredients.some((i) => i.group) && r.data.ingredients.some((i) => !('amount' in i)));
  NINJA_FUNCTIONS.forEach((f) => assert.ok(doc.includes('`' + f + '`'), 'brak funkcji Ninja w ściądze: ' + f));
  NINJA_MODES.forEach((m) => assert.ok(doc.includes('`' + m + '`'), 'brak trybu Ninja w ściądze: ' + m));
  TURN_ACTIONS.forEach((a) => assert.ok(doc.includes('`' + a + '`'), 'brak czynności turn w ściądze: ' + a));
  assert.ok(r.data.ninja.zone1.turn && r.data.ninja.zone2.turn.required === false, 'przykład pokazuje turn z alarmem i informacyjny');
  // Tłumaczenie EN kompletne (z grupami i opisami szuflad), jednostki tylko z listy.
  assert.equal(r.translated, true);
  assert.ok(r.data.translations.en.groups && r.data.translations.en.labels.zone2);
  r.data.ingredients.filter((i) => i.unit).forEach((i) => assert.ok(UNITS.includes(i.unit), i.unit));
  UNITS.forEach((u) => assert.ok(doc.includes('`' + u + '`'), 'brak jednostki w ściądze: ' + u));
  ['translations:', 'tm6_mode', 'labels:', 'groups:', 'recipes/tags.yml'].forEach((k) => assert.ok(doc.includes(k), 'brak w ściądze: ' + k));
});

test('pole image może wskazywać HEIC', () => {
  const heic = readFileSync(join(root, 'tests', 'fixtures', 'zdjecie.heic'));
  const { errors } = loadRecipes(tempRecipesDir({ 'a.md': withImage('img/a.heic'), 'img/a.heic': heic }));
  assert.deepEqual(errors, []);
});

test('w recipes/ tylko pliki .md (i tags.yml)', () => {
  const { errors } = loadRecipes(tempRecipesDir({ 'deser.md': DESSERT, 'notatki.txt': 'x', 'tags.yml': 'deser: dessert\n' }));
  assert.deepEqual(errors.map((e) => e.split(' → ')[0]), ['notatki.txt']);
});

test('image: poprawny JPEG i PNG przechodzą', () => {
  const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0]);
  const png = readFileSync(join(root, 'public', 'apple-touch-icon.png'));
  const { errors } = loadRecipes(tempRecipesDir({
    'a.md': withImage('img/a.jpg'), 'img/a.jpg': jpeg,
    'b.md': withImage('img/b.png'), 'img/b.png': png,
  }));
  assert.deepEqual(errors, []);
});

test('image: brak pliku, zły format, ścieżka poza img/', () => {
  const webp = Buffer.from('RIFF\0\0\0\0WEBPVP8 ');
  const { errors } = loadRecipes(tempRecipesDir({
    'a.md': withImage('img/brak.jpg'),
    'b.md': withImage('img/b.webp'), 'img/b.webp': webp,
    'c.md': withImage('img/c.jpg'), 'img/c.jpg': webp,
    'd.md': withImage('../public/apple-touch-icon.png'),
  }));
  for (const file of ['a.md', 'b.md', 'c.md', 'd.md']) {
    assert.ok(errors.some((e) => e.startsWith(file + ' → image:')), file + ': ' + JSON.stringify(errors));
  }
});

// --- G: jednostki (zawsze angielskie skróty) ---

test('jednostki: dozwolona lista przechodzi', () => {
  assert.deepEqual(UNITS, ['g', 'kg', 'ml', 'l', 'pcs', 'tbsp', 'tsp', 'pinch']);
  for (const u of UNITS) {
    const r = ninjaSync();
    r.ingredients[0].unit = u;
    assert.deepEqual(validate(r), [], u);
  }
});

test('jednostki: inne odrzucone, z podpowiedzią', () => {
  for (const u of ['szt', 'łyżka', 'łyżki', 'łyżeczka', 'szczypta', 'ząbek', 'G', 'Tbsp', 'gramy', 'kostka', 'pcs.']) {
    const r = ninjaSync();
    r.ingredients[0].unit = u;
    expectError(r, 'ingredients[0].unit');
  }
  const hint = (u) => { const r = ninjaSync(); r.ingredients[0].unit = u; return validate(r).join('\n'); };
  assert.match(hint('szt'), /nieznana jednostka "szt" — dozwolone: g, kg, ml, l, pcs, tbsp, tsp, pinch \(zamiast "szt" użyj "pcs"\)/);
  assert.match(hint('łyżki'), /użyj "tbsp"/);
  assert.match(hint('łyżeczka'), /użyj "tsp"/);
  assert.match(hint('szczypta'), /użyj "pinch"/);
  assert.match(hint('ML'), /użyj "ml"/);
  assert.doesNotMatch(hint('kostka'), /użyj/);
});

// --- H: tłumaczenie EN (translations.en) — tylko ostrzeżenia ---

// Przepis z grupami, opisami szuflad i trybem TM6 + kompletne tłumaczenie.
function translated() {
  const r = ninjaSync();
  r.description = 'Opis';
  r.tags = ['ninja', 'tm6'];
  r.ingredients = [
    { name: 'ziemniaki', amount: 500, unit: 'g', note: 'małe' },
    { name: 'oliwa', amount: 1, unit: 'tbsp', group: 'Marynata' },
    { name: 'sól', group: 'Marynata' },
  ];
  r.ninja.zone2.label = 'Brokuły';
  r.steps = [{ text: 'Piecz.' }, { text: 'Wyrabiaj.', tm6: { duration_seconds: 60, mode: 'Wyrabianie' } }];
  r.translations = { en: {
    title: 'Test Ninja EN',
    description: 'Description',
    ingredients: [{ name: 'potatoes', note: 'small' }, { name: 'olive oil' }, { name: 'salt' }],
    groups: { Marynata: 'Marinade' },
    steps: [{ text: 'Bake.' }, { text: 'Knead.', tm6_mode: 'Dough' }],
    labels: { zone1: 'Potatoes', zone2: 'Broccoli' },
  } };
  return r;
}
const tWarn = (data) => validateTranslations(data, { file: 'test.md' });
function expectWarning(data, fieldPath, reasonRe) {
  const warns = tWarn(data);
  assert.ok(warns.some((w) => w.startsWith('test.md → ' + fieldPath + ':') && (!reasonRe || reasonRe.test(w))),
    'oczekiwano ostrzeżenia dla "' + fieldPath + '", są: ' + JSON.stringify(warns, null, 2));
  assert.deepEqual(validate(data), [], 'tłumaczenie nigdy nie daje błędu');
}

test('tłumaczenie: kompletne — bez błędów i bez ostrzeżeń', () => {
  assert.deepEqual(validate(translated()), []);
  assert.deepEqual(tWarn(translated()), []);
});

test('tłumaczenie: brak bloku = ostrzeżenie, nie błąd', () => {
  const r = translated();
  delete r.translations;
  assert.deepEqual(validate(r), []);
  assert.deepEqual(tWarn(r), ['test.md → translations.en: brak tłumaczenia EN — w trybie EN przepis wyświetla się po polsku']);
  r.translations = {};
  expectWarning(r, 'translations.en', /brak tłumaczenia EN/);
});

test('tłumaczenie: niekompletne — brakujące pola', () => {
  let r = translated(); delete r.translations.en.title; expectWarning(r, 'translations.en.title', /brak tłumaczenia/);
  r = translated(); delete r.translations.en.description; expectWarning(r, 'translations.en.description');
  r = translated(); delete r.translations.en.ingredients; expectWarning(r, 'translations.en.ingredients');
  r = translated(); delete r.translations.en.steps; expectWarning(r, 'translations.en.steps');
  r = translated(); delete r.translations.en.ingredients[0].note; expectWarning(r, 'translations.en.ingredients[0].note');
  r = translated(); delete r.translations.en.steps[1].tm6_mode; expectWarning(r, 'translations.en.steps[1].tm6_mode');
  r = translated(); r.translations.en.steps[0].text = ''; expectWarning(r, 'translations.en.steps[0].text', /niepustym tekstem/);
  r = translated(); delete r.translations.en.groups; expectWarning(r, 'translations.en.groups', /"Marynata"/);
  r = translated(); r.translations.en.groups = { Sos: 'Sauce' };
  expectWarning(r, 'translations.en.groups', /brak tłumaczenia grupy "Marynata"/);
  expectWarning(r, 'translations.en.groups', /grupy "Sos" nie ma w ingredients/);
  r = translated(); delete r.translations.en.labels; expectWarning(r, 'translations.en.labels', /zone1, zone2/);
  r = translated(); delete r.translations.en.labels.zone2; expectWarning(r, 'translations.en.labels.zone2');
});

test('tłumaczenie: zła liczba pozycji (tyle samo i w tej samej kolejności)', () => {
  let r = translated(); r.translations.en.steps.pop();
  expectWarning(r, 'translations.en.steps', /tyle samo pozycji i w tej samej kolejności co steps \(2\), jest 1/);
  r = translated(); r.translations.en.ingredients.push({ name: 'pepper' });
  expectWarning(r, 'translations.en.ingredients', /\(3\), jest 4/);
});

test('tłumaczenie: zbędne pola, nieznane klucze i złe typy', () => {
  let r = translated(); delete r.description; expectWarning(r, 'translations.en.description', /oryginał nie ma description/);
  r = translated(); r.translations.en.ingredients[1].note = 'x'; expectWarning(r, 'translations.en.ingredients[1].note', /oryginał nie ma note/);
  r = translated(); r.translations.en.steps[0].tm6_mode = 'x'; expectWarning(r, 'translations.en.steps[0].tm6_mode');
  r = translated(); r.ninja.mode = 'single'; delete r.ninja.zone2; expectWarning(r, 'translations.en.labels.zone2', /oryginał nie ma/);
  r = translated(); r.translations.en.subtitle = 'x'; expectWarning(r, 'translations.en.subtitle', /nieznane pole/);
  r = translated(); r.translations.en.steps[0].tm6 = {}; expectWarning(r, 'translations.en.steps[0].tm6', /nieznane pole/);
  r = translated(); r.translations.de = { title: 'x' }; expectWarning(r, 'translations.de', /nieznany język/);
  r = translated(); r.translations = 'EN'; expectWarning(r, 'translations');
  r = translated(); r.translations.en.steps = 'Bake.'; expectWarning(r, 'translations.en.steps', /musi być listą/);
  r = translated(); r.translations.en.ingredients[0] = 'potatoes'; expectWarning(r, 'translations.en.ingredients[0]');
  r = translated(); r.translations.en.title = 5; expectWarning(r, 'translations.en.title');
});

test('tłumaczenie: ścieżka po polsku na liście ostrzeżeń', () => {
  assert.equal(describePath('translations.en.steps[2].text'), 'tłumaczenie → EN → krok 3 → treść');
  assert.equal(describePath('translations.en.labels.zone1'), 'tłumaczenie → EN → opisy szuflad → strefa 1');
});

// --- I: tagi i recipes/tags.yml ---

test('tags.yml: mapa tag PL → EN; złe wpisy pominięte z ostrzeżeniem', () => {
  assert.deepEqual(parseTagMap('# komentarz\nobiad: dinner\nwołowina: beef\n'), { map: { obiad: 'dinner', 'wołowina': 'beef' }, warnings: [] });
  assert.deepEqual(parseTagMap(''), { map: {}, warnings: [] });
  const bad = parseTagMap('Obiad: dinner\nzupa: Soup\nryby:\nkurczak: chicken\n');
  assert.deepEqual(bad.map, { kurczak: 'chicken' });
  assert.equal(bad.warnings.length, 3);
  assert.ok(bad.warnings.every((w) => w.startsWith('tags.yml → ')));
  assert.match(parseTagMap('obiad: [dinner\n').warnings[0], /^tags\.yml → \(YAML\): niepoprawny YAML/);
  assert.match(parseTagMap('- obiad\n').warnings[0], /musi być mapą/);
});

test('tagi: tłumaczenie z tags.yml, brakujące i tagi urządzeń bez zmian; ostrzeżenie tylko dla brakujących', () => {
  const map = { obiad: 'dinner', kurczak: 'chicken', ninja: 'XXX' };
  assert.deepEqual(translateTags(['ninja', 'tm6', 'kurczak', 'obiad', 'zupa'], map), ['ninja', 'tm6', 'chicken', 'dinner', 'zupa']);
  assert.deepEqual(tagWarnings(['ninja', 'tm6', 'kurczak', 'zupa'], map, { file: 'a.md' }),
    ['a.md → tags[3]: brak tłumaczenia tagu "zupa" w recipes/tags.yml']);
});

test('loadRecipes: ostrzeżenia osobno od błędów; przepis z ostrzeżeniem jest publikowany', () => {
  const ok = readFileSync(join(FIXTURES, 'deser-twarogowy.md'), 'utf8').replace(/\r\n/g, '\n').replace(/^image: .*\n/m, '');
  const noEn = ok.replace(/\ntranslations:[\s\S]*?\n---/, '\n---');
  const shortEn = ok.replace(/\n      - text: "Divide the cream into portions."/, '');
  const dir = tempRecipesDir({
    'ok.md': ok, 'bez-en.md': noEn, 'krotkie-en.md': shortEn, 'zly.md': noEn.replace('servings: 2', 'servings: 0'),
    'tags.yml': 'deser: dessert\nwysokobiałkowe: high-protein\n',
  });
  const { recipes, errors, problems, warnings, notices } = loadRecipes(dir);
  assert.deepEqual(recipes.map((r) => [r.slug, r.translated]), [['bez-en', false], ['krotkie-en', false], ['ok', true]]);
  assert.deepEqual(errors.map((e) => e.split(' → ')[0]), ['zly.md']);
  assert.equal(problems.length, 1);
  // bez-pieczenia nie ma w tags.yml → ostrzeżenie dla każdego przepisu; zły przepis nie dostaje ostrzeżeń.
  assert.deepEqual(notices.map((n) => n.file + ' ' + n.path), [
    'bez-en.md translations.en', 'bez-en.md tags[2]', 'krotkie-en.md translations.en.steps', 'krotkie-en.md tags[2]', 'ok.md tags[2]',
  ]);
  assert.deepEqual(notices[0], { file: 'bez-en.md', path: 'translations.en', where: 'tłumaczenie → EN',
    reason: 'brak tłumaczenia EN — w trybie EN przepis wyświetla się po polsku' });
  assert.equal(warnings.length, notices.length);
});
