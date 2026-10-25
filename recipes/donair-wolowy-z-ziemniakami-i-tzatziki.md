---
# plik: recipes/donair-wolowy-z-ziemniakami-i-tzatziki.md
schema_version: 1
title: "Wołowy donair z pieczonymi ziemniakami i tzatziki"
description: "Rodzinny talerz w stylu gyros: cienkie płaty wołowego donaira z mielonej wołowiny 5%, chrupiące ziemniaki z Ninji, tzatziki i świeże warzywa. Bez przygotowywania pity. Ustawienia proponowane, do sprawdzenia przy pierwszym gotowaniu."
servings: 4
prep_minutes: 25
cook_minutes: 25
tags: [ninja, tm6, obiad, wołowina, wysokobiałkowe, warzywa, low, kids]
source: "Metoda Thin Roll: Andy Hay, The East Coast Kitchen; rodzinna adaptacja ChatGPT do 500 g wołowiny 5% i Ninja DZ400UK"

ingredients:
  - name: "Wołowina mielona 5% tłuszczu"
    amount: 500
    unit: g
    group: "Donair"
  - name: "Cebula biała"
    amount: 50
    unit: g
    note: "obrana, do mięsa"
    group: "Donair"
  - name: "Czosnek"
    amount: 2
    unit: pcs
    note: "ząbki, do mięsa"
    group: "Donair"
  - name: "Jogurt grecki"
    amount: 40
    unit: g
    note: "do masy mięsnej"
    group: "Donair"
  - name: "Kolendra mielona"
    amount: 1
    unit: tsp
    group: "Donair"
  - name: "Oregano suszone"
    amount: 1
    unit: tsp
    group: "Donair"
  - name: "Czosnek granulowany"
    amount: 1
    unit: tsp
    group: "Donair"
  - name: "Cebula granulowana"
    amount: 1
    unit: tsp
    group: "Donair"
  - name: "Pieprz czarny"
    amount: 0.5
    unit: tsp
    group: "Donair"
  - name: "Sól"
    amount: 0.75
    unit: tsp
    group: "Donair"
  - name: "Ziemniaki"
    amount: 650
    unit: g
    note: "do pieczenia, pokroić na kawałki ok. 3 cm"
    group: "Ziemniaki"
  - name: "Oliwa"
    amount: 10
    unit: ml
    note: "do ziemniaków"
    group: "Ziemniaki"
  - name: "Sól"
    note: "do ziemniaków, do smaku"
    group: "Ziemniaki"
  - name: "Jogurt grecki"
    amount: 200
    unit: g
    note: "gęsty, do tzatziki"
    group: "Tzatziki"
  - name: "Ogórek świeży"
    amount: 150
    unit: g
    note: "starty i mocno odciśnięty"
    group: "Tzatziki"
  - name: "Czosnek"
    amount: 1
    unit: pcs
    note: "ząbek, drobno starty"
    group: "Tzatziki"
  - name: "Sok z cytryny"
    amount: 2
    unit: tsp
    group: "Tzatziki"
  - name: "Koperek"
    note: "świeży, posiekany, do smaku"
    group: "Tzatziki"
  - name: "Sól"
    note: "do tzatziki, do smaku"
    group: "Tzatziki"
  - name: "Pomidor"
    amount: 200
    unit: g
    note: "w plasterkach lub kostce"
    group: "Dodatki"
  - name: "Cebula czerwona"
    amount: 40
    unit: g
    note: "cienkie piórka, opcjonalnie"
    group: "Dodatki"
  - name: "Sałata"
    amount: 80
    unit: g
    note: "poszarpana"
    group: "Dodatki"
  - name: "Oliwa"
    amount: 5
    unit: ml
    note: "opcjonalnie na patelnię do zrumienienia gotowego mięsa"
    group: "Wykończenie"

ninja:
  mode: sync
  zone1:
    label: "Donair: rulony wołowiny"
    function: "Roast"
    temp_c: 200
    minutes: 20
  zone2:
    label: "Ziemniaki"
    function: "Air Fry"
    temp_c: 190
    minutes: 18

