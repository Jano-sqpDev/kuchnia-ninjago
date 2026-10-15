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

// ── słownik pl / en ──

test('słownik: oba języki mają te same klucze, bez pustych napisów', () => {
  const pl = K.I18N.pl, en = K.I18N.en;
  assert.deepEqual(plain(K.LANGS), ['pl', 'en']);
  assert.deepEqual(Object.keys(en).sort(), Object.keys(pl).sort());
  Object.keys(pl).forEach((k) => {
    if (Array.isArray(pl[k])) {
      assert.equal(pl[k].length, 3, 'pl.' + k + ': odmiana [1, 2–4, 5+]');
      assert.equal(en[k].length, 2, 'en.' + k + ': odmiana [1, inne]');
      pl[k].concat(en[k]).forEach((v) => assert.ok(typeof v === 'string' && v.trim(), k));
    } else {
      assert.ok(typeof pl[k] === 'string' && pl[k].trim(), 'pl.' + k);
      assert.ok(typeof en[k] === 'string' && en[k].trim(), 'en.' + k);
      // Te same wstawiane wartości ({n}, {total}…) w obu językach — poza {servings}, którego PL nie potrzebuje.
      const marks = (v) => (v.match(/\{\w+\}/g) || []).filter((m) => m !== '{servings}').sort();
      assert.deepEqual(marks(en[k]), marks(pl[k]), k);
    }
  });
});

