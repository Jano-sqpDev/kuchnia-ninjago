Odpowiadaj samym plikiem .md gotowym do wklejenia, bez komentarzy.

# Format przepisu (schemat v1) — ściąga

Zamień przepis, który dostaniesz, na **jeden plik Markdown** w formacie poniżej. Plik trafia do repozytorium jako `recipes/<slug>.md` i jest wyświetlany na kuchennym iPadzie. Automatyczny walidator odrzuca każdy plik, który łamie choć jedną regułę z tej ściągi.

**Dwa języki:** aplikacja ma interfejs PL i EN. Przepis piszesz po polsku, a w tym samym pliku dodajesz **kompletne tłumaczenie angielskie — blok `translations.en`** (punkt 10). Każdy nowy przepis musi go mieć. Jednostki tylko z listy angielskich skrótów (punkt 4).

**Ustawienia urządzeń** (Ninja: tryb, funkcja, temperatura, czas; Thermomix TM6: czas, temperatura, obroty):
- **Gotowy przepis** (podany przez użytkownika: własny, z internetu, od kogoś) — przenieś ustawienia z przepisu. Jeśli ich **brakuje albo są niejednoznaczne — nie zgaduj**: zamiast pliku odpowiedz krótką listą pytań (to jedyny wyjątek od „samego pliku”).
- **Nowy przepis** (użytkownik prosi o wymyślenie przepisu) — **sam zaproponuj realne ustawienia** dla Ninja DZ400UK / TM6 i dopisz na końcu `description`: „Ustawienia proponowane, do sprawdzenia przy pierwszym gotowaniu.” Pytaj tylko, gdy czegoś nie da się sensownie dobrać.

**Walidacja:** nie pisz, że plik przeszedł walidację (`npm run validate`, `npm test`), jeśli jej nie uruchomiłeś. Agent, który zapisuje przepis w repozytorium (commit na `main`) i nie może uruchomić tych poleceń, pisze to wprost w opisie commita.

## 1. Budowa pliku

```
---
# plik: recipes/<slug>.md
schema_version: 1
title: "…"
… pozostałe pola (YAML) …
---
Opcjonalne notatki zwykłym tekstem.
```

- Plik zaczyna się linią `---`, dane przepisu to **YAML**, zamyka je druga linia `---`.
- Pierwsza linia po `---` to komentarz z nazwą pliku: `# plik: recipes/<slug>.md` (patrz punkt 2).
- Pod zamykającym `---` można dopisać luźne notatki (zwykły tekst). Mogą też nie istnieć.
- Nie dodawaj pola `id`, numerów kroków ani żadnych pól spoza tej ściągi — **nieznane pole to błąd** (na każdym poziomie).
- Pole opcjonalne albo jest wypełnione, albo go nie ma. Pusty tekst (`""`) lub `null` to błąd.

## 2. Nazwa pliku = slug

- `recipes/<slug>.md`, gdzie slug to **tylko małe litery a–z, cyfry i myślniki**.
- **Bez polskich znaków, spacji i wielkich liter**: „Łosoś z cukinią” → `losos-z-cukinia.md`, „Pierogi ruskie” → `pierogi-ruskie.md`.
- Slug jest trwałym identyfikatorem przepisu (adres strony `/p/<slug>/`) — nie zmieniaj go później.

## 3. Pola główne

| Pole | Typ | Wymagane | Uwagi |
|---|---|---|---|
| `schema_version` | liczba, dokładnie `1` | tak | |
| `title` | niepusty tekst | tak | po polsku, w cudzysłowie |
| `description` | tekst | nie | jedno–dwa zdania |
| `servings` | liczba całkowita ≥ 1 | tak | liczba porcji |
| `prep_minutes` | liczba całkowita ≥ 0 | tak | przygotowanie |
| `cook_minutes` | liczba całkowita ≥ 0 | tak | szacowany czas gotowania (nie musi być sumą czasów urządzeń) |
| `tags` | lista tekstów | tak | może być pusta: `[]` — reguły w punkcie 6 |
| `ingredients` | niepusta lista | tak | punkt 4 |
| `steps` | niepusta lista | tak | punkt 5 |
| `ninja` | obiekt | tylko z tagiem `ninja` | punkt 7 |
| `image` | tekst | nie | punkt 9 — zwykle **pomiń** |
| `source` | tekst | nie | skąd przepis, np. `"ChatGPT"` |
| `translations` | obiekt | **tak w każdym nowym przepisie** | tłumaczenie EN — punkt 10 |

