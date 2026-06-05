import { test, expect, type Page, type ConsoleMessage } from '@playwright/test'

/**
 * E2E smoke test across the key public routes.
 *
 * For each route we assert:
 *  - the page responds with HTTP 200
 *  - exactly one visible <h1>
 *  - no console errors / pageerrors on load
 *
 * Base URL comes from the Playwright config (PLAYWRIGHT_BASE_URL env or
 * http://localhost:3000), so these tests work against dev or a prod server.
 */

const ROUTES = [
  '/',
  '/proceduri',
  '/proceduri/injectabile/injectare-acid-hialuronic-buze',
  '/aparatura',
  '/aparatura/clarity-ii',
  '/tarife',
  '/despre',
  '/blog',
  '/contact',
] as const

/** Benign messages we don't want to fail the build over. */
function isBenign(text: string): boolean {
  return (
    text.includes('extensions') ||
    text.includes('favicon') ||
    text.includes('net::ERR') ||
    // React DevTools suggestion, hydration dev warnings from 3rd parties, etc.
    text.includes('Download the React DevTools')
  )
}

function collectErrors(page: Page): string[] {
  const errors: string[] = []
  page.on('console', (msg: ConsoleMessage) => {
    if (msg.type() === 'error' && !isBenign(msg.text())) errors.push(`console: ${msg.text()}`)
  })
  page.on('pageerror', (err) => {
    if (!isBenign(err.message)) errors.push(`pageerror: ${err.message}`)
  })
  return errors
}

for (const route of ROUTES) {
  test(`smoke: ${route} loads with a single h1 and no console errors`, async ({ page }) => {
    const errors = collectErrors(page)

    const response = await page.goto(route, { waitUntil: 'domcontentloaded' })
    expect(response, `no response for ${route}`).not.toBeNull()
    expect(response!.status(), `unexpected status for ${route}`).toBe(200)

    // Exactly one visible <h1>.
    const h1 = page.locator('h1')
    await expect(h1).toHaveCount(1)
    await expect(h1).toBeVisible()
    expect((await h1.innerText()).trim().length).toBeGreaterThan(0)

    // Give hydration a moment to surface any client-side errors.
    await page.waitForTimeout(1500)
    expect(errors, `console errors on ${route}:\n${errors.join('\n')}`).toEqual([])
  })
}

test.describe('contact lead form', () => {
  test('submits successfully and shows the success message', async ({ page }) => {
    await page.goto('/contact', { waitUntil: 'domcontentloaded' })

    const form = page.locator('form.lead-form')
    await expect(form).toBeVisible()

    await form.locator('input[name="name"]').fill('Test Smoke')
    await form.locator('input[name="phone"]').fill('+40712345678')

    await form.locator('button[type="submit"]').click()

    // Server action returns the success panel (role="status").
    const success = page.locator('.lead-form__success')
    await expect(success).toBeVisible({ timeout: 15_000 })
    await expect(success).toContainText('Vă mulțumim')
  })

  test('validates required fields on empty submit', async ({ page }) => {
    await page.goto('/contact', { waitUntil: 'domcontentloaded' })

    const form = page.locator('form.lead-form')
    await expect(form).toBeVisible()

    // The form uses noValidate, so an empty submit reaches the server action,
    // which returns field errors rather than the success panel.
    await form.locator('button[type="submit"]').click()

    await expect(page.locator('.lead-form__error').first()).toBeVisible({ timeout: 15_000 })
    await expect(page.locator('.lead-form__success')).toHaveCount(0)
  })
})
