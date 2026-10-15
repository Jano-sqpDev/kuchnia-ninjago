// Kształt wygenerowanych plików JSON (to, co pobiera iPad).
import { buildSearchText } from './szukaj.mjs';

// Pełne dane jednego przepisu dla strony przepisu (Etap 3).
export function recipeJson({ slug, data, body }) {
  const wynik = Object.assign({ id: slug }, data);
  if (data.image) wynik.image = '/' + data.image;
  if (body) wynik.notes = body;
  return wynik;
}

// Lekki wpis indeksu wyszukiwania (Etap 4).
export function searchEntry({ slug, data }) {
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
  };
  wpis.text = buildSearchText(wpis);
  return wpis;
}
