---
# plik: recipes/kurczak-teriyaki-z-ryzem-i-marchewka.md
schema_version: 1
title: "Kurczak teriyaki z ryżem i marchewką"
description: "Kurczak w kostce z basmati i pieczoną marchewką; wersja przygotowana 12 listopada: 160 g marchewki, 6 g miodu, bez imbiru. Ustawienia proponowane, do sprawdzenia przy pierwszym gotowaniu."
servings: 1
prep_minutes: 10
cook_minutes: 20
tags: [ninja, low, obiad, wysokobiałkowe, kurczak]
source: "ChatGPT — autorski przepis na podstawie zatwierdzonego planu lunchów"
ingredients:
  - name: "Pierś kurczaka"
    amount: 250
    unit: g
    note: "surowa, pokrojona w kostkę około 2–3 cm"
    group: "Kurczak"
  - name: "Ryż basmati suchy"
    amount: 50
    unit: g
    group: "Dodatki"
  - name: "Marchewka"
    amount: 160
    unit: g
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
    amount: 6
    unit: g
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
    label: "Kurczak w kostce"
    function: "Air Fry"
    temp_c: 190
    minutes: 15
    turn:
      action: shake
      after_min: 8
  zone2:
    label: "Marchewka"
    function: "Air Fry"
    temp_c: 180
    minutes: 15
    turn:
      action: shake
      after_min: 7
steps:
  - text: "Kurczaka pokrój w równą kostkę, osusz i spryskaj niewielką częścią oliwy. Nie polewaj go miodem przed pieczeniem."
  - text: "Marchewkę pokrój w cienkie słupki i wymieszaj z resztą oliwy. Rozłóż ją w drugiej szufladzie."
  - text: "Umieść kurczaka w strefie 1, marchewkę w strefie 2. Ustaw Ninja według panelu, wybierz SYNC i START. Przy alarmach potrząśnij szufladami lub przemieszaj kurczaka."
  - text: "Ryż przepłucz, ugotuj w garnku z wodą w proporcji około dwa razy więcej wody niż ryżu. Gotuj pod przykryciem około 12 minut i odstaw na 5 minut."
  - text: "Na małej patelni połącz sos sojowy, miód, przeciśnięty czosnek, sok z cytryny i wodę. Podgrzej łagodnie, aż sos lekko zgęstnieje."
  - text: "Sprawdź termometrem najgrubszy kawałek kurczaka. Jeżeli nie osiągnął bezpiecznej temperatury, dopiecz i skontroluj ponownie."
    internal_temp_c: 75
  - text: "Wymieszaj upieczonego kurczaka z ciepłym sosem na patelni. Podaj z ryżem i marchewką."
translations:
  en:
    title: "Teriyaki chicken with rice and carrots"
    description: "Diced chicken with basmati and roasted carrots; the version made on 12 November uses 160 g carrots, 6 g honey and no ginger. Suggested settings: verify when cooking."
    ingredients:
      - name: "Chicken breast"
        note: "raw, cut into roughly 2–3 cm cubes"
      - name: "Dry basmati rice"
      - name: "Carrots"
      - name: "Spray olive oil"
      - name: "Soy sauce"
      - name: "Honey"
      - name: "Garlic"
        note: "clove, crushed"
      - name: "Lemon juice"
      - name: "Water"
    groups:
      "Kurczak": "Chicken"
      "Dodatki": "Sides"
      "Sos": "Sauce"
    steps:
      - text: "Cut the chicken into evenly sized cubes, pat dry and lightly spray with some oil. Do not add honey before air frying."
      - text: "Cut the carrots into thin batons, toss with the remaining oil and spread in the second drawer."
      - text: "Place chicken in zone 1 and carrots in zone 2. Set the Ninja as shown, select SYNC and START. Shake the drawers or stir the chicken when prompted."
      - text: "Rinse the rice and cook it covered with approximately twice its volume of water for about 12 minutes, then let stand for 5 minutes."
      - text: "Combine soy sauce, honey, crushed garlic, lemon juice and water in a small pan. Warm gently until slightly thickened."
      - text: "Check the thickest chicken piece with a thermometer. If it has not reached the safe internal temperature, continue cooking and check again."
      - text: "Toss the cooked chicken with the warm sauce in the pan. Serve with the rice and carrots."
    labels:
      zone1: "Diced chicken"
      zone2: "Carrots"
---
