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
- **Commit i push robisz Ty.** Po każdej zakończonej pracy i przejściu builda: commit z opisem (pierwsza linia = krótkie podsumowanie, pusta linia, potem punkty), potem `git push`. Jeśli push się nie uda (np. brak uprawnień), nie kombinuj — napisz, co zwrócił git, a ja wypchnę przez GitHub Desktop.
- **Generator:** Eleventy (11ty) albo prosty własny skrypt Node — wynik to czysty statyczny HTML + jeden mały plik JS + CSS.
- **Wyszukiwanie po stronie klienta:** build generuje `search.json`, iPad pobiera go raz i filtruje lokalnie. Kolekcja nie przekroczy ~1000 przepisów.
- Projekt jest całkowicie oddzielny od mojej aplikacji gym (Supabase/Vercel) — nie używaj tamtych usług.

### Struktura katalogów (spójna z Yano Gym)

```
J:\APP_DEV\kuchnia-ninjago\      ← kontener, poza repo: mockupy, robocze logi dev-*.txt
└── app\                       ← repo git (GitHub: januszSQP/kuchnia-ninjago), tu npm i CC
    ├── CLAUDE.md              ← ten plik, wersjonowany razem z kodem
    ├── README.md
    ├── docs\                  ← mockupy HTML, notatki projektowe
    ├── przepisy\              ← <slug>.md, jeden plik na przepis
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

## Format przepisu

Jeden przepis = jeden plik `przepisy/<slug>.md`. Wszystkie dane strukturalne w YAML front matter; treść Markdown pod spodem jest opcjonalna (luźne notatki).

```yaml
---
tytul: Udka z ziemniakami
slug: udka-z-ziemniakami
tagi: [kurczak, obiad, ninja]
porcje: 4
zrodlo: claude            # claude | chatgpt | wlasny | inne
skladniki:
  - "8 udek z kurczaka"
  - "600 g ziemniaków"
  - grupa: Marynata         # opcjonalne grupowanie
    pozycje:
      - "2 łyżki oliwy"
      - "1 łyżeczka papryki wędzonej"

ninja:                      # TYLKO gdy tag "ninja"; cały blok opcjonalny
  tryb_stref: sync          # sync | match | osobno | jedna
  strefa1:
    nazwa: Udka
    funkcja: Roast
    temp_c: 200
    czas_min: 25
    akcje: ["obróć po 15 min"]
  strefa2:                  # pomiń przy tryb_stref: jedna
    nazwa: Ziemniaki
    funkcja: Air Fry
    temp_c: 200
    czas_min: 20
    akcje: ["potrząśnij po 10 min"]

kroki:
  - tekst: "Pokrój ziemniaki w ćwiartki, wymieszaj z marynatą."
  - tekst: "Zblenduj sos."
    tm6:                    # opcjonalne, przy dowolnym kroku
      czas: "30 s"
      temp: null            # liczba °C, "Varoma" albo null
      obroty: "7"           # "lyzka" | "1"–"10" | "turbo"
      wsteczne: false
      tryb: null            # opcjonalnie nazwa trybu TM6, np. "Wyrabianie"
  - tekst: "Sprawdź udka termometrem."
    temp_wewn_c: 75         # opcjonalne, docelowa temp. w środku
---
Notatki: z dodatkiem czosnku jeszcze lepsze.
```

### Ninja Foodi MAX Dual Zone DZ400UK
- Dwie szuflady, **bez sondy temperatury**.
- `funkcja` — **zamknięta lista**: `Air Fry`, `Max Crisp`, `Roast`, `Bake`, `Reheat`, `Dehydrate`.
- `temp_c` 40–240. `tryb_stref`: `sync` (obie kończą razem), `match` (te same ustawienia w obu), `osobno`, `jedna`.
- Ninja = jeden panel na cały przepis.

### Thermomix TM6
- Ustawienia **per krok** (pole `tm6` przy kroku), bo zmieniają się w trakcie gotowania.

### Temperatura wewnętrzna
- `temp_wewn_c` przy kroku — opcjonalne. Wyświetlaj tylko tam, gdzie jest wypełnione. Dodawaj przy drobiu, wieprzowinie i większych kawałkach mięsa.

### Tagi
- Zapisuj normalnie po polsku, małymi literami, z ogonkami (`deser`, `kurczak`, `łosoś`). Normalizacja dzieje się tylko w wyszukiwarce.
- Tagi urządzeń (kanoniczne): `ninja`, `tm6`.
- Aliasy w wyszukiwarce: `thermomix` → `tm6`; `airfryer`, `air fryer`, `af` → `ninja`.
- Przepis może mieć oba tagi urządzeń albo żadnego (np. desery).

### Walidacja przy buildzie
Build ma **failować** z czytelnym komunikatem, gdy:
- brakuje `tytul`, `slug`, `skladniki` lub `kroki`, albo slug się powtarza,
- `funkcja` Ninja spoza listy, `temp_c` poza 40–240, nieznany `tryb_stref`,
- jest blok `ninja`, a brak tagu `ninja` (lub odwrotnie — tag bez bloku to tylko ostrzeżenie),
- jest `tm6` przy kroku, a brak tagu `tm6`,
- `obroty` TM6 spoza dozwolonych wartości.

---

## Wygląd i działanie (widok kuchenny)

- Interfejs po polsku. Jednostki metryczne, °C.
- Czytelność z odległości: tekst bazowy ≥ 20 px, ustawienia urządzeń wyraźnie większe. Cele dotyku ≥ 44 pt. Wysoki kontrast. Ręczny przełącznik jasny/ciemny (zapamiętany w `localStorage`).
- **Strona główna:** pole wyszukiwania na górze, filtry-chipy (`Ninja`, `TM6`, funkcje Ninja), lista przepisów.
- **Strona przepisu:**
  1. Tytuł, porcje, tagi.
  2. **Panel Ninja** (jeśli jest) — wygląda jak wyświetlacz frytkownicy: dwie kolumny Strefa 1 / Strefa 2, funkcja + temp + czas dużą czcionką, znaczek SYNC/MATCH, akcje pod spodem.
  3. Składniki (z grupami).
  4. Kroki, numerowane. Przy kroku z `tm6` — mały panel: czas · temp · obroty · ↺ (wsteczne). Przy `temp_wewn_c` — znaczek „🌡 75°C w środku".
- Każdy przepis ma własny URL (`/p/<slug>/`). Dotknięcie kroku zaznacza go jako bieżący (`#krok-3` w URL + `localStorage`).
- **Odporność na przeładowania:** po przeładowaniu Safari lub ponownym otwarciu z ekranu początkowego strona wraca do ostatniego przepisu i kroku (zapamiętane w `localStorage`).
- Tryb „aplikacji": `apple-mobile-web-app-capable`, `apple-mobile-web-app-status-bar-style`, `apple-touch-icon` 152×152 i 167×167, poprawny `viewport`. Po „Dodaj do ekranu początkowego" ma się otwierać bez paska Safari.
- Nawigacja wstecz musi być w interfejsie (w trybie pełnoekranowym nie ma przycisku Wstecz przeglądarki).

