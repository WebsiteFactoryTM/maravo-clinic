import { revalidatePath } from 'next/cache'
import type { CollectionAfterChangeHook, GlobalAfterChangeHook } from 'payload'

/**
 * Safely calls revalidatePath. When Payload hooks fire outside a Next.js
 * request context (e.g. seed script, integration tests, Local API), the
 * Next.js static-generation store is not initialised and revalidatePath
 * throws an invariant error. We silently swallow it here so those paths
 * remain safe.
 */
function safeRevalidate(path: string): void {
  try {
    revalidatePath(path)
  } catch {
    // Not in a Next.js request context (seed / test / CLI) — ignore.
  }
}

// ─── Collection hooks ──────────────────────────────────────────────────────────

/**
 * Revalidate after a procedure is saved.
 *
 * Always revalidates `/` and `/proceduri`.
 * When the category is populated (depth ≥ 1) also revalidates the category
 * listing page and the procedure detail page.
 * When category is a bare ID (depth 0), skips the category-specific paths
 * to avoid a DB lookup — `/proceduri` is revalidated anyway so the listing
 * stays fresh.
 */
export const revalidateProcedure: CollectionAfterChangeHook = ({ doc }) => {
  safeRevalidate('/')
  safeRevalidate('/proceduri')

  const cat = doc.category as { slug?: string } | string | number | null | undefined
  if (cat && typeof cat === 'object' && cat.slug) {
    safeRevalidate(`/proceduri/${cat.slug}`)
    const docSlug = doc.slug as string | undefined
    if (docSlug) {
      safeRevalidate(`/proceduri/${cat.slug}/${docSlug}`)
    }
  }

  return doc
}

/**
 * Revalidate after equipment is saved.
 */
export const revalidateEquipment: CollectionAfterChangeHook = ({ doc }) => {
  safeRevalidate('/')
  safeRevalidate('/aparatura')
  const slug = doc.slug as string | undefined
  if (slug) safeRevalidate(`/aparatura/${slug}`)
  return doc
}

/**
 * Revalidate after a blog post is saved.
 */
export const revalidatePost: CollectionAfterChangeHook = ({ doc }) => {
  safeRevalidate('/')
  safeRevalidate('/blog')
  const slug = doc.slug as string | undefined
  if (slug) safeRevalidate(`/blog/${slug}`)
  return doc
}

/**
 * Revalidate after a category is saved.
 * The category listing and its own slug-based listing page are revalidated.
 */
export const revalidateCategory: CollectionAfterChangeHook = ({ doc }) => {
  safeRevalidate('/proceduri')
  const slug = doc.slug as string | undefined
  if (slug) safeRevalidate(`/proceduri/${slug}`)
  return doc
}

// ─── Global hooks ──────────────────────────────────────────────────────────────

/**
 * Revalidate after site-settings are saved.
 * Site-settings affect the header/footer across all pages, so we revalidate
 * the home page and the main section entry points.
 */
export const revalidateSiteSettings: GlobalAfterChangeHook = ({ doc }) => {
  safeRevalidate('/')
  safeRevalidate('/proceduri')
  safeRevalidate('/aparatura')
  safeRevalidate('/contact')
  return doc
}

/**
 * Revalidate after the homepage global is saved.
 */
export const revalidateHomepage: GlobalAfterChangeHook = ({ doc }) => {
  safeRevalidate('/')
  return doc
}

/**
 * Revalidate after navigation is saved.
 * Navigation appears on every page; revalidating `/` is sufficient for ISR
 * because the layout is shared.
 */
export const revalidateNavigation: GlobalAfterChangeHook = ({ doc }) => {
  safeRevalidate('/')
  return doc
}