steps:
  - text: "Przygotuj tzatziki: zetrzyj ogórek, bardzo mocno odciśnij płyn i wymieszaj z jogurtem greckim, drobno startym czosnkiem, sokiem z cytryny, koperkiem i solą. Wstaw do lodówki. Warzywa do podania umyj i pokrój."
  - text: "Włóż białą cebulę i czosnek przeznaczony do donaira do TM6. Rozdrobnij na drobną masę, zbierz kopystką ze ścianek."
    tm6:
      duration_seconds: 5
      speed: 5
  - text: "Dodaj do TM6 wołowinę, jogurt przeznaczony do mięsa, kolendrę, oregano, granulowany czosnek i cebulę, pieprz oraz sól. Wymieszaj na jednolitą, lekko kleistą pastę. Nie pozostawiaj dużych kawałków cebuli."
    tm6:
      duration_seconds: 20
      speed: 4
  - text: "Podziel mięsną masę na trzy równe części. Każdą połóż na arkuszu papieru do pieczenia, przykryj drugim arkuszem i rozwałkuj na bardzo cienki płat, około 2–3 mm. Zdejmij górny arkusz. Zwijaj płat ciasno razem z dolnym papierem od dłuższego boku, tak aby papier oddzielał warstwy mięsa. Spłaszcz rulon, a końce papieru podwiń pod spód. Przytnij długość rulonów do szuflady."
  - text: "Ułóż trzy zawinięte, spłaszczone rulony obok siebie w strefie 1 Ninji, bez piętrowania i z odstępami dla obiegu powietrza. Nie mogą dotykać grzałki ani mieć luźnych końców papieru; użyj papieru dopuszczonego do pieczenia w tej temperaturze. Jeśli trzy nie mieszczą się swobodnie, nie upychaj ich — piecz mięso partiami."
  - text: "Ziemniaki umyj, osusz i pokrój na kawałki podobnej wielkości, około 3 cm. Wymieszaj z oliwą przeznaczoną do ziemniaków i solą, rozłóż w strefie 2 bez papierowej wkładki, możliwie jedną warstwą."
  - text: "Ustaw obie strefy Ninji zgodnie z panelem, naciśnij SYNC i uruchom START. Ninja uruchomi krótszy program ziemniaków później, aby obie szuflady skończyły razem. Nie obracaj rulonów; ziemniaki możesz pozostawić bez potrząsania."
  - text: "Po zakończeniu pieczenia ostrożnie sprawdź termometrem środek najgrubszego rulonu, pomiędzy warstwami mięsa. Mielona wołowina musi osiągnąć co najmniej 75°C i utrzymać tę temperaturę przez 30 sekund. Jeśli nie jest gotowa, piecz dalej i sprawdź ponownie. Ziemniaki powinny być miękkie w środku i rumiane; w razie potrzeby dostosuj ich czas oddzielnie."
    internal_temp_c: 75
  - text: "Odłóż gotowe rulony na chwilę, następnie ostrożnie rozwiń papier, uważając na gorącą parę i soki. Oddziel cienkie płaty mięsa na paski. Jeśli chcesz chrupiących brzegów, bardzo krótko podsmaż paski na rozgrzanej patelni z opcjonalną oliwą. Nie przesuszaj chudej wołowiny."
  - text: "Rozdziel ziemniaki i paski donaira na talerze. Dodaj tzatziki, pomidora, czerwoną cebulę i sałatę. Ostrą przyprawę lub sos podaj osobno, jeżeli jedzą również dzieci."

