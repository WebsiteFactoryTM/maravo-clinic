import { getPayloadClient } from '../../src/lib/payload'
import { test, expect, afterAll } from 'vitest'

const RUN = Date.now()
let leadId: number | undefined
let postId: number | undefined

// ── Leads access control ───────────────────────────────────────────────────────

test('public (no user) can create a lead', async () => {
  const p = await getPayloadClient()
  const lead = await p.create({
    collection: 'leads',
    data: { name: `Ana-${RUN}`, phone: '0700', source: '/contact' },
    overrideAccess: false,
    // no req.user → create: () => true should allow this
  })
  leadId = lead.id
  expect(lead.name).toBe(`Ana-${RUN}`)
}, 30000)

test('reading leads without a user is denied', async () => {
  const p = await getPayloadClient()
  // Payload 3.x with overrideAccess:false and no user: read: ({ req }) => !!req.user
  // returns false → Payload throws a Forbidden error (status 403, class "Forbidden")
  await expect(
    p.find({ collection: 'leads', overrideAccess: false }),
  ).rejects.toMatchObject({ status: 403, name: 'Forbidden' })
}, 30000)

// ── Posts slug auto-generation ────────────────────────────────────────────────

test('creating a post auto-generates slug from title', async () => {
  const p = await getPayloadClient()
  const post = await p.create({
    collection: 'posts',
    data: { title: `Test Post ${RUN}` },
  })
  postId = post.id
  expect(post.slug).toBe(`test-post-${RUN}`)
}, 30000)

test('post explicit slug is kept as-is', async () => {
  const p = await getPayloadClient()
  const post = await p.create({
    collection: 'posts',
    data: { title: `Another Post ${RUN}`, slug: `custom-slug-${RUN}` },
  })
  expect(post.slug).toBe(`custom-slug-${RUN}`)
  await p.delete({ collection: 'posts', id: post.id })
}, 30000)

// ── Cleanup ───────────────────────────────────────────────────────────────────

afterAll(async () => {
  const p = await getPayloadClient()
  if (leadId) await p.delete({ collection: 'leads', id: leadId }).catch(() => undefined)
  if (postId) await p.delete({ collection: 'posts', id: postId }).catch(() => undefined)
}, 30000)
