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

// ── timer Ninja ──
const MIN = 60000;
const T0 = 1700000000000;
const zone = (minutes, turn, label) => Object.assign({ function: 'Air Fry', temp_c: 200, minutes }, label ? { label } : {}, turn ? { turn } : {});
const flip = (after_min, required) => Object.assign({ action: 'flip', after_min }, required === undefined ? {} : { required });
const shake = (after_min, required) => Object.assign({ action: 'shake', after_min }, required === undefined ? {} : { required });
// Kolejka jako [[czas w min, 'id+id'], ...] — czytelne porównania.
const queue = (plan) => plain(K.timerQueue(plan)).map((g) => [g.at / MIN, g.events.map((e) => e.id).join('+')]);
const target = (plan, elapsedMin, acked) => {
  const g = K.timerTarget(plan, elapsedMin * MIN, acked || []);
  return g ? [g.at / MIN, g.events.map((e) => e.id).join('+')] : null;
};

test('timer: plan SYNC z różnymi czasami — obrócenie krótszej strefy przesunięte o różnicę', () => {
  const plan = plain(K.timerPlan({ mode: 'sync', zone1: zone(28, flip(14), 'Udka'), zone2: zone(22, shake(11), 'Ziemniaki') }));
  assert.equal(plan.total, 28 * MIN);
  assert.deepEqual(plan.events, [
    { id: 'turn1', kind: 'turn', at: 14 * MIN, zone: 'Strefa 1 · Udka', action: 'flip', required: true },
    { id: 'turn2', kind: 'turn', at: (6 + 11) * MIN, zone: 'Strefa 2 · Ziemniaki', action: 'shake', required: true },
    { id: 'end', kind: 'end', at: 28 * MIN, zone: '', action: '', required: true },
  ]);
});

test('timer: kolejka zdarzeń — single, match, sync, kilka turn, zdarzenia równoczesne', () => {
  // single bez turn: tylko koniec
  assert.deepEqual(queue(K.timerPlan({ mode: 'single', zone1: zone(19) })), [[19, 'end']]);
  // single z turn
  assert.deepEqual(queue(K.timerPlan({ mode: 'single', zone1: zone(19, flip(9)) })), [[9, 'turn1'], [19, 'end']]);
  // match: obie strefy w tej samej chwili → jedna grupa
  assert.deepEqual(queue(K.timerPlan({ mode: 'match', zone1: zone(10, flip(6)), zone2: zone(10, flip(6)) })), [[6, 'turn1+turn2'], [10, 'end']]);
  // sync, krótsza strefa wcześniej w kolejce mimo przesunięcia
  assert.deepEqual(queue(K.timerPlan({ mode: 'sync', zone1: zone(30, flip(20)), zone2: zone(12, shake(4)) })), [[20, 'turn1'], [22, 'turn2'], [30, 'end']]);
  // sync: przesunięcie sprowadza obie na tę samą chwilę (14 = 14) → równoczesne
  assert.deepEqual(queue(K.timerPlan({ mode: 'sync', zone1: zone(28, flip(14)), zone2: zone(20, shake(6)) })), [[14, 'turn1+turn2'], [28, 'end']]);
  // informacyjne (required: false) też są w kolejce licznika
  assert.deepEqual(queue(K.timerPlan({ mode: 'independent', zone1: zone(30), zone2: zone(12, shake(6, false)) })), [[6, 'turn2'], [30, 'end']]);
});

test('timer: napisy nad licznikiem i w alarmie', () => {
  const g = (events) => ({ at: 0, events });
  const ev = (id, action, required, z) => ({ id, kind: 'turn', at: 0, zone: z || 'Strefa 1 · Udka', action, required });
  const end = { id: 'end', kind: 'end', at: 0, zone: '', action: '', required: true };
  assert.equal(K.groupTitle(g([ev('turn1', 'flip', true)]), 'za'), 'OBRÓĆ ZA');
  assert.equal(K.groupTitle(g([ev('turn1', 'shake', true)]), 'po'), 'POTRZĄŚNIJ PO');
  assert.equal(K.groupTitle(g([ev('turn1', 'flip', false)]), 'za'), 'można obrócić za');
  assert.equal(K.groupTitle(g([ev('turn1', 'shake', false)]), 'za'), 'można potrząsnąć za');
  assert.equal(K.groupTitle(g([ev('turn1', 'flip', true)]), 'teraz'), 'OBRÓĆ TERAZ');
  assert.equal(K.groupTitle(g([end]), 'za'), 'GOTOWE ZA');
  assert.equal(K.groupTitle(g([end]), 'po'), 'GOTOWE PO');
  // równoczesne: te same czynności → jedna nazwa, strefy razem; różne → obie nazwy i dopisek przy strefie
  const same = g([ev('turn1', 'flip', true), ev('turn2', 'flip', true, 'Strefa 2 · Skrzydełka')]);
  assert.equal(K.groupTitle(same, 'teraz'), 'OBRÓĆ TERAZ');
  assert.deepEqual(plain(K.groupZones(same)), ['Strefa 1 · Udka', 'Strefa 2 · Skrzydełka']);
  const mixed = g([ev('turn1', 'flip', true), ev('turn2', 'shake', false, 'Strefa 2 · Frytki')]);
  assert.equal(K.groupTitle(mixed, 'za'), 'OBRÓĆ / POTRZĄŚNIJ ZA');
  assert.deepEqual(plain(K.groupZones(mixed)), ['Strefa 1 · Udka — obróć', 'Strefa 2 · Frytki — potrząśnij']);
  assert.deepEqual(plain(K.groupZones(g([end]))), []);
});

