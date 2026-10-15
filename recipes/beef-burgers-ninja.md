---
# plik: recipes/beef-burgers-ninja.md
schema_version: 1
title: "Beef Burgers (Ninja)"
description: "Juicy lean beef burgers: 4 patties of 125 g each, approximately 1 cm thick before cooking. 11 min — test time, to be confirmed. Below 70°C after 10 min; approximately 86°C after 12 min."
servings: 4
prep_minutes: 10
cook_minutes: 11
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
    minutes: 11
  zone2:
    label: "Patties (2 pcs)"
    function: "Air Fry"
    temp_c: 190
    minutes: 11

steps:
  - text: "Place the minced beef in a bowl with salt, pepper and garlic. Mix gently without overworking the meat."
  - text: "Divide the meat evenly. Shape flat patties about 1 cm thick, without making a dimple in the centre."
  - text: "Place the patties on the additional PETHREE racks, two per drawer with space between them. Use the settings on the Ninja panel (no preheat), press MATCH, then START. Do not flip the patties."
  - text: "Insert the thermometer horizontally from the side into the centre of the patty at the back of a drawer, as it tends to be 2–3°C cooler than the one near the handle. Ensure the internal temperature stays at the target for 30 seconds. If it does not, cook a little longer and check again."
    internal_temp_c: 75
  - text: "Put cheddar on the hot patties and leave briefly to melt."
  - text: "Slice the buns and spread with ketchup and mustard. Add lettuce, tomato, pickles and the cheesy patties. Close and serve."
---
