---
# plik: recipes/drozdzowki-serowe-z-borowkami.md
schema_version: 1
title: "Drożdżówki serowe ze skyrem i borówkami"
description: "Miękkie bułeczki z serka wiejskiego z waniliowym nadzieniem i borówkami, bez drożdży i bez odżywek białkowych. Dla całej rodziny. Ustawienia proponowane, do sprawdzenia przy pierwszym gotowaniu."
servings: 6
prep_minutes: 25
cook_minutes: 25
tags: [ninja, tm6, deser, owoce, wanilia, wysokobiałkowe, low, kids]
source: "Przepis z internetu przesłany przez użytkownika; adaptacja do TM6 i Ninja DZ400UK"

ingredients:
  - name: "Serek wiejski lekki"
    amount: 300
    unit: g
    note: "odlej nadmiar luźnej zalewy, jeśli występuje"
    group: "Ciasto"
  - name: "Jajko"
    amount: 1
    unit: pcs
    group: "Ciasto"
  - name: "Mąka pszenna"
    amount: 180
    unit: g
    note: "150 g na początek, pozostałe 30 g tylko jeśli ciasto będzie zbyt miękkie; może być jasna orkiszowa"
    group: "Ciasto"
  - name: "Cukier"
    amount: 30
    unit: g
    group: "Ciasto"
  - name: "Proszek do pieczenia"
    amount: 1.5
    unit: tsp
    group: "Ciasto"
  - name: "Ekstrakt waniliowy"
    amount: 1
    unit: tsp
    group: "Ciasto"
  - name: "Sól"
    amount: 1
    unit: pinch
    group: "Ciasto"
  - name: "Skyr waniliowy"
    amount: 200
    unit: g
    note: "gęsty; można zastąpić naturalnym i dosłodzić do smaku"
    group: "Nadzienie"
  - name: "Budyń waniliowy w proszku"
    amount: 10
    unit: g
    note: "suchy proszek, bez cukru"
    group: "Nadzienie"
  - name: "Borówki"
    amount: 100
    unit: g
    group: "Nadzienie"
  - name: "Mleko"
    amount: 10
    unit: ml
    note: "do posmarowania brzegów"
    group: "Wykończenie"

ninja:
  mode: match
  zone1:
    label: "Bułeczki serowe"
    function: "Bake"
    temp_c: 170
    minutes: 25
  zone2:
    label: "Bułeczki serowe"
    function: "Bake"
    temp_c: 170
    minutes: 25

steps:
  - text: "Przygotuj składniki. Jeśli serek wiejski ma dużo luźnego płynu, odlej go. Borówki umyj i dokładnie osusz. Przygotuj papier do pieczenia do szuflad Ninji; papier musi być dociążony bułeczkami."
  - text: "Włóż serek wiejski i jajko do naczynia miksującego TM6. Zblenduj na możliwie gładką masę."
    tm6:
      duration_seconds: 15
      speed: 5
  - text: "Dodaj do TM6 podstawową część mąki, cukier, proszek do pieczenia, ekstrakt waniliowy i sól. Wymieszaj krótko, tylko do połączenia."
    tm6:
      duration_seconds: 15
      speed: 3.5
  - text: "Przełóż ciasto do miski i odstaw na 10 minut. Powinno być miękkie i lekko klejące, ale dać się formować wilgotnymi dłońmi. Jeśli wyraźnie się rozpływa, dodawaj stopniowo odłożoną mąkę; nie wsypuj jej całej bez potrzeby."
  - text: "Umyj i osusz naczynie TM6. Włóż skyr oraz suchy proszek budyniowy. Krótko wymieszaj bez podgrzewania. Borówki zostaw osobno."
    tm6:
      duration_seconds: 10
      speed: 3
  - text: "Podziel ciasto na 6 części. Zwilżonymi dłońmi uformuj okrągłe bułeczki, lekko je spłaszcz i zrób w każdej szerokie wgłębienie z podwyższonym brzegiem."
  - text: "Napełnij wgłębienia kremem skyrowym, a na wierzchu rozłóż borówki. Posmaruj brzegi odrobiną mleka."
  - text: "Ułóż bułeczki na papierze w obu szufladach Ninji, maksymalnie po 3 na szufladę, tylko jeśli mieszczą się swobodnie i nie dotykają. W przeciwnym razie piecz partiami. Ustaw MATCH zgodnie z panelem Ninja i uruchom pieczenie. Bułeczek nie obracaj."
  - text: "Po około 18 minutach samodzielnie sprawdź stopień zrumienienia brzegów; aplikacja nie uruchamia alarmu na taką kontrolę. Piecz dalej, aż brzegi lekko się zezłocą, a ciasto pod nadzieniem nie będzie surowe. Jeśli potrzeba, przedłuż pieczenie po krótkiej kontroli."
  - text: "Odstaw bułeczki do ostygnięcia; nadzienie zgęstnieje po wystudzeniu. Ze względu na skyr przechowuj w lodówce, a do lunchboxa użyj wkładu chłodzącego."

