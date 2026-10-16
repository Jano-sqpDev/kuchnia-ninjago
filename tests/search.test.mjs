// Testy normalizacji i dopasowania wyszukiwania.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalize, buildSearchText, matchesQuery } from '../tools/search.mjs';
import { searchEntry } from '../tools/output.mjs';
import { searchIndex, buildDictionary, wordStems, matchLevel, isEdit1, typoCandidates } from '../tools/search.mjs';
import { syntheticIndex } from '../tools/bench-search.mjs';

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

// ── Etap 4.1: odmiana (rdzeń) i literówki ──

const mk = (slug, data, tagMap) => searchEntry({ slug, data: Object.assign({ tags: [], ingredients: [] }, data), translated: !!data.translations }, null, tagMap || {});
const IDX = [
  mk('makaron', {
    title: 'Makaron z brokułem i kalafiorem', tags: ['obiad'],
    ingredients: [{ name: 'Kalafior' }, { name: 'Brokuł' }, { name: 'Makaron penne' }],
    translations: { en: { title: 'Pasta with broccoli and cauliflower', ingredients: [{ name: 'Cauliflower' }, { name: 'Broccoli' }, { name: 'Penne pasta' }], steps: [] } },
  }),
  mk('tost', { title: 'Tost z jajkiem', tags: ['sniadanie'], ingredients: [{ name: 'duże jajko' }, { name: 'chleb tostowy' }, { name: 'sól' }] }),
  mk('burger', { title: 'Burgery wołowe', tags: ['ninja'], ingredients: [{ name: 'Ser cheddar' }, { name: 'Pomidor' }, { name: 'sok z cytryny' }],
    ninja: { mode: 'single', zone1: { function: 'Air Fry', temp_c: 190, minutes: 11 } } }),
  mk('ziemniaki', { title: 'Ziemniaki młode z koperkiem', ingredients: [{ name: 'Ziemniaki młode' }, { name: 'koperek' }] }),
  mk('zapiekanka', { title: 'Zapiekanka kalafiorowa', ingredients: [{ name: 'kalafiora różyczki' }, { name: 'ser cheddar' }] }),
];
const DICT = buildDictionary(IDX);
const run = (q) => { const r = searchIndex(IDX, q, DICT); return { ids: r.results.map((e) => e.id), corrected: r.corrected }; };
const idsOf = (q) => run(q).ids;

test('rdzeń: odmiana polska (słowa >= 5 znaków, rdzeń >= 4)', () => {
  assert.deepEqual(wordStems('kalafiorem'), ['kalafiore', 'kalafior']);
  assert.deepEqual(wordStems('jajka'), ['jajk']);
  assert.deepEqual(wordStems('sol'), []);
  assert.deepEqual(wordStems('jajo'), []);
  assert.ok(idsOf('kalafiora').includes('makaron'));
  assert.ok(idsOf('kalafiorem').includes('makaron'));
  assert.deepEqual(idsOf('ziemniakow'), ['ziemniaki']);
  assert.deepEqual(idsOf('jajka'), ['tost']);                     // „duże jajko", przepis bez tagu jajka
  assert.deepEqual(idsOf('pomidorow'), ['burger']);
  assert.equal(matchLevel('duze jajko', 'jajka'), 1);
  assert.equal(matchLevel('duze jajko', 'jajko'), 0);
});

test('krótkie słowa tylko dokładnie: „sol" nie łapie „sok"', () => {
  assert.deepEqual(idsOf('sol'), ['tost']);
  assert.deepEqual(idsOf('sok'), ['burger']);
  assert.deepEqual(idsOf('jaj'), ['tost']);
  assert.deepEqual(idsOf('sól'), ['tost']);
});

