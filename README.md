# kuchnia-ninjago

Kuchenny wyświetlacz przepisów na starym iPadzie (Safari 12). Hosting: Cloudflare Pages — https://kuchnia-ninjago.sqpdev.com (zapasowo https://kuchnia-ninjago.pages.dev; publikacja po każdym pushu na `main`). Szczegóły w `CLAUDE.md`.

## Polecenia

```
npm install         # raz, po sklonowaniu repo
npm run validate    # sama walidacja przepisów z recipes/ (błędy + ostrzeżenia o tłumaczeniu EN)
npm run build       # walidacja + budowa strony do _site/
npm test            # testy walidatora, wyszukiwania (także zgodność kopii w app.js z tools/search.mjs) i buildu
npm run deploy      # testy + build, a git push tylko gdy wszystko przeszło
npm run icons       # ikony ekranu początkowego do public/
```

Przepisy: `recipes/<slug>.md` — format: `docs/FORMAT-PRZEPISU.md` (ściąga do wklejenia do ChatGPT). Zewnętrzni agenci (Codex): `AGENTS.md`.
Przepis z błędem nie psuje publikacji: build go pomija, a na liście w aplikacji pojawia się czerwona plakietka z opisem błędów.
Dwa języki (PL / EN, przełącznik w aplikacji): tłumaczenie przepisu w bloku `translations.en` tego samego pliku, tłumaczenia tagów w `recipes/tags.yml`. Brak tłumaczenia to tylko ostrzeżenie (pomarańczowa plakietka, przepis w trybie EN po polsku).
Wyszukiwarka i filtry na liście (Etap 4): logika w `tools/search.mjs` (jedno źródło prawdy), dosłowna kopia `normalize` / `matchesQuery` w `src/app.js` pilnowana testem; szuka po polu `text` z `search.json` w obu językach.
Przykłady wzorcowe i testy buildu: `tests/fixtures/recipes/` — testy nie zależą od zawartości `recipes/`.
Zdjęcia: `recipes/img/<slug>.jpg` (JPEG/PNG/HEIC, znajdowane po nazwie) — build sam robi miniaturę 300 px i dużą wersję 1200 px.

Kod na iPada: `src/app.js` + `src/app.css` (Safari 12 — zasady w `CLAUDE.md`). Podgląd zaakceptowanego projektu: `/mockup.html`, kolejne projekty do obejrzenia: `/mockup2.html`, `/mockup3.html`.
