// Normalizacja i dopasowanie wyszukiwania.
// Kod celowo w składni ES2017. Funkcje wyszukiwania (normalize … searchIndex) mają dosłowne kopie w src/app.js (iPad);
// tests/client.test.mjs pilnuje, że tekst i wyniki obu wersji są takie same — zmieniaj oba miejsca razem.

// Aliasy dopisywane do tekstu wyszukiwania, żeby np. „thermomix" znajdował tag tm6.
export const TAG_ALIASES = {
  tm6: ['thermomix'],
  ninja: ['airfryer', 'air fryer', 'af'],
};

// Małe litery, bez znaków diakrytycznych (NFD nie rozkłada „ł", więc ł → l ręcznie),
// pojedyncze spacje.
export function normalize(text) {
  return String(text)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ł/g, 'l')
    .replace(/\s+/g, ' ')
    .trim();
}

// Tekst, po którym szuka iPad — w obu językach, żeby wyszukiwanie działało niezależnie od języka interfejsu:
// tytuł (PL i EN), tagi (+ aliasy, + tłumaczenia z tags.yml), składniki (PL i EN — extra), funkcje Ninja.
export function buildSearchText(entry, extra) {
  const parts = [entry.title];
  if (entry.title_en) parts.push(entry.title_en);
  entry.tags.forEach(function (tag) {
    parts.push(tag);
    (TAG_ALIASES[tag] || []).forEach(function (alias) { parts.push(alias); });
  });
  (entry.tags_en || []).forEach(function (tag) { if (entry.tags.indexOf(tag) === -1) parts.push(tag); });
  entry.ingredients.forEach(function (name) { parts.push(name); });
  (extra || []).forEach(function (name) { parts.push(name); });
  entry.ninja_functions.forEach(function (f) { parts.push(f); });
  return normalize(parts.join(' '));
}

// Wiele słów = AND, każde słowo dopasowane po fragmencie.
export function matchesQuery(entry, query) {
  const words = normalize(query).split(' ').filter(Boolean);
  return words.every(function (word) { return entry.text.indexOf(word) !== -1; });
}

// Słowa zapytania po normalizacji (puste zapytanie → []).
export function searchWords(query) {
  return normalize(query).split(' ').filter(Boolean);
}

// Rdzenie słowa na polską odmianę: bez 1 lub 2 ostatnich liter, tylko dla słów >= 5 znaków, rdzeń >= 4 znaki.
// „kalafiorem" → [„kalafiore", „kalafior"]; „jajka" → [„jajk"]; „sol" → [] (krótkie słowa tylko dokładnie).
export function wordStems(word) {
  var out = [];
  if (word.length < 5) return out;
  for (var cut = 1; cut <= 2; cut++) {
    if (word.length - cut >= 4) out.push(word.slice(0, word.length - cut));
  }
  return out;
}

// Jak słowo trafia w tekst: 0 = dokładny fragment, 1 = rdzeń (odmiana), -1 = nie trafia.
export function matchLevel(text, word) {
  if (text.indexOf(word) !== -1) return 0;
  var stems = wordStems(word);
  for (var i = 0; i < stems.length; i++) if (text.indexOf(stems[i]) !== -1) return 1;
  return -1;
}

// Odległość edycyjna najwyżej 1: wstawienie, usunięcie, zamiana albo przestawienie dwóch sąsiednich liter.
export function isEdit1(a, b) {
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
export function buildDictionary(entries) {
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
export function typoCandidates(word, dict) {
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
export function searchIndex(entries, query, dict) {
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
