// Kalendarz lunchów (Etap 11, v0.11): walidacja recipes/calendar.yml, calendar.json z buildu, daty po stronie iPada
// (lokalna strefa Europe/London — północ, zmiana czasu, przełom miesiąca i roku), zakresy tygodnia i miesiąca PL / EN,
// podtytuł „Lunch: …”, powrót z przepisu do kalendarza, zapamiętany widok Tydzień / Miesiąc.
// Strefa iPada — ustawiona przed pierwszym użyciem dat w tym procesie (każdy plik testów to osobny proces).
process.env.TZ = 'Europe/London';

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, cpSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateCalendar, loadRecipes, describeCalendarPath, isCalendarDate, CALENDAR_FILE } from '../tools/validate.mjs';
import { calendarJson } from '../tools/output.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const FIXTURES = join(root, 'tests', 'fixtures', 'recipes');
const js = readFileSync(join(root, 'src', 'app.js'), 'utf8');
const css = readFileSync(join(root, 'src', 'app.css'), 'utf8');
const context = {};
runInNewContext(js, context);
const K = context.kitchenTest;
const plain = (v) => JSON.parse(JSON.stringify(v));

const OPTS = { recipes: ['falafele', 'chicken-parmigiana', 'udka'], files: ['falafele', 'chicken-parmigiana', 'udka', 'zepsuty'] };
const cal = (text) => validateCalendar(text, OPTS);
const paths = (errors) => errors.map((e) => e.split(' → ')[1].split(': ')[0]);

// ── walidacja calendar.yml ──

test('kalendarz: poprawne wpisy — slug albo { recipe, note }, posortowane po dacie; komentarze i pusty plik', () => {
  const r = cal('# komentarz\n2026-11-14: { recipe: chicken-parmigiana, note: "podwójna porcja" }\n2026-11-13: falafele\n');
  assert.deepEqual(r.errors, []);
  assert.deepEqual(plain(r.entries), {
    '2026-11-13': { recipe: 'falafele' },
    '2026-11-14': { recipe: 'chicken-parmigiana', note: 'podwójna porcja' },
  });
  assert.deepEqual(Object.keys(r.entries), ['2026-11-13', '2026-11-14']);
  assert.deepEqual(cal('# tylko komentarz\n'), { entries: {}, errors: [] });
  assert.deepEqual(cal(''), { entries: {}, errors: [] });
  // Daty to zwykłe napisy (YAML nie zamienia ich na obiekty Date), w cudzysłowie też działają.
  assert.deepEqual(plain(cal('"2026-11-13": falafele\n').entries), { '2026-11-13': { recipe: 'falafele' } });
});

test('kalendarz: zła data — błąd wpisu z podpowiedzią, wpisu nie ma (nie da się go umieścić)', () => {
  const r = cal('2026-13-01: falafele\n2026-02-30: falafele\n14.11.2026: falafele\n20261114: falafele\n2026-11-15: udka\n');
  assert.deepEqual(paths(r.errors), ['2026-13-01', '2026-02-30', '14.11.2026', '20261114']);
  assert.match(r.errors[0], /nie ma takiego dnia — zapisz datę jako RRRR-MM-DD/);
  assert.match(r.errors[2], /zła data — zapisz datę jako RRRR-MM-DD, np\. 2026-11-14/);
  assert.deepEqual(Object.keys(r.entries), ['2026-11-15']);       // reszta kalendarza działa
  assert.equal(isCalendarDate('2028-02-29'), true);               // rok przestępny
  assert.equal(isCalendarDate('2027-02-29'), false);
  assert.equal(isCalendarDate('2100-02-29'), false);
});

test('kalendarz: nieistniejący slug (z podpowiedzią), przepis pominięty z powodu błędu — błąd wpisu', () => {
  const r = cal('2026-11-14: chicken-parmigana\n2026-11-15: zepsuty\n2026-11-16: { recipe: nic-takiego }\n2026-11-17: Falafele\n2026-11-18: falafele\n');
  assert.equal(r.errors[0], 'calendar.yml → 2026-11-14: nie ma przepisu chicken-parmigana (może chodzi o chicken-parmigiana?) — slug to nazwa pliku z recipes/ bez .md');
  assert.equal(r.errors[1], 'calendar.yml → 2026-11-15: przepis zepsuty ma błąd i nie ma go na stronie — popraw recipes/zepsuty.md');
  assert.match(r.errors[2], /^calendar\.yml → 2026-11-16\.recipe: nie ma przepisu nic-takiego — slug/);
  assert.match(r.errors[3], /^calendar\.yml → 2026-11-17: slug przepisu: małe litery/);
  assert.deepEqual(plain(r.entries), {
    '2026-11-14': { error: 'recipe', recipe: 'chicken-parmigana' },
    '2026-11-15': { error: 'recipe', recipe: 'zepsuty' },
    '2026-11-16': { error: 'recipe', recipe: 'nic-takiego' },
    '2026-11-17': { error: 'recipe' },
    '2026-11-18': { recipe: 'falafele' },
  });
});

