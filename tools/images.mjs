// Zdjęcia przepisów: ze źródła w recipes/img/ (JPEG/PNG/HEIC) build robi dwie wersje JPEG —
// miniaturę (lista) i dużą (przepis, podgląd na pełny ekran). Bez powiększania małych zdjęć.
// W nazwie pliku jest skrót treści źródła, więc po podmianie zdjęcia Safari nie pokaże starego z pamięci.
// HEIC (zdjęcia z iPhone'a): sharp z npm nie ma dekodera HEVC, więc najpierw heic-decode (libheif w WASM).
import { readFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import sharp from 'sharp';
import decodeHeic from 'heic-decode';
import { imageKind } from './validate.mjs';

export const SIZES = { thumb: 300, large: 1200 };

// img/a/Udka.PNG → { thumb: 'img/a/udka-300-1a2b3c4d.jpg', large: 'img/a/udka-1200-1a2b3c4d.jpg' }
export function imageNames(image, src) {
  const shortHash = createHash('sha256').update(src).digest('hex').slice(0, 8);
  const base = image.replace(/\.(jpe?g|png|heic|heif)$/i, '').toLowerCase();
  return {
    thumb: base + '-' + SIZES.thumb + '-' + shortHash + '.jpg',
    large: base + '-' + SIZES.large + '-' + shortHash + '.jpg',
  };
}

// Źródło jako wejście dla sharp; HEIC dekodowany do surowych pikseli RGBA.
async function sharpInput(src) {
  if (imageKind(src.slice(0, 12)) !== 'heic') return () => sharp(src).rotate(); // rotate(): orientacja z EXIF
  let decoded;
  try {
    decoded = await decodeHeic({ buffer: src });
  } catch (e) {
    throw new Error('nie udało się przekonwertować zdjęcia HEIC (' + e.message + ') — zapisz je jako JPEG');
  }
  const raw = { width: decoded.width, height: decoded.height, channels: 4 };
  return () => sharp(Buffer.from(decoded.data.buffer, decoded.data.byteOffset, decoded.data.byteLength), { raw });
}

// Zapisuje obie wersje do katalogu wyjściowego, zwraca ścieżki URL (od „/").
// Przy błędzie (uszkodzony plik, HEIC nie do odczytania) rzuca wyjątek z opisem po polsku.
export async function makeImages(recipesDir, image, out) {
  const src = readFileSync(join(recipesDir, image));
  const names = imageNames(image, src);
  const input = await sharpInput(src);
  const result = {};
  for (const [kind, side] of Object.entries(SIZES)) {
    const target = join(out, names[kind]);
    mkdirSync(dirname(target), { recursive: true });
    await input()
      .resize(side, side, { fit: 'inside', withoutEnlargement: true })
      .flatten({ background: '#ffffff' }) // przezroczystość PNG → białe tło
      .jpeg({ quality: kind === 'thumb' ? 75 : 80, progressive: false, mozjpeg: true })
      .toFile(target);
    result[kind] = '/' + names[kind];
  }
  return result;
}
