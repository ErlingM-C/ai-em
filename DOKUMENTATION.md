# Dokumentation – Digital adventskalender

Kompletterar [README.md](README.md) med det som är bra att veta när man gör en egen kalender, testar, publicerar eller ändrar i koden.

- [Göra en egen kalender](#göra-en-egen-kalender)
  - [Publicera din JSON-fil](#publicera-din-json-fil)
- [Utveckling](#utveckling)
- [Publicera](#publicera)
- [Projektstruktur](#projektstruktur)
- [Teknik](#teknik)

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

### Publicera din JSON-fil

JSON-filen måste ligga på en adress som börjar med `https://`, och tjänsten måste tillåta att filen hämtas från andra webbplatser (CORS). Två enkla och gratis tjänster som fungerar är GitHub Gist och npoint.io.

> **Obs!** Både JSON-filen och bilderna går att se för alla som har länken, även luckor som ännu inte är öppnade. Lägg inte in något som inte får synas före julafton.

#### Alternativ 1: GitHub Gist

Kräver ett gratis konto på GitHub.

1. Logga in och gå till https://gist.github.com.
2. Skriv ett filnamn som slutar på `.json`, till exempel `min-kalender.json`, och klistra in innehållet.
3. Välj **Create secret gist**. En hemlig gist syns inte i sökningar, men alla som har länken kan läsa den.
4. Klicka på **Raw** och kopiera adressen. Den ser ut så här:
   ```
   https://gist.githubusercontent.com/<användarnamn>/<gist-id>/raw/<versions-id>/min-kalender.json
   ```
5. Ta bort `<versions-id>/` ur adressen, så att den alltid visar den senaste versionen av filen:
   ```
   https://gist.githubusercontent.com/<användarnamn>/<gist-id>/raw/min-kalender.json
   ```

Ändra filen med **Edit** i gisten. Det kan ta några minuter innan ändringen syns i kalendern.

#### Alternativ 2: npoint.io

Kräver inget konto.

1. Gå till https://www.npoint.io och välj **Create JSON Bin**.
2. Klistra in innehållet och klicka på **Save**.
3. Använd adressen som börjar med `https://api.npoint.io/`, till exempel `https://api.npoint.io/abc123def456`. Adressen till själva sidan på npoint.io (`www.npoint.io/docs/…`) fungerar inte, eftersom den visar en webbsida och inte filen.

Spara länken till sidan på npoint.io, så att du hittar tillbaka och kan ändra filen.

#### Dela kalendern

Sätt adressen till JSON-filen efter `?config=`:

```
https://erlingm-c.github.io/ai-em/?config=https://api.npoint.io/abc123def456
```

Testa först med `&preview=1` sist i länken, så att alla luckor går att öppna. Ta bort `&preview=1` innan du skickar länken till andra.

## Utveckling

Installation och krav finns i [README.md](README.md). För att testa med samma headers som i drift och för att publicera på Firebase behövs också [Firebase CLI](https://firebase.google.com/docs/cli): `npm install -g firebase-tools`

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

Bara exempelkalendrar under `/examples/` får ligga på samma webbplats och använda relativa sökvägar. En relativ bildsökväg, som `demo/dag01.svg`, räknas från kalenderfilens adress. Alla andra kalenderfiler och bilder måste ha adresser som börjar med `https://`.

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

### GitHub Pages

Sidan kan också publiceras på GitHub Pages, på https://erlingm-c.github.io/ai-em/. Där ligger den i undermappen `/ai-em/`, så exempelkalendern öppnas med https://erlingm-c.github.io/ai-em/?config=/ai-em/examples/demo.json&preview=1.

Första gången: välj *Settings → Pages → Source: GitHub Actions* i repot på GitHub.

Arbetsflödet [.github/workflows/ci-cd.yml](.github/workflows/ci-cd.yml) kör lint, tester och `npm run build:pages` för varje pull request mot `main` och varje push till `main`. Vid push till `main` publiceras `dist/` sedan automatiskt, men bara om alla kontroller gått igenom. Det går också att publicera om manuellt: *Actions → CI/CD → Run workflow*. Inga GitHub Secrets behövs.

GitHub Pages kan inte sätta egna HTTP-headers. `npm run build:pages` lägger därför in Content-Security-Policy och Referrer-Policy från `firebase.json` som meta-taggar i `index.html`. `frame-ancestors`, `X-Content-Type-Options`, `Cross-Origin-Opener-Policy`, `Permissions-Policy` och HSTS går inte att sätta så. På GitHub Pages är skyddet alltså något svagare än på Firebase.

Bygget går att testa lokalt med `npm run build:pages` och `npx vite preview --base=/ai-em/`. I Git Bash behöver kommandot `MSYS_NO_PATHCONV=1` före sig, annars görs `/ai-em/` om till en Windows-sökväg.

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

React, TypeScript, Vite, Vitest och CSS Modules. Sidan publiceras som statiska filer på Firebase Hosting och GitHub Pages.

Fotot i lucka 24 i exempelkalendern är ["Under the Christmas tree."](https://commons.wikimedia.org/wiki/File:Under_the_Christmas_tree._(15867338637).jpg) av Bernard Spragg, med licensen [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/deed.en).