translations:
  en:
    title: "Beef donair with roast potatoes and tzatziki"
    description: "Family-style gyro platter: thin 5%-fat minced-beef donair ribbons, crisp Ninja potatoes, tzatziki and fresh vegetables. No homemade pita required. Suggested settings; check them on the first cook."
    ingredients:
      - name: "5%-fat minced beef"
      - name: "White onion"
        note: "peeled, for the beef"
      - name: "Garlic"
        note: "cloves, for the beef"
      - name: "Greek yoghurt"
        note: "for the meat mixture"
      - name: "Ground coriander"
      - name: "Dried oregano"
      - name: "Garlic powder"
      - name: "Onion powder"
      - name: "Black pepper"
      - name: "Salt"
      - name: "Potatoes"
        note: "suitable for roasting, cut into pieces about 3 cm wide"
      - name: "Olive oil"
        note: "for the potatoes"
      - name: "Salt"
        note: "for the potatoes, to taste"
      - name: "Greek yoghurt"
        note: "thick, for the tzatziki"
      - name: "Fresh cucumber"
        note: "grated and thoroughly squeezed dry"
      - name: "Garlic"
        note: "clove, finely grated"
      - name: "Lemon juice"
      - name: "Dill"
        note: "fresh, chopped, to taste"
      - name: "Salt"
        note: "for the tzatziki, to taste"
      - name: "Tomato"
        note: "sliced or diced"
      - name: "Red onion"
        note: "thinly sliced, optional"
      - name: "Lettuce"
        note: "torn into pieces"
      - name: "Olive oil"
        note: "optional, for crisping the cooked beef in a frying pan"
    groups:
      Donair: "Donair"
      Ziemniaki: "Potatoes"
      Tzatziki: "Tzatziki"
      Dodatki: "Accompaniments"
      Wykończenie: "Finishing"
    steps:
      - text: "Prepare the tzatziki: grate the cucumber, squeeze out the liquid thoroughly and mix with Greek yoghurt, finely grated garlic, lemon juice, dill and salt. Refrigerate. Wash and chop the vegetables for serving."
      - text: "Put the white onion and the garlic for the donair into the TM6. Chop finely and scrape down the bowl."
      - text: "Add the minced beef, the yoghurt for the beef, coriander, oregano, garlic and onion powders, pepper and salt to the TM6. Mix to form a uniform, slightly sticky paste with no large onion pieces."
      - text: "Divide the mixture into three equal portions. Place each portion on baking parchment, top with a second sheet and roll into a very thin layer, about 2–3 mm. Remove the top sheet. Roll the meat tightly from the long edge together with the bottom parchment, so paper separates the meat layers. Flatten the roll and tuck the paper ends underneath. Trim the rolls to fit the drawer."
      - text: "Place the three wrapped, flattened rolls side by side in Ninja zone 1 without stacking, allowing space for airflow. Keep them clear of the heating element and do not leave loose parchment ends; use parchment rated for this temperature. If three rolls do not fit comfortably, cook the beef in batches rather than crowding them."
      - text: "Wash and dry the potatoes and cut into similarly sized pieces, about 3 cm. Toss with the olive oil for the potatoes and salt. Place in zone 2 without a paper liner, ideally in one layer."
      - text: "Set both Ninja zones according to the panel, press SYNC and then START. The Ninja will start the shorter potato programme later so both drawers finish together. Do not turn the meat rolls; the potatoes may be left without shaking."
      - text: "At the end, carefully check the centre of the thickest roll between the meat layers with a thermometer. Minced beef must reach at least 75°C and hold that temperature for 30 seconds. If needed, continue cooking and recheck. The potatoes should be tender inside and golden; adjust their time separately if necessary."
      - text: "Rest the cooked rolls briefly, then carefully unwrap the parchment, taking care around hot steam and juices. Pull the thin sheets of meat into ribbons. For crisp edges, briefly fry them in a hot pan with the optional olive oil. Do not dry out the lean beef."
      - text: "Divide the potatoes and donair ribbons among plates. Add tzatziki, tomato, red onion and lettuce. Serve any hot sauce or chilli seasoning separately when cooking for children."
    labels:
      zone1: "Beef donair rolls"
      zone2: "Potatoes"
---
Metoda Thin Roll inspirowana przepisem Andy'ego Haya. Pieczenie w Ninja na dwóch strefach jest adaptacją testową; docelowy czas zależy od grubości spłaszczonych rulonów i rzeczywistego ułożenia mięsa. Jeśli rulony nie mieszczą się razem w jednej szufladzie, zamiast używać SYNC upiecz mięso partiami.