test('timer: licznik przechodzi do następnego zdarzenia po czasie i po „Zrobione"', () => {
  const plan = K.timerPlan({ mode: 'sync', zone1: zone(28, flip(14), 'Udka'), zone2: zone(22, shake(11, false), 'Ziemniaki') });
  assert.deepEqual(target(plan, 0), [14, 'turn1']);          // przed startem: zapowiedź pierwszego (OBRÓĆ PO 14:00)
  assert.deepEqual(target(plan, 13.5), [14, 'turn1']);
  assert.deepEqual(target(plan, 14), [17, 'turn2']);         // moment minął (alarm jeszcze niepotwierdzony) → następne
  assert.deepEqual(target(plan, 16, ['turn1']), [17, 'turn2']);
  assert.deepEqual(target(plan, 17.2), [28, 'end']);         // informacyjne minęło samo
  assert.equal(target(plan, 28), null);                      // koniec
  // przepis bez turn: od razu koniec
  assert.deepEqual(target(K.timerPlan({ mode: 'single', zone1: zone(19) }), 0), [19, 'end']);
  // „Zrobione" przy grupie równoczesnej: potwierdzone obie strefy → dalej koniec
  const match = K.timerPlan({ mode: 'match', zone1: zone(10, flip(6)), zone2: zone(10, flip(6)) });
  assert.deepEqual(target(match, 7, ['turn1', 'turn2']), [10, 'end']);
});

test('timer: stary przepis bez turn — tylko alarm końca', () => {
  const plan = plain(K.timerPlan({ mode: 'sync', zone1: zone(22, null, 'Ziemniaki'), zone2: zone(10, null, 'Brokuły') }));
  assert.deepEqual(plan.events.map((e) => e.kind), ['end']);
  const t = K.timerStart(plan, T0);
  assert.equal(K.timerDue(t, T0 + 21 * MIN), null);
  assert.deepEqual(plain(K.timerDue(t, T0 + 22 * MIN)).events.map((e) => e.kind), ['end']);
});

test('timer: czas z zegara, nie z tyknięć; pauza i wznowienie', () => {
  const plan = K.timerPlan({ mode: 'single', zone1: zone(20) });
  let t = K.timerStart(plan, T0);
  assert.equal(K.timerStatus(null, T0), 'idle');
  assert.equal(K.timerStatus(t, T0), 'running');
  assert.equal(K.timerElapsed(t, T0 + 5 * MIN), 5 * MIN);
  t = K.timerPause(t, T0 + 5 * MIN);
  assert.equal(K.timerStatus(t, T0 + 9 * MIN), 'paused');
  assert.equal(K.timerElapsed(t, T0 + 9 * MIN), 5 * MIN);         // w pauzie czas stoi
  assert.equal(K.timerPause(t, T0 + 10 * MIN), t);                  // druga pauza nic nie zmienia
  t = K.timerResume(t, T0 + 9 * MIN);                               // 4 min pauzy
  assert.equal(t.pausedTotal, 4 * MIN);
  assert.equal(K.timerElapsed(t, T0 + 12 * MIN), 8 * MIN);
  assert.equal(K.timerStatus(t, T0 + 24 * MIN), 'done');            // 20 min pieczenia + 4 min pauzy
  assert.equal(K.timerElapsed(t, T0 + 99 * MIN), 20 * MIN);         // nie więcej niż całość
  assert.equal(K.clock(20 * MIN - K.timerElapsed(t, T0 + 12 * MIN)), '12:00');
});

