---
# plik: recipes/kurczak-z-batatami-dynia-pizmowa-i-fasolka-szparagowa.md
schema_version: 1
title: "Kurczak z batatami, dynią piżmową i fasolką szparagową"
description: "Kompletny lunch z całej piersi kurczaka, pieczonych batatów ze skórką, dyni piżmowej (butternut chunks) i zielonej fasolki szparagowej. Około 550 kcal i 53 g białka na porcję przy przykładowej piersi 200 g; wynik zależy od rzeczywistej masy mięsa. Ustawienia kurczaka 190°C / 25 min nawiązują do udanej piersi z Dijon; warzywa 190°C / 20 min. Ustawienia proponowane, do sprawdzenia przy pierwszym gotowaniu."
servings: 1
prep_minutes: 10
cook_minutes: 25
tags: [ninja, low, obiad, kurczak, warzywa, wysokobiałkowe]
source: "ChatGPT — wariant gotowany przez użytkownika 19.11.2026; proponowane proporcje, kolejność dodawania warzyw ustalona w rozmowie"
ingredients:
  - name: "Pierś kurczaka"
    amount: 200
    unit: g
    note: "surowa, w całości; ilość przykładowa, użyj rzeczywistej masy swojej piersi"
    group: "Kurczak"
  - name: "Czosnek"
    amount: 1
    unit: pcs
    note: "ząbek, drobno starty"
    group: "Kurczak"
  - name: "Sok z cytryny"
    amount: 10
    unit: ml
    group: "Kurczak"
  - name: "Tymianek suszony"
    amount: 0.5
    unit: tsp
    group: "Kurczak"
  - name: "Oregano suszone"
    amount: 0.5
    unit: tsp
    group: "Kurczak"
  - name: "Sól"
    amount: 0.25
    unit: tsp
    group: "Kurczak"
  - name: "Pieprz czarny"
    amount: 0.25
    unit: tsp
    group: "Kurczak"
  - name: "Bataty (sweet potato)"
    amount: 200
    unit: g
    note: "surowe, dokładnie umyte, ze skórką, pokrojone w kostkę około 2 cm"
    group: "Warzywa"
  - name: "Dynia piżmowa (butternut chunks)"
    amount: 180
    unit: g
    note: "surowa, kawałki około 2 cm"
    group: "Warzywa"
  - name: "Fasolka szparagowa zielona"
    amount: 100
    unit: g
    note: "świeża, cienka extra fine; grubsza może wymagać dłuższego czasu"
    group: "Warzywa"
  - name: "Oliwa z oliwek w sprayu"
    amount: 2
    unit: g
    note: "maksymalnie na całe danie"
    group: "Warzywa"
ninja:
  mode: sync
  zone1:
    label: "Pierś kurczaka"
    function: "Air Fry"
    temp_c: 190
    minutes: 25
  zone2:
    label: "Bataty, dynia i fasolka"
    function: "Air Fry"
    temp_c: 190
    minutes: 20
    turn:
      action: shake
      after_min: 14
