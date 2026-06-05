import { vi, test, expect, afterAll } from 'vitest'

// The submit-lead action triggers the leads afterChange hook which sends email;
// mock it so tests don't depend on Resend.
vi.mock('../../src/lib/email', () => ({
  sendLeadEmail: vi.fn().mockResolvedValue(undefined),
}))

import { submitLead } from '../../src/app/(frontend)/actions/submit-lead'
import { getPayloadClient } from '../../src/lib/payload'

const RUN = Date.now()

function fd(entries: Record<string, string>): FormData {
  const f = new FormData()
  for (const [k, v] of Object.entries(entries)) f.append(k, v)
  return f
}

async function countLeads(name: string): Promise<number> {
  const p = await getPayloadClient()
  const res = await p.find({
    collection: 'leads',
    where: { name: { equals: name } },
    limit: 0,
    overrideAccess: true,
  })
  return res.totalDocs
}

test('valid submission creates a lead and returns ok', async () => {
  const name = `Action-${RUN}`
  const result = await submitLead(fd({ name, phone: '+40 712 345 678', source: '/contact' }))
  expect(result.ok).toBe(true)
  expect(await countLeads(name)).toBe(1)
}, 30000)

test('invalid submission returns field errors and creates nothing', async () => {
  const name = `Bad-${RUN}` // too-short phone
  const result = await submitLead(fd({ name, phone: '12', source: '/contact' }))
  expect(result.ok).toBe(false)
  if (result.ok === false) {
    expect(result.errors.phone).toBeTruthy()
  }
  expect(await countLeads(name)).toBe(0)
}, 30000)

test('honeypot-filled submission returns ok but creates NOTHING', async () => {
  const name = `Bot-${RUN}`
  const result = await submitLead(
    fd({ name, phone: '+40712345678', source: '/contact', company: 'spam-corp' }),
  )
  expect(result.ok).toBe(true)
  expect(await countLeads(name)).toBe(0)
}, 30000)

afterAll(async () => {
  const p = await getPayloadClient()
  await p
    .delete({ collection: 'leads', where: { name: { like: `%-${RUN}` } }, overrideAccess: true })
    .catch(() => undefined)
}, 30000)
