# Instrukcja dla agentów (Codex, ChatGPT i inni)

To repozytorium to kuchenny wyświetlacz przepisów na starym iPadzie. Kod aplikacji utrzymuje Claude Code według `CLAUDE.md` — **Ty zajmujesz się wyłącznie przepisami.**

## Twoje zadanie

- Dodawanie i poprawianie przepisów: pliki `recipes/<slug>.md`.
- Dodawanie zdjęć przepisów: pliki `recipes/img/<slug>.jpg` (albo `.png`, `.heic`).
- Format przepisu, wszystkie pola i reguły: **`docs/FORMAT-PRZEPISU.md`** — przeczytaj całość przed pracą i trzymaj się jej dokładnie.

## Czego nie wolno

- **Nie zmieniaj niczego poza `recipes/` i `recipes/img/`**: kodu aplikacji (`src/`, `tools/`), testów (`tests/`), konfiguracji (`package.json`, `package-lock.json`, `.gitignore` itd.), dokumentacji (`CLAUDE.md`, `AGENTS.md`, `docs/`).
- Nie instaluj ani nie aktualizuj zależności.
- **Nie zgaduj ustawień urządzeń** (Ninja: funkcja, temperatura, czas, tryb; Thermomix TM6: czas, temperatura, obroty). Jeśli w przepisie ich brakuje albo są niejasne — zapytaj, zamiast tworzyć pull request.
- Nie zmieniaj nazwy (slugu) istniejących przepisów — to ich trwały adres.

## Zanim skończysz

Uruchom (za pierwszym razem najpierw `npm install`):

```
npm run validate
npm test
```

**Oba polecenia muszą przejść bez błędów.** Jeśli coś pada — popraw przepis (nie testy ani kod) i uruchom ponownie. Komunikat walidatora ma postać `plik.md → ścieżka.pola: przyczyna`, np. `pierogi.md → steps[2].tm6.speed: niepoprawna wartość 11` (`steps[2]` = krok 3).

## Pull request

- **Jeden przepis = jeden pull request** (przepis razem z jego zdjęciem).
- Tytuł: **`Przepis: <tytuł przepisu>`**, np. `Przepis: Pierogi ruskie`.
- W opisie: skąd przepis i czy coś było niejasne.
