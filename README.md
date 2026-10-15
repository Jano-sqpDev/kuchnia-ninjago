# kuchnia-ninjago

Kuchenny wyświetlacz przepisów na starym iPadzie (Safari 12). Hosting: Cloudflare Pages — https://kuchnia-ninjago.pages.dev (publikacja po każdym pushu na `main`). Szczegóły w `CLAUDE.md`.

## Polecenia

```
npm install         # raz, po sklonowaniu repo
npm run validate    # sama walidacja przepisów z recipes/
npm run build       # walidacja + budowa strony do _site/
npm test            # testy walidatora, wyszukiwania i buildu
npm run wypchnij    # testy + build, a git push tylko gdy wszystko przeszło
```

Przepisy: `recipes/<slug>.md` — format opisany w `CLAUDE.md` („Format przepisu”).
Zdjęcia: `recipes/img/` (JPEG/PNG) — build sam robi miniaturę 300 px i dużą wersję 1200 px.

Kod na iPada: `src/app.js` + `src/app.css` (Safari 12 — zasady w `CLAUDE.md`). Podgląd zaakceptowanego projektu: `/mockup.html`.
