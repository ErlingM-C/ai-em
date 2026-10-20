# Hemuppgift 2 – Analys av kodbasen

Analysen gäller den digitala adventskalendern (React, TypeScript och Vite) och utgår från reglerna i [CLAUDE.md](CLAUDE.md). Uppgiften var att hitta delar med dålig läsbarhet, duplicerad logik och sådant som kan bli teknisk skuld. Det här är bara en analys och en plan. Ingen kod har ändrats.

Kodbasen är liten, cirka 1 900 rader, men tillräckligt stor för att analysera på riktigt. Överlag följer den CLAUDE.md väl: I/O ligger i `src/io/`, `lib/` är rent och testat, och ingen `any` eller `dangerouslySetInnerHTML` används. Det jag hittat gäller främst ett krav som saknas, några regler som finns på två ställen och ett par filer som börjar göra för mycket.

---

## 1. Avvikelse från CLAUDE.md (viktigast)

**Öppnade luckor sparas inte.** CLAUDE.md säger att webbläsaren ska komma ihåg öppnade luckor per kalender via `localStorage`. Men [useOpenedDoors.ts](src/hooks/useOpenedDoors.ts) har bara state i minnet, och någon `src/io/storage.ts` finns inte. Alla luckor stängs alltså när sidan laddas om. Det här är ett krav som saknas, inte en stilfråga. När det byggs behövs också en ren nyckel- och tolkningsfunktion i `lib/` (config-URL → nyckel, och tolkning av sparad data som `unknown`), annars hamnar ovaliderad data från `localStorage` direkt i state.

## 2. Duplicerad logik

