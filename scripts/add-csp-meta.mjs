// Lägger in Content-Security-Policy och Referrer-Policy som meta-taggar i dist/index.html.
// Används för GitHub Pages, som inte kan sätta egna HTTP-headers. Policyn läses från
// firebase.json, så att båda värdarna har samma regler.
import { readFileSync, writeFileSync } from 'node:fs'

const firebaseUrl = new URL('../firebase.json', import.meta.url)
const indexUrl = new URL('../dist/index.html', import.meta.url)

const headers = JSON.parse(readFileSync(firebaseUrl, 'utf8')).hosting.headers.flatMap((rule) => rule.headers)

function headerValue(key) {
  const header = headers.find((candidate) => candidate.key === key)
  if (header === undefined) {
    throw new Error(`${key} saknas i firebase.json.`)
  }
  return header.value
}

// frame-ancestors fungerar inte i en meta-tagg, och webbläsaren varnar om den finns med.
const csp = headerValue('Content-Security-Policy')
  .split(';')
  .map((directive) => directive.trim())
  .filter((directive) => directive !== '' && !directive.startsWith('frame-ancestors'))
  .join('; ')
const referrer = headerValue('Referrer-Policy')

const html = readFileSync(indexUrl, 'utf8')
if (html.includes('http-equiv="Content-Security-Policy"')) {
  throw new Error('dist/index.html har redan en Content-Security-Policy.')
}
// Taggarna läggs direkt efter charset, före allt som läser in skript, stilar eller bilder.
const charset = '<meta charset="UTF-8" />'
if (!html.includes(charset)) {
  throw new Error(`Hittade inte ${charset} i dist/index.html.`)
}
const meta =
  `<meta http-equiv="Content-Security-Policy" content="${csp}" />` +
  `<meta name="referrer" content="${referrer}" />`
writeFileSync(indexUrl, html.replace(charset, charset + meta))
