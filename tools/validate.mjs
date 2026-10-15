// Wczytywanie i walidacja przepisów z recipes/<slug>.md (schemat v1, opis w CLAUDE.md i docs/FORMAT-PRZEPISU.md).
// Walidator niczego nie poprawia — tylko zgłasza błędy w formacie:
//   plik.md → ścieżka.pola: przyczyna
// Build pomija przepisy z błędami i publikuje resztę; npm run validate i testy kończą się błędem.
import { readdirSync, readFileSync, existsSync, statSync, openSync, readSync, closeSync } from 'node:fs';
import { join, extname, basename } from 'node:path';
import { parseDocument } from 'yaml';

export const NINJA_FUNCTIONS = ['Air Fry', 'Max Crisp', 'Roast', 'Bake', 'Reheat', 'Dehydrate'];
export const NINJA_MODES = ['sync', 'match', 'independent', 'single'];
// Tagi, które trzeba zapisywać w formie kanonicznej (tm6 / ninja).
const FORBIDDEN_TAGS = { thermomix: 'tm6', airfryer: 'ninja', 'air fryer': 'ninja', af: 'ninja' };
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const KEYS = {
  root: ['schema_version', 'title', 'description', 'servings', 'prep_minutes', 'cook_minutes',
    'tags', 'ingredients', 'steps', 'ninja', 'image', 'source'],
  ingredient: ['name', 'amount', 'unit', 'note', 'group'],
  step: ['text', 'tm6', 'internal_temp_c', 'timer_seconds'],
  tm6: ['duration_seconds', 'temperature', 'speed', 'reverse', 'mode'],
  ninja: ['mode', 'zone1', 'zone2'],
  zone: ['label', 'function', 'temp_c', 'minutes'],
};

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
  return name.toLowerCase().replace(/ł/g, 'l').normalize('NFD').replace(/[̀-ͯ]/g, '')
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
  minutes: 'minuty',
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

// Wczytuje wszystkie przepisy z katalogu.
// Zwraca { recipes, errors, problems }:
//   recipes  — poprawne przepisy: { slug, data, body, image } (image: ścieżka względem recipes/ albo null),
//   errors   — wszystkie komunikaty „plik → ścieżka: przyczyna" (npm run validate, testy),
//   problems — te same błędy jako { file, path, where, reason, skipped } (dla strony: errors.json).
// skipped = true: przepisu nie ma na stronie; false: jest, ale np. bez zdjęcia.
export function loadRecipes(recipesDir) {
  const recipes = [];
  const errors = [];
  const problems = [];
  const slugs = new Map();
  const report = (lines, skipped) => lines.forEach((line) => {
    errors.push(line);
    const e = splitError(line);
    problems.push({ file: e.file, path: e.path, where: describePath(e.path), reason: e.reason, skipped });
  });

  const files = readdirSync(recipesDir, { withFileTypes: true })
    .filter((d) => d.isFile() && d.name !== '.gitkeep')
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

    // Bez pola image — zdjęcie po nazwie pliku. Zły plik nie ukrywa przepisu: publikujemy go bez zdjęcia.
    let image = result.data.image || null;
    if (!image) {
      const auto = findImageBySlug(recipesDir, slug);
      const problem = auto && checkImageFile(recipesDir, auto);
      if (problem) report([file + ' → image: (zdjęcie po nazwie) ' + problem], false);
      else image = auto;
    }
    recipes.push({ slug, data: result.data, body: result.body, image });
  });

  return { recipes, errors, problems };
}
