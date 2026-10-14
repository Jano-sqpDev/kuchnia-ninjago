// Build Etapu 1: kopiuje src/ i public/ do _site/.
// W kolejnych etapach tu dojdzie generowanie stron przepisów, walidacja i esbuild.
import { cpSync, rmSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, '_site');

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
cpSync(join(root, 'public'), out, { recursive: true });
cpSync(join(root, 'src'), out, { recursive: true });

console.log('Build OK → _site/');