test('timer: zegar MM:SS (sekundy w górę)', () => {
  assert.equal(K.clock(28 * MIN), '28:00');
  assert.equal(K.clock(61000), '01:01');
  assert.equal(K.clock(1), '00:01');
  assert.equal(K.clock(0), '00:00');
  assert.equal(K.clock(-500), '00:00');
  assert.equal(K.clock(75 * MIN), '75:00');
});

test('timer: powrót z tła — zaległe obrócenie pokazane od razu, potwierdzenie nie zatrzymuje timera', () => {
  const plan = K.timerPlan({ mode: 'sync', zone1: zone(28, flip(14), 'Udka'), zone2: zone(22, shake(11)) });
  let t = K.timerStart(plan, T0);
  assert.equal(K.timerDue(t, T0 + 13 * MIN), null);
  // aplikacja w tle od 13. do 18. minuty: oba obrócenia (14 i 17 min) minęły — najpierw wcześniejsze
  let due = plain(K.timerDue(t, T0 + 18 * MIN));
  assert.deepEqual(due.events.map((e) => e.id), ['turn1']);
  assert.deepEqual(due.skip, []);
  t = K.timerAck(t, ['turn1']);
  assert.deepEqual(plain(K.timerDue(t, T0 + 18 * MIN)).events.map((e) => e.id), ['turn2']);
  t = K.timerAck(t, ['turn2']);
  assert.equal(K.timerDue(t, T0 + 18 * MIN), null);
  assert.equal(K.timerStatus(t, T0 + 18 * MIN), 'running');
  assert.equal(K.timerElapsed(t, T0 + 18 * MIN), 18 * MIN);
  assert.deepEqual(plain(K.timerAck(t, ['turn1'])).acked, ['turn1', 'turn2']); // bez duplikatów
});

test('timer: równoczesne obrócenia (MATCH) — jeden alarm z obiema strefami', () => {
  const plan = K.timerPlan({ mode: 'match', zone1: zone(10, flip(5), 'Kotlety (2 szt.)'), zone2: zone(10, flip(5), 'Kotlety (2 szt.)') });
  const due = plain(K.timerDue(K.timerStart(plan, T0), T0 + 5 * MIN));
  assert.deepEqual(due.events.map((e) => e.zone), ['Strefa 1 · Kotlety (2 szt.)', 'Strefa 2 · Kotlety (2 szt.)']);
});

test('timer: po końcu zaległe obrócenia pominięte, zostaje GOTOWE; informacyjne bez alarmu', () => {
  const plan = K.timerPlan({ mode: 'match', zone1: zone(10, flip(5)), zone2: zone(10, flip(5, false)) });
  let t = K.timerStart(plan, T0);
  assert.deepEqual(plain(K.timerDue(t, T0 + 6 * MIN)).events.map((e) => e.id), ['turn1']);   // turn2 informacyjny — bez alarmu
  const due = plain(K.timerDue(t, T0 + 30 * MIN));                                           // wrócił po końcu
  assert.deepEqual(due.events.map((e) => e.kind), ['end']);
  assert.deepEqual(due.skip, ['turn1']);
  t = K.timerAck(t, due.skip.concat(due.events.map((e) => e.id)));
  assert.equal(K.timerDue(t, T0 + 31 * MIN), null);
  assert.equal(K.timerStatus(t, T0 + 31 * MIN), 'done');
});

test('timer w localStorage: przetrwa normalizeState, zepsuty zapis = brak timera, stare zapisy bez timera', () => {
  const plan = plain(K.timerPlan({ mode: 'single', zone1: zone(19, flip(9)) }));
  const timer = plain(K.timerPause(K.timerStart(plan, T0), T0 + 2 * MIN));
  const s = plain(K.normalizeState({ openRecipe: 'piers', recipes: { piers: { step: 1, servings: null, title: 'Pierś', steps: 4, t: 1, timer } } }));
  assert.deepEqual(s.recipes.piers.timer, timer);
  const bad = plain(K.normalizeState({ recipes: { a: { step: 0, timer: { plan: { total: 'x' } } }, b: { step: 0 } } }));
  assert.ok(!('timer' in bad.recipes.a) && !('timer' in bad.recipes.b));
  assert.equal(K.normalizeTimer(Object.assign({}, timer, { pausedAt: undefined })), null);
  assert.equal(K.normalizeTimer(null), null);
  // timer zapisany w v0.3 (polskie słowa w action) jest odrzucany zamiast pokazać zły napis
  const old = JSON.parse(JSON.stringify(timer));
  old.plan.events[0].action = 'obróć';
  assert.equal(K.normalizeTimer(old), null);
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
