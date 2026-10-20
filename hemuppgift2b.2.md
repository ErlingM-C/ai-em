# Hemuppgift 2b.2 – Säkerhetsgranskning

Granskningen gäller koden på `main` efter commit `22ad1bc`. Den letar efter fem saker: hårdkodade hemligheter, saknad inputvalidering, injection-risker (SQL, kommando, path traversal), känsliga data i loggar och osäkra standardvärden. Ingen kod har ändrats. Fynden är beskrivna, inte åtgärdade.

**Allvarlighetsgrad:** **Hög** betyder att den kan utnyttjas med verklig skada. **Medel** betyder en verklig risk som kräver särskilda omständigheter eller som gäller förväntningar på integritet. **Låg** betyder en brist i ett skydd utan praktisk skada idag. **Info** betyder något värt att känna till, eller ett medvetet val i designen.

## Sammanfattning

Inga fynd har hög allvarlighetsgrad. Appen är en statisk sida utan backend, databas eller inloggning, så SQL- och kommandoinjektion är inte möjliga. Det finns inga hemligheter i koden eller i git-historiken, och ingen loggning. De viktigaste fynden:

1. **Datumspärren skyddar inte innehållet (Medel).** Alla bilder och texter går att se direkt, men det framgår ingenstans.
2. **Två sökvägskontroller går att kringgå (Låg).** Det är bekräftat med samma adresstolkning som webbläsare använder (WHATWG URL), men saknar praktisk effekt idag.
3. **Adresser som kan innehålla åtkomsttokens sparas och visas (Låg).**

