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
    { id: 'turn1', kind: 'turn', at: 14 * MIN, zone: 'Strefa 1 · Udka', action: 'flip', required: true },
    { id: 'turn2', kind: 'turn', at: (6 + 11) * MIN, zone: 'Strefa 2 · Ziemniaki', action: 'shake', required: true },
  ]);
});

test('timer: kolejka — single, match, sync, kilka turn, równoczesne; nigdy zdarzenia końca', () => {
  assert.deepEqual(queue(K.timerPlan({ mode: 'single', zone1: zone(19, flip(9)) })), [[9, 'turn1']]);
  assert.deepEqual(queue(K.timerPlan({ mode: 'match', zone1: zone(10, flip(6)), zone2: zone(10, flip(6)) })), [[6, 'turn1+turn2']]);
  assert.deepEqual(queue(K.timerPlan({ mode: 'sync', zone1: zone(30, flip(20)), zone2: zone(12, shake(4)) })), [[20, 'turn1'], [22, 'turn2']]);
  assert.deepEqual(queue(K.timerPlan({ mode: 'sync', zone1: zone(28, flip(14)), zone2: zone(20, shake(6)) })), [[14, 'turn1+turn2']]);
  assert.deepEqual(queue(K.timerPlan({ mode: 'independent', zone1: zone(30), zone2: zone(12, shake(6, false)) })), [[6, 'turn2']]);
});

test('timer: napisy nad licznikiem i w alarmie', () => {
  const g = (events) => ({ at: 0, events });
  const ev = (id, action, required, z) => ({ id, kind: 'turn', at: 0, zone: z || 'Strefa 1 · Udka', action, required });
  assert.equal(K.groupTitle(g([ev('turn1', 'flip', true)]), 'za'), 'OBRÓĆ ZA');
  assert.equal(K.groupTitle(g([ev('turn1', 'flip', true)]), 'po'), 'OBRÓĆ PO');
  assert.equal(K.groupTitle(g([ev('turn1', 'shake', true)]), 'teraz'), 'POTRZĄŚNIJ TERAZ');
  assert.equal(K.groupTitle(g([ev('turn1', 'flip', false)]), 'za'), 'można obrócić za');
  assert.equal(K.groupTitle(g([ev('turn1', 'shake', false)]), 'za'), 'można potrząsnąć za');
  const same = g([ev('turn1', 'flip', true), ev('turn2', 'flip', true, 'Strefa 2 · Skrzydełka')]);
  assert.equal(K.groupTitle(same, 'teraz'), 'OBRÓĆ TERAZ');
  assert.deepEqual(plain(K.groupZones(same)), ['Strefa 1 · Udka', 'Strefa 2 · Skrzydełka']);
  const mixed = g([ev('turn1', 'flip', true), ev('turn2', 'shake', false, 'Strefa 2 · Frytki')]);
  assert.equal(K.groupTitle(mixed, 'za'), 'OBRÓĆ / POTRZĄŚNIJ ZA');
  assert.deepEqual(plain(K.groupZones(mixed)), ['Strefa 1 · Udka — obróć', 'Strefa 2 · Frytki — potrząśnij']);
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
  assert.deepEqual(plain(K.timerDue(t, at(5))).events.map((e) => e.zone), ['Strefa 1 · Kotlety (2 szt.)', 'Strefa 2 · Kotlety (2 szt.)']);
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
  withEnd.plan.events.push({ id: 'end', kind: 'end', at: 19 * MIN, zone: '', action: '', required: true });
  assert.equal(K.normalizeTimer(withEnd), null);
  const polish = JSON.parse(JSON.stringify(timer));
  polish.plan.events[0].action = 'obróć';
  assert.equal(K.normalizeTimer(polish), null);
  const oldNoHolds = JSON.parse(JSON.stringify(timer));
  delete oldNoHolds.holds;
  assert.deepEqual(plain(K.normalizeTimer(oldNoHolds)).holds, {});
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
