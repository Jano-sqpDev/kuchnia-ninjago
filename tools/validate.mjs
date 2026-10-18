// Wczytywanie i walidacja przepisów z recipes/<slug>.md (schemat v1, opis w CLAUDE.md i docs/FORMAT-PRZEPISU.md).
// Walidator niczego nie poprawia — tylko zgłasza błędy w formacie:
//   plik.md → ścieżka.pola: przyczyna
// Build pomija przepisy z błędami i publikuje resztę; npm run validate i testy kończą się błędem.
// Tłumaczenie (translations.en) i tagi bez tłumaczenia (recipes/tags.yml) dają tylko OSTRZEŻENIA:
// przepis zawsze jest publikowany, a w trybie EN bez pełnego tłumaczenia wyświetla się po polsku.
import { readdirSync, readFileSync, existsSync, statSync, openSync, readSync, closeSync } from 'node:fs';
import { join, extname, basename } from 'node:path';
import { parseDocument } from 'yaml';

export const NINJA_FUNCTIONS = ['Air Fry', 'Max Crisp', 'Roast', 'Bake', 'Reheat', 'Dehydrate'];
export const NINJA_MODES = ['sync', 'match', 'independent', 'single'];
// Tagi, które trzeba zapisywać w formie kanonicznej (tm6 / ninja).
const FORBIDDEN_TAGS = { thermomix: 'tm6', airfryer: 'ninja', 'air fryer': 'ninja', af: 'ninja' };
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
// Tagi urządzeń — bez tłumaczenia (w obu językach tak samo).
export const DEVICE_TAGS = ['ninja', 'tm6'];
// Jednostki: zawsze angielskie skróty, w obu językach interfejsu.
export const UNITS = ['g', 'kg', 'ml', 'l', 'pcs', 'tbsp', 'tsp', 'pinch'];
// Podpowiedź przy nieznanej jednostce (porównanie małymi literami).
const UNIT_HINTS = {
  szt: 'pcs', 'szt.': 'pcs', sztuka: 'pcs', sztuki: 'pcs', sztuk: 'pcs', 'ząbek': 'pcs', 'ząbki': 'pcs', 'ząbków': 'pcs',
  piece: 'pcs', pieces: 'pcs', pc: 'pcs',
  'łyżka': 'tbsp', 'łyżki': 'tbsp', 'łyżek': 'tbsp', 'łyż.': 'tbsp', tablespoon: 'tbsp', tablespoons: 'tbsp',
  'łyżeczka': 'tsp', 'łyżeczki': 'tsp', 'łyżeczek': 'tsp', 'łyżeczkę': 'tsp', teaspoon: 'tsp', teaspoons: 'tsp',
  szczypta: 'pinch', szczypty: 'pinch', szczypt: 'pinch',
  gram: 'g', gramy: 'g', gramów: 'g', gr: 'g', kilogram: 'kg', litr: 'l', litry: 'l', litrów: 'l', mililitr: 'ml',
};

const KEYS = {
  root: ['schema_version', 'title', 'description', 'servings', 'prep_minutes', 'cook_minutes',
    'tags', 'ingredients', 'steps', 'ninja', 'image', 'source', 'translations'],
  ingredient: ['name', 'amount', 'unit', 'note', 'group'],
  step: ['text', 'tm6', 'internal_temp_c', 'timer_seconds'],
  tm6: ['duration_seconds', 'temperature', 'speed', 'reverse', 'mode'],
  ninja: ['mode', 'zone1', 'zone2'],
  zone: ['label', 'function', 'temp_c', 'minutes', 'turn'],
  turn: ['action', 'after_min', 'required'],
  translationEn: ['title', 'description', 'ingredients', 'groups', 'steps', 'labels'],
  translationIngredient: ['name', 'note'],
  translationStep: ['text', 'tm6_mode'],
  translationLabels: ['zone1', 'zone2'],
};
// ninja.zoneN.turn.action — kody czynności (napis na ekranie dobiera aplikacja: flip → „OBRÓĆ", shake → „POTRZĄŚNIJ").
export const TURN_ACTIONS = ['flip', 'shake'];

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const isNum = (v) => typeof v === 'number' && Number.isFinite(v);
const isInt = (v) => Number.isInteger(v);
const isText = (v) => typeof v === 'string' && v.trim() !== '';
const describeValue = (v) => (v === null ? 'pusta wartość' : JSON.stringify(v));

// Najczęstsze błędy składni YAML po polsku (kody z biblioteki yaml); oryginał zostaje w nawiasie.
const YAML_ERRORS_PL = {
  MISSING_CHAR: 'brakuje znaku zamykającego — najczęściej cudzysłowu " albo nawiasu ]',
  DUPLICATE_KEY: 'to samo pole występuje dwa razy',
  TAB_AS_INDENT: 'wcięcie zrobione tabulatorem — używaj spacji',
  BLOCK_AS_IMPLICIT_KEY: 'dwukropek w tekście bez cudzysłowu — weź cały tekst w cudzysłów "…"',
  MULTILINE_IMPLICIT_KEY: 'tekst rozbity na kilka linii bez cudzysłowu — weź go w cudzysłów "…"',
  BAD_INDENT: 'złe wcięcie — pola na tym samym poziomie muszą zaczynać się w tej samej kolumnie',
  UNEXPECTED_TOKEN: 'nieoczekiwany znak — sprawdź wcięcia, myślniki list i dwukropki',
  BAD_SCALAR_START: 'tekst zaczyna się znakiem specjalnym — weź go w cudzysłów "…"',
};

