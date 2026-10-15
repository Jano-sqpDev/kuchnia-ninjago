// Kształt wygenerowanych plików JSON (to, co pobiera iPad).
import { buildSearchText } from './search.mjs';
import { translateTags } from './validate.mjs';

// Pełne dane jednego przepisu dla strony przepisu.
// images = { thumb, large } z tools/images.mjs albo brak, gdy przepis nie ma zdjęcia.
// translated = tłumaczenie EN kompletne; niekompletne nie trafia na stronę (w trybie EN przepis po polsku).
// tagMap — tłumaczenia tagów z recipes/tags.yml → pole tags_en.
export function recipeJson({ slug, data, body, translated }, images, tagMap) {
  const result = Object.assign({ id: slug }, data);
  // image w danych strony to zawsze przetworzona duża wersja; bez niej (brak zdjęcia albo błąd) — brak pola.
  delete result.image;
  if (images) {
    result.image = images.large;
    result.thumb = images.thumb;
  }
  if (!translated) delete result.translations;
  result.tags_en = translateTags(data.tags, tagMap || {});
  if (body) result.notes = body;
  return result;
}

// Lekki wpis indeksu: lista przepisów i wyszukiwanie (oba języki).
export function searchEntry({ slug, data, translated }, images, tagMap) {
  const functions = [];
  if (data.ninja) {
    [data.ninja.zone1, data.ninja.zone2].forEach((z) => {
      if (z && !functions.includes(z.function)) functions.push(z.function);
    });
  }
  const en = translated && data.translations ? data.translations.en : null;
  const entry = {
    id: slug,
    title: data.title,
    tags: data.tags,
    tags_en: translateTags(data.tags, tagMap || {}),
    ingredients: data.ingredients.map((i) => i.name),
    ninja_functions: functions,
    servings: data.servings,
    prep_minutes: data.prep_minutes,
    cook_minutes: data.cook_minutes,
  };
  if (en) entry.title_en = en.title;
  if (images) entry.thumb = images.thumb;
  entry.text = buildSearchText(entry, en ? en.ingredients.map((i) => i.name) : []);
  return entry;
}
