// Testy normalizacji i dopasowania wyszukiwania.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalize, buildSearchText, matchesQuery } from '../tools/szukaj.mjs';
import { searchEntry } from '../tools/wynik.mjs';

const wpis = (data) => searchEntry({ slug: 'x', data });

const LOSOS = wpis({
  title: 'Łosoś z cukinią',
  tags: ['ninja', 'ryby'],
  ingredients: [{ name: 'Filet z łososia' }, { name: 'cukinia' }],
  ninja: { mode: 'single', zone1: { function: 'Air Fry', temp_c: 180, minutes: 12 } },
});

const ZUPA = wpis({
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
  assert.ok(matchesQuery(LOSOS, 'losos'));
  assert.ok(matchesQuery(LOSOS, 'ŁOSOŚ'));
});

test('thermomix znajduje przepis z tagiem tm6', () => {
  assert.ok(matchesQuery(ZUPA, 'thermomix'));
  assert.ok(matchesQuery(ZUPA, 'therm'));
  assert.ok(!matchesQuery(LOSOS, 'thermomix'));
});

test('aliasy Ninja: airfryer, air fryer', () => {
  assert.ok(matchesQuery(LOSOS, 'airfryer'));
  assert.ok(matchesQuery(LOSOS, 'air fryer'));
  assert.ok(!matchesQuery(ZUPA, 'airfryer'));
});

test('wiele słów = AND, dopasowanie po fragmencie', () => {
  assert.ok(matchesQuery(LOSOS, 'cuki los'));
  assert.ok(!matchesQuery(LOSOS, 'losos dynia'));
  assert.ok(matchesQuery(LOSOS, 'air fry'));
});

test('puste zapytanie pasuje do wszystkiego', () => {
  assert.ok(matchesQuery(ZUPA, '   '));
});

test('wpis search.json ma wymagane pola', () => {
  assert.deepEqual(Object.keys(LOSOS).sort(), ['id', 'ingredients', 'ninja_functions', 'tags', 'text', 'title']);
  assert.deepEqual(LOSOS.ninja_functions, ['Air Fry']);
  assert.equal(LOSOS.text, buildSearchText(LOSOS));
});