test('kalendarz: powtórzona data, nieznane pole, pusta notatka, brak recipe, zły typ — błąd tylko tego wpisu', () => {
  const r = cal([
    '2026-11-13: falafele', '2026-11-14: udka', '2026-11-13: udka',
    '2026-11-20: { recipe: falafele, notatka: "x" }', '2026-11-21: { recipe: falafele, note: "" }',
    '2026-11-22: { note: "x" }', '2026-11-23: [falafele]', '2026-11-24: 5', '2026-11-25:', '2026-11-26: falafele',
  ].join('\n'));
  assert.deepEqual(paths(r.errors), ['2026-11-13', '2026-11-20.notatka', '2026-11-21.note', '2026-11-22', '2026-11-23', '2026-11-24', '2026-11-25']);
  assert.match(r.errors[0], /ta data jest w kalendarzu 2 razy — zostaw jeden wpis/);
  assert.match(r.errors[1], /nieznane pole — dozwolone: recipe, note/);
  assert.match(r.errors[2], /notatka musi być niepustym tekstem/);
  assert.match(r.errors[3], /brak pola recipe/);
  assert.deepEqual(plain(r.entries['2026-11-13']), { error: 'entry' });
  assert.deepEqual(plain(r.entries['2026-11-20']), { error: 'entry', recipe: 'falafele' });
  ['2026-11-21', '2026-11-22', '2026-11-23', '2026-11-24', '2026-11-25'].forEach((d) => assert.equal(r.entries[d].error, 'entry', d));
  assert.deepEqual(plain(r.entries['2026-11-14']), { recipe: 'udka' });
  assert.deepEqual(plain(r.entries['2026-11-26']), { recipe: 'falafele' });
});

test('kalendarz: zły YAML albo plik nie-mapa — jeden błąd pliku, kalendarz pusty (build dalej działa)', () => {
  const y = cal('2026-11-13: "falafele\n');
  assert.deepEqual(y.entries, {});
  assert.equal(y.errors.length, 1);
  assert.match(y.errors[0], /^calendar\.yml → \(YAML\): niepoprawny YAML \(linia \d+\): .* — kalendarz jest pusty/);
  assert.match(cal('- falafele\n').errors[0], /^calendar\.yml → \(plik\): kalendarz to lista wpisów/);
});

test('kalendarz: ścieżka po ludzku („kalendarz 2026-11-14 → notatka”)', () => {
  assert.equal(describeCalendarPath('2026-11-14'), 'kalendarz 2026-11-14');
  assert.equal(describeCalendarPath('2026-11-14.note'), 'kalendarz 2026-11-14 → notatka');
  assert.equal(describeCalendarPath('2026-11-14.recipe'), 'kalendarz 2026-11-14 → przepis');
  assert.equal(describeCalendarPath('2026-11-14.foo'), 'kalendarz 2026-11-14 → „foo”');
  assert.equal(describeCalendarPath('14.11.2026'), 'kalendarz 14.11.2026');
  assert.equal(describeCalendarPath('(YAML)'), 'kalendarz: zapis pliku (YAML)');
});

function tempDir(files) {
  const dir = mkdtempSync(join(tmpdir(), 'kitchen-cal-'));
  cpSync(FIXTURES, dir, { recursive: true });
  Object.keys(files).forEach((name) => {
    mkdirSync(dirname(join(dir, name)), { recursive: true });
    writeFileSync(join(dir, name), files[name]);
  });
  return dir;
}

