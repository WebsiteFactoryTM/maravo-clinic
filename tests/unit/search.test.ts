import { test, expect } from 'vitest'
import { filterIndex, groupResults, normalizeText, type SearchItem } from '../../src/lib/search'

const items: SearchItem[] = [
  { id: 'procedure-1', type: 'procedure', title: 'Tratament cu Botox', url: '/proceduri/injectabile/botox', category: 'Injectabile', excerpt: 'Reduce ridurile' },
  { id: 'procedure-2', type: 'procedure', title: 'Epilare laser', url: '/proceduri/laser/epilare', category: 'Laser', excerpt: 'Îndepărtează părul' },
  { id: 'equipment-1', type: 'equipment', title: 'Laser Soprano', url: '/aparatura/soprano', category: 'Alma', excerpt: 'Aparat de epilare definitivă' },
  { id: 'article-1', type: 'article', title: 'Mituri despre Botox', url: '/blog/mituri-botox', category: 'Estetică', excerpt: null },
]

test('normalizeText strips Romanian diacritics and lowercases', () => {
  expect(normalizeText('Îndepărtează Părul Țăran Șic')).toBe('indeparteaza parul taran sic')
})

test('filterIndex returns no results for an empty query', () => {
  expect(filterIndex(items, '')).toEqual([])
  expect(filterIndex(items, '   ')).toEqual([])
})

test('filterIndex matches title across all groups (case + diacritics insensitive)', () => {
  const r = filterIndex(items, 'BOTOX')
  expect(r.map((i) => i.id)).toEqual(['procedure-1', 'article-1'])
})

test('filterIndex matches diacritic terms regardless of accents', () => {
  // query without diacritics should still hit "Îndepărtează" in the excerpt
  const r = filterIndex(items, 'indeparteaza')
  expect(r.map((i) => i.id)).toContain('procedure-2')
})

test('filterIndex ranks title-prefix matches ahead of body-only matches', () => {
  const r = filterIndex(items, 'laser')
  // "Epilare laser" (title) and "Laser Soprano" (title-prefix) both match;
  // the prefix match should come first.
  expect(r[0].id).toBe('equipment-1')
})

test('groupResults buckets by type preserving order', () => {
  const grouped = groupResults(filterIndex(items, 'botox'))
  expect(grouped.procedure.map((i) => i.id)).toEqual(['procedure-1'])
  expect(grouped.article.map((i) => i.id)).toEqual(['article-1'])
  expect(grouped.equipment).toEqual([])
})
