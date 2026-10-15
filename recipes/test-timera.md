---
# plik: recipes/test-timera.md
schema_version: 1
title: "TEST timera"
description: "Tymczasowy przepis do sprawdzenia alarmów obracania i potrząsania w trybie SYNC."
servings: 1
prep_minutes: 0
cook_minutes: 3
tags: [ninja, test]
source: "Test aplikacji kuchnia-ninjago"

ingredients:
  - name: "woda"

ninja:
  mode: sync
  zone1:
    label: "Test A"
    function: "Air Fry"
    temp_c: 180
    minutes: 3
    turn:
      action: flip
      after_min: 1
      required: true
  zone2:
    label: "Test B"
    function: "Air Fry"
    temp_c: 180
    minutes: 2
    turn:
      action: shake
      after_min: 1
      required: true

steps:
  - text: "Test timera — nic nie wkładaj do Ninja."
---
