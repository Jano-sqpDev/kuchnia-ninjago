---
# plik: recipes/skrzydelka-z-sosem-tm6.md
schema_version: 1
title: "Skrzydełka z frytkami i sosem czosnkowym"
description: "Dwie strefy Ninja i sos z TM6 — przykład przepisu z oboma urządzeniami."
servings: 2
prep_minutes: 15
cook_minutes: 25
tags: [ninja, tm6, kurczak, obiad]
source: "fixture testów"

ingredients:
  - name: "Skrzydełka z kurczaka"
    amount: 600
    unit: g
  - name: "Ziemniaki"
    amount: 500
    unit: g
    note: "pokrojone w słupki"
  - name: "Jogurt naturalny"
    amount: 150
    unit: g
    group: "Sos"
  - name: "Czosnek"
    amount: 2
    unit: pcs
    note: "ząbki"
    group: "Sos"
  - name: "Sól"
    group: "Sos"

ninja:
  mode: sync
  zone1:
    label: "Skrzydełka"
    function: "Air Fry"
    temp_c: 200
    minutes: 25
    turn:
      action: flip
      after_min: 12
  zone2:
    label: "Frytki"
    function: "Max Crisp"
    temp_c: 240
    minutes: 18
    turn:
      action: shake
      after_min: 9
      required: false

steps:
  - text: "Skrzydełka do strefy 1, frytki do strefy 2. Ustaw strefy według panelu Ninja, włącz SYNC, potem START."
  - text: "Do naczynia miksującego wrzuć czosnek i rozdrobnij."
    tm6:
      duration_seconds: 5
      speed: 5
  - text: "Dodaj jogurt i sól, wymieszaj."
    tm6:
      duration_seconds: 20
      speed: 2
      reverse: true
  - text: "Sprawdź skrzydełka termometrem przy kości."
    internal_temp_c: 75

translations:
  en:
    title: "Chicken wings with chips and garlic sauce"
    description: "Two Ninja zones and a TM6 sauce — an example recipe with both appliances."
    ingredients:
      - name: "Chicken wings"
      - name: "Potatoes"
        note: "cut into sticks"
      - name: "Plain yoghurt"
      - name: "Garlic"
        note: "cloves"
      - name: "Salt"
    groups:
      Sos: "Sauce"
    steps:
      - text: "Wings in zone 1, chips in zone 2. Set the zones as shown on the Ninja panel, press SYNC, then START."
      - text: "Put the garlic in the mixing bowl and chop."
      - text: "Add the yoghurt and salt, mix."
      - text: "Check the wings with a thermometer next to the bone."
    labels:
      zone1: "Wings"
      zone2: "Chips"
---
