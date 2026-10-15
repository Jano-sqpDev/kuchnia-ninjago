---
# plik: recipes/burgery-wolowe-ninja.md
schema_version: 1
title: "Burgery wołowe z Ninji"
description: "Soczyste burgery wołowe: 4 kotlety po 125 g, o początkowej grubości około 1 cm. 11 min — czas testowy, do potwierdzenia. Po 10 min poniżej 70°C, po 12 min ok. 86°C."
servings: 4
prep_minutes: 10
cook_minutes: 11
tags: [ninja, obiad, burgery, wołowina, wysokobiałkowe]

ingredients:
  - name: "Wołowina mielona 5% tłuszczu"
    amount: 500
    unit: g
    group: "Kotlety"
  - name: "Sól"
    amount: 3
    unit: g
    group: "Kotlety"
  - name: "Pieprz czarny"
    amount: 1
    unit: g
    group: "Kotlety"
  - name: "Czosnek granulowany"
    amount: 2
    unit: g
    group: "Kotlety"
  - name: "Bułki do burgerów"
    amount: 4
    unit: pcs
    group: "Dodatki"
  - name: "Ser cheddar"
    amount: 80
    unit: g
    group: "Dodatki"
  - name: "Pomidor"
    amount: 120
    unit: g
    group: "Dodatki"
  - name: "Sałata"
    amount: 40
    unit: g
    group: "Dodatki"
  - name: "Ogórki konserwowe"
    amount: 80
    unit: g
    group: "Dodatki"
  - name: "Ketchup"
    amount: 40
    unit: g
    group: "Sos"
  - name: "Musztarda"
    amount: 20
    unit: g
    group: "Sos"

ninja:
  mode: match
  zone1:
    label: "Kotlety (2 szt.)"
    function: "Air Fry"
    temp_c: 190
    minutes: 11
  zone2:
    label: "Kotlety (2 szt.)"
    function: "Air Fry"
    temp_c: 190
    minutes: 11

steps:
  - text: "Przełóż mieloną wołowinę do miski. Dodaj sól, pieprz i czosnek. Delikatnie wymieszaj, nie ugniatając mięsa zbyt długo."
  - text: "Podziel mięso na równe porcje. Uformuj płaskie kotlety o grubości około 1 cm, bez robienia wgłębienia na środku."
  - text: "Ułóż kotlety na dodatkowych rusztach PETHREE, po dwa w każdej szufladzie, z odstępami. Ustaw strefy według panelu Ninja (bez wstępnego nagrzewania), włącz MATCH, potem START. Nie obracaj kotletów."
  - text: "Wbij termometr poziomo z boku w środek burgera znajdującego się z tyłu szuflady, ponieważ zwykle jest o 2–3°C chłodniejszy niż burger z przodu. Upewnij się, że temperatura w środku utrzymuje się na wymaganym poziomie przez 30 sekund. Jeśli nie, dopiecz i sprawdź ponownie."
    internal_temp_c: 75
  - text: "Na gorących kotletach ułóż cheddar. Pozostaw na chwilę, aby ser lekko się rozpuścił."
  - text: "Przekrój bułki. Posmaruj je ketchupem i musztardą. Dodaj sałatę, pomidora, ogórki oraz kotlety z serem. Zamknij burgery i podawaj."
translations:
  en:
    title: "Beef Burgers (Ninja)"
    description: "Juicy lean beef burgers: 4 patties of 125 g each, approximately 1 cm thick before cooking. 11 min — test time, to be confirmed. Below 70°C after 10 min; approximately 86°C after 12 min."
    ingredients:
      - name: "Lean beef mince (5% fat)"
      - name: "Salt"
      - name: "Black pepper"
      - name: "Garlic granules"
      - name: "Burger buns"
      - name: "Cheddar"
      - name: "Tomato"
      - name: "Lettuce"
      - name: "Pickles"
      - name: "Ketchup"
      - name: "Mustard"
    groups:
      Kotlety: "Patties"
      Dodatki: "Toppings"
      Sos: "Sauce"
    steps:
      - text: "Place the minced beef in a bowl with salt, pepper and garlic. Mix gently without overworking the meat."
      - text: "Divide the meat evenly. Shape flat patties about 1 cm thick, without making a dimple in the centre."
      - text: "Place the patties on the additional PETHREE racks, two per drawer with space between them. Use the settings on the Ninja panel (no preheat), press MATCH, then START. Do not flip the patties."
      - text: "Insert the thermometer horizontally from the side into the centre of the patty at the back of a drawer, as it tends to be 2–3°C cooler than the one near the handle. Ensure the internal temperature stays at the target for 30 seconds. If it does not, cook a little longer and check again."
      - text: "Put cheddar on the hot patties and leave briefly to melt."
      - text: "Slice the buns and spread with ketchup and mustard. Add lettuce, tomato, pickles and the cheesy patties. Close and serve."
    labels:
      zone1: "Patties (2 pcs)"
      zone2: "Patties (2 pcs)"
---