// Rozdziela plik na front matter (YAML) i treść Markdown.
export function parseRecipeFile(text) {
  const t = text.replace(/^﻿/, '').replace(/\r\n?/g, '\n');
  const m = t.match(/^---\n([\s\S]*?)\n---[ \t]*(?:\n([\s\S]*))?$/);
  if (!m) return { error: 'brak front matter — plik musi zaczynać się od linii --- i mieć zamykające ---' };
  const doc = parseDocument(m[1], { uniqueKeys: true, prettyErrors: false });
  if (doc.errors.length) {
    const e = doc.errors[0];
    // Numer linii w pliku liczony z pozycji błędu; linia 1 to otwierające ---.
    const lineInfo = e.pos && typeof e.pos[0] === 'number'
      ? ' (linia ' + (m[1].slice(0, e.pos[0]).split('\n').length + 1) + ')' : '';
    const original = e.message.split('\n')[0];
    const pl = YAML_ERRORS_PL[e.code];
    return { error: 'niepoprawny YAML' + lineInfo + ': ' + (pl ? pl + ' [' + original + ']' : original) };
  }
  return { data: doc.toJS(), body: (m[2] || '').trim() };
}

// Waliduje jeden przepis. Zwraca listę komunikatów (pusta = OK).
export function validateRecipe(data, { file, recipesDir } = {}) {
  const errs = [];
  const addError = (fieldPath, reason) => errs.push(file + ' → ' + fieldPath + ': ' + reason);

  function checkUnknownKeys(obj, allowed, fieldPath) {
    Object.keys(obj).forEach((k) => {
      if (!allowed.includes(k)) addError(fieldPath ? fieldPath + '.' + k : k, 'nieznane pole');
    });
  }
  // Pole opcjonalne: jeśli jest, musi być niepustym tekstem.
  function checkOptionalText(obj, k, fieldPath) {
    if (k in obj && !isText(obj[k])) addError(fieldPath, 'musi być niepustym tekstem (albo usuń pole), jest ' + describeValue(obj[k]));
  }
  function checkInteger(obj, k, fieldPath, min, wymagane) {
    if (!(k in obj)) { if (wymagane) addError(fieldPath, 'brak wymaganego pola'); return; }
    const v = obj[k];
    if (!isInt(v)) addError(fieldPath, 'musi być liczbą całkowitą, jest ' + describeValue(v));
    else if (v < min) addError(fieldPath, 'musi być >= ' + min + ', jest ' + v);
  }

  if (!isObj(data)) {
    addError('(front matter)', 'musi być obiektem YAML z polami przepisu');
    return errs;
  }
  checkUnknownKeys(data, KEYS.root, '');

  // --- pola główne ---
  if (!('schema_version' in data)) addError('schema_version', 'brak wymaganego pola');
  else if (data.schema_version !== 1) addError('schema_version', 'musi być dokładnie 1, jest ' + describeValue(data.schema_version));

  if (!('title' in data)) addError('title', 'brak wymaganego pola');
  else if (!isText(data.title)) addError('title', 'musi być niepustym tekstem');

  checkOptionalText(data, 'description', 'description');
  checkOptionalText(data, 'source', 'source');
  checkInteger(data, 'servings', 'servings', 1, true);
  checkInteger(data, 'prep_minutes', 'prep_minutes', 0, true);
  checkInteger(data, 'cook_minutes', 'cook_minutes', 0, true);

  // --- tagi ---
  let tagList = [];
  if (!('tags' in data)) addError('tags', 'brak wymaganego pola (może być pusta lista: [])');
  else if (!Array.isArray(data.tags)) addError('tags', 'musi być listą, np. [deser, kurczak]');
  else {
    const seen = new Set();
    data.tags.forEach((tag, i) => {
      const s = 'tags[' + i + ']';
      if (!isText(tag)) { addError(s, 'musi być niepustym tekstem, jest ' + describeValue(tag)); return; }
      if (tag !== tag.trim().toLowerCase()) addError(s, 'tag zapisuj małymi literami, bez spacji na brzegach: "' + tag + '"');
      if (FORBIDDEN_TAGS[tag]) addError(s, 'użyj tagu "' + FORBIDDEN_TAGS[tag] + '" zamiast "' + tag + '" (alias działa tylko w wyszukiwarce)');
      if (seen.has(tag)) addError(s, 'powtórzony tag "' + tag + '"');
      seen.add(tag);
    });
    tagList = data.tags;
  }

  // --- składniki ---
  if (!('ingredients' in data)) addError('ingredients', 'brak wymaganego pola');
  else if (!Array.isArray(data.ingredients) || data.ingredients.length === 0) addError('ingredients', 'musi być niepustą listą składników');
  else {
    data.ingredients.forEach((ing, i) => {
      const s = 'ingredients[' + i + ']';
      if (!isObj(ing)) { addError(s, 'składnik musi być obiektem z polem name, jest ' + describeValue(ing)); return; }
      checkUnknownKeys(ing, KEYS.ingredient, s);
      if (!isText(ing.name)) addError(s + '.name', 'brak nazwy składnika');
      if ('amount' in ing) {
        if (!isNum(ing.amount)) addError(s + '.amount', 'musi być liczbą (ułamki z kropką, np. 1.5), jest ' + describeValue(ing.amount));
        else if (ing.amount <= 0) addError(s + '.amount', 'musi być > 0, jest ' + ing.amount);
        if (!('unit' in ing)) addError(s + '.unit', 'wymagane, gdy jest amount');
      } else if ('unit' in ing) {
        addError(s + '.unit', 'jednostka bez ilości — dodaj amount albo przenieś opis do note');
      }
      checkOptionalText(ing, 'unit', s + '.unit');
      if (isText(ing.unit) && !UNITS.includes(ing.unit)) {
        const hint = UNIT_HINTS[ing.unit.toLowerCase()] || (UNITS.includes(ing.unit.toLowerCase()) ? ing.unit.toLowerCase() : null);
        addError(s + '.unit', 'nieznana jednostka ' + describeValue(ing.unit) + ' — dozwolone: ' + UNITS.join(', ') +
          (hint ? ' (zamiast "' + ing.unit + '" użyj "' + hint + '")' : ''));
      }
      checkOptionalText(ing, 'note', s + '.note');
      checkOptionalText(ing, 'group', s + '.group');
    });
  }

  // --- kroki ---
  let tm6StepCount = 0;
  if (!('steps' in data)) addError('steps', 'brak wymaganego pola');
  else if (!Array.isArray(data.steps) || data.steps.length === 0) addError('steps', 'musi być niepustą listą kroków');
  else {
    data.steps.forEach((step, i) => {
      const s = 'steps[' + i + ']';
      if (!isObj(step)) { addError(s, 'krok musi być obiektem z polem text, jest ' + describeValue(step)); return; }
      checkUnknownKeys(step, KEYS.step, s);
      if (!isText(step.text)) addError(s + '.text', 'brak treści kroku');
      if ('internal_temp_c' in step) {
        const v = step.internal_temp_c;
        if (!isNum(v)) addError(s + '.internal_temp_c', 'musi być liczbą °C, jest ' + describeValue(v));
        else if (v <= 0 || v > 100) addError(s + '.internal_temp_c', 'poza zakresem 1–100 °C: ' + v);
      }
      checkInteger(step, 'timer_seconds', s + '.timer_seconds', 1, false);
      if ('tm6' in step) {
        tm6StepCount++;
        validateTm6(step.tm6, s + '.tm6');
      }
    });
  }

  function validateTm6(t, s) {
    if (!isObj(t)) { addError(s, 'musi być obiektem z ustawieniami TM6'); return; }
    checkUnknownKeys(t, KEYS.tm6, s);
    checkInteger(t, 'duration_seconds', s + '.duration_seconds', 1, true);
    if ('temperature' in t) {
      const v = t.temperature;
      if (isNum(v)) { if (v < 37 || v > 120) addError(s + '.temperature', 'poza zakresem 37–120 °C: ' + v); }
      else if (v !== 'Varoma') addError(s + '.temperature', 'musi być liczbą 37–120 albo dokładnie "Varoma", jest ' + describeValue(v));
    }
    if ('speed' in t) {
      const v = t.speed;
      const ok = v === 'spoon' || v === 'turbo' || (isNum(v) && v >= 1 && v <= 10 && isInt(v * 2));
      if (!ok) addError(s + '.speed', 'niepoprawna wartość ' + describeValue(v) + ' — dozwolone 1–10 co 0.5, "spoon" albo "turbo"');
    } else if (!('mode' in t)) {
      addError(s + '.speed', 'brak wymaganego pola (można pominąć tylko przy ustawionym mode)');
    }
    if ('reverse' in t && typeof t.reverse !== 'boolean') addError(s + '.reverse', 'musi być true albo false, jest ' + describeValue(t.reverse));
    checkOptionalText(t, 'mode', s + '.mode');
  }

  // --- Ninja ---
  const hasNinjaTag = tagList.includes('ninja');
  if ('ninja' in data) {
    if (!hasNinjaTag) addError('ninja', 'jest panel Ninja, ale brak tagu "ninja" w tags');
    validateNinja(data.ninja);
  } else if (hasNinjaTag) {
    addError('tags', 'jest tag "ninja", ale brak panelu ninja');
  }

  function validateNinja(n) {
    if (!isObj(n)) { addError('ninja', 'musi być obiektem z polami mode, zone1, zone2'); return; }
    checkUnknownKeys(n, KEYS.ninja, 'ninja');
    const modeOk = NINJA_MODES.includes(n.mode);
    if (!('mode' in n)) addError('ninja.mode', 'brak wymaganego pola');
    else if (!modeOk) addError('ninja.mode', 'nieznany tryb ' + describeValue(n.mode) + ' — dozwolone: ' + NINJA_MODES.join(', '));

    if (!('zone1' in n)) addError('ninja.zone1', 'brak wymaganego pola');
    else validateZone(n.zone1, 'ninja.zone1');

    if (modeOk) {
      if (n.mode === 'single') {
        if ('zone2' in n) addError('ninja.zone2', 'w trybie single nie może być drugiej strefy');
      } else if (!('zone2' in n)) {
        addError('ninja.zone2', 'wymagana w trybie ' + n.mode);
      }
    }
    if ('zone2' in n && n.mode !== 'single') validateZone(n.zone2, 'ninja.zone2');

    if (n.mode === 'match' && isObj(n.zone1) && isObj(n.zone2)) {
      ['function', 'temp_c', 'minutes'].forEach((k) => {
        if (n.zone1[k] !== n.zone2[k]) {
          addError('ninja.zone2.' + k, 'w trybie match musi być takie samo jak w zone1 (' + describeValue(n.zone1[k]) + ' ≠ ' + describeValue(n.zone2[k]) + ')');
        }
      });
    }
  }

  function validateZone(z, s) {
    if (!isObj(z)) { addError(s, 'musi być obiektem z polami function, temp_c, minutes'); return; }
    checkUnknownKeys(z, KEYS.zone, s);
    checkOptionalText(z, 'label', s + '.label');
    if (!('function' in z)) addError(s + '.function', 'brak wymaganego pola');
    else if (!NINJA_FUNCTIONS.includes(z.function)) addError(s + '.function', 'nieznana funkcja ' + describeValue(z.function) + ' — dozwolone: ' + NINJA_FUNCTIONS.join(', '));
    if (!('temp_c' in z)) addError(s + '.temp_c', 'brak wymaganego pola');
    else if (!isNum(z.temp_c)) addError(s + '.temp_c', 'musi być liczbą, jest ' + describeValue(z.temp_c));
    else if (z.temp_c < 40 || z.temp_c > 240) addError(s + '.temp_c', 'poza zakresem 40–240 °C: ' + z.temp_c);
    checkInteger(z, 'minutes', s + '.minutes', 1, true);
    if ('turn' in z) validateTurn(z.turn, s + '.turn', isInt(z.minutes) && z.minutes >= 1 ? z.minutes : null);
  }

  // Przypomnienie o obróceniu / potrząśnięciu w strefie (opcjonalne; brak = nie trzeba).
  function validateTurn(t, s, zoneMinutes) {
    if (!isObj(t)) { addError(s, 'musi być obiektem z polami action, after_min (i opcjonalnie required)'); return; }
    checkUnknownKeys(t, KEYS.turn, s);
    if (!('action' in t)) addError(s + '.action', 'brak wymaganego pola');
    else if (!TURN_ACTIONS.includes(t.action)) addError(s + '.action', 'nieznana czynność ' + describeValue(t.action) + ' — dozwolone: ' + TURN_ACTIONS.join(', '));
    checkInteger(t, 'after_min', s + '.after_min', 1, true);
    if (isInt(t.after_min) && t.after_min >= 1 && zoneMinutes !== null && t.after_min >= zoneMinutes) {
      addError(s + '.after_min', 'musi być mniejsze niż czas strefy (' + zoneMinutes + ' min), jest ' + t.after_min);
    }
    if ('required' in t && typeof t.required !== 'boolean') addError(s + '.required', 'musi być true albo false, jest ' + describeValue(t.required));
  }

  // --- TM6: tag ⇔ co najmniej jeden krok z tm6 ---
  const hasTm6Tag = tagList.includes('tm6');
  if (hasTm6Tag && tm6StepCount === 0) addError('tags', 'jest tag "tm6", ale żaden krok nie ma ustawień tm6');
  if (!hasTm6Tag && tm6StepCount > 0) addError('tags', 'kroki mają ustawienia tm6, ale brak tagu "tm6"');

  // --- zdjęcie (pole image; zdjęcie po nazwie sprawdza loadRecipes) ---
  if ('image' in data) validateImage(data.image);

  function validateImage(img) {
    if (!isText(img)) { addError('image', 'musi być ścieżką do pliku, np. img/' + basename(file, '.md') + '.jpg'); return; }
    if (!IMAGE_PATH_RE.test(img) || img.split('/').includes('..')) {
      addError('image', 'musi wskazywać plik JPEG/PNG/HEIC w recipes/img/, np. img/' + basename(file, '.md') + '.jpg (jest "' + img + '")');
      return;
    }
    const problem = checkImageFile(recipesDir || '.', img);
    if (problem) addError('image', problem);
  }

  return errs;
}

