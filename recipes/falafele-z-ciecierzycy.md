---
# plik: recipes/falafele-z-ciecierzycy.md
schema_version: 1
title: "Falafele z ciecierzycy"
description: "Dziewięć małych falafeli z ciecierzycy z puszki, trzy porcje po trzy sztuki. Masę przygotowujemy w TM6, a kotleciki pieczemy w Ninji DZ400UK. Ciecierzyca z puszki daje bardziej miękką strukturę niż surowa ciecierzyca namoczona przez noc. Ustawienia proponowane, do sprawdzenia przy pierwszym gotowaniu."
servings: 3
prep_minutes: 35
cook_minutes: 17
tags: [tm6, ninja, low, kids, obiad]
source: "ChatGPT — adaptacja falafeli dla Heleny; temperatura i czas na podstawie instrukcji Ninja MAX Dual Zone AF400UK, przygotowanie w TM6 do testu"

ingredients:
  - name: "Ciecierzyca z puszki"
    amount: 240
    unit: g
    note: "masa po odsączeniu; zwykle jedna puszka 400 g"
  - name: "Cebula"
    amount: 30
    unit: g
    note: "około ćwiartki małej cebuli"
  - name: "Czosnek"
    amount: 1
    unit: pcs
    note: "obrany ząbek"
  - name: "Natka pietruszki"
    amount: 5
    unit: g
    note: "same listki"
  - name: "Kumin mielony"
    amount: 0.5
    unit: tsp
  - name: "Kolendra mielona"
    amount: 0.25
    unit: tsp
    note: "opcjonalnie"
  - name: "Papryka słodka"
    amount: 0.25
    unit: tsp
  - name: "Sól"
    amount: 0.25
    unit: tsp
  - name: "Mąka pszenna"
    amount: 1
    unit: tbsp
    note: "do związania masy"
  - name: "Olej rzepakowy"
    amount: 1
    unit: tbsp
    note: "do masy; dodatkowo odrobina oleju w sprayu na tacki i falafele"

ninja:
  mode: match
  zone1:
    label: "Falafele (5 szt.)"
    function: "Air Fry"
    temp_c: 200
    minutes: 17
    turn:
      action: flip
      after_min: 8
      required: false
  zone2:
    label: "Falafele (4 szt.)"
    function: "Air Fry"
    temp_c: 200
    minutes: 17
    turn:
      action: flip
      after_min: 8
      required: false

steps:
  - text: "Odcedź ciecierzycę z puszki, opłucz i dokładnie osusz ręcznikiem kuchennym. Nie używaj programu DEHYDRATE. Cebulę i czosnek obierz, natkę opłucz i osusz."
  - text: "Do naczynia miksującego TM6 włóż cebulę, czosnek i natkę. Rozdrobnij bez podgrzewania."
    tm6:
      duration_seconds: 5
      speed: 5
  - text: "Dodaj do TM6 ciecierzycę, mąkę, przyprawy i olej. Zmiksuj krótko bez podgrzewania. Masa powinna pozostać lekko ziarnista, nie gładka jak hummus."
    tm6:
      duration_seconds: 5
      speed: 4
  - text: "Zgarnij masę kopystką. Zwilż dłonie i uformuj dziewięć małych, lekko spłaszczonych kotlecików. Jeśli masa nie trzyma kształtu, schłódź ją dłużej przed formowaniem."
  - text: "Ułóż falafele na talerzu i wstaw do lodówki, żeby stężały przed pieczeniem."
    timer_seconds: 1200
  - text: "Lekko spryskaj olejem oryginalne tacki Ninji. Ułóż falafele w dwóch szufladach zgodnie z etykietami stref, pozostawiając odstępy. Spryskaj wierzch. Wybierz MATCH i uruchom program zgodnie z panelem Ninja."
  - text: "W połowie pieczenia, jeżeli falafele są już zwarte, delikatnie odwróć je łopatką. Jeśli są zbyt miękkie i mogłyby się rozpaść, nie obracaj."
  - text: "Gdy do końca programu zostaną około cztery minuty, sprawdź falafele. Powinny być rumiane, zwarte i gorące w środku. Mniejsze mogą być gotowe wcześniej; jeśli potrzeba, dopiekaj krótko, kontrolując stopień wypieczenia."
  - text: "Wyjmij falafele i odstaw na kilka minut, aby stężały. Podawaj z warzywami lub sosem jogurtowym."

translations:
  en:
    title: "Chickpea falafels"
    description: "Nine small falafels made with canned chickpeas, three servings of three pieces each. Prepare the mixture in the TM6 and cook the patties in the Ninja DZ400UK. Canned chickpeas make a softer texture than traditional soaked raw chickpeas. Suggested settings: check at the first cook."
    ingredients:
      - name: "Canned chickpeas"
        note: "drained weight; usually from one 400 g can"
      - name: "Onion"
        note: "about a quarter of a small onion"
      - name: "Garlic"
        note: "peeled clove"
      - name: "Flat-leaf parsley"
        note: "leaves only"
      - name: "Ground cumin"
      - name: "Ground coriander"
        note: "optional"
      - name: "Sweet paprika"
      - name: "Salt"
      - name: "Plain flour"
        note: "to bind the mixture"
      - name: "Rapeseed oil"
        note: "for the mixture; also a little cooking oil spray for the plates and falafels"
    steps:
      - text: "Drain and rinse the canned chickpeas, then thoroughly pat them dry with kitchen paper. Do not use the DEHYDRATE programme. Peel the onion and garlic, and wash and dry the parsley."
      - text: "Place the onion, garlic and parsley in the TM6 mixing bowl. Chop without heating."
      - text: "Add the chickpeas, flour, spices and oil to the TM6. Mix briefly without heating. The mixture should remain slightly coarse, not smooth like hummus."
      - text: "Scrape down the bowl with the spatula. Wet your hands and shape nine small, slightly flattened patties. If the mixture does not hold together, chill it longer before shaping."
      - text: "Place the falafels on a plate and refrigerate to firm up before cooking."
      - text: "Lightly spray the original Ninja crisper plates with oil. Arrange the falafels in the two drawers as indicated by the zone labels, leaving gaps. Spray the tops. Select MATCH and start the programme according to the Ninja panel."
      - text: "Halfway through cooking, turn the falafels carefully with a spatula if they have firmed up. If too soft and likely to fall apart, do not turn them."
      - text: "With about four minutes remaining, check the falafels. They should be golden, firm and hot throughout. Smaller ones may finish earlier; if needed, cook briefly longer while checking their doneness."
      - text: "Remove the falafels and leave to stand for a few minutes to firm up. Serve with vegetables or a yoghurt sauce."
    labels:
      zone1: "Falafels (5 pieces)"
      zone2: "Falafels (4 pieces)"
---
