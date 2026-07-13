import { test, expect } from 'vitest'
import { parseProcedures } from '../../src/seed/parse-procedures'

/** Minimal procedure block; only the indications section varies between cases. */
function block(indicatii: string): string {
  return [
    '1. Procedură test',
    '',
    'Pictograme',
    '',
    'Durată: 30 min Disconfort: minim, 1–3/10 Rezultate: imediate Recuperare: 24h',
    '',
    '1. Ce este?',
    'O procedură de test folosită pentru a exercita parserul.',
    '',
    '8. Indicații și contraindicații',
    indicatii,
  ].join('\n')
}

test('keeps every indication, including ones containing the letter "c"', () => {
  // Regression: the old capture `([^C\n]+)` ran under /i, so it excluded lowercase
  // "c" too and truncated this value at "contur".
  const [proc] = parseProcedures(
    block(
      [
        'Indicații: buze subțiri, lipsă contur, asimetrii.',
        'Contraindicații: sarcină, alăptare, herpes activ, infecții locale.',
      ].join('\n'),
    ),
  )

  expect(proc.indications).toBe('buze subțiri, lipsă contur, asimetrii.')
  expect(proc.contraindications).toBe('sarcină, alăptare, herpes activ, infecții locale.')
})

test('captures an indication that starts with "c"', () => {
  // Regression: this previously captured nothing, leaving the field empty.
  const [proc] = parseProcedures(
    block(
      [
        'Indicații: contur buze estompat, lipsă fermitate, dorință de rezultat natural.',
        'Contraindicații: sarcină, infecții locale.',
      ].join('\n'),
    ),
  )

  expect(proc.indications).toBe(
    'contur buze estompat, lipsă fermitate, dorință de rezultat natural.',
  )
})

test('does not mistake the "Contraindicații" line for the "Indicații" line', () => {
  const [proc] = parseProcedures(
    block(['Indicații: rejuvenare.', 'Contraindicații: boli hematologice.'].join('\n')),
  )

  expect(proc.indications).toBe('rejuvenare.')
  expect(proc.contraindications).toBe('boli hematologice.')
})
