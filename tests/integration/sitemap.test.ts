import { test, expect } from 'vitest'
import sitemap from '../../src/app/sitemap'

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

test('sitemap returns static + dynamic entries with absolute URLs', async () => {
  const entries = await sitemap()

  // 7 static routes + at least 34 published procedures.
  expect(entries.length).toBeGreaterThanOrEqual(7 + 34)

  // Every URL must be absolute (start with the configured base).
  for (const entry of entries) {
    expect(entry.url.startsWith(BASE)).toBe(true)
  }

  const urls = entries.map((e) => e.url)

  // Static routes present.
  for (const path of ['/', '/proceduri', '/aparatura', '/tarife', '/despre', '/blog', '/contact']) {
    expect(urls).toContain(`${BASE}${path}`)
  }
}, 30000)

test('sitemap dynamic entries carry a lastModified date', async () => {
  const entries = await sitemap()
  const procEntries = entries.filter((e) => /\/proceduri\/[^/]+\/[^/]+$/.test(e.url))
  expect(procEntries.length).toBeGreaterThan(0)
  // At least one procedure entry has a lastModified value.
  expect(procEntries.some((e) => e.lastModified != null)).toBe(true)
}, 30000)
