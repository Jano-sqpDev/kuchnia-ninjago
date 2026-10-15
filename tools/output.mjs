// Kształt wygenerowanych plików JSON (to, co pobiera iPad).
import { buildSearchText } from './search.mjs';

// Pełne dane jednego przepisu dla strony przepisu.
// images = { thumb, large } z tools/images.mjs albo brak, gdy przepis nie ma zdjęcia.
export function recipeJson({ slug, data, body }, images) {
  const result = Object.assign({ id: slug }, data);
  // image w danych strony to zawsze przetworzona duża wersja; bez niej (brak zdjęcia albo błąd) — brak pola.
  delete result.image;
  if (images) {
    result.image = images.large;
    result.thumb = images.thumb;
  }
  if (body) result.notes = body;
  return result;
}

// Lekki wpis indeksu: lista przepisów (Etap 3) i wyszukiwanie (Etap 4).
export function searchEntry({ slug, data }, images) {
  const functions = [];
  if (data.ninja) {
    [data.ninja.zone1, data.ninja.zone2].forEach((z) => {
      if (z && !functions.includes(z.function)) functions.push(z.function);
    });
  }
  const entry = {
    id: slug,
    title: data.title,
    tags: data.tags,
    ingredients: data.ingredients.map((i) => i.name),
    ninja_functions: functions,
    servings: data.servings,
    prep_minutes: data.prep_minutes,
    cook_minutes: data.cook_minutes,
  };
  if (images) entry.thumb = images.thumb;
  entry.text = buildSearchText(entry);
  return entry;
}
