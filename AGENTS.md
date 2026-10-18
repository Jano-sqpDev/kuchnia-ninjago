# Instrukcja dla agentów (Codex, ChatGPT i inni)

To repozytorium to kuchenny wyświetlacz przepisów na starym iPadzie. Kod aplikacji utrzymuje Claude Code według `CLAUDE.md` — **Ty zajmujesz się wyłącznie przepisami.**

## Twoje zadanie

- Dodawanie i poprawianie przepisów: pliki `recipes/<slug>.md`.
- Dodawanie zdjęć przepisów: pliki `recipes/img/<slug>.jpg` (albo `.png`, `.heic`).
- Tłumaczenia tagów na angielski i znaczniki (kolorowe plakietki): `recipes/tags.yml` (mapa `tag_PL: tag_EN`; znacznik: `tag: { en: …, badge: …, color: … }`).
- Wzorcowe przykłady formatu (tylko do podglądu, nie zmieniaj ich): `tests/fixtures/recipes/`.
- Format przepisu, wszystkie pola i reguły: **`docs/FORMAT-PRZEPISU.md`** — przeczytaj całość przed pracą i trzymaj się jej dokładnie.

## Dwa języki (PL / EN) — obowiązkowe przy każdym nowym przepisie

Aplikacja ma interfejs po polsku i po angielsku (przełącznik „PL | EN”). Dlatego:

- **Każdy NOWY przepis musi mieć kompletny blok `translations.en`** (tytuł, opis, wszystkie składniki i kroki w tej samej kolejności, grupy, opisy szuflad Ninja — `docs/FORMAT-PRZEPISU.md`, punkt 10). Przy poprawianiu przepisu zaktualizuj też tłumaczenie (dodany krok = dodany krok w `translations.en.steps`).
- **Jednostki tylko z listy:** `g`, `kg`, `ml`, `l`, `pcs`, `tbsp`, `tsp`, `pinch` (angielskie skróty, w obu językach). Każda inna jednostka to błąd walidacji.
- **Nowy tag** (taki, którego nie ma w `recipes/tags.yml`) — dopisz go do `recipes/tags.yml` z tłumaczeniem, w tym samym commicie co przepis.
- **Znaczniki (plakietki LOW / NORM / KIDS) — każdy przepis musi mieć dokładnie jeden z `low` albo `norm`, a `kids` dodatkowo, gdy pasuje:**
  - **LOW** (tag `low`) — przepis dla Janusza na redukcję: zbilansowany albo naturalnie pasujący do jego bilansu kalorii i białka, **bez dodawania odżywki**. Oceniasz **standardową porcję z pola `servings`**, nie cały wypiek ani garnek. Samo wystąpienie cukru, czekolady czy odżywki nie decyduje.
  - **NORM** (tag `norm`) — zwykły przepis, niekoniecznie redukcyjny.
  - **KIDS** (tag `kids`) — przepis także dla dzieci, bez dodatków wprowadzanych dla suplementacji Janusza. Dodatkowy — łączy się z LOW albo NORM.
  - Karolina nie ma znacznika — korzysta ze wszystkich przepisów.
  - **Każdy przepis ma dokładnie jeden znacznik diety: `low` ALBO `norm`.** Dozwolone: LOW, NORM, LOW+KIDS, NORM+KIDS. `low` i `norm` naraz to błąd (przepis znika ze strony); brak obu to ostrzeżenie (przepis jest, ale na liście braków).
  - W tytule nie pisz „Kids”, „Low”, „Norm”, „TM6”, „Ninja” — od tego są plakietki.
  - Nowy znacznik tylko na wyraźną prośbę użytkownika: wpis w `recipes/tags.yml` z `badge` (1–6 znaków, A–Z / cyfry), `color` (wyłącznie `yellow`, `green`, `orange`, `pink`, `red`) i ewentualnie `group` — `docs/FORMAT-PRZEPISU.md`, punkt 6.
- Brak lub niekompletne tłumaczenie nie blokuje publikacji (to tylko ostrzeżenie — przepis wyświetla się wtedy po polsku), ale **`npm run validate` nie może wypisać żadnego ostrzeżenia dotyczącego Twojego przepisu.**

## Czego nie wolno

- **Nie zmieniaj niczego poza `recipes/` (przepisy, `recipes/img/`, `recipes/tags.yml`)**: kodu aplikacji (`src/`, `tools/`), testów (`tests/`), konfiguracji (`package.json`, `package-lock.json`, `.gitignore` itd.), dokumentacji (`CLAUDE.md`, `AGENTS.md`, `docs/`).
- Nie instaluj ani nie aktualizuj zależności.
- Nie zmieniaj nazwy (slugu) istniejących przepisów — to ich trwały adres.

## Jak przepis wygląda w aplikacji (od v0.7)

