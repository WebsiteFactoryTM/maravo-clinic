// tests/e2e/canonical.e2e.spec.ts
import { test, expect } from '@playwright/test'

const BASE = 'http://localhost:3000'

// Locks the fix for the bug where static pages inherited the homepage canonical.
const STATIC_PAGES = ['/despre', '/contact', '/proceduri', '/aparatura', '/tarife', '/blog']

for (const path of STATIC_PAGES) {
  test(`canonical for ${path} is self-referential, not the homepage`, async ({ page }) => {
    await page.goto(`${BASE}${path}`)
    const href = await page.locator('link[rel="canonical"]').getAttribute('href')
    expect(href, `canonical missing on ${path}`).toBeTruthy()
    expect(href!.endsWith(path), `canonical for ${path} was ${href}`).toBe(true)
  })
}
