---
# plik: recipes/makaron-z-brokulem-i-kalafiorem.md
schema_version: 1
title: "Makaron z brokułem, kalafiorem i serkiem Philadelphia"
description: "Jedna porcja makaronu z pieczoną mieszanką świeżego brokuła i kalafiora oraz kremowym sosem z serka Philadelphia i cheddara. Alarm po 10 minutach przypomina, żeby potrząsnąć szufladą i sprawdzić warzywa. Ustawienia proponowane, do sprawdzenia przy pierwszym gotowaniu."
servings: 1
prep_minutes: 10
cook_minutes: 14
tags: [ninja, obiad, makaron, warzywa]
source: "ChatGPT — propozycja na podstawie składników użytkownika"

ingredients:
  - name: "świeża mieszanka brokuła i kalafiora"
    amount: 320
    unit: g
  - name: "makaron suchy (penne lub fusilli)"
    amount: 70
    unit: g
  - name: "Serek Philadelphia"
    amount: 40
    unit: g
    note: "można użyć nieco mniej, jeśli tyle zostało"
  - name: "cheddar"
    amount: 15
    unit: g
  - name: "oliwa lub olej"
    amount: 5
    unit: g
  - name: "sól"
  - name: "pieprz czarny"

ninja:
  mode: single
  zone1:
    label: "Brokuł i kalafior"
    function: "Air Fry"
    temp_c: 190
    minutes: 14
    turn:
      action: shake
      after_min: 10
      required: true

steps:
  - text: "Warzywa osusz, jeśli są wilgotne. Większe różyczki kalafiora przekrój na mniejsze kawałki, aby upiekły się podobnie szybko jak brokuł."
  - text: "Wymieszaj warzywa z oliwą lub olejem, solą i pieprzem. Rozłóż na oryginalnej tacce w jednej szufladzie Ninji. Ustaw parametry z panelu i uruchom bez wstępnego nagrzewania."
  - text: "W czasie pieczenia ugotuj makaron al dente według instrukcji na opakowaniu. Przed odcedzeniem zachowaj trochę wody z gotowania."
  - text: "⚠️ Gdy zabrzmi alarm POTRZĄŚNIJ, sprawdź, czy końcówki brokuła nie zaczynają się przypalać i czy kalafior mięknie. Potrząśnij szufladą. Jeśli brokuł jest już mocno przypieczony, skróć pieczenie lub wyjmij go wcześniej."
  - text: "Na małym ogniu rozprowadź serek Philadelphia i cheddar kilkoma łyżkami zachowanej wody z makaronu. Mieszaj, aż powstanie kremowy sos; nie gotuj go intensywnie."
  - text: "Dodaj do sosu makaron i upieczone warzywa. Wymieszaj i w razie potrzeby dolej jeszcze trochę wody z makaronu. Dopraw do smaku."

translations:
  en:
    title: "Pasta with broccoli, cauliflower and Philadelphia cream cheese"
    description: "One serving of pasta with freshly roasted broccoli and cauliflower and a creamy Philadelphia cream cheese and cheddar sauce. An alarm after 10 minutes reminds you to shake the drawer and check the vegetables. Suggested settings: confirm on the first cook."
    ingredients:
      - name: "fresh broccoli and cauliflower mix"
      - name: "dry pasta (penne or fusilli)"
      - name: "Philadelphia cream cheese"
        note: "use a little less if that is all you have left"
      - name: "cheddar"
      - name: "olive oil or cooking oil"
      - name: "salt"
      - name: "black pepper"
    steps:
      - text: "Pat the vegetables dry if damp. Cut larger cauliflower florets into smaller pieces so they roast at about the same rate as the broccoli."
      - text: "Toss the vegetables with oil, salt and pepper. Spread them on the original crisper plate in one Ninja drawer. Use the settings on the Ninja panel and start without preheating."
      - text: "While the vegetables roast, cook the pasta al dente following the packet instructions. Reserve a little pasta water before draining."
      - text: "⚠️ When the SHAKE alarm sounds, check whether the broccoli tips are starting to burn and whether the cauliflower is softening. Shake the drawer. If the broccoli is already strongly browned, shorten the cooking time or remove it early."
      - text: "Over low heat, loosen the Philadelphia cream cheese and cheddar with a few spoonfuls of reserved pasta water. Stir until creamy; do not boil vigorously."
      - text: "Add the pasta and roasted vegetables to the sauce. Mix, adding a little more pasta water if needed. Season to taste."
    labels:
      zone1: "Broccoli and cauliflower"
---
