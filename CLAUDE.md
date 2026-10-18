# CLAUDE.md – Digital adventskalender

## Vad projektet gör

En digital adventskalender med 24 luckor där vem som helst kan göra sin egen kalender. Webbappen innehåller ingen egen bild eller text. Användaren skapar i stället en JSON-fil med länkar till sina bilder och tillhörande texter. Filen läggs upp någonstans, och användaren delar en länk till kalendern där JSON-filens adress finns med:

```
https://<kalenderns-adress>/?config=https://example.com/min-kalender.json
```

Mottagarna öppnar länken och får en lucka per dag, 1–24 december. Bakom varje lucka finns en bild, till exempel ett familjefoto, och en kort text.

**Problemet den löser:** Det är svårt att dela familjebilder på ett roligt och personligt sätt i juletid. Ett album skickas på en gång och glöms bort. Kalendern ger mottagarna något litet att se fram emot varje dag. Eftersom innehållet ligger i en egen JSON-fil kan vem som helst göra en kalender utan att programmera eller sätta upp en egen webbplats.

### Kärnfunktioner
- Läser in kalendern från den JSON-URL som anges i parametern `config`.
- Kontrollerar att JSON-filen följer formatet. Om den inte gör det visas ett begripligt felmeddelande, inte en trasig sida.
- Om `config` saknas visas en startsida som förklarar hur man gör en egen kalender, med en länk till en exempelkalender (`/examples/demo.json`).
- 24 luckor som ligger på en stor bakgrundsbild i 16:9- eller 16:10-format. JSON-filen anger varje luckas position och storlek.
- En lucka går bara att öppna från och med sitt datum. Lucka 5 öppnas alltså tidigast 5 december det år som anges i JSON-filen.
- När man öppnar en lucka visas bilden och texten i en större vy.
- Webbläsaren kommer ihåg vilka luckor som är öppnade, separat för varje kalender (nyckeln baseras på config-URL:en).
- Ett förhandsgranskningsläge (`&preview=1`) låser upp alla luckor, så att den som skapar en kalender kan testa den före december.

### JSON-formatet (version 1)

Typen finns i `src/lib/config.ts` och kontrolleras av `validateConfig` i `src/lib/validateConfig.ts`. Exempel: `public/examples/demo.json`.

- `version`: alltid `1`.
- `title`: text som inte är tom.
- `year`: heltal 2000–2100.
- `background`: `{ image, width, height }`. `image` är en `https://`-adress. `width` och `height` är bildens storlek i pixlar och måste vara i 16:9- eller 16:10-format (1 % tolerans).
- `doors`: exakt 24 luckor, en för varje dag 1–24. Varje lucka har:
  - `day`
  - `x`, `y`, `width` och `height` i pixlar i bakgrundsbilden. Luckan måste rymmas helt i bilden och får inte överlappa någon annan lucka.
  - `image` (`https://`)
  - `alt` och `text`, som inte får vara tomma.
- Fält som formatet inte känner till ignoreras.

## Teknikstack och motivering

| Val | Varför |
|-----|--------|
| **React** | Kalendern består av många likadana delar (luckor) med eget tillstånd (öppen/stängd), vilket passar komponenter bra. React escapar text automatiskt, vilket skyddar mot skadligt innehåll i JSON-filen. |
| **TypeScript (strict)** | JSON-formatet beskrivs som en typ, så att kompilatorn kontrollerar att koden använder det rätt. Fel upptäcks vid bygget i stället för hos mottagarna. Vite stöder TypeScript utan extra konfiguration. |
| **Vite** | Snabb utvecklingsserver och enkel produktionsbyggnad till statiska filer, med minimal konfiguration. |
| **Vitest** | Testramverk som är byggt för Vite och använder samma konfiguration. Används för logik och validering. |
| **CSS Modules** (inbyggt i Vite) | Stilar per komponent utan krockar mellan klassnamn och utan något extra bibliotek. |
| **Firebase Hosting** | Gratisnivån räcker gott, HTTPS och CDN ingår, och deploy sker med ett kommando. Det byggda resultatet är statiska filer, så ingen server behövs. Säkerhetsheaders sätts i `firebase.json`. |
| **Innehåll i en extern JSON-fil som anges i URL:en** | Vem som helst kan skapa en kalender utan att ändra koden eller ha ett konto. Webbappen lagrar ingen användardata. |
| **`localStorage`** för öppnade luckor | Ingen databas eller inloggning behövs. Tillståndet gäller bara den egna webbläsaren, vilket räcker här. |

## Driftsättning (Firebase Hosting)

- `npm run build` bygger appen till `dist/`. `firebase.json` pekar ut `dist/` som publiceringsmapp.
- `firebase.json` sätter säkerhetsheaders, bland annat en Content-Security-Policy. Den tillåter skript och stilmallar bara från den egna domänen (`'self'`), bilder från `https:` och `fetch` mot `https:`, eftersom config-filen kan ligga var som helst.
- Förhandsversion att dela för test: `npm run build && firebase hosting:channel:deploy <namn>`
- Produktion: `npm run build && firebase deploy --only hosting`. Det görs av människan, inte av agenten.

