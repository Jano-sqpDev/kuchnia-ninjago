// Widok kuchenny (lista + strona przepisu) — według docs/mockup-ui-v3.html („spokojny wyświetlacz”, od v0.7; zasady w CLAUDE.md).
// Safari 12 (iOS 12): świadomie ES5 + to, co Safari 12 ma na pewno; bez modułów, frameworków i npm.
// Zakazana składnia sprawdzana w tests/client.test.mjs, a build przepuszcza plik przez esbuild --target=safari12.
(function (global) {
  'use strict';

  var STATE_KEY = 'kitchen-state';
  var OLD_THEME_KEY = 'kitchen-theme'; // jasny motyw usunięty w v0.7 — klucz kasowany przy starcie
  var RELOAD_KEY = 'kitchen-reload'; // build, do którego już raz przeładowaliśmy
  var LANG_KEY = 'kitchen-lang';     // język interfejsu: 'pl' (domyślnie) | 'en' — od v0.4, bez starszego odpowiednika
  // Klucze sprzed v0.2.3 — przenoszone raz do nowych (migrateStorage), potem usuwane.
  var LEGACY_KEYS = { state: 'kuchnia-stan', theme: 'kuchnia-motyw', reload: 'kuchnia-przeladowanie' };
  var MAX_REMEMBERED = 30;   // ile przepisów pamięta krok i porcje
  var SERVINGS_MIN = 1, SERVINGS_MAX = 12;
  var SLUG_RE = /^[a-z0-9-]+$/;

  // ───────── słownik interfejsu pl / en ─────────
  // Wszystkie napisy aplikacji. Oba języki muszą mieć te same klucze (sprawdza tests/client.test.mjs).
  // Tablica = odmiana po liczbie: pl [1, 2–4, 5+], en [1, inne]. {n}, {total}… — wstawiane wartości.
  // Wartości mogą zawierać HTML (<b>, <br>) — to stałe teksty, nie dane z przepisów.
  var I18N = {
    pl: {
      recipes: 'Przepisy', back: '‹ Przepisy', langLabel: 'Język / Language', photo: 'Zdjęcie',
      loading: 'Wczytywanie…', retryHint: 'Sprawdź Wi-Fi i dotknij, żeby spróbować ponownie.',
      listFailed: 'Nie udało się wczytać przepisów.', recipeFailed: 'Nie udało się wczytać przepisu.',
      recipeMissing: 'Nie ma takiego przepisu.', recipeMissingHint: 'Mógł zostać usunięty albo zmienić nazwę. Wróć do listy.',
      empty: 'Nie ma jeszcze przepisów.', emptyHint: 'Dodaj pierwszy: plik w recipes/ na GitHubie albo przez Claude Code („dodaj do przepisów”).',
      searchPlaceholder: 'Szukaj: nazwa, składnik, tag…', searchClear: 'Wyczyść pole', chipAll: 'Wszystkie',
      resultsCount: ['{shown} z {n} przepisu', '{shown} z {n} przepisów', '{shown} z {n} przepisów'],
      showingFor: 'Pokazuję wyniki dla: {q}', noMatches: 'Nic nie pasuje.', noMatchesHint: 'Spróbuj innego słowa albo wyłącz filtry.', clearAll: 'Wyczyść',
      minutes: '{n} min', noCooking: 'bez gotowania', servings: ['porcja', 'porcje', 'porcji'],
      resumeTitle: 'Wróć do gotowania', stepOf: 'krok {n} z {total}', open: 'Otwórz ›', show: 'Pokaż ›', close: '✕ Zamknij',
      problemsCount: ['{n} przepis z błędem', '{n} przepisy z błędem', '{n} przepisów z błędem'],
      problemsIntro: 'Te pliki w repo mają błędy. Popraw je na GitHubie (albo poproś o to Claude / Codex) — po publikacji plakietka zniknie.',
      problemSkipped: 'Przepisu nie ma na liście, dopóki błąd nie zostanie poprawiony.', problemNoPhoto: 'Przepis jest na liście, ale bez zdjęcia.',
      warningsCount: ['{n} przepis z brakami', '{n} przepisy z brakami', '{n} przepisów z brakami'],
      warningsIntro: 'Te przepisy są na liście, ale czegoś im brakuje: tłumaczenia EN (w trybie EN wyświetlają się po polsku), tłumaczenia tagu albo znacznika (np. LOW / NORM). Poproś ChatGPT o uzupełnienie według docs/FORMAT-PRZEPISU.md i recipes/tags.yml.',
      warningFallback: 'W trybie EN przepis wyświetla się po polsku.', warningTagsOnly: 'Tagi bez tłumaczenia — w trybie EN wyświetlane bez zmian.',
      warningBadge: 'Brak znacznika — przepis jest na liście, ale bez plakietki z tej grupy.',
      plOnly: 'brak tłumaczenia EN',
      prep: 'przygotowanie', cook: 'pieczenie', noBake: 'bez pieczenia', fewer: 'Mniej porcji', more: 'Więcej porcji', original: 'przepis: {n}',
      ingredients: 'Składniki', steps: 'Kroki', notes: 'Notatki',
      photoHint: 'Dotknij w dowolnym miejscu, żeby wrócić do przepisu',
      inside: '{t}°C w środku',
      zone: 'Strefa',
      modeSync: 'SYNC', modeSyncHint: 'kończą<br>razem', modeMatch: 'MATCH', modeMatchHint: 'te same<br>ustawienia',
      modeIndependent: 'OSOBNO', modeIndependentHint: 'niezależne<br>strefy',
      ninjaFor: 'Ustawienia Ninja są dla {n} porcji.',
      ninjaMore: 'Przy większej ilości sprawdź, czy jedzenie mieści się w szufladach.',
      ninjaLess: 'Przy mniejszej ilości sprawdzaj wcześniej — może być gotowe szybciej.',
      tm6None: 'Ten krok bez TM6', tm6Step: 'Krok <b>{n}</b> z {total}',
      time: 'Czas', temperature: 'Temp.', speed: 'Obroty', speedShort: 'obroty', noHeat: 'bez grzania', reverse: '↺ wsteczne', spoon: 'łyżka',
      timerNote: 'Alarm tylko przy włączonym ekranie i otwartej aplikacji.',
      start: 'START', pause: 'PAUZA', resume: 'WZNÓW', reset: 'RESET', sure: 'NA PEWNO?',
      statusIdle: 'Dotknij START razem z Ninja', statusRunning: 'Odliczanie', statusPaused: 'Pauza',
      alarmHint: 'Timer czeka na „Zrobione” (szuflada wysunięta = Ninja stoi), najdłużej 2 min.', done: 'Zrobione',
      noSound: 'Bez dźwięku — w Safari dźwięk włącza dotknięcie START albo WZNÓW.',
      whenIn: 'za', whenAt: 'po', whenNow: 'teraz',
      flipUp: 'OBRÓĆ', flipSoft: 'można obrócić', flipLower: 'obróć', flipCap: 'Obróć',
      shakeUp: 'POTRZĄŚNIJ', shakeSoft: 'można potrząsnąć', shakeLower: 'potrząśnij', shakeCap: 'Potrząśnij',
      turnRequired: '{action} po {n} min', turnOptional: '{action} po {n} min',
    },
    en: {
      recipes: 'Recipes', back: '‹ Recipes', langLabel: 'Język / Language', photo: 'Photo',
      loading: 'Loading…', retryHint: 'Check the Wi-Fi and tap to try again.',
      listFailed: 'Could not load the recipes.', recipeFailed: 'Could not load the recipe.',
      recipeMissing: 'There is no such recipe.', recipeMissingHint: 'It may have been removed or renamed. Go back to the list.',
      empty: 'No recipes yet.', emptyHint: 'Add the first one: a file in recipes/ on GitHub or via Claude Code.',
      searchPlaceholder: 'Search: name, ingredient, tag…', searchClear: 'Clear the field', chipAll: 'All',
      resultsCount: ['{shown} of {n} recipe', '{shown} of {n} recipes'],
      showingFor: 'Showing results for: {q}', noMatches: 'No matches.', noMatchesHint: 'Try another word or turn off the filters.', clearAll: 'Clear',
      minutes: '{n} min', noCooking: 'no cooking', servings: ['serving', 'servings'],
      resumeTitle: 'Back to cooking', stepOf: 'step {n} of {total}', open: 'Open ›', show: 'Show ›', close: '✕ Close',
      problemsCount: ['{n} recipe with an error', '{n} recipes with errors'],
      problemsIntro: 'These files in the repo have errors. Fix them on GitHub (or ask Claude / Codex to do it) — the badge disappears after publishing.',
      problemSkipped: 'The recipe is not on the list until the error is fixed.', problemNoPhoto: 'The recipe is on the list, but without a photo.',
      warningsCount: ['{n} recipe with missing info', '{n} recipes with missing info'],
      warningsIntro: 'These recipes are on the list, but something is missing: the English translation (in EN mode they are shown in Polish), a tag translation or a badge (e.g. LOW / NORM). Ask ChatGPT to complete them according to docs/FORMAT-PRZEPISU.md and recipes/tags.yml.',
      warningFallback: 'In EN mode the recipe is shown in Polish.', warningTagsOnly: 'Tags without translation — shown unchanged in EN mode.',
      warningBadge: 'Missing badge — the recipe is on the list, but without a badge from this group.',
      plOnly: 'no English translation',
      prep: 'prep', cook: 'cooking', noBake: 'no cooking', fewer: 'Fewer servings', more: 'More servings', original: 'recipe: {n}',
      ingredients: 'Ingredients', steps: 'Steps', notes: 'Notes',
      photoHint: 'Tap anywhere to go back to the recipe',
      inside: '{t}°C inside',
      zone: 'Zone',
      modeSync: 'SYNC', modeSyncHint: 'finish<br>together', modeMatch: 'MATCH', modeMatchHint: 'same<br>settings',
      modeIndependent: 'SEPARATE', modeIndependentHint: 'independent<br>zones',
      ninjaFor: 'Ninja settings are for {n} {servings}.',
      ninjaMore: 'With more food, check that it fits in the drawers.',
      ninjaLess: 'With less food, check earlier — it may be ready sooner.',
      tm6None: 'No TM6 in this step', tm6Step: 'Step <b>{n}</b> of {total}',
      time: 'Time', temperature: 'Temp.', speed: 'Speed', speedShort: 'speed', noHeat: 'no heat', reverse: '↺ reverse', spoon: 'spoon',
      timerNote: 'Alarm only with the screen on and the app open.',
      start: 'START', pause: 'PAUSE', resume: 'RESUME', reset: 'RESET', sure: 'SURE?',
      statusIdle: 'Tap START together with the Ninja', statusRunning: 'Counting down', statusPaused: 'Paused',
      alarmHint: 'The timer waits for “Done” (drawer out = Ninja paused), up to 2 min.', done: 'Done',
      noSound: 'No sound — in Safari, tapping START or RESUME turns the sound on.',
      whenIn: 'in', whenAt: 'at', whenNow: 'now',
      flipUp: 'FLIP', flipSoft: 'optional flip', flipLower: 'flip', flipCap: 'Flip',
      shakeUp: 'SHAKE', shakeSoft: 'optional shake', shakeLower: 'shake', shakeCap: 'Shake',
      turnRequired: '{action} at {n} min', turnOptional: '{action} at {n} min',
    },
  };
  var LANGS = ['pl', 'en'];
  function normalizeLang(l) { return l === 'en' ? 'en' : 'pl'; }

  function fill(s, params) {
    return params ? s.replace(/\{(\w+)\}/g, function (m, k) { return params[k] !== undefined ? String(params[k]) : m; }) : s;
  }
  // Napis ze słownika: tr('en', 'stepOf', { n: 2 }). Brak klucza w języku → wersja PL → sam klucz.
  function tr(lang, key, params) {
    var v = I18N[normalizeLang(lang)][key];
    if (v === undefined) v = I18N.pl[key];
    if (v === undefined) return key;
    return fill(String(v), params);
  }
  // Napis z odmianą po liczbie: trn('pl', 'servings', 5) → 'porcji'; {n} w napisie → liczba.
  function trn(lang, key, n, params) {
    var forms = I18N[normalizeLang(lang)][key];
    var form = normalizeLang(lang) === 'en' ? (n === 1 ? forms[0] : forms[1]) : plural(n, forms[0], forms[1], forms[2]);
    return fill(form, Object.assign({ n: n }, params || {}));
  }

  // ───────── czyste funkcje (testy: tests/client.test.mjs) ─────────

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // Odmiana po liczbie (tylko PL): plural(2, 'porcja', 'porcje', 'porcji') → 'porcje'
  function plural(n, one, few, many) {
    var d = n % 10, dd = n % 100;
    if (n === 1) return one;
    return d >= 2 && d <= 4 && (dd < 12 || dd > 14) ? few : many;
  }

  // PL: 1 porcja, 2 porcje, 5 porcji, 22 porcje; EN: 1 serving, 2 servings
  function servingsWord(n, lang) { return trn(lang, 'servings', n); }

  // Plakietki na liście: „3 przepisy z błędem" / „2 recipes without English translation".
  function problemsLabel(n, lang) { return trn(lang, 'problemsCount', n); }
  function warningsLabel(n, lang) { return trn(lang, 'warningsCount', n); }

  // errors.json → [{ file, skipped, items: [{ where, reason, path }] }] w kolejności plików.
  function groupProblems(list) {
    var groups = [], byFile = {};
    (list || []).forEach(function (p) {
      if (!p || typeof p.file !== 'string') return;
      var g = byFile[p.file];
      if (!g) { g = byFile[p.file] = { file: p.file, skipped: false, items: [] }; groups.push(g); }
      if (p.skipped) g.skipped = true;
      g.items.push({ where: String(p.where || p.path || ''), reason: String(p.reason || ''), path: String(p.path || '') });
    });
    return groups;
  }

  // 1.5 → „1,5" (PL) / „1.5" (EN)
  function decimal(v, lang) {
    var s = String(Math.round(v * 100) / 100);
    return normalizeLang(lang) === 'en' ? s : s.replace('.', ',');
  }

  // 2.5 → „2½", 0.5 → „½" (tylko dla wielokrotności 0,5)
  function halves(v) {
    var w = Math.floor(v);
    return v === w ? String(w) : (w ? String(w) : '') + '½';
  }

  // Jednostki (zawsze angielskie skróty, lista w tools/validate.mjs): te liczymy w połówkach.
  var HALF_UNITS = ['pcs', 'tbsp', 'tsp', 'pinch'];
  function isHalfUnit(unit) { return HALF_UNITS.indexOf(unit) !== -1; }

  // Ilość składnika po przeliczeniu porcji (f = nowe porcje / porcje z przepisu).
  // pcs / tbsp / tsp / pinch do połówek, g/ml do okrągłych wartości, reszta (kg, l) do jednego miejsca po przecinku.
  function scaledAmount(amount, unit, f, lang) {
    if (f === 1) return isHalfUnit(unit) && amount * 2 === Math.round(amount * 2) ? halves(amount) : decimal(amount, lang);
    var v = amount * f;
    if (isHalfUnit(unit)) {
      var h = Math.round(v * 2) / 2;
      return halves(h < 0.5 ? 0.5 : h);
    }
    if (unit === 'g' || unit === 'ml') {
      var step = v < 20 ? 1 : (v < 100 ? 5 : (v < 500 ? 10 : 25));
      var r = Math.round(v / step) * step;
      return r > 0 ? String(r) : decimal(Math.round(v * 10) / 10 || 0.1, lang);
    }
    return decimal(Math.round(v * 10) / 10 || 0.1, lang);
  }

  // Tłumaczenie EN z danych przepisu — tylko gdy pasuje do oryginału (build publikuje wyłącznie kompletne).
  function translationOf(r) {
    var en = r && r.translations && r.translations.en;
    if (!en || typeof en.title !== 'string' || !Array.isArray(en.ingredients) || !Array.isArray(en.steps) ||
      en.ingredients.length !== r.ingredients.length || en.steps.length !== r.steps.length) return null;
    return en;
  }

  // Przepis w danym języku: teksty z tłumaczenia (EN), ilości, jednostki i ustawienia urządzeń zawsze z oryginału.
  // fallback = tryb EN, ale przepis nie ma tłumaczenia → teksty po polsku (znaczek „PL"). Tagi EN z recipes/tags.yml (tags_en).
  function localizeRecipe(r, lang) {
    var en = normalizeLang(lang) === 'en' ? translationOf(r) : null;
    var groups = en && en.groups && typeof en.groups === 'object' ? en.groups : {};
    var labels = en && en.labels && typeof en.labels === 'object' ? en.labels : {};
    var pick = function (t, orig) { return typeof t === 'string' && t ? t : orig; };
    var n = r.ninja;
    return {
      title: en ? en.title : r.title,
      description: en ? pick(en.description, r.description) : r.description,
      tags: normalizeLang(lang) === 'en' && Array.isArray(r.tags_en) ? r.tags_en : r.tags,
      ingredients: r.ingredients.map(function (x, i) {
        var e = en && en.ingredients[i] ? en.ingredients[i] : {};
        return { amount: x.amount, unit: x.unit, name: pick(e.name, x.name), note: x.note === undefined ? undefined : pick(e.note, x.note),
          groupKey: x.group, group: x.group === undefined ? undefined : pick(groups[x.group], x.group) };
      }),
      steps: r.steps.map(function (s, i) {
        var e = en && en.steps[i] ? en.steps[i] : {};
        var mode = s.tm6 && s.tm6.mode !== undefined ? pick(e.tm6_mode, s.tm6.mode) : undefined;
        return { text: pick(e.text, s.text), tm6: s.tm6, tm6Mode: mode, internal_temp_c: s.internal_temp_c };
      }),
      labels: {
        zone1: n && n.zone1 && n.zone1.label !== undefined ? pick(labels.zone1, n.zone1.label) : undefined,
        zone2: n && n.zone2 && n.zone2.label !== undefined ? pick(labels.zone2, n.zone2.label) : undefined,
      },
      fallback: normalizeLang(lang) === 'en' && !en,
    };
  }

  // Wpis listy (search.json) w danym języku.
  function entryView(it, lang) {
    var isEn = normalizeLang(lang) === 'en';
    return {
      title: isEn && it.title_en ? it.title_en : it.title,
      tags: isEn && Array.isArray(it.tags_en) ? it.tags_en : it.tags,
      fallback: isEn && !it.title_en,
    };
  }

  // 300 → „5:00"
  function tm6Time(seconds) {
    var m = Math.floor(seconds / 60), s = seconds % 60;
    return m + ':' + (s < 10 ? '0' : '') + s;
  }

  function tm6Speed(speed, lang) {
    if (speed === 'spoon') return tr(lang, 'spoon');
    if (speed === 'turbo') return 'Turbo';
    return decimal(speed, lang);
  }

  // Panel TM6 tylko na kroku z ustawieniami TM6 (od v0.10) — na pozostałych krokach panelu nie ma wcale.
  function tm6Visible(r, step) { return !!(r && r.steps && r.steps[step] && r.steps[step].tm6); }

  function hasTm6(r) {
    for (var i = 0; i < r.steps.length; i++) if (r.steps[i].tm6) return true;
    return false;
  }

  // Klasy przypiętego paska paneli: both one / both two (Ninja + TM6, układ w poziomie), tm6only (bez Ninja),
  // notm — bieżący krok bez TM6 (panel TM6 ukryty; przy tm6only cały pasek znika).
  function pinClass(r, step) {
    var tm6 = hasTm6(r), c = 'pin';
    if (r.ninja && tm6) c += ' both ' + (r.ninja.mode === 'single' ? 'one' : 'two');
    if (!r.ninja && tm6) c += ' tm6only';
    if (tm6 && !tm6Visible(r, step)) c += ' notm';
    return c;
  }

  function clampServings(n) { return Math.max(SERVINGS_MIN, Math.min(SERVINGS_MAX, n)); }

  // ───────── wyszukiwanie i filtry listy (czyste funkcje) ─────────
  // normalize, matchesQuery, searchWords, wordStems, matchLevel, isEdit1, buildDictionary, typoCandidates i searchIndex to
  // DOSŁOWNE kopie z tools/search.mjs (jedno źródło prawdy: tam; build robi z nich pole
  // text w search.json). tests/client.test.mjs porównuje tekst obu funkcji i wyniki na tych samych przypadkach —
  // zmiana w jednym miejscu bez drugiego wywala testy.

  // Małe litery, bez znaków diakrytycznych (NFD nie rozkłada „ł", więc ł → l ręcznie),
  // pojedyncze spacje.
  function normalize(text) {
    return String(text)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/ł/g, 'l')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Wiele słów = AND, każde słowo dopasowane po fragmencie.
  function matchesQuery(entry, query) {
    const words = normalize(query).split(' ').filter(Boolean);
    return words.every(function (word) { return entry.text.indexOf(word) !== -1; });
  }

  // Słowa zapytania po normalizacji (puste zapytanie → []).
  function searchWords(query) {
    return normalize(query).split(' ').filter(Boolean);
  }

  // Rdzenie słowa na polską odmianę: bez 1 lub 2 ostatnich liter, tylko dla słów >= 5 znaków, rdzeń >= 4 znaki.
  // „kalafiorem" → [„kalafiore", „kalafior"]; „jajka" → [„jajk"]; „sol" → [] (krótkie słowa tylko dokładnie).
  function wordStems(word) {
    var out = [];
    if (word.length < 5) return out;
    for (var cut = 1; cut <= 2; cut++) {
      if (word.length - cut >= 4) out.push(word.slice(0, word.length - cut));
    }
    return out;
  }

  // Jak słowo trafia w tekst: 0 = dokładny fragment, 1 = rdzeń (odmiana), -1 = nie trafia.
  function matchLevel(text, word) {
    if (text.indexOf(word) !== -1) return 0;
    var stems = wordStems(word);
    for (var i = 0; i < stems.length; i++) if (text.indexOf(stems[i]) !== -1) return 1;
    return -1;
  }

  // Odległość edycyjna najwyżej 1: wstawienie, usunięcie, zamiana albo przestawienie dwóch sąsiednich liter.
  function isEdit1(a, b) {
    if (a === b) return true;
    var la = a.length, lb = b.length;
    if (la - lb > 1 || lb - la > 1) return false;
    var i = 0;
    while (i < la && i < lb && a.charAt(i) === b.charAt(i)) i++;
    if (la === lb) {
      if (a.slice(i + 1) === b.slice(i + 1)) return true;
      return a.charAt(i) === b.charAt(i + 1) && a.charAt(i + 1) === b.charAt(i) && a.slice(i + 2) === b.slice(i + 2);
    }
    if (la > lb) return a.slice(i + 1) === b.slice(i);
    return a.slice(i) === b.slice(i + 1);
  }

  // Słownik do poprawiania literówek: unikalne słowa (>= 4 znaki) ze wszystkich pól text, posortowane.
  // Budowany raz po wczytaniu search.json.
  function buildDictionary(entries) {
    var seen = {}, out = [];
    entries.forEach(function (e) {
      String(e.text).split(/[^a-z0-9]+/).forEach(function (w) {
        if (w.length >= 4 && !Object.prototype.hasOwnProperty.call(seen, w)) { seen[w] = true; out.push(w); }
      });
    });
    return out.sort();
  }

  // Słowa ze słownika w odległości 1 od słowa z zapytania — także względem początku dłuższych słów
  // („klafior" → „kalafiora"). Najkrótsze najpierw, najwyżej 5.
  function typoCandidates(word, dict) {
    var out = [], n = word.length;
    dict.forEach(function (w) {
      if (w === word) return;
      var ok = isEdit1(word, w);
      for (var len = n - 1; !ok && len <= n + 1; len++) {
        if (len >= 4 && len < w.length && isEdit1(word, w.slice(0, len))) ok = true;
      }
      if (ok) out.push(w);
    });
    out.sort(function (a, b) { return a.length - b.length || (a < b ? -1 : (a > b ? 1 : 0)); });
    return out.slice(0, 5);
  }

  // Wyszukiwanie z odmianą i literówkami. Wiele słów = I: każde słowo musi trafić dokładnie, rdzeniem albo przez poprawkę
  // literówki. Poprawka tylko awaryjnie: słowo >= 5 znaków, które nie trafia w ŻADEN przepis ani dokładnie, ani rdzeniem.
  // Kolejność: grupa 0 (dokładnie), 1 (rdzeń), 2 (literówka) — grupa przepisu to najsłabsze z jego dopasowań;
  // w grupie kolejność z indeksu. corrected = zapytanie z poprawionymi słowami (do „Pokazuję wyniki dla: …") albo null.
  function searchIndex(entries, query, dict) {
    var words = searchWords(query);
    if (!words.length) return { results: entries.slice(), corrected: null };
    var plan = words.map(function (w) {
      var hit = entries.some(function (e) { return matchLevel(e.text, w) !== -1; });
      return { word: w, fixes: hit || w.length < 5 ? null : typoCandidates(w, dict || buildDictionary(entries)) };
    });
    var groups = [[], [], []];
    entries.forEach(function (e) {
      var level = 0;
      for (var i = 0; i < plan.length; i++) {
        var p = plan[i], l;
        if (p.fixes === null) l = matchLevel(e.text, p.word);
        else l = p.fixes.some(function (f) { return e.text.indexOf(f) !== -1; }) ? 2 : -1;
        if (l === -1) return;
        if (l > level) level = l;
      }
      groups[level].push(e);
    });
    var fixed = plan.some(function (p) { return p.fixes !== null && p.fixes.length; });
    return {
      results: groups[0].concat(groups[1], groups[2]),
      corrected: fixed && groups[2].length ? plan.map(function (p) { return p.fixes && p.fixes.length ? p.fixes[0] : p.word; }).join(' ') : null,
    };
  }

  // Chipy filtrów: urządzenia (po tagach) i funkcje Ninja (po ninja_functions z search.json).
  var DEVICE_CHIPS = ['ninja', 'tm6'];
  var NINJA_FUNCTIONS = ['Air Fry', 'Max Crisp', 'Roast', 'Bake', 'Reheat', 'Dehydrate'];
  var QUERY_MAX = 100;

  // Chipy znaczników (od v0.8): „badge:<tag>" — tag z polami badge/color w recipes/tags.yml (plakietki w search.json → badges).
  var BADGE_CHIP = 'badge:';
  var BADGE_COLORS = ['yellow', 'green', 'orange', 'pink', 'red'];
  function isBadgeChip(c) { return typeof c === 'string' && c.indexOf(BADGE_CHIP) === 0 && c.length > BADGE_CHIP.length && c.length <= 46 && !/\s/.test(c); }

  // Urządzenia i funkcje: wewnątrz grupy LUB (Ninja + TM6 = jedno albo drugie), między grupami I.
  // Znaczniki (od v0.9): każdy zaznaczony musi być w przepisie (I) — z jednej grupy (np. LOW / NORM) zaznaczony jest najwyżej
  // jeden (toggleChip przełącza), a znacznik bez grupy (KIDS) to osobny warunek. Brak zaznaczonych = wszystko.
  function matchesChips(entry, chips) {
    var devices = chips.filter(function (c) { return DEVICE_CHIPS.indexOf(c) !== -1; });
    var functions = chips.filter(function (c) { return NINJA_FUNCTIONS.indexOf(c) !== -1; });
    var badges = chips.filter(isBadgeChip).map(function (c) { return c.slice(BADGE_CHIP.length); });
    var tags = entry.tags || [], fns = entry.ninja_functions || [];
    return (!devices.length || devices.some(function (d) { return tags.indexOf(d) !== -1; })) &&
      (!functions.length || functions.some(function (f) { return fns.indexOf(f) !== -1; })) &&
      badges.every(function (b) { return tags.indexOf(b) !== -1; });
  }
  // Lista po wyszukiwaniu (tekst I chipy): { results, corrected }. Wyszukiwanie (odmiana, literówki) na całym indeksie,
  // chipy potem — poprawka literówki nie zależy od zaznaczonych filtrów. dict = buildDictionary(index), liczony raz.
  function filterEntries(index, query, chips, dict) {
    var r = searchIndex(index, query, dict);
    return { results: r.results.filter(function (e) { return matchesChips(e, chips); }), corrected: r.corrected };
  }
  // Znaczniki występujące w przepisach: { tag: { label, color, group, rank } } (z pola badges w search.json; kolor tylko z listy).
  function badgeIndex(index) {
    var out = {};
    index.forEach(function (e) {
      (e.badges || []).forEach(function (b) {
        if (!b || typeof b.tag !== 'string' || typeof b.label !== 'string' || BADGE_COLORS.indexOf(b.color) === -1 || out[b.tag]) return;
        out[b.tag] = { label: b.label, color: b.color, group: typeof b.group === 'string' ? b.group : null, rank: typeof b.rank === 'number' ? b.rank : 0 };
      });
    });
    return out;
  }
  // Kolejność znaczników: najpierw z grup, potem bez grupy; w każdej części jak w tags.yml (rank).
  function badgeOrder(info) {
    return Object.keys(info).sort(function (a, b) {
      return ((info[a].group ? 0 : 1) - (info[b].group ? 0 : 1)) || (info[a].rank - info[b].rank);
    });
  }
  // Chipy do pokazania: Ninja, TM6, potem funkcje Ninja występujące w co najmniej jednym przepisie (stała kolejność),
  // potem znaczniki występujące w przepisach (LOW, NORM, KIDS — kolejność jak plakietki).
  function availableChips(index) {
    return DEVICE_CHIPS.concat(NINJA_FUNCTIONS.filter(function (f) {
      return index.some(function (e) { return (e.ninja_functions || []).indexOf(f) !== -1; });
    }), badgeOrder(badgeIndex(index)).map(function (t) { return BADGE_CHIP + t; }));
  }
  // Z jednej grupy znaczników zostaje najwyżej jeden chip — pierwszy (migracja zapisów z v0.8, np. low i norm naraz).
  function fixGroupChips(chips, info) {
    var seen = {};
    return chips.filter(function (c) {
      if (!isBadgeChip(c)) return true;
      var b = info && info[c.slice(BADGE_CHIP.length)], g = b && b.group;
      if (!g) return true;
      if (seen[g]) return false;
      seen[g] = true;
      return true;
    });
  }
  // Kolejność zapisu chipów: urządzenia, funkcje (stała kolejność), znaczniki (w kolejności włączania), bez powtórzeń.
  function orderChips(list) {
    var badges = [];
    list.forEach(function (c) { if (isBadgeChip(c) && badges.indexOf(c) === -1) badges.push(c); });
    return DEVICE_CHIPS.concat(NINJA_FUNCTIONS).filter(function (c) { return list.indexOf(c) !== -1; }).concat(badges);
  }
  // Włącz / wyłącz chip; null = „Wszystkie" (czyści wszystkie grupy, także znaczniki).
  // info = badgeIndex(index): znacznik z grupy działa jak przełącznik — włączenie NORM przy LOW zamienia je.
  function toggleChip(chips, chip, info) {
    if (chip === null) return [];
    var on;
    if (chips.indexOf(chip) !== -1) on = chips.filter(function (c) { return c !== chip; });
    else {
      var b = isBadgeChip(chip) && info ? info[chip.slice(BADGE_CHIP.length)] : null;
      on = chips.filter(function (c) {
        if (!b || !b.group || !isBadgeChip(c)) return true;
        var o = info[c.slice(BADGE_CHIP.length)];
        return !(o && o.group === b.group);
      }).concat([chip]);
    }
    return fixGroupChips(orderChips(on), info);
  }
  // Stan listy z localStorage (od v0.5): { query, chips, scroll } — zapisy bez niego dostają wartości domyślne.
  function normalizeListState(l) {
    var out = { query: '', chips: [], scroll: 0 };
    if (!l || typeof l !== 'object') return out;
    if (typeof l.query === 'string') out.query = l.query.slice(0, QUERY_MAX);
    if (Array.isArray(l.chips)) out.chips = orderChips(l.chips);
    if (typeof l.scroll === 'number' && isFinite(l.scroll) && l.scroll > 0) out.scroll = Math.floor(l.scroll);
    return out;
  }

  // Stan z localStorage — każde pole sprawdzone, bo zapis mógł pochodzić ze starszej wersji.
  // openRecipe: slug otwartego przepisu albo null (lista); list: wyszukiwanie, chipy i przewinięcie listy (od v0.5).
  function normalizeState(s) {
    var out = { openRecipe: null, recipes: {}, list: normalizeListState(null) };
    if (!s || typeof s !== 'object') return out;
    out.list = normalizeListState(s.list);
    if (typeof s.openRecipe === 'string' && SLUG_RE.test(s.openRecipe)) out.openRecipe = s.openRecipe;
    if (s.recipes && typeof s.recipes === 'object') {
      Object.keys(s.recipes).forEach(function (slug) {
        var p = s.recipes[slug];
        if (!p || typeof p !== 'object' || !SLUG_RE.test(slug)) return;
        out.recipes[slug] = {
          step: typeof p.step === 'number' && p.step >= 0 ? Math.floor(p.step) : 0,
          servings: typeof p.servings === 'number' ? clampServings(Math.floor(p.servings)) : null,
          title: typeof p.title === 'string' ? p.title : '',
          steps: typeof p.steps === 'number' ? p.steps : 0,
          t: typeof p.t === 'number' ? p.t : 0,
        };
        // Timer Ninja (od v0.3) — tylko gdy jest; starsze zapisy go nie mają i dalej działają.
        var timer = normalizeTimer(p.timer);
        if (timer) out.recipes[slug].timer = timer;
      });
    }
    return out;
  }

  // ───────── timer Ninja (czyste funkcje; czas zawsze z Date.now(), nie z liczby tyknięć) ─────────
  // Timer pilnuje tylko czynności (obróć / potrząśnij) — końca pieczenia pilnuje sama Ninja (własny licznik i sygnał).

  var MINUTE = 60000;
  var HOLD_MAX = 2 * MINUTE;   // tyle czekamy na „Zrobione" (szuflada wysunięta = Ninja stoi)
  var HOLD_DEFAULT = 30000;    // brak „Zrobione" w 2 min → przyjmujemy 30 s postoju

  // „Strefa 1 · Udka" / „Zone 1 · Chicken legs" — etykieta EN z tłumaczenia, gdy jest.
  function zoneText(e, lang) {
    var label = normalizeLang(lang) === 'en' && e.label_en ? e.label_en : e.label;
    return tr(lang, 'zone') + ' ' + e.no + (label ? ' · ' + label : '');
  }

  // Kody czynności z YAML (turn.action) → klucze słownika (napisy w I18N).
  var ACTIONS = {
    flip: { up: 'flipUp', soft: 'flipSoft', lower: 'flipLower', cap: 'flipCap' },
    shake: { up: 'shakeUp', soft: 'shakeSoft', lower: 'shakeLower', cap: 'shakeCap' },
  };
  function actionText(code, lang) {
    var a = ACTIONS[code] || ACTIONS.flip;
    return { up: tr(lang, a.up), soft: tr(lang, a.soft), lower: tr(lang, a.lower), cap: tr(lang, a.cap) };
  }
  // Kiedy: 'in' (za) | 'at' (po) | 'now' (teraz).
  var WHEN = { 'in': 'whenIn', at: 'whenAt', now: 'whenNow' };

  // Czy panel Ninja ma choć jedną czynność (bez niej przepis nie ma timera).
  function hasTurns(n) {
    return !!(n && ((n.zone1 && n.zone1.turn) || (n.mode !== 'single' && n.zone2 && n.zone2.turn)));
  }

  // Plan timera z panelu Ninja: czynności od startu (ms) i total = czas najdłuższej strefy (granica licznika).
  // SYNC: krótsza strefa startuje później (obie kończą razem), więc jej czynność przesuwa się o różnicę czasów.
  // MATCH, INDEPENDENT, SINGLE: strefy od startu.
  // Zdarzenie: { id, kind, at, no (nr strefy), label (PL), label_en (z tłumaczenia), action, required } — napisy
  // powstają dopiero przy wyświetlaniu, więc zapisany timer działa po zmianie języka. labelsEn = translations.en.labels.
  function timerPlan(n, labelsEn) {
    var zones = [{ no: 1, z: n.zone1 }];
    if (n.mode !== 'single' && n.zone2) zones.push({ no: 2, z: n.zone2 });
    var total = 0;
    zones.forEach(function (x) { total = Math.max(total, x.z.minutes); });
    var events = [];
    zones.forEach(function (x) {
      if (!x.z.turn) return;
      var offset = n.mode === 'sync' ? total - x.z.minutes : 0;
      var e = { id: 'turn' + x.no, kind: 'turn', at: (offset + x.z.turn.after_min) * MINUTE, no: x.no };
      if (x.z.label) e.label = x.z.label;
      if (x.z.label && labelsEn && typeof labelsEn['zone' + x.no] === 'string') e.label_en = labelsEn['zone' + x.no];
      e.action = x.z.turn.action;
      e.required = x.z.turn.required !== false;
      events.push(e);
    });
    events.sort(function (a, b) { return a.at - b.at; });
    return { total: total * MINUTE, events: events };
  }

  // Kolejka: czynności po czasie; czynności z tej samej chwili w jednej grupie. [{ at, events: [...] }]
  function timerQueue(plan) {
    var groups = [];
    plan.events.forEach(function (e) {
      var last = groups[groups.length - 1];
      if (last && last.at === e.at) last.events.push(e);
      else groups.push({ at: e.at, events: [e] });
    });
    return groups;
  }
  function groupKey(g) { return g.events[0].id; }
  function groupRequired(g) { return g.events.some(function (e) { return e.required; }); }

  // Stan timera: { plan, startedAt, pausedAt (null = biegnie), pausedTotal, acked: [id], holds: { klucz grupy: ms } };
  // null = nie wystartował. holds — postój Ninja przy czynności (od alarmu do „Zrobione").
  function timerStart(plan, now) {
    return { plan: plan, startedAt: now, pausedAt: null, pausedTotal: 0, acked: [], holds: {} };
  }
  function timerPause(t, now) {
    return t && t.pausedAt === null ? Object.assign({}, t, { pausedAt: now }) : t;
  }
  function timerResume(t, now) {
    return t && t.pausedAt !== null ? Object.assign({}, t, { pausedAt: null, pausedTotal: t.pausedTotal + Math.max(0, now - t.pausedAt) }) : t;
  }
  // Czas „surowy": od startu, bez ręcznych pauz.
  function timerRaw(t, now) {
    return Math.max(0, (t.pausedAt !== null ? t.pausedAt : now) - t.startedAt - t.pausedTotal);
  }
  // Kompensacja wysuniętej szuflady: grupa z alarmem (required) „zatrzymuje" odliczanie od swojego momentu
  // do „Zrobione" — najdłużej 2 min; bez „Zrobione" w 2 min przyjmujemy 30 s. Czynności bez alarmu — bez postoju.
  // Zwraca { elapsed (ms czasu Ninja), raw, holds: suma postojów }.
  function timerClock(t, now) {
    var raw = timerRaw(t, now), held = 0, groups = timerQueue(t.plan);
    for (var i = 0; i < groups.length; i++) {
      var g = groups[i];
      if (!groupRequired(g)) continue;
      var reach = g.at + held;               // czas surowy, w którym Ninja doszła do tej czynności
      if (raw < reach) break;
      var stored = t.holds[groupKey(g)];
      held += typeof stored === 'number' ? stored : (raw - reach <= HOLD_MAX ? raw - reach : HOLD_DEFAULT);
    }
    return { elapsed: Math.max(0, Math.min(t.plan.total, raw - held)), raw: raw, held: held };
  }
  function timerElapsed(t, now) { return timerClock(t, now).elapsed; }

  // „Zrobione" dla czynności (ids z jednej grupy): zapisuje postój tej grupy (czas od jej momentu, najwyżej 2 min,
  // spóźnione → 30 s), żeby przeładowanie nie zmieniło wyniku.
  function timerAck(t, ids, now) {
    if (!t) return t;
    var acked = t.acked.concat(ids.filter(function (id) { return t.acked.indexOf(id) === -1; }));
    var holds = Object.assign({}, t.holds), raw = timerRaw(t, now), held = 0, groups = timerQueue(t.plan);
    for (var i = 0; i < groups.length; i++) {
      var g = groups[i];
      if (!groupRequired(g)) continue;
      var reach = g.at + held, key = groupKey(g);
      if (raw < reach) break;
      var inGroup = g.events.some(function (e) { return ids.indexOf(e.id) !== -1; });
      if (typeof holds[key] !== 'number' && inGroup) holds[key] = raw - reach <= HOLD_MAX ? raw - reach : HOLD_DEFAULT;
      held += typeof holds[key] === 'number' ? holds[key] : (raw - reach <= HOLD_MAX ? raw - reach : HOLD_DEFAULT);
    }
    return Object.assign({}, t, { acked: acked, holds: holds });
  }

  // Cel licznika: najbliższa grupa, której moment jeszcze nie nadszedł. null = po ostatniej czynności („—").
  function timerTarget(plan, elapsed, acked) {
    var groups = timerQueue(plan);
    for (var i = 0; i < groups.length; i++) {
      var open = groups[i].events.some(function (e) { return acked.indexOf(e.id) === -1; });
      if (groups[i].at > elapsed && open) return groups[i];
    }
    return null;
  }
  // idle (nie wystartował) | running | paused | done (po ostatniej czynności)
  function timerStatus(t, now) {
    if (!t) return 'idle';
    if (!timerTarget(t.plan, timerElapsed(t, now), t.acked)) return 'done';
    return t.pausedAt !== null ? 'paused' : 'running';
  }
  // Alarm do pokazania teraz: najwcześniejsze minione, niepotwierdzone czynności z alarmem (required) —
  // wszystkie z tej samej chwili razem (jeden komunikat dla obu stref). Zwraca { events: [...] } albo null.
  function timerDue(t, now) {
    if (!t) return null;
    var elapsed = timerElapsed(t, now), due = [];
    t.plan.events.forEach(function (e) {
      if (!e.required || t.acked.indexOf(e.id) !== -1 || e.at > elapsed) return;
      if (!due.length || e.at === due[0].at) due.push(e);
    });
    return due.length ? { events: due } : null;
  }
  // Napis nad licznikiem / w alarmie: when = 'in' | 'at' | 'now'.
  // „OBRÓĆ ZA" / „FLIP IN", „OBRÓĆ / POTRZĄŚNIJ ZA", „można obrócić za" / „optional flip in" (bez alarmu).
  function groupTitle(group, when, lang) {
    var codes = [], w = tr(lang, WHEN[when] || WHEN['in']);
    group.events.forEach(function (e) { if (codes.indexOf(e.action) === -1) codes.push(e.action); });
    if (groupRequired(group)) return codes.map(function (c) { return actionText(c, lang).up; }).join(' / ') + ' ' + w.toUpperCase();
    return codes.map(function (c) { return actionText(c, lang).soft; }).join(' / ') + ' ' + w;
  }
  // Strefy grupy: „Strefa 1 · Udka"; przy różnych czynnościach z dopiskiem („Strefa 2 · Frytki — potrząśnij").
  function groupZones(group, lang) {
    var mixed = group.events.some(function (e) { return e.action !== group.events[0].action; });
    return group.events.map(function (e) { return zoneText(e, lang) + (mixed ? ' — ' + actionText(e.action, lang).lower : ''); });
  }
  // 1 680 000 ms → „28:00"; sekundy zaokrąglane w górę (0:01 do samego końca).
  function clock(ms) {
    var s = Math.ceil(Math.max(0, ms) / 1000), m = Math.floor(s / 60), r = s % 60;
    return (m < 10 ? '0' : '') + m + ':' + (r < 10 ? '0' : '') + r;
  }
  // Zdarzenie timera z localStorage → kształt z v0.4 albo null. Zapis z v0.3.2 ma gotowy polski napis
  // zone („Strefa 1 · Udka") zamiast no / label — przenosimy go, żeby działający timer przetrwał aktualizację.
  function normalizeEvent(e) {
    var num = function (v) { return typeof v === 'number' && isFinite(v); };
    if (!e || typeof e.id !== 'string' || e.kind !== 'turn' || !num(e.at) || typeof e.required !== 'boolean' || !ACTIONS[e.action]) return null;
    var no = e.no, label = e.label, labelEn = e.label_en;
    if (no === undefined && typeof e.zone === 'string') {
      var m = /^turn([12])$/.exec(e.id);
      if (!m) return null;
      no = Number(m[1]);
      label = e.zone.replace(/^Strefa \d+(?: · )?/, '') || undefined;
    }
    if (no !== 1 && no !== 2) return null;
    if ((label !== undefined && typeof label !== 'string') || (labelEn !== undefined && typeof labelEn !== 'string')) return null;
    var out = { id: e.id, kind: 'turn', at: e.at, no: no };
    if (label) out.label = label;
    if (label && labelEn) out.label_en = labelEn;
    out.action = e.action;
    out.required = e.required;
    return out;
  }

  // Timer z localStorage — każde pole sprawdzone; coś nie tak (także zapis z v0.3 / v0.3.1 ze zdarzeniem końca
  // albo polskimi słowami w action) → brak timera.
  function normalizeTimer(t) {
    if (!t || typeof t !== 'object' || !t.plan || typeof t.plan !== 'object') return null;
    var p = t.plan, num = function (v) { return typeof v === 'number' && isFinite(v); };
    if (!num(p.total) || p.total <= 0 || !Array.isArray(p.events) || !p.events.length || !num(t.startedAt) || !num(t.pausedTotal) || t.pausedTotal < 0) return null;
    if (t.pausedAt !== null && !num(t.pausedAt)) return null;
    var events = p.events.map(normalizeEvent).filter(function (e) { return e; });
    if (events.length !== p.events.length) return null;
    var acked = Array.isArray(t.acked) ? t.acked.filter(function (id) { return typeof id === 'string'; }) : [];
    var holds = {};
    if (t.holds && typeof t.holds === 'object') {
      Object.keys(t.holds).forEach(function (k) { if (num(t.holds[k]) && t.holds[k] >= 0) holds[k] = t.holds[k]; });
    }
    return { plan: { total: p.total, events: events }, startedAt: t.startedAt, pausedAt: t.pausedAt, pausedTotal: t.pausedTotal, acked: acked, holds: holds };
  }

  // Zapis sprzed v0.2.3 ({ ekran, przepisy: { slug: { krok, porcje, tytul, krokow, t } } }) → nowy kształt.
  function migrateLegacyState(old) {
    if (!old || typeof old !== 'object') return normalizeState(null);
    var s = { openRecipe: old.ekran !== 'lista' ? old.ekran : null, recipes: {} };
    var list = old.przepisy && typeof old.przepisy === 'object' ? old.przepisy : {};
    Object.keys(list).forEach(function (slug) {
      var p = list[slug];
      if (!p || typeof p !== 'object') return;
      s.recipes[slug] = { step: p.krok, servings: p.porcje, title: p.tytul, steps: p.krokow, t: p.t };
    });
    return normalizeState(s);
  }

  var api = {
    tm6Visible: tm6Visible, pinClass: pinClass,
    badgeIndex: badgeIndex, isBadgeChip: isBadgeChip, fixGroupChips: fixGroupChips, badgeOrder: badgeOrder,
    normalize: normalize, matchesQuery: matchesQuery, searchWords: searchWords, wordStems: wordStems, matchLevel: matchLevel,
    isEdit1: isEdit1, buildDictionary: buildDictionary, typoCandidates: typoCandidates, searchIndex: searchIndex, matchesChips: matchesChips, filterEntries: filterEntries,
    availableChips: availableChips, toggleChip: toggleChip, normalizeListState: normalizeListState, NINJA_FUNCTIONS: NINJA_FUNCTIONS,
    I18N: I18N, LANGS: LANGS, ACTIONS: ACTIONS, WHEN: WHEN, tr: tr, trn: trn, normalizeLang: normalizeLang,
    localizeRecipe: localizeRecipe, entryView: entryView, warningsLabel: warningsLabel, decimal: decimal,
    servingsWord: servingsWord, problemsLabel: problemsLabel, groupProblems: groupProblems, scaledAmount: scaledAmount, tm6Time: tm6Time, tm6Speed: tm6Speed,
    normalizeState: normalizeState, migrateLegacyState: migrateLegacyState, esc: esc,
    hasTurns: hasTurns, timerPlan: timerPlan, timerStart: timerStart, timerPause: timerPause, timerResume: timerResume,
    timerAck: timerAck, timerClock: timerClock, timerElapsed: timerElapsed, timerStatus: timerStatus, timerDue: timerDue,
    timerQueue: timerQueue, timerTarget: timerTarget, groupTitle: groupTitle, groupZones: groupZones, clock: clock,
    normalizeTimer: normalizeTimer,
  };
  // Testy w Node uruchamiają ten plik bez przeglądarki — dostają tylko czyste funkcje.
  if (!global.document) { global.kitchenTest = api; return; }

  // ───────── przeglądarka ─────────

  var doc = global.document;
  var html = doc.documentElement;
  var app = doc.getElementById('app');

  if (global.navigator.standalone) html.className += ' standalone';

  // Identyfikator buildu wstawiony przez build do <html data-build>. Jest w adresach danych,
  // więc po publikacji iPad (zwłaszcza w trybie z ekranu początkowego) nie użyje starej kopii.
  var BUILD = html.getAttribute('data-build') || '';
  var startQuery = global.location.search;
  // ?b=<build> zostaje po przeładowaniu do nowej wersji — sprzątamy adres.
  if (/[?&]b=/.test(startQuery)) global.history.replaceState(global.history.state, '', global.location.pathname + global.location.hash);

  // ── pamięć (localStorage zawsze w try/catch) ──
  // Jednorazowe przeniesienie zapisów sprzed v0.2.3 (polskie klucze), żeby iPad nie zgubił
  // otwartego przepisu, kroku i porcji. Stare klucze usuwane dopiero po udanym zapisie nowych.
  // Motyw (jasny/ciemny) usunięty w v0.7 — stare klucze motywu tylko kasujemy.
  function migrateStorage() {
    try {
      var store = global.localStorage;
      var oldState = store.getItem(LEGACY_KEYS.state);
      if (oldState !== null && store.getItem(STATE_KEY) === null) {
        store.setItem(STATE_KEY, JSON.stringify(migrateLegacyState(JSON.parse(oldState))));
      }
      var oldReload = store.getItem(LEGACY_KEYS.reload);
      if (oldReload !== null && store.getItem(RELOAD_KEY) === null) store.setItem(RELOAD_KEY, oldReload);
      store.removeItem(LEGACY_KEYS.state);
      store.removeItem(LEGACY_KEYS.theme);
      store.removeItem(LEGACY_KEYS.reload);
      store.removeItem(OLD_THEME_KEY);
    } catch (e) { /* brak pamięci / zepsuty stary zapis — zaczynamy od czystego stanu */ }
  }
  migrateStorage();

  function readState() {
    try { return normalizeState(JSON.parse(global.localStorage.getItem(STATE_KEY) || 'null')); } catch (e) { return normalizeState(null); }
  }
  function saveState() {
    var slugs = Object.keys(state.recipes);
    if (slugs.length > MAX_REMEMBERED) {
      slugs.sort(function (a, b) { return state.recipes[b].t - state.recipes[a].t; });
      slugs.slice(MAX_REMEMBERED).forEach(function (s) { delete state.recipes[s]; });
    }
    try { global.localStorage.setItem(STATE_KEY, JSON.stringify(state)); } catch (e) { /* tryb prywatny / brak miejsca */ }
  }
  var state = readState();

  // ── język interfejsu (PL domyślnie; wybór w localStorage) ──
  var lang = 'pl';
  try { lang = normalizeLang(global.localStorage.getItem(LANG_KEY)); } catch (e) { /* domyślnie PL */ }
  function T(key, params) { return tr(lang, key, params); }
  function TN(key, n, params) { return trn(lang, key, n, params); }
  function applyLang() {
    html.setAttribute('lang', lang);
    doc.title = T('recipes');
  }
  applyLang();
  // Przełącznik „PL | EN" w górnym pasku — dotknięcie zmienia język.
  function langButton() {
    return '<button class="btn lang" data-act="lang" aria-label="' + T('langLabel') + '"><span' + (lang === 'pl' ? ' class="on"' : '') +
      '>PL</span><span class="sep">|</span><span' + (lang === 'en' ? ' class="on"' : '') + '>EN</span></button>';
  }
  // Ikony (inline SVG, kolor z currentColor).
  function icon(path) {
    return '<svg class="ico" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">' + path + '</svg>';
  }
  var ICON_PHOTO = '<rect x="3" y="5" width="18" height="14" rx="3"/><circle cx="9" cy="10" r="1.8"/><path d="M21 16l-5-5-8 8"/>';
  var ICON_SEARCH = '<circle cx="11" cy="11" r="7"/><path d="M16.5 16.5L21 21"/>';
  function setLang(l) {
    lang = normalizeLang(l);
    try { global.localStorage.setItem(LANG_KEY, lang); } catch (e) { /* nie szkodzi */ }
    applyLang();
    // Przerysuj bieżący ekran w nowym języku, bez zmiany przewinięcia.
    if (V.screen === 'list' && index) drawList(currentScroll());
    else if (V.screen === 'recipe') drawRecipe(V.r, V.step, recipeScroll());
    else if (V.screen === 'list') showList();
    else if (V.slug) openRecipe(V.slug, null);
  }

  // ── pobieranie JSON ──
  function fetchJson(url, ok, fail) {
    var x = new XMLHttpRequest();
    x.open('GET', url, true);
    x.onreadystatechange = function () {
      if (x.readyState !== 4) return;
      if (x.status !== 200) { fail(x.status); return; }
      var data;
      try { data = JSON.parse(x.responseText); } catch (e) { fail(0); return; }
      ok(data);
    };
    x.send();
  }

  // ── widok ──
  // V = to, co jest teraz na ekranie. Pamięć (state) zapisujemy od razu przy każdej zmianie.
  // V.screen: 'start' | 'list' | 'loading' | 'error' | 'recipe'; V.L — przepis w bieżącym języku (localizeRecipe).
  var V = { screen: 'start', slug: null, r: null, L: null, step: 0, servings: 0 };
  var index = null;            // search.json (lista)
  var dictionary = [];         // słowa z pól text (poprawianie literówek), liczone raz po wczytaniu search.json
  var recipeCache = {};        // pobrane data/<slug>.json
  var problems = [];           // errors.json pogrupowane po plikach (przepisy pominięte przez build)
  var notices = [];            // warnings.json pogrupowane po plikach (braki w tłumaczeniu EN)
  var searchTimer = null;      // opóźnienie filtrowania przy wpisywaniu (ok. 150 ms)
  var scrollTimer = null;      // zapis przewinięcia listy (po chwili bez ruchu)

  function render(h, scroll) {
    app.innerHTML = h;
    var sc = app.querySelector('.scroll');
    if (sc) sc.scrollTop = scroll || 0;
  }

  function listBar() {
    return '<div class="bar"><h1>' + T('recipes') + '</h1>' + langButton() + '</div>';
  }
  // Przepis: „‹ Przepisy", tytuł (+ znaczek PL bez tłumaczenia), pod nim czasy; „Zdjęcie" tylko gdy przepis ma zdjęcie.
  // o = { sub, photo, pl } — na ekranach ładowania i błędu pusty.
  function recipeBar(title, o) {
    o = o || {};
    // Plakietki (LOW / NORM / KIDS, znaczek PL) obok tytułu, ale poza <h1> (od v0.10) — tytuł się obcina, plakietki zostają.
    var marks = (o.badges ? badgeTags(o.badges) : '') + (o.pl ? '<span class="dev pl" title="' + T('plOnly') + '">PL</span>' : '');
    return '<div class="bar"><button class="btn back" data-act="back">' + T('back') + '</button><div class="ttl"><div class="trow"><h1>' + (title ? esc(title) : '') + '</h1>' +
      (marks ? '<span class="marks">' + marks + '</span>' : '') + '</div>' + (o.sub ? '<div class="sub">' + o.sub + '</div>' : '') + '</div>' +
      (o.photo ? '<button class="btn" data-act="photo">' + icon(ICON_PHOTO) + T('photo') + '</button>' : '') + langButton() + '</div>';
  }

  function photo(src, cls) {
    if (!src) return '<div class="ph none ' + cls + '"><div class="em">🍽</div></div>';
    return '<div class="ph ' + cls + '"><img src="' + esc(src) + '" alt=""></div>';
  }

  // Plakietki znaczników (KIDS, NORM…): płaskie, w kolorze z listy — ten sam kształt co NINJA / TM6.
  function badgeTags(list) {
    var h = '';
    (list || []).forEach(function (b) {
      if (b && typeof b.label === 'string' && BADGE_COLORS.indexOf(b.color) !== -1) h += '<span class="dev b-' + b.color + '">' + esc(b.label) + '</span>';
    });
    return h;
  }

  function deviceBadges(tags) {
    var h = '';
    if (tags.indexOf('ninja') !== -1) h += '<span class="dev ninja">NINJA</span>';
    if (tags.indexOf('tm6') !== -1) h += '<span class="dev tm6">TM6</span>';
    return h;
  }

  // Tytuł przepisu w bieżącym języku (alarm, karta „Wróć do gotowania") — z pobranych danych albo z zapisu.
  function recipeTitle(slug) {
    if (recipeCache[slug]) return localizeRecipe(recipeCache[slug], lang).title;
    for (var i = 0; index && i < index.length; i++) if (index[i].id === slug) return entryView(index[i], lang).title;
    var p = state.recipes[slug];
    return p && p.title ? p.title : '';
  }

  // ═════ lista ═════
  function showList(scroll) {
    V = { screen: 'list', slug: null, r: null, L: null, step: 0, servings: 0 };
    state.openRecipe = null;
    saveState();
    if (!index) {
      render(listBar() + '<div class="scroll"><div class="loading">' + T('loading') + '</div></div>');
      // Listy błędów i ostrzeżeń są dodatkiem: gdy się nie wczytają, lista przepisów i tak działa.
      // Plakietki dochodzą osobno (tylko #badges) — bez przerysowania pola wyszukiwania.
      fetchJson('/errors.json?b=' + BUILD, function (d) {
        problems = groupProblems(d);
        refreshBadges();
      }, function () { /* brak errors.json — bez plakietki */ });
      fetchJson('/warnings.json?b=' + BUILD, function (d) {
        notices = groupProblems(d);
        refreshBadges();
      }, function () { /* brak warnings.json — bez plakietki */ });
      fetchJson('/search.json?b=' + BUILD, function (d) {
        index = d;
        dictionary = buildDictionary(d);
        // Zapis z v0.8 mógł mieć dwa znaczniki z jednej grupy (np. low i norm) — zostaje pierwszy.
        var fixed = fixGroupChips(state.list.chips, badgeIndex(d));
        if (fixed.length !== state.list.chips.length) { state.list.chips = fixed; saveState(); }
        if (V.screen === 'list') drawList(state.list.scroll);
      }, function () {
        if (V.screen === 'list') render(listBar() + '<div class="scroll"><div class="err" data-act="retry-list"><b>' + T('listFailed') + '</b><br><br>' + T('retryHint') + '</div></div>');
      });
      return;
    }
    drawList(scroll === undefined ? state.list.scroll : scroll);
  }

  function currentScroll() {
    var sc = app.querySelector('.scroll');
    return sc ? sc.scrollTop : 0;
  }

  // Czerwona plakietka „N przepisów z błędem" i pomarańczowa „N przepisów bez tłumaczenia EN" — dotknięcie pokazuje listę.
  function badges() {
    var h = '';
    if (problems.length) {
      h += '<button class="problems-badge" data-act="problems">⚠ ' + esc(problemsLabel(problems.length, lang)) + '<span class="more">' + T('show') + '</span></button>';
    }
    if (notices.length) {
      h += '<button class="problems-badge warn" data-act="warnings">🌐 ' + esc(warningsLabel(notices.length, lang)) + '<span class="more">' + T('show') + '</span></button>';
    }
    return h;
  }

  function refreshBadges() {
    var b = doc.getElementById('badges');
    if (V.screen === 'list' && b) b.innerHTML = badges();
  }

  // Lista: plakietki, pole wyszukiwania, chipy, wyniki (#results: licznik / „Wróć do gotowania" / siatka / brak wyników).
  // Przy wpisywaniu i chipach odświeżane są tylko #chips i #results — przerysowanie pola na iOS 12 zamyka klawiaturę.
  function drawList(scroll) {
    var h = listBar() + '<div class="scroll"><div id="badges">' + badges() + '</div>';
    if (!index.length) {
      render(h + '<div class="empty">' + T('empty') + '<br><br>' + T('emptyHint') + '</div></div>');
      return;
    }
    var q = state.list.query;
    h += '<div class="search' + (q ? ' has' : '') + '" id="search">' + icon(ICON_SEARCH) + '<input id="search-input" class="box" type="text" value="' + esc(q) +
      '" placeholder="' + T('searchPlaceholder') + '" maxlength="' + QUERY_MAX + '" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false">' +
      '<button class="sclear" data-act="search-clear" aria-label="' + T('searchClear') + '">✕</button></div>';
    h += '<div class="chips" id="chips">' + chipsHtml() + '</div><div id="results">' + resultsHtml() + '</div>';
    render(h + '</div>', scroll);
  }

  // „Wszystkie" podświetlone, gdy żaden chip nie jest zaznaczony. Nazwy funkcji Ninja jak na urządzeniu (po angielsku).
  function chipsHtml() {
    var on = state.list.chips, badges = badgeIndex(index);
    var chip = function (code, label, active, cls) {
      return '<button class="chip' + (cls ? ' ' + cls : '') + (active ? ' on' : '') + '" data-act="chip" data-chip="' + esc(code) + '">' + label + '</button>';
    };
    // Znaczniki: nieaktywny z kolorową kropką i cienką ramką w kolorze, aktywny wypełniony kolorem znacznika.
    return chip('', T('chipAll'), !on.length) + availableChips(index).map(function (c) {
      if (isBadgeChip(c)) {
        var b = badges[c.slice(BADGE_CHIP.length)];
        return chip(c, '<span class="dot"></span>' + esc(b.label), on.indexOf(c) !== -1, 'badge c-' + b.color);
      }
      return chip(c, esc(c === 'ninja' ? 'Ninja' : (c === 'tm6' ? 'TM6' : c)), on.indexOf(c) !== -1);
    }).join('');
  }

  function resultsHtml() {
    var q = state.list.query, chips = state.list.chips, active = !!(normalize(q) || chips.length);
    var found = filterEntries(index, q, chips, dictionary), list = found.results, h = '';
    if (active) h += '<div class="count">' + esc(TN('resultsCount', index.length, { shown: list.length })) + '</div>';
    // Wynik dzięki poprawce literówki: pokaż, jakiego słowa użyliśmy.
    if (found.corrected && list.length) h += '<div class="corrected">' + T('showingFor', { q: '<b>' + esc(found.corrected) + '</b>' }) + '</div>';
    else h += resumeCard();
    if (!list.length) {
      return h + '<div class="nomatch"><b>' + T('noMatches') + '</b><br>' + T('noMatchesHint') +
        '<br><button class="btn" data-act="search-reset">' + T('clearAll') + '</button></div>';
    }
    h += '<div class="grid">';
    for (var i = 0; i < list.length; i++) {
      var it = list[i], ev = entryView(it, lang), min = it.prep_minutes + it.cook_minutes;
      h += '<div class="lcard" data-open="' + esc(it.id) + '">' + photo(it.thumb, 'thumb') +
        '<div class="txt"><h3>' + esc(ev.title) + '</h3><div class="meta">' + (min ? T('minutes', { n: min }) : T('noCooking')) +
        ' · ' + it.servings + ' ' + servingsWord(it.servings, lang) + '</div><div class="devs">' + deviceBadges(it.tags) + badgeTags(it.badges) +
        (ev.fallback ? '<span class="dev pl">PL</span>' : '') + '</div></div></div>';
    }
    return h + '</div>';
  }

  // Odśwież wyniki (i chipy) bez ruszania pola wyszukiwania.
  function updateResults(withChips) {
    if (V.screen !== 'list' || !index) return;
    var res = doc.getElementById('results'), ch = doc.getElementById('chips'), box = doc.getElementById('search');
    if (!res) return;
    res.innerHTML = resultsHtml();
    if (withChips && ch) ch.innerHTML = chipsHtml();
    if (box) box.className = 'search' + (state.list.query ? ' has' : '');
  }

  // Wpisywanie: stan zapisany od razu, wyniki po ok. 150 ms bez pisania.
  function onSearchInput(value) {
    state.list.query = String(value).slice(0, QUERY_MAX);
    saveState();
    var box = doc.getElementById('search');
    if (box) box.className = 'search' + (state.list.query ? ' has' : '');
    global.clearTimeout(searchTimer);
    searchTimer = global.setTimeout(function () { updateResults(false); }, 150);
  }
  // query / chips: null = bez zmian.
  function setSearch(query, chips) {
    global.clearTimeout(searchTimer);
    if (query !== null) {
      state.list.query = query;
      var input = doc.getElementById('search-input');
      if (input) input.value = query;
    }
    if (chips !== null) state.list.chips = chips;
    saveState();
    updateResults(chips !== null);
  }

  // „Wróć do gotowania" — ostatnio otwarty przepis, jeśli było w nim coś zrobione.
  function resumeCard() {
    var latest = null;
    Object.keys(state.recipes).forEach(function (slug) {
      if (!latest || state.recipes[slug].t > state.recipes[latest].t) latest = slug;
    });
    if (!latest) return '';
    var p = state.recipes[latest];
    var inIndex = index.some(function (it) { return it.id === latest; });
    if (!inIndex || (p.step === 0 && !p.servings)) return '';
    return '<div class="resume" data-open="' + esc(latest) + '"><div class="t"><div class="k">' + T('resumeTitle') + '</div><div class="n">' +
      esc(recipeTitle(latest)) + '</div><div class="s">' + esc(T('stepOf', { n: p.step + 1, total: p.steps })) + '</div></div><span class="btn">' + T('open') + '</span></div>';
  }

  // ═════ przepis ═════
  // Adres kroku #krok-N (N od 1) — opisany w CLAUDE.md.
  function recipeUrl(slug, step) { return '/p/' + slug + '/' + (step > 0 ? '#krok-' + (step + 1) : ''); }

  function openRecipe(slug, urlStep) {
    V = { screen: 'loading', slug: slug, r: null, L: null, step: 0, servings: 0 };
    state.openRecipe = slug;
    saveState();
    var r = recipeCache[slug];
    if (r) { drawRecipe(r, urlStep); return; }
    render(recipeBar('') + '<div class="scroll"><div class="loading">' + T('loading') + '</div></div>');
    fetchJson('/data/' + slug + '.json?b=' + BUILD, function (d) {
      recipeCache[slug] = d;
      if (V.slug === slug) drawRecipe(d, urlStep);
    }, function (status) {
      if (V.slug !== slug) return;
      V.screen = 'error';
      var msg = status === 404
        ? '<b>' + T('recipeMissing') + '</b><br><br>' + T('recipeMissingHint')
        : '<b>' + T('recipeFailed') + '</b><br><br>' + T('retryHint');
      if (status === 404) {
        delete state.recipes[slug];
        state.openRecipe = null;
        saveState();
      }
      render(recipeBar('') + '<div class="scroll"><div class="err"' + (status === 404 ? '' : ' data-act="retry-recipe"') + '>' + msg + '</div></div>');
    });
  }

  // keepScroll (liczba) — przerysowanie po zmianie języka: zostaje to samo miejsce na ekranie.
  function drawRecipe(r, urlStep, keepScroll) {
    var p = state.recipes[r.id];
    var step = urlStep !== null && urlStep !== undefined ? urlStep : (p ? p.step : 0);
    if (step >= r.steps.length) step = 0;
    var L = localizeRecipe(r, lang);
    V = { screen: 'recipe', slug: r.id, r: r, L: L, step: step, servings: p && p.servings ? p.servings : r.servings };
    rememberRecipe();
    global.history.replaceState(global.history.state, '', recipeUrl(r.id, step));

    var sub = T('prep') + ' ' + T('minutes', { n: r.prep_minutes }) + ' · ' + (r.cook_minutes ? T('cook') + ' ' + T('minutes', { n: r.cook_minutes }) : T('noBake'));
    var h = recipeBar(L.title, { sub: esc(sub), photo: !!r.image, pl: L.fallback, badges: r.badges });

    // Przypięte wyświetlacze urządzeń (jedyne miejsce z poświatą); timer obracania wewnątrz panelu Ninja.
    // Oba urządzenia (od v0.7.1, w poziomie): Ninja z jedną strefą i TM6 obok siebie (pin both one),
    // Ninja z dwiema strefami nad niskim panelem TM6 (pin both two). W pionie zawsze jeden pod drugim.
    var tm6 = hasTm6(r);
    if (r.ninja || tm6) {
      h += '<div class="' + pinClass(r, step) + '" id="pin">';
      if (r.ninja) h += '<div class="pn">' + ninjaPanel(r.ninja) + '<div id="servings-note">' + servingsNote() + '</div></div>';
      if (tm6) h += '<div id="tm6-panel">' + (tm6Visible(r, step) ? tm6Panel(step) : '') + '</div>';
      h += '</div>';
    }

    // Składniki (karta z licznikiem porcji) | kroki, a na końcu kolumny kroków opis i notatki.
    // W poziomie kolumny przewijają się osobno (.scroll.rs w CSS), w pionie całość jedna pod drugą.
    h += '<div class="scroll rs"><div class="cols"><div class="c1"><div class="icard"><div class="ch"><h2>' + T('ingredients') + '</h2>' +
      '<div class="stepper" id="servings">' + servingsHtml() + '</div></div><div class="ing" id="ingredients">' + ingredientsHtml() + '</div></div></div>';
    h += '<div class="c2">';
    for (var i = 0; i < L.steps.length; i++) h += stepHtml(L.steps[i], i, step);
    var about = '';
    if (L.description) about += '<p class="desc">' + esc(L.description) + '</p>';
    // Notatki (treść pod YAML) nie mają tłumaczenia — w trybie EN ze znaczkiem PL.
    if (r.notes) about += '<div class="notes"><div class="nh">' + T('notes') + (lang === 'en' ? ' <span class="dev pl">PL</span>' : '') + '</div><div class="txt">' + esc(r.notes) + '</div></div>';
    if (about) h += '<div class="about">' + about + '</div>';
    h += '</div></div></div>';

    var keep = keepScroll && typeof keepScroll === 'object' ? keepScroll : null;
    render(h, keep ? keep.main : (keepScroll || 0));
    if (keep) restoreColumns(keep);
    updateTimerUI();
    // Po powrocie do przepisu (np. po przeładowaniu Safari) pokaż bieżący krok.
    if (keepScroll === undefined && step > 0) scrollToStep(step);
  }

  // Czy element ma własne przewijanie (w poziomie kolumny przepisu — overflow-y: auto z CSS).
  function scrollsItself(el) {
    try { return !!el && global.getComputedStyle(el).overflowY === 'auto'; } catch (e) { return false; }
  }
  // Element, który przewija kroki: w poziomie kolumna kroków, w pionie cała treść.
  function stepBox() {
    var col = app.querySelector('.c2');
    return scrollsItself(col) ? col : app.querySelector('.scroll');
  }
  // Bieżący krok na górze: w poziomie przewija się TYLKO kolumna kroków (składniki zostają od góry), w pionie całość.
  function scrollToStep(n) {
    var el = app.querySelectorAll('.step')[n], box = stepBox();
    if (box && el) box.scrollTop = Math.max(0, el.offsetTop - 16);
  }
  // Krok cały w obszarze przewijania (z marginesem); wyższy niż obszar — jego początek na górze.
  function revealStep(box, el) {
    var b = box.getBoundingClientRect(), r = el.getBoundingClientRect(), m = 12;
    if (r.top < b.top + m) box.scrollTop -= (b.top + m) - r.top;
    else if (r.bottom > b.bottom - m) box.scrollTop += Math.min(r.bottom - (b.bottom - m), r.top - (b.top + m));
  }
  // Przewinięcie ekranu przepisu (całość + obie kolumny) — zostaje przy przerysowaniu po zmianie języka.
  function recipeScroll() {
    var c1 = app.querySelector('.c1'), c2 = app.querySelector('.c2');
    return { main: currentScroll(), c1: c1 ? c1.scrollTop : 0, c2: c2 ? c2.scrollTop : 0 };
  }
  function restoreColumns(k) {
    var c1 = app.querySelector('.c1'), c2 = app.querySelector('.c2');
    if (c1) c1.scrollTop = k.c1;
    if (c2) c2.scrollTop = k.c2;
  }

  function rememberRecipe() {
    var r = V.r, old = state.recipes[r.id];
    state.openRecipe = r.id;
    state.recipes[r.id] = {
      step: V.step, servings: V.servings === r.servings ? null : V.servings,
      title: r.title, steps: r.steps.length, t: Date.now(),
    };
    if (old && old.timer) state.recipes[r.id].timer = old.timer;
    saveState();
  }

  // Napis o obracaniu przy strefie: „Obróć po 10 min" / „Flip at 10 min" (z alarmem) albo „można obrócić po 10 min" (informacja).
  function turnText(turn) {
    var a = actionText(turn.action, lang);
    return turn.required === false ? T('turnOptional', { action: a.soft, n: turn.after_min }) : T('turnRequired', { action: a.cap, n: turn.after_min });
  }
  // Plakietka przy strefie: obowiązkowe — niebieska „↻ …", po czasie szara z „✓"; opcjonalne — szary tekst.
  function turnHtml(turn, no, past) {
    var req = turn.required !== false;
    return '<div class="turn' + (req ? '' : ' info') + (past ? ' ok' : '') + '" id="turn' + no + '">' + (past ? '✓ ' : (req ? '↻ ' : '')) + esc(turnText(turn)) + '</div>';
  }

  function ninjaPanel(n) {
    function zone(no, z) {
      var label = V.L.labels['zone' + no];
      return '<div class="zone"><div class="zh"><b>' + no + '</b>' + T('zone') + ' ' + no + '</div>' + (label ? '<div class="lbl">' + esc(label) + '</div>' : '') +
        '<div class="fn">' + esc(z['function']) + '</div><div class="vals"><span class="big">' + z.temp_c + '</span><span class="unit">°C</span>' +
        '<span class="big">' + z.minutes + '</span><span class="unit">min</span></div>' + (z.turn ? turnHtml(z.turn, no, false) : '') + '</div>';
    }
    var strip = hasTurns(n) ? timerBarHtml() : '';
    if (n.mode === 'single') return '<div class="npanel single"><div class="zrow">' + zone(1, n.zone1) + '</div>' + strip + '</div>';
    var label = { sync: ['modeSync', 'modeSyncHint'], match: ['modeMatch', 'modeMatchHint'], independent: ['modeIndependent', 'modeIndependentHint'] }[n.mode];
    return '<div class="npanel"><div class="zrow">' + zone(1, n.zone1) + '<div class="mode"><span class="m">' + T(label[0]) + '</span><span class="cap">' + T(label[1]) + '</span></div>' +
      zone(2, n.zone2) + '</div>' + strip + '</div>';
  }

  function servingsNote() {
    var r = V.r;
    if (!r.ninja || V.servings === r.servings) return '';
    return '<div class="scaled">' + T('ninjaFor', { n: r.servings, servings: servingsWord(r.servings, lang) }) + ' ' +
      (V.servings > r.servings ? T('ninjaMore') : T('ninjaLess')) + '</div>';
  }

  // Panel TM6: ustawienia BIEŻĄCEGO kroku. Krok bez TM6 → puste, wyszarzone tarcze (ta sama wysokość, ekran nie skacze).
  function tm6Panel(cur) {
    function dial(v, u, label, off, small) {
      return '<div class="dial' + (off ? ' off' : '') + '"><div class="r"><div class="v' + (small ? ' sm' : '') + '">' + v + '</div>' +
        (u ? '<div class="u">' + u + '</div>' : '') + '</div><div class="dl">' + label + '</div></div>';
    }
    var s = V.L.steps[cur], t = s && s.tm6;
    if (!t) {
      return '<div class="tpanel off"><div class="th"><span class="tk">TM6</span><span class="s">' + T('tm6None') + '</span></div><div class="dials">' +
        dial('—', '', T('time'), true) + dial('—', '', T('temperature'), true) + dial('—', '', T('speed'), true) + '</div></div>';
    }
    var temp = t.temperature === undefined ? dial('—', T('noHeat'), T('temperature'), true)
      : (t.temperature === 'Varoma' ? dial('Varoma', '', T('temperature'), false, true) : dial(t.temperature, '°C', T('temperature')));
    var speed = t.speed === undefined ? dial('—', '', T('speed'), true)
      : dial(esc(tm6Speed(t.speed, lang)), t.reverse ? T('reverse') : '', T('speed'), false, typeof t.speed !== 'number');
    return '<div class="tpanel"><div class="th"><span class="tk">TM6</span><span class="s">' + T('tm6Step', { n: cur + 1, total: V.L.steps.length }) + '</span>' +
      (s.tm6Mode ? '<span class="tmode">' + esc(s.tm6Mode) + '</span>' : '') + '</div><div class="dials">' +
      dial(tm6Time(t.duration_seconds), 'min:s', T('time')) + temp + speed + '</div></div>';
  }

  function servingsHtml() {
    var r = V.r, sv = V.servings, changed = sv !== r.servings;
    return '<button class="b" data-act="servings-"' + (sv <= SERVINGS_MIN ? ' disabled' : '') + ' aria-label="' + T('fewer') + '">−</button>' +
      '<div class="n' + (changed ? ' chg' : '') + '"><b>' + sv + '</b><span>' + servingsWord(sv, lang) + '</span>' +
      (changed ? '<span class="orig" data-act="servings0">' + T('original', { n: r.servings }) + '</span>' : '') + '</div>' +
      '<button class="b" data-act="servings+"' + (sv >= SERVINGS_MAX ? ' disabled' : '') + ' aria-label="' + T('more') + '">+</button>';
  }

  // Składniki: ilości przeliczone z oryginału, jednostki zawsze angielskie skróty (g, pcs, tbsp…), nazwy w bieżącym języku.
  function ingredientsHtml() {
    var list = V.L.ingredients, f = V.servings / V.r.servings, h = '', group = null;
    for (var i = 0; i < list.length; i++) {
      var x = list[i];
      if ((x.groupKey || null) !== group) { group = x.groupKey || null; if (group) h += '<div class="g">' + esc(x.group) + '</div>'; }
      h += '<div class="row"><div class="q' + (x.amount ? '' : ' none') + '">' + (x.amount ? esc(scaledAmount(x.amount, x.unit, f, lang)) + '<span class="u">' + esc(x.unit) + '</span>' : '—') +
        '</div><div class="nm">' + esc(x.name) + (x.note ? ' <span class="note">(' + esc(x.note) + ')</span>' : '') + '</div></div>';
    }
    return h;
  }

  function stepHtml(s, i, cur) {
    var h = '<div class="step' + (i === cur ? ' cur' : (i < cur ? ' past' : '')) + '" data-step="' + i + '"><div class="num">' + (i < cur ? '✓' : (i + 1)) +
      '</div><div class="body">' + esc(s.text);
    // Ustawienia TM6 jako jeden fioletowy chip („18:00 · Varoma · obroty 1"), temperatura w środku — łososiowy.
    if (s.tm6) {
      var t = s.tm6, parts = [tm6Time(t.duration_seconds)];
      if (t.temperature !== undefined) parts.push(t.temperature === 'Varoma' ? 'Varoma' : t.temperature + '°C');
      if (t.speed !== undefined) parts.push(T('speedShort') + ' ' + tm6Speed(t.speed, lang));
      if (t.reverse) parts.push(T('reverse'));
      if (s.tm6Mode) parts.push(s.tm6Mode);
      h += '<div><span class="schip tm">' + esc(parts.join(' · ')) + '</span></div>';
    }
    if (s.internal_temp_c !== undefined) h += '<div><span class="schip tin">🌡 ' + T('inside', { t: decimal(s.internal_temp_c, lang) }) + '</span></div>';
    return h + '</div></div>';
  }

  // Zmiana kroku: tylko klasy i numery kroków + panel TM6 — bez przerysowania ekranu i bez ruszania przewinięcia.
  function setStep(n) {
    if (V.screen !== 'recipe') return;
    V.step = n;
    var els = app.querySelectorAll('.step');
    for (var i = 0; i < els.length; i++) {
      els[i].className = 'step' + (i === n ? ' cur' : (i < n ? ' past' : ''));
      els[i].firstChild.innerHTML = i < n ? '✓' : String(i + 1);
    }
    // Panel TM6 pojawia się / znika (od v0.10). Zmienia się wysokość przypiętego paska, więc obszar treści przesuwa się
    // na ekranie — korygujemy przewinięcie tak, żeby dotknięty krok został w tym samym miejscu, a potem upewniamy się,
    // że jest cały widoczny (nie ucieka pod panel ani poza ekran).
    var tp = doc.getElementById('tm6-panel'), pin = doc.getElementById('pin'), el = els[n];
    if (tp && pin) {
      var y0 = el ? el.getBoundingClientRect().top : 0;
      pin.className = pinClass(V.r, n);
      tp.innerHTML = tm6Visible(V.r, n) ? tm6Panel(n) : '';
      if (el) {
        var box = stepBox();
        if (box) {
          box.scrollTop += el.getBoundingClientRect().top - y0;
          revealStep(box, el);
        }
      }
    }
    rememberRecipe();
    global.history.replaceState(global.history.state, '', recipeUrl(V.slug, n));
  }

  // Zmiana porcji: tylko licznik porcji, składniki i uwaga pod panelem Ninja.
  function setServings(n) {
    if (V.screen !== 'recipe') return;
    V.servings = clampServings(n);
    doc.getElementById('servings').innerHTML = servingsHtml();
    doc.getElementById('ingredients').innerHTML = ingredientsHtml();
    var note = doc.getElementById('servings-note');
    if (note) note.innerHTML = servingsNote();
    rememberRecipe();
  }

  // Podgląd zdjęcia na pełny ekran — nakładka, przepis pod spodem zostaje nietknięty.
  function showPhoto() {
    if (V.screen !== 'recipe' || !V.r.image || doc.getElementById('viewer')) return;
    var d = doc.createElement('div');
    d.id = 'viewer';
    d.setAttribute('data-act', 'close');
    d.innerHTML = '<div class="vbar"><h1>' + esc(V.L.title) + '</h1><button class="btn close" data-act="close">' + T('close') + '</button></div>' +
      '<div class="big"><img src="' + esc(V.r.image) + '" alt=""></div><div class="hint">' + T('photoHint') + '</div>';
    app.appendChild(d);
  }
  function closePhoto() {
    var v = doc.getElementById('viewer');
    if (v) v.parentNode.removeChild(v);
  }

  // Lista przepisów z błędem (kind 'problems', czerwona) albo bez pełnego tłumaczenia EN (kind 'warnings', pomarańczowa) —
  // nakładka nad listą (przewijana), zamykana przyciskiem. Przyczyny są z walidatora (po polsku, dla Janusza).
  function showProblems(kind) {
    var warn = kind === 'warnings', groups = warn ? notices : problems;
    if (!groups.length || doc.getElementById('problems')) return;
    var title = warn ? warningsLabel(groups.length, lang) : problemsLabel(groups.length, lang);
    var h = '<div class="pbar"><h1>' + esc(title) + '</h1><button class="close" data-act="close-problems">' + T('close') + '</button></div>' +
      '<div class="plist"><p class="pintro">' + T(warn ? 'warningsIntro' : 'problemsIntro') + '</p>';
    groups.forEach(function (g) {
      var stateText;
      if (warn) {
        // Co brakuje: tłumaczenie przepisu (path translations…), znacznik z grupy (path „tags"), tłumaczenie tagu (tags[i]).
        var parts = [];
        if (g.items.some(function (it) { return it.path.indexOf('translations') === 0; })) parts.push(T('warningFallback'));
        if (g.items.some(function (it) { return it.path === 'tags'; })) parts.push(T('warningBadge'));
        if (g.file !== 'tags.yml' && g.items.some(function (it) { return /^tags\[/.test(it.path); })) parts.push(T('warningTagsOnly'));
        stateText = parts.join(' ');
      } else stateText = g.skipped ? T('problemSkipped') : T('problemNoPhoto');
      h += '<div class="pfile"><div class="pname">recipes/' + esc(g.file) + '</div>' +
        (stateText ? '<div class="pstate' + (g.skipped ? ' skipped' : '') + '">' + stateText + '</div>' : '');
      g.items.forEach(function (it) {
        h += '<div class="pitem"><b>' + esc(it.where) + '</b>: ' + esc(it.reason) +
          (it.path && it.path !== it.where && it.path.charAt(0) !== '(' ? '<div class="ppath">' + esc(it.path) + '</div>' : '') + '</div>';
      });
      h += '</div>';
    });
    var d = doc.createElement('div');
    d.id = 'problems';
    if (warn) d.className = 'warn';
    d.innerHTML = h + '</div>';
    app.appendChild(d);
  }
  function closeProblems() {
    var p = doc.getElementById('problems');
    if (p) p.parentNode.removeChild(p);
  }

  // ═════ timer Ninja ═════
  // Stan timera jest w state.recipes[slug].timer (zapisywany od razu, przetrwa przeładowanie i powrót z tła).
  // Czas liczony z zapisanego startu i pauz, a tyknięcie co sekundę tylko odświeża ekran i sprawdza alarmy.

  function getTimer(slug) {
    var p = state.recipes[slug];
    return p && p.timer ? p.timer : null;
  }
  function setTimer(slug, t) {
    if (!state.recipes[slug]) return;
    if (t) state.recipes[slug].timer = t;
    else delete state.recipes[slug].timer;
    saveState();
  }
  function hasActiveTimer() {
    var now = Date.now();
    return Object.keys(state.recipes).some(function (s) {
      var st = timerStatus(getTimer(s), now);
      return st === 'running' || st === 'paused' || (st === 'done' && timerDue(getTimer(s), now));
    });
  }

  // Pasek w panelu Ninja pod strefami: [czynność / DUŻY licznik do najbliższej czynności] [strefa, stan, uwaga o alarmie] [przyciski]
  function timerBarHtml() {
    return '<div class="tstrip" id="ninja-timer"><div class="tl"><div class="act" id="timer-act"></div><div class="tclock" id="timer-clock"></div></div>' +
      '<div class="ti"><div class="w" id="timer-zone"></div><div class="nx" id="timer-state"></div><div class="nn">' + T('timerNote') + '</div></div>' +
      '<div class="tbtns" id="timer-btns"></div></div>';
  }

  var resetArmedUntil = 0;   // RESET wymaga drugiego dotknięcia w ciągu 3 s (przypadkowe dotknięcie w kuchni)

  function timerButtons(status) {
    var b = function (act, label, cls) { return '<button class="btn tbtn ' + cls + '" data-act="' + act + '">' + label + '</button>'; };
    var reset = b('timer-reset', Date.now() < resetArmedUntil ? T('sure') : T('reset'), 'reset' + (Date.now() < resetArmedUntil ? ' armed' : ''));
    if (status === 'idle') return b('timer-start', T('start'), 'go');
    if (status === 'running') return b('timer-pause', T('pause'), 'pause') + reset;
    if (status === 'paused') return b('timer-resume', T('resume'), 'go') + reset;
    return reset;
  }

  var STATUS_LABELS = { idle: 'statusIdle', running: 'statusRunning', paused: 'statusPaused' };

  // Odświeża tylko elementy paska timera i napisy obracania przy strefach — bez przerysowania ekranu.
  // Duży licznik = czas do NAJBLIŻSZEJ czynności (obrócenie / potrząśnięcie / koniec); pod nim „do końca".
  function updateTimerUI() {
    if (V.screen !== 'recipe' || !hasTurns(V.r.ninja)) return;
    var clockEl = doc.getElementById('timer-clock');
    if (!clockEl) return;
    var now = Date.now(), t = getTimer(V.slug), status = timerStatus(t, now);
    var plan = t ? t.plan : timerPlan(V.r.ninja, labelsEn()), elapsed = t ? timerElapsed(t, now) : 0;
    var target = timerTarget(plan, elapsed, t ? t.acked : []);
    // Po ostatniej czynności: sama kreska, bez napisu (końca pilnuje Ninja).
    var title = '', zones = [], soft = false;
    if (target) {
      title = groupTitle(target, status === 'idle' ? 'at' : 'in', lang);
      zones = groupZones(target, lang);
      soft = !target.events.some(function (e) { return e.required; });
    }
    clockEl.innerHTML = target ? clock(target.at - elapsed) : '—';
    doc.getElementById('timer-act').innerHTML = title ? esc(title) : '&nbsp;';
    doc.getElementById('timer-zone').innerHTML = zones.length ? esc(zones.join(' + ')) : '';
    var bar = doc.getElementById('ninja-timer');
    bar.className = 'tstrip ' + status + (soft ? ' soft' : '');
    doc.getElementById('timer-state').innerHTML = STATUS_LABELS[status] ? T(STATUS_LABELS[status]) : '';
    var btns = doc.getElementById('timer-btns'), key = lang + status + (now < resetArmedUntil ? '!' : '');
    if (btns.getAttribute('data-key') !== key) { btns.innerHTML = timerButtons(status); btns.setAttribute('data-key', key); }
    // Napisy przy strefach: po momencie obrócenia (albo po potwierdzeniu) przygaszone z „✓".
    [1, 2].forEach(function (no) {
      var el = doc.getElementById('turn' + no), z = V.r.ninja['zone' + no];
      if (!el || !z || !z.turn) return;
      var e = null;
      plan.events.forEach(function (x) { if (x.id === 'turn' + no) e = x; });
      var past = !!(t && e && (t.acked.indexOf(e.id) !== -1 || timerElapsed(t, now) >= e.at));
      var req = z.turn.required !== false;
      el.className = 'turn' + (req ? '' : ' info') + (past ? ' ok' : '');
      el.innerHTML = (past ? '✓ ' : (req ? '↻ ' : '')) + esc(turnText(z.turn));
    });
  }

  // Opisy szuflad z tłumaczenia EN — trafiają do planu timera, więc alarm na liście też je zna.
  function labelsEn() {
    var en = translationOf(V.r);
    return en && en.labels ? en.labels : null;
  }

  function timerAction(act) {
    if (V.screen !== 'recipe' || !hasTurns(V.r.ninja)) return;
    var slug = V.slug, t = getTimer(slug), now = Date.now();
    if (act === 'timer-start') { unlockAudio(); setTimer(slug, timerStart(timerPlan(V.r.ninja, labelsEn()), now)); }
    else if (act === 'timer-pause') setTimer(slug, timerPause(t, now));
    else if (act === 'timer-resume') { unlockAudio(); setTimer(slug, timerResume(t, now)); }
    else if (act === 'timer-reset') {
      if (now >= resetArmedUntil) {
        resetArmedUntil = now + 3000;
        global.setTimeout(updateTimerUI, 3100);
      } else {
        resetArmedUntil = 0;
        setTimer(slug, null);
        var a = doc.getElementById('alarm');
        if (a && a.getAttribute('data-slug') === slug) closeAlarm();
      }
    }
    updateTimerUI();
  }

  // ── dźwięk: Web Audio, odblokowany dotknięciem (iOS wymaga gestu); Safari 12 ma tylko webkitAudioContext ──
  var audioCtx = null;
  function unlockAudio() {
    try {
      if (!audioCtx) {
        var Ctx = global.AudioContext || global.webkitAudioContext;
        if (!Ctx) return;
        audioCtx = new Ctx();
        // Pusty dźwięk w trakcie gestu — po nim iOS pozwala grać także później (bez dotknięcia).
        var src = audioCtx.createBufferSource();
        src.buffer = audioCtx.createBuffer(1, 1, 22050);
        src.connect(audioCtx.destination);
        src.start(0);
      }
      if (audioCtx.state === 'suspended' && audioCtx.resume) audioCtx.resume();
    } catch (e) { audioCtx = null; }
  }
  // Krótki sygnał: trzy piknięcia. Zwraca false, gdy dźwięk niedostępny.
  function beep() {
    if (!audioCtx || (audioCtx.state && audioCtx.state !== 'running')) return false;
    try {
      var t0 = audioCtx.currentTime + 0.05, freq = 880;
      for (var i = 0; i < 3; i++) {
        var osc = audioCtx.createOscillator(), gain = audioCtx.createGain(), t = t0 + i * 0.3;
        osc.type = 'square';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.linearRampToValueAtTime(0.35, t + 0.02);
        gain.gain.linearRampToValueAtTime(0.0001, t + 0.2);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(t);
        osc.stop(t + 0.4);
      }
      return true;
    } catch (e) { return false; }
  }

  // ── alarmy: nakładka na całym ekranie (poza #app, więc przerysowanie widoku jej nie usuwa) ──
  var alarmBeepAt = 0, alarmShownAt = 0;
  // events — zdarzenia z tej samej chwili (np. obie strefy w MATCH): jeden komunikat.
  function showAlarm(slug, events) {
    var d = doc.createElement('div'), group = { at: events[0].at, events: events };
    var sound = beep();
    d.id = 'alarm';
    d.className = 'turn';
    d.setAttribute('data-slug', slug);
    d.setAttribute('data-events', events.map(function (e) { return e.id; }).join(','));
    // „OBRÓĆ / TERAZ" w pulsującym niebieskim kole; ostatnie słowo (teraz / now) w drugiej linii.
    var title = groupTitle(group, 'now', lang), cut = title.lastIndexOf(' ');
    d.innerHTML = '<div class="abox"><div class="halo"><div class="atitle' + (cut > 12 ? ' long' : '') + '">' + esc(title.slice(0, cut)) + '<br>' + esc(title.slice(cut + 1)) + '</div></div>' +
      groupZones(group, lang).map(function (z) { return '<div class="azone">' + esc(z) + '</div>'; }).join('') +
      '<div class="arecipe">' + esc(recipeTitle(slug)) + '</div>' +
      '<button class="aok" data-act="alarm-ok">' + T('done') + '</button>' +
      '<div class="ahint">' + T('alarmHint') + '</div>' +
      (sound ? '' : '<div class="asound">' + T('noSound') + '</div>') + '</div>';
    doc.body.appendChild(d);
    alarmShownAt = alarmBeepAt = Date.now();
  }
  function closeAlarm() {
    var a = doc.getElementById('alarm');
    if (a) a.parentNode.removeChild(a);
  }
  function ackAlarm() {
    var a = doc.getElementById('alarm');
    if (!a) return;
    var slug = a.getAttribute('data-slug'), ids = a.getAttribute('data-events').split(',');
    setTimer(slug, timerAck(getTimer(slug), ids, Date.now()));
    closeAlarm();
    tick(); // następny zaległy alarm od razu
  }

  // Co sekundę (i przy powrocie do aplikacji): odśwież timer, pokaż minione alarmy wszystkich timerów.
  function tick() {
    updateTimerUI();
    var now = Date.now(), a = doc.getElementById('alarm');
    if (a) {
      // Powtarzaj sygnał co 5 s przez minutę, dopóki nikt nie potwierdzi.
      if (now - alarmBeepAt >= 5000 && now - alarmShownAt < 60000) { alarmBeepAt = now; beep(); }
      return;
    }
    var slugs = Object.keys(state.recipes);
    for (var i = 0; i < slugs.length; i++) {
      var t = getTimer(slugs[i]), due = timerDue(t, now);
      if (!due) continue;
      if (due.events.length) { showAlarm(slugs[i], due.events); updateTimerUI(); return; }
    }
  }
  global.setInterval(tick, 1000);

  // iOS najpewniej odblokowuje dźwięk w touchend — tu też (START/WZNÓW albo dowolne dotknięcie przy aktywnym timerze).
  doc.addEventListener('touchend', function (e) {
    var t = e.target;
    while (t && t !== doc && !(t.getAttribute && t.getAttribute('data-act'))) t = t.parentNode;
    var a = t && t.getAttribute ? t.getAttribute('data-act') : null;
    if (a === 'timer-start' || a === 'timer-resume' || hasActiveTimer()) unlockAudio();
  });

  // ── nawigacja ──
  function slugFromUrl() {
    var m = /^\/p\/([a-z0-9-]+)\/?$/.exec(global.location.pathname);
    return m ? m[1] : null;
  }
  function stepFromUrl() {
    var m = /^#krok-(\d+)$/.exec(global.location.hash);
    return m ? parseInt(m[1], 10) - 1 : null;
  }

  function goToRecipe(slug) {
    closePhoto();
    closeProblems();
    var sc = app.querySelector('.scroll');
    if (V.screen === 'list' && sc) { state.list.scroll = sc.scrollTop; saveState(); }
    global.history.pushState({ fromList: true }, '', recipeUrl(slug, 0));
    openRecipe(slug, null);
  }
  function goBack() {
    closePhoto();
    // Weszliśmy z listy → zwykłe „wstecz" w historii; inaczej (start z /p/…) podmieniamy adres.
    if (global.history.state && global.history.state.fromList) { global.history.back(); return; }
    global.history.replaceState(null, '', '/');
    showList();
  }
  function routeFromUrl() {
    closePhoto();
    closeProblems();
    var slug = slugFromUrl();
    if (slug) openRecipe(slug, stepFromUrl());
    else showList();
  }

  doc.addEventListener('click', function (e) {
    // Po przeładowaniu dźwięk jest zablokowany do pierwszego dotknięcia — każde dotknięcie przy aktywnym timerze go odblokowuje.
    if (hasActiveTimer()) unlockAudio();
    var t = e.target;
    while (t && t !== doc) {
      if (t.getAttribute) {
        var a = t.getAttribute('data-act');
        if (a) {
          if (t.disabled) return;
          if (a.indexOf('timer-') === 0) { timerAction(a); return; }
          if (a === 'alarm-ok') { ackAlarm(); return; }
          if (a === 'lang') setLang(lang === 'pl' ? 'en' : 'pl');
          else if (a === 'back') goBack();
          else if (a === 'photo') showPhoto();
          else if (a === 'close') closePhoto();
          else if (a === 'problems') showProblems('problems');
          else if (a === 'warnings') showProblems('warnings');
          else if (a === 'close-problems') closeProblems();
          else if (a === 'servings+') setServings(V.servings + 1);
          else if (a === 'servings-') setServings(V.servings - 1);
          else if (a === 'servings0') setServings(V.r.servings);
          else if (a === 'retry-list') showList();
          else if (a === 'chip') setSearch(null, toggleChip(state.list.chips, t.getAttribute('data-chip') || null, badgeIndex(index)));
          else if (a === 'search-clear') setSearch('', null);
          else if (a === 'search-reset') setSearch('', []);
          else if (a === 'retry-recipe') openRecipe(V.slug, null);
          return;
        }
        if (t.getAttribute('data-open')) { goToRecipe(t.getAttribute('data-open')); return; }
        if (t.getAttribute('data-step')) { setStep(parseInt(t.getAttribute('data-step'), 10)); return; }
      }
      t = t.parentNode;
    }
  });

  // Wyszukiwarka: wpisywanie (bez przerysowania pola), Enter chowa klawiaturę.
  doc.addEventListener('input', function (e) {
    if (e.target && e.target.id === 'search-input') onSearchInput(e.target.value);
  });
  doc.addEventListener('keydown', function (e) {
    if (e.target && e.target.id === 'search-input' && (e.keyCode === 13 || e.key === 'Enter')) { e.preventDefault(); e.target.blur(); }
  });
  // Przewinięcie listy zapamiętane (po przeładowaniu Safari lista wraca w to samo miejsce). scroll nie bąbelkuje — faza capture.
  doc.addEventListener('scroll', function (e) {
    if (V.screen !== 'list' || !e.target || !e.target.className || String(e.target.className).indexOf('scroll') === -1) return;
    var el = e.target;
    global.clearTimeout(scrollTimer);
    scrollTimer = global.setTimeout(function () { state.list.scroll = el.scrollTop; saveState(); }, 300);
  }, true);

  global.addEventListener('popstate', routeFromUrl);

  // Powrót do strony bez przeładowania (iOS 12 bywa, że nie wykonuje kodu startowego):
  // odczytaj stan z localStorage i dociągnij do niego widok.
  function onReturn() {
    state = readState();
    var target = state.openRecipe;
    if (target) {
      if (V.slug !== target) { global.history.replaceState(null, '', recipeUrl(target, 0)); openRecipe(target, null); return; }
      var p = state.recipes[target];
      if (V.screen !== 'recipe' || !p) return;
      var servings = p.servings || V.r.servings;
      if (servings !== V.servings) setServings(servings);
      if (p.step !== V.step && p.step < V.r.steps.length) setStep(p.step);
      return;
    }
    if (V.screen === 'list' && index) {
      // Odśwież wyniki i kartę „Wróć do gotowania" bez przerysowania pola (klawiatura zostaje).
      var input = doc.getElementById('search-input');
      if (!input) { drawList(currentScroll()); return; }
      if (input.value !== state.list.query) input.value = state.list.query;
      updateResults(true);
    } else if (V.screen !== 'list') {
      global.history.replaceState(null, '', '/');
      showList();
    }
  }

  // Nowa publikacja? /version.json zawsze świeży (?t=czas). Inny build → przeładowanie pod adresem
  // z ?b=<nowy build> (nowy adres = iOS nie poda starej strony z pamięci). Przepis, krok i porcje
  // są już zapisane w localStorage, więc strona wraca w to samo miejsce.
  var checkingBuild = false;
  function checkBuild() {
    if (checkingBuild || !BUILD) return;
    checkingBuild = true;
    fetchJson('/version.json?t=' + Date.now(), function (d) {
      checkingBuild = false;
      var latest = d && typeof d.build === 'string' && /^[0-9a-f]+$/.test(d.build) ? d.build : null;
      if (!latest || latest === BUILD) return;
      // Bez pętli: jeśli już raz przeładowaliśmy do tego buildu, a serwer dalej daje starą stronę — czekamy.
      var tried = null;
      try { tried = global.localStorage.getItem(RELOAD_KEY); } catch (e) { /* brak pamięci */ }
      if (tried === latest || startQuery.indexOf('b=' + latest) !== -1) return;
      try { global.localStorage.setItem(RELOAD_KEY, latest); } catch (e) { /* brak pamięci */ }
      if (V.screen === 'recipe') rememberRecipe();
      global.location.replace(global.location.pathname + '?b=' + latest + global.location.hash);
    }, function () { checkingBuild = false; });
  }

  global.addEventListener('pageshow', function () { if (V.screen !== 'start') onReturn(); tick(); checkBuild(); });
  doc.addEventListener('visibilitychange', function () { if (doc.visibilityState === 'visible') { onReturn(); tick(); checkBuild(); } });

  // ── start ──
  // Adres /p/<slug>/ wygrywa; na „/" wracamy do ostatniego ekranu z pamięci (np. po otwarciu z ekranu początkowego).
  var startSlug = slugFromUrl();
  if (startSlug) openRecipe(startSlug, stepFromUrl());
  else if (state.openRecipe) { global.history.replaceState(null, '', recipeUrl(state.openRecipe, 0)); openRecipe(state.openRecipe, null); }
  else showList();
  tick();
  checkBuild();
})(this);
