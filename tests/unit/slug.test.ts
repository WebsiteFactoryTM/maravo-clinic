import { slugify } from '../../src/lib/slug'
import { test, expect } from 'vitest'

// --- Baseline tests (from spec) ---

test('lowercases and hyphenates', () => {
  expect(slugify('Injectare Botox')).toBe('injectare-botox')
})

test('strips Romanian diacritics', () => {
  expect(slugify('Corecție cearcăne cu acid hialuronic'))
    .toBe('corectie-cearcane-cu-acid-hialuronic')
})

test('drops punctuation and collapses spaces', () => {
  expect(slugify('PRP, terapia vampir')).toBe('prp-terapia-vampir')
})

// --- Real procedure titles ---

test('handles comma-separated procedure title', () => {
  expect(slugify('Injectare botox maseteri, bruxism'))
    .toBe('injectare-botox-maseteri-bruxism')
})

test('handles ș (comma-below) and special chars in HarmonyCa', () => {
  expect(slugify('HarmonyCa, lifting și biostimulare'))
    .toBe('harmonyca-lifting-si-biostimulare')
})

test('handles long volumetry title with many diacritics', () => {
  // Volumetrie facială cu acid hialuronic, pomeți, mandibulă, menton, tâmple
  // Expected: volumetrie-faciala-cu-acid-hialuronic-pometi-mandibula-menton-tample
  expect(
    slugify('Volumetrie facială cu acid hialuronic, pomeți, mandibulă, menton, tâmple')
  ).toBe('volumetrie-faciala-cu-acid-hialuronic-pometi-mandibula-menton-tample')
})

// --- Both encodings of ș/ț ---

test('cedilla form ş ţ (U+015F / U+0163) produces same slug as comma-below ș ț (U+0219 / U+021B)', () => {
  // Comma-below (standard Romanian Unicode):
  const commaBelow = slugify('șșțț')
  // Cedilla (legacy / MS-Word encoding):
  const cedilla = slugify('şşţţ')
  expect(commaBelow).toBe('sstt')
  expect(cedilla).toBe('sstt')
})

test('ț comma-below (U+021B) → t', () => {
  expect(slugify('Față')).toBe('fata')
})

test('ş cedilla (U+015F) → s', () => {
  expect(slugify('şofer')).toBe('sofer')
})

// --- Edge cases ---

test('is idempotent: slugify(slugify(x)) === slugify(x)', () => {
  const samples = [
    'Injectare Botox',
    'Corecție cearcăne cu acid hialuronic',
    'HarmonyCa, lifting și biostimulare',
    'Volumetrie facială cu acid hialuronic, pomeți, mandibulă, menton, tâmple',
  ]
  for (const s of samples) {
    const once = slugify(s)
    expect(slugify(once)).toBe(once)
  }
})

test('collapses multiple spaces to single hyphen', () => {
  expect(slugify('piele   uscată')).toBe('piele-uscata')
})

test('strips leading and trailing spaces — no leading/trailing hyphens', () => {
  expect(slugify('  botox  ')).toBe('botox')
})

test('strips leading and trailing hyphens from punctuation-only edges', () => {
  expect(slugify('--botox--')).toBe('botox')
})

test('empty string returns empty string', () => {
  expect(slugify('')).toBe('')
})
