# Hemuppgift 3A – steg 1: Öppna luckor överlappar varandra

## Observation

På skärmbilden är lucka 6 och lucka 2 öppna (demokalendern, `public/examples/demo.json`). De uppsvängda luckorna (den beige kartongbaksidan) är tydligt **större än hålet de sitter i**:

- Lucka 6:s lucka sträcker sig både ovanför och nedanför sitt hål. Nederkanten möter överkanten på lucka 2:s uppsvängda lucka, så de två korsar varandra i glipan mellan raderna.
- Till höger om både lucka 6 och lucka 2 syns en uppsvängd lucka från grannen i samma rad (lucka 24 respektive 19). Den täcker hela glipan och når fram till kanten på bilden i lucka 6 och lucka 2.
- Luckorna ser ut som trapetser där kanten som svängt ut är mycket högre än gångjärnskanten. Perspektivet förstorar alltså luckan kraftigt.

Relevant kod:

- [Door.module.css](src/components/Door.module.css): `.slot { perspective: 600px; }`, `.open { transform: rotateY(-105deg); }`, `transform-origin: left center`, `.slotOpen { z-index: 1; }`
- [validateConfig.ts](src/lib/validateConfig.ts): `validateNoOverlap` jämför bara luckornas stängda rektanglar.
- Demolayouten: lucka 6 = `x 728, y 394, 200×200`, lucka 2 = `x 716, y 638, 200×200`. Det ger en lodrät glipa på 44 px i bildens koordinater. Lucka 24 börjar på `x 1022`, alltså 94 px till höger om lucka 6.

---

## Hypotes 1 (mest sannolik): Ett fast `perspective` i pixlar förstorar luckan när kalendern är stor

### Mekanism

`perspective: 600px` är ett fast avstånd. Luckornas storlek är däremot procent av bakgrunden och växer med skärmen. När luckan svänger `rotateY(-105deg)` runt vänsterkanten kommer den fria kanten närmare betraktaren med `z = W · sin(105°) ≈ 0,97 W`. Perspektivet skalar den kanten med faktorn

```
s = p / (p − z) = 600 / (600 − 0,97 W)
```

| Luckans bredd W på skärmen | z | Förstoring s | Uppsvängd höjd vid H = W |
|---|---|---|---|
| 60 px (mobil) | 58 | 1,11 | 1,11 H |
| 120 px | 116 | 1,24 | 1,24 H |
| 200 px (stor skärm, som på bilden) | 193 | **1,47** | **1,47 H**, alltså ca 47 px utanför hålet upptill och nedtill |
| 300 px (4K / helskärm) | 290 | 1,94 | nästan dubbel höjd |
| ≥ 620 px | ≥ 600 | ∞ | luckan "exploderar" (passerar betraktaren) |

Med W ≈ 200 px sticker luckan ut ca 47 px ovanför och nedanför hålet. Glipan mellan raderna är bara 44 px, så två öppna luckor i samma kolumn **måste** korsa varandra. Det är precis vad bilden visar mellan lucka 6 och lucka 2. Effekten beror på skärmstorleken. På en mobil syns den knappt, och det förklarar varför den inte upptäckts tidigare.

### Verifiering

1. Öppna `http://localhost:5173/?config=/examples/demo.json&preview=1`, öppna lucka 6 och 2, och ändra fönstrets bredd från ca 600 px till helskärm. Hypotesen stämmer om överlappet bara syns i breda fönster och växer med bredden.
2. Ändra tillfälligt `perspective` på `.slot` till ett stort värde (t.ex. `2000px`) eller till `none` i DevTools. Överlappet mellan raderna ska då försvinna eller krympa tydligt.
3. Mät i DevTools (`getBoundingClientRect()` på `.leaf` i en öppen lucka) och jämför med `.slot`. Den uppmätta höjdkvoten ska stämma med `600 / (600 − 0,97·W)`.
4. Kontrollera att felet inte finns om man skalar perspektivet efter luckans storlek, t.ex. med ett värde som är proportionellt mot luckans bredd. (Det är bara ett test. Ingen fix ingår i det här steget.)

---

## Hypotes 2: Layouten och valideringen räknar inte med utrymmet som den uppsvängda luckan behöver

### Mekanism

Även utan perspektivförstoring hamnar den uppsvängda luckan utanför hålet. Den svänger `-105°`, alltså 15° förbi vinkelrätt. Därför hamnar den fria kanten `W · |cos(105°)| ≈ 0,26 W` till **vänster** om gångjärnet, rakt in i glipan mot grannen till vänster. Perspektivet (hypotes 1) ökar avståndet ytterligare.

