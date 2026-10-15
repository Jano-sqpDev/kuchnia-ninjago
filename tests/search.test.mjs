// Testy normalizacji i dopasowania wyszukiwania.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalize, buildSearchText, matchesQuery } from '../tools/search.mjs';
import { searchEntry } from '../tools/output.mjs';

const entry = (data, translated, tagMap) => searchEntry({ slug: 'x', data, translated }, null, tagMap);

const SALMON = entry({
  title: 'Łosoś z cukinią',
  tags: ['ninja', 'ryby'],
  ingredients: [{ name: 'Filet z łososia' }, { name: 'cukinia' }],
  ninja: { mode: 'single', zone1: { function: 'Air Fry', temp_c: 180, minutes: 12 } },
});

const SOUP = entry({
  title: 'Zupa krem',
  tags: ['tm6', 'zupa'],
  ingredients: [{ name: 'dynia' }],
});

test('normalize: małe litery, bez ogonków, ł → l, spacje', () => {
  assert.equal(normalize('Łosoś'), 'losos');
  assert.equal(normalize('ZAŻÓŁĆ GĘŚLĄ JAŹŃ'), 'zazolc gesla jazn');
  assert.equal(normalize('  dwa   słowa\t\n'), 'dwa slowa');
});

test('„losos" znajduje „łosoś"', () => {
  assert.ok(matchesQuery(SALMON, 'losos'));
  assert.ok(matchesQuery(SALMON, 'ŁOSOŚ'));
});

test('thermomix znajduje przepis z tagiem tm6', () => {
  assert.ok(matchesQuery(SOUP, 'thermomix'));
  assert.ok(matchesQuery(SOUP, 'therm'));
  assert.ok(!matchesQuery(SALMON, 'thermomix'));
});

test('aliasy Ninja: airfryer, air fryer', () => {
  assert.ok(matchesQuery(SALMON, 'airfryer'));
  assert.ok(matchesQuery(SALMON, 'air fryer'));
  assert.ok(!matchesQuery(SOUP, 'airfryer'));
});

test('wiele słów = AND, dopasowanie po fragmencie', () => {
  assert.ok(matchesQuery(SALMON, 'cuki los'));
  assert.ok(!matchesQuery(SALMON, 'losos dynia'));
  assert.ok(matchesQuery(SALMON, 'air fry'));
});

test('puste zapytanie pasuje do wszystkiego', () => {
  assert.ok(matchesQuery(SOUP, '   '));
});

test('wpis search.json ma wymagane pola', () => {
  assert.deepEqual(Object.keys(SALMON).sort(), ['cook_minutes', 'id', 'ingredients', 'ninja_functions', 'prep_minutes', 'servings', 'tags', 'tags_en', 'text', 'title']);
  assert.deepEqual(SALMON.ninja_functions, ['Air Fry']);
  assert.equal(SALMON.text, buildSearchText(SALMON));
});

// ── oba języki: wyszukiwanie działa niezależnie od języka interfejsu ──
const SALMON_DATA = {
  title: 'Łosoś z cukinią',
  tags: ['ninja', 'ryby'],
  ingredients: [{ name: 'Filet z łososia' }, { name: 'cukinia' }],
  ninja: { mode: 'single', zone1: { function: 'Air Fry', temp_c: 180, minutes: 12 } },
  translations: { en: { title: 'Salmon with courgette', ingredients: [{ name: 'Salmon fillet' }, { name: 'courgette' }], steps: [] } },
};
const BILINGUAL = entry(SALMON_DATA, true, { ryby: 'fish' });

test('oba języki: tytuł, składniki i tagi PL i EN w tekście wyszukiwania', () => {
  for (const q of ['losos', 'cukinia', 'ryby', 'salmon', 'courgette', 'fish', 'salmon cukin', 'air fry']) assert.ok(matchesQuery(BILINGUAL, q), q);
  assert.ok(!matchesQuery(BILINGUAL, 'chicken'));
  assert.equal(BILINGUAL.title_en, 'Salmon with courgette');
  assert.deepEqual(BILINGUAL.tags_en, ['ninja', 'fish']);
});

test('oba języki: niekompletne tłumaczenie nie trafia do indeksu; tagi EN z tags.yml zawsze', () => {
  const partial = entry(SALMON_DATA, false, { ryby: 'fish' });
  assert.ok(!('title_en' in partial));
  assert.ok(!matchesQuery(partial, 'salmon'));
  assert.ok(matchesQuery(partial, 'fish'));
  // Tag, który po angielsku brzmi tak samo, nie dubluje się w tekście.
  assert.equal(entry({ title: 'A', tags: ['burgery', 'dinner'], ingredients: [] }, false, { dinner: 'dinner' }).text, 'a burgery dinner');
});
