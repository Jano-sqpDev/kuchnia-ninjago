// Build: kopiuje src/ i public/ do _site/, waliduje przepisy z recipes/,
// generuje _site/search.json, _site/data/<slug>.json, zdjęcia (_site/img/), strony /p/<slug>/
// i _site/version.json z identyfikatorem buildu.
// Kod kliencki (src/app.js) przechodzi przez esbuild z celem Safari 12.
// Przy jakimkolwiek błędzie kończy się kodem 1 (Cloudflare Pages nie opublikuje wersji).
import { cpSync, rmSync, mkdirSync, writeFileSync, readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, basename } from 'node:path';
import { transformSync } from 'esbuild';
import { loadRecipes } from './validate.mjs';
import { recipeJson, searchEntry } from './output.mjs';
import { VERSION_MARK, BUILD_MARK, versionFromPackageJson, buildId, injectVersion } from './version.mjs';
import { makeImages } from './images.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
// Zmienne środowiskowe tylko dla testów (katalog z przepisami testowymi, osobne wyjście).
const out = process.env.KITCHEN_OUT_DIR || join(root, '_site');
const recipesDir = process.env.KITCHEN_RECIPES_DIR || join(root, 'recipes');

// Pliki, które nigdy nie mogą trafić na publiczną stronę.
const EXCLUDED = new Set(['.gitkeep']);
const filter = (src) => !EXCLUDED.has(basename(src));

const appVersion = versionFromPackageJson(join(root, 'package.json'));

// Każda strona aplikacji (src/*.html) musi mieć znaczniki wersji i buildu — bez nich build się przerywa.
const pages = readdirSync(join(root, 'src')).filter((p) => p.endsWith('.html'));
const missingMarks = pages.filter((p) => {
  const t = readFileSync(join(root, 'src', p), 'utf8');
  return !t.includes(VERSION_MARK) || !t.includes(BUILD_MARK);
});
if (missingMarks.length) {
  console.error('\nBrak znacznika ' + VERSION_MARK + ' lub ' + BUILD_MARK + ' w: ' + missingMarks.map((p) => 'src/' + p).join(', ') + '\n');
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
const recipeData = {};
const index = [];
for (const r of recipes) {
  const images = r.data.image ? await makeImages(recipesDir, r.data.image, out) : null;
  recipeData[r.slug] = JSON.stringify(recipeJson(r, images));
  index.push(searchEntry(r, images));
}
const searchJson = JSON.stringify(index);

// Identyfikator buildu: skrót wszystkiego, co pobiera iPad. Inny wynik → inny identyfikator,
// a aplikacja po wykryciu nowego identyfikatora w /version.json przeładowuje się (src/app.js).
const templates = Object.fromEntries(pages.map((p) => [p, readFileSync(join(root, 'src', p), 'utf8')]));
const build = buildId([appVersion, appJs, readFileSync(join(root, 'src', 'app.css'), 'utf8'), searchJson]
  .concat(Object.values(templates), Object.keys(recipeData).sort().map((s) => s + recipeData[s])));

Object.keys(recipeData).forEach((slug) => writeFileSync(join(out, 'data', slug + '.json'), recipeData[slug]));
writeFileSync(join(out, 'search.json'), searchJson);
writeFileSync(join(out, 'version.json'), JSON.stringify({ build, version: appVersion }));

const html = {};
pages.forEach((p) => {
  html[p] = injectVersion(templates[p], appVersion, build);
  writeFileSync(join(out, p), html[p]);
});
// Każdy przepis ma własny adres /p/<slug>/ — ta sama powłoka aplikacji, widok wybiera JS.
// 404.html to też powłoka: nieznany przepis pokaże komunikat w interfejsie zamiast pustej strony.
writeFileSync(join(out, '404.html'), html['index.html']);
recipes.forEach((r) => {
  mkdirSync(join(out, 'p', r.slug), { recursive: true });
  writeFileSync(join(out, 'p', r.slug, 'index.html'), html['index.html']);
});

console.log('Build OK → _site/ (' + appVersion + ' · ' + build.slice(0, 4) + ', przepisy: ' + recipes.length + ')');
