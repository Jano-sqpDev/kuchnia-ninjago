---
# plik: recipes/udka-z-ziemniakami.md
schema_version: 1
title: "Udka z ziemniakami"
description: "Udka i ziemniaki w dwóch szufladach, kończą razem."
servings: 4
prep_minutes: 15
cook_minutes: 28
tags: [ninja, kurczak, obiad]
source: "mockup UI v1"

ingredients:
  - name: "udka z kurczaka"
    amount: 8
    unit: pcs
  - name: "małe ziemniaki"
    amount: 600
    unit: g
    note: "przekrojone na pół"
  - name: "oliwa"
    amount: 2
    unit: tbsp
    group: "Marynata"
  - name: "papryka wędzona"
    amount: 1
    unit: tsp
    group: "Marynata"
  - name: "czosnek granulowany"
    amount: 1
    unit: tsp
    group: "Marynata"
  - name: "sól"
    group: "Marynata"

ninja:
  mode: sync
  zone1:
    label: "Udka"
    function: "Roast"
    temp_c: 200
    minutes: 28
    turn:
      action: flip
      after_min: 14
      required: true
  zone2:
    label: "Ziemniaki"
    function: "Air Fry"
    temp_c: 200
    minutes: 22
    turn:
      action: shake
      after_min: 11
      required: false

steps:
  - text: "Osusz udka, natrzyj częścią marynaty i odstaw na kilka minut."
  - text: "Ziemniaki wymieszaj z resztą marynaty."
  - text: "Udka włóż do strefy 1, ziemniaki do strefy 2. Ustaw obie strefy według panelu Ninja, włącz SYNC, następnie START."
  - text: "Sprawdź udka termometrem w najgrubszym miejscu, przy kości."
    internal_temp_c: 75

translations:
  en:
    title: "Chicken legs with potatoes"
    description: "Chicken legs and potatoes in two drawers, finishing together."
    ingredients:
      - name: "chicken legs"
      - name: "baby potatoes"
        note: "halved"
      - name: "olive oil"
      - name: "smoked paprika"
      - name: "garlic granules"
      - name: "salt"
    groups:
      Marynata: "Marinade"
    steps:
      - text: "Pat the chicken legs dry, rub with some of the marinade and leave for a few minutes."
      - text: "Toss the potatoes with the rest of the marinade."
      - text: "Put the chicken in zone 1 and the potatoes in zone 2. Set both zones as shown on the Ninja panel, press SYNC, then START."
      - text: "Check the chicken with a thermometer at the thickest part, next to the bone."
    labels:
      zone1: "Chicken legs"
      zone2: "Potatoes"
---
Przepis testowy z mockupu UI — bez zdjęcia, żeby było widać kafelek zastępczy.