// Tłumaczenie EN (translations.en) — wywoływane tylko dla poprawnego przepisu.
// Zwraca listę OSTRZEŻEŃ w formacie błędów (pusta = tłumaczenie kompletne i zgodne z oryginałem).
// Ostrzeżenie nigdy nie ukrywa przepisu: build publikuje go bez tłumaczenia (w trybie EN — po polsku).
export function validateTranslations(data, { file } = {}) {
  const warns = [];
  const warn = (fieldPath, reason) => warns.push(file + ' → ' + fieldPath + ': ' + reason);
  const unknownKeys = (obj, allowed, fieldPath) => Object.keys(obj).forEach((k) => {
    if (!allowed.includes(k)) warn(fieldPath + '.' + k, 'nieznane pole');
  });
  // Tekst wymagany, gdy oryginał go ma; zbędny, gdy oryginał go nie ma.
  const matchText = (obj, k, fieldPath, needed, what) => {
    if (k in obj) {
      if (!needed) warn(fieldPath, 'oryginał nie ma ' + what + ' — usuń to pole');
      else if (!isText(obj[k])) warn(fieldPath, 'musi być niepustym tekstem, jest ' + describeValue(obj[k]));
    } else if (needed) warn(fieldPath, 'brak tłumaczenia (' + what + ')');
  };

  if (!('translations' in data)) {
    warn('translations.en', 'brak tłumaczenia EN — w trybie EN przepis wyświetla się po polsku');
    return warns;
  }
  const tr = data.translations;
  if (!isObj(tr)) { warn('translations', 'musi być obiektem z blokiem en'); return warns; }
  Object.keys(tr).forEach((k) => { if (k !== 'en') warn('translations.' + k, 'nieznany język — dozwolony tylko en'); });
  if (!('en' in tr)) { warn('translations.en', 'brak tłumaczenia EN — w trybie EN przepis wyświetla się po polsku'); return warns; }
  const en = tr.en;
  const p = 'translations.en';
  if (!isObj(en)) { warn(p, 'musi być obiektem z polami title, ingredients, steps…'); return warns; }
  unknownKeys(en, KEYS.translationEn, p);

  matchText(en, 'title', p + '.title', true, 'title');
  matchText(en, 'description', p + '.description', 'description' in data, 'description');

  // Listy: tyle samo pozycji i w tej samej kolejności co w oryginale.
  function matchList(k, orig, itemKeys, checkItem) {
    const fieldPath = p + '.' + k;
    if (!(k in en)) { warn(fieldPath, 'brak tłumaczenia (' + k + ')'); return; }
    const list = en[k];
    if (!Array.isArray(list)) { warn(fieldPath, 'musi być listą — tyle samo pozycji co ' + k + ' (' + orig.length + ')'); return; }
    if (list.length !== orig.length) warn(fieldPath, 'musi mieć tyle samo pozycji i w tej samej kolejności co ' + k + ' (' + orig.length + '), jest ' + list.length);
    list.forEach((item, i) => {
      const s = fieldPath + '[' + i + ']';
      if (!isObj(item)) { warn(s, 'musi być obiektem, jest ' + describeValue(item)); return; }
      unknownKeys(item, itemKeys, s);
      if (i < orig.length) checkItem(item, orig[i], s);
    });
  }
  matchList('ingredients', data.ingredients, KEYS.translationIngredient, (item, orig, s) => {
    matchText(item, 'name', s + '.name', true, 'name');
    matchText(item, 'note', s + '.note', 'note' in orig, 'note');
  });
  matchList('steps', data.steps, KEYS.translationStep, (item, orig, s) => {
    matchText(item, 'text', s + '.text', true, 'text');
    matchText(item, 'tm6_mode', s + '.tm6_mode', !!(orig.tm6 && 'mode' in orig.tm6), 'tm6.mode');
  });

  // Grupy składników: mapa nazwa PL → nazwa EN, dla każdej użytej grupy.
  const groups = [];
  data.ingredients.forEach((ing) => { if (ing.group && !groups.includes(ing.group)) groups.push(ing.group); });
  if ('groups' in en) {
    if (!isObj(en.groups)) warn(p + '.groups', 'musi być mapą: nazwa grupy PL: nazwa EN');
    else {
      groups.forEach((g) => {
        if (!(g in en.groups)) warn(p + '.groups', 'brak tłumaczenia grupy "' + g + '"');
        else if (!isText(en.groups[g])) warn(p + '.groups', 'tłumaczenie grupy "' + g + '" musi być niepustym tekstem');
      });
      Object.keys(en.groups).forEach((g) => {
        if (!groups.includes(g)) warn(p + '.groups', 'grupy "' + g + '" nie ma w ingredients — usuń ją');
      });
    }
  } else if (groups.length) warn(p + '.groups', 'brak tłumaczenia grup: ' + groups.map((g) => '"' + g + '"').join(', '));

  // Opisy szuflad Ninja (label): zone1 / zone2, gdy oryginał je ma.
  const n = data.ninja;
  const labelled = ['zone1', 'zone2'].filter((z) => n && !(z === 'zone2' && n.mode === 'single') && n[z] && 'label' in n[z]);
  if ('labels' in en) {
    if (!isObj(en.labels)) warn(p + '.labels', 'musi być obiektem z polami zone1 / zone2');
    else {
      unknownKeys(en.labels, KEYS.translationLabels, p + '.labels');
      KEYS.translationLabels.forEach((z) => matchText(en.labels, z, p + '.labels.' + z, labelled.includes(z), 'ninja.' + z + '.label'));
    }
  } else if (labelled.length) warn(p + '.labels', 'brak tłumaczenia opisów szuflad: ' + labelled.join(', '));

  return warns;
}

