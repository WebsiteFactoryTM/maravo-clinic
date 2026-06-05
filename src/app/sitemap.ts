import type { MetadataRoute } from 'next'
import { getPayloadClient } from '@/lib/payload'
import type { Category } from '@/payload-types'

export const revalidate = 3600

function baseUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
}

function resolveCategory(cat: number | Category): Category | null {
  return typeof cat === 'number' ? null : cat
}

function toDate(value: string | null | undefined): Date | undefined {
  if (!value) return undefined
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? undefined : d
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = baseUrl()
  const entries: MetadataRoute.Sitemap = []

  // ── Static routes ────────────────────────────────────────────────────────
  const staticRoutes: Array<{
    path: string
    changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency']
    priority: number
  }> = [
    { path: '/', changeFrequency: 'weekly', priority: 1 },
    { path: '/proceduri', changeFrequency: 'weekly', priority: 0.9 },
    { path: '/aparatura', changeFrequency: 'monthly', priority: 0.7 },
    { path: '/tarife', changeFrequency: 'monthly', priority: 0.6 },
    { path: '/despre', changeFrequency: 'monthly', priority: 0.5 },
    { path: '/blog', changeFrequency: 'weekly', priority: 0.7 },
    { path: '/contact', changeFrequency: 'yearly', priority: 0.5 },
  ]
  for (const r of staticRoutes) {
    entries.push({
      url: `${base}${r.path}`,
      lastModified: new Date(),
      changeFrequency: r.changeFrequency,
      priority: r.priority,
    })
  }

  const payload = await getPayloadClient()

  // ── Categories ───────────────────────────────────────────────────────────
  const categories = await payload.find({
    collection: 'categories',
    limit: 0,
    depth: 0,
  })
  for (const cat of categories.docs) {
    if (!cat.slug) continue
    entries.push({
      url: `${base}/proceduri/${cat.slug}`,
      lastModified: toDate(cat.updatedAt),
      changeFrequency: 'monthly',
      priority: 0.6,
    })
  }

  // ── Published procedures ─────────────────────────────────────────────────
  const procedures = await payload.find({
    collection: 'procedures',
    where: { status: { equals: 'published' } },
    limit: 0,
    depth: 1,
  })
  for (const proc of procedures.docs) {
    if (!proc.slug) continue
    const cat = resolveCategory(proc.category)
    if (!cat?.slug) continue
    entries.push({
      url: `${base}/proceduri/${cat.slug}/${proc.slug}`,
      lastModified: toDate(proc.updatedAt),
      changeFrequency: 'monthly',
      priority: 0.8,
    })
  }

  // ── Published equipment ──────────────────────────────────────────────────
  const equipment = await payload.find({
    collection: 'equipment',
    where: { status: { equals: 'published' } },
    limit: 0,
    depth: 0,
  })
  for (const eq of equipment.docs) {
    if (!eq.slug) continue
    entries.push({
      url: `${base}/aparatura/${eq.slug}`,
      lastModified: toDate(eq.updatedAt),
      changeFrequency: 'monthly',
      priority: 0.6,
    })
  }

  // ── Published posts ──────────────────────────────────────────────────────
  const posts = await payload.find({
    collection: 'posts',
    where: { status: { equals: 'published' } },
    limit: 0,
    depth: 0,
  })
  for (const post of posts.docs) {
    if (!post.slug) continue
    entries.push({
      url: `${base}/blog/${post.slug}`,
      lastModified: toDate(post.updatedAt),
      changeFrequency: 'monthly',
      priority: 0.6,
    })
  }

  return entries
}
