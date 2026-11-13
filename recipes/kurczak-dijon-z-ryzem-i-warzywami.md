---
# plik: recipes/kurczak-dijon-z-ryzem-i-warzywami.md
schema_version: 1
title: "Kurczak Dijon z ryżem, brokułem i kalafiorem"
description: "Cała pierś z ryżem basmati, pieczoną mieszanką brokułu i kalafiora oraz zimnym sosem skyr–Dijon. Ustawienia proponowane, do sprawdzenia przy pierwszym gotowaniu. Szacunkowo 550 kcal i 72 g białka na porcję (cały lunch, łącznie z dodatkami)."
servings: 1
prep_minutes: 10
cook_minutes: 25
tags: [ninja, low, obiad, wysokobiałkowe, kurczak]
source: "ChatGPT — autorski przepis na podstawie zatwierdzonego planu lunchów"
ingredients:
  - name: "Pierś kurczaka"
    amount: 250
    unit: g
    note: "surowa, w całości"
    group: "Kurczak"
  - name: "Czosnek granulowany"
    amount: 0.5
    unit: tsp
    group: "Kurczak"
  - name: "Tymianek suszony"
    amount: 0.5
    unit: tsp
    group: "Kurczak"
  - name: "Sól"
    group: "Kurczak"
  - name: "Pieprz czarny"
    group: "Kurczak"
  - name: "Ryż basmati suchy"
    amount: 50
    unit: g
    group: "Dodatki"
  - name: "Brokuł i kalafior"
    amount: 160
    unit: g
    note: "świeża mieszanka Tesco; połowa paczki"
    group: "Dodatki"
  - name: "Oliwa ze spryskiwacza"
    amount: 1
    unit: g
    group: "Dodatki"
  - name: "Skyr naturalny"
    amount: 50
    unit: g
    group: "Sos"
  - name: "Musztarda Dijon"
    amount: 5
    unit: g
    group: "Sos"
  - name: "Sok z cytryny"
    amount: 5
    unit: ml
    group: "Sos"
ninja:
  mode: sync
  zone1:
    label: "Pierś kurczaka"
    function: "Air Fry"
    temp_c: 190
    minutes: 25
  zone2:
    label: "Brokuł i kalafior"
    function: "Air Fry"
    temp_c: 170
    minutes: 11
    turn:
      action: shake
      after_min: 5
steps:
  - text: "Pierś osusz, dopraw czosnkiem granulowanym, tymiankiem, solą i pieprzem oraz spryskaj częścią oliwy."
  - text: "Warzywa osusz, większe różyczki kalafiora przekrój na mniejsze kawałki i spryskaj resztą oliwy."
  - text: "Umieść kurczaka w strefie 1 i warzywa w strefie 2. Ustaw według panelu Ninja, wybierz SYNC i START. Potrząśnij warzywami przy alarmie; sprawdź brokuły przed końcem, żeby ich nie przypalić."
  - text: "Ugotuj przepłukany ryż pod przykryciem z wodą w proporcji około 1:2, następnie odstaw na kilka minut."
  - text: "Zmieszaj skyr z musztardą Dijon i sokiem z cytryny. Dopraw do smaku; nie trzeba go podgrzewać."
  - text: "Sprawdź najgrubsze miejsce piersi termometrem. Jeśli temperatura jest zbyt niska, dopiecz i sprawdź ponownie."
    internal_temp_c: 75
  - text: "Podaj pokrojoną pierś z ryżem, warzywami i zimnym sosem Dijon."
translations:
  en:
    title: "Dijon chicken with rice, broccoli and cauliflower"
    description: "Whole chicken breast served with basmati, roasted broccoli and cauliflower, and a cool skyr–Dijon sauce. Suggested settings: verify on the first cook. Approximately 550 kcal and 72 g protein per serving (the whole lunch, including sides)."
    ingredients:
      - name: "Chicken breast"
        note: "raw, left whole"
      - name: "Garlic granules"
      - name: "Dried thyme"
      - name: "Salt"
      - name: "Black pepper"
      - name: "Dry basmati rice"
      - name: "Broccoli and cauliflower"
        note: "fresh Tesco mix; half a pack"
      - name: "Spray olive oil"
      - name: "Plain skyr"
      - name: "Dijon mustard"
      - name: "Lemon juice"
    groups:
      "Kurczak": "Chicken"
      "Dodatki": "Sides"
      "Sos": "Sauce"
    steps:
      - text: "Pat the chicken breast dry, season with garlic granules, thyme, salt and pepper, then spray with a little oil."
      - text: "Pat the vegetables dry, cut larger cauliflower florets into smaller pieces and spray with the remaining oil."
      - text: "Put the chicken in zone 1 and vegetables in zone 2. Set the Ninja as shown, select SYNC and START. Shake the vegetables when prompted; check the broccoli before the end to prevent burning."
      - text: "Cook the rinsed rice covered with approximately twice its volume of water, then let rest for a few minutes."
      - text: "Mix the skyr with Dijon mustard and lemon juice. Season to taste; no heating is needed."
      - text: "Check the thickest part of the chicken breast with a thermometer. If below the target temperature, cook longer and recheck."
      - text: "Serve the sliced chicken breast with rice, vegetables and the cool Dijon sauce."
    labels:
      zone1: "Chicken breast"
      zone2: "Broccoli and cauliflower"
---
