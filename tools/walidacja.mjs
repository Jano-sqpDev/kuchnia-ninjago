// Wczytywanie i walidacja przepisów z recipes/<slug>.md (schemat v1, opis w CLAUDE.md).
// Walidator niczego nie poprawia — tylko zgłasza błędy w formacie:
//   plik.md → ścieżka.pola: przyczyna
import { readdirSync, readFileSync, existsSync, statSync, openSync, readSync, closeSync } from 'node:fs';
import { join, extname, basename } from 'node:path';
import { parseDocument } from 'yaml';

export const NINJA_FUNKCJE = ['Air Fry', 'Max Crisp', 'Roast', 'Bake', 'Reheat', 'Dehydrate'];
export const NINJA_TRYBY = ['sync', 'match', 'independent', 'single'];
// Tagi, które trzeba zapisywać w formie kanonicznej (tm6 / ninja).
const ZAKAZANE_TAGI = { thermomix: 'tm6', airfryer: 'ninja', 'air fryer': 'ninja', af: 'ninja' };
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const KLUCZE = {
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
const opis = (v) => (v === null ? 'pusta wartość' : JSON.stringify(v));

// Rozdziela plik na front matter (YAML) i treść Markdown.
export function parseRecipeFile(tekst) {
  const t = tekst.replace(/^﻿/, '').replace(/\r\n?/g, '\n');
  const m = t.match(/^---\n([\s\S]*?)\n---[ \t]*(?:\n([\s\S]*))?$/);
  if (!m) return { error: 'brak front matter — plik musi zaczynać się od linii --- i mieć zamykające ---' };
  const doc = parseDocument(m[1], { uniqueKeys: true, prettyErrors: false });
  if (doc.errors.length) {
    const e = doc.errors[0];
    const linia = e.linePos && e.linePos[0] ? ' (linia ' + (e.linePos[0].line + 1) + ')' : '';
    return { error: 'niepoprawny YAML' + linia + ': ' + e.message.split('\n')[0] };
  }
  return { data: doc.toJS(), body: (m[2] || '').trim() };
}

// Waliduje jeden przepis. Zwraca listę komunikatów (pusta = OK).
export function validateRecipe(data, { file, recipesDir } = {}) {
  const bledy = [];
  const blad = (sciezka, przyczyna) => bledy.push(file + ' → ' + sciezka + ': ' + przyczyna);

  function nieznaneKlucze(obj, dozwolone, sciezka) {
    Object.keys(obj).forEach((k) => {
      if (!dozwolone.includes(k)) blad(sciezka ? sciezka + '.' + k : k, 'nieznane pole');
    });
  }
  // Pole opcjonalne: jeśli jest, musi być niepustym tekstem.
  function opcjonalnyTekst(obj, k, sciezka) {
    if (k in obj && !isText(obj[k])) blad(sciezka, 'musi być niepustym tekstem (albo usuń pole), jest ' + opis(obj[k]));
  }
  function liczbaCalkowita(obj, k, sciezka, min, wymagane) {
    if (!(k in obj)) { if (wymagane) blad(sciezka, 'brak wymaganego pola'); return; }
    const v = obj[k];
    if (!isInt(v)) blad(sciezka, 'musi być liczbą całkowitą, jest ' + opis(v));
    else if (v < min) blad(sciezka, 'musi być >= ' + min + ', jest ' + v);
  }

  if (!isObj(data)) {
    blad('(front matter)', 'musi być obiektem YAML z polami przepisu');
    return bledy;
  }
  nieznaneKlucze(data, KLUCZE.root, '');

  // --- pola główne ---
  if (!('schema_version' in data)) blad('schema_version', 'brak wymaganego pola');
  else if (data.schema_version !== 1) blad('schema_version', 'musi być dokładnie 1, jest ' + opis(data.schema_version));

  if (!('title' in data)) blad('title', 'brak wymaganego pola');
  else if (!isText(data.title)) blad('title', 'musi być niepustym tekstem');

  opcjonalnyTekst(data, 'description', 'description');
  opcjonalnyTekst(data, 'source', 'source');
  liczbaCalkowita(data, 'servings', 'servings', 1, true);
  liczbaCalkowita(data, 'prep_minutes', 'prep_minutes', 0, true);
  liczbaCalkowita(data, 'cook_minutes', 'cook_minutes', 0, true);

  // --- tagi ---
  let tagi = [];
  if (!('tags' in data)) blad('tags', 'brak wymaganego pola (może być pusta lista: [])');
  else if (!Array.isArray(data.tags)) blad('tags', 'musi być listą, np. [deser, kurczak]');
  else {
    const widziane = new Set();
    data.tags.forEach((tag, i) => {
      const s = 'tags[' + i + ']';
      if (!isText(tag)) { blad(s, 'musi być niepustym tekstem, jest ' + opis(tag)); return; }
      if (tag !== tag.trim().toLowerCase()) blad(s, 'tag zapisuj małymi literami, bez spacji na brzegach: "' + tag + '"');
      if (ZAKAZANE_TAGI[tag]) blad(s, 'użyj tagu "' + ZAKAZANE_TAGI[tag] + '" zamiast "' + tag + '" (alias działa tylko w wyszukiwarce)');
      if (widziane.has(tag)) blad(s, 'powtórzony tag "' + tag + '"');
      widziane.add(tag);
    });
    tagi = data.tags;
  }

  // --- składniki ---
  if (!('ingredients' in data)) blad('ingredients', 'brak wymaganego pola');
  else if (!Array.isArray(data.ingredients) || data.ingredients.length === 0) blad('ingredients', 'musi być niepustą listą składników');
  else {
    data.ingredients.forEach((ing, i) => {
      const s = 'ingredients[' + i + ']';
      if (!isObj(ing)) { blad(s, 'składnik musi być obiektem z polem name, jest ' + opis(ing)); return; }
      nieznaneKlucze(ing, KLUCZE.ingredient, s);
      if (!isText(ing.name)) blad(s + '.name', 'brak nazwy składnika');
      if ('amount' in ing) {
        if (!isNum(ing.amount)) blad(s + '.amount', 'musi być liczbą (ułamki z kropką, np. 1.5), jest ' + opis(ing.amount));
        else if (ing.amount <= 0) blad(s + '.amount', 'musi być > 0, jest ' + ing.amount);
        if (!('unit' in ing)) blad(s + '.unit', 'wymagane, gdy jest amount');
      } else if ('unit' in ing) {
        blad(s + '.unit', 'jednostka bez ilości — dodaj amount albo przenieś opis do note');
      }
      opcjonalnyTekst(ing, 'unit', s + '.unit');
      opcjonalnyTekst(ing, 'note', s + '.note');
      opcjonalnyTekst(ing, 'group', s + '.group');
    });
  }

  // --- kroki ---
  let krokiZTm6 = 0;
  if (!('steps' in data)) blad('steps', 'brak wymaganego pola');
  else if (!Array.isArray(data.steps) || data.steps.length === 0) blad('steps', 'musi być niepustą listą kroków');
  else {
    data.steps.forEach((krok, i) => {
      const s = 'steps[' + i + ']';
      if (!isObj(krok)) { blad(s, 'krok musi być obiektem z polem text, jest ' + opis(krok)); return; }
      nieznaneKlucze(krok, KLUCZE.step, s);
      if (!isText(krok.text)) blad(s + '.text', 'brak treści kroku');
      if ('internal_temp_c' in krok) {
        const v = krok.internal_temp_c;
        if (!isNum(v)) blad(s + '.internal_temp_c', 'musi być liczbą °C, jest ' + opis(v));
        else if (v <= 0 || v > 100) blad(s + '.internal_temp_c', 'poza zakresem 1–100 °C: ' + v);
      }
      liczbaCalkowita(krok, 'timer_seconds', s + '.timer_seconds', 1, false);
      if ('tm6' in krok) {
        krokiZTm6++;
        walidujTm6(krok.tm6, s + '.tm6');
      }
    });
  }

  function walidujTm6(t, s) {
    if (!isObj(t)) { blad(s, 'musi być obiektem z ustawieniami TM6'); return; }
    nieznaneKlucze(t, KLUCZE.tm6, s);
    liczbaCalkowita(t, 'duration_seconds', s + '.duration_seconds', 1, true);
    if ('temperature' in t) {
      const v = t.temperature;
      if (isNum(v)) { if (v < 37 || v > 120) blad(s + '.temperature', 'poza zakresem 37–120 °C: ' + v); }
      else if (v !== 'Varoma') blad(s + '.temperature', 'musi być liczbą 37–120 albo dokładnie "Varoma", jest ' + opis(v));
    }
    if ('speed' in t) {
      const v = t.speed;
      const ok = v === 'spoon' || v === 'turbo' || (isNum(v) && v >= 1 && v <= 10 && isInt(v * 2));
      if (!ok) blad(s + '.speed', 'niepoprawna wartość ' + opis(v) + ' — dozwolone 1–10 co 0.5, "spoon" albo "turbo"');
    } else if (!('mode' in t)) {
      blad(s + '.speed', 'brak wymaganego pola (można pominąć tylko przy ustawionym mode)');
    }
    if ('reverse' in t && typeof t.reverse !== 'boolean') blad(s + '.reverse', 'musi być true albo false, jest ' + opis(t.reverse));
    opcjonalnyTekst(t, 'mode', s + '.mode');
  }

  // --- Ninja ---
  const maTagNinja = tagi.includes('ninja');
  if ('ninja' in data) {
    if (!maTagNinja) blad('ninja', 'jest panel Ninja, ale brak tagu "ninja" w tags');
    walidujNinja(data.ninja);
  } else if (maTagNinja) {
    blad('tags', 'jest tag "ninja", ale brak panelu ninja');
  }

  function walidujNinja(n) {
    if (!isObj(n)) { blad('ninja', 'musi być obiektem z polami mode, zone1, zone2'); return; }
    nieznaneKlucze(n, KLUCZE.ninja, 'ninja');
    const trybOk = NINJA_TRYBY.includes(n.mode);
    if (!('mode' in n)) blad('ninja.mode', 'brak wymaganego pola');
    else if (!trybOk) blad('ninja.mode', 'nieznany tryb ' + opis(n.mode) + ' — dozwolone: ' + NINJA_TRYBY.join(', '));

    if (!('zone1' in n)) blad('ninja.zone1', 'brak wymaganego pola');
    else walidujStrefe(n.zone1, 'ninja.zone1');

    if (trybOk) {
      if (n.mode === 'single') {
        if ('zone2' in n) blad('ninja.zone2', 'w trybie single nie może być drugiej strefy');
      } else if (!('zone2' in n)) {
        blad('ninja.zone2', 'wymagana w trybie ' + n.mode);
      }
    }
    if ('zone2' in n && n.mode !== 'single') walidujStrefe(n.zone2, 'ninja.zone2');

    if (n.mode === 'match' && isObj(n.zone1) && isObj(n.zone2)) {
      ['function', 'temp_c', 'minutes'].forEach((k) => {
        if (n.zone1[k] !== n.zone2[k]) {
          blad('ninja.zone2.' + k, 'w trybie match musi być takie samo jak w zone1 (' + opis(n.zone1[k]) + ' ≠ ' + opis(n.zone2[k]) + ')');
        }
      });
    }
  }

  function walidujStrefe(z, s) {
    if (!isObj(z)) { blad(s, 'musi być obiektem z polami function, temp_c, minutes'); return; }
    nieznaneKlucze(z, KLUCZE.zone, s);
    opcjonalnyTekst(z, 'label', s + '.label');
    if (!('function' in z)) blad(s + '.function', 'brak wymaganego pola');
    else if (!NINJA_FUNKCJE.includes(z.function)) blad(s + '.function', 'nieznana funkcja ' + opis(z.function) + ' — dozwolone: ' + NINJA_FUNKCJE.join(', '));
    if (!('temp_c' in z)) blad(s + '.temp_c', 'brak wymaganego pola');
    else if (!isNum(z.temp_c)) blad(s + '.temp_c', 'musi być liczbą, jest ' + opis(z.temp_c));
    else if (z.temp_c < 40 || z.temp_c > 240) blad(s + '.temp_c', 'poza zakresem 40–240 °C: ' + z.temp_c);
    liczbaCalkowita(z, 'minutes', s + '.minutes', 1, true);
  }

  // --- TM6: tag ⇔ co najmniej jeden krok z tm6 ---
  const maTagTm6 = tagi.includes('tm6');
  if (maTagTm6 && krokiZTm6 === 0) blad('tags', 'jest tag "tm6", ale żaden krok nie ma ustawień tm6');
  if (!maTagTm6 && krokiZTm6 > 0) blad('tags', 'kroki mają ustawienia tm6, ale brak tagu "tm6"');

  // --- zdjęcie ---
  if ('image' in data) walidujZdjecie(data.image);

  function walidujZdjecie(img) {
    if (!isText(img)) { blad('image', 'musi być ścieżką do pliku, np. img/' + basename(file, '.md') + '.jpg'); return; }
    if (!/^img\/(?:[a-z0-9._-]+\/)*[a-z0-9._-]+\.(jpe?g|png)$/i.test(img) || img.split('/').includes('..')) {
      blad('image', 'musi wskazywać plik JPEG/PNG w recipes/img/, np. img/' + basename(file, '.md') + '.jpg (jest "' + img + '")');
      return;
    }
    const pelna = join(recipesDir || '.', img);
    if (!existsSync(pelna) || !statSync(pelna).isFile()) { blad('image', 'plik nie istnieje: recipes/' + img); return; }
    const naglowek = Buffer.alloc(8);
    const fd = openSync(pelna, 'r');
    readSync(fd, naglowek, 0, 8, 0);
    closeSync(fd);
    const jpeg = naglowek[0] === 0xff && naglowek[1] === 0xd8 && naglowek[2] === 0xff;
    const png = naglowek.slice(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    if (!jpeg && !png) blad('image', 'plik recipes/' + img + ' nie jest prawdziwym JPEG/PNG (WebP/AVIF nie działają na Safari 12)');
  }

  return bledy;
}

// Wczytuje wszystkie przepisy z katalogu. Zwraca { recipes, errors }.
export function loadRecipes(recipesDir) {
  const recipes = [];
  const errors = [];
  const slugi = new Map();

  const pliki = readdirSync(recipesDir, { withFileTypes: true })
    .filter((d) => d.isFile() && d.name !== '.gitkeep')
    .map((d) => d.name)
    .sort();

  pliki.forEach((plik) => {
    if (extname(plik) !== '.md') {
      errors.push(plik + ' → (plik): w recipes/ mogą być tylko pliki .md (zdjęcia w recipes/img/)');
      return;
    }
    const slug = basename(plik, '.md');
    if (!SLUG_RE.test(slug)) {
      errors.push(plik + ' → (nazwa pliku): slug może mieć tylko małe litery a-z, cyfry i myślniki, np. udka-z-ziemniakami.md');
    }
    const klucz = slug.toLowerCase();
    if (slugi.has(klucz)) errors.push(plik + ' → (nazwa pliku): slug powtarza się z ' + slugi.get(klucz));
    slugi.set(klucz, plik);

    const wynik = parseRecipeFile(readFileSync(join(recipesDir, plik), 'utf8'));
    if (wynik.error) { errors.push(plik + ' → (YAML): ' + wynik.error); return; }
    const bledy = validateRecipe(wynik.data, { file: plik, recipesDir });
    if (bledy.length) { errors.push(...bledy); return; }
    recipes.push({ slug, data: wynik.data, body: wynik.body });
  });

  return { recipes, errors };
}
