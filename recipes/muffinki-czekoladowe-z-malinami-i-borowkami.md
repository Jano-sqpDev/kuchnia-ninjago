---
# plik: recipes/muffinki-czekoladowe-z-malinami-i-borowkami.md
schema_version: 1
title: "Muffinki czekoladowe z malinami i borówkami"
description: "Sześć wysokich muffinek o intensywnym smaku kakao, z malinami, borówkami i niewielką ilością czekolady. Lżejsza wersja z dodatkiem skyru, około 190 kcal na sztukę przy sześciu porcjach. Ustawienia proponowane, do sprawdzenia przy pierwszym gotowaniu."
servings: 6
prep_minutes: 12
cook_minutes: 20
tags: [tm6, ninja, low, kids, muffinki, deser, czekolada, owoce]
source: "ChatGPT — nowy, nieprzetestowany wariant muffinek czekoladowych z owocami dla rodziny"

ingredients:
  - name: "Mąka pszenna"
    amount: 95
    unit: g
    note: "zwykła, plain flour"
  - name: "Kakao"
    amount: 25
    unit: g
    note: "niesłodzone"
  - name: "Cukier"
    amount: 40
    unit: g
  - name: "Masło"
    amount: 30
    unit: g
  - name: "Skyr naturalny"
    amount: 60
    unit: g
  - name: "Mleko"
    amount: 60
    unit: g
  - name: "Jajko"
    amount: 1
    unit: pcs
  - name: "Czekolada"
    amount: 25
    unit: g
    note: "mleczna lub gorzka, posiekana; większość do środka, reszta na wierzch"
  - name: "Borówki"
    amount: 60
    unit: g
  - name: "Maliny"
    amount: 40
    unit: g
  - name: "Proszek do pieczenia"
    amount: 1
    unit: tsp
  - name: "Ekstrakt waniliowy"
    amount: 3
    unit: g
    note: "około pół łyżeczki, odmierzane wagą TM6"
  - name: "Sól"
    amount: 1
    unit: pinch

ninja:
  mode: match
  zone1:
    label: "Muffinki (3 szt.)"
    function: "Bake"
    temp_c: 160
    minutes: 20
  zone2:
    label: "Muffinki (3 szt.)"
    function: "Bake"
    temp_c: 160
    minutes: 20

steps:
  - text: "Przygotuj sześć wysokich papierowych foremek. Włóż każdą do płytkiej metalowej foremki, aby podeprzeć spód. Jeśli papier jest cienki i boki się rozchodzą, użyj dwóch papierowych foremek jedna w drugiej; płytki metal nie podeprze całej wysokości. Foremki muszą stać stabilnie. Posiekaj czekoladę i przygotuj owoce."
  - text: "Do naczynia TM6 włóż masło. Rozpuść je bez zakładania miarki na pokrywie."
    tm6:
      duration_seconds: 120
      temperature: 50
      speed: 2
  - text: "Dodaj do masła najpierw mleko i skyr, żeby je schłodzić, następnie jajko, cukier i wanilię. Wymieszaj."
    tm6:
      duration_seconds: 15
      speed: 3
  - text: "Dodaj mąkę, kakao, proszek do pieczenia i sól. Wymieszaj krótko, tylko do połączenia składników. Nie miksuj dłużej, żeby muffinki nie wyszły zbite."
    tm6:
      duration_seconds: 10
      speed: 3
  - text: "Zgarnij ciasto ze ścianek naczynia. Wsyp większą część posiekanej czekolady i delikatnie wmieszaj ręcznie kopystką. Dodaj maliny i borówki i również wymieszaj ręcznie, nie rozgniatając owoców."
  - text: "Podziel ciasto między sześć przygotowanych papierowych foremek, napełniając je mniej więcej do dwóch trzecich wysokości. Rozłóż pozostałe kawałki czekolady na wierzchu. Nie wkładaj pustych papilotek do szuflady."
  - text: "Ustaw po trzy wypełnione foremki w każdej szufladzie Ninji na oryginalnych tackach, zachowując odstępy. Wybierz MATCH i uruchom BAKE zgodnie z panelem Ninja, bez wstępnego nagrzewania. Nie obracaj muffinek ani nie potrząsaj szufladami."
  - text: "⚠️ Po około siedemnastu minutach sprawdź patyczkiem środek muffinki, omijając owoce i kawałki czekolady. Patyczek może mieć wilgotne okruszki, ale nie surowe ciasto. Jeśli środek jest płynny, dopiekaj po dwie–trzy minuty, sprawdzając ponownie. Czas dla wysokich papierowych foremek w Ninji DZ400UK jest jeszcze nieprzetestowany."
  - text: "Wyjmij foremki i pozostaw muffinki do przestudzenia na pięć–dziesięć minut. Dopiero potem zdejmij papierowe foremki lub podawaj w papilotkach."

translations:
  en:
    title: "Chocolate muffins with raspberries and blueberries"
    description: "Six tall cocoa-rich muffins with raspberries, blueberries and a little chopped chocolate. A lighter version with skyr, approximately 190 kcal each when making six portions. Suggested settings: check at the first cook."
    ingredients:
      - name: "Plain flour"
        note: "regular plain flour"
      - name: "Cocoa powder"
        note: "unsweetened"
      - name: "Sugar"
      - name: "Butter"
      - name: "Plain skyr"
      - name: "Milk"
      - name: "Egg"
      - name: "Chocolate"
        note: "milk or dark, chopped; most folded into the batter, the rest on top"
      - name: "Blueberries"
      - name: "Raspberries"
      - name: "Baking powder"
      - name: "Vanilla extract"
        note: "about half a teaspoon, weighed in the TM6"
      - name: "Salt"
    steps:
      - text: "Prepare six tall paper muffin cases. Place each one inside a shallow metal mould to support its base. If the paper is thin and the sides spread, double up the paper cases; the shallow metal mould cannot support the full height. Make sure they stand securely. Chop the chocolate and prepare the berries."
      - text: "Put the butter into the TM6 mixing bowl. Melt it with the measuring cup removed."
      - text: "Add the milk and skyr to the butter first to cool it, then add the egg, sugar and vanilla. Mix."
      - text: "Add the flour, cocoa powder, baking powder and salt. Mix briefly, just until combined. Do not overmix or the muffins may become dense."
      - text: "Scrape down the sides of the bowl. Add most of the chopped chocolate and gently fold it in by hand with the spatula. Add the raspberries and blueberries, folding them in carefully without crushing them."
      - text: "Divide the batter between six prepared paper cases, filling each around two-thirds full. Scatter the remaining chocolate pieces over the tops. Never place empty paper cases in the drawer."
      - text: "Arrange three filled muffin cases on the original crisper plate in each Ninja drawer, leaving space between them. Select MATCH and start BAKE following the Ninja panel, without preheating. Do not turn the muffins or shake the drawers."
      - text: "⚠️ After about seventeen minutes, check the centre of a muffin with a skewer, avoiding berries and chocolate pieces. Moist crumbs are fine, but there should be no raw batter. If the centre is still liquid, bake in further two- to three-minute increments, checking again. The baking time for tall paper cases in the Ninja DZ400UK has not yet been tested."
      - text: "Remove the moulds and leave the muffins to cool for five to ten minutes. Only then remove the paper cases or serve the muffins in their liners."
    labels:
      zone1: "Muffins (3 pieces)"
      zone2: "Muffins (3 pieces)"
---
