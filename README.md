# Digital adventskalender

[![CI/CD](https://github.com/ErlingM-C/ai-em/actions/workflows/ci-cd.yml/badge.svg?branch=main)](https://github.com/ErlingM-C/ai-em/actions/workflows/ci-cd.yml)

Designade och utvecklade en digital adventskalender för webben med React, TypeScript (strict), Vite, Vitest och CSS Modules, publicerad med GitHub Pages via GitHub Actions, med hjälp av agentdriven utveckling (Claude Code). Projektet gör det enkelt att dela familjebilder på ett personligt sätt i juletid: vem som helst kan göra en egen kalender med 24 luckor, en per dag i december, genom att skriva en JSON-fil och dela en länk, utan att programmera eller sätta upp en egen webbplats. Projektet är tillgängligt på https://erlingm-c.github.io/ai-em/, med en exempelkalender på https://erlingm-c.github.io/ai-em/?config=/ai-em/examples/demo.json&preview=1.

Exempelkalenderns JSON-fil finns på https://erlingm-c.github.io/ai-em/examples/demo.json ([källfilen i repot](public/examples/demo.json)).

## Vad det gör

Visar 24 luckor på en bakgrundsbild. Bakom varje lucka finns en bild och en kort text, och en lucka går att öppna först på sitt datum i december. Den som gör en kalender skriver en JSON-fil med länkar till sina bilder, lägger upp den på en webbadress och delar en länk som `…/?config=https://example.com/min-kalender.json`. Webbläsaren kommer ihåg vilka luckor som har öppnats, och ingen data sparas på servern.

## Kom igång

### Krav

- [Node.js](https://nodejs.org/) 22 eller senare, med npm
- Inga externa tjänster, API-nycklar eller konton behövs för att köra projektet.

### Installation

```sh
git clone https://github.com/ErlingM-C/ai-em
cd ai-em
npm install
```

### Konfiguration

Projektet behöver ingen `.env`-fil och inga miljövariabler. Varje kalender konfigureras i stället med parametern `config` i adressen, som pekar på kalenderns JSON-fil. Formatet beskrivs i [DOKUMENTATION.md](DOKUMENTATION.md#göra-en-egen-kalender).

### Kör projektet

```sh
npm run dev
```

Öppna sedan http://localhost:5173/?config=/examples/demo.json&preview=1 för att se exempelkalendern med alla luckor upplåsta.

Mer om JSON-formatet, tester, publicering och projektets struktur finns i [DOKUMENTATION.md](DOKUMENTATION.md).
