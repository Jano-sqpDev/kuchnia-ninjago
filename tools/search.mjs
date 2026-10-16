// Normalizacja i dopasowanie wyszukiwania.
// Kod celowo w składni ES2017. normalize i matchesQuery mają dosłowne kopie w src/app.js (wyszukiwarka na iPadzie);
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
