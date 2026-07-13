import { test, expect } from 'vitest'
import { PROCEDURE_SORT, sortProcedures } from '../../src/lib/procedure-sort'

/** Terse builder: p('Titlu', categoryOrder, order) */
function p(title: string, categoryOrder: number | null, order?: number | null) {
  return { title, order, category: { order: categoryOrder } }
}

test('PROCEDURE_SORT ranks by order, then title', () => {
  expect(PROCEDURE_SORT).toEqual(['order', 'title'])
})

test('sorts by procedure order within a single category', () => {
  const sorted = sortProcedures([p('C', 1, 3), p('A', 1, 1), p('B', 1, 2)])
  expect(sorted.map((x) => x.title)).toEqual(['A', 'B', 'C'])
})

test('category order wins over procedure order', () => {
  // The Corp procedure has a lower own-order, but its category ranks later.
  const sorted = sortProcedures([p('Corp — primul', 2, 1), p('Față — ultimul', 1, 9)])
  expect(sorted.map((x) => x.title)).toEqual(['Față — ultimul', 'Corp — primul'])
})

test('title breaks ties when order is equal', () => {
  const sorted = sortProcedures([p('Zebră', 1, 5), p('Alfa', 1, 5)])
  expect(sorted.map((x) => x.title)).toEqual(['Alfa', 'Zebră'])
})

test('a whole category with no order set reads alphabetically', () => {
  // The state right after the migration: no one has arranged anything yet.
  const sorted = sortProcedures([
    p('Mezoterapie', 1, null),
    p('Botox', 1, null),
    p('HydraFacial', 1, null),
  ])
  expect(sorted.map((x) => x.title)).toEqual(['Botox', 'HydraFacial', 'Mezoterapie'])
})

test('unranked procedures fall BELOW ranked ones, never above', () => {
  // The point of the whole field: pin three, leave the rest alone, and the three
  // stay on top. A default of 0 would have floated every untouched procedure first.
  const sorted = sortProcedures([
    p('Neordonat Z', 1, null),
    p('Neordonat A', 1, null),
    p('Fixat al treilea', 1, 3),
    p('Fixat primul', 1, 1),
  ])
  expect(sorted.map((x) => x.title)).toEqual([
    'Fixat primul',
    'Fixat al treilea',
    'Neordonat A',
    'Neordonat Z',
  ])
})

test('titles compare with Romanian collation', () => {
  // 'ș' must sort next to 's', not after 'z' as it would under a byte compare.
  const sorted = sortProcedures([p('Zebră', 1, null), p('Șanțuri', 1, null), p('Sculptra', 1, null)])
  expect(sorted.map((x) => x.title)).toEqual(['Sculptra', 'Șanțuri', 'Zebră'])
})

test('an unpopulated category (depth 0 → plain id) sorts last, not first', () => {
  const sorted = sortProcedures([
    { title: 'Nepopulat', order: 1, category: 42 },
    { title: 'Populat', order: 9, category: { order: 1 } },
  ])
  expect(sorted.map((x) => x.title)).toEqual(['Populat', 'Nepopulat'])
})

test('a null category sorts last', () => {
  const sorted = sortProcedures([
    { title: 'Fără categorie', order: 1, category: null },
    { title: 'Cu categorie', order: 9, category: { order: 1 } },
  ])
  expect(sorted.map((x) => x.title)).toEqual(['Cu categorie', 'Fără categorie'])
})

test('does not mutate the input array', () => {
  const input = [p('B', 1, 2), p('A', 1, 1)]
  const before = input.map((x) => x.title)
  sortProcedures(input)
  expect(input.map((x) => x.title)).toEqual(before)
})
