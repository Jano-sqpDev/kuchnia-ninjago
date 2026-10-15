// Testy normalizacji i dopasowania wyszukiwania.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalize, buildSearchText, matchesQuery } from '../tools/search.mjs';
import { searchEntry } from '../tools/output.mjs';

const entry = (data) => searchEntry({ slug: 'x', data });

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
  assert.deepEqual(Object.keys(SALMON).sort(), ['cook_minutes', 'id', 'ingredients', 'ninja_functions', 'prep_minutes', 'servings', 'tags', 'text', 'title']);
  assert.deepEqual(SALMON.ninja_functions, ['Air Fry']);
  assert.equal(SALMON.text, buildSearchText(SALMON));
});
