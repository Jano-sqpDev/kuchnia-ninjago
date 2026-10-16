// Pomiar wyszukiwania na sztucznym indeksie (domyślnie 1000 przepisów): node tools/bench-search.mjs [liczba]
// Indeks budowany tym samym kodem co w buildzie (tools/output.mjs), więc pola text są jak w search.json.
import { pathToFileURL } from 'node:url';
import { searchEntry } from './output.mjs';
import { buildDictionary, searchIndex } from './search.mjs';

const WORDS = ['kalafior', 'brokuł', 'ziemniaki młode', 'pomidor', 'cebula', 'czosnek', 'marchew', 'cukinia', 'papryka czerwona', 'dynia',
  'łosoś', 'dorsz', 'krewetki', 'pierś z kurczaka', 'udka z kurczaka', 'wołowina mielona', 'schab', 'boczek', 'jajko', 'ser cheddar',
  'mozzarella', 'parmezan', 'twaróg', 'jogurt naturalny', 'śmietanka', 'masło', 'oliwa', 'mąka pszenna', 'ryż basmati', 'makaron penne',
  'kasza gryczana', 'soczewica', 'ciecierzyca', 'szpinak', 'rukola', 'pieczarki', 'bakłażan', 'por', 'seler naciowy', 'imbir',
  'cauliflower', 'broccoli', 'potatoes', 'tomato', 'onion', 'garlic', 'carrot', 'courgette', 'salmon', 'chicken breast'];
const TITLES = ['Zupa krem', 'Zapiekanka', 'Sałatka', 'Gulasz', 'Risotto', 'Curry', 'Placki', 'Pieczeń', 'Makaron', 'Leczo'];

// Deterministyczny pseudolosowy indeks (te same dane przy każdym uruchomieniu).
export function syntheticIndex(n) {
  let seed = 12345;
  const rnd = (k) => { seed = (seed * 1103515245 + 12345) % 2147483648; return (seed >>> 8) % k; };
  // Zmyślone słowa (np. nazwy odmian, marek), żeby słownik miał tysiące unikalnych słów — najgorszy przypadek dla literówek.
  const SYL = ['ka', 'la', 'fio', 'mi', 'dor', 'zie', 'nia', 'bro', 'ku', 'sze', 'pa', 'ry', 'to', 'we', 'gra', 'chu', 'lo', 'ten'];
  const madeUp = () => { let w = ''; const len = 3 + rnd(3); for (let s = 0; s < len; s++) w += SYL[rnd(SYL.length)]; return w; };
  const out = [];
  for (let i = 0; i < n; i++) {
    const ingredients = [];
    for (let j = 0; j < 12; j++) ingredients.push({ name: WORDS[rnd(WORDS.length)] + (j % 3 === 0 ? ' ' + madeUp() : '') });
    const title = TITLES[rnd(TITLES.length)] + ' ' + WORDS[rnd(WORDS.length)] + ' nr ' + i;
    const data = { title, tags: rnd(2) ? ['ninja', 'obiad'] : ['tm6', 'zupa'], ingredients,
      ninja: { mode: 'single', zone1: { function: 'Air Fry', temp_c: 180, minutes: 10 } } };
    out.push(searchEntry({ slug: 'p' + i, data }, null, { obiad: 'dinner', zupa: 'soup' }));
  }
  return out;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const n = Number(process.argv[2]) || 1000;
  const idx = syntheticIndex(n);
  const ms = (t) => (Number(process.hrtime.bigint() - t) / 1e6).toFixed(2);
  let t = process.hrtime.bigint();
  const dict = buildDictionary(idx);
  console.log('Przepisy: ' + n + ', słownik: ' + dict.length + ' słów, budowa słownika: ' + ms(t) + ' ms');
  for (const q of ['ser', 'kalafior', 'kalafiorem', 'pomidorow', 'klafior', 'ziemnaiki', 'cauliflwer', 'zupa krem klafior', 'xyzxyz']) {
    t = process.hrtime.bigint();
    let r;
    for (let k = 0; k < 20; k++) r = searchIndex(idx, q, dict);
    console.log('  „' + q + '": ' + (Number(process.hrtime.bigint() - t) / 1e6 / 20).toFixed(2) + ' ms, wyniki: ' + r.results.length + (r.corrected ? ', poprawka: ' + r.corrected : ''));
  }
}
