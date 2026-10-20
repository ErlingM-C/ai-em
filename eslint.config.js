import js from '@eslint/js'
import reactHooks from 'eslint-plugin-react-hooks'
import { defineConfig, globalIgnores } from 'eslint/config'
import globals from 'globals'
import tseslint from 'typescript-eslint'

// Innehåll från JSON-filen får aldrig renderas som HTML (CLAUDE.md, princip 5).
const noDangerousHtml = {
  selector: "JSXAttribute[name.name='dangerouslySetInnerHTML']",
  message: 'Rendera text som vanlig JSX-text i stället för dangerouslySetInnerHTML.',
}

// Aktuellt datum läses bara i src/io/ (CLAUDE.md, princip 1).
const noCurrentDate = {
  selector: "NewExpression[callee.name='Date'][arguments.length=0]",
  message: 'Läs aktuellt datum via src/io/clock.ts.',
}

const ioOnly = 'All I/O sker i src/io/. Anropa en funktion där i stället.'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [js.configs.recommended, tseslint.configs.recommended, reactHooks.configs.flat.recommended],
    languageOptions: {
      ecmaVersion: 2023,
      globals: globals.browser,
    },
    rules: {
      // Kringgå inte typsystemet med `as`. `as const` är fortfarande tillåtet.
      '@typescript-eslint/consistent-type-assertions': ['error', { assertionStyle: 'never' }],
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'no-restricted-syntax': ['error', noDangerousHtml, noCurrentDate],
      'no-restricted-globals': [
        'error',
        { name: 'fetch', message: ioOnly },
        { name: 'localStorage', message: ioOnly },
        { name: 'sessionStorage', message: ioOnly },
        { name: 'location', message: ioOnly },
      ],
      'no-restricted-properties': [
        'error',
        { object: 'window', property: 'fetch', message: ioOnly },
        { object: 'window', property: 'localStorage', message: ioOnly },
        { object: 'window', property: 'sessionStorage', message: ioOnly },
        { object: 'window', property: 'location', message: ioOnly },
        { object: 'Date', property: 'now', message: 'Läs aktuellt datum via src/io/clock.ts.' },
      ],
    },
  },
  {
    // I/O-lagret är det enda stället som får läsa datum, adress, lagring och nätverk.
    files: ['src/io/**/*.ts'],
    rules: {
      'no-restricted-syntax': ['error', noDangerousHtml],
      'no-restricted-globals': 'off',
      'no-restricted-properties': 'off',
    },
  },
  {
    files: ['vite.config.ts'],
    languageOptions: {
      globals: globals.node,
    },
  },
])
