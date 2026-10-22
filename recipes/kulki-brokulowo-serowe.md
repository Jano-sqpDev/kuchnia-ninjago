---
# plik: recipes/kulki-brokulowo-serowe.md
schema_version: 1
title: "Kulki brokułowo-serowe"
description: "Chrupiące kulki z brokułów, ciecierzycy i prawdziwego sera, w panierce panko. Łagodna rodzinna wersja bez wegańskich zamienników. Ustawienia proponowane, do sprawdzenia przy pierwszym gotowaniu."
servings: 17
prep_minutes: 45
cook_minutes: 12
tags: [ninja, tm6, warzywa, obiad, norm, kids]
source: "Na podstawie Air Fryer Broccoli Cheese Bites (Julia); uproszczona wersja rodzinna ChatGPT"

ingredients:
  - name: "Brokuły"
    amount: 350
    unit: g
    note: "różyczki, masa przed blanszowaniem"
    group: "Masa"
  - name: "Ciecierzyca konserwowa"
    amount: 240
    unit: g
    note: "waga po odsączeniu"
    group: "Masa"
  - name: "Ser cheddar"
    amount: 100
    unit: g
    note: "starty"
    group: "Masa"
  - name: "Ser parmezan"
    amount: 30
    unit: g
    note: "drobno starty"
    group: "Masa"
  - name: "Jajko"
    amount: 1
    unit: pcs
    group: "Masa"
  - name: "Panko"
    amount: 50
    unit: g
    note: "do związania masy"
    group: "Masa"
  - name: "Czosnek granulowany"
    amount: 0.5
    unit: tsp
    group: "Masa"
  - name: "Cebula granulowana"
    amount: 0.5
    unit: tsp
    group: "Masa"
  - name: "Sól"
    note: "niewielka ilość do smaku; sery są już słone"
    group: "Masa"
  - name: "Panko"
    amount: 50
    unit: g
    note: "do obtoczenia kulek"
    group: "Panierka"
  - name: "Olej rzepakowy"
    note: "do lekkiego spryskania panierki"
    group: "Panierka"

ninja:
  mode: match
  zone1:
    label: "Kulki brokułowo-serowe"
    function: "Air Fry"
    temp_c: 200
    minutes: 12
    turn:
      action: flip
      after_min: 6
      required: true
  zone2:
    label: "Kulki brokułowo-serowe"
    function: "Air Fry"
    temp_c: 200
    minutes: 12
    turn:
      action: flip
      after_min: 6
      required: true

steps:
  - text: "Podziel brokuły na małe różyczki. Blanszuj we wrzątku przez 2 minuty, schłodź zimną wodą i bardzo dokładnie osusz. Zbyt mokre brokuły sprawią, że kulki będą się rozpadać."
  - text: "Włóż osuszone brokuły do naczynia TM6 i krótko rozdrobnij. Powinny powstać drobne kawałki, nie puree; w razie potrzeby zbierz większe kawałki kopystką i rozdrobnij ponownie krótkim impulsem."
    tm6:
      duration_seconds: 4
      speed: 4
  - text: "Ciecierzycę odsącz i rozgnieć widelcem. W dużej misce połącz ją z brokułami, cheddarem, parmezanem, jajkiem, panko przeznaczonym do masy i przyprawami. Wymieszaj ręką lub łyżką. Masa powinna się sklejać po ściśnięciu."
  - text: "Uformuj około 17 niedużych kulek, mocno je ściskając. Obtocz każdą w panko przeznaczonym na panierkę i delikatnie dociśnij panierkę do powierzchni."
  - text: "Ułóż kulki na tacy i wstaw do lodówki na 30 minut, aby masa stężała. Nie pomijaj chłodzenia podczas pierwszego testu."
  - text: "Rozłóż kulki w jednej warstwie w obu szufladach Ninja, mniej więcej po połowie w każdej. Pozostaw niewielkie odstępy; jeśli się nie mieszczą, piecz partiami. Lekko spryskaj panierkę olejem. Ustaw MATCH według panelu Ninja i uruchom pieczenie."
  - text: "W połowie pieczenia ostrożnie obróć każdą kulkę szczypcami lub łopatką, żeby panierka zrumieniła się równomiernie. Aby otrzymać przypomnienie, uruchom minutnik pieczenia w aplikacji równocześnie z Ninją."
  - text: "Na koniec sprawdź, czy panierka jest złocista i chrupiąca, ser się roztopił, a środek jest dobrze rozgrzany i ścięty. Jeśli potrzeba, dopiekaj krótko, kontrolując rezultat."
  - text: "Podawaj na ciepło z ulubionym sosem, np. jogurtowo-czosnkowym lub ketchupem. Do lunchboxa całkowicie wystudź i przechowuj schłodzone."

translations:
  en:
    title: "Broccoli and cheese bites"
    description: "Crispy broccoli, chickpea and real-cheese bites coated in panko. A mild family version without vegan substitutes. Suggested settings; check them on the first cook."
    ingredients:
      - name: "Broccoli"
        note: "florets, weight before blanching"
      - name: "Tinned chickpeas"
        note: "drained weight"
      - name: "Cheddar cheese"
        note: "grated"
      - name: "Parmesan cheese"
        note: "finely grated"
      - name: "Egg"
      - name: "Panko breadcrumbs"
        note: "to bind the mixture"
      - name: "Garlic powder"
      - name: "Onion powder"
      - name: "Salt"
        note: "a little to taste; the cheeses are already salty"
      - name: "Panko breadcrumbs"
        note: "to coat the bites"
      - name: "Rapeseed oil"
        note: "for lightly spraying the coating"
    groups:
      Masa: "Mixture"
      Panierka: "Coating"
    steps:
      - text: "Cut the broccoli into small florets. Blanch in boiling water for 2 minutes, cool under cold water and dry very thoroughly. Excess moisture can make the bites fall apart."
      - text: "Place the dried broccoli in the TM6 bowl and chop briefly. Aim for small pieces, not a puree; scrape down any large pieces and pulse again briefly if needed."
      - text: "Drain the chickpeas and mash with a fork. In a large bowl combine with the broccoli, cheddar, Parmesan, egg, the panko for the mixture and seasonings. Mix by hand or with a spoon. The mixture should hold together when squeezed."
      - text: "Shape approximately 17 small bites, firmly compressing each one. Roll each bite in the panko for coating and press the crumbs gently onto the surface."
      - text: "Arrange the bites on a tray and chill in the fridge for 30 minutes to firm up. Do not skip chilling on the first test."
      - text: "Arrange the bites in one layer across the two Ninja drawers, roughly half in each. Leave small gaps; if they do not fit, cook in batches. Spray the coating lightly with oil. Set MATCH according to the Ninja panel and start cooking."
      - text: "Halfway through, carefully turn each bite with tongs or a spatula so the coating browns evenly. To receive the reminder, start the cooking timer in the app at the same time as the Ninja."
      - text: "At the end check that the coating is golden and crisp, the cheese has melted and the centre is thoroughly heated and set. If needed, air fry a little longer, checking frequently."
      - text: "Serve warm with a favourite dip such as garlic yoghurt sauce or ketchup. For lunchboxes, cool completely and keep chilled."
    labels:
      zone1: "Broccoli and cheese bites"
      zone2: "Broccoli and cheese bites"
---
Wersja niewegańska inspirowana przepisem Air Fryer Broccoli Cheese Bites. Ustawienia i konsystencja masy wymagają potwierdzenia podczas pierwszego wypieku.