// Tagi bez tłumaczenia w recipes/tags.yml (tagi urządzeń pomijamy). Ostrzeżenia — w trybie EN tag zostaje po polsku.
export function tagWarnings(tags, tagMap, { file } = {}) {
  const warns = [];
  tags.forEach((tag, i) => {
    if (!DEVICE_TAGS.includes(tag) && !Object.prototype.hasOwnProperty.call(tagMap, tag)) {
      warns.push(file + ' → tags[' + i + ']: brak tłumaczenia tagu "' + tag + '" w recipes/tags.yml');
    }
  });
  return warns;
}

// recipes/tags.yml: mapa tag_PL: tag_EN. Zwraca { map, warnings } — zły plik nie psuje buildu (pusta mapa + ostrzeżenie).
// Znaczniki (od v0.8): tag z polami badge + color w tags.yml dostaje kolorową plakietkę i chip filtra.
// Kolory z zamkniętej listy (tokeny w src/app.css), etykieta krótka, wielkimi literami, ta sama w PL i EN.
export const BADGE_COLORS = ['yellow', 'green', 'orange', 'pink', 'red'];
const BADGE_RE = /^[A-Z0-9]{1,6}$/;
const TAG_ENTRY_KEYS = ['en', 'badge', 'color', 'group'];
// Grupy znaczników (od v0.9): sekcja „groups" w tags.yml (zarezerwowany klucz, nie tag). Znaczniki z jednej grupy
// wykluczają się w przepisie; required: true — brak znacznika z grupy to błąd, false — ostrzeżenie.
export const GROUPS_KEY = 'groups';
const GROUP_KEYS = ['required'];