## Arkitekturprinciper

1. **All I/O sker i ett lager.** Endast `src/io/` hämtar JSON, läser URL-parametrar, `localStorage` och aktuellt datum. Hooks anropar io-funktionerna. Komponenter och `lib/` gör det aldrig.
2. **Logik och validering är rena och testbara.** Funktioner i `src/lib/`, som `isDoorOpenable(day: number, year: number, today: Date, previewMode: boolean): boolean` och `validateConfig(data: unknown)`, importerar inte React och har inga sidoeffekter.
3. **Strikt typning.** `strict` är påslaget i `tsconfig.json`. Använd inte `any`. Använd `unknown` för data utifrån och snäva in typen genom kontroller. Exporterade funktioner har uttryckliga parameter- och returtyper. Komponenters props har en egen typ (`type DoorProps = { … }`).
4. **Komponenter visar, hooks och `App` styr.** Komponenter i `components/` får data och callbacks via props och innehåller ingen affärslogik. Tillstånd ligger i `App` och i egna hooks.
5. **Externt innehåll är aldrig betrott.** Allt som kommer från JSON-filen valideras innan det används. Text renderas som vanlig JSX-text, aldrig med `dangerouslySetInnerHTML`. Bild-URL:er måste börja med `https://`, eftersom React inte stoppar farliga länkar i `src` och `href`.
6. **Inga globala variabler.** Inget föränderligt tillstånd på modulnivå. Tillstånd hanteras med React-state och skickas via props.
7. **Funktioner och komponenter gör en sak.** En funktion eller komponent som behöver kommentaren "och sedan…" ska delas upp.
8. **Tydliga felmeddelanden.** Om något går fel (nätverksfel, ogiltig JSON, bild som inte laddas) ska användaren få veta vad som hände och hur det kan åtgärdas.
9. **Tillgänglighet.** Luckor är `<button>`-element, bilder får `alt`-text från JSON-filen, modalen fångar fokus och kan stängas med Escape, och kalendern ska gå att använda med tangentbord.
10. **Mobilen först.** Layouten ska fungera på en telefon, eftersom många mottagare öppnar länken där.
11. **Tester för logiken.** Varje ny funktion i `src/lib/` får ett test bredvid sig (`*.test.ts`). Kör `npm test` och `npm run build` innan du säger att en ändring är klar. Bygget kör typkontrollen (`tsc`), så det måste gå igenom utan typfel.

## Saker agenten INTE ska göra

- **Lägg inte till externa beroenden** utan att fråga först. Det gäller bland annat state-bibliotek (Redux, Zustand), router, UI- och CSS-ramverk (Tailwind, MUI) och testbibliotek utöver Vitest. Projektet ska klara sig med React, Vite och Vitest.
- **Byt inte till Next.js eller ett annat ramverk** utan att fråga.
- **Kringgå inte typsystemet.** Använd inte `any`, `@ts-ignore`, `@ts-expect-error` eller `as` för att tysta fel. Lös typfelet i stället, eller fråga om det inte går.
- **Lägg inte till en backend, databas, uppladdning eller inloggning.** Projektet ska förbli en statisk sida som inte lagrar någon användardata. Det betyder att inga andra Firebase-tjänster än Hosting får användas (Firestore, Auth, Storage, Functions, Analytics) utan att fråga.
- **Använd aldrig `dangerouslySetInnerHTML`, `eval` eller liknande** med innehåll från JSON-filen.
- **Tillåt inte andra URL-scheman än `https://`** för bilder eller config, till exempel `javascript:` eller `http:`.
- **Ta inte bort eller kringgå datumspärren.** Använd förhandsgranskningsläget för att testa.
- **Lägg inte till spårning, analysverktyg eller cookies från tredje part.** Bilderna är ofta privata familjebilder.
- **Ändra inte JSON-formatet** utan att fråga. Befintliga kalendrar ska fortsätta fungera.
- **Läs inte `new Date()`, `localStorage`, `window.location` eller `fetch` utanför `src/io/`.**
- **Kör inte `firebase deploy` mot produktion.** Föreslå kommandot och låt människan köra det.
- **Ändra inte `firebase.json`, `.firebaserc`, `vite.config.ts` eller `tsconfig.json` utan att fråga,** framför allt inte säkerhetsheaders, Content-Security-Policy eller inställningen `strict`.
- **Lägg aldrig nycklar, tokens eller tjänstekonton i repot.** Checka inte in `dist/` eller `node_modules/`.
- **Gör inga stora omskrivningar** av fungerande kod utan att beskriva förslaget och fråga först.

## Arbetssätt

- Gör små, avgränsade ändringar och förklara kort vad som ändrats.
- Om ett krav är otydligt, fråga hellre än att gissa.
- Utveckla med `npm run dev` och öppna `http://localhost:5173/?config=/examples/demo.json&preview=1`. Relativa config-sökvägar till den egna webbplatsen tillåts bara för exempelkalendern.
- Testa produktionsbygget med samma headers som i drift: `npm run build && firebase emulators:start --only hosting`. Då upptäcks fel i Content-Security-Policy innan deploy.
