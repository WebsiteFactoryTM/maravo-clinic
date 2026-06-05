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

// ─── Test 4: afterDelete cleanup — procedure deleted, equipment cleaned ────────
// Fix 2: deleting a procedure must remove its id from all linked equipment's
// relatedProcedures array so no dangling IDs are left behind.
test('deleting a procedure removes it from linked equipment relatedProcedures', async () => {
  const p = await getPayloadClient()
  const catId = ids.cat!

  const eq = await p.create({
    collection: 'equipment',
    data: { name: `sync-test-del-eq-${RUN}` },
  })

  const proc = await p.create({
    collection: 'procedures',
    data: {
      title: `sync-test-del-proc-${RUN}`,
      category: catId,
      excerpt: 'delete test',
      relatedEquipment: [eq.id],
      status: 'published',
    },
  })

  // Verify the mirror was written.
  const eqLinked = await p.findByID({ collection: 'equipment', id: eq.id, depth: 0 })
  const linkedBefore = ((eqLinked as any).relatedProcedures ?? []).map((r: any) =>
    typeof r === 'object' ? r.id : r,
  )
  expect(linkedBefore).toContain(proc.id)

  // Delete the procedure — afterDelete cleanup hook should fire.
  await p.delete({ collection: 'procedures', id: proc.id })

  // The equipment should no longer list the deleted procedure.
  const eqAfter = await p.findByID({ collection: 'equipment', id: eq.id, depth: 0 })
  const linkedAfter = ((eqAfter as any).relatedProcedures ?? []).map((r: any) =>
    typeof r === 'object' ? r.id : r,
  )
  expect(linkedAfter).not.toContain(proc.id)

  // Clean up.
  await p.delete({ collection: 'equipment', id: eq.id })
}, 30000)

// ─── Test 5: afterDelete cleanup — equipment deleted, procedure cleaned ────────
// Fix 2 (reverse): deleting equipment must remove its id from all linked
// procedures' relatedEquipment array.
test('deleting equipment removes it from linked procedure relatedEquipment', async () => {
  const p = await getPayloadClient()
  const catId = ids.cat!

  const proc = await p.create({
    collection: 'procedures',
    data: {
      title: `sync-test-del-proc2-${RUN}`,
      category: catId,
      excerpt: 'delete test reverse',
      status: 'published',
    },
  })

  const eq = await p.create({
    collection: 'equipment',
    data: { name: `sync-test-del-eq2-${RUN}`, relatedProcedures: [proc.id] },
  })

  // Verify the mirror was written.
  const procLinked = await p.findByID({ collection: 'procedures', id: proc.id, depth: 0 })
  const linkedBefore = ((procLinked as any).relatedEquipment ?? []).map((r: any) =>
    typeof r === 'object' ? r.id : r,
  )
  expect(linkedBefore).toContain(eq.id)

  // Delete the equipment — afterDelete cleanup hook should fire.
  await p.delete({ collection: 'equipment', id: eq.id })

  // The procedure should no longer list the deleted equipment.
  const procAfter = await p.findByID({ collection: 'procedures', id: proc.id, depth: 0 })
  const linkedAfter = ((procAfter as any).relatedEquipment ?? []).map((r: any) =>
    typeof r === 'object' ? r.id : r,
  )
  expect(linkedAfter).not.toContain(eq.id)

  // Clean up.
  await p.delete({ collection: 'procedures', id: proc.id })
}, 30000)

// ─── Test 6: per-doc skip-set (Fix 1) — bulk-style sequential updates ─────────
// Verifies that the per-doc Set guard doesn't permanently block sync across
// multiple documents updated within the same intent.
//
// The Payload Local API does NOT reuse a single req across separate p.update()
// calls the way the REST bulk-where endpoint does, so we cannot reproduce the
// exact admin-bulk-edit path here.  Instead we simulate the shared-req scenario
// directly: we construct a shared req object and call p.update twice with it,
// confirming the second update's sync still fires even though the first one
// added entries to req.context.skipSyncIds.
//
// This directly exercises the regression: with the old boolean flag
// (req.context.skipSync = true), the second update's hook would see the flag
// and skip.  With the per-id Set, only the id added by the first mirror-write
// is suppressed; the second doc (different id) is not in the set and proceeds.
test('per-doc skip-set: second bulk update syncs even after first sets skipSyncIds', async () => {
  const p = await getPayloadClient()
  const catId = ids.cat!

  // Create two equipment items (no procedures linked yet).
  const eq1 = await p.create({
    collection: 'equipment',
    data: { name: `sync-test-bulk-eq1-${RUN}` },
  })
  const eq2 = await p.create({
    collection: 'equipment',
    data: { name: `sync-test-bulk-eq2-${RUN}` },
  })

  // Create two procedures (no equipment linked yet).
  const proc1 = await p.create({
    collection: 'procedures',
    data: {
      title: `sync-test-bulk-proc1-${RUN}`,
      category: catId,
      excerpt: 'bulk test 1',
      status: 'published',
    },
  })
  const proc2 = await p.create({
    collection: 'procedures',
    data: {
      title: `sync-test-bulk-proc2-${RUN}`,
      category: catId,
      excerpt: 'bulk test 2',
      status: 'published',
    },
  })

  // Simulate a shared req (as the admin bulk-edit endpoint would reuse).
  // We obtain a real req by using the Payload Local API internals pattern:
  // Payload's local API accepts an optional `req` on every operation; if we
  // pass the same context object across two updates, the skipSyncIds Set is
  // shared — exactly like the bulk endpoint.
  const sharedContext: Record<string, unknown> = {}

  // First update: link proc1 → eq1.  This will write eq1's mirror and add
  // eq1.id to sharedContext.skipSyncIds.
  await p.update({
    collection: 'procedures',
    id: proc1.id,
    data: { relatedEquipment: [eq1.id] },
    context: sharedContext,
  })

  // Second update: link proc2 → eq2, reusing the same context.
  // With the old boolean guard this would be skipped; with the per-id Set it
  // must proceed because proc2.id is not in the set.
  await p.update({
    collection: 'procedures',
    id: proc2.id,
    data: { relatedEquipment: [eq2.id] },
    context: sharedContext,
  })

  // Both equipment items must now have their respective procedure mirrored.
  const eq1After = await p.findByID({ collection: 'equipment', id: eq1.id, depth: 0 })
  const eq1ProcIds = ((eq1After as any).relatedProcedures ?? []).map((r: any) =>
    typeof r === 'object' ? r.id : r,
  )
  expect(eq1ProcIds).toContain(proc1.id)

  const eq2After = await p.findByID({ collection: 'equipment', id: eq2.id, depth: 0 })
  const eq2ProcIds = ((eq2After as any).relatedProcedures ?? []).map((r: any) =>
    typeof r === 'object' ? r.id : r,
  )
  expect(eq2ProcIds).toContain(proc2.id)

  // Clean up.
  await p.delete({ collection: 'procedures', id: proc1.id })
  await p.delete({ collection: 'procedures', id: proc2.id })
  await p.delete({ collection: 'equipment', id: eq1.id })
  await p.delete({ collection: 'equipment', id: eq2.id })
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
