// Numer wersji aplikacji. Jedyne źródło prawdy: pole "version" w package.json (np. 0.1.0).
// Na stronie pokazujemy krótko: 0.1.0 → „v0.1", 0.1.2 → „v0.1.2".
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

export const ZNACZNIK = '{{WERSJA}}';
// Identyfikator buildu: pełny (adresy danych, porównanie z /version.json) i krótki (napis w rogu).
export const ZNACZNIK_BUILDU = '{{BUILD}}';
export const ZNACZNIK_BUILDU_KROTKI = '{{BUILD_KROTKI}}';

export function wersjaWyswietlana(version) {
  const m = /^(\d+)\.(\d+)\.(\d+)$/.exec(version);
  if (!m) throw new Error('package.json: niepoprawne pole version "' + version + '" — oczekiwano np. 0.1.0');
  return 'v' + m[1] + '.' + m[2] + (m[3] === '0' ? '' : '.' + m[3]);
}

export function wersjaZPackageJson(sciezka) {
  return wersjaWyswietlana(JSON.parse(readFileSync(sciezka, 'utf8')).version);
}

// 8 znaków hex ze skrótu podanych treści (kolejność ma znaczenie).
export function idBuildu(czesci) {
  const h = createHash('sha256');
  czesci.forEach((c) => h.update(String(c.length) + ':' + c));
  return h.digest('hex').slice(0, 8);
}

export function wstawWersje(html, wersja, build) {
  return html.split(ZNACZNIK).join(wersja)
    .split(ZNACZNIK_BUILDU_KROTKI).join(build.slice(0, 4))
    .split(ZNACZNIK_BUILDU).join(build);
}
