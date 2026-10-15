// Widok kuchenny (lista + strona przepisu) — według docs/mockup-ui-v1.html.
// Safari 12 (iOS 12): świadomie ES5 + to, co Safari 12 ma na pewno; bez modułów, frameworków i npm.
// Zakazana składnia sprawdzana w tests/klient.test.mjs, a build przepuszcza plik przez esbuild --target=safari12.
(function (global) {
  'use strict';

  var KLUCZ_STANU = 'kuchnia-stan';
  var KLUCZ_MOTYWU = 'kuchnia-motyw';
  var MAX_PAMIETANYCH = 30;   // ile przepisów pamięta krok i porcje
  var PORCJE_MIN = 1, PORCJE_MAX = 12;

  // ───────── czyste funkcje (testy: tests/klient.test.mjs) ─────────

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // 1 porcja, 2 porcje, 5 porcji, 22 porcje
  function porcjeSlowo(n) {
    var d = n % 10, dd = n % 100;
    if (n === 1) return 'porcja';
    return d >= 2 && d <= 4 && (dd < 12 || dd > 14) ? 'porcje' : 'porcji';
  }

  // 1.5 → „1,5"
  function dziesietna(v) {
    return String(Math.round(v * 100) / 100).replace('.', ',');
  }

  // 2.5 → „2½", 0.5 → „½" (tylko dla wielokrotności 0,5)
  function polowki(v) {
    var w = Math.floor(v);
    return v === w ? String(w) : (w ? String(w) : '') + '½';
  }

  function sztukiLubLyzki(unit) { return /^(szt|łyż)/.test(unit); }

  // Ilość składnika po przeliczeniu porcji (f = nowe porcje / porcje z przepisu).
  // Sztuki i łyżki do połówek, g/ml do okrągłych wartości, reszta do jednego miejsca po przecinku.
  function ilosc(amount, unit, f) {
    if (f === 1) return sztukiLubLyzki(unit) && amount * 2 === Math.round(amount * 2) ? polowki(amount) : dziesietna(amount);
    var v = amount * f;
    if (sztukiLubLyzki(unit)) {
      var h = Math.round(v * 2) / 2;
      return polowki(h < 0.5 ? 0.5 : h);
    }
    if (unit === 'g' || unit === 'ml') {
      var krok = v < 20 ? 1 : (v < 100 ? 5 : (v < 500 ? 10 : 25));
      var r = Math.round(v / krok) * krok;
      return r > 0 ? String(r) : dziesietna(Math.round(v * 10) / 10 || 0.1);
    }
    return dziesietna(Math.round(v * 10) / 10 || 0.1);
  }

  // 300 → „5:00"
  function czasTm6(sekundy) {
    var m = Math.floor(sekundy / 60), s = sekundy % 60;
    return m + ':' + (s < 10 ? '0' : '') + s;
  }

  function obrotyTm6(speed) {
    if (speed === 'spoon') return 'łyżka';
    if (speed === 'turbo') return 'Turbo';
    return dziesietna(speed);
  }


  function maTm6(r) {
    for (var i = 0; i < r.steps.length; i++) if (r.steps[i].tm6) return true;
    return false;
  }

  function ograniczPorcje(n) { return Math.max(PORCJE_MIN, Math.min(PORCJE_MAX, n)); }

  // Stan z localStorage — każde pole sprawdzone, bo zapis mógł pochodzić ze starszej wersji.
  function poprawStan(s) {
    var wynik = { ekran: 'lista', przepisy: {} };
    if (!s || typeof s !== 'object') return wynik;
    if (typeof s.ekran === 'string' && /^[a-z0-9-]+$/.test(s.ekran)) wynik.ekran = s.ekran;
    if (s.przepisy && typeof s.przepisy === 'object') {
      Object.keys(s.przepisy).forEach(function (slug) {
        var p = s.przepisy[slug];
        if (!p || typeof p !== 'object' || !/^[a-z0-9-]+$/.test(slug)) return;
        wynik.przepisy[slug] = {
          krok: typeof p.krok === 'number' && p.krok >= 0 ? Math.floor(p.krok) : 0,
          porcje: typeof p.porcje === 'number' ? ograniczPorcje(Math.floor(p.porcje)) : null,
          tytul: typeof p.tytul === 'string' ? p.tytul : '',
          krokow: typeof p.krokow === 'number' ? p.krokow : 0,
          t: typeof p.t === 'number' ? p.t : 0,
        };
      });
    }
    return wynik;
  }

  var api = {
    porcjeSlowo: porcjeSlowo, ilosc: ilosc, czasTm6: czasTm6, obrotyTm6: obrotyTm6,
    poprawStan: poprawStan, esc: esc,
  };
  // Testy w Node uruchamiają ten plik bez przeglądarki — dostają tylko czyste funkcje.
  if (!global.document) { global.kuchniaTest = api; return; }

  // ───────── przeglądarka ─────────

  var doc = global.document;
  var html = doc.documentElement;
  var app = doc.getElementById('app');

  if (global.navigator.standalone) html.className += ' standalone';

  // ── pamięć (localStorage zawsze w try/catch) ──
  function czytajStan() {
    try { return poprawStan(JSON.parse(global.localStorage.getItem(KLUCZ_STANU) || 'null')); } catch (e) { return poprawStan(null); }
  }
  function zapiszStan() {
    var slugi = Object.keys(stan.przepisy);
    if (slugi.length > MAX_PAMIETANYCH) {
      slugi.sort(function (a, b) { return stan.przepisy[b].t - stan.przepisy[a].t; });
      slugi.slice(MAX_PAMIETANYCH).forEach(function (s) { delete stan.przepisy[s]; });
    }
    try { global.localStorage.setItem(KLUCZ_STANU, JSON.stringify(stan)); } catch (e) { /* tryb prywatny / brak miejsca */ }
  }
  var stan = czytajStan();

  // ── motyw jasny/ciemny ──
  var motyw = 'dark';
  try { if (global.localStorage.getItem(KLUCZ_MOTYWU) === 'light') motyw = 'light'; } catch (e) { /* domyślnie ciemny */ }
  function ustawMotyw(m) {
    motyw = m;
    html.className = html.className.replace(/(^|\s)light(\s|$)/g, ' ').replace(/^\s+|\s+$/g, '') + (m === 'light' ? ' light' : '');
    var b = doc.querySelectorAll('[data-act="motyw"]');
    for (var i = 0; i < b.length; i++) b[i].innerHTML = przyciskMotywuZnak();
    try { global.localStorage.setItem(KLUCZ_MOTYWU, m); } catch (e) { /* nie szkodzi */ }
  }
  function przyciskMotywuZnak() { return motyw === 'dark' ? '☀︎' : '☾'; }
  function przyciskMotywu() { return '<button class="btn" data-act="motyw" aria-label="Jasny / ciemny">' + przyciskMotywuZnak() + '</button>'; }
  ustawMotyw(motyw);

  // ── pobieranie JSON ──
  function pobierz(url, ok, blad) {
    var x = new XMLHttpRequest();
    x.open('GET', url, true);
    x.onreadystatechange = function () {
      if (x.readyState !== 4) return;
      if (x.status !== 200) { blad(x.status); return; }
      var dane;
      try { dane = JSON.parse(x.responseText); } catch (e) { blad(0); return; }
      ok(dane);
    };
    x.send();
  }

  // ── widok ──
  // V = to, co jest teraz na ekranie. Pamięć (stan) zapisujemy od razu przy każdej zmianie.
  var V = { ekran: 'start', slug: null, r: null, krok: 0, porcje: 0 };
  var indeks = null;           // search.json (lista)
  var przepisy = {};           // pobrane data/<slug>.json
  var przewiniecieListy = 0;   // żeby „‹ Przepisy" wracało w to samo miejsce listy

  function pokaz(h, przewiniecie) {
    app.innerHTML = h;
    var sc = app.querySelector('.scroll');
    if (sc) sc.scrollTop = przewiniecie || 0;
  }

  function pasekListy() {
    return '<div class="bar"><h1>Przepisy</h1>' + przyciskMotywu() + '</div>';
  }

  function zdjecie(src, cls, podpis) {
    if (!src) return '<div class="ph none ' + cls + '"><div class="em">🍽</div>' + (podpis ? '<div class="cap">brak zdjęcia</div>' : '') + '</div>';
    return '<div class="ph ' + cls + '"><img src="' + esc(src) + '" alt=""></div>';
  }

  function znaczkiUrzadzen(tags) {
    var h = '';
    if (tags.indexOf('ninja') !== -1) h += '<span class="dev ninja">NINJA</span>';
    if (tags.indexOf('tm6') !== -1) h += '<span class="dev tm6">TM6</span>';
    return h;
  }

  // ═════ lista ═════
  function pokazListe(przewiniecie) {
    V = { ekran: 'lista', slug: null, r: null, krok: 0, porcje: 0 };
    stan.ekran = 'lista';
    zapiszStan();
    if (!indeks) {
      pokaz(pasekListy() + '<div class="scroll"><div class="loading">Wczytywanie…</div></div>');
      pobierz('/search.json', function (d) {
        indeks = d;
        if (V.ekran === 'lista') rysujListe(0);
      }, function () {
        if (V.ekran === 'lista') pokaz(pasekListy() + '<div class="scroll"><div class="err" data-act="ponow-liste"><b>Nie udało się wczytać przepisów.</b><br><br>Sprawdź Wi-Fi i dotknij, żeby spróbować ponownie.</div></div>');
      });
      return;
    }
    rysujListe(przewiniecie === undefined ? przewiniecieListy : przewiniecie);
  }

  function rysujListe(przewiniecie) {
    if (!indeks.length) {
      pokaz(pasekListy() + '<div class="scroll"><div class="empty">Nie ma jeszcze przepisów.<br><br>Dodaj pierwszy przez Claude Code: „dodaj do przepisów”.</div></div>');
      return;
    }
    var h = pasekListy() + '<div class="scroll">';
    // Miejsce na wyszukiwarkę (Etap 4).
    h += '<div class="search"><div class="box">Szukaj: nazwa, składnik, tag… (wkrótce)</div></div>';
    h += kartaPowrotu();
    h += '<div class="grid">';
    for (var i = 0; i < indeks.length; i++) {
      var it = indeks[i], min = it.prep_minutes + it.cook_minutes;
      h += '<div class="card" data-open="' + esc(it.id) + '">' + zdjecie(it.thumb, 'thumb', false) +
        '<div class="txt"><h3>' + esc(it.title) + '</h3><div class="meta">' + (min ? min + ' min' : 'bez gotowania') +
        ' · ' + it.servings + ' ' + porcjeSlowo(it.servings) + '</div><div class="devs">' + znaczkiUrzadzen(it.tags) + '</div></div></div>';
    }
    pokaz(h + '</div></div>', przewiniecie);
  }

  // „Wróć do gotowania" — ostatnio otwarty przepis, jeśli było w nim coś zrobione.
  function kartaPowrotu() {
    var najnowszy = null;
    Object.keys(stan.przepisy).forEach(function (slug) {
      var p = stan.przepisy[slug];
      if (!najnowszy || p.t > stan.przepisy[najnowszy].t) najnowszy = slug;
    });
    if (!najnowszy) return '';
    var p = stan.przepisy[najnowszy];
    var wIndeksie = indeks.some(function (it) { return it.id === najnowszy; });
    if (!wIndeksie || (p.krok === 0 && !p.porcje)) return '';
    return '<div class="resume" data-open="' + esc(najnowszy) + '"><div class="t"><div class="k">Wróć do gotowania</div><div class="n">' +
      esc(p.tytul) + ' — krok ' + (p.krok + 1) + ' z ' + p.krokow + '</div></div><span class="btn">Otwórz ›</span></div>';
  }

  // ═════ przepis ═════
  function adresPrzepisu(slug, krok) { return '/p/' + slug + '/' + (krok > 0 ? '#krok-' + (krok + 1) : ''); }

  function otworzPrzepis(slug, krokZAdresu) {
    V = { ekran: 'ladowanie', slug: slug, r: null, krok: 0, porcje: 0 };
    stan.ekran = slug;
    zapiszStan();
    var r = przepisy[slug];
    if (r) { rysujPrzepis(r, krokZAdresu); return; }
    pokaz('<div class="bar"><button class="btn back" data-act="wstecz">‹ Przepisy</button><h1></h1>' + przyciskMotywu() +
      '</div><div class="scroll"><div class="loading">Wczytywanie…</div></div>');
    pobierz('/data/' + slug + '.json', function (d) {
      przepisy[slug] = d;
      if (V.slug === slug) rysujPrzepis(d, krokZAdresu);
    }, function (status) {
      if (V.slug !== slug) return;
      V.ekran = 'blad';
      var tresc = status === 404
        ? '<b>Nie ma takiego przepisu.</b><br><br>Mógł zostać usunięty albo zmienić nazwę. Wróć do listy.'
        : '<b>Nie udało się wczytać przepisu.</b><br><br>Sprawdź Wi-Fi i dotknij, żeby spróbować ponownie.';
      if (status === 404) {
        delete stan.przepisy[slug];
        stan.ekran = 'lista';
        zapiszStan();
      }
      pokaz('<div class="bar"><button class="btn back" data-act="wstecz">‹ Przepisy</button><h1></h1>' + przyciskMotywu() +
        '</div><div class="scroll"><div class="err"' + (status === 404 ? '' : ' data-act="ponow-przepis"') + '>' + tresc + '</div></div>');
    });
  }

  function rysujPrzepis(r, krokZAdresu) {
    var p = stan.przepisy[r.id];
    var krok = krokZAdresu !== null && krokZAdresu !== undefined ? krokZAdresu : (p ? p.krok : 0);
    if (krok >= r.steps.length) krok = 0;
    V = { ekran: 'przepis', slug: r.id, r: r, krok: krok, porcje: p && p.porcje ? p.porcje : r.servings };
    zapamietajPrzepis();
    global.history.replaceState(global.history.state, '', adresPrzepisu(r.id, krok));

    var h = '<div class="bar"><button class="btn back" data-act="wstecz">‹ Przepisy</button><h1>' + esc(r.title) + '</h1>' +
      przyciskMotywu() + '</div>';

    var tm6 = maTm6(r);
    if (r.ninja || tm6) {
      h += '<div class="pin">';
      if (r.ninja) h += panelNinja(r.ninja) + '<div id="uwaga-porcje">' + uwagaPorcji() + '</div>';
      if (tm6) h += '<div id="panel-tm6">' + panelTm6(r, krok) + '</div>';
      h += '</div>';
    }

    h += '<div class="scroll"><div class="hero"><div class="info"><div class="head"><span class="serv" id="porcje">' + porcjeHtml() + '</span>' +
      '<span class="times">przygotowanie <b>' + r.prep_minutes + ' min</b><span class="sep">·</span>' +
      (r.cook_minutes ? 'gotowanie <b>' + r.cook_minutes + ' min</b>' : 'bez gotowania') + '</span></div>';
    h += '<div class="tags">';
    for (var i = 0; i < r.tags.length; i++) h += '<span class="tag">#' + esc(r.tags[i]) + '</span>';
    h += '</div>' + (r.description ? '<div class="desc">' + esc(r.description) + '</div>' : '') + '</div>';
    h += r.image
      ? '<div class="pic-wrap" data-act="zdjecie"><div class="ph pic"><img src="' + esc(r.image) + '" alt=""><div class="zoom">⤢ Powiększ</div></div></div>'
      : '<div class="pic-wrap">' + zdjecie(null, 'pic', true) + '</div>';
    h += '</div>';

    h += '<div class="cols"><div class="col c-ing"><h2>Składniki</h2><div class="ing" id="skladniki">' + skladnikiHtml() + '</div></div>';
    h += '<div class="col c-steps"><h2>Kroki</h2>';
    for (i = 0; i < r.steps.length; i++) h += krokHtml(r.steps[i], i, krok);
    h += '</div></div>';
    if (r.notes) h += '<div class="notes"><h2>Notatki</h2><div class="txt">' + esc(r.notes) + '</div></div>';
    h += '</div>';

    pokaz(h, 0);
    // Po powrocie do przepisu (np. po przeładowaniu Safari) pokaż bieżący krok.
    if (krok > 0) przewinDoKroku(krok);
  }

  function przewinDoKroku(n) {
    var sc = app.querySelector('.scroll');
    var el = app.querySelectorAll('.step')[n];
    if (sc && el) sc.scrollTop = Math.max(0, el.offsetTop - 16);
  }

  function zapamietajPrzepis() {
    var r = V.r;
    stan.ekran = r.id;
    stan.przepisy[r.id] = {
      krok: V.krok, porcje: V.porcje === r.servings ? null : V.porcje,
      tytul: r.title, krokow: r.steps.length, t: Date.now(),
    };
    zapiszStan();
  }

  function panelNinja(n) {
    function strefa(nr, z) {
      return '<div class="zone"><div class="zh"><b>' + nr + '</b>Strefa ' + nr + '</div>' + (z.label ? '<div class="lbl">' + esc(z.label) + '</div>' : '') +
        '<div class="fn">' + esc(z['function']) + '</div><div class="vals"><span class="big">' + z.temp_c + '</span><span class="unit">°C</span>' +
        '<span class="big">' + z.minutes + '</span><span class="unit">min</span></div></div>';
    }
    if (n.mode === 'single') return '<div class="npanel single">' + strefa(1, n.zone1) + '</div>';
    var opis = { sync: ['SYNC', 'kończą<br>razem'], match: ['MATCH', 'te same<br>ustawienia'], independent: ['OSOBNO', 'niezależne<br>strefy'] }[n.mode];
    return '<div class="npanel">' + strefa(1, n.zone1) + '<div class="mode"><span class="pill">' + opis[0] + '</span><div class="hint">' + opis[1] + '</div></div>' +
      strefa(2, n.zone2) + '</div>';
  }

  function uwagaPorcji() {
    var r = V.r;
    if (!r.ninja || V.porcje === r.servings) return '';
    return '<div class="scaled">Ustawienia Ninja są dla ' + r.servings + ' porcji. ' + (V.porcje > r.servings
      ? 'Przy większej ilości sprawdź, czy jedzenie mieści się w szufladach.'
      : 'Przy mniejszej ilości sprawdzaj wcześniej — może być gotowe szybciej.') + '</div>';
  }

  // Panel TM6: ustawienia BIEŻĄCEGO kroku. Krok bez TM6 → puste, wyszarzone tarcze (ta sama wysokość, ekran nie skacze).
  function panelTm6(r, cur) {
    function tarcza(v, u, opis, wyl, male) {
      return '<div class="dial' + (wyl ? ' off' : '') + '"><div class="ring"><div class="v' + (male ? ' sm' : '') + '">' + v + '</div>' +
        (u ? '<div class="u">' + u + '</div>' : '') + '</div><div class="dl">' + opis + '</div></div>';
    }
    var t = r.steps[cur] && r.steps[cur].tm6;
    if (!t) {
      return '<div class="tpanel"><div class="th"><span class="tk">TM6</span>Ten krok bez TM6</div><div class="dials">' +
        tarcza('—', '', 'Czas', true) + tarcza('—', '', 'Temperatura', true) + tarcza('—', '', 'Obroty', true) + '</div></div>';
    }
    var temp = t.temperature === undefined ? tarcza('—', 'bez grzania', 'Temperatura', true)
      : (t.temperature === 'Varoma' ? tarcza('Varoma', '', 'Temperatura', false, true) : tarcza(t.temperature, '°C', 'Temperatura'));
    var obroty = t.speed === undefined ? tarcza('—', '', 'Obroty', true)
      : tarcza(obrotyTm6(t.speed), t.reverse ? '↺ wsteczne' : '', 'Obroty', false, typeof t.speed !== 'number');
    return '<div class="tpanel"><div class="th"><span class="tk">TM6</span>Krok <b>' + (cur + 1) + '</b> z ' + r.steps.length +
      (t.mode ? '<span class="tmode">' + esc(t.mode) + '</span>' : '') + '</div><div class="dials">' +
      tarcza(czasTm6(t.duration_seconds), 'min:s', 'Czas') + temp + obroty + '</div></div>';
  }

  function porcjeHtml() {
    var r = V.r, sv = V.porcje, zm = sv !== r.servings;
    return '<button class="sb" data-act="porcje-"' + (sv <= PORCJE_MIN ? ' disabled' : '') + ' aria-label="Mniej porcji">−</button>' +
      '<span class="sn' + (zm ? ' chg' : '') + '"><b>' + sv + '</b> ' + porcjeSlowo(sv) +
      (zm ? '<span class="orig" data-act="porcje0">przepis: ' + r.servings + '</span>' : '') + '</span>' +
      '<button class="sb" data-act="porcje+"' + (sv >= PORCJE_MAX ? ' disabled' : '') + ' aria-label="Więcej porcji">+</button>';
  }

  function skladnikiHtml() {
    var r = V.r, f = V.porcje / r.servings, h = '', grupa = null;
    for (var i = 0; i < r.ingredients.length; i++) {
      var x = r.ingredients[i];
      if ((x.group || null) !== grupa) { grupa = x.group || null; if (grupa) h += '<div class="g">' + esc(grupa) + '</div>'; }
      h += '<div class="row"><div class="q' + (x.amount ? '' : ' none') + '">' + (x.amount ? esc(ilosc(x.amount, x.unit, f)) + ' ' + esc(x.unit) : '—') +
        '</div><div class="nm">' + esc(x.name) + (x.note ? ' <span class="note">(' + esc(x.note) + ')</span>' : '') + '</div></div>';
    }
    return h;
  }

  function krokHtml(s, i, cur) {
    var h = '<div class="step' + (i === cur ? ' cur' : (i < cur ? ' past' : '')) + '" data-step="' + i + '"><div class="num">' + (i < cur ? '✓' : (i + 1)) +
      '</div><div class="body">' + esc(s.text);
    if (s.tm6) {
      var t = s.tm6;
      h += '<div class="tm6row"><span class="tm k">TM6</span><span class="tm">⏱ ' + czasTm6(t.duration_seconds) + '</span>' +
        (t.temperature !== undefined ? '<span class="tm">🌡 ' + (t.temperature === 'Varoma' ? 'Varoma' : t.temperature + '°C') + '</span>' : '') +
        (t.speed !== undefined ? '<span class="tm">⟳ ' + esc(obrotyTm6(t.speed)) + '</span>' : '') + (t.reverse ? '<span class="tm">↺ wsteczne</span>' : '') +
        (t.mode ? '<span class="tm">' + esc(t.mode) + '</span>' : '') + '</div>';
    }
    if (s.internal_temp_c !== undefined) h += '<div class="temp-in">🌡 ' + dziesietna(s.internal_temp_c) + '°C w środku</div>';
    return h + '</div></div>';
  }

  // Zmiana kroku: tylko klasy i numery kroków + panel TM6 — bez przerysowania ekranu i bez ruszania przewinięcia.
  function ustawKrok(n) {
    if (V.ekran !== 'przepis') return;
    V.krok = n;
    var els = app.querySelectorAll('.step');
    for (var i = 0; i < els.length; i++) {
      els[i].className = 'step' + (i === n ? ' cur' : (i < n ? ' past' : ''));
      els[i].firstChild.innerHTML = i < n ? '✓' : String(i + 1);
    }
    var tp = doc.getElementById('panel-tm6');
    if (tp) tp.innerHTML = panelTm6(V.r, n);
    zapamietajPrzepis();
    global.history.replaceState(global.history.state, '', adresPrzepisu(V.slug, n));
  }

  // Zmiana porcji: tylko licznik porcji, składniki i uwaga pod panelem Ninja.
  function ustawPorcje(n) {
    if (V.ekran !== 'przepis') return;
    V.porcje = ograniczPorcje(n);
    doc.getElementById('porcje').innerHTML = porcjeHtml();
    doc.getElementById('skladniki').innerHTML = skladnikiHtml();
    var u = doc.getElementById('uwaga-porcje');
    if (u) u.innerHTML = uwagaPorcji();
    zapamietajPrzepis();
  }

  // Podgląd zdjęcia na pełny ekran — nakładka, przepis pod spodem zostaje nietknięty.
  function pokazZdjecie() {
    if (V.ekran !== 'przepis' || !V.r.image || doc.getElementById('viewer')) return;
    var d = doc.createElement('div');
    d.id = 'viewer';
    d.setAttribute('data-act', 'zamknij');
    d.innerHTML = '<div class="vbar"><h1>' + esc(V.r.title) + '</h1><button class="close" data-act="zamknij">✕ Zamknij</button></div>' +
      '<div class="big"><img src="' + esc(V.r.image) + '" alt=""></div><div class="hint">Dotknij w dowolnym miejscu, żeby wrócić do przepisu</div>';
    app.appendChild(d);
  }
  function zamknijZdjecie() {
    var v = doc.getElementById('viewer');
    if (v) v.parentNode.removeChild(v);
  }

  // ── nawigacja ──
  function slugZAdresu() {
    var m = /^\/p\/([a-z0-9-]+)\/?$/.exec(global.location.pathname);
    return m ? m[1] : null;
  }
  function krokZAdresu() {
    var m = /^#krok-(\d+)$/.exec(global.location.hash);
    return m ? parseInt(m[1], 10) - 1 : null;
  }

  function idzDoPrzepisu(slug) {
    zamknijZdjecie();
    var sc = app.querySelector('.scroll');
    przewiniecieListy = V.ekran === 'lista' && sc ? sc.scrollTop : 0;
    global.history.pushState({ zListy: true }, '', adresPrzepisu(slug, 0));
    otworzPrzepis(slug, null);
  }
  function wstecz() {
    zamknijZdjecie();
    // Weszliśmy z listy → zwykłe „wstecz" w historii; inaczej (start z /p/…) podmieniamy adres.
    if (global.history.state && global.history.state.zListy) { global.history.back(); return; }
    global.history.replaceState(null, '', '/');
    pokazListe();
  }
  function wedlugAdresu() {
    zamknijZdjecie();
    var slug = slugZAdresu();
    if (slug) otworzPrzepis(slug, krokZAdresu());
    else pokazListe();
  }

  doc.addEventListener('click', function (e) {
    var t = e.target;
    while (t && t !== doc) {
      if (t.getAttribute) {
        var a = t.getAttribute('data-act');
        if (a) {
          if (t.disabled) return;
          if (a === 'motyw') ustawMotyw(motyw === 'dark' ? 'light' : 'dark');
          else if (a === 'wstecz') wstecz();
          else if (a === 'zdjecie') pokazZdjecie();
          else if (a === 'zamknij') zamknijZdjecie();
          else if (a === 'porcje+') ustawPorcje(V.porcje + 1);
          else if (a === 'porcje-') ustawPorcje(V.porcje - 1);
          else if (a === 'porcje0') ustawPorcje(V.r.servings);
          else if (a === 'ponow-liste') pokazListe();
          else if (a === 'ponow-przepis') otworzPrzepis(V.slug, null);
          return;
        }
        if (t.getAttribute('data-open')) { idzDoPrzepisu(t.getAttribute('data-open')); return; }
        if (t.getAttribute('data-step')) { ustawKrok(parseInt(t.getAttribute('data-step'), 10)); return; }
      }
      t = t.parentNode;
    }
  });

  global.addEventListener('popstate', wedlugAdresu);

  // Powrót do strony bez przeładowania (iOS 12 bywa, że nie wykonuje kodu startowego):
  // odczytaj stan z localStorage i dociągnij do niego widok.
  function przyPowrocie() {
    stan = czytajStan();
    var cel = stan.ekran;
    if (cel !== 'lista') {
      if (V.slug !== cel) { global.history.replaceState(null, '', adresPrzepisu(cel, 0)); otworzPrzepis(cel, null); return; }
      var p = stan.przepisy[cel];
      if (V.ekran !== 'przepis' || !p) return;
      var porcje = p.porcje || V.r.servings;
      if (porcje !== V.porcje) ustawPorcje(porcje);
      if (p.krok !== V.krok && p.krok < V.r.steps.length) ustawKrok(p.krok);
      return;
    }
    if (V.ekran === 'lista' && indeks) {
      var sc = app.querySelector('.scroll');
      rysujListe(sc ? sc.scrollTop : 0); // odśwież kartę „Wróć do gotowania"
    } else if (V.ekran !== 'lista') {
      global.history.replaceState(null, '', '/');
      pokazListe();
    }
  }
  global.addEventListener('pageshow', function () { if (V.ekran !== 'start') przyPowrocie(); });
  doc.addEventListener('visibilitychange', function () { if (doc.visibilityState === 'visible') przyPowrocie(); });

  // ── start ──
  // Adres /p/<slug>/ wygrywa; na „/" wracamy do ostatniego ekranu z pamięci (np. po otwarciu z ekranu początkowego).
  var startSlug = slugZAdresu();
  if (startSlug) otworzPrzepis(startSlug, krokZAdresu());
  else if (stan.ekran !== 'lista') { global.history.replaceState(null, '', adresPrzepisu(stan.ekran, 0)); otworzPrzepis(stan.ekran, null); }
  else pokazListe();
})(this);
