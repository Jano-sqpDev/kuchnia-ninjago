// Zdjęcia przepisów: ze źródła w recipes/img/ (JPEG/PNG) build robi dwie wersje JPEG —
// miniaturę (lista) i dużą (przepis, podgląd na pełny ekran). Bez powiększania małych zdjęć.
// W nazwie pliku jest skrót treści źródła, więc po podmianie zdjęcia Safari nie pokaże starego z pamięci.
import { readFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import sharp from 'sharp';

export const SIZES = { thumb: 300, large: 1200 };

// img/a/udka.png → { thumb: 'img/a/udka-300-1a2b3c4d.jpg', large: 'img/a/udka-1200-1a2b3c4d.jpg' }
export function imageNames(image, src) {
  const shortHash = createHash('sha256').update(src).digest('hex').slice(0, 8);
  const base = image.replace(/\.(jpe?g|png)$/i, '');
  return {
    thumb: base + '-' + SIZES.thumb + '-' + shortHash + '.jpg',
    large: base + '-' + SIZES.large + '-' + shortHash + '.jpg',
  };
}

// Zapisuje obie wersje do katalogu wyjściowego, zwraca ścieżki URL (od „/").
export async function makeImages(recipesDir, image, out) {
  const src = readFileSync(join(recipesDir, image));
  const names = imageNames(image, src);
  const result = {};
  for (const [kind, side] of Object.entries(SIZES)) {
    const target = join(out, names[kind]);
    mkdirSync(dirname(target), { recursive: true });
    await sharp(src)
      .rotate() // orientacja z EXIF (zdjęcia z telefonu)
      .resize(side, side, { fit: 'inside', withoutEnlargement: true })
      .flatten({ background: '#ffffff' }) // przezroczystość PNG → białe tło
      .jpeg({ quality: kind === 'thumb' ? 75 : 80, progressive: false, mozjpeg: true })
      .toFile(target);
    result[kind] = '/' + names[kind];
  }
  return result;
}
