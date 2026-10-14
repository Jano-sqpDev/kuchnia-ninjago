// Build Etapu 1: kopiuje src/ i public/ do _site/.
// W kolejnych etapach tu dojdzie generowanie stron przepisów, walidacja i esbuild.
import { cpSync, rmSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, basename } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, '_site');

// Pliki konfiguracyjne, które nigdy nie mogą trafić na publiczną stronę.
const WYKLUCZONE = new Set(['netlify.toml', '.gitkeep']);
const filter = (src) => !WYKLUCZONE.has(basename(src));

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
cpSync(join(root, 'public'), out, { recursive: true, filter });
cpSync(join(root, 'src'), out, { recursive: true, filter });

console.log('Build OK → _site/');