test('loadRecipes: calendar.yml to nie „obcy plik” w recipes/, błędy wpisów w errors i problems (skipped)', () => {
  const ok = loadRecipes(FIXTURES);
  assert.deepEqual(ok.errors, []);
  assert.equal(Object.keys(ok.calendar).length, 4);
  // Przepis z błędem → wpis w kalendarzu też z błędem (osobna linia błędu).
  const dir = tempDir({
    'calendar.yml': '2026-11-13: chicken-parmigana\n2026-11-14: deser-twarogowy\n2026-11-15: { recipe: udka-z-ziemniakami, note: "dla 4" }\n',
    'deser-twarogowy.md': readFileSync(join(FIXTURES, 'deser-twarogowy.md'), 'utf8').replace('servings: 2', 'servings: 0'),
  });
  const r = loadRecipes(dir);
  const calErrors = r.errors.filter((e) => e.startsWith(CALENDAR_FILE));
  assert.deepEqual(calErrors.map((e) => e.split(': ')[0]), ['calendar.yml → 2026-11-13', 'calendar.yml → 2026-11-14']);
  assert.match(calErrors[1], /przepis deser-twarogowy ma błąd/);
  const p = r.problems.filter((x) => x.file === CALENDAR_FILE);
  assert.deepEqual(plain(p.map((x) => [x.where, x.skipped])), [['kalendarz 2026-11-13', true], ['kalendarz 2026-11-14', true]]);
  assert.deepEqual(plain(r.calendar['2026-11-15']), { recipe: 'udka-z-ziemniakami', note: 'dla 4' });
});

test('npm run validate: błąd w kalendarzu → kod 1 (twarda bramka jak przy przepisach)', () => {
  const dir = tempDir({ 'calendar.yml': '2026-11-13: nie-ma\n' });
  const v = spawnSync(process.execPath, [join(root, 'tools', 'validate-cli.mjs')], { env: Object.assign({}, process.env, { KITCHEN_RECIPES_DIR: dir }), encoding: 'utf8' });
  assert.equal(v.status, 1);
  assert.match(v.stderr, /calendar\.yml → 2026-11-13: nie ma przepisu nie-ma/);
  const good = spawnSync(process.execPath, [join(root, 'tools', 'validate-cli.mjs')], { env: Object.assign({}, process.env, { KITCHEN_RECIPES_DIR: FIXTURES }), encoding: 'utf8' });
  assert.equal(good.status, 0, good.stderr);
  assert.match(good.stdout, /kalendarz: 4 dni/);
});

// ── calendar.json ──

test('calendar.json: data → slug, tytuł PL / EN, miniatura, plakietki, urządzenia, notatka; wpis z błędem', () => {
  const index = [
    { id: 'udka', title: 'Udka', title_en: 'Chicken legs', tags: ['ninja', 'tm6', 'low'], badges: [{ tag: 'low', label: 'LOW', color: 'red' }], thumb: '/img/udka-300-abc.jpg' },
    { id: 'deser', title: 'Deser', tags: ['deser'], badges: [] },
  ];
  const out = calendarJson({
    '2026-11-14': { recipe: 'deser' },
    '2026-11-13': { recipe: 'udka', note: 'dla 4' },
    '2026-11-15': { error: 'recipe', recipe: 'nie-ma' },
    '2026-11-16': { error: 'entry' },
  }, index);
  assert.deepEqual(Object.keys(out), ['2026-11-13', '2026-11-14', '2026-11-15', '2026-11-16']);
  assert.deepEqual(out['2026-11-13'], { recipe: 'udka', title: 'Udka', title_en: 'Chicken legs', thumb: '/img/udka-300-abc.jpg',
    badges: [{ tag: 'low', label: 'LOW', color: 'red' }], devices: ['ninja', 'tm6'], note: 'dla 4' });
  assert.deepEqual(out['2026-11-14'], { recipe: 'deser', title: 'Deser', badges: [], devices: [] });
  assert.deepEqual(out['2026-11-15'], { error: 'recipe', recipe: 'nie-ma' });
  assert.deepEqual(out['2026-11-16'], { error: 'entry' });
});

function build(dir) {
  const out = mkdtempSync(join(tmpdir(), 'kitchen-cal-out-'));
  const w = spawnSync(process.execPath, [join(root, 'tools', 'build.mjs')], { env: Object.assign({}, process.env, { KITCHEN_RECIPES_DIR: dir, KITCHEN_OUT_DIR: out }), encoding: 'utf8' });
  assert.equal(w.status, 0, w.stderr);
  return { out, w, json: (p) => JSON.parse(readFileSync(join(out, p), 'utf8')) };
}