// recipes/tags.yml: tag_PL: tag_EN (tekst) albo tag_PL: { en: tag_EN, badge: ETYKIETA, color: kolor, group: grupa } (znacznik),
// plus sekcja groups: { nazwa: { required: true|false } }.
// Zwraca { map (tłumaczenia), badges (tag → { label, color, group?, rank }), groups (nazwa → { required, tags }),
// rejected (tagi z błędną definicją znacznika), warnings } — zły plik albo wpis nie psuje buildu:
// złe wpisy są pomijane z ostrzeżeniem (tag zostaje zwykłym tagiem). rank = kolejność w pliku.
export function parseTagMap(text) {
  const map = {};
  const badges = {};
  const groups = {};
  const rejected = [];
  const warnings = [];
  const w = (fieldPath, reason) => warnings.push('tags.yml → ' + fieldPath + ': ' + reason);
  const doc = parseDocument(text.replace(/^﻿/, ''), { uniqueKeys: true, prettyErrors: false });
  if (doc.errors.length) {
    const e = doc.errors[0];
    const pl = YAML_ERRORS_PL[e.code];
    const original = e.message.split('\n')[0];
    w('(YAML)', 'niepoprawny YAML: ' + (pl ? pl + ' [' + original + ']' : original) + ' — tagi w trybie EN bez tłumaczenia i bez plakietek');
    return { map, badges, groups, rejected, warnings };
  }
  const data = doc.toJS();
  if (data === null || data === undefined) return { map, badges, groups, rejected, warnings };
  if (!isObj(data)) { w('(plik)', 'musi być mapą: tag_PL: tag_EN'); return { map, badges, groups, rejected, warnings }; }
  // Grupy znaczników najpierw (znaczniki mogą stać w pliku przed sekcją groups).
  if (GROUPS_KEY in data) {
    const g = data[GROUPS_KEY];
    if (!isObj(g)) w(GROUPS_KEY, 'musi być mapą: nazwa_grupy: { required: true | false }');
    else {
      Object.keys(g).forEach((name) => {
        const def = g[name];
        if (!/^[a-z0-9-]+$/.test(name)) { w(GROUPS_KEY + '.' + name, 'nazwa grupy: małe litery a–z, cyfry i myślniki'); return; }
        if (!isObj(def)) { w(GROUPS_KEY + '.' + name, 'musi być obiektem, np. { required: false }'); return; }
        Object.keys(def).forEach((k) => { if (!GROUP_KEYS.includes(k)) w(GROUPS_KEY + '.' + name + '.' + k, 'nieznane pole — dozwolone: required'); });
        if ('required' in def && typeof def.required !== 'boolean') { w(GROUPS_KEY + '.' + name + '.required', 'musi być true albo false, jest ' + describeValue(def.required)); return; }
        groups[name] = { required: def.required === true, tags: [] };
      });
    }
  }
  let rank = 0;
  const checkEn = (tag, en, fieldPath) => {
    if (!isText(en)) { w(fieldPath, 'tłumaczenie musi być niepustym tekstem, jest ' + describeValue(en)); return; }
    if (en !== en.trim().toLowerCase()) { w(fieldPath, 'tłumaczenie zapisuj małymi literami: "' + en + '"'); return; }
    map[tag] = en;
  };
  Object.keys(data).forEach((tag) => {
    if (tag === GROUPS_KEY) return;
    const v = data[tag];
    if (tag !== tag.trim().toLowerCase()) { w(tag, 'tag zapisuj małymi literami'); return; }
    if (!isObj(v)) { checkEn(tag, v, tag); return; }
    // Znacznik: { en, badge, color }
    Object.keys(v).forEach((k) => { if (!TAG_ENTRY_KEYS.includes(k)) w(tag + '.' + k, 'nieznane pole — dozwolone: ' + TAG_ENTRY_KEYS.join(', ')); });
    if ('en' in v) checkEn(tag, v.en, tag + '.en');
    if (!('badge' in v) && !('color' in v)) {
      if ('group' in v) { w(tag + '.group', 'grupa tylko przy znaczniku — dopisz badge i color'); rejected.push(tag); }
      return;
    }
    if (DEVICE_TAGS.includes(tag)) { w(tag, 'tag urządzenia nie może mieć plakietki (ma już NINJA / TM6)'); rejected.push(tag); return; }
    let ok = true;
    if (!('badge' in v)) { w(tag + '.badge', 'brak etykiety plakietki (jest color) — dopisz np. badge: ' + tag.toUpperCase().slice(0, 6)); ok = false; }
    else if (typeof v.badge !== 'string' || !BADGE_RE.test(v.badge)) {
      w(tag + '.badge', 'etykieta plakietki: 1–6 znaków, wielkie litery A–Z i cyfry (np. KIDS), jest ' + describeValue(v.badge)); ok = false;
    }
    if (!('color' in v)) { w(tag + '.color', 'brak koloru plakietki — dozwolone: ' + BADGE_COLORS.join(', ')); ok = false; }
    else if (!BADGE_COLORS.includes(v.color)) { w(tag + '.color', 'nieznany kolor ' + describeValue(v.color) + ' — dozwolone: ' + BADGE_COLORS.join(', ')); ok = false; }
    if ('group' in v && !Object.prototype.hasOwnProperty.call(groups, v.group)) {
      w(tag + '.group', 'nieznana grupa ' + describeValue(v.group) + ' — dopisz ją w sekcji groups' +
        (Object.keys(groups).length ? ' (są: ' + Object.keys(groups).join(', ') + ')' : '')); ok = false;
    }
    if (!ok) { rejected.push(tag); return; }
    badges[tag] = { label: v.badge, color: v.color, rank: rank++ };
    if ('group' in v) { badges[tag].group = v.group; groups[v.group].tags.push(tag); }
  });
  return { map, badges, groups, rejected, warnings };
}

