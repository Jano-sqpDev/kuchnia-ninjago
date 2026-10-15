---
schema_version: 1
title: "Beef Burgers (Ninja)"
description: >-
  Juicy lean beef burgers in a bun with cheddar, salad and sauce.
  Ninja Foodi MAX Dual Zone DZ400UK, two patties per drawer.
servings: 4
prep_minutes: 10
cook_minutes: 10
tags: [ninja, dinner, burgers, beef, english]
source: "claude"

ingredients:
  - name: "Lean beef mince (5% fat)"
    amount: 500
    unit: g
    group: "Patties"
  - name: "Salt"
    amount: 3
    unit: g
    group: "Patties"
  - name: "Black pepper"
    amount: 1
    unit: g
    group: "Patties"
  - name: "Garlic granules"
    amount: 2
    unit: g
    group: "Patties"
  - name: "Burger buns"
    amount: 4
    unit: szt
    group: "Toppings"
  - name: "Cheddar"
    amount: 80
    unit: g
    group: "Toppings"
  - name: "Tomato"
    amount: 120
    unit: g
    group: "Toppings"
  - name: "Lettuce"
    amount: 40
    unit: g
    group: "Toppings"
  - name: "Pickles"
    amount: 80
    unit: g
    group: "Toppings"
  - name: "Ketchup"
    amount: 40
    unit: g
    group: "Sauce"
  - name: "Mustard"
    amount: 20
    unit: g
    group: "Sauce"

ninja:
  mode: match
  zone1:
    label: "Patties (2 pcs)"
    function: "Air Fry"
    temp_c: 190
    minutes: 10
  zone2:
    label: "Patties (2 pcs)"
    function: "Air Fry"
    temp_c: 190
    minutes: 10

steps:
  - text: "Put the mince in a bowl and add salt, pepper and garlic. Mix gently without overworking the meat."
  - text: "Divide into equal portions. Shape flat patties slightly wider than the buns and press a small dimple in the centre of each."
  - text: "Place two patties in each drawer on the crisper plates, with gaps. Set both zones as shown on the Ninja panel (no preheat), press MATCH, then START."
    timer_seconds: 360
  - text: "Open the drawers and flip the patties with silicone tongs. Close and continue cooking."
    timer_seconds: 240
  - text: "Check the thickest patty with a thermometer. If it hasn't reached the target temperature, cook a little longer and check again."
    internal_temp_c: 75
  - text: "Put cheddar on the hot patties and leave briefly to melt."
  - text: "Slice the buns and spread with ketchup and mustard. Add lettuce, tomato, pickles and the cheesy patties. Close and serve."
---
