---
# plik: recipes/kurczak-cytrynowo-czosnkowy-z-ziemniakami-i-marchewka.md
schema_version: 1
title: "Kurczak cytrynowo-czosnkowy z ziemniakami i marchewką"
description: "Cała pierś w marynacie cytrynowo-czosnkowej z ziemniakami, marchewką i zimnym sosem skyr. Marchewkę dodajemy w trakcie pieczenia. Ustawienia proponowane, do sprawdzenia przy pierwszym gotowaniu. Szacunkowo 550 kcal i 69 g białka na porcję (cały lunch, łącznie z dodatkami)."
servings: 1
prep_minutes: 12
cook_minutes: 25
tags: [ninja, low, obiad, wysokobiałkowe, kurczak]
source: "ChatGPT — autorski przepis na podstawie zatwierdzonego planu lunchów"
ingredients:
  - name: "Pierś kurczaka"
    amount: 250
    unit: g
    note: "surowa, w całości"
    group: "Kurczak"
  - name: "Sok z cytryny"
    amount: 15
    unit: ml
    group: "Kurczak"
  - name: "Czosnek"
    amount: 1
    unit: pcs
    note: "ząbek, rozgnieciony"
    group: "Kurczak"
  - name: "Oregano suszone"
    amount: 0.5
    unit: tsp
    group: "Kurczak"
  - name: "Rozmaryn suszony"
    amount: 0.25
    unit: tsp
    group: "Kurczak"
  - name: "Sól"
    group: "Kurczak"
  - name: "Pieprz czarny"
    group: "Kurczak"
  - name: "Ziemniaki"
    amount: 200
    unit: g
    group: "Dodatki"
  - name: "Marchewka"
    amount: 150
    unit: g
    group: "Dodatki"
  - name: "Oliwa ze spryskiwacza"
    amount: 1
    unit: g
    group: "Dodatki"
  - name: "Skyr naturalny"
    amount: 50
    unit: g
    group: "Sos"
  - name: "Sok z cytryny"
    amount: 5
    unit: ml
    group: "Sos"
  - name: "Czosnek"
    amount: 1
    unit: pcs
    note: "ząbek, drobno starty"
    group: "Sos"
  - name: "Woda"
    amount: 5
    unit: ml
    note: "do rozrzedzenia"
    group: "Sos"
ninja:
  mode: sync
  zone1:
    label: "Pierś kurczaka"
    function: "Air Fry"
    temp_c: 190
    minutes: 25
  zone2:
    label: "Ziemniaki i marchewka"
    function: "Air Fry"
    temp_c: 190
    minutes: 22
    turn:
      action: shake
      after_min: 11
steps:
  - text: "Osusz pierś. Połącz sok z cytryny, czosnek, oregano, rozmaryn, sól i pieprz; natrzyj mięso i spryskaj częścią oliwy."
  - text: "Ziemniaki pokrój w łódeczki, marchewkę w słupki. Do szuflady 2 włóż tylko ziemniaki, spryskaj resztą oliwy. Marchewkę zostaw na później."
  - text: "Umieść pierś w strefie 1, ziemniaki w strefie 2. Wybierz SYNC i START według panelu Ninja."
  - text: "UWAGA, KROK RĘCZNY: gdy na wyświetlaczu strefy 2 pozostanie 15 minut, dodaj marchewkę do ziemniaków i wymieszaj. Aplikacja nie uruchomi dla tego kroku alarmu."
  - text: "Gdy Ninja przypomni o potrząśnięciu, potrząśnij szufladą z warzywami. Sprawdź stopień upieczenia."
  - text: "Wbij termometr w najgrubsze miejsce piersi. Jeśli kurczak nie osiągnął bezpiecznej temperatury, dopiecz. Odstaw przed pokrojeniem."
    internal_temp_c: 75
  - text: "Wymieszaj skyr z sokiem z cytryny, drobno startym czosnkiem, wodą i pieprzem. Pozostałości marynaty mającej kontakt z surowym mięsem wyrzuć. Podaj pierś z warzywami i zimnym sosem."
translations:
  en:
    title: "Lemon-garlic chicken with potatoes and carrots"
    description: "A whole lemon-garlic chicken breast with potatoes, carrots and cool skyr sauce. Add the carrots partway through cooking. Suggested settings: verify on the first cook. Approximately 550 kcal and 69 g protein per serving (the whole lunch, including sides)."
    ingredients:
      - name: "Chicken breast"
        note: "raw, left whole"
      - name: "Lemon juice"
      - name: "Garlic"
        note: "clove, crushed"
      - name: "Dried oregano"
      - name: "Dried rosemary"
      - name: "Salt"
      - name: "Black pepper"
      - name: "Potatoes"
      - name: "Carrots"
      - name: "Spray olive oil"
      - name: "Plain skyr"
      - name: "Lemon juice"
      - name: "Garlic"
        note: "clove, finely grated"
      - name: "Water"
        note: "for thinning"
    groups:
      "Kurczak": "Chicken"
      "Dodatki": "Sides"
      "Sos": "Sauce"
    steps:
      - text: "Pat the chicken dry. Mix lemon juice, garlic, oregano, rosemary, salt and pepper; rub onto the breast and lightly spray with some oil."
      - text: "Cut potatoes into wedges and carrots into batons. Put only the potatoes into drawer 2 and spray with the remaining oil. Set the carrots aside."
      - text: "Put the chicken in zone 1 and potatoes in zone 2. Select SYNC and START according to the Ninja panel."
      - text: "IMPORTANT, MANUAL STEP: when zone 2 shows 15 minutes remaining, add the carrots to the potatoes and toss. The app will not trigger an alert for this step."
      - text: "Shake the vegetable drawer when prompted. Check whether the vegetables are cooked."
      - text: "Insert a thermometer into the thickest part of the breast. Cook longer if necessary, then rest before slicing."
      - text: "Mix the skyr with lemon juice, finely grated garlic, water and pepper. Discard any marinade that touched raw chicken. Serve with the vegetables and cool sauce."
    labels:
      zone1: "Chicken breast"
      zone2: "Potatoes and carrots"
---
