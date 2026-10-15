// Sama walidacja przepisów, bez budowania strony: npm run validate
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { loadRecipes } from './validate.mjs';

const recipesDir = process.env.KITCHEN_RECIPES_DIR || join(dirname(fileURLToPath(import.meta.url)), '..', 'recipes');
const { recipes, errors } = loadRecipes(recipesDir);

if (errors.length) {
  console.error('\nBłędy w przepisach (' + errors.length + '):\n');
  errors.forEach((e) => console.error('  ✘ ' + e));
  console.error('');
  process.exit(1);
}
console.log('Walidacja OK — przepisy: ' + recipes.length);