## 4. Składniki — `ingredients`

Każdy składnik to element listy:

| Pole | Typ | Wymagane | Uwagi |
|---|---|---|---|
| `name` | niepusty tekst | tak | np. `"małe ziemniaki"` |
| `amount` | liczba > 0 | nie | ułamki z **kropką**: `1.5` (nie `"1,5"`) |
| `unit` | jedna z listy niżej | tak, gdy jest `amount` | **bez `amount` zabronione** |
| `note` | tekst | nie | np. `"drobno posiekana"` |
| `group` | tekst | nie | grupa na liście, np. `"Sos"`, `"Marynata"` |

- **Jednostki — tylko te (angielskie skróty, małymi literami, bez kropek), w obu językach tak samo:**

  | Jednostka | Znaczenie |
  |---|---|
  | `g` | gramy |
  | `kg` | kilogramy |
  | `ml` | mililitry |
  | `l` | litry |
  | `pcs` | sztuki (także ząbki czosnku — wtedy `note: "ząbki"`) |
  | `tbsp` | łyżka |
  | `tsp` | łyżeczka |
  | `pinch` | szczypta |

  **Każda inna jednostka to błąd** (`szt`, `łyżka`, `łyżeczka`, `szczypta`, `ząbek`, `szklanka`…). Coś, czego nie da się tak zapisać (np. „pęczek”, „puszka”), zapisz jako `pcs` z opisem w `note` albo jako składnik bez ilości. `pcs`, `tbsp`, `tsp` i `pinch` przy przeliczaniu porcji zaokrąglają się do połówek, `g` i `ml` do okrągłych wartości.
- Składnik bez ilości jest OK (sól, pieprz „do smaku”): tylko `name`, bez `amount` i bez `unit`.
- **Nazwa składnika zaczyna się od produktu w mianowniku:** „Kalafior”, „Jajka”, „Ziemniaki młode”, „Ser cheddar” — nie „kalafiora”, „mieszanka brokuła i kalafiora” ani „z jajkiem” (szczegóły dopisz po nazwie albo w `note`). Tak lepiej działa wyszukiwanie po produkcie.
- Składniki z tą samą `group` umieszczaj obok siebie.

## 5. Kroki — `steps`

| Pole | Typ | Wymagane | Uwagi |
|---|---|---|---|
| `text` | niepusty tekst | tak | treść kroku |
| `tm6` | obiekt | nie | ustawienia Thermomixa dla tego kroku — punkt 8 |
| `internal_temp_c` | liczba 1–100 | nie | docelowa temperatura **w środku** potrawy (°C) |
| `timer_seconds` | liczba całkowita > 0 | nie | minutnik dla kroku (sekundy) |

- **Ilości tylko na liście składników.** W tekście kroków nie podawaj liczb ilości: „wlej wodę”, nie „wlej 500 ml wody” (przeliczanie porcji zmienia tylko listę składników).
- Nie numeruj kroków — numer wynika z kolejności.
- `internal_temp_c` dodawaj przy drobiu, wieprzowinie i większych kawałkach mięsa, w kroku ze sprawdzeniem termometrem (np. drób: `75`).
- Ustawienia urządzeń nie powtarzaj w tekście kroku — są w panelu Ninja / w `tm6`. Krok może po prostu mówić „Ustaw strefy według panelu Ninja, włącz SYNC, potem START”.

## 6. Tagi — `tags`