translations:
  en:
    title: "Cottage cheese buns with skyr and blueberries"
    description: "Soft cottage cheese buns with vanilla skyr filling and blueberries, made without yeast or protein powder. Suitable for the whole family. Suggested settings; check them on the first cook."
    ingredients:
      - name: "Low-fat cottage cheese"
        note: "drain excess free liquid if present"
      - name: "Egg"
      - name: "Plain flour"
        note: "start with 150 g; reserve the remaining 30 g only if the dough is too soft; light spelt flour also works"
      - name: "Sugar"
      - name: "Baking powder"
      - name: "Vanilla extract"
      - name: "Salt"
      - name: "Vanilla skyr"
        note: "thick; natural skyr can be used and sweetened to taste"
      - name: "Vanilla custard powder"
        note: "dry powder, unsweetened"
      - name: "Blueberries"
      - name: "Milk"
        note: "for brushing the edges"
    groups:
      Ciasto: "Dough"
      Nadzienie: "Filling"
      Wykończenie: "Finishing"
    steps:
      - text: "Prepare the ingredients. If the cottage cheese has a lot of free liquid, pour it off. Wash and thoroughly dry the blueberries. Prepare baking parchment for the Ninja drawers; keep it weighted down with the buns."
      - text: "Put the cottage cheese and egg into the TM6 mixing bowl. Blend until as smooth as possible."
      - text: "Add the initial portion of flour, sugar, baking powder, vanilla extract and salt to the TM6. Mix briefly, just until combined."
      - text: "Transfer the dough to a bowl and rest for 10 minutes. It should be soft and slightly sticky but shapeable with damp hands. If it spreads excessively, add the reserved flour a little at a time; do not add it all unless necessary."
      - text: "Wash and dry the TM6 bowl. Add the skyr and dry custard powder. Mix briefly without heating. Keep the blueberries separate."
      - text: "Divide the dough into 6 pieces. With damp hands, shape round buns, flatten slightly and make a wide well in each, leaving a raised rim."
      - text: "Spoon the skyr filling into the wells and top with blueberries. Lightly brush the rims with milk."
      - text: "Arrange the buns on parchment in both Ninja drawers, no more than 3 per drawer, only if they fit comfortably without touching. Otherwise bake in batches. Select MATCH using the Ninja panel and start baking. Do not flip the buns."
      - text: "After about 18 minutes check the colour of the edges yourself; the app does not trigger an alarm for this check. Continue until the edges are lightly golden and the dough beneath the filling is cooked. Extend the bake briefly if needed."
      - text: "Allow the buns to cool; the filling will thicken as it cools. Refrigerate due to the skyr filling and use an ice pack if packing in a lunchbox."
    labels:
      zone1: "Cottage cheese buns"
      zone2: "Cottage cheese buns"
---
To wypiek serowy spulchniany proszkiem do pieczenia, a nie klasyczna drożdżówka na drożdżach.
Temperatura i czas są ustawieniami testowymi dla Ninja DZ400UK; wielkość bułek i zawartość wilgoci w serku wpływają na wynik.
