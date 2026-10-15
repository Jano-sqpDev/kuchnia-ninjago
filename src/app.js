// Widok kuchenny (lista + strona przepisu) — według docs/mockup-ui-v1.html (z poprawkami opisanymi w CLAUDE.md).
// Safari 12 (iOS 12): świadomie ES5 + to, co Safari 12 ma na pewno; bez modułów, frameworków i npm.
// Zakazana składnia sprawdzana w tests/client.test.mjs, a build przepuszcza plik przez esbuild --target=safari12.
(function (global) {
  'use strict';

  var STATE_KEY = 'kitchen-state';
  var THEME_KEY = 'kitchen-theme';
  var RELOAD_KEY = 'kitchen-reload'; // build, do którego już raz przeładowaliśmy
  // Klucze sprzed v0.2.3 — przenoszone raz do nowych (migrateStorage), potem usuwane.
  var LEGACY_KEYS = { state: 'kuchnia-stan', theme: 'kuchnia-motyw', reload: 'kuchnia-przeladowanie' };
  var MAX_REMEMBERED = 30;   // ile przepisów pamięta krok i porcje
  var SERVINGS_MIN = 1, SERVINGS_MAX = 12;
  var SLUG_RE = /^[a-z0-9-]+$/;

  // ───────── czyste funkcje (testy: tests/client.test.mjs) ─────────

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // Odmiana po liczbie: plural(2, 'porcja', 'porcje', 'porcji') → 'porcje'
  function plural(n, one, few, many) {
    var d = n % 10, dd = n % 100;
    if (n === 1) return one;
    return d >= 2 && d <= 4 && (dd < 12 || dd > 14) ? few : many;
  }

  // 1 porcja, 2 porcje, 5 porcji, 22 porcje
  function servingsWord(n) { return plural(n, 'porcja', 'porcje', 'porcji'); }

  // Plakietka na liście: „1 przepis z błędem", „3 przepisy z błędem", „5 przepisów z błędem".
  function problemsLabel(n) { return n + ' ' + plural(n, 'przepis', 'przepisy', 'przepisów') + ' z błędem'; }

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

  // 1.5 → „1,5"
  function decimal(v) {
    return String(Math.round(v * 100) / 100).replace('.', ',');
  }

  // 2.5 → „2½", 0.5 → „½" (tylko dla wielokrotności 0,5)
  function halves(v) {
    var w = Math.floor(v);
    return v === w ? String(w) : (w ? String(w) : '') + '½';
  }

  function isPiecesOrSpoons(unit) { return /^(szt|łyż)/.test(unit); }

  // Ilość składnika po przeliczeniu porcji (f = nowe porcje / porcje z przepisu).
  // Sztuki i łyżki do połówek, g/ml do okrągłych wartości, reszta do jednego miejsca po przecinku.
  function scaledAmount(amount, unit, f) {
    if (f === 1) return isPiecesOrSpoons(unit) && amount * 2 === Math.round(amount * 2) ? halves(amount) : decimal(amount);
    var v = amount * f;
    if (isPiecesOrSpoons(unit)) {
      var h = Math.round(v * 2) / 2;
      return halves(h < 0.5 ? 0.5 : h);
    }
    if (unit === 'g' || unit === 'ml') {
      var step = v < 20 ? 1 : (v < 100 ? 5 : (v < 500 ? 10 : 25));
      var r = Math.round(v / step) * step;
      return r > 0 ? String(r) : decimal(Math.round(v * 10) / 10 || 0.1);
    }
    return decimal(Math.round(v * 10) / 10 || 0.1);
  }

  // 300 → „5:00"
  function tm6Time(seconds) {
    var m = Math.floor(seconds / 60), s = seconds % 60;
    return m + ':' + (s < 10 ? '0' : '') + s;
  }

  function tm6Speed(speed) {
    if (speed === 'spoon') return 'łyżka';
    if (speed === 'turbo') return 'Turbo';
    return decimal(speed);
  }

  function hasTm6(r) {
    for (var i = 0; i < r.steps.length; i++) if (r.steps[i].tm6) return true;
    return false;
  }

  function clampServings(n) { return Math.max(SERVINGS_MIN, Math.min(SERVINGS_MAX, n)); }

  // Stan z localStorage — każde pole sprawdzone, bo zapis mógł pochodzić ze starszej wersji.
  // openRecipe: slug otwartego przepisu albo null (lista).
  function normalizeState(s) {
    var out = { openRecipe: null, recipes: {} };
    if (!s || typeof s !== 'object') return out;
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
      });
    }
    return out;
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
    servingsWord: servingsWord, problemsLabel: problemsLabel, groupProblems: groupProblems, scaledAmount: scaledAmount, tm6Time: tm6Time, tm6Speed: tm6Speed,
    normalizeState: normalizeState, migrateLegacyState: migrateLegacyState, esc: esc,
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
  // otwartego przepisu, kroku, porcji i motywu. Stare klucze usuwane dopiero po udanym zapisie nowych.
  function migrateStorage() {
    try {
      var store = global.localStorage;
      var oldState = store.getItem(LEGACY_KEYS.state);
      if (oldState !== null && store.getItem(STATE_KEY) === null) {
        store.setItem(STATE_KEY, JSON.stringify(migrateLegacyState(JSON.parse(oldState))));
      }
      var oldTheme = store.getItem(LEGACY_KEYS.theme);
      if (oldTheme !== null && store.getItem(THEME_KEY) === null) store.setItem(THEME_KEY, oldTheme);
      var oldReload = store.getItem(LEGACY_KEYS.reload);
      if (oldReload !== null && store.getItem(RELOAD_KEY) === null) store.setItem(RELOAD_KEY, oldReload);
      store.removeItem(LEGACY_KEYS.state);
      store.removeItem(LEGACY_KEYS.theme);
      store.removeItem(LEGACY_KEYS.reload);
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

  // ── motyw jasny/ciemny ──
  var theme = 'dark';
  try { if (global.localStorage.getItem(THEME_KEY) === 'light') theme = 'light'; } catch (e) { /* domyślnie ciemny */ }
  function setTheme(m) {
    theme = m;
    html.className = html.className.replace(/(^|\s)light(\s|$)/g, ' ').replace(/^\s+|\s+$/g, '') + (m === 'light' ? ' light' : '');
    var b = doc.querySelectorAll('[data-act="theme"]');
    for (var i = 0; i < b.length; i++) b[i].innerHTML = themeGlyph();
    try { global.localStorage.setItem(THEME_KEY, m); } catch (e) { /* nie szkodzi */ }
  }
  function themeGlyph() { return theme === 'dark' ? '☀︎' : '☾'; }
  function themeButton() { return '<button class="btn" data-act="theme" aria-label="Jasny / ciemny">' + themeGlyph() + '</button>'; }
  setTheme(theme);

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
  // V.screen: 'start' | 'list' | 'loading' | 'error' | 'recipe'
  var V = { screen: 'start', slug: null, r: null, step: 0, servings: 0 };
  var index = null;            // search.json (lista)
  var recipeCache = {};        // pobrane data/<slug>.json
  var problems = [];           // errors.json pogrupowane po plikach (przepisy pominięte przez build)
  var listScroll = 0;          // żeby „‹ Przepisy" wracało w to samo miejsce listy

  function render(h, scroll) {
    app.innerHTML = h;
    var sc = app.querySelector('.scroll');
    if (sc) sc.scrollTop = scroll || 0;
  }

  function listBar() {
    return '<div class="bar"><h1>Przepisy</h1>' + themeButton() + '</div>';
  }

  function photo(src, cls, caption) {
    if (!src) return '<div class="ph none ' + cls + '"><div class="em">🍽</div>' + (caption ? '<div class="cap">brak zdjęcia</div>' : '') + '</div>';
    return '<div class="ph ' + cls + '"><img src="' + esc(src) + '" alt=""></div>';
  }

  function deviceBadges(tags) {
    var h = '';
    if (tags.indexOf('ninja') !== -1) h += '<span class="dev ninja">NINJA</span>';
    if (tags.indexOf('tm6') !== -1) h += '<span class="dev tm6">TM6</span>';
    return h;
  }

  // ═════ lista ═════
  function showList(scroll) {
    V = { screen: 'list', slug: null, r: null, step: 0, servings: 0 };
    state.openRecipe = null;
    saveState();
    if (!index) {
      render(listBar() + '<div class="scroll"><div class="loading">Wczytywanie…</div></div>');
      // Lista błędów jest dodatkiem: gdy się nie wczyta, lista przepisów i tak działa.
      fetchJson('/errors.json?b=' + BUILD, function (d) {
        problems = groupProblems(d);
        if (V.screen === 'list' && index && problems.length) drawList(currentScroll());
      }, function () { /* brak errors.json — bez plakietki */ });
      fetchJson('/search.json?b=' + BUILD, function (d) {
        index = d;
        if (V.screen === 'list') drawList(0);
      }, function () {
        if (V.screen === 'list') render(listBar() + '<div class="scroll"><div class="err" data-act="retry-list"><b>Nie udało się wczytać przepisów.</b><br><br>Sprawdź Wi-Fi i dotknij, żeby spróbować ponownie.</div></div>');
      });
      return;
    }
    drawList(scroll === undefined ? listScroll : scroll);
  }

  function currentScroll() {
    var sc = app.querySelector('.scroll');
    return sc ? sc.scrollTop : 0;
  }

  // Czerwona plakietka „N przepisów z błędem" — dotknięcie pokazuje listę błędów.
  function problemsBadge() {
    if (!problems.length) return '';
    return '<button class="problems-badge" data-act="problems">⚠ ' + esc(problemsLabel(problems.length)) +
      '<span class="more">Pokaż ›</span></button>';
  }

  function drawList(scroll) {
    if (!index.length) {
      render(listBar() + '<div class="scroll">' + problemsBadge() +
        '<div class="empty">Nie ma jeszcze przepisów.<br><br>Dodaj pierwszy: plik w recipes/ na GitHubie albo przez Claude Code („dodaj do przepisów”).</div></div>');
      return;
    }
    var h = listBar() + '<div class="scroll">' + problemsBadge();
    // Miejsce na wyszukiwarkę (Etap 4).
    h += '<div class="search"><div class="box">Szukaj: nazwa, składnik, tag… (wkrótce)</div></div>';
    h += resumeCard();
    h += '<div class="grid">';
    for (var i = 0; i < index.length; i++) {
      var it = index[i], min = it.prep_minutes + it.cook_minutes;
      h += '<div class="card" data-open="' + esc(it.id) + '">' + photo(it.thumb, 'thumb', false) +
        '<div class="txt"><h3>' + esc(it.title) + '</h3><div class="meta">' + (min ? min + ' min' : 'bez gotowania') +
        ' · ' + it.servings + ' ' + servingsWord(it.servings) + '</div><div class="devs">' + deviceBadges(it.tags) + '</div></div></div>';
    }
    render(h + '</div></div>', scroll);
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
    return '<div class="resume" data-open="' + esc(latest) + '"><div class="t"><div class="k">Wróć do gotowania</div><div class="n">' +
      esc(p.title) + ' — krok ' + (p.step + 1) + ' z ' + p.steps + '</div></div><span class="btn">Otwórz ›</span></div>';
  }

  // ═════ przepis ═════
  // Adres kroku #krok-N (N od 1) — opisany w CLAUDE.md.
  function recipeUrl(slug, step) { return '/p/' + slug + '/' + (step > 0 ? '#krok-' + (step + 1) : ''); }

  function openRecipe(slug, urlStep) {
    V = { screen: 'loading', slug: slug, r: null, step: 0, servings: 0 };
    state.openRecipe = slug;
    saveState();
    var r = recipeCache[slug];
    if (r) { drawRecipe(r, urlStep); return; }
    render('<div class="bar"><button class="btn back" data-act="back">‹ Przepisy</button><h1></h1>' + themeButton() +
      '</div><div class="scroll"><div class="loading">Wczytywanie…</div></div>');
    fetchJson('/data/' + slug + '.json?b=' + BUILD, function (d) {
      recipeCache[slug] = d;
      if (V.slug === slug) drawRecipe(d, urlStep);
    }, function (status) {
      if (V.slug !== slug) return;
      V.screen = 'error';
      var msg = status === 404
        ? '<b>Nie ma takiego przepisu.</b><br><br>Mógł zostać usunięty albo zmienić nazwę. Wróć do listy.'
        : '<b>Nie udało się wczytać przepisu.</b><br><br>Sprawdź Wi-Fi i dotknij, żeby spróbować ponownie.';
      if (status === 404) {
        delete state.recipes[slug];
        state.openRecipe = null;
        saveState();
      }
      render('<div class="bar"><button class="btn back" data-act="back">‹ Przepisy</button><h1></h1>' + themeButton() +
        '</div><div class="scroll"><div class="err"' + (status === 404 ? '' : ' data-act="retry-recipe"') + '>' + msg + '</div></div>');
    });
  }

  function drawRecipe(r, urlStep) {
    var p = state.recipes[r.id];
    var step = urlStep !== null && urlStep !== undefined ? urlStep : (p ? p.step : 0);
    if (step >= r.steps.length) step = 0;
    V = { screen: 'recipe', slug: r.id, r: r, step: step, servings: p && p.servings ? p.servings : r.servings };
    rememberRecipe();
    global.history.replaceState(global.history.state, '', recipeUrl(r.id, step));

    var h = '<div class="bar"><button class="btn back" data-act="back">‹ Przepisy</button><h1>' + esc(r.title) + '</h1>' +
      themeButton() + '</div>';

    var tm6 = hasTm6(r);
    if (r.ninja || tm6) {
      h += '<div class="pin">';
      if (r.ninja) h += ninjaPanel(r.ninja) + '<div id="servings-note">' + servingsNote() + '</div>';
      if (tm6) h += '<div id="tm6-panel">' + tm6Panel(r, step) + '</div>';
      h += '</div>';
    }

    h += '<div class="scroll"><div class="hero"><div class="info"><div class="head"><span class="serv" id="servings">' + servingsHtml() + '</span>' +
      '<span class="times">przygotowanie <b>' + r.prep_minutes + ' min</b><span class="sep">·</span>' +
      (r.cook_minutes ? 'gotowanie <b>' + r.cook_minutes + ' min</b>' : 'bez gotowania') + '</span></div>';
    h += '<div class="tags">';
    for (var i = 0; i < r.tags.length; i++) h += '<span class="tag">#' + esc(r.tags[i]) + '</span>';
    h += '</div>' + (r.description ? '<div class="desc">' + esc(r.description) + '</div>' : '') + '</div>';
    h += r.image
      ? '<div class="pic-wrap" data-act="photo"><div class="ph pic"><img src="' + esc(r.image) + '" alt=""><div class="zoom">⤢ Powiększ</div></div></div>'
      : '<div class="pic-wrap">' + photo(null, 'pic', true) + '</div>';
    h += '</div>';

    h += '<div class="cols"><div class="col c-ing"><h2>Składniki</h2><div class="ing" id="ingredients">' + ingredientsHtml() + '</div></div>';
    h += '<div class="col c-steps"><h2>Kroki</h2>';
    for (i = 0; i < r.steps.length; i++) h += stepHtml(r.steps[i], i, step);
    h += '</div></div>';
    if (r.notes) h += '<div class="notes"><h2>Notatki</h2><div class="txt">' + esc(r.notes) + '</div></div>';
    h += '</div>';

    render(h, 0);
    // Po powrocie do przepisu (np. po przeładowaniu Safari) pokaż bieżący krok.
    if (step > 0) scrollToStep(step);
  }

  function scrollToStep(n) {
    var sc = app.querySelector('.scroll');
    var el = app.querySelectorAll('.step')[n];
    if (sc && el) sc.scrollTop = Math.max(0, el.offsetTop - 16);
  }

  function rememberRecipe() {
    var r = V.r;
    state.openRecipe = r.id;
    state.recipes[r.id] = {
      step: V.step, servings: V.servings === r.servings ? null : V.servings,
      title: r.title, steps: r.steps.length, t: Date.now(),
    };
    saveState();
  }

  function ninjaPanel(n) {
    function zone(no, z) {
      return '<div class="zone"><div class="zh"><b>' + no + '</b>Strefa ' + no + '</div>' + (z.label ? '<div class="lbl">' + esc(z.label) + '</div>' : '') +
        '<div class="fn">' + esc(z['function']) + '</div><div class="vals"><span class="big">' + z.temp_c + '</span><span class="unit">°C</span>' +
        '<span class="big">' + z.minutes + '</span><span class="unit">min</span></div></div>';
    }
    if (n.mode === 'single') return '<div class="npanel single">' + zone(1, n.zone1) + '</div>';
    var label = { sync: ['SYNC', 'kończą<br>razem'], match: ['MATCH', 'te same<br>ustawienia'], independent: ['OSOBNO', 'niezależne<br>strefy'] }[n.mode];
    return '<div class="npanel">' + zone(1, n.zone1) + '<div class="mode"><span class="pill">' + label[0] + '</span><div class="hint">' + label[1] + '</div></div>' +
      zone(2, n.zone2) + '</div>';
  }

  function servingsNote() {
    var r = V.r;
    if (!r.ninja || V.servings === r.servings) return '';
    return '<div class="scaled">Ustawienia Ninja są dla ' + r.servings + ' porcji. ' + (V.servings > r.servings
      ? 'Przy większej ilości sprawdź, czy jedzenie mieści się w szufladach.'
      : 'Przy mniejszej ilości sprawdzaj wcześniej — może być gotowe szybciej.') + '</div>';
  }

  // Panel TM6: ustawienia BIEŻĄCEGO kroku. Krok bez TM6 → puste, wyszarzone tarcze (ta sama wysokość, ekran nie skacze).
  function tm6Panel(r, cur) {
    function dial(v, u, label, off, small) {
      return '<div class="dial' + (off ? ' off' : '') + '"><div class="ring"><div class="v' + (small ? ' sm' : '') + '">' + v + '</div>' +
        (u ? '<div class="u">' + u + '</div>' : '') + '</div><div class="dl">' + label + '</div></div>';
    }
    var t = r.steps[cur] && r.steps[cur].tm6;
    if (!t) {
      return '<div class="tpanel"><div class="th"><span class="tk">TM6</span>Ten krok bez TM6</div><div class="dials">' +
        dial('—', '', 'Czas', true) + dial('—', '', 'Temperatura', true) + dial('—', '', 'Obroty', true) + '</div></div>';
    }
    var temp = t.temperature === undefined ? dial('—', 'bez grzania', 'Temperatura', true)
      : (t.temperature === 'Varoma' ? dial('Varoma', '', 'Temperatura', false, true) : dial(t.temperature, '°C', 'Temperatura'));
    var speed = t.speed === undefined ? dial('—', '', 'Obroty', true)
      : dial(tm6Speed(t.speed), t.reverse ? '↺ wsteczne' : '', 'Obroty', false, typeof t.speed !== 'number');
    return '<div class="tpanel"><div class="th"><span class="tk">TM6</span>Krok <b>' + (cur + 1) + '</b> z ' + r.steps.length +
      (t.mode ? '<span class="tmode">' + esc(t.mode) + '</span>' : '') + '</div><div class="dials">' +
      dial(tm6Time(t.duration_seconds), 'min:s', 'Czas') + temp + speed + '</div></div>';
  }

  function servingsHtml() {
    var r = V.r, sv = V.servings, changed = sv !== r.servings;
    return '<button class="sb" data-act="servings-"' + (sv <= SERVINGS_MIN ? ' disabled' : '') + ' aria-label="Mniej porcji">−</button>' +
      '<span class="sn' + (changed ? ' chg' : '') + '"><b>' + sv + '</b> ' + servingsWord(sv) +
      (changed ? '<span class="orig" data-act="servings0">przepis: ' + r.servings + '</span>' : '') + '</span>' +
      '<button class="sb" data-act="servings+"' + (sv >= SERVINGS_MAX ? ' disabled' : '') + ' aria-label="Więcej porcji">+</button>';
  }

  function ingredientsHtml() {
    var r = V.r, f = V.servings / r.servings, h = '', group = null;
    for (var i = 0; i < r.ingredients.length; i++) {
      var x = r.ingredients[i];
      if ((x.group || null) !== group) { group = x.group || null; if (group) h += '<div class="g">' + esc(group) + '</div>'; }
      h += '<div class="row"><div class="q' + (x.amount ? '' : ' none') + '">' + (x.amount ? esc(scaledAmount(x.amount, x.unit, f)) + ' ' + esc(x.unit) : '—') +
        '</div><div class="nm">' + esc(x.name) + (x.note ? ' <span class="note">(' + esc(x.note) + ')</span>' : '') + '</div></div>';
    }
    return h;
  }

  function stepHtml(s, i, cur) {
    var h = '<div class="step' + (i === cur ? ' cur' : (i < cur ? ' past' : '')) + '" data-step="' + i + '"><div class="num">' + (i < cur ? '✓' : (i + 1)) +
      '</div><div class="body">' + esc(s.text);
    if (s.tm6) {
      var t = s.tm6;
      h += '<div class="tm6row"><span class="tm k">TM6</span><span class="tm">⏱ ' + tm6Time(t.duration_seconds) + '</span>' +
        (t.temperature !== undefined ? '<span class="tm">🌡 ' + (t.temperature === 'Varoma' ? 'Varoma' : t.temperature + '°C') + '</span>' : '') +
        (t.speed !== undefined ? '<span class="tm">⟳ ' + esc(tm6Speed(t.speed)) + '</span>' : '') + (t.reverse ? '<span class="tm">↺ wsteczne</span>' : '') +
        (t.mode ? '<span class="tm">' + esc(t.mode) + '</span>' : '') + '</div>';
    }
    if (s.internal_temp_c !== undefined) h += '<div class="temp-in">🌡 ' + decimal(s.internal_temp_c) + '°C w środku</div>';
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
    var tp = doc.getElementById('tm6-panel');
    if (tp) tp.innerHTML = tm6Panel(V.r, n);
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
    d.innerHTML = '<div class="vbar"><h1>' + esc(V.r.title) + '</h1><button class="close" data-act="close">✕ Zamknij</button></div>' +
      '<div class="big"><img src="' + esc(V.r.image) + '" alt=""></div><div class="hint">Dotknij w dowolnym miejscu, żeby wrócić do przepisu</div>';
    app.appendChild(d);
  }
  function closePhoto() {
    var v = doc.getElementById('viewer');
    if (v) v.parentNode.removeChild(v);
  }

  // Lista przepisów z błędem — nakładka nad listą (przewijana), zamykana przyciskiem.
  function showProblems() {
    if (!problems.length || doc.getElementById('problems')) return;
    var h = '<div class="pbar"><h1>' + esc(problemsLabel(problems.length)) + '</h1><button class="close" data-act="close-problems">✕ Zamknij</button></div>' +
      '<div class="plist"><p class="pintro">Te pliki w repo mają błędy. Popraw je na GitHubie (albo poproś o to Claude / Codex) — po publikacji plakietka zniknie.</p>';
    problems.forEach(function (g) {
      h += '<div class="pfile"><div class="pname">recipes/' + esc(g.file) + '</div><div class="pstate' + (g.skipped ? ' skipped' : '') + '">' +
        (g.skipped ? 'Przepisu nie ma na liście, dopóki błąd nie zostanie poprawiony.' : 'Przepis jest na liście, ale bez zdjęcia.') + '</div>';
      g.items.forEach(function (it) {
        h += '<div class="pitem"><b>' + esc(it.where) + '</b>: ' + esc(it.reason) +
          (it.path && it.path !== it.where && it.path.charAt(0) !== '(' ? '<div class="ppath">'+ esc(it.path) + '</div>' : '') + '</div>';
      });
      h += '</div>';
    });
    var d = doc.createElement('div');
    d.id = 'problems';
    d.innerHTML = h + '</div>';
    app.appendChild(d);
  }
  function closeProblems() {
    var p = doc.getElementById('problems');
    if (p) p.parentNode.removeChild(p);
  }

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
    listScroll = V.screen === 'list' && sc ? sc.scrollTop : 0;
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
    var t = e.target;
    while (t && t !== doc) {
      if (t.getAttribute) {
        var a = t.getAttribute('data-act');
        if (a) {
          if (t.disabled) return;
          if (a === 'theme') setTheme(theme === 'dark' ? 'light' : 'dark');
          else if (a === 'back') goBack();
          else if (a === 'photo') showPhoto();
          else if (a === 'close') closePhoto();
          else if (a === 'problems') showProblems();
          else if (a === 'close-problems') closeProblems();
          else if (a === 'servings+') setServings(V.servings + 1);
          else if (a === 'servings-') setServings(V.servings - 1);
          else if (a === 'servings0') setServings(V.r.servings);
          else if (a === 'retry-list') showList();
          else if (a === 'retry-recipe') openRecipe(V.slug, null);
          return;
        }
        if (t.getAttribute('data-open')) { goToRecipe(t.getAttribute('data-open')); return; }
        if (t.getAttribute('data-step')) { setStep(parseInt(t.getAttribute('data-step'), 10)); return; }
      }
      t = t.parentNode;
    }
  });

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
      var sc = app.querySelector('.scroll');
      drawList(sc ? sc.scrollTop : 0); // odśwież kartę „Wróć do gotowania"
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

  global.addEventListener('pageshow', function () { if (V.screen !== 'start') onReturn(); checkBuild(); });
  doc.addEventListener('visibilitychange', function () { if (doc.visibilityState === 'visible') { onReturn(); checkBuild(); } });

  // ── start ──
  // Adres /p/<slug>/ wygrywa; na „/" wracamy do ostatniego ekranu z pamięci (np. po otwarciu z ekranu początkowego).
  var startSlug = slugFromUrl();
  if (startSlug) openRecipe(startSlug, stepFromUrl());
  else if (state.openRecipe) { global.history.replaceState(null, '', recipeUrl(state.openRecipe, 0)); openRecipe(state.openRecipe, null); }
  else showList();
  checkBuild();
})(this);