- Małe litery, po polsku (polskie znaki są OK: `łosoś`, `wołowina`), bez powtórzeń, np. `[ninja, kurczak, obiad]`.
- Tagi urządzeń: **`ninja`** i **`tm6`** (dokładnie tak).
  - Zapisuj `tm6`, **nigdy** `thermomix`; zapisuj `ninja`, nigdy `airfryer`, `air fryer` ani `af` — te słowa wyszukiwarka i tak rozumie.
  - `ninja` ⇔ przepis ma panel `ninja` (jedno bez drugiego to błąd).
  - `tm6` ⇔ co najmniej jeden krok ma `tm6` (jedno bez drugiego to błąd).
  - Przepis może mieć oba tagi urządzeń albo żaden (np. deser bez gotowania).
- **Tłumaczenia tagów: plik `recipes/tags.yml`** — mapa `tag_PL: tag_EN` (małe litery), np. `obiad: dinner`. W trybie EN aplikacja pokazuje tłumaczenie, a tag bez tłumaczenia — bez zmian (i ostrzeżenie). **Używasz w przepisie tagu, którego nie ma w `recipes/tags.yml` — dopisz go tam** (w tym samym commicie). Tagów urządzeń (`ninja`, `tm6`) nie tłumaczy się.
- Gdy odpowiadasz samym plikiem (bez dostępu do repozytorium), a przepis ma tagi spoza `recipes/tags.yml` albo nie wiesz, jakie tam są — dopisz pod linią `# plik:` komentarz z tłumaczeniami, np. `# tags.yml: zupa: soup, dynia: pumpkin` (komentarz nie psuje pliku; Janusz przeniesie wpisy do `recipes/tags.yml`).

```yaml
# recipes/tags.yml
obiad: dinner
kurczak: chicken
wołowina: beef
```

## 7. Ninja Foodi MAX Dual Zone DZ400UK — `ninja`

Frytkownica z dwiema szufladami (strefami), **bez sondy temperatury**. Jeden panel na cały przepis (nie przy krokach).

| Pole | Wartości | Uwagi |
|---|---|---|
| `mode` | `sync` \| `match` \| `independent` \| `single` | wymagane |
| `zone1` | strefa | zawsze wymagana |
| `zone2` | strefa | wymagana dla `sync`, `match`, `independent`; **zabroniona** dla `single` |

Tryby:
- `sync` — dwie strefy z różnymi ustawieniami, **kończą razem**,
- `match` — dwie strefy z **identycznymi** `function`, `temp_c`, `minutes` (np. za dużo jedzenia na jedną szufladę),
- `independent` — dwie niezależne strefy,
- `single` — tylko jedna szuflada (`zone1`).

Strefa (`zone1` / `zone2`):

| Pole | Typ | Uwagi |
|---|---|---|
| `label` | tekst, opcjonalny | co jest w szufladzie, np. `"Ziemniaki"`, `"Kotlety (2 szt.)"` |
| `function` | **dokładnie** jedna z: `Air Fry`, `Max Crisp`, `Roast`, `Bake`, `Reheat`, `Dehydrate` | wielkość liter i spacje jak tutaj |
| `temp_c` | liczba 40–240 | °C |
| `minutes` | liczba całkowita > 0 | |
| `turn` | obiekt, opcjonalny | przypomnienie o obróceniu / potrząśnięciu — niżej |

Przy liczbie porcji, która nie mieści się w jednej szufladzie, użyj `match` i napisz w kroku, ile czego włożyć do każdej szuflady.

**Obracanie / potrząsanie — `turn`** (w strefie, opcjonalne). Aplikacja ma timer pieczenia i przypomina o obróceniu alarmem. **Brak pola `turn` = obracanie niepotrzebne.**

| Pole | Typ | Uwagi |
|---|---|---|
| `action` | **dokładnie** `flip` albo `shake` (kod, małymi literami) | wymagane; `flip` = obróć (mięso, ryby, większe kawałki); `shake` = potrząśnij (frytki, ziemniaki, warzywa w kawałkach). Aplikacja sama wyświetla „OBRÓĆ” / „POTRZĄŚNIJ” — **nie pisz polskich słów w tym polu** |
| `after_min` | liczba całkowita > 0, **mniejsza niż `minutes` tej strefy** | wymagane; po ilu minutach od startu tej strefy (zwykle mniej więcej w połowie) |
| `required` | `true` / `false` | opcjonalne, domyślnie `true` = alarm; `false` = tylko informacja „można obrócić”, bez alarmu |

