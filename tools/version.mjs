// Numer wersji aplikacji. Jedyne źródło prawdy: pole "version" w package.json (np. 0.1.0).
// Na stronie pokazujemy krótko: 0.1.0 → „v0.1", 0.1.2 → „v0.1.2".
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

export const VERSION_MARK = '{{VERSION}}';
// Identyfikator buildu: pełny (adresy danych, porównanie z /version.json) i krótki (napis w rogu).
export const BUILD_MARK = '{{BUILD}}';
export const BUILD_SHORT_MARK = '{{BUILD_SHORT}}';

export function displayVersion(version) {
  const m = /^(\d+)\.(\d+)\.(\d+)$/.exec(version);
  if (!m) throw new Error('package.json: niepoprawne pole version "' + version + '" — oczekiwano np. 0.1.0');
  return 'v' + m[1] + '.' + m[2] + (m[3] === '0' ? '' : '.' + m[3]);
}

export function versionFromPackageJson(fieldPath) {
  return displayVersion(JSON.parse(readFileSync(fieldPath, 'utf8')).version);
}

// 8 znaków hex ze skrótu podanych treści (kolejność ma znaczenie).
export function buildId(parts) {
  const h = createHash('sha256');
  parts.forEach((c) => h.update(String(c.length) + ':' + c));
  return h.digest('hex').slice(0, 8);
}

export function injectVersion(html, appVersion, build) {
  return html.split(VERSION_MARK).join(appVersion)
    .split(BUILD_SHORT_MARK).join(build.slice(0, 4))
    .split(BUILD_MARK).join(build);
}
