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
- Opcjonalne. Do przeglądarki trafia tylko **JPEG — WebP i AVIF nie działają na Safari 12.**
- Maks. ~1200 px dłuższego boku, skompresowane. Źródła (JPEG/PNG/HEIC dowolnej wielkości) przerabia build.

### HTTPS
- Certyfikat hostingu musi być akceptowany przez iOS 12 — sprawdzamy to na prawdziwym iPadzie w Etapie 1, zanim cokolwiek zbudujemy.

---

## Architektura

- **Repo:** GitHub, przepisy jako pliki w repo. **Bez bazy danych.**
- **Hosting:** **Cloudflare Pages**, projekt podpięty do `Jano-sqpDev/kuchnia-ninjago`, branch `main`. Cloudflare buduje i publikuje po każdym pushu na `main` (build: `npm run build`, katalog wyjściowy: `_site`, zmienna `NODE_VERSION=22` — ustawione w panelu Cloudflare, nie w repo). Limit darmowego planu: 500 buildów/mies., bez kredytów.
- **Adres produkcyjny:** https://kuchnia-ninjago.sqpdev.com (własna domena w Cloudflare Pages). Zapasowy, ten sam projekt: https://kuchnia-ninjago.pages.dev
- **Nie zmieniać domeny bez potrzeby:** localStorage jest osobny dla każdego adresu, więc zmiana domeny zeruje na iPadzie zapamiętany przepis, krok, porcje, język i wyszukiwanie (a ikonę na ekranie początkowym trzeba dodać od nowa). Tak było przy przejściu na sqpdev.com — kolejnej zmiany unikać.
- Hosting musi serwować stronę **publicznie, bez logowania** — Safari 12 nie renderuje stron logowania hostingów (widać tylko białą stronę). Przy białej stronie najpierw sprawdź dostęp do projektu.
- **Commit i push robisz Ty, po każdej zakończonej pracy** (nie czekasz na moje słowo). Commit z opisem (pierwsza linia = krótkie podsumowanie, pusta linia, potem punkty).
- **Push TYLKO przez `npm run deploy`** (`tools/deploy.mjs`): sprawdza, że wszystko jest zacommitowane, uruchamia wszystkie testy i build, i robi `git push` dopiero wtedy, gdy każdy krok zakończy się kodem 0. **Nigdy nie wywołuj `git push` bezpośrednio** i nie oceniaj testów po wypisanym tekście. Gdy testy albo build padają — nie pushuj, odpowiedź z nagłówkiem `## ❌ PRZERWANE` i opisem błędu.
- Jeśli sam push się nie uda (np. brak uprawnień), nie kombinuj — napisz, co zwrócił git, a ja wypchnę przez GitHub Desktop.
- **Generator:** Eleventy (11ty) albo prosty własny skrypt Node — wynik to czysty statyczny HTML + jeden mały plik JS + CSS.
- **Wyszukiwanie po stronie klienta:** build generuje `search.json`, iPad pobiera go raz i filtruje lokalnie. Kolekcja nie przekroczy ~1000 przepisów.
- Projekt jest całkowicie oddzielny od mojej aplikacji gym (Supabase/Vercel) — nie używaj tamtych usług.

### Struktura katalogów (spójna z Yano Gym)

```
J:\APP_DEV\kuchnia-ninjago\      ← kontener, poza repo: mockupy, robocze logi dev-*.txt
└── app\                       ← repo git (GitHub: Jano-sqpDev/kuchnia-ninjago), tu npm i CC
    ├── CLAUDE.md              ← ten plik, wersjonowany razem z kodem
    ├── AGENTS.md              ← instrukcja dla zewnętrznych agentów (Codex/ChatGPT): tylko przepisy
    ├── README.md
    ├── docs\                  ← mockupy HTML, notatki projektowe, FORMAT-PRZEPISU.md (ściąga formatu)
    ├── recipes\               ← <slug>.md, jeden plik na przepis; zdjęcia w recipes\img\; tags.yml (tłumaczenia tagów)
    ├── src\                   ← szablony, client JS, CSS
    ├── public\                ← ikony ekranu początkowego, statyczne pliki
    ├── tools\                 ← skrypty buildu i walidacji (*.mjs)
    ├── tests\                 ← testy node:test (*.test.mjs), bez frameworka; fixtures\ — pliki testowe (HEIC)
    │   └── fixtures\recipes\  ← przykłady wzorcowe (Ninja SYNC z turn, TM6 z Varomą, deser, bez tłumaczenia) + tags.yml
    ├── package.json
    └── .gitignore             ← node_modules, katalog wyjściowy buildu, .env*
```

- **Konwencja językowa (od v0.2.3):**
  - **po angielsku:** nazwy plików i katalogów, polecenia npm, identyfikatory w kodzie (funkcje, zmienne, stałe, klasy i id w CSS/HTML, wartości `data-act`, klucze localStorage, zmienne środowiskowe, znaczniki w szablonach),
  - **po polsku i po angielsku (od v0.4):** interfejs aplikacji (teksty na ekranie) — wszystkie napisy w słowniku `I18N` (`pl` / `en`) w `src/app.js`, nigdy wpisane w kod widoku,
  - **po polsku:** komunikaty walidatora i skryptów (także na liście błędów/ostrzeżeń w trybie EN — są dla Janusza), komentarze w kodzie i w `.gitignore`, nazwy testów, CLAUDE.md, README, docs i raporty,
  - pola YAML przepisów (schemat v1) są po angielsku i się nie zmieniają; tagi i treść przepisów — jak w „Format przepisu”,
  - wyjątki celowo po polsku: adres kroku `#krok-N` (część zasad widoku), stare klucze localStorage (`kuchnia-*`), które aplikacja czyta tylko raz, żeby je przenieść, oraz `docs/FORMAT-PRZEPISU.md` (nazwa nadana przez Janusza — ściąga wklejana do ChatGPT).
