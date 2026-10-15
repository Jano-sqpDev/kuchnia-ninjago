# kuchnia-ninjago

Kuchenny wyświetlacz przepisów na starym iPadzie (Safari 12). Szczegóły w `CLAUDE.md`.

## Polecenia

```
npm install         # raz, po sklonowaniu repo
npm run validate    # sama walidacja przepisów z recipes/
npm run build       # walidacja + budowa strony do _site/
npm test            # testy walidatora, wyszukiwania i buildu
```

Przepisy: `recipes/<slug>.md` — format opisany w `CLAUDE.md` („Format przepisu”).
Zdjęcia: `recipes/img/` (JPEG/PNG) — build sam robi miniaturę 300 px i dużą wersję 1200 px.

Kod na iPada: `src/app.js` + `src/app.css` (Safari 12 — zasady w `CLAUDE.md`). Podgląd zaakceptowanego projektu: `/mockup.html`.
