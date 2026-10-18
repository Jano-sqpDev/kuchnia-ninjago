// Sama walidacja przepisów, bez budowania strony: npm run validate
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { loadRecipes } from './validate.mjs';

const recipesDir = process.env.KITCHEN_RECIPES_DIR || join(dirname(fileURLToPath(import.meta.url)), '..', 'recipes');
const { recipes, errors, warnings } = loadRecipes(recipesDir);

// Ostrzeżenia (tłumaczenie EN, tagi bez tłumaczenia) nie zmieniają kodu wyjścia — przepis i tak się publikuje.
if (warnings.length) {
  console.warn('\nOstrzeżenia (' + warnings.length + ') — przepisy się publikują, ale czegoś im brakuje (tłumaczenie EN, tagi, znaczniki):\n');
  warnings.forEach((w) => console.warn('  ⚠ ' + w));
  console.warn('');
}

if (errors.length) {
  console.error('\nBłędy w przepisach (' + errors.length + '):\n');
  errors.forEach((e) => console.error('  ✘ ' + e));
  console.error('');
  process.exit(1);
}
console.log('Walidacja OK — przepisy: ' + recipes.length + (warnings.length ? ', ostrzeżenia: ' + warnings.length : ''));