- Pliki w `tools\`: `build.mjs`, `validate.mjs` (walidator), `validate-cli.mjs` (`npm run validate`), `search.mjs`, `bench-search.mjs` (pomiar wyszukiwania), `output.mjs` (kształt JSON-ów), `images.mjs`, `version.mjs`, `icons.mjs` (`npm run icons`), `deploy.mjs` (`npm run deploy`).
- Testy jednostkowe w `tests\` dla walidatora i normalizacji wyszukiwania (np. „losos" → „łosoś", aliasy tagów).
- **Testy i build nie zakładają niczego o `recipes/`** (to kolekcja Janusza — ChatGPT dodaje i usuwa przepisy). Przykłady wzorcowe są w `tests/fixtures/recipes/` i testy buildu działają na nich (`KITCHEN_RECIPES_DIR`). Jedyny test na `recipes/`: zero błędów walidacji (twarda bramka dla `npm run deploy`); pusta kolekcja przechodzi.

---

## Format przepisu (schemat v1)

Jeden przepis = jeden plik `recipes/<slug>.md`. **Nazwa pliku to slug i trwałe ID przepisu** (małe litery a-z, cyfry, myślniki) — nie dodawaj pola `id`. Wszystkie dane w YAML front matter między `---`; treść Markdown pod spodem jest opcjonalna (luźne notatki, trafiają do JSON jako `notes`).

**Ta sama specyfikacja dla ludzi i zewnętrznych agentów: `docs/FORMAT-PRZEPISU.md`.** Przy każdej zmianie schematu lub reguł walidacji aktualizuj ją razem z tą sekcją — test sprawdza, że jej przykład przechodzi walidator i że lista funkcji/trybów Ninja się zgadza.

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
| `image` | `img/<plik>.jpg/.jpeg/.png/.heic` — plik w `recipes/img/`, prawdziwy JPEG/PNG/HEIC. **Zwykle niepotrzebne:** bez tego pola build sam bierze `recipes/img/<slug>.jpg/.jpeg/.png/.heic` (wielkość liter rozszerzenia dowolna; kolejność: jpg, jpeg, png, heic) | opcjonalne |
| `source` | tekst, np. `"ChatGPT"` | opcjonalne |
| `translations` | tłumaczenie EN — sekcja „Tłumaczenie EN” | opcjonalne (brak = ostrzeżenie); wymagane w każdym nowym przepisie od ChatGPT |

Pole opcjonalne albo jest wypełnione, albo go nie ma — pusty tekst / `null` to błąd.

### Składniki — `ingredients[]`

| Pole | Typ | |
|---|---|---|
| `name` | niepusty tekst | wymagane |
| `amount` | liczba > 0 (YAML: `1.5`, nie `"1,5"`) | opcjonalne |
| `unit` | **dokładnie** jedna z: `g`, `kg`, `ml`, `l`, `pcs`, `tbsp`, `tsp`, `pinch` (od v0.4; angielskie skróty w obu językach; inne → błąd z podpowiedzią, np. `szt` → `pcs`) | wymagane, gdy jest `amount`; bez `amount` zabronione |
| `note` | tekst, np. „drobno posiekana” | opcjonalne |
| `group` | tekst, np. „Sos” — grupowanie na liście | opcjonalne |

Składnik bez ilości jest OK (np. `- name: "sól"`). Nazwa składnika zaczyna się od produktu w mianowniku („Kalafior”, „Jajka”, „Ziemniaki młode”, nie „kalafiora” / „z jajkiem”) — lepiej działa wyszukiwanie (od v0.6, zasada w `docs/FORMAT-PRZEPISU.md`, walidator tego nie sprawdza).

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
  - `minutes` — liczba całkowita > 0,
  - `turn` — opcjonalne (od v0.3): przypomnienie o obróceniu / potrząśnięciu w tej strefie. **Brak pola = obracanie niepotrzebne** (wszystkie starsze przepisy działają bez zmian):
    - `action` — kod czynności, **dokładnie** `flip` (obróć) albo `shake` (potrząśnij) (wymagane w obiekcie `turn`; od v0.3.1 — w v0.3 były polskie słowa, żaden przepis ich nie użył). Napisy na ekranie dobiera aplikacja: flip → „OBRÓĆ” / „FLIP”, shake → „POTRZĄŚNIJ” / „SHAKE” (`ACTIONS` → słownik `I18N` w `src/app.js`),
    - `after_min` — liczba całkowita > 0 i **mniejsza niż `minutes` tej strefy** (wymagane) — liczone od startu tej strefy,
    - `required` — `true` (domyślnie, gdy brak pola) = alarm w timerze; `false` = tylko informacja „można obrócić po X min”, bez alarmu.
  - W `match` pole `turn` może się różnić między strefami (porównywane są tylko `function`, `temp_c`, `minutes`).

```yaml
ninja:
  mode: sync
  zone1:
    label: "Udka"
    function: "Roast"
    temp_c: 200
    minutes: 28
    turn:
      action: flip
      after_min: 14
  zone2:
    label: "Ziemniaki"
    function: "Air Fry"
    temp_c: 200
    minutes: 22
    turn:
      action: shake
      after_min: 11
      required: false
```

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
- **Tłumaczenia tagów: `recipes/tags.yml`** — mapa `tag_PL: tag_EN` (małe litery), utrzymuje ją ChatGPT (nowy tag w przepisie → wpis w tags.yml). W trybie EN tag tłumaczony, brakujący bez zmian; tagi urządzeń bez tłumaczenia. Tag bez wpisu = ostrzeżenie. Zły tags.yml (YAML, wielkie litery) nie psuje buildu — złe wpisy są pomijane z ostrzeżeniem. Build: `tags_en` w `search.json` i `data/<slug>.json`.

### Tłumaczenie EN — `translations` (od v0.4)

Opcjonalny blok w tym samym pliku, zgodny wstecz (`schema_version` zostaje 1). Tłumaczy tylko teksty — ilości, jednostki, tagi i ustawienia urządzeń zawsze z oryginału.

```yaml
translations:
  en:
    title: "…"                  # wymagane w bloku
    description: "…"            # wymagane ⇔ oryginał ma description
    ingredients:                # tyle samo i w tej samej kolejności co ingredients
      - name: "…"
        note: "…"               # wymagane ⇔ oryginał ma note
    groups:                     # nazwa_grupy_PL: nazwa_EN — każda użyta grupa, bez dodatkowych
      Marynata: "Marinade"
    steps:                      # tyle samo i w tej samej kolejności co steps
      - text: "…"
        tm6_mode: "…"           # wymagane ⇔ krok ma tm6.mode
    labels: { zone1: "…", zone2: "…" }   # ⇔ strefy Ninja mają label
