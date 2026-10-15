// Jedyna droga publikacji: npm run wypchnij
// Kolejno: brak niezacommitowanych zmian → wszystkie testy → build → git push.
// Pierwszy błąd przerywa całość (kod wyjścia 1) i NIC nie jest wypychane.
// Każdy krok sprawdzany po kodzie wyjścia, nie po tekście na wyjściu.
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function krok(nazwa, polecenie, args) {
  console.log('\n▶ ' + nazwa);
  const w = spawnSync(polecenie, args, { cwd: root, stdio: 'inherit', shell: process.platform === 'win32' });
  if (w.status !== 0) {
    console.error('\n✘ ' + nazwa + ' — nie udało się (kod ' + w.status + '). Push NIE został wykonany.\n');
    process.exit(1);
  }
}

const status = spawnSync('git', ['status', '--porcelain'], { cwd: root, encoding: 'utf8' });
if (status.status !== 0 || status.stdout.trim()) {
  console.error('\n✘ Są niezacommitowane zmiany (albo git nie działa) — najpierw commit. Push NIE został wykonany.\n' + (status.stdout || status.stderr));
  process.exit(1);
}

krok('Testy (npm test)', 'npm', ['test']);
krok('Build (npm run build)', 'npm', ['run', 'build']);
krok('Push (git push)', 'git', ['push']);
console.log('\n✔ Testy i build przeszły, push wykonany.\n');
