---
# plik: recipes/kurczak-teriyaki-z-tenderstem-i-fasolka.md
schema_version: 1
title: "Kurczak teriyaki z ryżem, Tenderstem i fasolką"
description: "Kurczak w sosie sojowo-miodowym, ryż basmati oraz Tesco Finest Purple Tenderstem & Extra Fine Beans. Sos przygotowywany osobno. Ustawienia proponowane, do sprawdzenia przy pierwszym gotowaniu. Szacunkowo 565 kcal i 68 g białka na porcję (cały lunch, łącznie z dodatkami)."
servings: 1
prep_minutes: 10
cook_minutes: 20
tags: [ninja, low, obiad, wysokobiałkowe, kurczak]
source: "ChatGPT — autorski przepis na podstawie zatwierdzonego planu lunchów"
ingredients:
  - name: "Pierś kurczaka"
    amount: 250
    unit: g
    note: "surowa, kawałki 2–3 cm"
    group: "Kurczak"
  - name: "Ryż basmati suchy"
    amount: 50
    unit: g
    group: "Dodatki"
  - name: "Brokuł Purple Tenderstem i fasolka Extra Fine"
    amount: 190
    unit: g
    note: "jedno opakowanie Tesco Finest"
    group: "Dodatki"
  - name: "Oliwa ze spryskiwacza"
    amount: 1
    unit: g
    group: "Dodatki"
  - name: "Sos sojowy"
    amount: 15
    unit: ml
    group: "Sos"
  - name: "Miód"
    amount: 10
    unit: g
    group: "Sos"
  - name: "Imbir świeży"
    amount: 5
    unit: g
    note: "starty; można pominąć"
    group: "Sos"
  - name: "Czosnek"
    amount: 1
    unit: pcs
    note: "ząbek, przeciśnięty"
    group: "Sos"
  - name: "Sok z cytryny"
    amount: 5
    unit: ml
    group: "Sos"
  - name: "Woda"
    amount: 15
    unit: ml
    group: "Sos"
ninja:
  mode: sync
  zone1:
    label: "Kurczak w kawałkach"
    function: "Air Fry"
    temp_c: 190
    minutes: 15
    turn:
      action: shake
      after_min: 8
  zone2:
    label: "Tenderstem i fasolka"
    function: "Air Fry"
    temp_c: 170
    minutes: 9
    turn:
      action: shake
      after_min: 5
steps:
  - text: "Pokrój kurczaka na równe kawałki i delikatnie spryskaj oliwą. Nie dodawaj miodu przed pieczeniem."
  - text: "Ułóż warzywa w jednej warstwie w drugiej szufladzie. Ich delikatne końcówki mogą szybko się rumienić."
  - text: "Ustaw kurczaka w strefie 1, warzywa w strefie 2; wybierz SYNC i START zgodnie z panelem. Gdy rozlegnie się alarm, potrząśnij odpowiednią szufladą."
  - text: "Przepłucz ryż, gotuj pod przykryciem z wodą w proporcji 1:2, a po ugotowaniu odstaw na kilka minut."
  - text: "Na małej patelni podgrzej sos sojowy, miód, imbir, czosnek, sok z cytryny i wodę, aż sos lekko zgęstnieje."
  - text: "Sprawdź termometrem najgrubszy kawałek kurczaka. W razie potrzeby dopiecz mięso."
    internal_temp_c: 75
  - text: "Wymieszaj gotowego kurczaka z sosem na patelni. Podaj z ryżem i warzywami."
translations:
  en:
    title: "Teriyaki chicken with rice, Tenderstem and green beans"
    description: "Chicken with soy and honey sauce, basmati rice, and Tesco Finest Purple Tenderstem & Extra Fine Beans. Prepare the sauce separately. Suggested settings: verify on the first cook. Approximately 565 kcal and 68 g protein per serving (the whole lunch, including sides)."
    ingredients:
      - name: "Chicken breast"
        note: "raw, 2–3 cm pieces"
      - name: "Dry basmati rice"
      - name: "Purple Tenderstem broccoli and extra-fine green beans"
        note: "one Tesco Finest pack"
      - name: "Spray olive oil"
      - name: "Soy sauce"
      - name: "Honey"
      - name: "Fresh ginger"
        note: "grated; optional"
      - name: "Garlic"
        note: "clove, crushed"
      - name: "Lemon juice"
      - name: "Water"
    groups:
      "Kurczak": "Chicken"
      "Dodatki": "Sides"
      "Sos": "Sauce"
    steps:
      - text: "Cut chicken into even pieces and lightly spray with oil. Do not add the honey before cooking."
      - text: "Arrange the vegetables in a single layer in the second drawer; the tender tips may brown quickly."
      - text: "Place chicken in zone 1 and vegetables in zone 2; select SYNC and START as shown. Shake the relevant drawer when prompted."
      - text: "Rinse the rice, simmer it covered with twice its volume of water, then let rest for a few minutes."
      - text: "Gently heat soy sauce, honey, ginger, garlic, lemon juice and water in a small pan until slightly thickened."
      - text: "Check the thickest chicken piece with a thermometer, and continue cooking if necessary."
      - text: "Toss the cooked chicken in the sauce and serve with rice and vegetables."
    labels:
      zone1: "Chicken pieces"
      zone2: "Tenderstem and green beans"
---
