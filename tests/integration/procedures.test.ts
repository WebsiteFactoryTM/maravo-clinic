import { getPayloadClient } from '../../src/lib/payload'
import { test, expect, afterAll, beforeAll } from 'vitest'

// IDs collected during the test run so we can clean up in afterAll.
// Payload's postgres adapter uses numeric IDs.
const ids: { cat?: number; eq?: number; proc?: number } = {}

// Use a unique suffix so re-runs don't clash on the unique slug constraint.
const RUN = Date.now()

// ─── Setup ────────────────────────────────────────────────────────────────────
beforeAll(async () => {
  // Clean up any stale records from previous failed runs.
  const p = await getPayloadClient()
  const staleProcs = await p.find({
    collection: 'procedures',
    where: { title: { contains: 'sync-test-' } },
    limit: 100,
  })
  for (const doc of staleProcs.docs) await p.delete({ collection: 'procedures', id: doc.id })

  const staleEqs = await p.find({
    collection: 'equipment',
    where: { name: { contains: 'sync-test-' } },
    limit: 100,
  })
  for (const doc of staleEqs.docs) await p.delete({ collection: 'equipment', id: doc.id })

  const staleCats = await p.find({
    collection: 'categories',
    where: { name: { contains: 'sync-test-' } },
    limit: 100,
  })
  for (const doc of staleCats.docs) await p.delete({ collection: 'categories', id: doc.id })
}, 30000)

// ─── Test 1: Forward direction ────────────────────────────────────────────────
// Link equipment from a procedure → the equipment's relatedProcedures should
// automatically gain the procedure id via the syncRelationship hook.
test('linking equipment from procedure mirrors onto equipment', async () => {
  const p = await getPayloadClient()

  const cat = await p.create({
    collection: 'categories',
    data: { name: `sync-test-cat-${RUN}` },
  })
  ids.cat = cat.id

  const eq = await p.create({
    collection: 'equipment',
    data: { name: `sync-test-eq-${RUN}` },
  })
  ids.eq = eq.id

  const proc = await p.create({
    collection: 'procedures',
    data: {
      title: `sync-test-proc-${RUN}`,
      category: cat.id,
      excerpt: 'x',
      relatedEquipment: [eq.id],
      status: 'published',
    },
  })
  ids.proc = proc.id

  const eqAfter = await p.findByID({ collection: 'equipment', id: eq.id, depth: 0 })
  const procIds = ((eqAfter as any).relatedProcedures ?? []).map((r: any) =>
    typeof r === 'object' ? r.id : r,
  )
  expect(procIds).toContain(proc.id)
}, 30000)

// ─── Test 2: Reverse direction ────────────────────────────────────────────────
// Link a procedure from equipment → the procedure's relatedEquipment should
// automatically gain the equipment id.
test('linking procedure from equipment mirrors onto procedure', async () => {
  const p = await getPayloadClient()

  // Re-use category from test 1 (vitest runs tests sequentially within a file).
  const catId = ids.cat!

  const proc2 = await p.create({
    collection: 'procedures',
    data: {
      title: `sync-test-proc2-${RUN}`,
      category: catId,
      excerpt: 'Rejuvenare facială',
      status: 'published',
    },
  })

  const eq2 = await p.create({
    collection: 'equipment',
    data: { name: `sync-test-eq2-${RUN}`, relatedProcedures: [proc2.id] },
  })

  const procAfter = await p.findByID({ collection: 'procedures', id: proc2.id, depth: 0 })
  const eqIds = ((procAfter as any).relatedEquipment ?? []).map((r: any) =>
    typeof r === 'object' ? r.id : r,
  )
  expect(eqIds).toContain(eq2.id)

  // Clean up records created only in this test.
  await p.delete({ collection: 'equipment', id: eq2.id })
  await p.delete({ collection: 'procedures', id: proc2.id })
}, 30000)

// ─── Test 3: Removal sync ─────────────────────────────────────────────────────
// Removing the link from one side should remove the mirror on the other side.
test('removing equipment link from procedure removes mirror on equipment', async () => {
  const p = await getPayloadClient()

  if (!ids.proc || !ids.eq) {
    throw new Error('Test 1 must run first to populate ids')
  }

  // Confirm the link still exists (from test 1).
  const eqBefore = await p.findByID({ collection: 'equipment', id: ids.eq, depth: 0 })
  const procIdsBefore = ((eqBefore as any).relatedProcedures ?? []).map((r: any) =>
    typeof r === 'object' ? r.id : r,
  )
  expect(procIdsBefore).toContain(ids.proc)

  // Remove the equipment link from the procedure.
  await p.update({
    collection: 'procedures',
    id: ids.proc,
    data: { relatedEquipment: [] },
  })

  // The equipment's relatedProcedures should no longer contain the procedure.
  const eqAfter = await p.findByID({ collection: 'equipment', id: ids.eq, depth: 0 })
  const procIdsAfter = ((eqAfter as any).relatedProcedures ?? []).map((r: any) =>
    typeof r === 'object' ? r.id : r,
  )
  expect(procIdsAfter).not.toContain(ids.proc)
}, 30000)

// ─── Cleanup ──────────────────────────────────────────────────────────────────
afterAll(async () => {
  const p = await getPayloadClient()
  const toDelete: Array<['procedures' | 'equipment' | 'categories', number | undefined]> = [
    ['procedures', ids.proc],
    ['equipment', ids.eq],
    ['categories', ids.cat],
  ]
  for (const [collection, id] of toDelete) {
    if (id) await p.delete({ collection, id }).catch(() => undefined)
  }
}, 30000)
