import { vi, test, expect, afterAll, beforeEach } from 'vitest'

// Mock the email module BEFORE importing anything that transitively imports it
// (the Leads collection hook imports sendLeadEmail).
const sendLeadEmail = vi.fn<(lead: unknown) => Promise<void>>().mockResolvedValue(undefined)
vi.mock('../../src/lib/email', () => ({
  sendLeadEmail: (lead: unknown) => sendLeadEmail(lead),
}))

import { getPayloadClient } from '../../src/lib/payload'

const RUN = Date.now()
const createdIds: number[] = []

beforeEach(() => {
  sendLeadEmail.mockClear()
})

test('creating a lead fires sendLeadEmail exactly once with name & phone', async () => {
  const p = await getPayloadClient()
  const lead = await p.create({
    collection: 'leads',
    data: { name: `Notify-${RUN}`, phone: '+40 712 345 678', source: '/contact' },
    overrideAccess: true,
  })
  createdIds.push(lead.id)

  expect(sendLeadEmail).toHaveBeenCalledTimes(1)
  expect(sendLeadEmail).toHaveBeenCalledWith(
    expect.objectContaining({ name: `Notify-${RUN}`, phone: '+40 712 345 678' }),
  )
}, 30000)

test('updating a lead does NOT fire sendLeadEmail', async () => {
  const p = await getPayloadClient()
  const lead = await p.create({
    collection: 'leads',
    data: { name: `Update-${RUN}`, phone: '0712345678', source: '/contact' },
    overrideAccess: true,
  })
  createdIds.push(lead.id)
  expect(sendLeadEmail).toHaveBeenCalledTimes(1)

  await p.update({
    collection: 'leads',
    id: lead.id,
    data: { message: 'edited by admin' },
    overrideAccess: true,
  })

  // Still 1 — the update must not trigger another notification.
  expect(sendLeadEmail).toHaveBeenCalledTimes(1)
}, 30000)

afterAll(async () => {
  const p = await getPayloadClient()
  for (const id of createdIds) {
    await p.delete({ collection: 'leads', id }).catch(() => undefined)
  }
}, 30000)
