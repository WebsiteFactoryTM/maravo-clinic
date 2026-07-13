import { test, expect } from 'vitest'
import { parseProcedures } from '../../src/seed/parse-procedures'

/** Minimal procedure block; only the FAQ section varies between cases. */
function block(faq: string): string {
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
    '9. Întrebări frecvente',
    faq,
  ].join('\n')
}

test('splits several Q/A pairs packed onto one source line', () => {
  // Regression: the old parser split on the FIRST "?" only, so this line yielded
  // one item whose answer swallowed the remaining three questions.
  const [proc] = parseProcedures(
    block(
      'Se umflă buzele? Ușor, câteva zile. Când se vede forma finală? 7–28 zile. Rezultatul este natural? Da. Se poate corecta? Da.',
    ),
  )

  expect(proc.faq).toEqual([
    { question: 'Se umflă buzele?', answer: 'Ușor, câteva zile.' },
    { question: 'Când se vede forma finală?', answer: '7–28 zile.' },
    { question: 'Rezultatul este natural?', answer: 'Da.' },
    { question: 'Se poate corecta?', answer: 'Da.' },
  ])
})

test('no answer bleeds the next question into it', () => {
  const [proc] = parseProcedures(
    block(
      'Se umflă buzele? Ușor, câteva zile. Când se vede forma finală? 7–28 zile.',
    ),
  )
  for (const item of proc.faq ?? []) {
    expect(item.answer).not.toContain('?')
  }
})

test('splits Q/A pairs spread across separate lines', () => {
  const [proc] = parseProcedures(
    block(['Îngheață fața? Nu.', 'Când apare efectul? În câteva zile.', 'Este dureros? Minim.'].join('\n')),
  )

  expect(proc.faq).toEqual([
    { question: 'Îngheață fața?', answer: 'Nu.' },
    { question: 'Când apare efectul?', answer: 'În câteva zile.' },
    { question: 'Este dureros?', answer: 'Minim.' },
  ])
})

test('every parsed question ends with a question mark', () => {
  const [proc] = parseProcedures(
    block('Oferă volum? Nu, efectul este mai discret.\nSe văd firele? Nu, sunt invizibile.'),
  )
  expect(proc.faq).toHaveLength(2)
  for (const item of proc.faq ?? []) {
    expect(item.question.endsWith('?')).toBe(true)
  }
})

test('a FAQ block with no question mark yields no items', () => {
  const [proc] = parseProcedures(block('Fără întrebări aici.'))
  expect(proc.faq).toBeUndefined()
})
