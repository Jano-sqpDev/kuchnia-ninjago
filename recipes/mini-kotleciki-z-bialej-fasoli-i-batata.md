---
# plik: recipes/mini-kotleciki-z-bialej-fasoli-i-batata.md
schema_version: 1
title: "Mini kotleciki z białej fasoli i batata"
description: "Około 10–12 łagodnych, małych kotlecików z całej puszki białej fasoli i batata, dobrych także na zimno do szkolnego lunchboxa. Batat gotowany na parze, a masa mieszana w TM6; pieczenie w Ninja DZ400UK. Ustawienia proponowane, do sprawdzenia przy pierwszym gotowaniu."
servings: 4
prep_minutes: 35
cook_minutes: 38
tags: [tm6, ninja, norm, kids, obiad, warzywa]
source: "Wcześniej omawiane kotleciki z białej fasoli i batata dla Heleny; adaptacja przygotowania w TM6 i pieczenia w Ninja przez ChatGPT, nieprzetestowana"

ingredients:
  - name: "Fasola biała z puszki"
    amount: 240
    unit: g
    note: "po odsączeniu, cała puszka o masie 400 g przed odsączeniem"
  - name: "Batat"
    amount: 250
    unit: g
    note: "waga po obraniu, pokrojony w niedużą kostkę"
  - name: "Jajko"
    amount: 1
    unit: pcs
  - name: "Bułka tarta"
    amount: 30
    unit: g
    note: "dodawaj stopniowo, zależnie od wilgotności masy"
  - name: "Papryka słodka"
    amount: 0.5
    unit: tsp
  - name: "Sól"
    amount: 0.25
    unit: tsp
    note: "lub mniej, według smaku"
  - name: "Oliwa"
    amount: 1
    unit: tsp
    note: "do spryskania tacek i kotlecików"
  - name: "Woda"
    amount: 500
    unit: g
    note: "wyłącznie do gotowania batata na parze w TM6; później wylej"

ninja:
  mode: match
  zone1:
    label: "Kotleciki (5–6 szt.)"
    function: "Air Fry"
    temp_c: 190
    minutes: 18
    turn:
      action: flip
      after_min: 9
      required: false
  zone2:
    label: "Kotleciki (5–6 szt.)"
    function: "Air Fry"
    temp_c: 190
    minutes: 18
    turn:
      action: flip
      after_min: 9
      required: false

steps:
  - text: "Obierz batata i pokrój w niedużą, równą kostkę, mniej więcej dwa centymetry. Wlej wodę do naczynia TM6, włóż pokrojonego batata do koszyczka i umieść koszyczek w naczyniu. Gotuj na parze; na końcu sprawdź widelcem, czy batat jest całkowicie miękki. Jeśli nie, przedłuż gotowanie o kilka minut."
    tm6:
      duration_seconds: 1200
      temperature: Varoma
      speed: 1
  - text: "Ostrożnie wyjmij gorący koszyczek kopystką. Odstaw batata na kilka minut do przestudzenia. Wylej gorącą wodę z TM6, osusz naczynie. Fasolę z puszki odcedź, opłucz i dokładnie osusz ręcznikiem kuchennym."
  - text: "Do opróżnionego naczynia TM6 włóż miękkiego, przestudzonego batata i odsączoną fasolę. Rozdrobnij krótko, tak aby zostały małe kawałki; nie miksuj na gładkie purée."
    tm6:
      duration_seconds: 5
      speed: 3
  - text: "Dodaj jajko, paprykę, sól i większość bułki tartej. Wymieszaj łagodnie na obrotach wstecznych, aby połączyć składniki bez dalszego rozdrabniania."
    tm6:
      duration_seconds: 8
      speed: 2
      reverse: true
  - text: "Sprawdź konsystencję: masa ma być wilgotna, ale nadawać się do formowania. Jeśli jest zbyt miękka, domieszaj ręcznie resztę bułki tartej. Wstaw masę do lodówki na około dwadzieścia–trzydzieści minut, aby stężała."
    timer_seconds: 1200
  - text: "Wilgotnymi dłońmi uformuj około dziesięciu–dwunastu małych, lekko spłaszczonych kotlecików podobnej grubości. Lekko spryskaj oryginalne tacki Ninji oliwą."
  - text: "Rozłóż kotleciki w dwóch szufladach Ninji w jednej warstwie, z odstępami; delikatnie spryskaj wierzch. Ustaw obie strefy według panelu Ninja i uruchom MATCH, bez nagrzewania. Jeśli nie mieszczą się swobodnie, piecz w partiach."
  - text: "W połowie programu sprawdź, czy kotleciki już trzymają kształt. Jeśli tak, delikatnie obróć je łopatką; jeśli są bardzo miękkie, pozostaw bez obracania, aby się nie rozpadły."
  - text: "Zacznij kontrolować kotleciki po około czternastu minutach pieczenia. Powinny być rumiane na zewnątrz, zwarte i całkowicie gorące w środku, bez mokrej masy z surowym jajkiem. W razie potrzeby dopiekaj po dwie–trzy minuty, kontrolując środek. Czas pieczenia tej wersji jest jeszcze nieprzetestowany."
  - text: "Do lunchboxa wystudź kotleciki możliwie szybko i przechowuj je w lodówce. Rano zapakuj je schłodzone, najlepiej z wkładem chłodzącym. Nie zostawiaj ugotowanych kotlecików na noc w temperaturze pokojowej."