Pasek: tytuł i czasy (`prep_minutes`, `cook_minutes`). Pod nim przypięte wyświetlacze Ninja i TM6, potem karta składników z licznikiem porcji i kroki; `description` i notatki pod spodem są na samym dole. Tagi nie są widoczne na ekranie przepisu — służą wyszukiwarce i filtrom. Dlatego ważne informacje dla gotującego pisz w krokach, nie w opisie.

## Wyszukiwarka w aplikacji

Lista przepisów ma wyszukiwarkę (tytuł, składniki, tagi — po polsku i po angielsku) i filtry: Ninja, TM6, funkcje Ninja. Dlatego trafne tytuły, nazwy składników, tagi (z wpisem w `recipes/tags.yml`) i kompletne `translations.en` sprawiają, że przepis da się znaleźć w obu językach. Tagi urządzeń `ninja` / `tm6` i funkcje w panelu `ninja` decydują o filtrach.

Wyszukiwarka dopasowuje słowa dokładnie, potem z polską odmianą (rdzeń: „kalafiorem” znajdzie „kalafior”), a literówki poprawia tylko awaryjnie. Najlepiej działa, gdy **nazwa składnika zaczyna się od produktu w mianowniku** — „Kalafior”, „Jajka”, „Ziemniaki młode”, a nie „kalafiora” albo „z jajkiem” (`docs/FORMAT-PRZEPISU.md`, punkt 4).

## Ustawienia urządzeń (Ninja DZ400UK, Thermomix TM6)

Ustawienia to: Ninja — tryb, funkcja, temperatura, czas każdej strefy oraz obracanie/potrząsanie (`turn`); TM6 — czas, temperatura, obroty (i obroty wsteczne).

**Obracanie w Ninja — pole `ninja.zoneN.turn`** (szczegóły w `docs/FORMAT-PRZEPISU.md`, punkt 7): `action: flip` (obróć) albo `action: shake` (potrząśnij) — dokładnie te kody, nie polskie słowa, `after_min` (po ilu minutach od startu strefy, mniej niż `minutes` strefy), `required: false` gdy to tylko opcja. Aplikacja ma timer, który przypomina o obróceniu alarmem — dodawaj `turn`, gdy przepis każe obrócić lub potrząsnąć. Brak `turn` = obracanie niepotrzebne. Przy gotowym przepisie bierz moment obrócenia z przepisu (np. „w połowie” = połowa czasu strefy); przy nowym — zaproponuj go jak resztę ustawień.

- **Gotowy przepis** (własny użytkownika, z internetu, od kogoś): przenieś ustawienia z przepisu. **Jeśli ich brakuje albo są niejasne — zapytaj, nie zgaduj** i nie zapisuj przepisu, dopóki ich nie dostaniesz.
- **Nowy przepis** (użytkownik prosi o wymyślenie przepisu): **sam zaproponuj realne ustawienia** dla Ninja DZ400UK / TM6 i dopisz na końcu `description` zdanie: **„Ustawienia proponowane, do sprawdzenia przy pierwszym gotowaniu.”** Pytaj tylko wtedy, gdy czegoś nie da się sensownie dobrać.

## Zanim skończysz

Uruchom (za pierwszym razem najpierw `npm install`):

```
npm run validate
npm test
```

**Oba polecenia muszą przejść bez błędów**, a `npm run validate` nie może pokazać ostrzeżeń (`⚠`) dla przepisu, który dodajesz lub poprawiasz (brak tłumaczenia EN, tag bez wpisu w `recipes/tags.yml`). Jeśli coś pada — popraw przepis (nie testy ani kod) i uruchom ponownie.

**Jeśli nie możesz uruchomić tych poleceń** (brak terminala, brak Node.js, brak dostępu do sieci przy `npm install`) — napisz to wprost w opisie commita (i w odpowiedzi dla użytkownika), np. „Nie uruchomiłem `npm run validate` ani `npm test` — brak dostępu do terminala”. **Nigdy nie pisz, że walidacja przeszła, jeśli jej nie uruchomiłeś.** Komunikat walidatora ma postać `plik.md → ścieżka.pola: przyczyna`, np. `pierogi.md → steps[2].tm6.speed: niepoprawna wartość 11` (`steps[2]` = krok 3).

## Zapis zmian: commit bezpośrednio na `main`

- Zmiany w przepisach zapisuj **bezpośrednio na gałęzi `main`, bez pull requestów** — strona publikuje się sama po każdym commicie.
- **Jeden przepis = jeden commit** (przepis razem z jego zdjęciem i nowymi tagami w `recipes/tags.yml`).
- Pierwsza linia opisu commita: **`Przepis: <tytuł przepisu>`**, np. `Przepis: Pierogi ruskie`.
- Dalej w opisie: skąd przepis (gotowy czy nowy), czy ustawienia urządzeń są z przepisu, czy proponowane, czy coś było niejasne oraz wynik `npm run validate` i `npm test` (albo informacja, że nie dało się ich uruchomić).
- **Pull request tylko wtedy, gdy użytkownik wprost o to poprosi** (wtedy tytuł PR taki sam: `Przepis: <tytuł>`).
