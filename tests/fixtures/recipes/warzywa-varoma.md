---
schema_version: 1
title: "Warzywa na parze z sosem jogurtowym"
description: "Brokuły i marchewka przygotowane w TM6."
servings: 2
prep_minutes: 10
cook_minutes: 23
tags: [tm6, warzywa, na-parze]
source: "ChatGPT"
image: img/warzywa-varoma.jpg

ingredients:
  - name: "brokuł"
    amount: 300
    unit: g
  - name: "marchew"
    amount: 200
    unit: g
  - name: "woda"
    amount: 500
    unit: ml
  - name: "jogurt naturalny"
    amount: 120
    unit: g
    group: "Sos"
  - name: "sok z cytryny"
    amount: 10
    unit: ml
    group: "Sos"
  - name: "sól"
    group: "Sos"
  - name: "pieprz"
    group: "Sos"

steps:
  - text: "Podziel brokuł na różyczki. Marchew pokrój w cienkie plasterki. Ułóż warzywa w przystawce Varoma, nie blokując otworów parowych."

  - text: "Wlej wodę do naczynia miksującego i podgrzej."
    tm6:
      duration_seconds: 300
      temperature: 100
      speed: 1

  - text: "Zamontuj przystawkę Varoma z pokrywą i gotuj warzywa na parze."
    tm6:
      duration_seconds: 1080
      temperature: Varoma
      speed: 1
      reverse: false
      mode: "gotowanie na parze"

  - text: "Sprawdź miękkość warzyw, ostrożnie otwierając pokrywę Varomy."

  - text: "W osobnej miseczce wymieszaj jogurt, sok z cytryny, sól i pieprz. Podaj z warzywami."

translations:
  en:
    title: "Steamed vegetables with yoghurt sauce"
    description: "Broccoli and carrots cooked in the TM6."
    ingredients:
      - name: "broccoli"
      - name: "carrot"
      - name: "water"
      - name: "plain yoghurt"
      - name: "lemon juice"
      - name: "salt"
      - name: "pepper"
    groups:
      Sos: "Sauce"
    steps:
      - text: "Cut the broccoli into florets. Slice the carrot thinly. Place the vegetables in the Varoma without blocking the steam holes."
      - text: "Pour the water into the mixing bowl and heat."
      - text: "Fit the Varoma with its lid and steam the vegetables."
        tm6_mode: "steaming"
      - text: "Check that the vegetables are tender, opening the Varoma lid carefully."
      - text: "In a small bowl mix the yoghurt, lemon juice, salt and pepper. Serve with the vegetables."
---