## Wyszukiwanie

- Build generuje `search.json`: slug, tytuł, tagi, składniki, funkcje Ninja, czy ma TM6.
- Normalizacja zapytania i danych: małe litery, usunięcie znaków diakrytycznych przez `normalize('NFD')` + usunięcie znaków łączących, **plus ręczne mapowanie `ł→l`** (NFD nie rozkłada „ł"). „losos" ma znaleźć „łosoś".
- Rozwijanie aliasów tagów (patrz wyżej).
- Wiele słów = AND. Dopasowanie po fragmencie słowa.
- Filtry-chipy łączą się z wyszukiwaniem.
- Tolerancja literówek: na razie nie. Jeśli kiedyś, to własna prosta logika lub biblioteka sprawdzona na Safari 12.

---

## Dodawanie przepisów (codzienny workflow)

Wklejam Ci przepis (często od Claude'a lub ChatGPT) z poleceniem „dodaj do przepisów". Ty:
1. Przerabiasz go na format powyżej (wyciągasz ustawienia Ninja do panelu, ustawienia TM6 do kroków, dodajesz sensowne tagi i `temp_wewn_c` tam, gdzie pasuje).
2. Jeśli czegoś brakuje lub jest niejednoznaczne (np. brak temperatury), pytasz — nie zgadujesz ustawień urządzeń.
3. Uruchamiasz build z walidacją, commit, push.
4. Odpowiadasz zgodnie z „Format raportu" (w „Co zrobiłem": dodane + slug).

---

## Format raportu

Każdą odpowiedź po zakończonej pracy formatuj tak:

```
## Co zrobiłem
Krótkie punkty, jedna zmiana = jeden punkt. Bez długich opisów technicznych, chyba że o nie zapytam.

## Co musisz zrobić
Numerowana lista moich kroków (klikanie w Netlify, ręczny push, jeśli Twój się nie udał, itp.).

## Do sprawdzenia na iPadzie
Numerowana lista testów z oczekiwanym wynikiem przy każdym.

Commit: <hash> — <pierwsza linia commita> — push: udany / nieudany (+ co zwrócił git)
```

Zasady:
- Wszystko, co mam skopiować (adresy, komendy, tekst do wklejenia), zawsze w bloku kodu.
- Sekcje, które nie mają treści, pomijaj.
- Na końcu jedno zdanie: co jest następnym krokiem.

---

## Kolejność pracy

Mam plan Pro z limitami — **jeden etap na sesję**. Po każdym etapie zatrzymaj się, powiedz mi, co mam sprawdzić na iPadzie, i czekaj.

1. **Hello world + test iPada.** Minimalna strona, deploy. Repo git i zdalne repo na GitHubie zwykle zakłada już skrypt startowy — sprawdź `git remote -v` i zakładaj tylko to, czego brakuje. Ja sprawdzam na iPadzie: czy HTTPS działa, czy „Dodaj do ekranu początkowego" otwiera pełny ekran.
2. **Format + walidacja + 3 przykładowe przepisy:** jeden z Ninja (sync), jeden z TM6 (kroki z ustawieniami, jeden z `temp: "Varoma"`), jeden deser bez urządzeń.
3. **Widok kuchenny:** lista + strona przepisu z panelami, zapamiętywanie stanu, przełącznik jasny/ciemny.
4. **Wyszukiwarka i filtry.**
5. (Później, na moje życzenie) tryb gotowania krok po kroku, minutniki przy krokach, skalowanie porcji.

Ręcznie robię tylko: założenie konta na hostingu i połączenie go z repo GitHub.