`validateNoOverlap` kontrollerar bara att de **stängda** rektanglarna inte överlappar. Formatet kräver ingen minsta glipa, och demolayouten har glipor på 44–94 px i bildens koordinater. En lucka som svänger ut 0,26 W (≈ 52 px för W = 200, ca 120 px med perspektiv) når därför fram till grannluckan. På bilden syns det som att lucka 24:s och lucka 19:s uppsvängda luckor täcker glipan och når fram till bilden i lucka 6 och lucka 2.

Hypotes 2 förklarar det **vågräta** överlappet med grannen till höger. Hypotes 1 är den huvudsakliga förklaringen till det **lodräta** överlappet mellan raderna.

### Verifiering

1. Räkna ut, för varje par av grannar i `demo.json`, glipan till vänster om varje lucka och jämför den med `0,26 · W`. Hypotesen stämmer om de par som överlappar på skärmen är de där glipan är mindre än luckans svängutrymme.
2. Öppna en lucka och dess vänstra granne, t.ex. lucka 24 och 6, med perspektivet avstängt (se hypotes 1, punkt 2). Om luckorna fortfarande når in i grannens hål är orsaken geometrin och inte bara perspektivet.
3. Skapa en testkalender med samma luckor men med glipor på minst 0,3 W mellan kolumnerna och 0,5 H mellan raderna. Om överlappet försvinner där är layouten och valideringen en bidragande orsak.
4. Läs `validateNoOverlap` och bekräfta att den bara använder `x, y, width, height` och ingen marginal för svängen.

---

## Hypotes 3 (minst sannolik): Ordningen i djupled avgörs av DOM-ordningen och inte av 3D-geometrin

### Mekanism

Varje `.slot` har ett eget `perspective` och därmed ett eget 3D-sammanhang. Webbläsaren sorterar inte luckor från **olika** slots efter djup, så de kan inte korsa varandra korrekt i 3D. Alla öppna slots får samma `z-index: 1` (`.slotOpen`), och då målas de i DOM-ordning. `App` sorterar luckorna efter dag (`validateDoors` returnerar `sort((a, b) => a.day - b.day)`), så **den lucka som har senare datum hamnar alltid överst**, oavsett var den sitter. Lucka 24:s uppsvängda lucka ritas alltså över lucka 6:s hål och bild, och lucka 6 ritas över lucka 2. En stängd lucka behåller dessutom `z-index: 1` i 900 ms (`transition: z-index 0s 900ms`), så en lucka som håller på att stängas kan ligga ovanpå en granne som just öppnats.

Det här orsakar inte att luckorna når utanför hålet, men det avgör **hur** överlappet ser ut. Därför kan det se fel ut, t.ex. att en lucka som borde vara bakom ritas framför och skär genom grannens bild i stället för att försvinna bakom den.

### Verifiering

1. Öppna lucka 6 och 2 och kontrollera i DevTools vilken lucka som ligger överst i glipan. Byt sedan tillfälligt ordning på luckorna i DOM-trädet (t.ex. genom att sortera omvänt). Hypotesen stämmer om den andra luckan då hamnar överst.
2. Sätt tillfälligt `z-index: 2` på en av de öppna slotsen i DevTools och se om bilden ändras på samma sätt.
3. Öppna lucka A, stäng den, och öppna direkt grannen B (inom 900 ms). Kontrollera om A:s lucka som håller på att stängas ritas över B.
4. Flytta tillfälligt `perspective` från `.slot` till `.board` (ett gemensamt 3D-sammanhang) i DevTools och kontrollera om luckorna då korsar varandra i stället för att bara läggas ovanpå varandra.

---

## Sammanfattning

| # | Hypotes | Förklarar | Sannolikhet |
|---|---|---|---|
| 1 | Fast `perspective: 600px` förstorar luckan ~1,5× på stora skärmar | Lodrät överlapp mellan raderna, att det bara syns på stor skärm | Hög |
| 2 | Svängen på −105° plus små glipor, och valideringen kräver ingen marginal | Vågrät överlapp med grannen | Medel (bidragande) |
| 3 | Lika `z-index` och separata 3D-sammanhang, så DOM-ordningen avgör vad som ligger överst | Hur överlappet ser ut (vilken lucka som ligger överst) | Låg (förvärrar, orsakar inte) |

Rekommenderat första steg: verifiera hypotes 1 genom att ändra fönsterstorleken och `perspective` i DevTools. Det tar under en minut och skiljer tydligt mellan hypoteserna.
