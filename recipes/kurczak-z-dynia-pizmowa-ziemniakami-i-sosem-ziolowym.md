---
# plik: recipes/kurczak-z-dynia-pizmowa-ziemniakami-i-sosem-ziolowym.md
schema_version: 1
title: "Kurczak z dynią piżmową, ziemniakami i sosem ziołowym"
description: "Kompletny lunch na jedną porcję: ziołowa pierś kurczaka, pieczone butternut chunks i ziemniaki oraz zimny sos ze skyru. Około 510 kcal i 56 g białka na porcję (wartości szacunkowe). Ustawienia kurczaka przejęte z poniedziałkowego Dijon (pierś 184 g wyszła idealnie; w przepisie było 190°C / 25 min). Kontroluj 75°C w środku; ustawienia warzyw proponowane, do sprawdzenia przy pierwszym gotowaniu."
servings: 1
prep_minutes: 12
cook_minutes: 25
tags: [ninja, low, obiad, kurczak, warzywa, wysokobiałkowe]
source: "ChatGPT — zatwierdzony lunch na 17.11.2026, pierś 188 g"
ingredients:
  - name: "Pierś kurczaka"
    amount: 188
    unit: g
    note: "surowa, w całości"
    group: "Kurczak"
  - name: "Czosnek"
    amount: 1
    unit: pcs
    note: "ząbek, przeciśnięty"
    group: "Kurczak"
  - name: "Tymianek suszony"
    amount: 0.5
    unit: tsp
    group: "Kurczak"
  - name: "Oregano suszone"
    amount: 0.5
    unit: tsp
    group: "Kurczak"
  - name: "Sok z cytryny"
    amount: 10
    unit: ml
    group: "Kurczak"
  - name: "Sól"
    group: "Kurczak"
  - name: "Pieprz czarny"
    group: "Kurczak"
  - name: "Dynia piżmowa butternut chunks"
    amount: 180
    unit: g
    note: "surowe, gotowe kawałki"
    group: "Warzywa"
  - name: "Ziemniaki"
    amount: 200
    unit: g
    note: "surowe, pokrojone w nieduże łódeczki"
    group: "Warzywa"
  - name: "Oliwa z oliwek w sprayu"
    amount: 2
    unit: g
    note: "maksymalna ilość na kurczaka i warzywa łącznie"
    group: "Warzywa"
  - name: "Skyr naturalny"
    amount: 70
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
    label: "Ziemniaki + butternut chunks"
    function: "Air Fry"
    temp_c: 190
    minutes: 22
    turn:
      action: shake
      after_min: 11
steps:
  - text: "Osusz pierś i natrzyj czosnkiem, tymiankiem, oregano, sokiem z cytryny, solą i pieprzem. Spryskaj niewielką częścią oliwy. Zachowaj odrobinę suchych ziół do sosu, jeśli lubisz mocniejszy aromat."
  - text: "Ziemniaki pokrój w nieduże łódeczki i spryskaj resztą oliwy. W strefie 2 ułóż na początku tylko ziemniaki. Dynię zostaw na blacie — będzie dodana później."
  - text: "Ułóż pierś w strefie 1. Ustaw strefy zgodnie z panelem Ninja, włącz SYNC, potem START. Czasy są orientacyjne dla tej wielkości piersi; mięso kontroluj termometrem."
  - text: "WAŻNY KROK RĘCZNY: kiedy w strefie 2 pozostanie 14 minut, dodaj do ziemniaków kawałki dyni piżmowej i wymieszaj. Na ten moment aplikacja nie uruchamia dodatkowego alarmu."
  - text: "Przy alarmie POTRZĄŚNIJ przemieszaj ziemniaki i dynię. Sprawdź, czy warzywa są już miękkie i lekko przypieczone; nie dopiekaj ich niepotrzebnie."
  - text: "Sos przygotuj na zimno: wymieszaj skyr z sokiem z cytryny, odrobiną soli, pieprzu i ewentualnie szczyptą przygotowanych wcześniej suchych ziół. Nie używaj marynaty, która miała kontakt z surowym kurczakiem."
  - text: "Sprawdź najgrubsze miejsce piersi termometrem. Jeżeli temperatura jest zbyt niska, dopiecz i sprawdź ponownie. Po osiągnięciu wymaganej temperatury wyjmij mięso, aby go nie przesuszyć."
    internal_temp_c: 75
  - text: "Podaj całą pierś z upieczonymi ziemniakami, dynią piżmową i całą porcją sosu ziołowego."
translations:
  en:
    title: "Herb chicken with butternut squash, potatoes and yoghurt sauce"
    description: "A complete single-serving lunch: herb-seasoned chicken breast, roasted butternut squash chunks and potatoes, plus a cool skyr herb sauce. Approximately 510 kcal and 56 g protein per portion (estimates). Chicken settings match Monday’s Dijon recipe (184 g breast turned out perfectly; the recipe specified 190°C for 25 min). Check for 75°C internally; suggested vegetable settings need checking on the first cook."
    ingredients:
      - name: "Chicken breast"
        note: "raw, left whole"
      - name: "Garlic"
        note: "clove, crushed"
      - name: "Dried thyme"
      - name: "Dried oregano"
      - name: "Lemon juice"
      - name: "Salt"
      - name: "Black pepper"
      - name: "Butternut squash chunks"
        note: "raw, ready-cut chunks"
      - name: "Potatoes"
        note: "raw, cut into small wedges"
      - name: "Spray olive oil"
        note: "maximum total amount for chicken and vegetables"
      - name: "Plain skyr"
      - name: "Lemon juice"
    groups:
      "Kurczak": "Chicken"
      "Warzywa": "Vegetables"
      "Sos": "Sauce"
    steps:
      - text: "Pat the breast dry and season with garlic, thyme, oregano, lemon juice, salt and pepper. Spray lightly with some oil. Reserve a little dry herb seasoning for the sauce if you prefer a stronger flavour."
      - text: "Cut the potatoes into small wedges and lightly spray with the remaining oil. At first, place only the potatoes in zone 2. Keep the butternut chunks aside for later."
      - text: "Place the breast in zone 1. Set both zones as shown on the Ninja panel, select SYNC and START. Times are approximate for this size of breast; check the chicken with a thermometer."
      - text: "IMPORTANT MANUAL STEP: when 14 minutes remain in zone 2, add the butternut squash chunks to the potatoes and toss. The app does not send a separate alert for this moment."
      - text: "When the SHAKE alarm sounds, toss the potatoes and squash. Check they are tender and lightly browned; do not overcook."
      - text: "Mix the skyr with lemon juice, a little salt, pepper and optionally a pinch of the previously reserved dried herbs. Do not use any marinade that has touched raw chicken."
      - text: "Check the thickest part of the chicken breast with a thermometer. If below the target temperature, continue cooking and recheck. Remove as soon as it reaches the safe temperature to avoid drying it out."
      - text: "Serve the whole chicken breast with the roasted potatoes, squash and the entire serving of herb sauce."
    labels:
      zone1: "Chicken breast"
      zone2: "Potatoes and butternut squash"
---