- Dodawaj `turn` tylko wtedy, gdy przepis każe obrócić lub potrząsnąć (albo — przy nowym przepisie — gdy to naprawdę poprawia wynik). Gdy to opcjonalne, daj `required: false`.
- W trybie `sync` licz `after_min` od startu **tej** strefy (krótsza strefa w Ninja startuje później — aplikacja sama to uwzględnia).
- Nie powtarzaj czasu obrócenia w tekście kroku z liczbą minut — wystarczy „W połowie pieczenia obróć udka” (alarm poda moment).

```yaml
  zone1:
    label: "Udka"
    function: "Roast"
    temp_c: 200
    minutes: 28
    turn:
      action: flip
      after_min: 14
```

## 8. Thermomix TM6 — `steps[].tm6`

Ustawienia **przy konkretnym kroku** (zmieniają się w trakcie gotowania):

| Pole | Typ | Uwagi |
|---|---|---|
| `duration_seconds` | liczba całkowita > 0 | wymagane; 5 min = `300` |
| `temperature` | liczba 37–120 albo dokładnie `Varoma` | brak pola = bez grzania |
| `speed` | 1–10 co 0.5 (np. `1.5`), `spoon` (obroty łyżki) albo `turbo` | wymagane, chyba że jest `mode` |
| `reverse` | `true` / `false` | obroty wsteczne; domyślnie `false` |
| `mode` | tekst | tryb bez ustawianych obrotów, np. `"Wyrabianie"`, `"gotowanie na parze"` |

## 9. Zdjęcie

