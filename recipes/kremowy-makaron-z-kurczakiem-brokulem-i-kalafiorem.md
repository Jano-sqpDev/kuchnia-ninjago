---
# plik: recipes/kremowy-makaron-z-kurczakiem-brokulem-i-kalafiorem.md
schema_version: 1
title: "Kremowy makaron z kurczakiem, brokułem i kalafiorem"
description: "Penne z kawałkami kurczaka i pieczonymi warzywami w sosie Philadelphia Garlic & Herbs z parmezanem. Druga połowa paczki brokułu i kalafiora. Ustawienia proponowane, do sprawdzenia przy pierwszym gotowaniu."
servings: 1
prep_minutes: 12
cook_minutes: 20
tags: [ninja, low, obiad, wysokobiałkowe, kurczak, makaron]
source: "ChatGPT — autorski przepis na podstawie zatwierdzonego planu lunchów"
ingredients:
  - name: "Pierś kurczaka"
    amount: 250
    unit: g
    note: "surowa, kawałki 2–3 cm"
    group: "Kurczak"
  - name: "Sól"
    group: "Kurczak"
  - name: "Pieprz czarny"
    group: "Kurczak"
  - name: "Makaron penne suchy"
    amount: 65
    unit: g
    group: "Makaron i warzywa"
  - name: "Brokuł i kalafior"
    amount: 160
    unit: g
    note: "mieszanka Tesco"
    group: "Makaron i warzywa"
  - name: "Oliwa ze spryskiwacza"
    amount: 1
    unit: g
    group: "Makaron i warzywa"
  - name: "Serek Philadelphia Garlic & Herbs"
    amount: 35
    unit: g
    note: "zwykły, nie Light"
    group: "Sos"
  - name: "Ser parmezan"
    amount: 10
    unit: g
    group: "Sos"
  - name: "Czosnek"
    amount: 1
    unit: pcs
    note: "ząbek"
    group: "Sos"
  - name: "Woda z gotowania makaronu"
    amount: 40
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
    label: "Brokuł i kalafior"
    function: "Air Fry"
    temp_c: 170
    minutes: 11
    turn:
      action: shake
      after_min: 5
steps:
  - text: "Pokrój kurczaka w równe kawałki, osusz, dopraw solą i pieprzem, delikatnie spryskaj oliwą."
  - text: "Warzywa osusz i podziel większe różyczki. Kurczaka umieść w strefie 1, warzywa w strefie 2. Włącz SYNC i START według panelu Ninja."
  - text: "Gdy Ninja przypomni, potrząśnij szufladami. Brokuł sprawdź przed końcem pieczenia, żeby się nie przypalił."
  - text: "W międzyczasie ugotuj penne al dente i zachowaj wodę z gotowania."
  - text: "Na małym ogniu podgrzej czosnek z odrobiną wody, dodaj Philadelphia, część wody z makaronu i parmezan. Mieszaj do połączenia; nie zagotowuj gwałtownie."
  - text: "Sprawdź termometrem największy kawałek kurczaka i w razie potrzeby dopiecz."
    internal_temp_c: 75
  - text: "Wymieszaj penne z sosem, a następnie dodaj kurczaka i warzywa. Rozrzedź sos resztą wody z makaronu, jeśli potrzeba."
translations:
  en:
    title: "Creamy chicken pasta with broccoli and cauliflower"
    description: "Penne with chicken and roasted vegetables in a Philadelphia Garlic & Herbs and Parmesan sauce. Uses the second half of the broccoli-and-cauliflower pack. Suggested settings: verify on the first cook."
    ingredients:
      - name: "Chicken breast"
        note: "raw, 2–3 cm pieces"
      - name: "Salt"
      - name: "Black pepper"
      - name: "Dry penne pasta"
      - name: "Broccoli and cauliflower"
        note: "Tesco vegetable mix"
      - name: "Spray olive oil"
      - name: "Philadelphia Garlic & Herbs cream cheese"
        note: "regular, not Light"
      - name: "Parmesan cheese"
      - name: "Garlic"
        note: "clove"
      - name: "Reserved pasta cooking water"
    groups:
      "Kurczak": "Chicken"
      "Makaron i warzywa": "Pasta and vegetables"
      "Sos": "Sauce"
    steps:
      - text: "Cut the chicken into even pieces, pat dry, season with salt and pepper and spray lightly with oil."
      - text: "Pat the vegetables dry and split any large florets. Put chicken in zone 1 and vegetables in zone 2. Select SYNC and START as shown on the Ninja panel."
      - text: "Shake the drawers when prompted. Check the broccoli before the end to avoid burning."
      - text: "Meanwhile cook the penne al dente and reserve some pasta cooking water."
      - text: "Gently warm the garlic with a little water, add Philadelphia, some pasta water and Parmesan. Stir until smooth; do not boil vigorously."
      - text: "Check the thickest piece of chicken with a thermometer; continue cooking if necessary."
      - text: "Toss penne with the sauce, then fold in the chicken and vegetables. Loosen with the remaining pasta water if needed."
    labels:
      zone1: "Chicken pieces"
      zone2: "Broccoli and cauliflower"
---
