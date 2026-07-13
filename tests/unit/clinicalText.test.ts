import { test, expect } from 'vitest'
import { capitalizeFirst, splitClinicalList } from '../../src/lib/clinical-text'

test('capitalizeFirst upper-cases the first letter and trims', () => {
  expect(capitalizeFirst('  buze subțiri ')).toBe('Buze subțiri')
})

test('capitalizeFirst leaves an already-capitalized string alone', () => {
  expect(capitalizeFirst('Este dureroasă procedura?')).toBe('Este dureroasă procedura?')
})

test('capitalizeFirst handles Romanian diacritics as the first letter', () => {
  expect(capitalizeFirst('șanțuri adâncite')).toBe('Șanțuri adâncite')
  expect(capitalizeFirst('închis')).toBe('Închis')
})

test('capitalizeFirst returns empty string for blank input', () => {
  expect(capitalizeFirst('   ')).toBe('')
})

test('splitClinicalList splits the comma-separated source prose into capitalized items', () => {
  expect(splitClinicalList('buze subțiri, lipsă contur, asimetrii.')).toEqual([
    'Buze subțiri',
    'Lipsă contur',
    'Asimetrii',
  ])
})

test('splitClinicalList strips the trailing period from the final item', () => {
  expect(splitClinicalList('sarcină, alăptare, herpes activ, infecții locale.')).toEqual([
    'Sarcină',
    'Alăptare',
    'Herpes activ',
    'Infecții locale',
  ])
})

test('splitClinicalList handles a single item', () => {
  expect(splitClinicalList('nu există contraindicații.')).toEqual(['Nu există contraindicații'])
})

test('splitClinicalList respects structure an editor already added', () => {
  expect(splitClinicalList('• sarcină\n• boli neuromusculare')).toEqual([
    'Sarcină',
    'Boli neuromusculare',
  ])
  expect(splitClinicalList('- cicatrici, pori\n- infecții active')).toEqual([
    'Cicatrici, pori',
    'Infecții active',
  ])
})

test('splitClinicalList returns [] for empty/nullish input', () => {
  expect(splitClinicalList(null)).toEqual([])
  expect(splitClinicalList(undefined)).toEqual([])
  expect(splitClinicalList('   ')).toEqual([])
})