- Zdjęcie dodaje się osobno jako plik **`recipes/img/<slug>.jpg`** (ta sama nazwa co plik przepisu). Build sam je znajdzie — pole `image` nie jest potrzebne.
- Formaty: **JPEG, PNG albo HEIC** (zdjęcie prosto z iPhone'a). **WebP i AVIF nie działają.** Rozmiar dowolny — build sam zmniejsza.
- Pole `image` tylko wtedy, gdy zdjęcie ma inną nazwę: `image: img/<plik>.jpg` (ścieżka względem `recipes/`).

## 10. Tłumaczenie EN — `translations.en`

Ten sam plik, na końcu danych YAML (przed zamykającym `---`). Tłumaczysz **tylko teksty** — ilości, jednostki, tagi i ustawienia urządzeń aplikacja bierze z oryginału.

| Pole | Typ | Wymagane | Uwagi |
|---|---|---|---|
| `title` | niepusty tekst | tak | tytuł po angielsku |
| `description` | niepusty tekst | gdy oryginał ma `description` | bez `description` w oryginale — nie dodawaj |
| `ingredients` | lista `{ name, note }` | tak | **tyle samo pozycji i w tej samej kolejności** co `ingredients`; `note` tylko tam, gdzie oryginał ma `note` (wtedy wymagane) |
| `groups` | mapa `nazwa_PL: nazwa_EN` | gdy składniki mają `group` | każda użyta grupa, bez dodatkowych |
| `steps` | lista `{ text, tm6_mode }` | tak | **tyle samo pozycji i w tej samej kolejności** co `steps`; `tm6_mode` tylko tam, gdzie krok ma `tm6.mode` (wtedy wymagane) |
| `labels` | `{ zone1, zone2 }` | gdy strefy Ninja mają `label` | tłumaczenie `label` każdej strefy, która go ma |

- Inne pola w tym bloku są niedozwolone (np. `amount`, `unit`, `tags` — nie tłumaczy się ich); tłumaczenie z takim polem nie zostanie użyte.
- **Brak bloku albo niekompletne tłumaczenie nie blokuje publikacji** — przepis jest na stronie, w trybie EN wyświetla się po polsku ze znaczkiem „PL”, a na liście pojawia się pomarańczowa plakietka „bez tłumaczenia EN”. Mimo to **każdy nowy przepis musi mieć kompletny blok** (`npm run validate` wypisuje ostrzeżenia — przy Twoim przepisie ma ich nie być).
- Po zmianie przepisu (dodany krok, składnik) popraw też tłumaczenie — inaczej przestaje pasować i aplikacja wraca do polskiego.

```yaml
translations:
  en:
    title: "Chicken legs with potatoes"
    ingredients:
      - name: "chicken legs"
      - name: "garlic"
        note: "cloves"
    groups:
      Marynata: "Marinade"
    steps:
      - text: "Rub the chicken legs with the marinade."
      - text: "Steam the vegetables."
        tm6_mode: "steaming"
    labels:
      zone1: "Chicken legs"
      zone2: "Potatoes"
```

## 11. Zasady YAML (żeby plik się wczytał)

- Teksty w podwójnym cudzysłowie: `title: "Zupa: pomidorowa"` — **tekst z dwukropkiem bez cudzysłowu to błąd**.
- Wcięcia **spacjami** (2 na poziom), nigdy tabulatorem.
- Liczby bez cudzysłowu: `servings: 4`, `amount: 1.5`.
- `Varoma`, `spoon`, `turbo`, `sync`, `match` itp. można pisać bez cudzysłowu.
- Każde pole tylko raz.

## 12. Pełny przykład

```yaml
---
# plik: recipes/udka-z-ziemniakami-i-sosem.md
schema_version: 1
title: "Udka z ziemniakami i sosem czosnkowym"
description: "Udka i ziemniaki w dwóch szufladach Ninja, sos zrobiony w TM6."
servings: 4
prep_minutes: 15
cook_minutes: 28
tags: [ninja, tm6, kurczak, obiad]
source: "ChatGPT"

ingredients:
  - name: "udka z kurczaka"
    amount: 8
    unit: pcs
  - name: "małe ziemniaki"
    amount: 600
    unit: g
  - name: "oliwa"
    amount: 2
    unit: tbsp
    group: "Marynata"
  - name: "papryka wędzona"
    amount: 1
    unit: tsp
    group: "Marynata"
  - name: "sól"
    group: "Marynata"
  - name: "jogurt naturalny"
    amount: 200
    unit: g
    group: "Sos"
  - name: "czosnek"
    amount: 2
    unit: pcs
    note: "ząbki"
    group: "Sos"

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

steps:
  - text: "Osusz udka i natrzyj częścią marynaty. Ziemniaki przekrój na pół i wymieszaj z resztą marynaty."
  - text: "Udka włóż do strefy 1, ziemniaki do strefy 2. Ustaw strefy według panelu Ninja, włącz SYNC, potem START."
  - text: "W połowie pieczenia potrząśnij szufladą z ziemniakami, a udka obróć."
    timer_seconds: 840
  - text: "Do naczynia miksującego wrzuć czosnek i rozdrobnij."
    tm6:
      duration_seconds: 5
      speed: 5
  - text: "Dodaj jogurt i wymieszaj."
    tm6:
      duration_seconds: 20
      speed: 2
      reverse: true
  - text: "Sprawdź udka termometrem w najgrubszym miejscu, przy kości."
    internal_temp_c: 75

translations:
  en:
    title: "Chicken legs with potatoes and garlic sauce"
    description: "Chicken legs and potatoes in two Ninja drawers, sauce made in the TM6."
    ingredients:
      - name: "chicken legs"
      - name: "baby potatoes"
      - name: "olive oil"
      - name: "smoked paprika"
      - name: "salt"
      - name: "plain yoghurt"
      - name: "garlic"
        note: "cloves"
    groups:
      Marynata: "Marinade"
      Sos: "Sauce"
    steps:
      - text: "Pat the chicken legs dry and rub with some of the marinade. Halve the potatoes and toss with the rest of the marinade."
      - text: "Put the chicken in zone 1 and the potatoes in zone 2. Set the zones as shown on the Ninja panel, press SYNC, then START."
      - text: "Halfway through, shake the potato drawer and turn the chicken legs."
      - text: "Put the garlic in the mixing bowl and chop."
      - text: "Add the yoghurt and mix."
      - text: "Check the chicken with a thermometer at the thickest part, next to the bone."
    labels:
      zone1: "Chicken legs"
      zone2: "Potatoes"
---
Sos można przygotować dzień wcześniej.
```
