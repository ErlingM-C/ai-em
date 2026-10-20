# Hemuppgift 2b.3 – Läsbarhet, namngivning och felhantering

Granskningen gäller koden på `main` efter commit `5823f90`. Den letar efter fyra saker: funktioner som gör mer än en sak, otydlig namngivning, saknad felhantering för externa anrop och kod som är svår att läsa utan kommentarer. Nedan listas de **fem allvarligaste problemen**, sorterade efter hur mycket de påverkar mottagarna av en kalender och den som underhåller koden. Ingen kod har ändrats.

| # | Problem | Kategori | Allvar | Var |
|---|---|---|---|---|
| 1 | En kastad exception ger en vit sida, och hämtningen kan hänga | Felhantering | Hög | [ImageModal.tsx:87](src/components/ImageModal.tsx#L87), [useCalendarConfig.ts:40](src/hooks/useCalendarConfig.ts#L40), [main.tsx](src/main.tsx) |
| 2 | Bilder som inte laddas ger inget felmeddelande | Felhantering | Hög | [Calendar.tsx:35](src/components/Calendar.tsx#L35), [Door.tsx:56](src/components/Door.tsx#L56), [Door.tsx:74](src/components/Door.tsx#L74) |
| 3 | `CalendarController` gör minst fem saker | Mer än en sak | Medel | [App.tsx:23-76](src/App.tsx#L23-L76) |
| 4 | Samma namn för olika saker, och namn som inte säger vad de är | Namngivning | Medel | [App.tsx:28](src/App.tsx#L28), [App.tsx:80](src/App.tsx#L80), [Calendar.tsx:2](src/components/Calendar.tsx#L2), [Door.tsx:17](src/components/Door.tsx#L17) |
| 5 | `validateConfig` har kontroller som ser onödiga ut men behövs | Kräver kommentarer | Medel | [validateConfig.ts:134](src/lib/validateConfig.ts#L134), [:148](src/lib/validateConfig.ts#L148), [:226-235](src/lib/validateConfig.ts#L226-L235) |

---

## 1. En kastad exception ger en vit sida, och hämtningen kan hänga

**Kategori:** saknad felhantering för externa anrop · **Allvar:** Hög

Appen har ingen error boundary, varken i [main.tsx](src/main.tsx) eller i [App.tsx](src/App.tsx), och ingen hanterar fel på global nivå. React 19 avmonterar hela trädet när ett fel kastas under rendering eller i en effekt, så användaren ser en **helt vit sida**. Det är precis det CLAUDE.md säger att appen inte får göra: *"ett begripligt felmeddelande, inte en trasig sida"*.

Konkreta ställen där ett anrop till webbläsaren kan kasta ett fel utan att det fångas:

- **[ImageModal.tsx:87](src/components/ImageModal.tsx#L87)**, `dialog.showModal()`, som finns först i Safari 15.4 (mars 2022). Äldre iPad och iPhone, som ofta används av till exempel far- och morföräldrar, alltså just dem som kalendern är till för, får ett `TypeError` i effekten när de öppnar en bild. Hela kalendern försvinner.
- **[ImageModal.tsx:92](src/components/ImageModal.tsx#L92), [:93](src/components/ImageModal.tsx#L93), [:110](src/components/ImageModal.tsx#L110) och [:115](src/components/ImageModal.tsx#L115)**, `element.animate(…)`. Bara animeringen av bakgrunden (`animateBackdrop`, rad 55–61) har `try/catch`. De andra fyra anropen har inget skydd.
- **[useCalendarConfig.ts:40](src/hooks/useCalendarConfig.ts#L40)**, `loadConfig(…).then(…)`. Anropet saknar `.catch`. `fetchJson` fångar sina egna fel, men om något annat i kedjan kastar ett fel, till exempel `validateConfig` vid en framtida ändring, blir löftet avvisat utan att någon hanterar det, och sidan visar *"Hämtar kalendern…"* för alltid.
- **[fetchJson.ts](src/io/fetchJson.ts)** har nu en gräns för storleken (V1), men fortfarande ingen tidsgräns (V2 i [hemuppgift2b.2.md](hemuppgift2b.2.md)). En server som aldrig svarar ger också en laddningssida som står kvar för alltid.

**Förslag:**
- En error boundary runt `App` som visar `StatusPage` med ett felmeddelande och en knapp för att ladda om.
- `showModal` med reserv, eller en kontroll av `typeof dialog.showModal === 'function'`.
- Samla alla `animate`-anrop i en hjälpfunktion med `try/catch`, som `animateBackdrop`.
- `.catch` i `useCalendarConfig` som sätter `{ status: 'error' }`.
- En tidsgräns med `AbortSignal.timeout` i `fetchJson`.

## 2. Bilder som inte laddas ger inget felmeddelande

**Kategori:** saknad felhantering för externa anrop · **Allvar:** Hög

Alla bilder ligger på externa servrar som den som gör kalendern väljer. Det är det **vanligaste felet i praktiken**: en privat länk till Google Foto, en token som har gått ut, en felstavad adress, skydd mot att bilder visas på andra sidor (hotlinking) eller en server som inte tillåter CORS. Ändå har bara bilden i modalen en `onError` ([ImageModal.tsx:161](src/components/ImageModal.tsx#L161)).

| Var | Bild | Vad som händer när den inte laddas |
|---|---|---|
| [Calendar.tsx:35](src/components/Calendar.tsx#L35) | Bakgrunden | En blå yta visas. Inget meddelande. |
| [Door.tsx:56](src/components/Door.tsx#L56) | Bakgrunden igen, som luckans framsida | Alla 24 luckor blir tomma rutor med bara siffror. |
| [Door.tsx:74](src/components/Door.tsx#L74) | Dagens bild i den öppna luckan | Webbläsarens ikon för en trasig bild, eller en tom ruta. |

Den som testar sin kalender med `&preview=1` får alltså ingen ledtråd om vilken adress som är fel. Det står i strid med princip 8 i CLAUDE.md, som nämner *"bild som inte laddas"* som exempel.

**Förslag:** `onError` på bakgrunden som visar ett meddelande med adressen över kalendern, och `onError` på bilden i luckan som visar en enkel ersättning med texten "Bilden kunde inte laddas". I förhandsgranskningsläget kan det vara värt att lista alla bilder som inte laddades.

## 3. `CalendarController` gör minst fem saker

**Kategori:** funktioner som gör mer än en sak · **Allvar:** Medel

[App.tsx:23-76](src/App.tsx#L23-L76) är en komponent på 54 rader som ansvarar för:

1. **att läsa miljön:** datum, förhandsläge och reducerad rörelse (rad 24, 25 och 29)
2. **öppnade luckor och lagring** (rad 26)
3. **luckvyer**, alltså vilka luckor som går att öppna och vilka som är öppna (rad 31–35)
4. **beslutet vid klick och meddelandet om låst lucka** (rad 27 och 37–47)
5. **den förstorade bilden:** vilken lucka den gäller och vilket element den växer fram ur (rad 28, 49 och 62–73)
6. **snöns intensitet**, som beror på om modalen är öppen (rad 53)

Följder:
- Logiken vid klick (rad 37–47) är den viktigaste regeln i appen: öppna, stänga eller visa meddelande om låst lucka. Ändå går den inte att testa, eftersom den ligger i en komponent.
- `isDoorOpenable` anropas på två ställen (rad 32 och 38) med samma argument.
- [App.tsx](src/App.tsx) innehåller två komponenter, så filnamnet säger inte var kalenderns logik finns.

**Förslag:**
- Flytta `CalendarController` till en egen fil.
- Låt en hook, `useCalendarEnvironment`, läsa miljön.
- Flytta beslutet vid klick till en ren funktion i `lib/`, till exempel `doorClickAction(day, isOpen, isOpenable): 'open' | 'close' | 'locked'`, med tester.
- Lägg modalens tillstånd i en egen hook.

## 4. Samma namn för olika saker, och namn som inte säger vad de är

**Kategori:** otydlig namngivning · **Allvar:** Medel

| Namn | Var | Problem | Förslag |
|---|---|---|---|
| `origin` | [App.tsx:28](src/App.tsx#L28), [:60](src/App.tsx#L60), [:69](src/App.tsx#L69) **och** [App.tsx:80](src/App.tsx#L80), [:84](src/App.tsx#L84) | **Två olika betydelser i samma fil.** I `CalendarController` är det *HTML-elementet som modalen växer fram ur*. I `App` är det *webbplatsens adress* (`https://…web.app`). | `zoomFrom` eller `sourceElement` för elementet, och `siteOrigin` för adressen. |
| `Door` | [config.ts](src/lib/config.ts) och [Door.tsx](src/components/Door.tsx) | Både typen för en lucka i JSON-filen och komponenten heter `Door`. Därför måste [Calendar.tsx:2](src/components/Calendar.tsx#L2) importera typen som `Door as DoorData`. | `DoorConfig` för typen. |
| `shown` och `shownDoor` | [App.tsx:28](src/App.tsx#L28) och [:49](src/App.tsx#L49) | Säger inte *vad* som visas. Det är luckan vars bild visas förstorad i modalen. | `enlarged` och `enlargedDoor`, eller `zoomedPhoto`. |
| `message` | [App.tsx:27](src/App.tsx#L27) | Låter allmänt, men innehåller bara meddelanden om låsta luckor. | `lockedMessage`. |
| `leaf`, `leafLabel` och `leafClass` | [Door.tsx:17](src/components/Door.tsx#L17) och [:43](src/components/Door.tsx#L43) | "Leaf" (dörrblad) används ingen annanstans i koden eller i CLAUDE.md, där det heter *lucka* eller *door*. Läsaren måste gissa att det är själva luckan som svänger upp. | `doorPanel` eller `hatch`, eller en kommentar som förklarar ordet. |
| `allowRelativeUrls` | [configSource.ts:2](src/lib/configSource.ts#L2), [useCalendarConfig.ts:23](src/hooks/useCalendarConfig.ts#L23), [validateConfig.ts:9](src/lib/validateConfig.ts#L9) | Beskriver *hur* det fungerar, inte *varför*. Flaggan betyder egentligen "detta är vår egen exempelkalender", och den skickas genom tre filer. | `isTrustedExample`, eller en typ för källan: `source: 'example' \| 'external'`. |
| `readToday` och `today` | [clock.ts:2](src/io/clock.ts#L2) och [isDoorOpenable.ts:5](src/lib/isDoorOpenable.ts#L5) | Returnerar *klockslaget just nu*, inte dagens datum, och jämförelsen i `isDoorOpenable` använder klockslaget. | `readNow` och `now`. |

## 5. `validateConfig` har kontroller som ser onödiga ut men behövs

**Kategori:** kod som är svår att läsa utan kommentarer · **Allvar:** Medel

[validateConfig.ts](src/lib/validateConfig.ts) är den viktigaste säkerhetskoden i appen, men flera rader ser ut att kunna strykas. De finns bara för att få TypeScript att snäva in typerna, och inget i koden förklarar det:

- **[Rad 134](src/lib/validateConfig.ts#L134) och [rad 220](src/lib/validateConfig.ts#L220):** `!Number.isInteger(day) || !isFiniteNumber(day)`. Ett heltal är alltid ändligt, så den andra kontrollen ser onödig ut. Den behövs eftersom `Number.isInteger` inte är en typvakt, och utan den är `day` fortfarande `unknown`.
- **[Rad 148](src/lib/validateConfig.ts#L148):** `!isNonEmptyString(alt) || !isNonEmptyString(text)` kontrolleras igen, trots att samma sak redan har kontrollerats på rad 142 och 145. Det sker av samma skäl.
- **[Rad 226-235](src/lib/validateConfig.ts#L226-L235):** det sista villkoret kontrollerar `version`, `title` och `year` en gång till, trots att `errors.length > 0` redan räcker för att avgöra resultatet. Den som "förenklar" villkoret får typfel, eller värre, tar bort fel kontroll.
- **[Rad 199-204](src/lib/validateConfig.ts#L199-L204):** `errorCountBefore` används för att ta reda på om `validateDaysComplete` och `validateNoOverlap` hittade något. Varje hjälpfunktion har två sätt att rapportera: den lägger till i `errors` och returnerar `undefined`. Den som lägger till ett fält måste komma ihåg båda.

Ett liknande fall finns i [isDoorOpenable.ts:9](src/lib/isDoorOpenable.ts#L9): `new Date(year, 11, day)`. `11` betyder december, eftersom JavaScript räknar månader från 0, men det står ingenstans.

**Förslag:**
- På kort sikt: en typvakt `isIntegerInRange(value, min, max): value is number`, som tar bort den dubbla kontrollen, en konstant `DECEMBER = 11` och en kommentar vid det sista villkoret.
- På lång sikt: låt varje fältvalidator returnera `{ ok: true, value } | { ok: false, errors }` i stället för att ändra `errors`. Då behövs inga dubbla kontroller för typernas skull. Det är en större omskrivning och ska stämmas av först.

---

## Även noterat (lägre allvar)

- **[ImageModal.tsx:97-121](src/components/ImageModal.tsx#L97-L121)**, `closeDialog`, gör fem saker: avbryter animeringar, krymper modalen, tonar ut innehållet och bakgrunden och stänger sedan. Det är en kort sekvens med tydlig ordning, men den kan delas upp i `cancelAnimations` och `animateClose`.
- **[Door.tsx:37-40](src/components/Door.tsx#L37-L40)** sätter state under rendering (`if (isOpen && !photoMounted) setPhotoMounted(true)`). Det är ett mönster som React godtar, men det är ovanligt, och kommentaren förklarar *varför* bilden ligger kvar, inte *att* mönstret är avsiktligt.
- **[snow.ts](src/lib/snow.ts)**, `advanceSnow`: `current` och `fillNow` är korta namn för något som kräver eftertanke. `startingFlakes` och `shouldFillArea` vore tydligare.
- **[fetchJson.ts](src/io/fetchJson.ts)** gör fyra saker: hämtar, kontrollerar statuskoden, läser med storleksgräns och tolkar JSON. Men det är en tydlig kedja med tidiga returer och ett felmeddelande per steg, så det går att godta.