test('build: calendar.json i strona /calendar/; błąd wpisu nie przerywa buildu (errors.json), reszta kalendarza działa', () => {
  const b = build(tempDir({ 'calendar.yml': '2026-11-12: warzywa-varoma\n2026-11-13: { recipe: udka-z-ziemniakami, note: "x" }\n2026-11-14: nie-ma\n' }));
  const c = b.json('calendar.json');
  assert.deepEqual(Object.keys(c), ['2026-11-12', '2026-11-13', '2026-11-14']);
  assert.match(c['2026-11-12'].thumb, /^\/img\/warzywa-varoma-300-[0-9a-f]{8}\.jpg$/);
  assert.equal(c['2026-11-13'].title_en, 'Chicken legs with potatoes');
  assert.deepEqual(c['2026-11-13'].devices, ['ninja']);
  assert.equal(c['2026-11-13'].note, 'x');
  assert.deepEqual(c['2026-11-14'], { error: 'recipe', recipe: 'nie-ma' });
  const errs = b.json('errors.json').filter((e) => e.file === 'calendar.yml');
  assert.deepEqual(errs.map((e) => [e.path, e.where, e.skipped]), [['2026-11-14', 'kalendarz 2026-11-14', true]]);
  assert.equal(readFileSync(join(b.out, 'calendar', 'index.html'), 'utf8'), readFileSync(join(b.out, 'index.html'), 'utf8'));
  assert.match(b.w.stdout, /kalendarz: 3 dni/);
  // bez calendar.yml — pusty kalendarz
  const empty = mkdtempSync(join(tmpdir(), 'kitchen-cal-none-'));
  assert.deepEqual(build(empty).json('calendar.json'), {});
});

test('build: zmiana samego kalendarza zmienia identyfikator buildu (iPad sam się odświeża)', () => {
  const a = build(tempDir({ 'calendar.yml': '2026-11-12: warzywa-varoma\n' })).json('version.json').build;
  const a2 = build(tempDir({ 'calendar.yml': '2026-11-12: warzywa-varoma\n' })).json('version.json').build;
  const b = build(tempDir({ 'calendar.yml': '2026-11-12: udka-z-ziemniakami\n' })).json('version.json').build;
  assert.equal(a, a2);
  assert.notEqual(a, b);
  assert.match(readFileSync(join(root, 'public', '_headers'), 'utf8'), /\/calendar\/\*\n {2}Cache-Control: no-cache/);
});

// ── daty na iPadzie: zawsze lokalnie (Europe/London), nigdy UTC ──

test('daty: „dziś” z lokalnego czasu — północ i czas letni (toISOString dałby wczorajszy dzień)', () => {
  assert.equal(new Date(2026, 5, 1, 12).getTimezoneOffset(), -60, 'testy muszą działać w strefie Europe/London (BST latem)');
  // 00:30 czasu letniego to jeszcze 23:30 poprzedniego dnia w UTC
  const bst = new Date(2026, 5, 1, 0, 30);
  assert.equal(bst.toISOString().slice(0, 10), '2026-05-31');
  assert.equal(K.dateKey(bst), '2026-06-01');
  assert.equal(K.dateKey(new Date(2026, 10, 12, 23, 59, 59)), '2026-11-12');
  assert.equal(K.dateKey(new Date(2026, 10, 13, 0, 0, 0)), '2026-11-13');
  // w kodzie aplikacji żadnych dat w UTC
  const code = js.replace(/\/\/.*$/gm, '');
  ['toISOString', 'getUTC', 'Date.UTC', 'toJSON'].forEach((w) => assert.ok(!code.includes(w), 'app.js nie może używać ' + w));
});

test('daty: zmiana czasu (29 marca i 25 października 2026) nie przesuwa dni ani tygodni', () => {
  // noc zmiany czasu: 00:30 i 03:30 tego samego dnia
  assert.equal(K.dateKey(new Date(2026, 2, 29, 0, 30)), '2026-03-29');
  assert.equal(K.dateKey(new Date(2026, 2, 29, 3, 30)), '2026-03-29');
  assert.equal(K.dateKey(new Date(2026, 9, 25, 1, 30)), '2026-10-25');
  assert.equal(K.dateKey(new Date(2026, 9, 25, 23, 59)), '2026-10-25');
  assert.deepEqual([K.addDays('2026-03-28', 1), K.addDays('2026-03-28', 2), K.addDays('2026-03-30', -2)], ['2026-03-29', '2026-03-30', '2026-03-28']);
  assert.deepEqual([K.addDays('2026-10-24', 1), K.addDays('2026-10-24', 2), K.addDays('2026-10-26', -1)], ['2026-10-25', '2026-10-26', '2026-10-25']);
  assert.deepEqual(plain(K.weekDays('2026-03-29')), ['2026-03-23', '2026-03-24', '2026-03-25', '2026-03-26', '2026-03-27', '2026-03-28', '2026-03-29']);
  assert.deepEqual(plain(K.weekDays('2026-10-26')), ['2026-10-26', '2026-10-27', '2026-10-28', '2026-10-29', '2026-10-30', '2026-10-31', '2026-11-01']);
  assert.equal(K.shiftAnchor('week', '2026-10-21', 1), '2026-10-28');   // tydzień przez zmianę czasu
  assert.equal(K.shiftAnchor('week', '2026-04-01', -1), '2026-03-25');
});

