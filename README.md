# Digital adventskalender

En adventskalender på webben med 24 luckor. Bakom varje lucka finns en bild, till exempel ett familjefoto, och en kort text. Luckorna ligger utplacerade på en stor bakgrundsbild. En lucka går att öppna först på sitt datum i december.

Webbappen innehåller inga egna bilder eller texter. Den som gör en kalender skriver en JSON-fil med länkar till sina bilder, lägger upp filen på en webbadress och delar en länk till kalendern:

```
https://<kalenderns-adress>/?config=https://example.com/min-kalender.json
```

Webbappen sparar ingen användardata. Vilka luckor som har öppnats kommer bara den egna webbläsaren ihåg.

## Göra en egen kalender

JSON-filen ser ut så här. Exemplet visar bara en lucka, men en kalender ska ha alla 24.

```json
{
  "version": 1,
  "title": "Familjens adventskalender",
  "year": 2026,
  "background": {
    "image": "https://example.com/bilder/bakgrund.jpg",
    "width": 1920,
    "height": 1080
  },
  "doors": [
    {
      "day": 1,
      "x": 120,
      "y": 340,
      "width": 250,
      "height": 250,
      "image": "https://example.com/bilder/dag01.jpg",
      "alt": "Farmor och barnbarnen bakar pepparkakor",
      "text": "Första advent hos farmor!"
    }
  ]
}
```

| Fält | Regel |
|------|-------|
| `version` | Alltid `1`. |
| `title` | Kalenderns rubrik. Får inte vara tom. |
| `year` | Året som kalendern gäller. Lucka 5 går att öppna från och med 5 december det året. |
| `background.image` | Bakgrundsbilden. Adressen måste börja med `https://`. |
| `background.width`, `background.height` | Bakgrundsbildens storlek i pixlar. Bilden måste vara i 16:9- eller 16:10-format, till exempel 1920×1080 eller 1920×1200. |
| `doors` | Exakt 24 luckor, en för varje dag 1–24. |
| `day` | Dagen i december, 1–24. |
| `x`, `y` | Luckans övre vänstra hörn i bakgrundsbilden, i pixlar. |
| `width`, `height` | Luckans storlek i pixlar. Luckan måste rymmas i bilden och får inte överlappa någon annan lucka. |
| `image` | Bilden bakom luckan. Adressen måste börja med `https://`. |
| `alt` | En kort beskrivning av bilden, för den som inte kan se den. Får inte vara tom. |
| `text` | Texten som visas tillsammans med bilden. Får inte vara tom. |

Tips:

- Koordinaterna för luckorna går att läsa av i vilket bildprogram som helst, även Paint.
- Gör luckorna minst cirka 1/12 av bildens bredd, alltså cirka 160 px i en bild som är 1920 px bred. Annars blir de svåra att träffa i mobilen.
- Servern där JSON-filen ligger måste tillåta att filen hämtas från andra webbplatser (CORS). Annars visar kalendern ett felmeddelande om att filen inte gick att hämta.
- Lägg till `&preview=1` i länken för att låsa upp alla luckor och testa kalendern före december.

Om något i filen är fel visar kalendern en lista med det som behöver rättas. Ett fullständigt exempel finns i [public/examples/demo.json](public/examples/demo.json).

## Utveckling

Det här behövs:

- [Node.js](https://nodejs.org/) 22 eller senare
- [Firebase CLI](https://firebase.google.com/docs/cli), bara för att testa med samma headers som i drift och för att publicera: `npm install -g firebase-tools`

Installera beroenden:

```sh
npm install
```

### Testa lokalt

**1. Utvecklingsserver.** Sidan laddas om automatiskt när koden ändras:

```sh
npm run dev
```

Öppna sedan någon av de här adresserna:

| Adress | Det här ska visas |
|--------|-------------------|
| http://localhost:5173/?config=/examples/demo.json&preview=1 | Exempelkalendern med alla luckor upplåsta |
| http://localhost:5173/?config=/examples/demo.json | Exempelkalendern med datumspärren påslagen |
| http://localhost:5173/ | Startsidan med instruktioner |
| http://localhost:5173/?config=http://example.com/x.json | Felsidan: adressen måste börja med `https://` |

Bara exempelkalendrar under `/examples/` får ligga på samma webbplats och använda relativa sökvägar. Alla andra kalenderfiler och bilder måste ha adresser som börjar med `https://`.

**2. Automatiska tester.** Testerna gäller logiken i `src/lib/`, bland annat valideringen av JSON-filen, datumspärren och att exempelkalendern följer formatet:

```sh
npm test            # kör alla tester en gång
npm run test:watch  # kör om testerna när koden ändras
```

**3. Produktionsbygget med samma headers som i drift.** Firebase-emulatorn använder säkerhetsheaders och Content-Security-Policy från `firebase.json`. Så upptäcks fel i policyn innan sidan publiceras:

```sh
npm run build
firebase emulators:start --only hosting
```

Öppna http://localhost:5000/?config=/examples/demo.json&preview=1 och kontrollera att webbläsarens konsol (F12) inte visar några fel om Content-Security-Policy.

Innan en ändring räknas som klar ska `npm test` och `npm run build` gå igenom. Bygget kör också typkontrollen.

## Publicera

Sidan körs på Firebase Hosting i projektet `ai-em-62129`.

Så här publicerar du en förhandsversion med en egen adress, för att dela och testa:

```sh
npm run build
firebase hosting:channel:deploy <namn>
```

Så här publicerar du till produktion:

```sh
npm run build
firebase deploy --only hosting
```

## Projektstruktur

| Mapp | Innehåll |
|------|----------|
| `src/io/` | All kontakt med omvärlden: hämtning av JSON-filen, URL-parametrar, datum och systeminställningar |
| `src/lib/` | Ren logik med tester, till exempel validering, datumspärr och placering av luckor |
| `src/hooks/` | Hooks som binder ihop io-lagret och logiken |
| `src/components/` | Komponenter som bara visar det de får via props |
| `public/examples/` | Exempelkalendern och dess bilder |

Arkitekturprinciper och regler för utvecklingen finns i [CLAUDE.md](CLAUDE.md).

## Teknik

React, TypeScript, Vite, Vitest och CSS Modules. Sidan publiceras som statiska filer på Firebase Hosting.

Fotot i lucka 24 i exempelkalendern är ["Under the Christmas tree."](https://commons.wikimedia.org/wiki/File:Under_the_Christmas_tree._(15867338637).jpg) av Bernard Spragg, med licensen [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/deed.en).
