/**
 * Integration tests for the seed script.
 * Asserts against the already-seeded database (assumes `pnpm seed` has been run).
 */
import { getPayloadClient } from '../../src/lib/payload'
import { test, expect } from 'vitest'

test('database contains >=33 procedures after seed', async () => {
  const payload = await getPayloadClient()
  const result = await payload.count({ collection: 'procedures' })
  expect(result.totalDocs).toBeGreaterThanOrEqual(33)
}, 30000)

test('at least one procedure has relatedEquipment', async () => {
  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: 'procedures',
    depth: 0,
    limit: 100,
  })
  const withEquipment = result.docs.filter(
    (doc) => Array.isArray((doc as any).relatedEquipment) && (doc as any).relatedEquipment.length > 0,
  )
  expect(withEquipment.length).toBeGreaterThan(0)
}, 30000)

test('all 5 categories exist', async () => {
  const payload = await getPayloadClient()
  const result = await payload.count({ collection: 'categories' })
  expect(result.totalDocs).toBeGreaterThanOrEqual(5)
}, 30000)

test('all 7 equipment items exist', async () => {
  const payload = await getPayloadClient()
  const result = await payload.count({ collection: 'equipment' })
  expect(result.totalDocs).toBeGreaterThanOrEqual(7)
}, 30000)

test('procedures have valid categories (published)', async () => {
  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: 'procedures',
    where: { status: { equals: 'published' } },
    limit: 50,
  })
  expect(result.docs.length).toBeGreaterThan(30)
}, 30000)

test('laser category procedures exist', async () => {
  const payload = await getPayloadClient()
  const laserCat = await payload.find({
    collection: 'categories',
    where: { slug: { equals: 'laser' } },
    limit: 1,
  })
  expect(laserCat.docs.length).toBe(1)

  const laserProcs = await payload.find({
    collection: 'procedures',
    where: { category: { equals: laserCat.docs[0].id } },
    limit: 20,
  })
  expect(laserProcs.docs.length).toBeGreaterThan(3)
}, 30000)