test('daty: tydzień od poniedziałku, przełom miesiąca i roku, rok przestępny', () => {
  assert.deepEqual([K.weekday('2026-11-09'), K.weekday('2026-11-12'), K.weekday('2026-11-15')], [0, 3, 6]);
  assert.equal(K.weekStart('2026-11-15'), '2026-11-09');                // niedziela należy do tygodnia od poniedziałku
  assert.equal(K.weekStart('2026-11-16'), '2026-11-16');
  assert.equal(K.addDays('2026-11-30', 1), '2026-12-01');
  assert.equal(K.addDays('2026-12-31', 1), '2027-01-01');
  assert.equal(K.addDays('2027-01-01', -1), '2026-12-31');
  assert.equal(K.addDays('2028-02-28', 1), '2028-02-29');
  assert.equal(K.weekStart('2027-01-01'), '2026-12-28');
  assert.equal(K.addMonths('2026-12-15', 1), '2027-01-01');
  assert.equal(K.addMonths('2026-01-31', -1), '2025-12-01');
  assert.equal(K.addMonths('2026-01-31', 1), '2026-02-01');             // bez przeskoku przez krótszy luty
  assert.equal(K.keyDate('2026-02-30'), null);
  assert.equal(K.isDateKey('2026-11-1'), false);
});

test('miesiąc: siatka pon–nd, 5–6 pełnych tygodni z dniami sąsiednich miesięcy', () => {
  const nov = plain(K.monthGrid('2026-11-12'));
  assert.equal(nov.length, 42);                                         // 1 listopada 2026 to niedziela
  assert.deepEqual([nov[0], nov[6], nov[41]], ['2026-10-26', '2026-11-01', '2026-12-06']);
  const dec = plain(K.monthGrid('2026-12-01'));
  assert.equal(dec.length, 35);
  assert.deepEqual([dec[0], dec[34]], ['2026-11-30', '2027-01-03']);
  assert.equal(plain(K.monthGrid('2027-02-10')).length, 35);            // luty 2027: 4 tygodnie → i tak 5 rzędów
  assert.equal(K.shiftAnchor('month', '2026-12-20', 1), '2027-01-01');
  assert.equal(K.shiftAnchor('month', '2027-01-01', -1), '2026-12-01');
});

test('zakres nad kalendarzem: tydzień i miesiąc, odmiana PL i wersja EN', () => {
  assert.equal(K.rangeLabel('week', '2026-11-12', 'pl'), '9–15 listopada 2026');
  assert.equal(K.rangeLabel('week', '2026-11-12', 'en'), '9–15 November 2026');
  assert.equal(K.rangeLabel('week', '2026-10-28', 'pl'), '26 października – 1 listopada 2026');
  assert.equal(K.rangeLabel('week', '2026-10-28', 'en'), '26 October – 1 November 2026');
  assert.equal(K.rangeLabel('week', '2027-01-01', 'pl'), '28 grudnia 2026 – 3 stycznia 2027');
  assert.equal(K.rangeLabel('week', '2027-01-01', 'en'), '28 December 2026 – 3 January 2027');
  assert.equal(K.rangeLabel('month', '2026-11-12', 'pl'), 'listopad 2026');
  assert.equal(K.rangeLabel('month', '2026-11-12', 'en'), 'November 2026');
  assert.equal(K.rangeLabel('month', '2027-02-01', 'pl'), 'luty 2027');
  assert.deepEqual([K.dayShort('2026-11-16', 'pl'), K.dayShort('2026-11-18', 'pl'), K.dayShort('2026-11-22', 'en')], ['pon', 'śr', 'Sun']);
  const N = K.DATE_NAMES;
  ['pl', 'en'].forEach((l) => {
    assert.equal(N[l].days.length, 7);
    ['months', 'monthsOf', 'monthsShort'].forEach((k) => assert.equal(N[l][k].length, 12, l + '.' + k));
  });
});

// ── podtytuł przepisu „Lunch: …” ──

