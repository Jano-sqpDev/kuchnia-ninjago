# Przepisy — kuchenny wyświetlacz na iPadzie

Statyczna strona z moimi własnymi przepisami (wpisanymi ręcznie albo wygenerowanymi przez Claude'a / ChatGPT), wyświetlana na starym iPadzie powieszonym w kuchni. Przepisy z Cookidoo **nie** trafiają tutaj — mam je na panelu TM6.

Ja (Janusz) nie piszę kodu ani nie konfiguruję niczego ręcznie poza kontami. Wszystko robisz Ty. Pracujemy etapami — patrz „Kolejność pracy" na dole.

---

## Urządzenie docelowe — NAJWAŻNIEJSZE OGRANICZENIE

- **iPad Air 1. generacji (2013), model MD792B/A, iOS 12.5.8 — ostatni możliwy.**
- Przeglądarka: **Safari 12**. 1 GB RAM — Safari często przeładowuje strony w tle.
- Ekran 9,7", 1024×768 pt (Retina 2048×1536). Używany w pionie i w poziomie.

Wszystko, co trafia do przeglądarki, musi działać na Safari 12. W razie wątpliwości: nie używaj.

### JavaScript (kod kliencki)
- Maksymalnie ES2017. Jeden zwykły `<script>` (bez `type="module"`), bez frameworków (żadnego React/Vue/Svelte/Alpine itp.), bez zależności z npm w kodzie klienckim.
- **Zakazane:** `?.`, `??`, pola i metody prywatne klas (`#x`), `Promise.allSettled`, `String.replaceAll`, `matchAll`, lookbehind w regexach (`(?<=`, `(?<!`), dynamiczny `import()`.
- Siatka bezpieczeństwa: przepuść kod kliencki przez `esbuild --target=safari12` przy buildzie.
- `localStorage` zawsze w `try/catch`.
- Bez service workera.

### CSS
- Dozwolone: Flexbox, Grid, zmienne CSS, `position: -webkit-sticky; position: sticky`.
- **Zakazane:** `gap` we flexboxie (w Grid jest OK), `aspect-ratio`, `clamp()`/`min()`/`max()`, `:is()`/`:where()`/`:has()`, `inset`, kolory `lab()/lch()/color-mix()`.
- Odstępy we flexboxie przez marginesy.

### Obrazy
- Opcjonalne. Tylko **JPEG/PNG — WebP i AVIF nie działają na Safari 12.**
- Maks. ~1200 px dłuższego boku, skompresowane.

### HTTPS
- Certyfikat hostingu musi być akceptowany przez iOS 12 — sprawdzamy to na prawdziwym iPadzie w Etapie 1, zanim cokolwiek zbudujemy.

---

## Architektura

- **Repo:** GitHub, przepisy jako pliki w repo. **Bez bazy danych.**
- **Hosting:** Netlify (domyślnie) lub Cloudflare Pages, auto-deploy po każdym pushu na `main`. Jeśli certyfikat nie działa na iPadzie, zmieniamy hosting.
- **Adres produkcyjny:** https://kuchnia-ninjago.netlify.app
- **Pułapka Netlify:** nowy projekt bywa domyślnie **prywatny** (Project configuration → General → Visitor access). Wtedy iPad dostaje stronę logowania Netlify, której Safari 12 nie renderuje — widać tylko białą stronę. Przy białej stronie najpierw sprawdź, czy widoczność to Public.
- **Pułapka Netlify:** na darmowym planie Netlify blokuje buildy („unrecognized Git contributor”), jeśli autor commitów to inne konto niż właściciel repo. Tutaj wszystko jest na **Jano-sqpDev** (właściciel repo, konto podpięte w Netlify i autor commitów) — nie zmieniaj `git config` user.name/user.email.
- **Commit i push robisz Ty.** Po każdej zakończonej pracy i przejściu builda: commit z opisem (pierwsza linia = krótkie podsumowanie, pusta linia, potem punkty), potem `git push`. Jeśli push się nie uda (np. brak uprawnień), nie kombinuj — napisz, co zwrócił git, a ja wypchnę przez GitHub Desktop.
- **Generator:** Eleventy (11ty) albo prosty własny skrypt Node — wynik to czysty statyczny HTML + jeden mały plik JS + CSS.
- **Wyszukiwanie po stronie klienta:** build generuje `search.json`, iPad pobiera go raz i filtruje lokalnie. Kolekcja nie przekroczy ~1000 przepisów.
- Projekt jest całkowicie oddzielny od mojej aplikacji gym (Supabase/Vercel) — nie używaj tamtych usług.

### Struktura katalogów (spójna z Yano Gym)

```
J:\APP_DEV\kuchnia-ninjago\      ← kontener, poza repo: mockupy, robocze logi dev-*.txt
└── app\                       ← repo git (GitHub: Jano-sqpDev/kuchnia-ninjago), tu npm i CC
    ├── CLAUDE.md              ← ten plik, wersjonowany razem z kodem
    ├── README.md
    ├── docs\                  ← mockupy HTML, notatki projektowe
    ├── recipes\               ← <slug>.md, jeden plik na przepis; zdjęcia w recipes\img\
    ├── src\                   ← szablony, client JS, CSS
    ├── public\                ← ikony ekranu początkowego, statyczne pliki
    ├── tools\                 ← skrypty buildu i walidacji (*.mjs)
    ├── tests\                 ← testy node:test (*.test.mjs), bez frameworka
    ├── package.json
    └── .gitignore             ← node_modules, katalog wyjściowy buildu, .env*
```

- Komentarze w `.gitignore` i dokumentacja po polsku.
- Testy jednostkowe w `tests\` dla walidatora i normalizacji wyszukiwania (np. „losos" → „łosoś", aliasy tagów).

---

## Format przepisu (schemat v1)

Jeden przepis = jeden plik `recipes/<slug>.md`. **Nazwa pliku to slug i trwałe ID przepisu** (małe litery a-z, cyfry, myślniki) — nie dodawaj pola `id`. Wszystkie dane w YAML front matter między `---`; treść Markdown pod spodem jest opcjonalna (luźne notatki, trafiają do JSON jako `notes`).

Safari 12 nigdy nie parsuje YAML — dostaje tylko JSON-y wygenerowane przy buildzie.

### Pola główne

| Pole | Typ | |
|---|---|---|
| `schema_version` | liczba, dokładnie `1` | wymagane |
| `title` | niepusty tekst | wymagane |
| `description` | tekst | opcjonalne |
| `servings` | liczba całkowita ≥ 1 | wymagane |
| `prep_minutes` | liczba całkowita ≥ 0 | wymagane |
| `cook_minutes` | liczba całkowita ≥ 0 — szacowany czas, nie musi być sumą czasów urządzeń | wymagane |
| `tags` | lista tekstów, może być `[]` | wymagane |
| `ingredients` | niepusta lista składników | wymagane |
| `steps` | niepusta lista kroków | wymagane |
| `ninja` | panel Ninja | wymagane ⇔ tag `ninja` |
| `image` | `img/<plik>.jpg/.jpeg/.png` — plik w `recipes/img/`, prawdziwy JPEG/PNG | opcjonalne |
| `source` | tekst, np. `"ChatGPT"` | opcjonalne |

Pole opcjonalne albo jest wypełnione, albo go nie ma — pusty tekst / `null` to błąd.

### Składniki — `ingredients[]`

| Pole | Typ | |
|---|---|---|
| `name` | niepusty tekst | wymagane |
| `amount` | liczba > 0 (YAML: `1.5`, nie `"1,5"`) | opcjonalne |
| `unit` | niepusty tekst: `g`, `ml`, `szt`, `łyżeczka`… | wymagane, gdy jest `amount`; bez `amount` zabronione |
| `note` | tekst, np. „drobno posiekana” | opcjonalne |
| `group` | tekst, np. „Sos” — grupowanie na liście | opcjonalne |

Składnik bez ilości jest OK (np. `- name: "sól"`).

### Kroki — `steps[]`

Numer kroku wynika z kolejności na liście — nie dodawaj numerów ani ID kroków.

**Ilości tylko na liście składników** — w tekście kroków bez liczb ilości (np. „wlej wodę”, nie „wlej 500 ml wody”), żeby przeliczanie porcji działało.

| Pole | Typ | |
|---|---|---|
| `text` | niepusty tekst | wymagane |
| `tm6` | ustawienia TM6 (niżej) | opcjonalne |
| `internal_temp_c` | liczba 1–100 — docelowa temperatura w środku potrawy | opcjonalne |
| `timer_seconds` | liczba całkowita > 0 | opcjonalne |

`internal_temp_c` dodawaj przy drobiu, wieprzowinie i większych kawałkach mięsa. Należy do kroku, nie do panelu urządzenia. Wyświetlaj tylko tam, gdzie jest wypełnione.

### Ninja Foodi MAX Dual Zone DZ400UK — `ninja`

Dwie szuflady, **bez sondy temperatury**. Jeden panel na cały przepis, nie przy krokach.

- `mode`: `sync` | `match` | `independent` | `single`
  - `sync` — dwie strefy, mogą mieć różne ustawienia, kończą razem,
  - `match` — dwie strefy z identycznymi `function` / `temp_c` / `minutes`,
  - `independent` — dwie niezależne strefy,
  - `single` — tylko `zone1`, `zone2` zabroniona.
- `zone1` wymagana; `zone2` wymagana dla `sync`/`match`/`independent`.
- Każda strefa:
  - `label` — opcjonalny tekst: co jest w szufladzie (np. „Ziemniaki”),
  - `function` — **dokładnie** jedna z: `Air Fry`, `Max Crisp`, `Roast`, `Bake`, `Reheat`, `Dehydrate`,
  - `temp_c` — liczba 40–240,
  - `minutes` — liczba całkowita > 0.

### Thermomix TM6 — `steps[].tm6`

Ustawienia **per krok**, bo zmieniają się w trakcie gotowania.

| Pole | Typ | |
|---|---|---|
| `duration_seconds` | liczba całkowita > 0 | wymagane |
| `temperature` | liczba 37–120 albo dokładnie `Varoma`; brak pola = bez grzania | opcjonalne |
| `speed` | 1–10 co 0.5 (np. `1.5`), `spoon` albo `turbo` | wymagane, chyba że jest `mode` |
| `reverse` | `true` / `false` (domyślnie `false`) | opcjonalne |
| `mode` | tekst informacyjny, np. „Wyrabianie” — tryby bez ustawianych obrotów | opcjonalne |

### Tagi

- Małe litery, po polsku (`deser`, `kurczak`, `łosoś`), bez duplikatów. Normalizacja (ogonki, ł → l) dzieje się tylko w wyszukiwarce.
- Tagi urządzeń (kanoniczne): `ninja`, `tm6`. Nie zapisuj `thermomix`, `airfryer`, `air fryer`, `af` — to aliasy działające tylko w wyszukiwarce.
- `ninja` ⇔ jest panel `ninja`. `tm6` ⇔ co najmniej jeden krok ma `tm6`.
- Przepis może mieć oba tagi urządzeń albo żaden (np. desery).

### Przykład

```yaml
---
schema_version: 1
title: "Ziemniaczki i brokuły Ninja SYNC"
description: "Dwie szuflady, wspólne zakończenie."
servings: 2
prep_minutes: 10
cook_minutes: 22
tags: [ninja, warzywa, dodatek]
source: "ChatGPT"

ingredients:
  - name: "małe ziemniaki"
    amount: 500
    unit: g
  - name: "oliwa"
    amount: 15
    unit: g
    group: "Marynata"
  - name: "sól"

ninja:
  mode: sync
  zone1:
    label: "Ziemniaki"
    function: "Air Fry"
    temp_c: 195
    minutes: 22
  zone2:
    label: "Brokuły"
    function: "Air Fry"
    temp_c: 180
    minutes: 10

steps:
  - text: "Ustaw obie strefy według panelu Ninja. Włącz SYNC, następnie START."
  - text: "Zblenduj sos."
    tm6:                      # wymaga tagu tm6
      duration_seconds: 30
      speed: 7
  - text: "Gotuj na parze."
    tm6:
      duration_seconds: 1080
      temperature: Varoma
      speed: 1
      reverse: false
  - text: "Sprawdź mięso termometrem."
    internal_temp_c: 75
---
Notatki: z czosnkiem jeszcze lepsze.
```

Pełne przykłady: `recipes/ziemniaczki-brokuly-sync.md` (Ninja SYNC), `recipes/warzywa-varoma.md` (TM6 z Varomą), `recipes/deser-twarogowy.md` (bez urządzeń).

### Walidacja przy buildzie

`npm run build` (i `npm run validate`) **kończy się błędem** (kod wyjścia 1, Netlify nie publikuje), gdy cokolwiek łamie reguły powyżej, m.in.: zły YAML, brak wymaganego pola, zły typ, **nieznany klucz na dowolnym poziomie**, powtórzony slug, niezgodność tagów urządzeń z danymi, `match` z różnymi strefami, złe parametry TM6, zdjęcie nieistniejące / nie JPEG-PNG. Walidator niczego nie poprawia sam.

Komunikat: `plik.md → ścieżka.pola: przyczyna`, np. `warzywa-varoma.md → steps[2].tm6.speed: niepoprawna wartość 11 …` (indeksy list od 0, czyli `steps[2]` = krok 3).

### Wynik buildu

- `_site/search.json` — lekki indeks (lista + wyszukiwanie): `id` (slug), `title`, `tags`, `ingredients` (nazwy), `ninja_functions`, `servings`, `prep_minutes`, `cook_minutes`, `thumb` (miniatura, tylko gdy jest zdjęcie), `text` (znormalizowany tekst do wyszukiwania, z aliasami tagów).
- `_site/data/<slug>.json` — pełne dane przepisu (`id` + pola z YAML + `notes`), pobierane dopiero po wybraniu przepisu. `image` to tu adres dużej wersji zdjęcia, `thumb` — miniatury.
- `_site/img/<nazwa>-300-<skrót>.jpg` i `-1200-` — miniatura i duża wersja zdjęcia (JPEG, dłuższy bok 300 / 1200 px, małych nie powiększa; `tools/zdjecia.mjs`). Skrót treści w nazwie: po podmianie zdjęcia Safari nie pokaże starego. Źródła z `recipes/img/` nie trafiają na stronę.
- `_site/p/<slug>/index.html` i `_site/404.html` — ta sama powłoka aplikacji co `index.html`; widok wybiera `app.js` po adresie.
- `_site/app.js` — `src/app.js` po `esbuild --target=safari12` (błąd → build przerwany); `_site/app.css` bez zmian.

Polecenia: `npm run validate` (sama walidacja), `npm run build`, `npm test`.

---

## Wygląd i działanie (widok kuchenny)

- Interfejs po polsku. Jednostki metryczne, °C.
- Czytelność z odległości: tekst bazowy ≥ 20 px, ustawienia urządzeń wyraźnie większe. Cele dotyku ≥ 44 pt. Wysoki kontrast. Ręczny przełącznik jasny/ciemny (zapamiętany w `localStorage`).
- **Strona główna:** pole wyszukiwania na górze, filtry-chipy (`Ninja`, `TM6`, funkcje Ninja), lista przepisów.
- **Strona przepisu:**
  1. Tytuł, porcje, tagi.
  2. **Panel Ninja** (jeśli jest) — wygląda jak wyświetlacz frytkownicy: dwie kolumny Strefa 1 / Strefa 2, funkcja + temp + czas dużą czcionką, znaczek SYNC/MATCH, nad każdą strefą `label` (co jest w szufladzie).
  3. Składniki (z grupami).
  4. Kroki, numerowane. Przy kroku z `tm6` — mały panel: czas · temp · obroty · ↺ (wsteczne). Przy `internal_temp_c` — znaczek „🌡 75°C w środku".
- Każdy przepis ma własny URL (`/p/<slug>/`). Dotknięcie kroku zaznacza go jako bieżący (`#krok-3` w URL + `localStorage`).
- **Odporność na przeładowania:** po przeładowaniu Safari lub ponownym otwarciu z ekranu początkowego strona wraca do ostatniego przepisu i kroku (zapamiętane w `localStorage`).
- **Zapamiętywanie stanu — decyzja z testów Etapu 1 (T4):** localStorage, ciasteczko i IndexedDB zachowały się na iPadzie identycznie, a zapisane dane przetrwały zamknięcie aplikacji. Po otwarciu z ikony iOS 12 czasem pokazuje stronę bez ponownego ładowania (kod startowy się nie wykonuje). Dlatego używamy **localStorage** i obsługujemy **oba warianty**:
  1. stan zapisywany **od razu** przy każdym dotknięciu kroku / zmianie przepisu (nie dopiero przy zamykaniu),
  2. stan odtwarzany przy załadowaniu strony,
  3. obsługa powrotu strony bez przeładowania: `pageshow` (także z `event.persisted`) i `visibilitychange` — przy powrocie odczytaj stan z localStorage i odśwież widok.
- Tryb „aplikacji": `apple-mobile-web-app-capable`, `apple-mobile-web-app-status-bar-style`, `apple-touch-icon` 152×152 i 167×167, poprawny `viewport`. Po „Dodaj do ekranu początkowego" ma się otwierać bez paska Safari.
- Nawigacja wstecz musi być w interfejsie (w trybie pełnoekranowym nie ma przycisku Wstecz przeglądarki).

## Wyszukiwanie

- Build generuje `search.json` (pola opisane w „Wynik buildu”). Logika normalizacji i dopasowania jest w `tools/szukaj.mjs` (ES2017, gotowa do przeniesienia do JS na iPadzie).
- Normalizacja zapytania i danych: małe litery, usunięcie znaków diakrytycznych przez `normalize('NFD')` + usunięcie znaków łączących, **plus ręczne mapowanie `ł→l`** (NFD nie rozkłada „ł"). „losos" ma znaleźć „łosoś".
- Rozwijanie aliasów tagów (patrz wyżej).
- Wiele słów = AND. Dopasowanie po fragmencie słowa.
- Filtry-chipy łączą się z wyszukiwaniem.
- Tolerancja literówek: na razie nie. Jeśli kiedyś, to własna prosta logika lub biblioteka sprawdzona na Safari 12.

---

## Dodawanie przepisów (codzienny workflow)

Wklejam Ci przepis (często od Claude'a lub ChatGPT) z poleceniem „dodaj do przepisów". Ty:
1. Przerabiasz go na format powyżej (wyciągasz ustawienia Ninja do panelu, ustawienia TM6 do kroków, dodajesz sensowne tagi i `internal_temp_c` tam, gdzie pasuje).
   Ilości tylko na liście składników — w tekście kroków bez liczb ilości („wlej wodę”, nie „wlej 500 ml wody”), żeby przeliczanie porcji działało.
2. Jeśli czegoś brakuje lub jest niejednoznaczne (np. brak temperatury), pytasz — nie zgadujesz ustawień urządzeń.
3. Uruchamiasz build z walidacją, commit, push.
4. Odpowiadasz zgodnie z „Format raportu" (w „Co zrobiłem": dodane + slug).

---

## Wersjonowanie

- **Jedno źródło prawdy:** pole `version` w `package.json` (semver `X.Y.Z`, np. `0.1.0`). Build wstrzykuje je w miejsce znacznika `{{WERSJA}}` do każdej strony aplikacji (`src/*.html`); strona bez znacznika przerywa build.
- Na stronie numer jest wyświetlany krótko: `0.1.0` → **v0.1**, `0.1.2` → **v0.1.2** — mały, szary, w prawym górnym rogu, nie zasłania przycisków i nie przechwytuje dotyku. Służy do sprawdzenia na iPadzie, czy Safari nie trzyma starej wersji z pamięci.
- **Kiedy podbijać:**
  - nowa funkcja lub etap → środkowa cyfra: `0.1` → `0.2` (`0.1.x` → `0.2.0`),
  - poprawki wizualne i drobne błędy, także zmiany jednoliniowe → łatka: `0.1` → `0.1.1` → `0.1.2`,
  - zmiany **wyłącznie** w dokumentacji (`CLAUDE.md`, `docs/`, w tym mockup) → **bez** podbijania.
- Wersję podbijasz w tym samym commicie co zmianę.
- Start: **v0.1** = stan po Etapie 2.

---

## Format raportu

Każdą odpowiedź, po której czekasz na mnie, zaczynaj jednym z nagłówków:
- `## ✅ SKOŃCZYŁEM` — praca zakończona, raport poniżej,
- `## ⏸ CZEKAM NA CIEBIE` — potrzebujesz mojej decyzji, zgody albo informacji (napisz od razu, czego dokładnie),
- `## ❌ PRZERWANE` — błąd albo coś, czego nie da się dokończyć.

Krótkie odpowiedzi w trakcie pracy — bez nagłówka.

Każdą odpowiedź po zakończonej pracy formatuj tak (pod nagłówkiem `## ✅ SKOŃCZYŁEM`):

```
## Co zrobiłem
Krótkie punkty, jedna zmiana = jeden punkt. Bez długich opisów technicznych, chyba że o nie zapytam.

## Co musisz zrobić
Numerowana lista moich kroków (klikanie w Netlify, ręczny push, jeśli Twój się nie udał, itp.).

## Do sprawdzenia na iPadzie
Numerowana lista testów z oczekiwanym wynikiem przy każdym.

Wersja: v<numer> (podbita / bez zmian — tylko dokumentacja)
Commit: <hash> — <pierwsza linia commita> — push: udany / nieudany (+ co zwrócił git)
```

Zasady:
- Wszystko, co mam skopiować (adresy, komendy, tekst do wklejenia), zawsze w bloku kodu.
- Sekcje, które nie mają treści, pomijaj.
- Na końcu jedno zdanie: co jest następnym krokiem.

---

## Kolejność pracy

Mam plan Pro z limitami — **jeden etap na sesję**. Po każdym etapie zatrzymaj się, powiedz mi, co mam sprawdzić na iPadzie, i czekaj.

1. ✅ **Hello world + test iPada** (zamknięty: HTTPS, pełny ekran, obrót i pamięć działają na iPadzie). Minimalna strona, deploy. Repo git i zdalne repo na GitHubie zwykle zakłada już skrypt startowy — sprawdź `git remote -v` i zakładaj tylko to, czego brakuje. Ja sprawdzam na iPadzie: czy HTTPS działa, czy „Dodaj do ekranu początkowego" otwiera pełny ekran.
2. ✅ **Format + walidacja + 3 przykładowe przepisy:** jeden z Ninja (sync), jeden z TM6 (kroki z ustawieniami, jeden z `temperature: Varoma`), jeden deser bez urządzeń.
3. **Widok kuchenny:** lista + strona przepisu z panelami, zapamiętywanie stanu, przełącznik jasny/ciemny.
   - **UI według `docs/mockup-ui-v1.html`** (zaakceptowany projekt; podgląd na żywo: `/mockup.html`). Poprawki oznaczone „v0.2.1, zastępuje mockup” mają pierwszeństwo przed mockupem:
     - lista z miniaturami zdjęć,
     - duże zdjęcie przy przepisie,
     - zdjęcie na pełny ekran otwiera się **tylko z miniatury** przy przepisie („⤢ Powiększ”) — w górnym pasku **nie ma** przycisku „📷 Zdjęcie” (v0.2.1, zastępuje mockup),
     - panel Ninja **zawsze ciemny** (także w jasnym motywie) — jak wyświetlacz frytkownicy,
     - bieżący krok wyróżniony świecącym pierścieniem.
   - **Zdjęcia:** źródło JPEG/PNG w `recipes/img/`; build sam robi dwie wersje JPEG — miniaturę ~300 px i dużą ~1200 px (dłuższy bok).
   - **Zasady Etapu 3 (dodatkowo):**
     - Panel Ninja **przypięty pod paskiem** — przewija się tylko treść pod nim.
     - **Panel TM6** przypięty pod paskiem (pod panelem Ninja, jeśli przepis ma oba): trzy równe tarcze — czas, temperatura (lub „Varoma”, lub wyszarzone „bez grzania”), obroty (z „↺ wsteczne”, jeśli `reverse`); tryb TM6 (`mode`) w nagłówku panelu.
       - Pokazuje ustawienia **bieżącego** kroku i aktualizuje się przy zmianie kroku (bez przerysowania ekranu).
       - Gdy bieżący krok nie ma TM6: tarcze puste („—”, wyszarzone), w nagłówku „Ten krok bez TM6”. Panel zostaje na miejscu i ma tę samą wysokość (ekran nie skacze). **Bez** „Następny krok TM6” / „Ostatni krok TM6” (v0.2.1, zastępuje mockup).
       - Mocny kontrast, czytelny z ~1 m także przy jasnym motywie reszty strony: jasna zieleń pierścieni i nagłówka, białe cyfry na tarczach, gruby pierścień (v0.2.1, zastępuje mockup).
       - Chipy TM6 w ramce kroku zostają.
     - Zmiana bieżącego kroku **nie przerysowuje ekranu** ani nie resetuje przewinięcia — aktualizuj tylko elementy kroków.
     - **Pułapka iOS 12 (dotyk):** dotknięcie elementu bez `cursor: pointer` nie wysyła zdarzenia `click` do nasłuchu na `document` (event delegation). Wszystko, co reaguje na dotyk (karty, kroki, zdjęcie, przyciski), ma `cursor: pointer` albo jest `<button>` / `<a>`.
     - **Przeliczanie porcji:** przyciski − / + przy liczbie porcji (zakres 1–12). Ilości przeliczane z zaokrąglaniem: `szt` i łyżki do połówek, `g`/`ml` do okrągłych wartości; składniki bez ilości bez zmian. Link „przepis: N” wraca do oryginalnej liczby porcji. Wybrana liczba porcji zapamiętywana razem z krokiem. Ustawienia Ninja i TM6 się **nie zmieniają**; przy zmienionej liczbie porcji pod panelem Ninja pojawia się uwaga.
4. **Wyszukiwarka i filtry.**
5. (Później, na moje życzenie) tryb gotowania krok po kroku, minutniki przy krokach, skalowanie porcji.

Ręcznie robię tylko: założenie konta na hostingu i połączenie go z repo GitHub.
