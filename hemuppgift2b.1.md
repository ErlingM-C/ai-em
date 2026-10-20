# Hemuppgift 2b.1 – Granskning mot arkitekturprinciperna

Granskningen jämför kodbasen med de elva arkitekturprinciperna i [CLAUDE.md](CLAUDE.md). Den gäller koden på `main` efter commit `7e83c07`, alltså med `localStorage` för öppnade luckor och ESLint på plats. Ingen kod har ändrats under granskningen.

**Bedömning:** ✅ följs · 🟡 följs delvis · ❌ avviker

## Sammanfattning

| # | Princip | Bedömning | Viktigast |
|---|---|---|---|
| 1 | All I/O i ett lager | 🟡 | Komponenten `CalendarController` och `App` anropar io-funktioner direkt i stället för via hooks. |
| 2 | Ren, testbar logik | ✅ | Hela `lib/` saknar React-importer och sidoeffekter. |
| 3 | Strikt typning | 🟡 | Inga `any` eller `as`, men komponenterna saknar uttryckliga returtyper. |
| 4 | Komponenter visar, hooks och App styr | 🟡 | `Snow` innehåller en hel simuleringsloop. |
| 5 | Externt innehåll är aldrig betrott | ✅ | Allt valideras, men reglerna för relativa adresser finns på två ställen och skiljer sig. |
| 6 | Inga globala variabler | ✅ | Bara konstanter på modulnivå. Två av dem går tekniskt att ändra. |
| 7 | En sak per funktion | 🟡 | `CalendarController`, `Snow`s `frame`, `closeDialog` och `validateDoors` gör flera saker. |
| 8 | Tydliga felmeddelanden | 🟡 | Om bakgrunden eller en luckbild inte laddas visas inget fel, och laddningen har ingen tidsgräns. |
| 9 | Tillgänglighet | ✅ | Knappar, alt-texter, `<dialog>` och Escape fungerar. |
| 10 | Mobilen först | 🟡 | I stående läge blir luckorna 35–44 px, alltså under 44 px som rekommenderas för tryckytor. |
| 11 | Tester för logiken | ✅ | Varje funktion i `lib/` har tester, men logiken i hooks och `App` är otestad. |

Ingen princip bryts helt. De största avvikelserna gäller princip 1, 7 och 8.

---

## 1. All I/O sker i ett lager 🟡

**Följs:**
- `src/io/` innehåller `clock`, `fetchJson`, `location`, `motion` och `storage`, och ESLint stoppar nu `fetch`, `localStorage`, `location`, `new Date()` och `Date.now` utanför mappen.
- Hookarna [useCalendarConfig.ts](src/hooks/useCalendarConfig.ts) och [useOpenedDoors.ts](src/hooks/useOpenedDoors.ts) anropar io-funktionerna, precis som principen säger.