const CAL = {
  '2026-11-10': { recipe: 'udka', title: 'Udka', badges: [], devices: [] },
  '2026-11-12': { recipe: 'falafele', title: 'Falafele', badges: [], devices: [] },
  '2026-11-13': { recipe: 'udka', title: 'Udka', badges: [], devices: [] },
  '2026-11-14': { error: 'recipe', recipe: 'deser' },
  '2026-11-17': { recipe: 'deser', title: 'Deser', badges: [], devices: [] },
  '2026-11-20': { recipe: 'udka', title: 'Udka', badges: [], devices: [] },
};

test('podtytuł „Lunch: …”: najbliższy termin dziś lub później, przeszłe i błędne wpisy pomijane', () => {
  assert.equal(K.nextLunch(CAL, 'udka', '2026-11-12'), '2026-11-13');   // 10.11 minął
  assert.equal(K.nextLunch(CAL, 'udka', '2026-11-14'), '2026-11-20');
  assert.equal(K.nextLunch(CAL, 'udka', '2026-11-21'), null);           // same przeszłe → nic
  assert.equal(K.nextLunch(CAL, 'falafele', '2026-11-12'), '2026-11-12');
  assert.equal(K.nextLunch(CAL, 'deser', '2026-11-12'), '2026-11-17');  // 14.11 to wpis z błędem
  assert.equal(K.nextLunch({}, 'udka', '2026-11-12'), null);
  assert.equal(K.tr('pl', 'lunchIn', { when: K.lunchWhen('2026-11-12', '2026-11-12', 'pl') }), 'Lunch: dziś');
  assert.equal(K.tr('pl', 'lunchIn', { when: K.lunchWhen('2026-11-13', '2026-11-12', 'pl') }), 'Lunch: jutro');
  assert.equal(K.tr('pl', 'lunchIn', { when: K.lunchWhen('2026-11-17', '2026-11-12', 'pl') }), 'Lunch: wt 17.11');
  assert.equal(K.tr('en', 'lunchIn', { when: K.lunchWhen('2026-11-12', '2026-11-12', 'en') }), 'Lunch: today');
  assert.equal(K.tr('en', 'lunchIn', { when: K.lunchWhen('2026-11-13', '2026-11-12', 'en') }), 'Lunch: tomorrow');
  assert.equal(K.tr('en', 'lunchIn', { when: K.lunchWhen('2026-11-16', '2026-11-12', 'en') }), 'Lunch: Mon 16 Nov');
  // jutro przez przełom roku, termin w styczniu
  assert.equal(K.lunchWhen('2027-01-01', '2026-12-31', 'pl'), 'jutro');
  assert.equal(K.lunchWhen('2027-01-04', '2026-12-31', 'pl'), 'pon 4.01');
  // widok: termin na początku podtytułu, przed czasami
  const sub = js.slice(js.indexOf('function recipeSubHtml'), js.indexOf('function updateRecipeSub'));
  assert.ok(sub.includes('nextLunch(calendar, r.id, d)') && sub.indexOf("T('lunchIn'") < sub.indexOf('esc(times)'));
});

test('calendar.json na iPadzie: śmieci odrzucone, wpisy z błędem zostają', () => {
  const c = plain(K.normalizeCalendar({
    '2026-11-12': { recipe: 'udka', title: 'Udka', devices: ['ninja', 'x'], badges: 'zle' },
    '2026-11-13': { error: 'recipe', recipe: 'nie-ma' },
    '2026-11-14': { error: 'cos' },
    '2026-02-30': { recipe: 'udka', title: 'Udka' },
    'x': 5, '2026-11-15': null, '2026-11-16': { recipe: 'Zły slug', title: 'x' },
  }));
  assert.deepEqual(Object.keys(c).sort(), ['2026-11-12', '2026-11-13']);
  assert.deepEqual(c['2026-11-12'], { recipe: 'udka', title: 'Udka', title_en: null, thumb: null, badges: [], devices: ['ninja'], note: null });
  assert.deepEqual(c['2026-11-13'], { error: 'recipe', recipe: 'nie-ma' });
  assert.deepEqual(plain(K.normalizeCalendar(null)), {});
  assert.deepEqual(plain(K.normalizeCalendar([1])), {});
  // tytuł w EN: tłumaczenie albo PL ze znaczkiem
  assert.deepEqual(plain(K.calendarTitle({ title: 'Udka', title_en: 'Legs' }, 'en')), { title: 'Legs', fallback: false });
  assert.deepEqual(plain(K.calendarTitle({ title: 'Udka', title_en: null }, 'en')), { title: 'Udka', fallback: true });
  assert.deepEqual(plain(K.calendarTitle({ title: 'Udka', title_en: 'Legs' }, 'pl')), { title: 'Udka', fallback: false });
});

