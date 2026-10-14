// Generuje ikony ekranu początkowego (PNG) bez zewnętrznych zależności.
// Uruchom: npm run ikony  → zapisuje do public/
import { writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const publicDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'public');

const TLO = [196, 74, 30];      // ceglasty pomarańcz
const TALERZ = [255, 248, 240]; // kremowa biel
const RANT = [232, 214, 196];

const crcTable = new Uint32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}

function ikona(size) {
  const c = size / 2;
  const rTalerz = size * 0.36;
  const rRant = size * 0.26;
  const raw = Buffer.alloc((size * 3 + 1) * size);
  let i = 0;
  for (let y = 0; y < size; y++) {
    raw[i++] = 0; // filtr: brak
    for (let x = 0; x < size; x++) {
      const d = Math.hypot(x + 0.5 - c, y + 0.5 - c);
      let col = TLO;
      if (d < rTalerz) col = d > rRant && d < rRant + size * 0.02 ? RANT : TALERZ;
      raw[i++] = col[0]; raw[i++] = col[1]; raw[i++] = col[2];
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 2; // 8 bit, RGB
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

for (const [name, size] of [
  ['apple-touch-icon-152.png', 152],
  ['apple-touch-icon-167.png', 167],
  ['apple-touch-icon.png', 180],
]) {
  writeFileSync(join(publicDir, name), ikona(size));
  console.log('zapisano', name);
}
