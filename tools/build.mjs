// Build: kopiuje src/ i public/ do _site/, waliduje przepisy z recipes/
// i generuje _site/search.json oraz _site/data/<slug>.json.
// Przy jakimkolwiek błędzie walidacji kończy się kodem 1 (Netlify nie opublikuje wersji).
import { cpSync, rmSync, mkdirSync, writeFileSync, readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, basename } from 'node:path';
import { loadRecipes } from './walidacja.mjs';
import { recipeJson, searchEntry } from './wynik.mjs';
import { ZNACZNIK, wersjaZPackageJson } from './wersja.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
// Zmienne środowiskowe tylko dla testów (katalog z przepisami testowymi, osobne wyjście).
const out = process.env.KUCHNIA_OUT_DIR || join(root, '_site');
const recipesDir = process.env.KUCHNIA_RECIPES_DIR || join(root, 'recipes');

// Pliki konfiguracyjne, które nigdy nie mogą trafić na publiczną stronę.
const WYKLUCZONE = new Set(['netlify.toml', '.gitkeep']);
const filter = (src) => !WYKLUCZONE.has(basename(src));

const wersja = wersjaZPackageJson(join(root, 'package.json'));

// Każda strona aplikacji (src/*.html) musi mieć znacznik wersji — bez niego build się przerywa.
const strony = readdirSync(join(root, 'src')).filter((p) => p.endsWith('.html'));
const bezWersji = strony.filter((p) => !readFileSync(join(root, 'src', p), 'utf8').includes(ZNACZNIK));
if (bezWersji.length) {
  console.error('\nBrak znacznika ' + ZNACZNIK + ' w: ' + bezWersji.map((p) => 'src/' + p).join(', ') + '\n');
  process.exit(1);
}

const { recipes, errors } = loadRecipes(recipesDir);
if (errors.length) {
  console.error('\nBłędy w przepisach (' + errors.length + '):\n');
  errors.forEach((e) => console.error('  ✘ ' + e));
  console.error('\nBuild przerwany — popraw przepisy i uruchom ponownie.\n');
  process.exit(1);
}

rmSync(out, { recursive: true, force: true });
mkdirSync(join(out, 'data'), { recursive: true });
cpSync(join(root, 'public'), out, { recursive: true, filter });
cpSync(join(root, 'src'), out, { recursive: true, filter });
strony.forEach((p) => {
  writeFileSync(join(out, p), readFileSync(join(root, 'src', p), 'utf8').split(ZNACZNIK).join(wersja));
});
// Zaakceptowany projekt UI do podglądu na iPadzie: /mockup.html
cpSync(join(root, 'docs', 'mockup-ui-v1.html'), join(out, 'mockup.html'));

recipes.sort((a, b) => a.data.title.localeCompare(b.data.title, 'pl'));
recipes.forEach((r) => {
  writeFileSync(join(out, 'data', r.slug + '.json'), JSON.stringify(recipeJson(r)));
  if (r.data.image) {
    mkdirSync(dirname(join(out, r.data.image)), { recursive: true });
    cpSync(join(recipesDir, r.data.image), join(out, r.data.image));
  }
});
writeFileSync(join(out, 'search.json'), JSON.stringify(recipes.map(searchEntry)));

console.log('Build OK → _site/ (' + wersja + ', przepisy: ' + recipes.length + ')');
