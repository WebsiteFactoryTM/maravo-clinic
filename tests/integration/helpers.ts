import type { Payload } from 'payload'
import { getPayloadClient } from '../../src/lib/payload'

/** Returns the cached Payload client — boots Payload on first call. */
export async function withPayload(): Promise<Payload> {
  return getPayloadClient()
}

// Extract the Where type from Payload's find() signature so we don't depend on
// a non-public import path.
type PayloadWhere = NonNullable<Parameters<Payload['find']>[0]['where']>

/**
 * Deletes all documents in `collection` matching `where`.
 * Use in afterEach / afterAll to clean up records created during tests.
 */
export async function cleanup(collection: string, where: PayloadWhere): Promise<void> {
  const payload = await getPayloadClient()
  await payload.delete({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    collection: collection as any,
    where,
  })
}
