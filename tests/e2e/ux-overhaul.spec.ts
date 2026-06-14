import { test, expect } from '@playwright/test'

test.describe('UX overhaul — sitewide', () => {
  test('header shows logo only, no wordmark text', async ({ page }) => {
    await page.goto('/')
    const logo = page.locator('a.nav-logo img')
    await expect(logo).toBeVisible()
    // The "Clinic · Timișoara" wordmark must be gone.
    await expect(page.locator('.nav-wordmark')).toHaveCount(0)
  })
})