// Plakietki przepisu: [{ tag, label, color, group?, rank }] — najpierw znaczniki z grup, potem bez grupy,
// w każdej części w kolejności z tags.yml (tylko tagi będące znacznikami).
export function recipeBadges(tags, badgeMap) {
  const out = tags.filter((t) => Object.prototype.hasOwnProperty.call(badgeMap || {}, t)).map((t) => {
    const b = badgeMap[t], o = { tag: t, label: b.label, color: b.color };
    if (b.group) o.group = b.group;
    o.rank = typeof b.rank === 'number' ? b.rank : 0;
    return o;
  });
  return out.sort((a, b) => ((a.group ? 0 : 1) - (b.group ? 0 : 1)) || (a.rank - b.rank));
}

// Znaczniki w przepisie względem grup z tags.yml: dwa z jednej grupy = błąd; brak znacznika z grupy = ostrzeżenie
// (required: false) albo błąd (required: true); tag z błędną definicją znacznika = ostrzeżenie.
// Zwraca { errors, warnings } w formacie „plik → tags: przyczyna".
export function badgeGroupCheck(tags, tagInfo, { file } = {}) {
  const errors = [], warnings = [];
  const info = tagInfo || {}, badges = info.badges || {}, groups = info.groups || {};
  Object.keys(groups).forEach((name) => {
    const g = groups[name];
    if (!g.tags.length) return;
    const used = tags.filter((t) => g.tags.includes(t));
    const labels = g.tags.map((t) => badges[t].label).join('/');
    if (used.length > 1) {
      errors.push(file + ' → tags: znaczniki ' + used.map((t) => badges[t].label).join(' i ') + ' wykluczają się (grupa ' + name + ') — zostaw jeden');
    } else if (!used.length) {
      (g.required ? errors : warnings).push(file + ' → tags: brak znacznika ' + labels + ' (grupa ' + name + ' w recipes/tags.yml) — dopisz jeden z tagów: ' + g.tags.join(', '));
    }
  });
  (info.rejected || []).forEach((t) => {
    if (tags.includes(t)) warnings.push(file + ' → tags: tag „' + t + '” ma błędną definicję znacznika w recipes/tags.yml — plakietki nie ma');
  });
  return { errors, warnings };
}

