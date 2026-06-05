import { getPayloadClient } from '../../src/lib/payload'
import { test, expect } from 'vitest'

test('payload boots and exposes collections', async () => {
  const payload = await getPayloadClient()
  expect(payload.collections).toHaveProperty('users')
  expect(payload.collections).toHaveProperty('media')
})
