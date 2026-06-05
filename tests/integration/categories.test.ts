import { getPayloadClient } from '../../src/lib/payload'
import { test, expect, afterAll } from 'vitest'

test('auto-generates slug from name', async () => {
  const p = await getPayloadClient()
  const doc = await p.create({ collection: 'categories', data: { name: 'Față' } })
  expect(doc.slug).toBe('fata')
  await p.delete({ collection: 'categories', id: doc.id })
})

test('explicit slug is kept and not overwritten', async () => {
  const p = await getPayloadClient()
  const doc = await p.create({
    collection: 'categories',
    data: { name: 'Chirurgie Plastică', slug: 'chirurgie-plastica-custom' },
  })
  expect(doc.slug).toBe('chirurgie-plastica-custom')
  await p.delete({ collection: 'categories', id: doc.id })
})
