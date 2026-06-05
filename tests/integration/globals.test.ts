import { getPayloadClient } from '../../src/lib/payload'
import { test, expect } from 'vitest'

test('SiteSettings global is readable and returns an object', async () => {
  const payload = await getPayloadClient()
  const result = await payload.findGlobal({ slug: 'site-settings' })
  expect(result).toBeDefined()
  expect(typeof result).toBe('object')
})

test('Homepage global is readable and returns an object', async () => {
  const payload = await getPayloadClient()
  const result = await payload.findGlobal({ slug: 'homepage' })
  expect(result).toBeDefined()
  expect(typeof result).toBe('object')
})

test('Navigation global is readable and returns an object', async () => {
  const payload = await getPayloadClient()
  const result = await payload.findGlobal({ slug: 'navigation' })
  expect(result).toBeDefined()
  expect(typeof result).toBe('object')
})
