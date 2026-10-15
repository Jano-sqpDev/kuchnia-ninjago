Odpowiadaj samym plikiem .md gotowym do wklejenia, bez komentarzy.

# Format przepisu (schemat v1) — ściąga

Zamień przepis, który dostaniesz, na **jeden plik Markdown** w formacie poniżej. Plik trafia do repozytorium jako `recipes/<slug>.md` i jest wyświetlany na kuchennym iPadzie. Automatyczny walidator odrzuca każdy plik, który łamie choć jedną regułę z tej ściągi.

**Ustawienia urządzeń** (Ninja: tryb, funkcja, temperatura, czas; Thermomix TM6: czas, temperatura, obroty):
- **Gotowy przepis** (podany przez użytkownika: własny, z internetu, od kogoś) — przenieś ustawienia z przepisu. Jeśli ich **brakuje albo są niejednoznaczne — nie zgaduj**: zamiast pliku odpowiedz krótką listą pytań (to jedyny wyjątek od „samego pliku”).
- **Nowy przepis** (użytkownik prosi o wymyślenie przepisu) — **sam zaproponuj realne ustawienia** dla Ninja DZ400UK / TM6 i dopisz na końcu `description`: „Ustawienia proponowane, do sprawdzenia przy pierwszym gotowaniu.” Pytaj tylko, gdy czegoś nie da się sensownie dobrać.

**Walidacja:** nie pisz, że plik przeszedł walidację (`npm run validate`, `npm test`), jeśli jej nie uruchomiłeś. Agent, który tworzy pull request i nie może uruchomić tych poleceń, pisze to wprost w opisie PR.

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

## 4. Składniki — `ingredients`

Każdy składnik to element listy:

| Pole | Typ | Wymagane | Uwagi |
|---|---|---|---|
| `name` | niepusty tekst | tak | np. `"małe ziemniaki"` |
| `amount` | liczba > 0 | nie | ułamki z **kropką**: `1.5` (nie `"1,5"`) |
| `unit` | niepusty tekst | tak, gdy jest `amount` | **bez `amount` zabronione** |
| `note` | tekst | nie | np. `"drobno posiekana"` |
| `group` | tekst | nie | grupa na liście, np. `"Sos"`, `"Marynata"` |

- **Jednostki:** `szt`, `g`, `ml`, `łyżka`, `łyżeczka` (bez kropek: `szt`, nie `szt.`). Inne (np. `kg`, `l`, `szczypta`, `ząbek`) są dozwolone, ale przy przeliczaniu porcji zaokrąglają się mniej ładnie — używaj ich tylko, gdy trzeba.
- Składnik bez ilości jest OK (sól, pieprz „do smaku”): tylko `name`, bez `amount` i bez `unit`.
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
| `action` | **dokładnie** `obróć` albo `potrząśnij` | wymagane; `obróć` — mięso, ryby, większe kawałki; `potrząśnij` — frytki, ziemniaki, warzywa w kawałkach |
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
      action: obróć
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

## 10. Zasady YAML (żeby plik się wczytał)

- Teksty w podwójnym cudzysłowie: `title: "Zupa: pomidorowa"` — **tekst z dwukropkiem bez cudzysłowu to błąd**.
- Wcięcia **spacjami** (2 na poziom), nigdy tabulatorem.
- Liczby bez cudzysłowu: `servings: 4`, `amount: 1.5`.
- `Varoma`, `spoon`, `turbo`, `sync`, `match` itp. można pisać bez cudzysłowu.
- Każde pole tylko raz.

## 11. Pełny przykład

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
    unit: szt
  - name: "małe ziemniaki"
    amount: 600
    unit: g
  - name: "oliwa"
    amount: 2
    unit: łyżka
    group: "Marynata"
  - name: "papryka wędzona"
    amount: 1
    unit: łyżeczka
    group: "Marynata"
  - name: "sól"
    group: "Marynata"
  - name: "jogurt naturalny"
    amount: 200
    unit: g
    group: "Sos"
  - name: "czosnek"
    amount: 2
    unit: szt
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
      action: obróć
      after_min: 14
  zone2:
    label: "Ziemniaki"
    function: "Air Fry"
    temp_c: 200
    minutes: 22
    turn:
      action: potrząśnij
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
---
Sos można przygotować dzień wcześniej.
```