| ID | Kategori | Allvar | Fil och rad | Kort |
|---|---|---|---|---|
| D1 | Osäkert standardvärde | Medel | [location.ts:8](src/io/location.ts#L8), [clock.ts:3](src/io/clock.ts#L3) | Datumspärren är ingen sekretess. |
| P1 | Path traversal | Låg | [configSource.ts:8](src/lib/configSource.ts#L8) | `%2e%2e` tar sig förbi kontrollen av `..`. |
| P2 | Path traversal | Låg | [validateConfig.ts:33](src/lib/validateConfig.ts#L33) | `/\host` och `/../` godtas som relativa sökvägar. |
| K1 | Känsliga data | Låg | [openedDoorsStorage.ts:10](src/lib/openedDoorsStorage.ts#L10), [storage.ts:13](src/io/storage.ts#L13) | Hela config-URL:en sparas som nyckel i `localStorage`. |
| K2 | Känsliga data | Låg | [fetchJson.ts:8](src/io/fetchJson.ts#L8), [fetchJson.ts:22](src/io/fetchJson.ts#L22), [ImageModal.tsx:153](src/components/ImageModal.tsx#L153), [configSource.ts:28](src/lib/configSource.ts#L28), [validateConfig.ts:67](src/lib/validateConfig.ts#L67) | Hela adresser, med eventuella tokens, visas i felmeddelanden. |
| V1 | Inputvalidering | Låg | [fetchJson.ts:15](src/io/fetchJson.ts#L15) | Ingen gräns för filens storlek. |
| V2 | Inputvalidering | Låg | [fetchJson.ts:14](src/io/fetchJson.ts#L14) | Ingen tidsgräns för hämtningen. |
| V3 | Inputvalidering | Låg | [validateConfig.ts:142](src/lib/validateConfig.ts#L142), [:145](src/lib/validateConfig.ts#L145), [:217](src/lib/validateConfig.ts#L217) | Ingen maxlängd för `title`, `alt` och `text`. |
| V4 | Inputvalidering | Låg | [Calendar.tsx:36](src/components/Calendar.tsx#L36), [ImageModal.tsx:168](src/components/ImageModal.tsx#L168), [configSource.ts:28](src/lib/configSource.ts#L28) | Vem som helst kan visa valfri text på vår domän. |
| D2 | Osäkert standardvärde | Låg | [.gitignore:13](.gitignore#L13) | `.env` och tjänstekontofiler ignoreras inte. |
| V5 | Inputvalidering | Info | [configSource.ts:20](src/lib/configSource.ts#L20), [fetchJson.ts:14](src/io/fetchJson.ts#L14) | Mottagarens webbläsare hämtar valfri https-adress. |
| V6 | Inputvalidering | Info | [validateConfig.ts:84](src/lib/validateConfig.ts#L84), [:109](src/lib/validateConfig.ts#L109) | Ingen övre gräns för storlekar och koordinater. |
| D3 | Osäkert standardvärde | Info | [firebase.json:11](firebase.json#L11) | `img-src` och `connect-src` tillåter alla `https:`-adresser. |

---

## 1. Hårdkodade hemligheter eller uppgifter

**Inga fynd.**

- Jag sökte efter `api_key`, `secret`, `token`, `password`, `private key`, `bearer`, `BEGIN … KEY` och Googles nyckelformat `AIza…`, både i arbetskopian och i hela git-historiken (`git log -p --all`). Det enda som hittades är regeln i CLAUDE.md och flaggan `--passWithNoTests` i en gammal version av `package.json`.
- Inga `.env`-filer, nyckelfiler eller tjänstekonton är incheckade.
- [.firebaserc:3](.firebaserc#L3) innehåller projekt-id:t `ai-em-62129`, och samma domän står i en kommentar i [location.ts:11](src/io/location.ts#L11). Ett projekt-id är en offentlig identifierare som syns i varje adress till sidan, och ingen hemlighet.

## 2. Saknad inputvalidering

Valideringen av JSON-filen i [validateConfig.ts](src/lib/validateConfig.ts) är grundlig: typer, intervall, `https://`, att luckorna ryms i bilden, att de inte överlappar och att alla dagar finns. Data från `localStorage` behandlas också som inte betrodd, i [openedDoorsStorage.ts:18-33](src/lib/openedDoorsStorage.ts#L18-L33). Följande saknas:

### V1 – Ingen gräns för filens storlek (Låg)
**[fetchJson.ts:15](src/io/fetchJson.ts#L15)**, `body = await response.text()`. Hela svaret läses in i minnet innan det tolkas. En länk till en fil på flera hundra MB kan få mottagarens flik att hänga eller krascha. Det drabbar bara den som öppnar länken, men länken kan skickas till vem som helst.
*Förslag:* kontrollera `Content-Length` och avbryt läsningen efter till exempel 1 MB. En riktig kalenderfil är några kB.

### V2 – Ingen tidsgräns för hämtningen (Låg)
**[fetchJson.ts:14](src/io/fetchJson.ts#L14).** `fetch` har bara en `AbortSignal` som används när komponenten avmonteras. Om servern tar emot anslutningen men aldrig svarar visas "Hämtar kalendern…" för alltid, utan felmeddelande.
*Förslag:* kombinera signalen med `AbortSignal.timeout(…)` och ge ett begripligt felmeddelande.

### V3 – Ingen maxlängd för texterna (Låg)
**[validateConfig.ts:142](src/lib/validateConfig.ts#L142)** (`alt`), **[:145](src/lib/validateConfig.ts#L145)** (`text`) och **[:217](src/lib/validateConfig.ts#L217)** (`title`). Fälten måste innehålla något, men får vara hur långa som helst. En titel på 100 000 tecken förstör layouten, och en mycket lång `alt` gör skärmläsaren oanvändbar. Det är inte ett säkerhetshål, men validering som saknas.
*Förslag:* rimliga gränser, till exempel 100 tecken för `title`, 300 för `alt` och 1 000 för `text`. Det skulle ändra JSON-formatet och kräver därför ditt godkännande enligt CLAUDE.md.

### V4 – Valfri text kan visas på vår domän (Låg)
Innehållet kommer från den som gjort kalendern, och det är själva idén med appen. Det betyder också att vem som helst kan få sidan `ai-em-62129.web.app` att visa valfri rubrik och text, i **[Calendar.tsx:36](src/components/Calendar.tsx#L36)** och **[ImageModal.tsx:168](src/components/ImageModal.tsx#L168)**. Det gäller även felmeddelanden som upprepar adressen ordagrant, som **[configSource.ts:28](src/lib/configSource.ts#L28)**. Ett exempel: `?config=Ring 08-123 45 67 för att låsa upp kalendern` ger meddelandet *Adressen till kalenderfilen måste börja med https:// (fick "Ring 08-123 45 67 …")*. React escapar texten, så det är **ingen XSS**, men det går att använda för bluff på en domän som ser betrodd ut.
*Förslag:* korta av adresser som upprepas i felmeddelanden, och visa dem tydligt som citerad användardata. Själva innehållet i kalendern är en medveten del av designen.

### V5 – Mottagarens webbläsare hämtar valfri https-adress (Info)
**[configSource.ts:20](src/lib/configSource.ts#L20)** och **[fetchJson.ts:14](src/io/fetchJson.ts#L14).** Med en länk kan man få mottagarens webbläsare att göra en GET-förfrågan mot valfri `https://`-adress, även mot adresser i mottagarens lokala nätverk, som `https://192.168.1.1/…`. Riskerna begränsas av tre saker: inga cookies skickas (`credentials: 'omit'`), svaret kan inte läsas utan CORS, och moderna webbläsare blockerar delvis anrop till privata nätverk. Bilderna fungerar likadant: värden för varje bild ser mottagarens IP-adress. Det följer av designen och bör bara vara känt.

### V6 – Ingen övre gräns för storlekar och koordinater (Info)
**[validateConfig.ts:84](src/lib/validateConfig.ts#L84)** och **[:109](src/lib/validateConfig.ts#L109).** `width: 1e300` godtas så länge proportionerna stämmer. Ingen skada har hittats, eftersom allt räknas om till procent, men gränsen är oklar.

## 3. Injection-risker

### SQL och kommandoinjektion
**Ej tillämpligt.** Det finns ingen databas, ingen server och inga skal- eller processanrop. Appen är statiska filer på Firebase Hosting.

### XSS och kodinjektion
**Inga fynd.**
- Ingen `dangerouslySetInnerHTML`, `eval`, `new Function`, `innerHTML` eller `document.write` används, och ESLint stoppar nu de flesta av dem ([eslint.config.js](eslint.config.js)).
- All text renderas som JSX-text, som React escapar.
- Inga `href` byggs från JSON-data. De enda länkarna, i [StartPage.tsx](src/components/StartPage.tsx), är fasta.
- `src` för bilder kräver `https://`, så `javascript:` och `data:` stoppas.
- **Prototype pollution:** validerade objekt byggs om fält för fält, i [validateConfig.ts:151](src/lib/validateConfig.ts#L151) och [:236](src/lib/validateConfig.ts#L236). En nyckel som `__proto__` i JSON-filen följer därför aldrig med.

### P1 – Procentkodade punkter tar sig förbi kontrollen av sökvägar (Låg)
**[configSource.ts:8](src/lib/configSource.ts#L8)**

```ts
return value.startsWith(EXAMPLES_PREFIX) && !value.includes('..') && !value.includes('//')
```

Kontrollen jämför texten *innan* webbläsaren har tolkat adressen. Enligt WHATWG-standarden räknas `%2e%2e` och `.%2e` som `..`. Bekräftat med Nodes `URL`, som följer samma standard som webbläsare:

| Indata | Godkänd? | Hämtas från |
|---|---|---|
| `/examples/%2e%2e/index.html` | ja | `/index.html` |
| `/examples/.%2e/.%2e/x.json` | ja | `/x.json` |

En fil utanför `/examples/` kan alltså laddas, och den får dessutom `allowRelativeUrls: true`. **Det har ingen praktisk effekt idag**, eftersom det bara finns våra egna statiska filer på domänen och ingen kan ladda upp något dit. Men kontrollen gör inte det den ser ut att göra, och den blir ett riktigt hål om mer innehåll någon gång hamnar på domänen.
*Förslag:* tolka först adressen med `new URL(value, origin)`, och kontrollera sedan att `origin` är vår egen och att `pathname` börjar med `/examples/`. Ännu enklare är att bara godta en lista med exakta filnamn.

### P2 – Regeln för relativa bildadresser godtar `/\` och `/../` (Låg)
**[validateConfig.ts:33](src/lib/validateConfig.ts#L33)**

```ts
if (allowRelativeUrls && value.startsWith('/') && !value.startsWith('//')) {
```

| Indata | Godkänd? | Hämtas från |
|---|---|---|
| `/\evil.example/x.jpg` | ja | `https://evil.example/x.jpg` (annan domän) |
| `/../../x.jpg` | ja | `/x.jpg` |

Webbläsare tolkar `\` som `/`, så `/\evil.example` blir en adress till en annan domän. Det gäller bara när `allowRelativeUrls` är påslaget, alltså för exempelkalendern, som vi själva styr. Risken är därför låg, men regeln skiljer sig från P1, och säkerhetsregler bör bara finnas på ett ställe.
*Förslag:* samla reglerna för adresser i en modul och använd samma kontroll efter tolkning som i P1.

## 4. Känsliga data i loggar

**Ingen loggning finns.** Det finns inga `console.*`- eller `debugger`-anrop i `src/` och inga analysverktyg. Däremot sparas och visas adresser som kan vara känsliga:

### K1 – Config-URL:en sparas som nyckel i `localStorage` (Låg)
**[openedDoorsStorage.ts:10](src/lib/openedDoorsStorage.ts#L10)** och **[storage.ts:13](src/io/storage.ts#L13).** Nyckeln är `adventskalender:opened:<hela config-URL:en>`. Många tjänster för fildelning lägger en åtkomsttoken i adressen, till exempel `?token=` i Firebase Storage, signerade adresser i S3 eller `rlkey=` i Dropbox. Den token sparas då i klartext i webbläsaren och tas aldrig bort. Den som har tillgång till enheten kan se vilka kalendrar som öppnats och få privata länkar.
*Förslag:* använd ett hashvärde av adressen som nyckel i stället för själva adressen. Det kräver en flytt av befintliga nycklar, annars försvinner redan sparade luckor.

### K2 – Hela adresser visas i felmeddelanden (Låg)
**[fetchJson.ts:8](src/io/fetchJson.ts#L8)**, **[fetchJson.ts:22](src/io/fetchJson.ts#L22)**, **[ImageModal.tsx:153](src/components/ImageModal.tsx#L153)**, **[configSource.ts:28](src/lib/configSource.ts#L28)** och **[validateConfig.ts:67](src/lib/validateConfig.ts#L67).** Felmeddelandena visar hela adressen, inklusive parametrar. Den som tar en skärmbild och ber om hjälp delar då ofta också sin token.
*Förslag:* visa bara värd och sökväg (`https://example.com/…/kalender.json`), utan parametrar. Det räcker för att hitta felet.

## 5. Osäkra standardvärden

### D1 – Datumspärren är ingen sekretess (Medel)
**[location.ts:8](src/io/location.ts#L8)** (`preview=1`) och **[clock.ts:3](src/io/clock.ts#L3)** (användarens klocka).
Det finns tre sätt för vem som helst att se alla luckor redan första dagen:
1. Lägga till `&preview=1` i länken, och detta står i README.
2. Ställa fram datorns klocka.
3. Öppna JSON-filen direkt, eftersom den innehåller alla bildadresser och texter.

Det är rimligt för en statisk sida. Men CLAUDE.md beskriver innehållet som *"ofta privata familjebilder"*, och varken [StartPage.tsx](src/components/StartPage.tsx) eller README säger att låsningen bara är för skojs skull. Den som gör en kalender kan tro att bilden för den 24 december är dold till julafton, och lägga in något som inte borde synas tidigare, eller inte alls för den som har länken.
*Förslag:* skriv tydligt på startsidan och i README att **allt innehåll går att se för den som har länken, från första dagen**. Den här bristen löses med information, inte med kod.

### D2 – `.gitignore` ignorerar inte `.env` och tjänstekontofiler (Låg)
**[.gitignore:13](.gitignore#L13)** ignorerar bara `*.local`. Vite läser `.env`, `.env.production` och liknande, men de ignoreras inte, och det gör inte heller filer som `*-firebase-adminsdk-*.json` eller `serviceAccount*.json`. Projektet har inga hemligheter idag, men den som senare lägger in till exempel en deploy-token i `.env` kan råka checka in den. CLAUDE.md förbjuder det, men inget tekniskt stoppar det.
*Förslag:* lägg till `.env`, `.env.*` (utom en eventuell `.env.example`) och mönster för tjänstekonton i `.gitignore`.

### D3 – `img-src` och `connect-src` tillåter alla `https:`-adresser (Info)
**[firebase.json:11](firebase.json#L11).** Det behövs, eftersom config-filen och bilderna kan ligga var som helst, och det är dokumenterat i CLAUDE.md. Följden är att om ett XSS-hål någon gång uppstod skulle det kunna skicka data till vilken https-värd som helst. Eftersom inget XSS-hål har hittats och `script-src 'self'` utan `'unsafe-inline'` gäller, går risken att godta.

---

## Det som redan fungerar bra

- `fetch` skickar varken cookies eller referrer ([fetchJson.ts:14](src/io/fetchJson.ts#L14)), och headern `Referrer-Policy: no-referrer` gäller hela webbplatsen.
- CSP:n är strikt: `default-src 'none'`, inga `'unsafe-inline'` eller `'unsafe-eval'`, `frame-ancestors 'none'`, `base-uri 'none'` och `object-src 'none'`.
- HSTS, `X-Content-Type-Options: nosniff`, `Cross-Origin-Opener-Policy` och en restriktiv `Permissions-Policy` finns.
- Bara `https://` godtas för config och bilder, och det är testat mot `http:`, `javascript:` och `data:`.
- `ValidationOptions.allowRelativeUrls` har inget standardvärde och måste alltid anges, så det går inte att slå på av misstag.
- ESLint stoppar `any`, `as`, `dangerouslySetInnerHTML`, `eval` och I/O utanför `src/io/`.

## Förslag i prioritetsordning

1. **D1:** informera på startsidan och i README om att innehållet inte är hemligt.
2. **P1 och P2:** en gemensam kontroll av adresser efter att de tolkats, med tester för `%2e%2e`, `.%2e`, `/\` och `/../`.
3. **K1 och K2:** ett hashvärde som nyckel i `localStorage`, och adresser utan parametrar i felmeddelanden.
4. **V1 och V2:** gräns för storlek och tid i `fetchJson`.
5. **D2:** komplettera `.gitignore`.
6. **V3:** maxlängder för texterna, efter ditt godkännande, eftersom det ändrar JSON-formatet.