| Var | Problem | Risk |
|---|---|---|
| [configSource.ts:7-21](src/lib/configSource.ts#L7-L21) och [validateConfig.ts:33-42](src/lib/validateConfig.ts#L33-L42) | Regeln för tillåtna adresser finns på två ställen, och de skiljer sig. `configSource` kräver `/examples/` och stoppar `..` och `//`. `isAllowedUrl` godtar alla sökvägar som börjar med `/` utom `//`, även `/../x` och `/\evil.example`, som webbläsare tolkar som `//evil.example`. Gäller bara exempelkalendern idag, så risken är låg. | Säkerhetsregler som glider isär är dyra att hitta senare. |
| [App.tsx:32](src/App.tsx#L32) och [App.tsx:39](src/App.tsx#L39) | `isDoorOpenable` anropas två gånger för samma lucka, först för vyn och sedan vid klick. | Låg, men två källor till samma sanning. |
| [App.tsx:43](src/App.tsx#L43), [Door.tsx:21](src/components/Door.tsx#L21), [ImageModal.tsx:166](src/components/ImageModal.tsx#L166) | Texter om datum ("X december") formuleras på tre ställen. Ett exempel: Door säger "låst till X december" utan år, medan App tar med året. | Texterna blir inkonsekventa när de ändras. |
| [Calendar.tsx:23-29](src/components/Calendar.tsx#L23-L29) och [ImageModal.tsx:45-53](src/components/ImageModal.tsx#L45-L53) | Samma uträkning på två ställen: få en yta med givna proportioner att rymmas i fönstret (`min(100%, calc(100dvh * ratio))`). | Ändras på ett ställe men inte det andra. |
| [flipTransform.ts:1](src/lib/flipTransform.ts#L1), [validateConfig.ts:19](src/lib/validateConfig.ts#L19), `DoorPosition` | Typen `Rect` finns två gånger, och `DoorPosition` har samma form men andra fältnamn. | Liten. |
| `Number.isInteger(x) \|\| !isFiniteNumber(x)` för `day` och `year` | Mönstret upprepas eftersom `Number.isInteger` inte snävar in typen. Ett `isIntegerInRange` vore tydligare. | Liten. |
| [StartPage.tsx:7](src/components/StartPage.tsx#L7) och `EXAMPLES_PREFIX` | Sökvägen `/examples/...` är hårdkodad på flera ställen. | Liten. |
| CSS | Fokusringen `#ffd54a`, typsnittet Georgia (3 gånger) och `#29457a` (2 gånger) upprepas i olika filer. Det finns inga CSS-variabler i [index.css](src/index.css). | Temaändringar kräver sökning och ersättning. |
| Sammansättning av klassnamn | Görs på tre olika sätt i [Door.tsx:42-45](src/components/Door.tsx#L42-L45) och [Snow.tsx:101](src/components/Snow.tsx#L101). | Liten, men ger ett spretigt intryck. |

## 3. Läsbarhet och ansvarsfördelning

- **`CalendarController` i [App.tsx:21-74](src/App.tsx#L21-L74)** gör många saker: datum, förhandsläge, reducerad rörelse, öppna luckor, meddelande om låst lucka, modalens tillstånd och snöns intensitet. Det bryter mot princip 7 ("och sedan…"). Den läser också I/O via `useState(readToday)` direkt i komponenten, medan `useCalendarConfig` läser sin parameter i en hook. Mönstret är alltså inkonsekvent.
- **[validateConfig.ts](src/lib/validateConfig.ts)** (238 rader) skickar runt en föränderlig `errors`-array som utparameter och returnerar `undefined`. Därför måste villkoren kontrolleras en gång till för typens skull ([rad 149](src/lib/validateConfig.ts#L149), [rad 227-236](src/lib/validateConfig.ts#L227-L236)). Det är lätt att lägga till ett fält och glömma ena halvan. Filen blandar också URL-regler, geometri (`rectsOverlap`) och formatvalidering. En subtil följd: om `background.image` är ogiltig blir `background` `undefined`, och då kontrolleras inte om luckorna ligger inom bilden.
- **[Snow.tsx](src/components/Snow.tsx)** är en komponent med en hel animationsloop: variabler som ändras inuti effekten, nullkontroller som görs två gånger och `resize` som tar parametrar som redan finns i closure. Den läser också `window.devicePixelRatio`, `performance.now` och `Math.random` utanför `io/`. Det är tekniskt sett I/O, även om CLAUDE.md inte nämner just de här. Snön körs dessutom i två separata `requestAnimationFrame`-loopar, en för sidan och en för modalen.
- **[ImageModal.tsx](src/components/ImageModal.tsx)** (177 rader) blandar animering, bildladdning, stängning och layout. Easing-kurvorna är hårdkodade som strängar inne i funktionerna, och `id="image-modal-title"` är hårdkodat i stället för att använda `useId`.
- **Magiska tal som hänger ihop:** `900ms` i [Door.module.css](src/components/Door.module.css) används både som övergångstid och som fördröjning för `z-index`, och de två måste matcha. Månaden `11` i [isDoorOpenable.ts:9](src/lib/isDoorOpenable.ts#L9) saknar namn.

## 4. Små buggar och teknisk skuld

- **Dubbla React-nycklar:** [ErrorPage.tsx:13](src/components/ErrorPage.tsx#L13) använder `key={error}`. Två luckor med samma `day` som båda saknar `alt` ger identiska meddelanden, och då får två element samma nyckel.
- **En DOM-nod i React-state:** `origin: HTMLElement` sparas i `shown` i App. Det fungerar, men blir skört om luckan monteras om medan modalen är öppen.
- **Ingen linter** (ESLint med `react-hooks`) finns i `package.json`. Beroendelistor i effekter kontrolleras alltså inte. Att lägga till en kräver godkännande, eftersom CLAUDE.md inte tillåter nya beroenden utan att fråga.
- **Formatversionering:** `version: 1` är en literaltyp och valideringen är en enda funktion. Det finns ingen plats där en version 2 naturligt kan läggas till senare. Det är inget problem idag, men värt att ha i tankarna.
- **Tester:** täckningen i `lib/` är god. Logiken i `useOpenedDoors` och logiken för klick och meddelanden i `CalendarController` är otestad eftersom den ligger i hooks och komponenter. Att flytta den till `lib/` gör den testbar utan nya beroenden.

---

## 5. Plan: förslag på ordning

1. **Bygg in `localStorage`-kravet:** `io/storage.ts`, en ren nyckel- och tolkningsfunktion i `lib/` med test, och en uppdaterad `useOpenedDoors`.
2. **Samla URL-reglerna** i en modul i `lib/` med en enda testsvit, och stäng hålet med `/\` och `..`.
3. **Dela upp `CalendarController`** i en egen fil och flytta beslutet om klick på lucka (öppna, stänga eller meddelande) till en ren funktion i `lib/`. Samla datumtexterna där.
4. **Strukturera om `validateConfig`** till fältvalidatorer som returnerar resultat i stället för att ändra `errors`. Det är en större omskrivning, så upplägget ska stämmas av innan arbetet börjar.
5. **Mindre städning:** CSS-variabler, `useId`, nycklar i ErrorPage, en delad `Rect`-typ och namngivna konstanter.
6. **Valfritt:** en ESLint-konfiguration, vilket kräver godkännande eftersom den lägger till beroenden.

Varje steg ska vara en liten, avgränsad ändring. Före varje steg körs `npm test` och `npm run build`, enligt CLAUDE.md.