// ── nawigacja: wejście, powrót z przepisu, zapamiętany widok ──

test('kalendarz zawsze otwiera się na bieżącym tygodniu / miesiącu; pamiętany tylko wybór Tydzień / Miesiąc', () => {
  const st = K.normalizeState({ calendar: { view: 'month' }, calendarReturn: { view: 'week', anchor: '2026-12-24' } });
  assert.deepEqual(plain(K.freshCalendar(st, '2026-11-12')), { view: 'month', anchor: '2026-11-12' });
  assert.deepEqual(plain(K.freshCalendar(K.normalizeState(null), '2026-11-12')), { view: 'week', anchor: '2026-11-12' });
  assert.equal(K.normalizeState({ calendar: { view: 'rok' } }).calendar.view, 'week');
  assert.equal(K.normalizeState({ calendar: 'month' }).calendar.view, 'week');
  // wejście przyciskiem „Kalendarz”: freshCalendar (nie zapamiętany zakres), wybór widoku zapisany w state
  const go = js.slice(js.indexOf('function goToCalendar'), js.indexOf('function showCalendar'));
  assert.ok(go.includes('freshCalendar(state, today())') && go.includes('pushState({ fromList: true, cal: place }'));
  const setView = js.slice(js.indexOf('function setCalendarView'), js.indexOf('function moveCalendar'));
  assert.ok(setView.includes('state.calendar.view = view') && setView.includes('saveState()'));
  // przesuwanie zakresu nie trafia do localStorage (tylko do historii — powrót z przepisu)
  const move = js.slice(js.indexOf('function moveCalendar'), js.indexOf('function onNewDay'));
  assert.ok(!move.includes('saveState') && move.includes('rememberCalendarPlace()'));
});

test('powrót z przepisu do kalendarza: ten sam widok i zakres (z historii albo z zapisu po przeładowaniu)', () => {
  assert.equal(K.backTarget({ fromList: true }, null), 'history');
  assert.equal(K.backTarget({ fromList: true }, { view: 'month', anchor: '2026-11-01' }), 'history');
  assert.equal(K.backTarget(null, { view: 'month', anchor: '2026-11-01' }), 'calendar');   // historia zgubiona (przeładowanie)
  assert.equal(K.backTarget(null, null), 'list');
  assert.equal(K.backTarget(null, { view: 'month', anchor: 'zle' }), 'list');
  assert.deepEqual(plain(K.normalizeCalendarPlace({ view: 'week', anchor: '2026-11-16', x: 1 })), { view: 'week', anchor: '2026-11-16' });
  assert.equal(K.normalizeCalendarPlace({ view: 'day', anchor: '2026-11-16' }), null);
  // przepis z kalendarza zapamiętuje miejsce, przepis z listy je czyści; lista też je czyści
  const go = js.slice(js.indexOf('function goToRecipe'), js.indexOf('function goBack'));
  assert.ok(go.includes("state.calendarReturn = V.screen === 'calendar' ? { view: V.view, anchor: V.anchor } : null"));
  const back = js.slice(js.indexOf('function goBack'), js.indexOf('function routeFromUrl'));
  assert.ok(back.includes('backTarget(hs, state.calendarReturn)') && back.includes('showCalendar(place)'));
  const list = js.slice(js.indexOf('function showList'), js.indexOf('function currentScroll'));
  assert.ok(list.includes('state.calendarReturn = null'));
  // zmiana zakresu w kalendarzu podmienia wpis historii (popstate odtworzy dokładnie ten widok)
  const remember = js.slice(js.indexOf('function rememberCalendarPlace'), js.indexOf('function drawCalendar'));
  assert.ok(remember.includes("replaceState({ fromList: !!(hs && hs.fromList), cal: { view: V.view, anchor: V.anchor } }, '', CAL_PATH)"));
  const route = js.slice(js.indexOf('function routeFromUrl'), js.indexOf("doc.addEventListener('click'"));
  assert.ok(route.includes('isCalendarUrl()) showCalendar(calendarPlaceFromHistory())'));
  // stan z localStorage z poprzedniej wersji (bez pól kalendarza) → wartości domyślne
  assert.deepEqual(plain(K.normalizeState({ openRecipe: 'udka', recipes: {} })).calendarReturn, null);
});

