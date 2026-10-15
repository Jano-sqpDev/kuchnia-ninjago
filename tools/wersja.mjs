// Numer wersji aplikacji. Jedyne źródło prawdy: pole "version" w package.json (np. 0.1.0).
// Na stronie pokazujemy krótko: 0.1.0 → „v0.1", 0.1.2 → „v0.1.2".
import { readFileSync } from 'node:fs';

export const ZNACZNIK = '{{WERSJA}}';

export function wersjaWyswietlana(version) {
  const m = /^(\d+)\.(\d+)\.(\d+)$/.exec(version);
  if (!m) throw new Error('package.json: niepoprawne pole version "' + version + '" — oczekiwano np. 0.1.0');
  return 'v' + m[1] + '.' + m[2] + (m[3] === '0' ? '' : '.' + m[3]);
}

export function wersjaZPackageJson(sciezka) {
  return wersjaWyswietlana(JSON.parse(readFileSync(sciezka, 'utf8')).version);
}
