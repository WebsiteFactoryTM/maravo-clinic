/**
 * Server-only builder for the site-wide search index.
 *
 * Queries published procedures, equipment and posts from Payload and maps them
 * to the slim, serialisable `SearchItem[]` consumed by the client. Kept apart
 * from ./search (the pure, client-safe matching helpers) because it imports the
 * Payload client.
 */

import { getPayloadClient } from './payload'
import type { SearchItem } from './search'
import type { Procedure, Equipment, Post } from '@/payload-types'

export async function buildSearchIndex(): Promise<SearchItem[]> {
  const payload = await getPayloadClient()

  const [proceduresRaw, equipmentRaw, postsRaw] = await Promise.all([
    payload
      .find({
        collection: 'procedures',
        where: { status: { equals: 'published' } },
        limit: 0,
        depth: 1,
        select: { title: true, slug: true, excerpt: true, category: true },
      })
      .catch(() => ({ docs: [] as Procedure[] })),
    payload
      .find({
        collection: 'equipment',
        where: { status: { equals: 'published' } },
        limit: 0,
        select: { name: true, slug: true, purpose: true, manufacturer: true },
      })
      .catch(() => ({ docs: [] as Equipment[] })),
    payload
      .find({
        collection: 'posts',
        where: { status: { equals: 'published' } },
        limit: 0,
        select: { title: true, slug: true, excerpt: true, category: true },
      })
      .catch(() => ({ docs: [] as Post[] })),
  ])

  const items: SearchItem[] = []

  for (const proc of proceduresRaw.docs as Procedure[]) {
    if (!proc.slug) continue
    const cat = proc.category
    const catSlug =
      typeof cat === 'object' && cat !== null && 'slug' in cat && typeof cat.slug === 'string'
        ? cat.slug
        : null
    if (!catSlug) continue
    const catName =
      typeof cat === 'object' && cat !== null && 'name' in cat && typeof cat.name === 'string'
        ? cat.name
        : null
    items.push({
      id: `procedure-${proc.id}`,
      type: 'procedure',
      title: proc.title,
      url: `/proceduri/${catSlug}/${proc.slug}`,
      category: catName,
      excerpt: proc.excerpt ?? null,
    })
  }

  for (const eq of equipmentRaw.docs as Equipment[]) {
    if (!eq.slug) continue
    items.push({
      id: `equipment-${eq.id}`,
      type: 'equipment',
      title: eq.name,
      url: `/aparatura/${eq.slug}`,
      category: eq.manufacturer ?? null,
      excerpt: eq.purpose ?? null,
    })
  }

  for (const post of postsRaw.docs as Post[]) {
    if (!post.slug) continue
    items.push({
      id: `article-${post.id}`,
      type: 'article',
      title: post.title,
      url: `/blog/${post.slug}`,
      category: post.category ?? null,
      excerpt: post.excerpt ?? null,
    })
  }

  return items
}
