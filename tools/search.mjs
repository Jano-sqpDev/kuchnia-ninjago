// Normalizacja i dopasowanie wyszukiwania.
// Kod celowo w składni ES2017 — w Etapie 4 ta sama logika trafi do JS na iPadzie.

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
    .replace(/[̀-ͯ]/g, '')
    .replace(/ł/g, 'l')
    .replace(/\s+/g, ' ')
    .trim();
}

// Tekst, po którym szuka iPad: tytuł, tagi (+ aliasy), składniki, funkcje Ninja.
export function buildSearchText(entry) {
  const parts = [entry.title];
  entry.tags.forEach(function (tag) {
    parts.push(tag);
    (TAG_ALIASES[tag] || []).forEach(function (alias) { parts.push(alias); });
  });
  entry.ingredients.forEach(function (name) { parts.push(name); });
  entry.ninja_functions.forEach(function (f) { parts.push(f); });
  return normalize(parts.join(' '));
}

// Wiele słów = AND, każde słowo dopasowane po fragmencie.
export function matchesQuery(entry, query) {
  const words = normalize(query).split(' ').filter(Boolean);
  return words.every(function (word) { return entry.text.indexOf(word) !== -1; });
}