test('lista: „Dziś na lunch” nad wyszukiwarką (przed „Wróć do gotowania”), przycisk „Kalendarz” w pasku, odświeżanie po północy', () => {
  const draw = js.slice(js.indexOf('function drawList'), js.indexOf('function chipsHtml'));
  assert.ok(draw.indexOf('<div id="lunch">') < draw.indexOf('id="search"'), 'karta lunchu nad wyszukiwarką');
  assert.ok(js.slice(js.indexOf('function resultsHtml'), js.indexOf('function updateResults')).includes('resumeCard()'), '„Wróć do gotowania” zostaje w #results (pod kartą lunchu)');
  const bar = js.slice(js.indexOf('function listBar'), js.indexOf('function recipeBar'));
  assert.ok(bar.includes('data-act="calendar"') && bar.indexOf('data-act="calendar"') < bar.indexOf('langButton()'));
  const lunch = js.slice(js.indexOf('function lunchHtml'), js.indexOf('function refreshLunch'));
  assert.ok(lunch.includes("T('lunchToday')") && lunch.includes("T('lunchTomorrow')") && lunch.includes('data-open="'));
  assert.match(js, /'\/calendar\.json\?b=' \+ BUILD/);
  // po północy „dziś” przesuwa się bez przeładowania
  const tick = js.slice(js.indexOf('function tick'), js.indexOf('global.setInterval(tick'));
  assert.ok(tick.includes('dateKey(new Date())') && tick.includes('onNewDay(old)'));
  // CSS: karta lunchu i dzisiejszy dzień — niebieska ramka bez poświaty; wiersz tygodnia wysoki (≥ 96 px)
  assert.match(css, /\.lunch \{[^}]*border: 2px solid var\(--accent\)/);
  assert.match(css, /\.day\.today \{[^}]*border: 2px solid var\(--accent\)/);
  assert.match(css, /\.mcell\.today \{[^}]*border: 2px solid var\(--accent\)/);
  assert.ok(Number(/\.day \{[^}]*min-height: (\d+)px/.exec(css)[1]) >= 96);
  assert.match(css, /\.mgrid \{[^}]*display: grid; grid-template-columns: repeat\(7, minmax\(0, 1fr\)\)/);
  assert.match(css, /\.day\.past \{ opacity/);
  assert.match(css, /\.mcell\.out \{ opacity/);
  assert.match(css, /\.bad \{[^}]*background: var\(--error\)/);
});

test('plakietka problemów: przepisy i błędy kalendarza osobno', () => {
  const g = (file, n) => ({ file, skipped: true, items: Array.from({ length: n }, () => ({ where: 'x', reason: 'y', path: 'z' })) });
  assert.equal(K.problemsText([g('a.md', 2), g('b.md', 1)], 'pl'), '2 przepisy z błędem');
  assert.equal(K.problemsText([g('calendar.yml', 1)], 'pl'), '1 błąd w kalendarzu');
  assert.equal(K.problemsText([g('calendar.yml', 3)], 'pl'), '3 błędy w kalendarzu');
  assert.equal(K.problemsText([g('a.md', 1), g('calendar.yml', 5)], 'pl'), '1 przepis z błędem · 5 błędów w kalendarzu');
  assert.equal(K.problemsText([g('a.md', 1), g('calendar.yml', 2)], 'en'), '1 recipe with an error · 2 calendar errors');
});

test('docs/FORMAT-PRZEPISU.md i AGENTS.md: kalendarz opisany, przykład przechodzi walidację, zasady dla ChatGPT', () => {
  const doc = readFileSync(join(root, 'docs', 'FORMAT-PRZEPISU.md'), 'utf8').replace(/\r\n/g, '\n');
  const agents = readFileSync(join(root, 'AGENTS.md'), 'utf8').replace(/\r\n/g, '\n');
  const section = doc.slice(doc.indexOf('## 13. Kalendarz lunchów'));
  assert.ok(section.length > 200, 'brak punktu 13 w ściądze');
  [section, agents].forEach((t, i) => {
    const name = i ? 'AGENTS.md' : 'FORMAT-PRZEPISU.md';
    const example = t.split('```yaml\n').slice(1).map((b) => b.split('```')[0]).find((b) => b.includes('recipe:'));
    const r = validateCalendar(example, { recipes: ['falafele-z-ciecierzycy', 'chicken-parmigiana'], files: [] });
    assert.deepEqual(r.errors, [], name);
    assert.equal(Object.keys(r.entries).length, 2, name);
    ['recipes/calendar.yml', 'RRRR-MM-DD', 'jednym commicie', 'Przeszłych wpisów nie usuwaj', 'tabelk', 'potwierdzeni'].forEach((w) => assert.ok(t.includes(w), name + ': brak „' + w + '”'));
  });
});