test('słownik: każdy klucz użyty w app.js istnieje (T, TN, tr, trn i mapy kluczy)', () => {
  const used = new Set();
  for (const m of js.matchAll(/\b(?:T|TN)\('([A-Za-z]+)'/g)) used.add(m[1]);
  for (const m of js.matchAll(/\btrn?\(lang, '([A-Za-z]+)'/g)) used.add(m[1]);
  Object.values(K.ACTIONS).forEach((a) => Object.values(a).forEach((k) => used.add(k)));
  Object.values(K.WHEN).forEach((k) => used.add(k));
  ['statusIdle', 'statusRunning', 'statusPaused', 'modeSync', 'modeSyncHint', 'modeMatch', 'modeMatchHint', 'modeIndependent', 'modeIndependentHint',
    'warningsIntro', 'problemsIntro'].forEach((k) => used.add(k));
  assert.ok(used.size > 50, 'skaner znalazł za mało kluczy: ' + used.size);
  used.forEach((k) => assert.ok(k in K.I18N.pl && k in K.I18N.en, 'brak klucza w słowniku: ' + k));
  // W kodzie widoku nie zostały polskie napisy poza słownikiem (komentarze pomijamy).
  const viewStart = js.indexOf('// ───────── przeglądarka');
  assert.ok(viewStart > 0, 'brak znacznika sekcji przeglądarki w app.js');
  const view = js.slice(viewStart).replace(/\/\/.*$/gm, '');
  ['Przepisy', 'Wczytywanie', 'Zrobione', 'porcj', 'Strefa', 'Składniki', 'OBRÓĆ', 'Zamknij'].forEach((w) => assert.ok(!view.includes(w), 'napis poza słownikiem: ' + w));
});

test('słownik: tr / trn — wstawianie wartości, odmiana PL tylko w PL, EN 1 / wiele', () => {
  assert.equal(K.tr('pl', 'tm6Step', { n: 2, total: 5 }), 'Krok <b>2</b> z 5');
  assert.equal(K.tr('en', 'tm6Step', { n: 2, total: 5 }), 'Step <b>2</b> of 5');
  assert.equal(K.tr('xx', 'recipes'), 'Przepisy');           // nieznany język → PL
  assert.equal(K.normalizeLang('en'), 'en');
  assert.equal(K.normalizeLang(null), 'pl');
  assert.equal(K.normalizeLang('EN'), 'pl');
  assert.equal(K.servingsWord(1, 'en'), 'serving');
  assert.equal(K.servingsWord(2, 'en'), 'servings');
  assert.equal(K.servingsWord(5, 'en'), 'servings');
  assert.equal(K.servingsWord(22, 'pl'), 'porcje');
  assert.equal(K.problemsLabel(1, 'en'), '1 recipe with an error');
  assert.equal(K.problemsLabel(3, 'en'), '3 recipes with errors');
  assert.equal(K.warningsLabel(1), '1 przepis bez tłumaczenia EN');
  assert.equal(K.warningsLabel(2), '2 przepisy bez tłumaczenia EN');
  assert.equal(K.warningsLabel(5), '5 przepisów bez tłumaczenia EN');
  assert.equal(K.warningsLabel(2, 'en'), '2 recipes without English translation');
  assert.equal(K.tr('en', 'ninjaFor', { n: 1, servings: K.servingsWord(1, 'en') }), 'Ninja settings are for 1 serving.');
  assert.equal(K.tr('pl', 'ninjaFor', { n: 4, servings: 'x' }), 'Ustawienia Ninja są dla 4 porcji.');
  assert.equal(K.tr('en', 'turnRequired', { action: 'FLIP', n: 14 }), 'FLIP AT 14 MIN');
  assert.equal(K.tr('pl', 'turnOptional', { action: 'można obrócić', n: 14 }), 'można obrócić po 14 min');
  assert.equal(K.decimal(75.5, 'en'), '75.5');
  assert.equal(K.decimal(75.5), '75,5');
});

// ── przepis w danym języku: tłumaczenie albo fallback PL ──
const RECIPE = {
  id: 'udka', title: 'Udka', description: 'Opis', servings: 4, tags: ['ninja', 'tm6', 'kurczak'], tags_en: ['ninja', 'tm6', 'chicken'],
  ingredients: [
    { name: 'udka', amount: 8, unit: 'pcs' },
    { name: 'oliwa', amount: 2, unit: 'tbsp', group: 'Marynata', note: 'extra' },
    { name: 'sól', group: 'Marynata' },
  ],
  ninja: { mode: 'sync', zone1: { label: 'Udka', function: 'Roast', temp_c: 200, minutes: 28 }, zone2: { function: 'Air Fry', temp_c: 200, minutes: 20 } },
  steps: [{ text: 'Piecz.', internal_temp_c: 75 }, { text: 'Sos.', tm6: { duration_seconds: 30, speed: 7, mode: 'Mieszanie' } }],
  translations: { en: {
    title: 'Chicken legs', description: 'Description',
    ingredients: [{ name: 'chicken legs' }, { name: 'olive oil', note: 'extra virgin' }, { name: 'salt' }],
    groups: { Marynata: 'Marinade' }, steps: [{ text: 'Roast.' }, { text: 'Sauce.', tm6_mode: 'Mixing' }], labels: { zone1: 'Chicken' },
  } },
};

test('localizeRecipe: PL — oryginał', () => {
  const L = plain(K.localizeRecipe(RECIPE, 'pl'));
  assert.equal(L.title, 'Udka');
  assert.equal(L.fallback, false);
  assert.deepEqual(L.tags, ['ninja', 'tm6', 'kurczak']);
  assert.deepEqual(L.ingredients[1], { amount: 2, unit: 'tbsp', name: 'oliwa', note: 'extra', groupKey: 'Marynata', group: 'Marynata' });
  assert.equal(L.steps[1].tm6Mode, 'Mieszanie');
  assert.equal(L.labels.zone1, 'Udka');
});

test('localizeRecipe: EN z tłumaczeniem — teksty EN, ilości, jednostki i ustawienia z oryginału', () => {
  const L = plain(K.localizeRecipe(RECIPE, 'en'));
  assert.deepEqual([L.title, L.description, L.fallback], ['Chicken legs', 'Description', false]);
  assert.deepEqual(L.tags, ['ninja', 'tm6', 'chicken']);
  assert.deepEqual(L.ingredients[1], { amount: 2, unit: 'tbsp', name: 'olive oil', note: 'extra virgin', groupKey: 'Marynata', group: 'Marinade' });
  assert.deepEqual(L.ingredients[0], { amount: 8, unit: 'pcs', name: 'chicken legs' });
  assert.deepEqual(L.steps.map((s) => s.text), ['Roast.', 'Sauce.']);
  assert.equal(L.steps[0].internal_temp_c, 75);
  assert.equal(L.steps[1].tm6.speed, 7);
  assert.equal(L.steps[1].tm6Mode, 'Mixing');
  assert.equal(L.labels.zone1, 'Chicken');
  assert.equal(L.labels.zone2, undefined);
});

test('localizeRecipe: EN bez tłumaczenia (albo z niepasującym) — fallback PL, tagi EN z tags.yml', () => {
  const noEn = Object.assign({}, RECIPE);
  delete noEn.translations;
  const L = plain(K.localizeRecipe(noEn, 'en'));
  assert.deepEqual([L.title, L.fallback, L.steps[0].text, L.ingredients[1].group], ['Udka', true, 'Piecz.', 'Marynata']);
  assert.deepEqual(L.tags, ['ninja', 'tm6', 'chicken']);
  const broken = JSON.parse(JSON.stringify(RECIPE));
  broken.translations.en.steps.pop();
  assert.equal(K.localizeRecipe(broken, 'en').fallback, true);
  assert.equal(K.localizeRecipe(broken, 'en').title, 'Udka');
  assert.equal(K.localizeRecipe(noEn, 'pl').fallback, false);   // w PL nie ma znaczka
});

test('entryView: lista w obu językach, fallback PL bez title_en', () => {
  const it = { id: 'a', title: 'Udka', title_en: 'Chicken legs', tags: ['kurczak'], tags_en: ['chicken'] };
  assert.deepEqual(plain(K.entryView(it, 'en')), { title: 'Chicken legs', tags: ['chicken'], fallback: false });
  assert.deepEqual(plain(K.entryView(it, 'pl')), { title: 'Udka', tags: ['kurczak'], fallback: false });
  assert.deepEqual(plain(K.entryView({ id: 'b', title: 'Zupa', tags: ['zupa'] }, 'en')), { title: 'Zupa', tags: ['zupa'], fallback: true });
});

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

test('przeliczanie ilości: bez zmiany porcji wartość z przepisu (PL przecinek, EN kropka)', () => {
  assert.equal(K.scaledAmount(500, 'g', 1), '500');
  assert.equal(K.scaledAmount(1.5, 'pcs', 1), '1½');
  assert.equal(K.scaledAmount(0.25, 'tsp', 1), '0,25');
  assert.equal(K.scaledAmount(0.25, 'tsp', 1, 'en'), '0.25');
  assert.equal(K.scaledAmount(1.5, 'kg', 1), '1,5');
  assert.equal(K.scaledAmount(1.5, 'kg', 1, 'en'), '1.5');
  assert.equal(K.scaledAmount(1.5, 'l', 1, 'pl'), '1,5');
});

test('przeliczanie ilości: pcs / tbsp / tsp / pinch do połówek', () => {
  assert.equal(K.scaledAmount(8, 'pcs', 3 / 4), '6');
  assert.equal(K.scaledAmount(1, 'tsp', 3 / 4), '1');           // 0,75 → 1
  assert.equal(K.scaledAmount(1, 'tsp', 1 / 4), '½');           // nigdy mniej niż ½
  assert.equal(K.scaledAmount(2, 'tbsp', 5 / 4), '2½');
  assert.equal(K.scaledAmount(3, 'pcs', 1 / 2), '1½');
  assert.equal(K.scaledAmount(1, 'pinch', 3 / 2), '1½');
  assert.equal(K.scaledAmount(1, 'pinch', 1 / 4, 'en'), '½');
  assert.equal(K.scaledAmount(1.5, 'kg', 3 / 2), '2,3');         // kg / l — jedno miejsce po przecinku
  assert.equal(K.scaledAmount(1.5, 'kg', 3 / 2, 'en'), '2.3');
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
  assert.equal(K.tm6Speed(1.5, 'en'), '1.5');
  assert.equal(K.tm6Speed('spoon'), 'łyżka');
  assert.equal(K.tm6Speed('spoon', 'en'), 'spoon');
  assert.equal(K.tm6Speed('turbo', 'en'), 'Turbo');
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
  assert.ok(js.includes("LANG_KEY = 'kitchen-lang'"));
  assert.ok(js.includes("LEGACY_KEYS = { state: 'kuchnia-stan', theme: 'kuchnia-motyw', reload: 'kuchnia-przeladowanie' }"));
  assert.ok(js.includes('migrateStorage();'));
});

// ── timer Ninja (tylko czynności obróć / potrząśnij; końca pilnuje Ninja) ──
const MIN = 60000;
const T0 = 1700000000000;
const at = (min) => T0 + min * MIN;
const zone = (minutes, turn, label) => Object.assign({ function: 'Air Fry', temp_c: 200, minutes }, label ? { label } : {}, turn ? { turn } : {});
const flip = (after_min, required) => Object.assign({ action: 'flip', after_min }, required === undefined ? {} : { required });
const shake = (after_min, required) => Object.assign({ action: 'shake', after_min }, required === undefined ? {} : { required });
// Kolejka jako [[czas w min, 'id+id'], ...] — czytelne porównania.
const queue = (plan) => plain(K.timerQueue(plan)).map((g) => [g.at / MIN, g.events.map((e) => e.id).join('+')]);
const target = (plan, elapsedMin, acked) => {
  const g = K.timerTarget(plan, elapsedMin * MIN, acked || []);
  return g ? [g.at / MIN, g.events.map((e) => e.id).join('+')] : null;
};
const elapsedMin = (t, min) => K.timerElapsed(t, at(min)) / MIN;
const dueIds = (t, min) => { const d = K.timerDue(t, at(min)); return d ? d.events.map((e) => e.id).join('+') : null; };
// Udka 28 min (obróć po 14) + ziemniaki 22 min (potrząśnij po 11) w SYNC → czynności w 14. i 17. minucie.
const UDKA = { mode: 'sync', zone1: zone(28, flip(14), 'Udka'), zone2: zone(22, shake(11), 'Ziemniaki') };

test('timer: tylko przepisy z turn (bez turn — brak timera)', () => {
  assert.equal(K.hasTurns({ mode: 'sync', zone1: zone(22), zone2: zone(10) }), false);
  assert.equal(K.hasTurns({ mode: 'single', zone1: zone(19) }), false);
  assert.equal(K.hasTurns({ mode: 'single', zone1: zone(19, flip(9)) }), true);
  assert.equal(K.hasTurns({ mode: 'sync', zone1: zone(22), zone2: zone(10, shake(5, false)) }), true);
  assert.equal(K.hasTurns(undefined), false);
  assert.deepEqual(plain(K.timerPlan({ mode: 'sync', zone1: zone(22), zone2: zone(10) })).events, []);
});

test('timer: plan SYNC z różnymi czasami — czynność krótszej strefy przesunięta o różnicę; bez zdarzenia końca', () => {
  const plan = plain(K.timerPlan(UDKA));
  assert.equal(plan.total, 28 * MIN);
  assert.deepEqual(plan.events, [
    { id: 'turn1', kind: 'turn', at: 14 * MIN, no: 1, label: 'Udka', action: 'flip', required: true },
    { id: 'turn2', kind: 'turn', at: (6 + 11) * MIN, no: 2, label: 'Ziemniaki', action: 'shake', required: true },
  ]);
  // Opisy szuflad z tłumaczenia EN trafiają do planu (alarm na liście też je zna).
  assert.deepEqual(plain(K.timerPlan(UDKA, { zone1: 'Chicken legs', zone2: 'Potatoes' })).events.map((e) => e.label_en), ['Chicken legs', 'Potatoes']);
});

test('timer: kolejka — single, match, sync, kilka turn, równoczesne; nigdy zdarzenia końca', () => {
  assert.deepEqual(queue(K.timerPlan({ mode: 'single', zone1: zone(19, flip(9)) })), [[9, 'turn1']]);
  assert.deepEqual(queue(K.timerPlan({ mode: 'match', zone1: zone(10, flip(6)), zone2: zone(10, flip(6)) })), [[6, 'turn1+turn2']]);
  assert.deepEqual(queue(K.timerPlan({ mode: 'sync', zone1: zone(30, flip(20)), zone2: zone(12, shake(4)) })), [[20, 'turn1'], [22, 'turn2']]);
  assert.deepEqual(queue(K.timerPlan({ mode: 'sync', zone1: zone(28, flip(14)), zone2: zone(20, shake(6)) })), [[14, 'turn1+turn2']]);
  assert.deepEqual(queue(K.timerPlan({ mode: 'independent', zone1: zone(30), zone2: zone(12, shake(6, false)) })), [[6, 'turn2']]);
});

test('timer: napisy nad licznikiem i w alarmie (PL i EN)', () => {
  const g = (events) => ({ at: 0, events });
  const ev = (no, action, required, label, labelEn) => Object.assign({ id: 'turn' + no, kind: 'turn', at: 0, no, action, required },
    label ? { label } : {}, labelEn ? { label_en: labelEn } : {});
  assert.equal(K.groupTitle(g([ev(1, 'flip', true)]), 'in'), 'OBRÓĆ ZA');
  assert.equal(K.groupTitle(g([ev(1, 'flip', true)]), 'at'), 'OBRÓĆ PO');
  assert.equal(K.groupTitle(g([ev(1, 'shake', true)]), 'now'), 'POTRZĄŚNIJ TERAZ');
  assert.equal(K.groupTitle(g([ev(1, 'flip', false)]), 'in'), 'można obrócić za');
  assert.equal(K.groupTitle(g([ev(1, 'shake', false)]), 'in'), 'można potrząsnąć za');
  assert.equal(K.groupTitle(g([ev(1, 'flip', true)]), 'in', 'en'), 'FLIP IN');
  assert.equal(K.groupTitle(g([ev(1, 'flip', true)]), 'at', 'en'), 'FLIP AT');
  assert.equal(K.groupTitle(g([ev(1, 'shake', true)]), 'now', 'en'), 'SHAKE NOW');
  assert.equal(K.groupTitle(g([ev(1, 'shake', false)]), 'in', 'en'), 'optional shake in');
  const same = g([ev(1, 'flip', true, 'Udka', 'Chicken legs'), ev(2, 'flip', true, 'Skrzydełka')]);
  assert.equal(K.groupTitle(same, 'now'), 'OBRÓĆ TERAZ');
  assert.deepEqual(plain(K.groupZones(same)), ['Strefa 1 · Udka', 'Strefa 2 · Skrzydełka']);
  // EN: etykieta z tłumaczenia; bez tłumaczenia — polska.
  assert.deepEqual(plain(K.groupZones(same, 'en')), ['Zone 1 · Chicken legs', 'Zone 2 · Skrzydełka']);
  const mixed = g([ev(1, 'flip', true, 'Udka'), ev(2, 'shake', false, 'Frytki')]);
  assert.equal(K.groupTitle(mixed, 'in'), 'OBRÓĆ / POTRZĄŚNIJ ZA');
  assert.equal(K.groupTitle(mixed, 'in', 'en'), 'FLIP / SHAKE IN');
  assert.deepEqual(plain(K.groupZones(mixed)), ['Strefa 1 · Udka — obróć', 'Strefa 2 · Frytki — potrząśnij']);
  assert.deepEqual(plain(K.groupZones(g([ev(1, 'flip', true)]), 'en')), ['Zone 1']);
});

test('timer: licznik do kolejnych czynności, po ostatniej „—" (target null, status done)', () => {
  const plan = K.timerPlan(UDKA);
  assert.deepEqual(target(plan, 0), [14, 'turn1']);      // przed startem: OBRÓĆ PO 14:00
  assert.deepEqual(target(plan, 14), [17, 'turn2']);     // moment minął → następna czynność
  assert.equal(target(plan, 17), null);                  // po ostatniej czynności: „—"
  let t = K.timerStart(plan, T0);
  t = K.timerAck(t, ['turn1'], at(14));
  t = K.timerAck(t, ['turn2'], at(17));
  assert.equal(K.timerStatus(t, at(17)), 'done');
  assert.equal(K.timerDue(t, at(30)), null);             // żadnego alarmu końca
  assert.equal(K.timerStatus(null, T0), 'idle');
});

test('timer: czas z zegara; ręczna pauza i wznowienie', () => {
  const plan = K.timerPlan({ mode: 'single', zone1: zone(20, flip(15)) });
  let t = K.timerStart(plan, T0);
  assert.equal(K.timerStatus(t, T0), 'running');
  assert.equal(elapsedMin(t, 5), 5);
  t = K.timerPause(t, at(5));
  assert.equal(K.timerStatus(t, at(9)), 'paused');
  assert.equal(elapsedMin(t, 9), 5);                      // w pauzie czas stoi
  assert.equal(K.timerPause(t, at(10)), t);
  t = K.timerResume(t, at(9));                            // 4 min pauzy
  assert.equal(t.pausedTotal, 4 * MIN);
  assert.equal(elapsedMin(t, 12), 8);
  assert.equal(K.clock(15 * MIN - K.timerElapsed(t, at(12))), '07:00');
});

test('timer: zegar MM:SS (sekundy w górę)', () => {
  assert.equal(K.clock(28 * MIN), '28:00');
  assert.equal(K.clock(61000), '01:01');
  assert.equal(K.clock(1), '00:01');
  assert.equal(K.clock(0), '00:00');
  assert.equal(K.clock(-500), '00:00');
});

test('kompensacja szuflady: szybkie „Zrobione" — czas od alarmu do potwierdzenia jak pauza', () => {
  let t = K.timerStart(K.timerPlan(UDKA), T0);
  assert.equal(dueIds(t, 14), 'turn1');
  assert.equal(elapsedMin(t, 14.5), 14);                  // szuflada wysunięta: odliczanie stoi
  t = K.timerAck(t, ['turn1'], at(14.5));                 // „Zrobione" po 30 s
  assert.equal(t.holds.turn1, 0.5 * MIN);
  assert.equal(elapsedMin(t, 15), 14.5);
  assert.equal(dueIds(t, 17), null);                      // potrząśnięcie przesunięte o 30 s…
  assert.equal(dueIds(t, 17.5), 'turn2');                 // …na 17,5 min czasu zegara
  assert.equal(K.clock(K.timerTarget(t.plan, K.timerElapsed(t, at(15)), t.acked).at - K.timerElapsed(t, at(15))), '02:30');
});

test('kompensacja szuflady: brak „Zrobione" w 2 min → 30 s postoju, alarm dalej widoczny', () => {
  let t = K.timerStart(K.timerPlan(UDKA), T0);
  assert.equal(elapsedMin(t, 15.9), 14);                  // do 2 min czekamy
  assert.equal(elapsedMin(t, 16), 14);                    // dokładnie 2 min — nadal postój
  assert.equal(elapsedMin(t, 16.1), 15.6);                // po 2 min: przyjęte 30 s, liczy dalej
  assert.equal(dueIds(t, 16.1), 'turn1');                 // alarm nadal czeka na potwierdzenie
  t = K.timerAck(t, ['turn1'], at(16.5));                 // spóźnione „Zrobione"
  assert.equal(t.holds.turn1, 0.5 * MIN);                 // zostaje 30 s, nie 2,5 min
  assert.equal(elapsedMin(t, 16.5), 16);
  assert.equal(dueIds(t, 17.5), 'turn2');
});

test('kompensacja szuflady: czynność bez alarmu (required: false) — bez postoju', () => {
  const t = K.timerStart(K.timerPlan({ mode: 'sync', zone1: zone(28, flip(14, false)), zone2: zone(22, shake(11)) }), T0);
  assert.equal(dueIds(t, 14.5), null);
  assert.equal(elapsedMin(t, 14.5), 14.5);
  assert.equal(dueIds(t, 17), 'turn2');
});

test('kompensacja szuflady: powrót z tła po obu czynnościach — zaległe alarmy po kolei, po 30 s postoju każdy', () => {
  let t = K.timerStart(K.timerPlan(UDKA), T0);
  // ekran zgaszony od 13. do 20. minuty, nikt nie potwierdzał
  assert.equal(elapsedMin(t, 20), 19);                    // 30 s za obrócenie + 30 s za potrząśnięcie
  assert.equal(dueIds(t, 20), 'turn1');
  t = K.timerAck(t, ['turn1'], at(20));
  assert.equal(t.holds.turn1, 0.5 * MIN);
  assert.equal(dueIds(t, 20), 'turn2');
  t = K.timerAck(t, ['turn2'], at(20));
  assert.equal(t.holds.turn2, 0.5 * MIN);
  assert.equal(dueIds(t, 20), null);
  assert.equal(K.timerStatus(t, at(20)), 'done');
  assert.deepEqual(plain(K.timerAck(t, ['turn1'], at(21))).acked, ['turn1', 'turn2']); // bez duplikatów
});

test('kompensacja szuflady: SYNC — przesunięcie strefy i postój sumują się; ręczna pauza w trakcie postoju', () => {
  let t = K.timerStart(K.timerPlan({ mode: 'sync', zone1: zone(30, flip(20)), zone2: zone(12, shake(4)) }), T0);
  // czynności w 20. i 22. minucie (strefa 2 startuje po 18 min)
  t = K.timerAck(t, ['turn1'], at(21));                   // minuta postoju przy obróceniu
  assert.equal(dueIds(t, 22.9), null);
  assert.equal(dueIds(t, 23), 'turn2');
  // ręczna pauza nie zmienia postoju
  let p = K.timerStart(K.timerPlan(UDKA), T0);
  p = K.timerPause(p, at(14.25));                         // pauza 15 s po alarmie
  p = K.timerResume(p, at(20));
  p = K.timerAck(p, ['turn1'], at(20.25));                // 15 s + 15 s czasu „surowego"
  assert.equal(p.holds.turn1, 0.5 * MIN);
});

test('timer: równoczesne czynności (MATCH) — jeden alarm, jeden postój', () => {
  let t = K.timerStart(K.timerPlan({ mode: 'match', zone1: zone(10, flip(5), 'Kotlety (2 szt.)'), zone2: zone(10, flip(5), 'Kotlety (2 szt.)') }), T0);
  assert.deepEqual(plain(K.groupZones(K.timerDue(t, at(5)))), ['Strefa 1 · Kotlety (2 szt.)', 'Strefa 2 · Kotlety (2 szt.)']);
  t = K.timerAck(t, ['turn1', 'turn2'], at(5.5));
  assert.deepEqual(plain(t.holds), { turn1: 0.5 * MIN });
  assert.equal(K.timerStatus(t, at(6)), 'done');
});

test('timer w localStorage: przetrwa normalizeState; zapisy z v0.3/v0.3.1 (koniec, polskie słowa) odrzucone', () => {
  const plan = plain(K.timerPlan({ mode: 'single', zone1: zone(19, flip(9)) }));
  const timer = plain(K.timerAck(K.timerStart(plan, T0), ['turn1'], at(9.5)));
  const s = plain(K.normalizeState({ openRecipe: 'piers', recipes: { piers: { step: 1, servings: null, title: 'Pierś', steps: 4, t: 1, timer } } }));
  assert.deepEqual(s.recipes.piers.timer, timer);
  const bad = plain(K.normalizeState({ recipes: { a: { step: 0, timer: { plan: { total: 'x' } } }, b: { step: 0 } } }));
  assert.ok(!('timer' in bad.recipes.a) && !('timer' in bad.recipes.b));
  assert.equal(K.normalizeTimer(Object.assign({}, timer, { pausedAt: undefined })), null);
  assert.equal(K.normalizeTimer(null), null);
  const withEnd = JSON.parse(JSON.stringify(timer));
  withEnd.plan.events.push({ id: 'end', kind: 'end', at: 19 * MIN, no: 1, action: '', required: true });
  assert.equal(K.normalizeTimer(withEnd), null);
  const polish = JSON.parse(JSON.stringify(timer));
  polish.plan.events[0].action = 'obróć';
  assert.equal(K.normalizeTimer(polish), null);
  const oldNoHolds = JSON.parse(JSON.stringify(timer));
  delete oldNoHolds.holds;
  assert.deepEqual(plain(K.normalizeTimer(oldNoHolds)).holds, {});
  const badNo = JSON.parse(JSON.stringify(timer));
  badNo.plan.events[0].no = 3;
  assert.equal(K.normalizeTimer(badNo), null);
});

test('timer z v0.3.2 (gotowy polski napis zone): przeniesiony do no / label, działa dalej', () => {
  const old = {
    plan: { total: 28 * MIN, events: [
      { id: 'turn1', kind: 'turn', at: 14 * MIN, zone: 'Strefa 1 · Udka', action: 'flip', required: true },
      { id: 'turn2', kind: 'turn', at: 17 * MIN, zone: 'Strefa 2', action: 'shake', required: false },
    ] },
    startedAt: T0, pausedAt: null, pausedTotal: 0, acked: ['turn1'], holds: { turn1: 20000 },
  };
  const t = plain(K.normalizeTimer(old));
  assert.deepEqual(t.plan.events, [
    { id: 'turn1', kind: 'turn', at: 14 * MIN, no: 1, label: 'Udka', action: 'flip', required: true },
    { id: 'turn2', kind: 'turn', at: 17 * MIN, no: 2, action: 'shake', required: false },
  ]);
  assert.deepEqual([t.acked, t.holds, t.startedAt], [['turn1'], { turn1: 20000 }, T0]);
  assert.deepEqual(plain(K.groupZones({ at: 0, events: t.plan.events }, 'en')), ['Zone 1 · Udka — flip', 'Zone 2 — shake']);
  const s = plain(K.normalizeState({ recipes: { udka: { step: 2, timer: old } } }));
  assert.equal(s.recipes.udka.timer.plan.events[0].label, 'Udka');
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
