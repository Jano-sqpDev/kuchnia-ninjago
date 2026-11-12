// Kształt wygenerowanych plików JSON (to, co pobiera iPad).
import { buildSearchText } from './search.mjs';
import { translateTags, recipeBadges, DEVICE_TAGS } from './validate.mjs';

// Kalendarz lunchów (od v0.11) dla iPada: data → { recipe, title, title_en?, thumb?, badges, devices, note? }
// albo { error: 'recipe' | 'entry', recipe? } (wpis z błędem — na ekranie „⚠ brak przepisu”).
// calendar — entries z validateCalendar, index — wpisy search.json (tytuły, miniatury, plakietki tak samo jak na liście).
export function calendarJson(calendar, index) {
  const bySlug = {};
  index.forEach((e) => { bySlug[e.id] = e; });
  const out = {};
  Object.keys(calendar || {}).sort().forEach((date) => {
    const c = calendar[date], e = c.error ? null : bySlug[c.recipe];
    if (!e) {
      out[date] = { error: c.error || 'recipe' };
      if (c.recipe) out[date].recipe = c.recipe;
      return;
    }
    const o = { recipe: c.recipe, title: e.title };
    if (e.title_en) o.title_en = e.title_en;
    if (e.thumb) o.thumb = e.thumb;
    o.badges = e.badges;
    o.devices = DEVICE_TAGS.filter((t) => e.tags.includes(t));
    if (c.note) o.note = c.note;
    out[date] = o;
  });
  return out;
}

// Pełne dane jednego przepisu dla strony przepisu.
// images = { thumb, large } z tools/images.mjs albo brak, gdy przepis nie ma zdjęcia.
// translated = tłumaczenie EN kompletne; niekompletne nie trafia na stronę (w trybie EN przepis po polsku).
// tagMap — tłumaczenia tagów z recipes/tags.yml → pole tags_en; badgeMap — znaczniki → pole badges.
export function recipeJson({ slug, data, body, translated }, images, tagMap, badgeMap) {
  const result = Object.assign({ id: slug }, data);
  // image w danych strony to zawsze przetworzona duża wersja; bez niej (brak zdjęcia albo błąd) — brak pola.
  delete result.image;
  if (images) {
    result.image = images.large;
    result.thumb = images.thumb;
  }
  if (!translated) delete result.translations;
  result.tags_en = translateTags(data.tags, tagMap || {});
  result.badges = recipeBadges(data.tags, badgeMap);
  if (body) result.notes = body;
  return result;
}

// Lekki wpis indeksu: lista przepisów i wyszukiwanie (oba języki).
export function searchEntry({ slug, data, translated }, images, tagMap, badgeMap) {
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
    badges: recipeBadges(data.tags, badgeMap),
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
