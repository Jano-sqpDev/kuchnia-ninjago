---
# plik: recipes/kotleciki-z-cukinii-i-fety.md
schema_version: 1
title: "Kotleciki z cukinii i fety"
description: "Delikatne kotleciki z dobrze odciśniętej cukinii, fety i koperku, pieczone w Ninja DZ400UK. Poprawione proporcje mają ograniczyć wilgotny, kleisty środek. Ustawienia proponowane, do sprawdzenia przy pierwszym gotowaniu."
servings: 2
prep_minutes: 20
cook_minutes: 16
tags: [ninja, tm6, warzywa, obiad, norm, kids]
source: "ChatGPT — poprawiona wersja przepisu omówiona w projekcie GYM"

ingredients:
  - name: "Cukinia"
    amount: 250
    unit: g
    note: "waga przed odciśnięciem, najlepiej zetrzeć na grubych oczkach"
  - name: "Ser feta"
    amount: 60
    unit: g
    note: "pokruszony"
  - name: "Jajko"
    amount: 1
    unit: pcs
  - name: "Bułka tarta"
    amount: 30
    unit: g
    note: "do związania masy; jeśli po odciśnięciu nadal jest rzadka, dosyp odrobinę"
  - name: "Mąka pszenna"
    amount: 10
    unit: g
  - name: "Czosnek"
    amount: 1
    unit: pcs
    note: "ząbek, przeciśnięty przez praskę"
  - name: "Koperek"
    amount: 1
    unit: tsp
    note: "suszony; można zastąpić świeżym, drobno posiekanym"
  - name: "Sól"
    note: "niewielka ilość do odciągnięcia wody z cukinii; feta jest słona"
  - name: "Pieprz czarny"
    note: "do smaku"
  - name: "Oliwa"
    note: "minimalna ilość w sprayu na wierzch kotlecików"

ninja:
  mode: single
  zone1:
    label: "Kotleciki z cukinii (4–5 szt.)"
    function: "Air Fry"
    temp_c: 190
    minutes: 16
    turn:
      action: flip
      after_min: 10
      required: true

steps:
  - text: "Zetrzyj cukinię na grubych oczkach tarki. Alternatywnie krótko rozdrobnij ją w TM6, ale nie dopuść do powstania puree: wyraźne kawałki łatwiej będzie odcisnąć."
    tm6:
      duration_seconds: 3
      speed: 5
  - text: "Lekko posól cukinię i pozostaw, aby puściła wodę. Następnie bardzo mocno odciśnij ją przez czystą ściereczkę. To kluczowe, aby środek kotlecików nie był kleisty."
    timer_seconds: 600
  - text: "Dodaj pokruszoną fetę, jajko, bułkę tartą, mąkę, czosnek, koperek i pieprz. Wymieszaj ręcznie łyżką lub bardzo krótko w TM6 na obrotach wstecznych. Masa powinna utrzymywać kształt; jeśli nadal jest zbyt mokra, dosyp odrobinę bułki tartej."
    tm6:
      duration_seconds: 8
      speed: 3
      reverse: true
  - text: "Uformuj 4–5 płaskich kotlecików o grubości około 1,5 cm. Nie rób ich grubszych, ponieważ środek może pozostać wilgotny."
  - text: "Ułóż kotleciki w jednej warstwie na standardowej płytce jednej szuflady Ninja, bez dodatkowego rusztu i bez papieru. Lekko spryskaj oliwą. Ustaw program według panelu Ninja i uruchom pieczenie."
  - text: "Po alarmie obracania upewnij się, że spód kotlecików jest już zwarty, a następnie delikatnie obróć każdy szeroką łopatką. Kontynuuj pieczenie."
  - text: "Pod koniec sprawdź, czy kotleciki są złociste z zewnątrz, a środek jest ścięty i nie zawiera surowej, mokrej masy. Jeśli potrzeba, dopiekaj krótko, kontrolując rezultat."
  - text: "Podawaj ciepłe, na przykład z niewielką porcją skyru z czosnkiem i koperkiem. Sos nie jest wliczony do składników."

translations:
  en:
    title: "Courgette and feta fritters"
    description: "Tender fritters made with thoroughly squeezed courgette, feta and dill, cooked in the Ninja DZ400UK. Adjusted proportions aim to prevent a wet, gummy centre. Suggested settings; check them on the first cook."
    ingredients:
      - name: "Courgette"
        note: "weight before squeezing; preferably coarsely grated"
      - name: "Feta cheese"
        note: "crumbled"
      - name: "Egg"
      - name: "Breadcrumbs"
        note: "to bind the mixture; if it is still runny after squeezing, add a little more"
      - name: "Plain flour"
      - name: "Garlic"
        note: "clove, crushed"
      - name: "Dill"
        note: "dried; can be replaced with finely chopped fresh dill"
      - name: "Salt"
        note: "a little to draw moisture out of the courgette; feta is already salty"
      - name: "Black pepper"
        note: "to taste"
      - name: "Olive oil"
        note: "a minimal amount of spray for the tops of the fritters"
    steps:
      - text: "Coarsely grate the courgette. Alternatively chop it very briefly in the TM6, but do not turn it into a puree: distinct pieces are easier to squeeze dry."
      - text: "Salt the courgette lightly and leave it to release water. Then squeeze it very thoroughly through a clean tea towel. This is essential to avoid a gummy centre."
      - text: "Add the crumbled feta, egg, breadcrumbs, flour, garlic, dill and pepper. Mix by hand with a spoon, or very briefly in the TM6 with reverse rotation. The mixture should hold its shape; if it is still too wet, add a little more breadcrumbs."
      - text: "Shape 4–5 flat fritters, around 1.5 cm thick. Avoid making them thicker, as the centres may stay wet."
      - text: "Arrange the fritters in a single layer on the standard crisper plate in one Ninja drawer, without an extra rack or baking paper. Lightly spray with olive oil. Set the programme according to the Ninja panel and start cooking."
      - text: "When the flip alarm sounds, check that the underside has firmed up, then carefully turn each fritter with a wide spatula. Continue cooking."
      - text: "Towards the end, check that the fritters are golden outside and set in the centre, with no raw, wet mixture remaining. Cook briefly longer if needed, checking the result."
      - text: "Serve warm, for example with a small portion of skyr mixed with garlic and dill. The sauce is not included in the ingredients."
    labels:
      zone1: "Courgette fritters (4–5 pieces)"
---
Nowa kalibracja do potwierdzenia po pierwszym wypieku: 190°C przez 16 minut, ostrożne obrócenie po 10 minutach.