test('literówki (awaryjnie): odległość 1, także względem początku dłuższych słów; komunikat z poprawionym słowem', () => {
  assert.deepEqual(run('klafior'), { ids: ['makaron', 'zapiekanka'], corrected: 'kalafior' });
  assert.deepEqual(run('kalafjor'), { ids: ['makaron', 'zapiekanka'], corrected: 'kalafior' });
  assert.deepEqual(run('ziemnaiki'), { ids: ['ziemniaki'], corrected: 'ziemniaki' });
  assert.deepEqual(run('cauliflwer'), { ids: ['makaron'], corrected: 'cauliflower' });
  // „chedar" trafia już rdzeniem („ched…" w „cheddar") — wynik ten sam, bez komunikatu o poprawce.
  assert.deepEqual(run('chedar'), { ids: ['burger', 'zapiekanka'], corrected: null });
  assert.deepEqual(typoCandidates('chedar', DICT), ['cheddar']);
  assert.deepEqual(run('xyzxyz'), { ids: [], corrected: null });
  assert.deepEqual(run('kalaf'), { ids: ['makaron', 'zapiekanka'], corrected: null }); // fragment — bez poprawek
  // Słowo, które trafia gdziekolwiek (dokładnie albo rdzeniem), nie jest poprawiane.
  assert.equal(run('koperkiem').corrected, null);
  assert.deepEqual(run('koperkiem').ids, ['ziemniaki']);
});

test('odległość edycyjna 1: wstawienie, usunięcie, zamiana, przestawienie sąsiednich', () => {
  assert.ok(isEdit1('chedar', 'cheddar'));
  assert.ok(isEdit1('cheddar', 'chedar'));
  assert.ok(isEdit1('kalafjor', 'kalafior'));
  assert.ok(isEdit1('ziemnaiki', 'ziemniaki'));
  assert.ok(isEdit1('abc', 'abc'));
  assert.ok(!isEdit1('abcd', 'adcb'));
  assert.ok(!isEdit1('kalafior', 'kalafiorem'));
  assert.ok(!isEdit1('ser', 'sok'));
});

test('kolejność: najpierw dokładnie, potem rdzeń, potem literówka; w grupie kolejność indeksu', () => {
  // „kalafiora": dokładnie w zapiekance („kalafiora różyczki"), rdzeniem w makaronie („kalafior").
  assert.deepEqual(idsOf('kalafiora'), ['zapiekanka', 'makaron']);
  assert.deepEqual(idsOf('kalafior'), ['makaron', 'zapiekanka']);
});

test('wiele słów = I z mieszanymi dopasowaniami; grupa przepisu = najsłabsze dopasowanie', () => {
  assert.deepEqual(idsOf('ser kalafiorem'), ['zapiekanka']);       // ser dokładnie, kalafiorem rdzeniem
  assert.deepEqual(run('cheddar klafior'), { ids: ['zapiekanka'], corrected: 'cheddar kalafior' });
  assert.deepEqual(idsOf('jajka pomidor'), []);
  // dokładne + rdzeń w jednym przepisie = grupa rdzenia; samo dokładne wyżej
  const two = [mk('a', { title: 'kalafior zupa' }), mk('b', { title: 'kalafiorem zupa' })];
  assert.deepEqual(searchIndex(two, 'zupa kalafiorem', buildDictionary(two)).results.map((e) => e.id), ['b', 'a']);
});

test('wydajność: 1000 przepisów — słownik raz, wyszukiwanie z literówką szybko', () => {
  const big = syntheticIndex(1000);
  let t = process.hrtime.bigint();
  const dict = buildDictionary(big);
  const dictMs = Number(process.hrtime.bigint() - t) / 1e6;
  t = process.hrtime.bigint();
  const queries = ['klafior', 'ziemnaiki', 'pomidorow', 'kalafiorem', 'ser', 'zupa krem', 'cauliflwer'];
  queries.forEach((q) => searchIndex(big, q, dict));
  const searchMs = Number(process.hrtime.bigint() - t) / 1e6 / queries.length;
  assert.ok(searchMs < 50, 'średnio ' + searchMs.toFixed(1) + ' ms na wyszukiwanie');
  assert.ok(dict.length > 100);
});
