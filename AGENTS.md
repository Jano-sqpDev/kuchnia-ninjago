# Instrukcja dla agentów (Codex, ChatGPT i inni)

To repozytorium to kuchenny wyświetlacz przepisów na starym iPadzie. Kod aplikacji utrzymuje Claude Code według `CLAUDE.md` — **Ty zajmujesz się wyłącznie przepisami.**

## Twoje zadanie

- Dodawanie i poprawianie przepisów: pliki `recipes/<slug>.md`.
- Dodawanie zdjęć przepisów: pliki `recipes/img/<slug>.jpg` (albo `.png`, `.heic`).
- Format przepisu, wszystkie pola i reguły: **`docs/FORMAT-PRZEPISU.md`** — przeczytaj całość przed pracą i trzymaj się jej dokładnie.

## Czego nie wolno

- **Nie zmieniaj niczego poza `recipes/` i `recipes/img/`**: kodu aplikacji (`src/`, `tools/`), testów (`tests/`), konfiguracji (`package.json`, `package-lock.json`, `.gitignore` itd.), dokumentacji (`CLAUDE.md`, `AGENTS.md`, `docs/`).
- Nie instaluj ani nie aktualizuj zależności.
- Nie zmieniaj nazwy (slugu) istniejących przepisów — to ich trwały adres.

## Ustawienia urządzeń (Ninja DZ400UK, Thermomix TM6)

Ustawienia to: Ninja — tryb, funkcja, temperatura, czas każdej strefy; TM6 — czas, temperatura, obroty (i obroty wsteczne).

- **Gotowy przepis** (własny użytkownika, z internetu, od kogoś): przenieś ustawienia z przepisu. **Jeśli ich brakuje albo są niejasne — zapytaj, nie zgaduj** i nie twórz pull requestu, dopóki ich nie dostaniesz.
- **Nowy przepis** (użytkownik prosi o wymyślenie przepisu): **sam zaproponuj realne ustawienia** dla Ninja DZ400UK / TM6 i dopisz na końcu `description` zdanie: **„Ustawienia proponowane, do sprawdzenia przy pierwszym gotowaniu.”** Pytaj tylko wtedy, gdy czegoś nie da się sensownie dobrać.

## Zanim skończysz

Uruchom (za pierwszym razem najpierw `npm install`):

```
npm run validate
npm test
```

**Oba polecenia muszą przejść bez błędów.** Jeśli coś pada — popraw przepis (nie testy ani kod) i uruchom ponownie.

**Jeśli nie możesz uruchomić tych poleceń** (brak terminala, brak Node.js, brak dostępu do sieci przy `npm install`) — napisz to wprost w opisie pull requestu, np. „Nie uruchomiłem `npm run validate` ani `npm test` — brak dostępu do terminala”. **Nigdy nie pisz, że walidacja przeszła, jeśli jej nie uruchomiłeś.** Komunikat walidatora ma postać `plik.md → ścieżka.pola: przyczyna`, np. `pierogi.md → steps[2].tm6.speed: niepoprawna wartość 11` (`steps[2]` = krok 3).

## Pull request

- **Jeden przepis = jeden pull request** (przepis razem z jego zdjęciem).
- Tytuł: **`Przepis: <tytuł przepisu>`**, np. `Przepis: Pierogi ruskie`.
- W opisie: skąd przepis (gotowy czy nowy), czy ustawienia urządzeń są z przepisu, czy proponowane, czy coś było niejasne oraz wynik `npm run validate` i `npm test` (albo informacja, że nie dało się ich uruchomić).
