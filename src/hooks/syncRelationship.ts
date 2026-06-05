import type { CollectionAfterChangeHook } from 'payload'

/**
 * Keep a two-way relationship in sync.
 *
 * thisField: relation field on the current doc
 * otherCollection + otherField: the mirror field on the other side
 *
 * Recursion guard: we stamp `req.context.skipSync = true` on the current req
 * *before* calling `req.payload.update()` and forward the same req.  This
 * means the mirror's afterChange hook sees `req.context.skipSync === true` on
 * the SAME req object and returns early — no new transaction, no deadlock, no
 * infinite loop.
 */
export function syncRelationship(opts: {
  thisField: string
  otherCollection: string
  otherField: string
}): CollectionAfterChangeHook {
  return async ({ doc, previousDoc, req }) => {
    // Guard: if we are already in a sync-triggered update, bail out.
    if (req.context?.skipSync) return doc

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

    // Stamp the guard on the current req so the mirror's afterChange hook sees
    // it when we re-use this same req for the nested update call.
    req.context = { ...req.context, skipSync: true }

    const apply = async (id: string, present: boolean): Promise<void> => {
      let other: Record<string, unknown>
      try {
        other = (await req.payload.findByID({
          collection: opts.otherCollection as Parameters<typeof req.payload.findByID>[0]['collection'],
          id,
          req,
          depth: 0,
        })) as unknown as Record<string, unknown>
      } catch {
        // The other doc was deleted or doesn't exist — skip silently.
        return
      }

      const cur: string[] = (
        (other[opts.otherField] as unknown[] | undefined) ?? []
      ).map(toId)

      const next = present
        ? Array.from(new Set([...cur, doc.id as string]))
        : cur.filter((x) => x !== (doc.id as string))

      if (next.length !== cur.length) {
        await req.payload.update({
          collection: opts.otherCollection as Parameters<typeof req.payload.update>[0]['collection'],
          id,
          // Forward the same req so we share the existing transaction and the
          // skipSync flag is already set on req.context.
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