// Tagi w trybie EN: tłumaczenie z tags.yml, brakujące i tagi urządzeń bez zmian.
export function translateTags(tags, tagMap) {
  return tags.map((tag) => (!DEVICE_TAGS.includes(tag) && Object.prototype.hasOwnProperty.call(tagMap, tag) ? tagMap[tag] : tag));
}

const IMAGE_PATH_RE = /^img\/(?:[a-z0-9._-]+\/)*[a-z0-9._-]+\.(jpe?g|png|heic|heif)$/i;
const IMAGE_EXT_ORDER = ['jpg', 'jpeg', 'png', 'heic', 'heif'];
const HEIC_BRANDS = ['heic', 'heix', 'hevc', 'hevx', 'heim', 'heis', 'mif1', 'msf1'];

// Format zdjęcia po pierwszych bajtach: 'jpeg' | 'png' | 'heic' | null.
export function imageKind(header) {
  if (header.length >= 3 && header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff) return 'jpeg';
  if (header.length >= 8 && header.slice(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'png';
  if (header.length >= 12 && header.toString('latin1', 4, 8) === 'ftyp' && HEIC_BRANDS.includes(header.toString('latin1', 8, 12))) return 'heic';
  return null;
}

function readHeader(fullPath) {
  const header = Buffer.alloc(12);
  const fd = openSync(fullPath, 'r');
  const n = readSync(fd, header, 0, 12, 0);
  closeSync(fd);
  return header.slice(0, n);
}

// Sprawdza plik zdjęcia (ścieżka względem recipes/). Zwraca opis problemu albo null.
function checkImageFile(recipesDir, img) {
  const fullPath = join(recipesDir, img);
  if (!existsSync(fullPath) || !statSync(fullPath).isFile()) return 'plik nie istnieje: recipes/' + img;
  if (!imageKind(readHeader(fullPath))) {
    return 'plik recipes/' + img + ' nie jest prawdziwym JPEG/PNG/HEIC (WebP i AVIF nie działają na Safari 12 — zapisz zdjęcie jako JPEG)';
  }
  return null;
}

// Zdjęcie po nazwie: recipes/img/<slug>.jpg / .jpeg / .png / .heic (wielkość liter bez znaczenia).
// Zwraca ścieżkę względem recipes/ (np. „img/udka.JPG") albo null.
export function findImageBySlug(recipesDir, slug) {
  const dir = join(recipesDir, 'img');
  if (!existsSync(dir) || !statSync(dir).isDirectory()) return null;
  const found = readdirSync(dir)
    .map((name) => ({ name, m: /^(.+)\.(jpe?g|png|heic|heif)$/i.exec(name) }))
    .filter((x) => x.m && x.m[1].toLowerCase() === slug)
    .sort((a, b) => IMAGE_EXT_ORDER.indexOf(a.m[2].toLowerCase()) - IMAGE_EXT_ORDER.indexOf(b.m[2].toLowerCase()));
  return found.length ? 'img/' + found[0].name : null;
}

// Propozycja poprawnej nazwy pliku: „Pierogi Ruskie.md" → „pierogi-ruskie.md".
export function suggestSlug(name) {
  return name.toLowerCase().replace(/ł/g, 'l').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'nazwa-przepisu';
}

// „plik.md → ścieżka: przyczyna" → { file, path, reason }
export function splitError(line) {
  const a = line.indexOf(' → ');
  const rest = line.slice(a + 3);
  const b = rest.indexOf(': ');
  return { file: line.slice(0, a), path: rest.slice(0, b), reason: rest.slice(b + 2) };
}

const FIELD_NAMES = {
  schema_version: 'wersja schematu', title: 'tytuł', description: 'opis', servings: 'porcje',
  prep_minutes: 'czas przygotowania', cook_minutes: 'czas gotowania', tags: 'tagi', ingredients: 'składniki',
  steps: 'kroki', ninja: 'Ninja', image: 'zdjęcie', source: 'źródło', name: 'nazwa', amount: 'ilość',
  unit: 'jednostka', note: 'uwaga', group: 'grupa', text: 'treść', tm6: 'TM6', internal_temp_c: 'temperatura w środku',
  timer_seconds: 'minutnik', duration_seconds: 'czas', temperature: 'temperatura', speed: 'obroty', reverse: 'wsteczne',
  mode: 'tryb', zone1: 'strefa 1', zone2: 'strefa 2', label: 'opis szuflady', function: 'funkcja', temp_c: 'temperatura',
  minutes: 'minuty', turn: 'obracanie', action: 'czynność', after_min: 'po ilu minutach', required: 'alarm',
  translations: 'tłumaczenie', en: 'EN', groups: 'grupy', labels: 'opisy szuflad', tm6_mode: 'tryb TM6',
};
const LIST_ITEMS = { ingredients: 'składnik', steps: 'krok', tags: 'tag' };
const SPECIAL_PATHS = {
  '(YAML)': 'zapis pliku (YAML)', '(plik)': 'plik', '(nazwa pliku)': 'nazwa pliku', '(front matter)': 'początek pliku (---)',
};

// Ścieżka pola po ludzku: „steps[2].tm6.speed" → „krok 3 → TM6 → obroty".
export function describePath(path) {
  if (SPECIAL_PATHS[path]) return SPECIAL_PATHS[path];
  return path.split('.').map((part) => {
    const m = /^([a-z0-9_]+)\[(\d+)\]$/.exec(part);
    if (m) return (LIST_ITEMS[m[1]] || FIELD_NAMES[m[1]] || m[1]) + ' ' + (Number(m[2]) + 1);
    return FIELD_NAMES[part] || '„' + part + '”';
  }).join(' → ');
}

// Plik z tłumaczeniami tagów w katalogu przepisów (utrzymuje ChatGPT).
export const TAGS_FILE = 'tags.yml';

// Wczytuje wszystkie przepisy z katalogu (brak katalogu = pusta kolekcja).
// Zwraca { recipes, errors, problems, warnings, notices, tagMap, badgeMap }:
//   recipes  — poprawne przepisy: { slug, data, body, image, translated } (image: ścieżka względem recipes/ albo null;
//              translated: tłumaczenie EN kompletne — tylko wtedy trafia na stronę),
//   errors   — wszystkie komunikaty „plik → ścieżka: przyczyna" (npm run validate, testy),
//   problems — te same błędy jako { file, path, where, reason, skipped } (dla strony: errors.json),
//   warnings — ostrzeżenia (tłumaczenie EN, tagi bez tłumaczenia, tags.yml) w tym samym formacie co errors,
//   notices  — ostrzeżenia jako { file, path, where, reason } (dla strony: warnings.json),
//   tagMap   — tłumaczenia tagów z tags.yml,
//   badgeMap — znaczniki z tags.yml: tag → { label, color }.
// skipped = true: przepisu nie ma na stronie; false: jest, ale np. bez zdjęcia.
export function loadRecipes(recipesDir) {
  const recipes = [];
  const errors = [];
  const problems = [];
  const warnings = [];
  const notices = [];
  const slugs = new Map();
  const report = (lines, skipped) => lines.forEach((line) => {
    errors.push(line);
    const e = splitError(line);
    problems.push({ file: e.file, path: e.path, where: describePath(e.path), reason: e.reason, skipped });
  });
  const notice = (lines) => lines.forEach((line) => {
    warnings.push(line);
    const e = splitError(line);
    notices.push({ file: e.file, path: e.path, where: describePath(e.path), reason: e.reason });
  });

  if (!existsSync(recipesDir)) return { recipes, errors, problems, warnings, notices, tagMap: {}, badgeMap: {} };

  let tagMap = {};
  let badgeMap = {};
  let tagInfo = { badges: {}, groups: {}, rejected: [] };
  const tagsPath = join(recipesDir, TAGS_FILE);
  if (existsSync(tagsPath)) {
    const t = parseTagMap(readFileSync(tagsPath, 'utf8'));
    tagMap = t.map;
    badgeMap = t.badges;
    tagInfo = { badges: t.badges, groups: t.groups, rejected: t.rejected };
    notice(t.warnings);
  }

  const files = readdirSync(recipesDir, { withFileTypes: true })
    .filter((d) => d.isFile() && d.name !== '.gitkeep' && d.name !== TAGS_FILE)
    .map((d) => d.name)
    .sort();

  files.forEach((file) => {
    if (extname(file) !== '.md') {
      report([file + ' → (plik): w recipes/ mogą być tylko pliki .md (zdjęcia w recipes/img/)'], true);
      return;
    }
    const slug = basename(file, '.md');
    if (!SLUG_RE.test(slug)) {
      report([file + ' → (nazwa pliku): nazwa pliku może mieć tylko małe litery a-z, cyfry i myślniki (bez polskich znaków i spacji) — zmień na ' + suggestSlug(slug) + '.md'], true);
      return;
    }
    if (slugs.has(slug)) {
      report([file + ' → (nazwa pliku): slug powtarza się z ' + slugs.get(slug)], true);
      return;
    }
    slugs.set(slug, file);

    const result = parseRecipeFile(readFileSync(join(recipesDir, file), 'utf8'));
    if (result.error) { report([file + ' → (YAML): ' + result.error], true); return; }
    const errs = validateRecipe(result.data, { file: file, recipesDir });
    if (errs.length) { report(errs, true); return; }
    // Znaczniki względem grup z tags.yml (od v0.9): wykluczające się = błąd (przepis pominięty), brak = ostrzeżenie / błąd.
    const groupCheck = badgeGroupCheck(result.data.tags, tagInfo, { file });
    if (groupCheck.errors.length) { report(groupCheck.errors, true); return; }
    notice(groupCheck.warnings);

    // Bez pola image — zdjęcie po nazwie pliku. Zły plik nie ukrywa przepisu: publikujemy go bez zdjęcia.
    let image = result.data.image || null;
    if (!image) {
      const auto = findImageBySlug(recipesDir, slug);
      const problem = auto && checkImageFile(recipesDir, auto);
      if (problem) report([file + ' → image: (zdjęcie po nazwie) ' + problem], false);
      else image = auto;
    }
    const translationWarnings = validateTranslations(result.data, { file });
    notice(translationWarnings);
    notice(tagWarnings(result.data.tags, tagMap, { file }));
    recipes.push({ slug, data: result.data, body: result.body, image, translated: translationWarnings.length === 0 });
  });

  return { recipes, errors, problems, warnings, notices, tagMap, badgeMap };
}
