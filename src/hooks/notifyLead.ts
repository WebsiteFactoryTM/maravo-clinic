import type { CollectionAfterChangeHook } from 'payload'
import type { Procedure } from '../payload-types'
import { sendLeadEmail } from '../lib/email'

/**
 * Resolve the procedure title when the relationship was populated (depth ≥ 1).
 * When it is a bare id (or absent) we omit the title rather than do an extra
 * DB lookup — the lead doc already references it by id for the admin.
 */
function resolveProcedureTitle(
  procedureInterest: (number | null) | Procedure | undefined,
): string | undefined {
  if (procedureInterest && typeof procedureInterest === 'object') {
    return procedureInterest.title ?? undefined
  }
  return undefined
}

/**
 * afterChange hook for the `leads` collection.
 *
 * On `create` it sends a notification email about the new lead. `sendLeadEmail`
 * never throws (it catches its own errors), but we additionally guard here so a
 * failed notification can never break lead creation. Updates are ignored — we
 * only notify when a new lead arrives.
 */
export const notifyLead: CollectionAfterChangeHook = async ({ doc, operation }) => {
  if (operation !== 'create') return doc

  try {
    await sendLeadEmail({
      name: doc.name,
      phone: doc.phone,
      email: doc.email ?? undefined,
      message: doc.message ?? undefined,
      procedureTitle: resolveProcedureTitle(doc.procedureInterest),
      source: doc.source ?? undefined,
    })
  } catch (err) {
    console.error('[lead] notifyLead hook error (ignored):', err)
  }

  return doc
}
