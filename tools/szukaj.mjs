// Normalizacja i dopasowanie wyszukiwania.
// Kod celowo w składni ES2017 — w Etapie 4 ta sama logika trafi do JS na iPadzie.

// Aliasy dopisywane do tekstu wyszukiwania, żeby np. „thermomix" znajdował tag tm6.
export const ALIASY_TAGOW = {
  tm6: ['thermomix'],
  ninja: ['airfryer', 'air fryer', 'af'],
};

// Małe litery, bez znaków diakrytycznych (NFD nie rozkłada „ł", więc ł → l ręcznie),
// pojedyncze spacje.
export function normalize(tekst) {
  return String(tekst)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/ł/g, 'l')
    .replace(/\s+/g, ' ')
    .trim();
}

// Tekst, po którym szuka iPad: tytuł, tagi (+ aliasy), składniki, funkcje Ninja.
export function buildSearchText(wpis) {
  const czesci = [wpis.title];
  wpis.tags.forEach(function (tag) {
    czesci.push(tag);
    (ALIASY_TAGOW[tag] || []).forEach(function (alias) { czesci.push(alias); });
  });
  wpis.ingredients.forEach(function (nazwa) { czesci.push(nazwa); });
  wpis.ninja_functions.forEach(function (f) { czesci.push(f); });
  return normalize(czesci.join(' '));
}

// Wiele słów = AND, każde słowo dopasowane po fragmencie.
export function matchesQuery(wpis, zapytanie) {
  const slowa = normalize(zapytanie).split(' ').filter(Boolean);
  return slowa.every(function (slowo) { return wpis.text.indexOf(slowo) !== -1; });
}