**Avviker:**
- Principen säger att *komponenter aldrig* anropar io, men [App.tsx:24-29](src/App.tsx#L24-L29) gör det i komponenten `CalendarController`, via `useState(readToday)`, `useState(readPreviewParam)` och `useState(readPrefersReducedMotion)`. [App.tsx:80](src/App.tsx#L80) gör samma sak med `readOrigin`. Princip 4 säger visserligen att `App` styr, men mönstret skiljer sig från `useCalendarConfig`, som läser sin parameter inne i hooken.
- [Snow.tsx](src/components/Snow.tsx) läser `window.devicePixelRatio`, `performance.now()` och `Math.random`. CLAUDE.md nämner inte just dessa, men de läser av miljön och gör koden svårare att testa. Det är en gråzon, inte ett direkt brott.

**Förslag:** samla `readToday`, `readPreviewParam` och `readPrefersReducedMotion` i en hook, till exempel `useCalendarEnvironment()`. Bestäm om `devicePixelRatio` och tidskällan för animeringar räknas som I/O, och skriv in beslutet i CLAUDE.md.

## 2. Logik och validering är rena och testbara ✅

- Inga filer i `src/lib/` importerar React eller anropar I/O.
- [snow.ts](src/lib/snow.ts) tar slumpkällan som parameter (`random: () => number`), så den går att testa deterministiskt. Ett bra mönster.
- [isDoorOpenable.ts](src/lib/isDoorOpenable.ts) har exakt den signatur som CLAUDE.md anger.

**Anmärkning:** hjälpfunktionerna i [validateConfig.ts](src/lib/validateConfig.ts) ändrar arrayen `errors` som de får som argument. Det syns inte utanför `validateConfig`, så funktionen är ren utåt, men inuti blir koden svårare att följa (se princip 7).

## 3. Strikt typning 🟡

**Följs:**
- `strict: true` är påslaget och det finns inga `any`, `as`, `@ts-ignore` eller `@ts-expect-error`. ESLint stoppar nu också `any` och `as`.
- Data utifrån behandlas som `unknown` och snävas in med typvakter (`isRecord`, `isFiniteNumber`, `isDay`).
- Alla komponenter med props har en egen props-typ, som `CalendarProps`, `DoorProps` och `ImageModalProps`.
- Alla exporterade funktioner i `lib/`, `io/` och `hooks/` har uttryckliga parameter- och returtyper.

**Avviker:**
- De exporterade komponenterna saknar returtyp, till exempel [Calendar.tsx:31](src/components/Calendar.tsx#L31), [Door.tsx:33](src/components/Door.tsx#L33), [ImageModal.tsx:68](src/components/ImageModal.tsx#L68) och [App.tsx:78](src/App.tsx#L78). Principen säger att *exporterade funktioner* har uttryckliga returtyper, och en default-exporterad komponent är en exporterad funktion.

**Förslag:** lägg till `: ReactNode` som returtyp, eller skriv i CLAUDE.md att komponenter är undantagna. Regeln kan kontrolleras automatiskt med `@typescript-eslint/explicit-module-boundary-types`.

## 4. Komponenter visar, hooks och App styr 🟡

**Följs:**
- [Calendar.tsx](src/components/Calendar.tsx), [ErrorPage.tsx](src/components/ErrorPage.tsx), [StartPage.tsx](src/components/StartPage.tsx) och [StatusPage.tsx](src/components/StatusPage.tsx) får allt via props och visar bara.
- Datumspärren, tillståndet för öppna luckor och modalens tillstånd ligger i `App` och i hooks.
- Tillståndet i [Door.tsx](src/components/Door.tsx) (`photoMounted`) och i [ImageModal.tsx](src/components/ImageModal.tsx) (`imageFailed`, `aspectRatio`) gäller bara visningen. Det är rimligt.

**Avviker:**
- [Snow.tsx](src/components/Snow.tsx) är visuellt sett en komponent, men innehåller en animationsloop med tillstånd som ändras (`flakes`, `filled`, `spawnBudget`, `previous`), plus storleksanpassning, beräkning av hur många flingor som ska skapas och ritning. Beräkningarna ligger i `lib/snow.ts`, men styrningen av dem ligger i komponenten.

**Förslag:** flytta loopen till en hook, `useSnowCanvas(canvasRef, intensity)`, och låt `Snow` bara rendera en `<canvas>`.

## 5. Externt innehåll är aldrig betrott ✅

**Följs:**
- [validateConfig.ts](src/lib/validateConfig.ts) validerar alla fält, och okända fält ignoreras.
- Texten renderas som JSX-text. Det finns ingen `dangerouslySetInnerHTML`, och ESLint stoppar den nu.
- Bildadresser måste vara `https://`, och [configSource.ts](src/lib/configSource.ts) godtar bara `https:` eller `/examples/`.
- [fetchJson.ts](src/io/fetchJson.ts) skickar inga cookies eller referrer (`credentials: 'omit'`, `referrerPolicy: 'no-referrer'`).
- Data från `localStorage` behandlas också som inte betrodd, i [openedDoorsStorage.ts](src/lib/openedDoorsStorage.ts).

**Anmärkning:**
- Regeln för relativa adresser finns på två ställen och de skiljer sig. `isExamplePath` stoppar `..` och `//`, men [isAllowedUrl](src/lib/validateConfig.ts#L32-L41) godtar alla sökvägar som börjar med `/`, även `/../x` och `/\evil.example`, som webbläsare tolkar som `//evil.example`. Det påverkar bara bilder i exempelkalendern, som vi själva styr, så risken är låg. Men en säkerhetsregel ska bara finnas på ett ställe.

## 6. Inga globala variabler ✅

- Allt på modulnivå är konstanter: `OPEN_MS`, `CLOSE_MS`, `DENSITY`, `DEMO_LINK`, `KEY_PREFIX`, `ASPECT_RATIOS` med flera.
- `let` används bara inne i funktioner och effekter.

**Anmärkning:** `DENSITY` ([snow.ts:16](src/lib/snow.ts#L16)) och `ASPECT_RATIOS` ([validateConfig.ts:15](src/lib/validateConfig.ts#L15)) är ett objekt och en array, så de går tekniskt att ändra även om ingen gör det. `Readonly<…>`, `readonly number[]` eller `as const` gör avsikten tydlig.

## 7. Funktioner och komponenter gör en sak 🟡

Följande behöver "och sedan…" för att beskrivas:

| Var | Gör |
|---|---|
| `CalendarController`, [App.tsx:23-76](src/App.tsx#L23-L76) | läser miljön, och sedan räknar ut luckvyer, och sedan hanterar klick och meddelanden, och sedan modalens tillstånd, och sedan snöns intensitet |
| `frame`, [Snow.tsx:68-96](src/components/Snow.tsx#L68-L96) | ändrar storlek, och sedan fyller ytan, och sedan flyttar flingor, och sedan skapar nya, och sedan ritar |
| `closeDialog`, [ImageModal.tsx:97-121](src/components/ImageModal.tsx#L97-L121) | avbryter animeringar, och sedan krymper modalen, och sedan tonar ut innehållet, och sedan bakgrunden, och sedan stänger |
| `validateDoors`, [validateConfig.ts:179-206](src/lib/validateConfig.ts#L179-L206) | validerar varje lucka, och sedan att alla dagar finns, och sedan att inga luckor överlappar, och sedan sorterar |

Exemplen väger olika tungt. `validateDoors` och `closeDialog` är egentligen korta sekvenser av anrop till funktioner som var och en gör en sak, och det kan godtas. `CalendarController` är det tydligaste brottet. Dessutom finns två komponenter i [App.tsx](src/App.tsx).

**Förslag:** flytta `CalendarController` till en egen fil, och flytta beslutet om klick på lucka (öppna, stänga eller meddelande) till en ren funktion i `lib/` (steg 3 i [hemuppgift2.md](hemuppgift2.md)).

## 8. Tydliga felmeddelanden 🟡

**Följs:**
- Felmeddelanden för nätverksfel (inklusive CORS), HTTP-felkoder, ogiltig JSON och alla valideringsfel. De säger vad som är fel och hur det kan åtgärdas.
- Om bilden i modalen inte laddas visas ett meddelande med adressen.
- Om `localStorage` inte går att använda fortsätter kalendern att fungera, och det är dokumenterat i [storage.ts](src/io/storage.ts).

**Avviker:**
- **Bakgrundsbilden** ([Calendar.tsx:35](src/components/Calendar.tsx#L35)) har ingen `onError`. Om den inte laddas syns bara en blå yta, och luckornas framsidor blir tomma, eftersom de visar delar av samma bild. Användaren får inget meddelande.
- **Bilden i luckan** ([Door.tsx:74](src/components/Door.tsx#L74)) har ingen `onError`, så webbläsaren visar sin ikon för en trasig bild.
- **Laddningen har ingen tidsgräns:** om servern aldrig svarar står "Hämtar kalendern…" kvar för alltid ([useCalendarConfig.ts](src/hooks/useCalendarConfig.ts)).
- **Dubbla nycklar:** [ErrorPage.tsx:13](src/components/ErrorPage.tsx#L13) använder `key={error}`. Två identiska felmeddelanden ger samma React-nyckel, vilket kan få listan att visa fel.

## 9. Tillgänglighet ✅

- Luckorna är `<button>` med `aria-label` som anger dag och om luckan är låst eller öppen.
- Den förstorade bilden har `alt` från JSON-filen, och knappen för att förstora den har en `aria-label` som innehåller alt-texten.
- [ImageModal.tsx](src/components/ImageModal.tsx) bygger på `<dialog>` med `showModal()`, som fångar fokus, stängs med Escape och lämnar tillbaka fokus. Modalen har en rubrik via `aria-labelledby`.
- Meddelanden om låsta luckor ligger i `role="status"`, så skärmläsare läser upp dem.
- Det finns synliga fokusringar (`:focus-visible`), `prefers-reduced-motion` respekteras och sidan har `lang="sv"`.

**Anmärkningar:**
- `id="image-modal-title"` är hårdkodat. Det fungerar så länge bara en modal visas, men `useId` vore säkrare.
- Kontrasten för luckornas siffror beror på användarens bakgrundsbild och går inte att garantera. Skuggan på texten hjälper.

## 10. Mobilen först 🟡

- Kalendern skalas för att rymmas i fönstret, och det finns en uppmaning att vända telefonen i stående läge.
- Krysset i modalen är 44 px, och modalen fyller skärmen.

**Avviker:**
- Med exempelkalendern (1920×1200) på en telefon i stående läge som är 390 px bred blir luckorna **35–44 px**, alltså under 44 px, som brukar rekommenderas som minsta tryckyta. I liggande läge (844 px) blir de 75–95 px.
- CSS:en är skriven för större skärmar först. Den enda mediafrågan använder `max-width` för att lägga till något på små skärmar, alltså motsatsen till mobilen först. Det spelar liten roll i praktiken, men stämmer inte med principen.

Det här följer delvis av att formatet bygger på en bakgrund i 16:9 eller 16:10. En lösning, som att visa luckorna i ett rutnät i stående läge, skulle vara en designändring och bör diskuteras först.

## 11. Tester för logiken ✅

- Varje fil med funktioner i `lib/` har en testfil bredvid sig: `configSource`, `doorPosition`, `flipTransform`, `isDoorOpenable`, `openedDoorsStorage`, `snow` och `validateConfig`. `config.ts` innehåller bara typer och en konstant.
- [demoConfig.test.ts](src/lib/demoConfig.test.ts) kontrollerar att exempelkalendern följer formatet. Det är ett bra skydd när formatet ändras.
- `npm test` (97 tester), `npm run build` och `npm run lint` går igenom.

**Anmärkning:** principen gäller bara `lib/`, men det finns viktig logik utanför: beslutet vid klick på lucka i `CalendarController`, och samspelet mellan `useOpenedDoors` och lagringen. Den är otestad eftersom den ligger i komponenter och hooks. Att flytta den till `lib/` (princip 7) gör den testbar utan nya testbibliotek.

---

## Förslag i prioritetsordning

1. **Princip 8:** felmeddelande när bakgrunden eller en luckbild inte laddas, en tidsgräns för laddningen och unika nycklar i `ErrorPage`.
2. **Princip 1 och 7:** dela upp `CalendarController`, låt en hook läsa miljön och flytta beslutet vid klick till `lib/` med tester.
3. **Princip 5:** samla adressreglerna i en modul.
4. **Princip 4:** flytta snöloopen till en hook.
5. **Princip 3 och 6:** returtyper på komponenter (eller ett undantag i CLAUDE.md) och `readonly` på konstanterna.
6. **Princip 10:** diskutera hur luckorna ska fungera i stående läge på telefon. Det är en designfråga, inte bara kod.
