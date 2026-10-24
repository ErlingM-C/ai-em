# Hemuppgift 3A – steg 2: Var ska hypotes 1 undersökas?

**Hypotes 1:** `perspective: 600px` är ett fast avstånd i pixlar. Luckorna skalas däremot i procent av kalenderytan, och den växer med skärmen. När en lucka svänger ut förstoras den fria kanten med faktorn `600 / (600 − 0,97·W)`, där W är luckans bredd i pixlar på skärmen. På en stor skärm blir den uppsvängda luckan ca 1,5 gånger så hög som hålet och når in i grannluckan.

För att bekräfta hypotesen behöver man visa tre saker. Var och en motsvarar en del av koden nedan.

1. Perspektivavståndet är fast och följer inte med när luckan växer.
2. Luckans storlek i pixlar växer med skärmen.
3. Det finns ingen annan skalning som tar ut effekten. Inget annat begränsar heller hur långt luckan sticker ut.

---

## 1. Perspektivet och rotationen: `src/components/Door.module.css`

Här finns själva mekanismen. Det är den viktigaste filen.

| Var | Kod | Vad du ska leta efter |
|---|---|---|
| [Door.module.css:2-7](src/components/Door.module.css#L2-L7) `.slot` | `perspective: 600px;` | **Kärnan i hypotesen.** Värdet är i `px` och inte relativt luckans storlek. Kontrollera att det inte finns någon `perspective-origin`. Då gäller standardvärdet `50% 50%`, alltså luckans mitt, och förstoringen blir lika stor uppåt och nedåt. Det stämmer med skärmbilden, där luckan sticker ut både ovanför och nedanför hålet. |
| [Door.module.css:77-82](src/components/Door.module.css#L77-L82) `.leaf` | `transform-origin: left center;` `transform-style: preserve-3d;` | Gångjärnet sitter i vänsterkanten. Därför är det den högra (fria) kanten som kommer närmast betraktaren och förstoras mest. Det ger trapetsformen på bilden: gångjärnskanten är kort och den fria kanten lång. |
| [Door.module.css:89-91](src/components/Door.module.css#L89-L91) `.open` | `transform: rotateY(-105deg);` | Vinkeln avgör hur nära betraktaren kanten kommer: `z = W·sin(105°) ≈ 0,97·W`. Vid 90° vore z = W, så vinkeln påverkar förstoringen ganska lite. Notera också att 105° är mer än 90°, så kanten hamnar 0,26·W till vänster om gångjärnet. Det hör till hypotes 2. |
| [Door.module.css:84-86](src/components/Door.module.css#L84-L86) `.leaf:hover` | `transform: scale(1.04);` | Gäller bara stängda luckor (`:not(.open)`). Kontrollera att den inte påverkar öppna luckor. Den ska kunna avskrivas som orsak. |
| [Door.module.css:98-131](src/components/Door.module.css#L98-L131) `.front`, `.back` | `rotateY(180deg)`, `backface-visibility: hidden` | Baksidan är den beige kartongytan som syns på bilden. Den ärver luckans transform och har ingen egen skalning. Kontrollera att det stämmer. |

**Leta efter:** att `600px` är det enda perspektivvärdet i hela kedjan. Kontrollera också att det inte finns något `perspective()` inuti en `transform` och ingen media query som byter värdet på större skärmar. Ett grep efter `perspective|rotateY|transform-style` i `src/` hittar bara träffarna ovan. `index.css` och `index.html` har inga.

**Historik:** perspektivet kom in i commit `df37f43` ("Öppna och stäng luckor med 3D-animering"). Kör `git show df37f43 -- src/components/Door.module.css`. Se om värdet valdes för en viss skärmstorlek, t.ex. om utvecklingen gjordes i ett litet fönster eller på mobil.

---

## 2. Varför luckan blir stor i pixlar: storleken på kalendern och luckorna

Förstoringen beror på **W i pixlar**. Därför måste du följa hur W räknas fram.

| Fil / funktion | Vad den gör | Vad du ska leta efter |
|---|---|---|
| [Calendar.tsx:23-29](src/components/Calendar.tsx#L23-L29) `boardStyle(background)` | Sätter kalenderytans bredd till `min(100%, calc(100dvh * ratio))` och höjden med `aspectRatio`. | Ytan har **ingen övre gräns**. På en skärm som är 1920 px bred blir den ca 1920 px bred, och på en 4K-skärm ännu bredare. Allt som skalas med ytan följer med, utom perspektivet. |
| [doorPosition.ts:25-32](src/lib/doorPosition.ts#L25-L32) `doorPosition(door, background)` | Räknar om luckans `x, y, width, height` till procent av bakgrunden. | Bekräfta att luckan **bara** har procentmått. Då gäller W ≈ `door.width / background.width × ytans bredd`. För lucka 6 i demon blir det 200/1920 × 1920 ≈ 200 px på en full-HD-skärm. |
| [Door.tsx:25-32](src/components/Door.tsx#L25-L32) `toPercentStyle(position)` | Lägger procentmåtten på `.slot` som `left/top/width/height`. | Samma sak här: inga `px`, och ingen `max-width` eller `max-height`. `.slot` är elementet som har `perspective`. Dess storlek i pixlar är alltså W, medan perspektivet ligger kvar på 600 px. |
| [Door.tsx:51](src/components/Door.tsx#L51) `<div className={slotClass} style={toPercentStyle(position)}>` | Det element som bär både storleken och perspektivet. | Ett bra ställe att inspektera i DevTools. Där syns både `perspective: 600px` och storleken i pixlar. |

**Leta efter:** att förhållandet `W / 600px` inte är konstant. På mobil (W ≈ 40–60 px) är det ca 0,1 och förstoringen ca 1,1. Det märks inte. På stor skärm (W ≈ 200 px) är det ca 0,33 och förstoringen ca 1,47. Det är därför felet beror på skärmstorleken.

---

## 3. Det som avgör om överlappet syns

| Fil | Kod | Vad du ska leta efter |
|---|---|---|
| [Calendar.module.css:16-20](src/components/Calendar.module.css#L16-L20) `.board` | `position: relative; overflow: hidden;` | `overflow: hidden` klipper bara mot kalenderns ytterkant och inte mot hålet. En lucka som sticker ut är alltså fullt synlig över grannarna. Det kan vara därför luckor i kanterna ser bättre ut än luckor i mitten. |
| [Door.module.css:10-13](src/components/Door.module.css#L10-L13) `.slotOpen` | `z-index: 1;` | Kommentaren säger uttryckligen att en öppen lucka *"svänger ut över grannarna och ska synas ovanpå dem"*. Att luckan når utanför hålet var alltså avsiktligt, men det beräknades sannolikt för små luckor. Ordningen mellan två öppna luckor hör till hypotes 3. |
| [public/examples/demo.json](public/examples/demo.json) | Lucka 6: `y 394, h 200`; lucka 2: `y 638, h 200` | Glipan mellan raderna är 44 px i bildkoordinater. Jämför den med hur mycket luckan sticker ut uppåt och nedåt: `(s − 1)·H/2`, där s är förstoringsfaktorn. Med s = 1,47 blir det ca 47 px per kant. Två öppna luckor i samma kolumn måste därför mötas. |
| [validateConfig.ts:169-177](src/lib/validateConfig.ts#L169-L177) `validateNoOverlap` | Jämför bara stängda rektanglar. | Ingen åtgärd behövs för hypotes 1. Notera bara att valideringen inte kan fånga problemet, eftersom förstoringen beror på skärmen och inte på JSON-filen. |

---

## 4. Mätning i webbläsaren

1. `npm run dev` och öppna `http://localhost:5173/?config=/examples/demo.json&preview=1`.
2. Öppna lucka 6 och 2.
3. Kör i konsolen och jämför med formeln:
   ```js
   for (const leaf of document.querySelectorAll('[aria-label^="Stäng lucka"]')) {
     const slot = leaf.parentElement.getBoundingClientRect()
     const box = leaf.getBoundingClientRect()
     const W = slot.width
     console.log(leaf.ariaLabel, {
       W: W.toFixed(0),
       uppmätt: (box.height / slot.height).toFixed(2),
       förväntat: (600 / (600 - 0.97 * W)).toFixed(2),
     })
   }
   ```
   Hypotesen stöds om `uppmätt` ≈ `förväntat` och båda växer när fönstret görs bredare.
4. Ändra `perspective` på `.slot` i DevTools till `2000px`, och sedan till ett värde som följer luckans storlek, t.ex. `calc(…)` eller lika med ca 3·W i px. Om förstoringen och överlappet försvinner är hypotesen bekräftad. Det är bara ett experiment i DevTools. Koden ändras inte i det här steget.
5. Kontroll åt andra hållet: gör fönstret smalt (mobilbredd) och upprepa. Kvoten ska då vara nära 1,1 och luckorna ska inte nå varandra.

---

## Sammanfattning: vad som bekräftar och vad som motbevisar

| Bekräftar hypotes 1 | Motbevisar hypotes 1 |
|---|---|
| `perspective` är det enda djupvärdet och är i `px` | Det finns en media query eller ett relativt perspektiv som redan skalar med luckan |
| Den uppmätta höjdkvoten följer `600 / (600 − 0,97·W)` | Kvoten är konstant oavsett fönsterbredd |
| Överlappet växer med fönsterbredden och försvinner på mobil | Överlappet syns lika mycket på mobil |
| Överlappet försvinner med ett stort eller relativt `perspective` | Överlappet finns kvar även med `perspective: none` (då är det i stället hypotes 2 eller 3) |
