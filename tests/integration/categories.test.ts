import { getPayloadClient } from '../../src/lib/payload'
import { test, expect } from 'vitest'

test('auto-generates slug from name (diacritics stripped)', async () => {
  const p = await getPayloadClient()
  const unique = `Țăndărei Test ${Date.now()}`
  const doc = await p.create({ collection: 'categories', data: { name: unique } })
  expect(doc.slug).toMatch(/^tandarei-test-\d+$/)
  await p.delete({ collection: 'categories', id: doc.id })
})

test('explicit slug is kept and not overwritten', async () => {
  const p = await getPayloadClient()
  const ts = Date.now()
  const doc = await p.create({
    collection: 'categories',
    data: { name: `Chirurgie Plastică ${ts}`, slug: `chirurgie-plastica-custom-${ts}` },
  })
  expect(doc.slug).toBe(`chirurgie-plastica-custom-${ts}`)
  await p.delete({ collection: 'categories', id: doc.id })
})