translations:
  en:
    title: "Mini white bean and sweet potato patties"
    description: "About 10–12 mildly seasoned little patties made with a whole can of white beans and sweet potato, also suitable cold in a school lunchbox. Steam the sweet potato and mix the patties in the TM6, then cook in the Ninja DZ400UK. Suggested settings: check at the first cook."
    ingredients:
      - name: "Canned white beans"
        note: "drained weight, from one whole 400 g can before draining"
      - name: "Sweet potato"
        note: "peeled weight, cut into small cubes"
      - name: "Egg"
      - name: "Breadcrumbs"
        note: "add gradually depending on the mixture's moisture"
      - name: "Sweet paprika"
      - name: "Salt"
        note: "or less, to taste"
      - name: "Olive oil"
        note: "for lightly spraying the trays and patties"
      - name: "Water"
        note: "only for steaming the sweet potato in the TM6; discard afterwards"
    steps:
      - text: "Peel the sweet potato and cut it into small, even cubes, roughly two centimetres across. Put the water in the TM6 mixing bowl, put the diced sweet potato in the simmering basket and insert the basket. Steam; afterwards, check with a fork that the sweet potato is completely tender. If not, steam for a few more minutes."
      - text: "Carefully lift out the hot simmering basket using the spatula. Let the sweet potato cool for a few minutes. Carefully discard the hot water and dry the TM6 bowl. Drain and rinse the canned beans, then pat them thoroughly dry with kitchen paper."
      - text: "Put the soft, cooled sweet potato and drained beans into the empty TM6 bowl. Chop briefly, leaving some small pieces; do not blend into a smooth purée."
      - text: "Add the egg, paprika, salt and most of the breadcrumbs. Mix gently in reverse to combine without chopping the mixture further."
      - text: "Check the texture: the mixture should be moist but firm enough to shape. If too soft, fold in the remaining breadcrumbs by hand. Refrigerate the mixture for about twenty to thirty minutes to firm up."
      - text: "With damp hands, shape around ten to twelve small, slightly flattened patties of similar thickness. Lightly spray the original Ninja crisper plates with olive oil."
      - text: "Arrange the patties in the two Ninja drawers in a single layer with gaps; lightly spray the tops. Set both zones as shown on the Ninja panel and start MATCH without preheating. If they do not fit comfortably, cook in batches."
      - text: "Halfway through cooking, check whether the patties hold together. If firm, carefully flip them with a spatula; if very soft, leave them unturned to avoid breaking them."
      - text: "Start checking after about fourteen minutes. The patties should be golden outside, firm and thoroughly hot in the centre, with no wet uncooked egg mixture. If needed, cook in additional two- to three-minute intervals and check the centre. This version's cooking time has not yet been tested."
      - text: "For a school lunchbox, cool the patties promptly and refrigerate them. Pack them chilled in the morning, ideally with an ice pack. Do not leave cooked patties at room temperature overnight."
    labels:
      zone1: "Patties (5–6 pieces)"
      zone2: "Patties (5–6 pieces)"
---
