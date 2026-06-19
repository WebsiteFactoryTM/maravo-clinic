import { NextResponse } from 'next/server'
import { buildSearchIndex } from '@/lib/searchIndex'

/**
 * GET /api/search — returns the full slim search index as JSON.
 * Fetched once (lazily) by the header SearchModal, then filtered client-side.
 * Cached for an hour; revalidated on content publish via the same hooks that
 * revalidate the rest of the site.
 */
export const revalidate = 3600

export async function GET() {
  const items = await buildSearchIndex()
  return NextResponse.json({ items })
}
