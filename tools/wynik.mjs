// Kształt wygenerowanych plików JSON (to, co pobiera iPad).
import { buildSearchText } from './szukaj.mjs';

// Pełne dane jednego przepisu dla strony przepisu.
// zdjecia = { thumb, large } z tools/zdjecia.mjs albo brak, gdy przepis nie ma zdjęcia.
export function recipeJson({ slug, data, body }, zdjecia) {
  const wynik = Object.assign({ id: slug }, data);
  if (zdjecia) {
    wynik.image = zdjecia.large;
    wynik.thumb = zdjecia.thumb;
  }
  if (body) wynik.notes = body;
  return wynik;
}

// Lekki wpis indeksu: lista przepisów (Etap 3) i wyszukiwanie (Etap 4).
export function searchEntry({ slug, data }, zdjecia) {
  const funkcje = [];
  if (data.ninja) {
    [data.ninja.zone1, data.ninja.zone2].forEach((z) => {
      if (z && !funkcje.includes(z.function)) funkcje.push(z.function);
    });
  }
  const wpis = {
    id: slug,
    title: data.title,
    tags: data.tags,
    ingredients: data.ingredients.map((i) => i.name),
    ninja_functions: funkcje,
    servings: data.servings,
    prep_minutes: data.prep_minutes,
    cook_minutes: data.cook_minutes,
  };
  if (zdjecia) wpis.thumb = zdjecia.thumb;
  wpis.text = buildSearchText(wpis);
  return wpis;
}