```

- **Wszystko w `translations` daje tylko OSTRZEŻENIA, nigdy błędy** (także nieznane klucze, złe typy, inna liczba pozycji, nieznany język): przepis po polsku jest poprawny, więc zawsze się publikuje. `validateTranslations()` w `tools/validate.mjs`.
- Build publikuje `translations` w `data/<slug>.json` (i `title_en` w `search.json`) **tylko przy kompletnym tłumaczeniu bez ostrzeżeń**. Niekompletne = brak tłumaczenia: w trybie EN przepis po polsku ze znaczkiem „PL” (bez mieszania języków).
- Treść Markdown pod YAML (`notes`) nie ma tłumaczenia — w trybie EN ze znaczkiem PL.

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

Pełne przykłady (wzorcowe, w testach): `tests/fixtures/recipes/udka-z-ziemniakami.md` (Ninja SYNC z `turn`, grupy, tłumaczenie z `labels`), `warzywa-varoma.md` (TM6 z Varomą i `tm6_mode`), `deser-twarogowy.md` (bez urządzeń, `pinch`), `ziemniaczki-brokuly-sync.md` (celowo bez tłumaczenia). Pełny przykład z tłumaczeniem dla ChatGPT: `docs/FORMAT-PRZEPISU.md`.

### Walidacja przy buildzie

Błędem jest wszystko, co łamie reguły powyżej, m.in.: zły YAML, brak wymaganego pola, zły typ, **nieznany klucz na dowolnym poziomie**, zła nazwa pliku (wielkie litery, spacje, polskie znaki — komunikat proponuje poprawną), powtórzony slug, niezgodność tagów urządzeń z danymi, `match` z różnymi strefami, złe parametry TM6, zdjęcie nieistniejące / nie JPEG-PNG-HEIC. Walidator niczego nie poprawia sam.

Dwa poziomy (od v0.2.4):
- **`npm run validate` i `npm test` — twardo:** każdy błąd w `recipes/` = kod wyjścia 1. `npm run deploy` wymaga zielonych testów, więc z mojej strony nic błędnego nie wychodzi.
- **`npm run build` (Cloudflare Pages) — odpornie:** przepisy dodane z pominięciem testów (GitHub w przeglądarce, commity ChatGPT/Codexa na `main`) mogą mieć błędy. Build **pomija tylko błędny plik**, publikuje resztę i zapisuje listę błędów do `_site/errors.json`. Zdjęcie, którego nie da się użyć (zły format, HEIC nie do odczytania), nie ukrywa przepisu — przepis wychodzi bez zdjęcia, a błąd też trafia na listę. Aplikacja pokazuje na liście czerwoną plakietkę „N przepis(ów) z błędem”, po dotknięciu — listę: plik, pole po ludzku („krok 3 → TM6 → obroty”), przyczyna, i czy przepis jest ukryty, czy tylko bez zdjęcia. Kodem 1 kończą build tylko błędy aplikacji (brak znaczników w `src/*.html`, `src/app.js` niezgodny z Safari 12).

Ostrzeżenia (od v0.4) — trzeci poziom: braki w tłumaczeniu EN (`translations`), tagi bez wpisu w `recipes/tags.yml`, problemy z samym tags.yml. Nie zmieniają kodu wyjścia `npm run validate` / `npm test` (wypisywane z `⚠`), przepis zawsze się publikuje, lista trafia do `_site/warnings.json`. Aplikacja pokazuje pomarańczową plakietkę „N przepis(ów) bez tłumaczenia EN” (osobno od czerwonej), po dotknięciu — listę z przyczyną. `loadRecipes()` zwraca je jako `warnings` / `notices`, a `translated` przy przepisie mówi, czy tłumaczenie jest kompletne.

Komunikat: `plik.md → ścieżka.pola: przyczyna`, np. `warzywa-varoma.md → steps[2].tm6.speed: niepoprawna wartość 11 …` (indeksy list od 0, czyli `steps[2]` = krok 3). Błędy składni YAML mają numer linii w pliku i polskie wyjaśnienie najczęstszych przyczyn (oryginał biblioteki w nawiasie kwadratowym).

### Wynik buildu

- `_site/search.json` — lekki indeks (lista + wyszukiwanie): `id` (slug), `title`, `title_en` (tylko z kompletnego tłumaczenia), `tags`, `tags_en` (z tags.yml), `ingredients` (nazwy PL), `ninja_functions`, `servings`, `prep_minutes`, `cook_minutes`, `thumb` (miniatura, tylko gdy jest zdjęcie), `text` (znormalizowany tekst do wyszukiwania **w obu językach**: tytuł, tagi z aliasami i tłumaczeniami, składniki PL i EN).
- `_site/data/<slug>.json` — pełne dane przepisu (`id` + pola z YAML + `tags_en` + `notes`), pobierane dopiero po wybraniu przepisu. `image` to tu adres dużej wersji zdjęcia, `thumb` — miniatury. `translations` tylko przy kompletnym tłumaczeniu.
- `_site/warnings.json` — ostrzeżenia: `[{ file, path, where, reason }]` (pusta lista `[]`, gdy brak). Pobierany z `?b=<id buildu>`.
- `_site/img/<nazwa>-300-<skrót>.jpg` i `-1200-` — miniatura i duża wersja zdjęcia (JPEG, dłuższy bok 300 / 1200 px, małych nie powiększa; `tools/images.mjs`). Skrót treści w nazwie: po podmianie zdjęcia Safari nie pokaże starego. Źródła z `recipes/img/` nie trafiają na stronę. HEIC (iPhone) dekoduje `heic-decode` (libheif w WASM) — `sharp` z npm nie ma dekodera HEVC.
- `_site/errors.json` — przepisy z błędem: `[{ file, path, where, reason, skipped }]` (`where` — ścieżka pola po polsku, `skipped: true` — przepisu nie ma na stronie, `false` — jest, ale bez zdjęcia). Pusta lista `[]`, gdy wszystko w porządku. Pobierany z `?b=<id buildu>`.
- `_site/mockup3.html` — kopia `docs/mockup-ui-v3.html`: **zaakceptowany wygląd aplikacji (od v0.7)**. `_site/mockup.html` i `_site/mockup2.html` — kopie `docs/mockup-ui-v1.html` (wygląd do v0.6) i `docs/mockup-ui-v2.html` (odrzucony projekt), zostają do porównania. Wszystkie bez zmian.
- `_site/p/<slug>/index.html` i `_site/404.html` — ta sama powłoka aplikacji co `index.html`; widok wybiera `app.js` po adresie.
- `_site/app.js` — `src/app.js` po `esbuild --target=safari12` (błąd → build przerwany); `_site/app.css` bez zmian.
- `_site/version.json` — `{ "build": "<id>", "version": "v…" }`. `<id>` to 8 znaków skrótu wszystkiego, co pobiera iPad (szablony stron, app.js, app.css, search.json, errors.json, warnings.json, data/*.json); ten sam wynik → ten sam id.
- `_site/_headers` (z `public/`) — `version.json` bez pamięci podręcznej, strony aplikacji zawsze sprawdzane na serwerze. Cloudflare Pages czyta go z katalogu publikacji.

### Świeże dane na iPadzie (identyfikator buildu)

iOS 12 w trybie z ekranu początkowego potrafi trzymać stare kopie stron i JSON-ów nawet po wyczyszczeniu danych Safari. Dlatego:
- build wstawia id do HTML: `<html data-build="{{BUILD}}">`, `app.js?{{BUILD}}`, `app.css?{{BUILD}}`; krótki id w napisie wersji: `{{BUILD_SHORT}}`; strona bez `{{VERSION}}` lub `{{BUILD}}` przerywa build,
- wszystkie pobrania danych mają id w adresie: `/search.json?b=<id>`, `/data/<slug>.json?b=<id>`, `/errors.json?b=<id>`, `/warnings.json?b=<id>` (zdjęcia mają skrót treści w nazwie),
- przy starcie, `pageshow` i `visibilitychange` aplikacja pobiera `/version.json?t=<czas>`; inny id niż w stronie → przeładowanie pod adresem `…?b=<nowy id>#krok-N` (nowy adres = brak starej kopii); przepis, krok i porcje wracają z localStorage, a `?b=` znika z adresu,
- bez pętli: do danego id przeładowuje się najwyżej raz (`kitchen-reload` w localStorage).

Polecenia: `npm run validate` (sama walidacja), `npm run build`, `npm test`, `npm run deploy` (testy → build → push; jedyna droga publikacji), `npm run icons` (ikony ekranu początkowego).

---

## Wygląd i działanie (widok kuchenny)

- **Interfejs dwujęzyczny PL / EN (od v0.4)** — Janusz używa PL, Helena (uczy się gotować) EN, na jednym iPadzie:
  - przełącznik „PL | EN” w górnym pasku (każdy ekran, `<button>` ≥ 44 pt, wybrany język wyróżniony), domyślnie PL, wybór w `kitchen-lang`; `<html lang>` i tytuł strony zgodne z językiem; zmiana języka przerysowuje bieżący ekran bez zmiany przewinięcia,
  - wszystkie napisy w słowniku `I18N` (`tr` / `trn`); test pilnuje tych samych kluczy w obu językach i że każdy użyty klucz istnieje. Odmiana „porcja/porcje/porcji” tylko w PL; EN „1 serving / 2 servings”. Liczby dziesiętne: PL przecinek, EN kropka,
  - timer: „OBRÓĆ / POTRZĄŚNIJ ZA / PO / TERAZ” → „FLIP / SHAKE IN / AT / NOW”, „można obrócić” → „optional flip”, „Zrobione” → „Done”, „Strefa” → „Zone” (opis szuflady z `translations.en.labels`),
  - przepis w EN: teksty z `translations.en` (`localizeRecipe()`); bez tłumaczenia — po polsku z małym znaczkiem „PL” (na karcie listy i pod nagłówkiem przepisu); tagi EN z `tags_en`,
  - komunikaty walidatora na listach błędów / ostrzeżeń zostają po polsku (dla Janusza), otoczka po angielsku.
- **Jednostki: zawsze angielskie skróty w obu językach** — `g`, `kg`, `ml`, `l`, `pcs`, `tbsp`, `tsp`, `pinch`. Metryczne, °C.
- Czytelność z odległości: tekst bazowy ≥ 20 px, ustawienia urządzeń wyraźnie większe. Cele dotyku ≥ 44 pt. Wysoki kontrast.
- **Wygląd (od v0.7): `docs/mockup-ui-v3.html` — „spokojny wyświetlacz”** (podgląd: `/mockup3.html`). Tylko ciemny motyw — jasny usunięty razem z przyciskiem ☀; stary klucz `kitchen-theme` jest przy starcie kasowany z localStorage.
- **ZASADA TRZECH POZIOMÓW na ekranie przepisu:**
  1. **wyświetlacz urządzenia (panel Ninja / TM6) to JEDYNE miejsce z poświatą** (świecące cyfry, krawędź),
  2. **bieżący krok ma niebieską ramkę**,
  3. **cała reszta to spokojne, ciemne pola bez poświat.** Nie dodawaj poświat ani kolorowych ramek nigdzie indziej (test w `tests/client.test.mjs` pilnuje, gdzie w CSS wolno użyć `box-shadow` / `text-shadow`). Wyjątek: ekran alarmu (pulsujące koło) — jest poza przepisem, nad wszystkim.
- **Kolory (tokeny w `:root` w `src/app.css`, jak w mockupie v3):** `--plate #121519`, `--plate2 #0E1114`, `--well #0A0C0F`, `--edge #1F252C`, `--ink #ECEFF3`, `--ink2 #A2ACB7`, `--muted #6F7A86`, `--accent #5B9BE6` (interfejs: wybrany język, aktywny chip, bieżący krok, plakietka obracania), cyfry Ninja `--ninja #7CC4FF` z poświatą, TM6 `--tm6 #B49CFA`, temperatura w środku `--hot #FF7A66`. Kolor = znaczenie: niebieski — interfejs i Ninja, fiolet — TM6, łososiowy — temperatura w środku. **Bez pomarańczu**, poza plakietkami problemów na liście: czerwona (`--error`, błędy) i pomarańczowa (`--warn`, brak tłumaczenia EN).
- **Pasek górny:** lista — „Przepisy” + PL | EN; przepis — „‹ Przepisy”, tytuł (obcinany „…”, obok znaczek „PL” przy braku tłumaczenia w trybie EN), pod nim podtytuł w `--ink2` z czasami („przygotowanie 10 min · pieczenie 11 min”, bez czasu pieczenia: „bez pieczenia”), przycisk „Zdjęcie” z ikonką (tylko gdy przepis ma zdjęcie; otwiera podgląd na cały ekran) i PL | EN.
- **Strona główna:** pole wyszukiwania na górze, filtry-chipy (`Ninja`, `TM6`, funkcje Ninja), lista przepisów — szczegóły w „Wyszukiwanie”.
- **Strona przepisu:**
  1. Pasek: tytuł i czasy (patrz wyżej). Bez bloku z porcjami, tagami i dużym zdjęciem (od v0.7); tagi są tylko w wyszukiwarce.
  2. **Panel Ninja** (jeśli jest, przypięty) — ciemne tło `#05070A`, cienka niebieska krawędź z lekką poświatą; dwie strefy w osobnych polach (`label`, funkcja, temp i czas niebieskimi cyframi z poświatą, jednostki mniejsze i jaśniejsze; w pionie mniejsze cyfry), między nimi kolumna z trybem (SYNC / MATCH / OSOBNO) i podpisem („kończą razem”…). Obracanie obowiązkowe — niebieska plakietka „↻ Obróć po 14 min”, po czasie szara z „✓”; opcjonalne — szary tekst. Timer obracania wewnątrz panelu pod strefami. Pod panelem notka o porcjach.
  3. **Panel TM6** (jeśli jest, przypięty pod Ninja): fioletowa krawędź, trzy pierścienie (czas, temp., obroty), nagłówek „TM6 · Krok 3 z 4”, tryb po prawej; krok bez TM6 — szare pierścienie z „—”, bez poświaty.
  4. Dwie kolumny: **karta Składniki** (~38%; w nagłówku licznik porcji − 4 porcje +; ilość pogrubiona po lewej, jednostka jaśniejsza, nazwa po prawej; grupy jako niebieski podpis zwykłymi literami) | **Kroki** (numer w kółku, tekst 22 px, bieżący z niebieską ramką, wykonane przygaszone z ✓; ustawienia TM6 jako jeden fioletowy chip „18:00 · Varoma · obroty 1”, temperatura w środku jako łososiowy chip „🌡 75°C w środku”). W pionie składniki nad krokami.
  5. Na dole, pod kolumnami: opis przepisu i notatki spokojnym tekstem w `--ink2`.
- Każdy przepis ma własny URL (`/p/<slug>/`). Dotknięcie kroku zaznacza go jako bieżący (`#krok-3` w URL + `localStorage`).
- **Odporność na przeładowania:** po przeładowaniu Safari lub ponownym otwarciu z ekranu początkowego strona wraca do ostatniego przepisu i kroku (zapamiętane w `localStorage`).
- **Zapamiętywanie stanu — decyzja z testów Etapu 1 (T4):** localStorage, ciasteczko i IndexedDB zachowały się na iPadzie identycznie, a zapisane dane przetrwały zamknięcie aplikacji. Po otwarciu z ikony iOS 12 czasem pokazuje stronę bez ponownego ładowania (kod startowy się nie wykonuje). Dlatego używamy **localStorage** i obsługujemy **oba warianty**:
  1. stan zapisywany **od razu** przy każdym dotknięciu kroku / zmianie przepisu (nie dopiero przy zamykaniu),
  2. stan odtwarzany przy załadowaniu strony,
  3. obsługa powrotu strony bez przeładowania: `pageshow` (także z `event.persisted`) i `visibilitychange` — przy powrocie odczytaj stan z localStorage i odśwież widok.
- **Timer czynności Ninja (v0.3; od v0.3.2 tylko obracanie/potrząsanie)** — niski pasek wewnątrz panelu Ninja pod strefami, oddzielony cienką linią (od v0.7): po lewej napis czynności i DUŻY licznik, w środku strefa, stan i uwaga o alarmie, po prawej przyciski:
  - **pokazuje się tylko w przepisach z co najmniej jednym `turn`.** Bez `turn` — sam panel Ninja, bez paska. **Końca pieczenia aplikacja nie pilnuje** — Ninja ma własny licznik i sygnał końca, a wysuwanie szuflady i tak rozjeżdża odliczanie do końca,
  - **kolejka:** wszystkie `turn` (z alarmem i informacyjne) ze wszystkich stref, po czasie (z przesunięciem SYNC); czynności z tej samej chwili tworzą jedną grupę (jeden napis, jeden alarm z obiema strefami); zdarzenia „koniec” nie ma,
  - **duże MM:SS = czas do najbliższej czynności**; nad nim „OBRÓĆ ZA” / „POTRZĄŚNIJ ZA” (dla `required: false` łagodniej: „można obrócić za” / „można potrząsnąć za”) + „Strefa N · label”. Po minięciu momentu albo „Zrobione” licznik przechodzi do następnej czynności. **Po ostatniej czynności w miejscu licznika sama kreska „—”, bez żadnego napisu**, zostaje tylko RESET,
  - przed startem: zapowiedź pierwszej czynności („OBRÓĆ PO 14:00”) i START; przyciski START / PAUZA / WZNÓW / RESET (RESET wymaga drugiego dotknięcia w ciągu 3 s),
  - przy strefach z `turn`: „↻ Obróć / Potrząśnij po X min” (niebieska plakietka, `required`) albo dyskretne „można obrócić po X min”; widoczne przed i w trakcie odliczania, po czasie szare z „✓”,
  - **czas z zegara:** zapisany start + suma ręcznych pauz (`Date.now()`), nie liczba wywołań `setInterval` — tyknięcie co 1 s tylko odświeża ekran i sprawdza alarmy,
  - **kompensacja wysuniętej szuflady:** przy czynności z alarmem (`required: true`) czas od jej momentu do dotknięcia „Zrobione” liczy się jak pauza (Ninja stoi przy wysuniętej szufladzie) — kolejne czynności przesuwają się o ten czas. Bez „Zrobione” w ciągu 2 min przyjmujemy 30 s postoju i licznik idzie dalej (alarm nadal widoczny); spóźnione „Zrobione” też daje 30 s. Postój zapisywany przy „Zrobione” (`holds`), więc przeładowanie nie zmienia wyniku. Czynności bez alarmu (`required: false`) — bez kompensacji,
  - **SYNC:** krótsza strefa startuje w Ninja później (obie kończą razem), więc jej czynność = (różnica czasów stref + `after_min`) od startu timera, plus postoje wcześniejszych czynności; MATCH / INDEPENDENT / SINGLE — od startu,
  - **alarm:** tylko czynności z `required: true` — nakładka na cały ekran „OBRÓĆ TERAZ — Strefa 1 · Udka” (równoczesne w jednym komunikacie) + dźwięk, przycisk „Zrobione”. Sygnał powtarzany co 5 s przez minutę, dopóki nikt nie potwierdzi. Nakładka jest poza `#app`, więc działa też na liście i przy innym przepisie. Alarmu „GOTOWE” nie ma (od v0.3.2),
  - **zaległe alarmy:** po powrocie z tła / przeładowaniu / ponownym otwarciu alarm, którego moment minął, pokazuje się od razu (kilka zaległych — po kolei),
  - **dźwięk:** Web Audio (`webkitAudioContext` w Safari 12), odblokowywany dotknięciem START / WZNÓW (oraz każdym dotknięciem przy aktywnym timerze — po przeładowaniu iOS znowu blokuje dźwięk do pierwszego dotknięcia). Brak dźwięku → sam komunikat z dopiskiem. **Bez obietnic przy zablokowanym ekranie i aplikacji w tle** — pasek timera to mówi,
  - `steps[].timer_seconds` — nadal nieużywane.
- **Klucze localStorage:** `kitchen-state` (otwarty przepis + krok, porcje i timer Ninja dla ostatnich 30 przepisów; timer w `recipes[slug].timer` = `{ plan, startedAt, pausedAt, pausedTotal, acked, holds }` — plan czynności zapisany przy START; timery z v0.3/v0.3.1 (ze zdarzeniem końca albo polskimi słowami w `action`) są odrzucane, więc alarmy działają także po przeładowaniu na liście; rozszerzenie wsteczne zgodne: zapisy bez `timer` działają, zepsuty timer jest odrzucany), `kitchen-theme` — usunięty w v0.7 (jasny motyw zniknął; aplikacja kasuje klucz przy starcie), `kitchen-reload` (ochrona przed pętlą przeładowań), w `kitchen-state` od v0.5 także `list` = `{ query, chips, scroll }` (wyszukiwanie, chipy, przewinięcie listy; zapisy bez `list` dostają pusty stan — migracja przez wartości domyślne w `normalizeListState`), `kitchen-lang` (`pl`/`en`, od v0.4 — nowy klucz, bez starszego odpowiednika; brak / inna wartość = PL). Zdarzenia w planie timera (od v0.4): `{ id, kind: 'turn', at, no, label?, label_en?, action, required }` — napisy powstają przy wyświetlaniu w bieżącym języku; zapisy z v0.3.2 z gotowym polskim napisem `zone` („Strefa 1 · Udka”) są przenoszone do `no` / `label` (działający timer przetrwa aktualizację). Zapisy sprzed v0.2.3 (`kuchnia-stan`, `kuchnia-motyw`, `kuchnia-przeladowanie`) są przy pierwszym uruchomieniu przenoszone do nowych kluczy, a stare usuwane. Przy każdej przyszłej zmianie nazw kluczy lub kształtu zapisu — ta sama zasada: migracja, żeby iPad nie zgubił stanu.
- Tryb „aplikacji": `apple-mobile-web-app-capable`, `apple-mobile-web-app-status-bar-style`, `apple-touch-icon` 152×152 i 167×167, poprawny `viewport`. Po „Dodaj do ekranu początkowego" ma się otwierać bez paska Safari.
- Nawigacja wstecz musi być w interfejsie (w trybie pełnoekranowym nie ma przycisku Wstecz przeglądarki).

## Wyszukiwanie

- Build generuje `search.json` (pola opisane w „Wynik buildu”); pole `text` zawiera oba języki, aliasy tagów, składniki i funkcje Ninja, więc wyszukiwanie działa niezależnie od języka interfejsu. iPad pobiera indeks raz i filtruje lokalnie.
- **Jedno źródło prawdy logiki: `tools/search.mjs`** (`normalize`, `buildSearchText`, `matchesQuery`, od v0.6 też `searchWords`, `wordStems`, `matchLevel`, `isEdit1`, `buildDictionary`, `typoCandidates`, `searchIndex`). `src/app.js` ma **dosłowne kopie** wszystkich poza `buildSearchText` — `tests/client.test.mjs` porównuje tekst każdej funkcji (bez wcięć; od `function nazwa(` do `}` z tym samym wcięciem) i wyniki obu wersji na tych samych przypadkach. Zmieniasz logikę → zmień oba miejsca, inaczej testy padną. (Wybór: kopia + test zamiast wstrzykiwania przy buildzie, bo testy klienta uruchamiają `src/app.js` bez buildu.)
- Normalizacja zapytania i danych: małe litery, usunięcie znaków diakrytycznych przez `normalize('NFD')` + usunięcie znaków łączących (`[\u0300-\u036f]`), **plus ręczne mapowanie `ł→l`** (NFD nie rozkłada „ł"). „losos" ma znaleźć „łosoś".
- Rozwijanie aliasów tagów (patrz wyżej): „thermomix” → tm6, „af” / „airfryer” → ninja.
- **Dopasowanie słowa (od v0.6) — trzy poziomy, od najlepszego:**
  1. **dokładne** — słowo jest fragmentem pola `text` (jak w v0.5),
  2. **rdzeń (polska odmiana)** — tylko słowa ≥ 5 znaków: słowo bez 1 lub 2 ostatnich liter, rdzeń ≥ 4 znaki („kalafiorem” → „kalafior”, „ziemniakow” → „ziemniak”, „jajka” → „jajk” łapie „duże jajko”). Krótsze słowa tylko dokładnie („sol” nie łapie „sok”),
  3. **literówka — tylko awaryjnie:** słowo ≥ 5 znaków, które nie trafia w ŻADEN przepis ani dokładnie, ani rdzeniem, jest zastępowane słowami ze słownika w odległości edycyjnej 1 (wstawienie, usunięcie, zamiana, przestawienie sąsiednich liter), porównywanymi też z początkiem dłuższych słów („klafior” → „kalafiora”). Słownik = unikalne słowa (≥ 4 znaki) z pól `text`, budowany raz po wczytaniu `search.json`; odległość liczona tylko na słowniku. Nad wynikami „Pokazuję wyniki dla: …” / „Showing results for: …” (zapytanie z poprawionymi słowami, najkrótsza propozycja).
- Wiele słów = I: każde słowo musi trafić (dowolnym poziomem). **Kolejność wyników:** grupa dokładnych, potem rdzeni, potem literówek; grupa przepisu = najsłabsze z jego dopasowań; w grupie kolejność z indeksu. Wyszukiwanie liczone na całym indeksie, chipy filtrują potem (poprawka nie zależy od filtrów).
- Pomiar: `node tools/bench-search.mjs [liczba]` — sztuczny indeks (domyślnie 1000 przepisów, ~2000 słów w słowniku); test w `tests/search.test.mjs` pilnuje < 50 ms na wyszukiwanie w Node.
- **Widok (v0.5):** pole tekstowe (czcionka ≥ 16 px, `autocomplete/autocorrect/autocapitalize="off"`, `spellcheck="false"`), filtrowanie po ok. 150 ms bez pisania, ✕ czyści pole, Enter chowa klawiaturę. **Przy wpisywaniu i chipach odświeżane są tylko `#chips` i `#results`** (licznik, karta „Wróć do gotowania”, siatka) — przerysowanie pola na iOS 12 zamyka klawiaturę i gubi kursor. Plakietki dochodzą osobno do `#badges`.
- **Chipy:** „Wszystkie / All”, „Ninja”, „TM6”, potem funkcje Ninja występujące w co najmniej jednym przepisie (kolejność jak w walidatorze). Urządzenie po tagach `ninja` / `tm6`, funkcja po `ninja_functions`. W grupie LUB, między grupami I, całość I z tekstem; „Wszystkie” czyści, podświetlone, gdy nic nie zaznaczone. Chipy to `<button>` (cursor: pointer). Czyste funkcje: `matchesChips`, `filterEntries`, `availableChips`, `toggleChip`.
- **Wyniki:** licznik „3 z 12 przepisów” / „3 of 12 recipes” tylko przy aktywnym wyszukiwaniu lub chipach (wtedy karta „Wróć do gotowania” znika); brak wyników → „Nic nie pasuje” + „Wyczyść” (czyści pole i chipy).
- **Pamięć:** tekst, chipy i przewinięcie listy w `kitchen-state.list` (zapis od razu przy wpisywaniu / chipie, przewinięcie po chwili bez ruchu i przy wejściu w przepis) — po przeładowaniu i po „‹ Przepisy” lista wraca w tym samym stanie.
- Granica tolerancji: odległość 1 (np. „philadelfia” → „philadelphia” to 2 zmiany, nie znajdzie). Bez bibliotek.

---

## Przepisy i podział ról

- **Przepisy (treść, ustawienia urządzeń) dodaje ChatGPT** — commitem bezpośrednio na `main` według `AGENTS.md` (albo ja ręcznie przez GitHub, plik od ChatGPT według `docs/FORMAT-PRZEPISU.md`).
- **Claude Code zajmuje się wyłącznie kodem aplikacji** (build, walidator, widok, testy, dokumentacja techniczna). **Nie tworzysz ani nie zmieniasz przepisów w `recipes/` i zdjęć w `recipes/img/`, chyba że wprost o to poproszę** — także gdy na liście jest czerwona plakietka z błędami: najwyżej mi o niej napisz.
- `AGENTS.md` (katalog główny repo) jest **tylko dla zewnętrznych agentów** (ChatGPT/Codex) — Ciebie obowiązuje ten plik. `AGENTS.md` i `docs/FORMAT-PRZEPISU.md` aktualizujesz razem ze zmianami formatu, walidacji lub poleceń (test pilnuje, że przykład ze ściągi przechodzi walidator).

### Jak przepisy trafiają do repo (bez Ciebie)

- **ChatGPT / Codex commitem bezpośrednio na `main` (bez pull requestów):** agent pracuje według `AGENTS.md`: wyłącznie `recipes/` (przepisy, `recipes/img/`, `recipes/tags.yml`), `npm run validate` + `npm test` (a jeśli nie może ich uruchomić — pisze to wprost w opisie commita), jeden przepis = jeden commit „Przepis: <tytuł>”. Pull request tylko na moją wyraźną prośbę. Ustawienia urządzeń: przy gotowym przepisie pyta, gdy ich brakuje; przy nowym przepisie proponuje je sam z dopiskiem w `description` „Ustawienia proponowane, do sprawdzenia przy pierwszym gotowaniu.”.
- **Ręcznie przez GitHub w przeglądarce (także z telefonu):** wklejam ChatGPT treść `docs/FORMAT-PRZEPISU.md` i przepis → dostaję gotowy plik (pierwsza linia YAML to komentarz `# plik: recipes/<slug>.md`) → „Add file → Create new file” w `recipes/`, commit na `main`. Zdjęcie: „Upload files” do `recipes/img/` jako `<slug>.jpg` (albo HEIC z iPhone'a).
- Takie zmiany omijają `npm run deploy`, dlatego build jest odporny (patrz „Walidacja przy buildzie”): błędny przepis znika ze strony, a na iPadzie pojawia się czerwona plakietka z listą błędów.
- **Dlaczego bez pull requestów:** zabezpieczeniem są (1) odporny build — błędny przepis nie psuje publikacji, tylko znika ze strony, (2) czerwona plakietka z listą błędów na iPadzie — od razu widać, co poprawić, (3) historia gita — każdą zmianę przepisu można cofnąć. Przegląd PR nic do tego nie dodaje, a spowalnia dodawanie przepisów (zwłaszcza z telefonu) i zużywa buildy podglądów.
- Cloudflare Pages buduje też podglądy pull requestów (gdy jednak powstaną) — liczą się do limitu 500 buildów/mies.

### Gdy wprost poproszę Cię o przepis („dodaj do przepisów”, „popraw przepis X”)

1. Przerabiasz go na format powyżej (ustawienia Ninja do panelu, TM6 do kroków, sensowne tagi, `internal_temp_c` tam, gdzie pasuje, jednostki z listy, kompletny blok `translations.en`, nowe tagi dopisane do `recipes/tags.yml`). Ilości tylko na liście składników — w tekście kroków bez liczb ilości („wlej wodę”, nie „wlej 500 ml wody”).
2. Ustawienia urządzeń: jak w `AGENTS.md` — przy gotowym przepisie pytasz, gdy brakuje lub są niejednoznaczne; przy nowym proponujesz z dopiskiem w `description`.
3. Commit i `npm run deploy`.
4. Odpowiadasz zgodnie z „Format raportu" (w „Co zrobiłem": dodane/poprawione + slug).

---

## Wersjonowanie

- **Jedno źródło prawdy:** pole `version` w `package.json` (semver `X.Y.Z`, np. `0.1.0`). Build wstrzykuje je w miejsce znacznika `{{VERSION}}` do każdej strony aplikacji (`src/*.html`); strona bez znacznika przerywa build.
- Na stronie numer jest wyświetlany krótko: `0.1.0` → **v0.1**, `0.1.2` → **v0.1.2**, a obok 4 pierwsze znaki identyfikatora buildu (np. **v0.2.2 · a1b2**) — mały, szary, w prawym górnym rogu, nie zasłania przycisków i nie przechwytuje dotyku. Służy do sprawdzenia na iPadzie, czy Safari nie trzyma starej wersji z pamięci.
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
Numerowana lista moich kroków (klikanie w Cloudflare, ręczny push, jeśli Twój się nie udał, itp.).

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
3. ✅ **Widok kuchenny:** lista + strona przepisu z panelami, zapamiętywanie stanu. (Do v0.6 według `docs/mockup-ui-v1.html` z jasnym motywem; **od v0.7 wygląd według `docs/mockup-ui-v3.html` — Etap 7, opis w „Wygląd i działanie”.** Punkty niżej o działaniu nadal obowiązują.)
     - lista z miniaturami zdjęć; zdjęcie na pełny ekran z przycisku „Zdjęcie” w pasku przepisu (od v0.7),
   - **Zdjęcia:** źródło JPEG/PNG w `recipes/img/`; build sam robi dwie wersje JPEG — miniaturę ~300 px i dużą ~1200 px (dłuższy bok).
   - **Zasady Etapu 3 (dodatkowo):**
     - Panel Ninja **przypięty pod paskiem** — przewija się tylko treść pod nim.
     - **Panel TM6** przypięty pod paskiem (pod panelem Ninja, jeśli przepis ma oba): trzy równe tarcze — czas, temperatura (lub „Varoma”, lub wyszarzone „bez grzania”), obroty (z „↺ wsteczne”, jeśli `reverse`); tryb TM6 (`mode`) w nagłówku panelu.
       - Pokazuje ustawienia **bieżącego** kroku i aktualizuje się przy zmianie kroku (bez przerysowania ekranu).
       - Gdy bieżący krok nie ma TM6: tarcze puste („—”, wyszarzone), w nagłówku „Ten krok bez TM6”. Panel zostaje na miejscu i ma tę samą wysokość (ekran nie skacze). **Bez** „Następny krok TM6” / „Ostatni krok TM6” (v0.2.1, zastępuje mockup).
       - Mocny kontrast, czytelny z ~1 m: fioletowe pierścienie z poświatą, białe cyfry (od v0.7).
       - Chip TM6 w ramce kroku zostaje (jeden, fioletowy).
     - Zmiana bieżącego kroku **nie przerysowuje ekranu** ani nie resetuje przewinięcia — aktualizuj tylko elementy kroków.
     - **Pułapka iOS 12 (dotyk):** dotknięcie elementu bez `cursor: pointer` nie wysyła zdarzenia `click` do nasłuchu na `document` (event delegation). Wszystko, co reaguje na dotyk (karty, kroki, zdjęcie, przyciski), ma `cursor: pointer` albo jest `<button>` / `<a>`.
     - **Przeliczanie porcji:** przyciski − / + przy liczbie porcji (zakres 1–12). Ilości przeliczane z zaokrąglaniem: `pcs`, `tbsp`, `tsp`, `pinch` do połówek (do v0.3: `szt` i łyżki), `g`/`ml` do okrągłych wartości; składniki bez ilości bez zmian. Link „przepis: N” wraca do oryginalnej liczby porcji. Wybrana liczba porcji zapamiętywana razem z krokiem. Ustawienia Ninja i TM6 się **nie zmieniają**; przy zmienionej liczbie porcji pod panelem Ninja pojawia się uwaga.
4. ✅ **Wyszukiwarka i filtry (v0.5)** — pole z filtrowaniem na bieżąco, chipy urządzeń i funkcji Ninja, licznik, brak wyników, pamięć stanu listy (opis w „Wyszukiwanie”). Od v0.7 w wyglądzie mockupu v3 (lupa w polu, aktywny chip niebieski).
   - ✅ **4.1 (v0.6):** polska odmiana (rdzeń) i literówki awaryjnie, kolejność wyników według jakości dopasowania, „Pokazuję wyniki dla: …”.
5. **Timer czynności Ninja — przypomnienia o obracaniu/potrząsaniu (v0.3–v0.3.2)** — pole `ninja.zoneN.turn`, timer pod panelem Ninja tylko w przepisach z `turn`, kompensacja wysuniętej szuflady (opis w „Wygląd i działanie”). Do sprawdzenia na iPadzie.
6. **Dwujęzyczność PL / EN (v0.4)** — słownik interfejsu, przełącznik „PL | EN”, jednostki z listy angielskich skrótów, `translations.en` w pliku przepisu (ostrzeżenia, pomarańczowa plakietka, fallback PL), `recipes/tags.yml`, wyszukiwanie w obu językach, testy niezależne od `recipes/` (przykłady w `tests/fixtures/recipes/`). Do sprawdzenia na iPadzie.
7. ✅ **Nowy wygląd według `docs/mockup-ui-v3.html` (v0.7)** — „spokojny wyświetlacz”, zasada trzech poziomów, tokeny kolorów, tylko ciemny motyw, timer w panelu Ninja, karta składników z porcjami, opis i notatki na dole. Do sprawdzenia na iPadzie.
8. (Później, na moje życzenie) tryb gotowania krok po kroku, minutniki przy krokach TM6 (`timer_seconds`).

Ręcznie robię tylko: założenie konta na hostingu i połączenie go z repo GitHub.
