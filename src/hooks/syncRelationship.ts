import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'
import { NotFound } from 'payload'

/**
 * Keep a two-way relationship in sync.
 *
 * thisField: relation field on the current doc
 * otherCollection + otherField: the mirror field on the other side
 *
 * Recursion guard: we use a per-request Set (`req.context.skipSyncIds`) of
 * document IDs that are currently being written as a mirror update.  Before
 * issuing `req.payload.update()` for a counterpart doc we add *that* doc's id
 * to the set so its triggered afterChange hook returns early.  The current
 * doc's id is never pre-seeded, so normal edits (including bulk operations
 * where the same req is reused across many docs) always proceed correctly.
 */
export function syncRelationship(opts: {
  thisField: string
  otherCollection: string
  otherField: string
}): CollectionAfterChangeHook {
  return async ({ doc, previousDoc, req }) => {
    // Guard: if this doc was written as a mirror-update by our own hook, skip.
    const skipIds = req.context?.skipSyncIds as Set<string | number> | undefined
    if (skipIds?.has(doc.id)) return doc

    const toId = (v: unknown): string =>
      typeof v === 'object' && v !== null ? (v as { id: string }).id : (v as string)

    const now: string[] = (
      (doc[opts.thisField] as unknown[] | undefined) ?? []
    ).map(toId)

    const before: string[] = (
      (previousDoc?.[opts.thisField] as unknown[] | undefined) ?? []
    ).map(toId)

    const added = now.filter((id) => !before.includes(id))
    const removed = before.filter((id) => !now.includes(id))

    if (added.length === 0 && removed.length === 0) return doc

    const apply = async (id: string, present: boolean): Promise<void> => {
      let other: Record<string, unknown>
      try {
        other = (await req.payload.findByID({
          collection: opts.otherCollection as Parameters<typeof req.payload.findByID>[0]['collection'],
          id,
          req,
          depth: 0,
        })) as unknown as Record<string, unknown>
      } catch (err) {
        // Only swallow genuine not-found errors; rethrow everything else.
        if (err instanceof NotFound || (err as { status?: number }).status === 404) {
          return
        }
        req.payload.logger.error(err, 'syncRelationship: unexpected error in findByID')
        throw err
      }

      const cur: string[] = (
        (other[opts.otherField] as unknown[] | undefined) ?? []
      ).map(toId)

      // Dedupe cur before comparing lengths so a stale duplicate never causes
      // a false "no change" result.
      const curUnique = Array.from(new Set(cur))

      const next = present
        ? Array.from(new Set([...curUnique, doc.id as string]))
        : curUnique.filter((x) => x !== (doc.id as string))

      if (next.length !== curUnique.length) {
        // Mark the counterpart id in the shared skip-set so its afterChange
        // hook returns early — preventing recursion while still allowing every
        // other doc in a bulk operation to be synced.
        const skip = (req.context.skipSyncIds ??= new Set()) as Set<string | number>
        skip.add(id)

        await req.payload.update({
          collection: opts.otherCollection as Parameters<typeof req.payload.update>[0]['collection'],
          id,
          // Forward the same req so we share the existing transaction and the
          // skipSyncIds set is visible to the counterpart hook.
          req,
          data: { [opts.otherField]: next } as Parameters<typeof req.payload.update>[0]['data'],
          depth: 0,
        })
      }
    }

    await Promise.all([
      ...added.map((id) => apply(id, true)),
      ...removed.map((id) => apply(id, false)),
    ])

    return doc
  }
}

/**
 * Remove a deleted document's id from the mirror field of every counterpart.
 *
 * Wire this as an `afterDelete` hook on both sides of the relationship so
 * deletes don't leave dangling IDs in the other collection.
 *
 * thisField:      the relation field on the doc being deleted (lists counterpart ids)
 * otherCollection + otherField: the mirror field on the other side
 */
export function cleanupRelationshipOnDelete(opts: {
  thisField: string
  otherCollection: string
  otherField: string
}): CollectionAfterDeleteHook {
  return async ({ doc, req }) => {
    const toId = (v: unknown): string =>
      typeof v === 'object' && v !== null ? (v as { id: string }).id : (v as string)

    const counterpartIds: string[] = (
      (doc[opts.thisField] as unknown[] | undefined) ?? []
    ).map(toId)

    if (counterpartIds.length === 0) return

    const deletedId = doc.id as string | number

    for (const cpId of counterpartIds) {
      let other: Record<string, unknown>
      try {
        other = (await req.payload.findByID({
          collection: opts.otherCollection as Parameters<typeof req.payload.findByID>[0]['collection'],
          id: cpId,
          req,
          depth: 0,
        })) as unknown as Record<string, unknown>
      } catch (err) {
        if (err instanceof NotFound || (err as { status?: number }).status === 404) {
          continue
        }
        req.payload.logger.error(err, 'cleanupRelationshipOnDelete: unexpected error in findByID')
        throw err
      }

      const cur: string[] = (
        (other[opts.otherField] as unknown[] | undefined) ?? []
      ).map(toId)

      const next = cur.filter((x) => String(x) !== String(deletedId))

      if (next.length !== cur.length) {
        // afterDelete doesn't trigger afterChange on the counterpart, but
        // add to skipSyncIds anyway as a defensive guard in case hook order
        // ever changes.
        const skip = (req.context.skipSyncIds ??= new Set()) as Set<string | number>
        skip.add(cpId)

        await req.payload.update({
          collection: opts.otherCollection as Parameters<typeof req.payload.update>[0]['collection'],
          id: cpId,
          req,
          data: { [opts.otherField]: next } as Parameters<typeof req.payload.update>[0]['data'],
          depth: 0,
        })
      }
    }
  }
}
