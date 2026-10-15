// Zdjęcia przepisów: ze źródła w recipes/img/ (JPEG/PNG) build robi dwie wersje JPEG —
// miniaturę (lista) i dużą (przepis, podgląd na pełny ekran). Bez powiększania małych zdjęć.
// W nazwie pliku jest skrót treści źródła, więc po podmianie zdjęcia Safari nie pokaże starego z pamięci.
import { readFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import sharp from 'sharp';

export const ROZMIARY = { thumb: 300, large: 1200 };

// img/a/udka.png → { thumb: 'img/a/udka-300-1a2b3c4d.jpg', large: 'img/a/udka-1200-1a2b3c4d.jpg' }
export function nazwyZdjec(image, zrodlo) {
  const skrot = createHash('sha256').update(zrodlo).digest('hex').slice(0, 8);
  const baza = image.replace(/\.(jpe?g|png)$/i, '');
  return {
    thumb: baza + '-' + ROZMIARY.thumb + '-' + skrot + '.jpg',
    large: baza + '-' + ROZMIARY.large + '-' + skrot + '.jpg',
  };
}

// Zapisuje obie wersje do katalogu wyjściowego, zwraca ścieżki URL (od „/").
export async function zrobZdjecia(recipesDir, image, out) {
  const zrodlo = readFileSync(join(recipesDir, image));
  const nazwy = nazwyZdjec(image, zrodlo);
  const wynik = {};
  for (const [rodzaj, bok] of Object.entries(ROZMIARY)) {
    const cel = join(out, nazwy[rodzaj]);
    mkdirSync(dirname(cel), { recursive: true });
    await sharp(zrodlo)
      .rotate() // orientacja z EXIF (zdjęcia z telefonu)
      .resize(bok, bok, { fit: 'inside', withoutEnlargement: true })
      .flatten({ background: '#ffffff' }) // przezroczystość PNG → białe tło
      .jpeg({ quality: rodzaj === 'thumb' ? 75 : 80, progressive: false, mozjpeg: true })
      .toFile(cel);
    wynik[rodzaj] = '/' + nazwy[rodzaj];
  }
  return wynik;
}