steps:
  - text: "Osusz pierś, natrzyj czosnkiem, sokiem z cytryny, tymiankiem, oregano, solą i pieprzem. Spryskaj niewielką częścią oliwy. Kurczak pozostaje w całości i nie wymaga obracania."
  - text: "Dokładnie umyj i osusz batata; NIE obieraj skórki. Pokrój w kostkę około 2 cm. Bataty lekko spryskaj pozostałą oliwą, ułóż na początku same w strefie 2. Dynię i fasolkę zostaw poza urządzeniem."
  - text: "Ułóż pierś w strefie 1. Ustaw strefy według panelu Ninja, wybierz SYNC i START. Ninja automatycznie opóźni start strefy warzyw, aby obie skończyły jednocześnie."
  - text: "WAŻNE — DODAJ DYNIĘ RĘCZNIE: gdy w strefie 2 pozostanie 12 minut, otwórz szufladę, dodaj butternut chunks i przemieszaj je z batatami. Osobny alarm na to dodanie nie jest ustawiony."
  - text: "WAŻNE — DODAJ FASOLKĘ RĘCZNIE: gdy w strefie 2 pozostanie 7 minut, włóż cienką zieloną fasolkę szparagową. Jeśli masz grubszą fasolkę, dodaj ją wcześniej, aby zdążyła zmięknąć."
  - text: "Przy alarmie POTRZĄŚNIJ przemieszaj wszystkie warzywa w szufladzie 2. Zwróć uwagę na kawałki dyni, które mogą przypiekać się szybciej. Jeśli warzyw jest za dużo i piętrzą się w szufladzie, nie będą równomiernie chrupiące."
  - text: "Sprawdź temperaturę w najgrubszym miejscu piersi: cel 75°C. Jeśli mięso nie osiągnęło tej temperatury, dopiecz je i sprawdź ponownie. Jeżeli pierś jest grubsza lub cięższa od przykładowej, czas może wymagać korekty."
    internal_temp_c: 75
  - text: "Podaj kurczaka z całymi upieczonymi batatami, dynią piżmową i fasolką. To pełna porcja, bez dodatkowego ryżu lub makaronu."
translations:
  en:
    title: "Chicken with sweet potato, butternut squash and green beans"
    description: "A complete lunch with a whole chicken breast, roasted skin-on sweet potato, butternut squash chunks and fine green beans. Approximately 550 kcal and 53 g protein per serving using the example 200 g chicken breast; the actual value depends on the weight of the breast. Chicken settings of 190°C for 25 minutes follow a successful Dijon chicken cook; vegetables use 190°C for 20 minutes. Suggested settings to verify on the first cook."
    ingredients:
      - name: "Chicken breast"
        note: "raw and whole; example weight only, use the actual weight of your breast"
      - name: "Garlic"
        note: "clove, finely grated"
      - name: "Lemon juice"
      - name: "Dried thyme"
      - name: "Dried oregano"
      - name: "Salt"
      - name: "Black pepper"
      - name: "Sweet potato"
        note: "raw, thoroughly washed, skin on, diced into approximately 2 cm cubes"
      - name: "Butternut squash chunks"
        note: "raw, approximately 2 cm pieces"
      - name: "Fine green beans"
        note: "fresh, fine extra-fine beans; thicker beans may require longer"
      - name: "Spray olive oil"
        note: "maximum amount for the whole meal"
    groups:
      "Kurczak": "Chicken"
      "Warzywa": "Vegetables"
    steps:
      - text: "Pat the chicken breast dry and rub with garlic, lemon juice, thyme, oregano, salt and pepper. Spray with a little oil. Keep the breast whole; turning is not required."
      - text: "Wash and dry the sweet potato thoroughly; DO NOT peel it. Cut into roughly 2 cm cubes. Spray lightly with the remaining olive oil and put only the sweet potato in zone 2 at first. Keep the squash and beans aside."
      - text: "Place the breast in zone 1. Set the zones as shown on the Ninja panel, choose SYNC, then START. The Ninja will automatically delay the vegetables so that both zones finish together."
      - text: "IMPORTANT — ADD SQUASH MANUALLY: when 12 minutes remain in zone 2, open the drawer, add the butternut chunks and toss with the sweet potato. There is no separate app alert for this addition."
      - text: "IMPORTANT — ADD BEANS MANUALLY: when 7 minutes remain in zone 2, add the fine green beans. If you have thicker beans, add them earlier so they can soften."
      - text: "When the SHAKE alert sounds, toss all vegetables in zone 2. Watch the squash, which may brown faster. Do not overcrowd the drawer or the vegetables will not crisp evenly."
      - text: "Check the thickest part of the chicken breast: target 75°C. If it has not reached that temperature, cook longer and recheck. A thicker or heavier breast than the example weight may need a different time."
      - text: "Serve the chicken with all the roasted sweet potato, butternut squash and beans. This is a complete portion, with no extra rice or pasta."
    labels:
      zone1: "Chicken breast"
      zone2: "Sweet potato, squash and beans"
---
