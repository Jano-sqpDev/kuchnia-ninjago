// Build: kopiuje src/ i public/ do _site/, waliduje przepisy z recipes/,
// generuje _site/search.json, _site/data/<slug>.json, zdjęcia (_site/img/), strony /p/<slug>/
// i _site/version.json z identyfikatorem buildu.
// Kod kliencki (src/app.js) przechodzi przez esbuild z celem Safari 12.
// Przy jakimkolwiek błędzie kończy się kodem 1 (Cloudflare Pages nie opublikuje wersji).
import { cpSync, rmSync, mkdirSync, writeFileSync, readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, basename } from 'node:path';
import { transformSync } from 'esbuild';
import { loadRecipes } from './walidacja.mjs';
import { recipeJson, searchEntry } from './wynik.mjs';
import { ZNACZNIK, ZNACZNIK_BUILDU, wersjaZPackageJson, idBuildu, wstawWersje } from './wersja.mjs';
import { zrobZdjecia } from './zdjecia.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
// Zmienne środowiskowe tylko dla testów (katalog z przepisami testowymi, osobne wyjście).
const out = process.env.KUCHNIA_OUT_DIR || join(root, '_site');
const recipesDir = process.env.KUCHNIA_RECIPES_DIR || join(root, 'recipes');

// Pliki, które nigdy nie mogą trafić na publiczną stronę.
const WYKLUCZONE = new Set(['.gitkeep']);
const filter = (src) => !WYKLUCZONE.has(basename(src));

const wersja = wersjaZPackageJson(join(root, 'package.json'));

// Każda strona aplikacji (src/*.html) musi mieć znaczniki wersji i buildu — bez nich build się przerywa.
const strony = readdirSync(join(root, 'src')).filter((p) => p.endsWith('.html'));
const bezWersji = strony.filter((p) => {
  const t = readFileSync(join(root, 'src', p), 'utf8');
  return !t.includes(ZNACZNIK) || !t.includes(ZNACZNIK_BUILDU);
});
if (bezWersji.length) {
  console.error('\nBrak znacznika ' + ZNACZNIK + ' lub ' + ZNACZNIK_BUILDU + ' w: ' + bezWersji.map((p) => 'src/' + p).join(', ') + '\n');
  process.exit(1);
}

const { recipes, errors } = loadRecipes(recipesDir);
if (errors.length) {
  console.error('\nBłędy w przepisach (' + errors.length + '):\n');
  errors.forEach((e) => console.error('  ✘ ' + e));
  console.error('\nBuild przerwany — popraw przepisy i uruchom ponownie.\n');
  process.exit(1);
}

// Siatka bezpieczeństwa dla Safari 12: esbuild obniża składnię, a przy czymś,
// czego nie da się obniżyć, przerywa build.
let appJs;
try {
  appJs = transformSync(readFileSync(join(root, 'src', 'app.js'), 'utf8'), {
    target: 'safari12', loader: 'js', charset: 'utf8', sourcefile: 'src/app.js',
  }).code;
} catch (e) {
  console.error('\nsrc/app.js nie przechodzi przez esbuild --target=safari12:\n' + e.message + '\n');
  process.exit(1);
}

rmSync(out, { recursive: true, force: true });
mkdirSync(join(out, 'data'), { recursive: true });
cpSync(join(root, 'public'), out, { recursive: true, filter });
cpSync(join(root, 'src'), out, { recursive: true, filter });
writeFileSync(join(out, 'app.js'), appJs);
// Zaakceptowany projekt UI do podglądu na iPadzie: /mockup.html
cpSync(join(root, 'docs', 'mockup-ui-v1.html'), join(out, 'mockup.html'));

// Dane przepisów (zdjęcia zapisują się od razu, JSON-y trzymamy do policzenia identyfikatora buildu).
recipes.sort((a, b) => a.data.title.localeCompare(b.data.title, 'pl'));
const dane = {};
const indeks = [];
for (const r of recipes) {
  const zdjecia = r.data.image ? await zrobZdjecia(recipesDir, r.data.image, out) : null;
  dane[r.slug] = JSON.stringify(recipeJson(r, zdjecia));
  indeks.push(searchEntry(r, zdjecia));
}
const searchJson = JSON.stringify(indeks);

// Identyfikator buildu: skrót wszystkiego, co pobiera iPad. Inny wynik → inny identyfikator,
// a aplikacja po wykryciu nowego identyfikatora w /version.json przeładowuje się (src/app.js).
const szablony = Object.fromEntries(strony.map((p) => [p, readFileSync(join(root, 'src', p), 'utf8')]));
const build = idBuildu([wersja, appJs, readFileSync(join(root, 'src', 'app.css'), 'utf8'), searchJson]
  .concat(Object.values(szablony), Object.keys(dane).sort().map((s) => s + dane[s])));

Object.keys(dane).forEach((slug) => writeFileSync(join(out, 'data', slug + '.json'), dane[slug]));
writeFileSync(join(out, 'search.json'), searchJson);
writeFileSync(join(out, 'version.json'), JSON.stringify({ build, version: wersja }));

const html = {};
strony.forEach((p) => {
  html[p] = wstawWersje(szablony[p], wersja, build);
  writeFileSync(join(out, p), html[p]);
});
// Każdy przepis ma własny adres /p/<slug>/ — ta sama powłoka aplikacji, widok wybiera JS.
// 404.html to też powłoka: nieznany przepis pokaże komunikat w interfejsie zamiast pustej strony.
writeFileSync(join(out, '404.html'), html['index.html']);
recipes.forEach((r) => {
  mkdirSync(join(out, 'p', r.slug), { recursive: true });
  writeFileSync(join(out, 'p', r.slug, 'index.html'), html['index.html']);
});

console.log('Build OK → _site/ (' + wersja + ' · ' + build.slice(0, 4) + ', przepisy: ' + recipes.length + ')');
