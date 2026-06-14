import { test, expect } from '@playwright/test'

test.describe('UX overhaul — sitewide', () => {
  test('header shows logo only, no wordmark text', async ({ page }) => {
    await page.goto('/')
    const logo = page.locator('a.nav-logo img')
    await expect(logo).toBeVisible()
    // The "Clinic · Timișoara" wordmark must be gone.
    await expect(page.locator('.nav-wordmark')).toHaveCount(0)
  })

  test('floating WhatsApp button is present and links to wa.me', async ({ page }) => {
    await page.goto('/')
    const fab = page.locator('a.wa-fab')
    await expect(fab).toBeVisible()
    await expect(fab).toHaveAttribute('href', /wa\.me\/40775393323/)
    await expect(fab).toHaveAttribute('aria-label', /WhatsApp/i)
  })

  test('footer renders social icon links', async ({ page }) => {
    await page.goto('/')
    const fb = page.locator('.footer-socials a[aria-label="Facebook"]')
    await expect(fb).toHaveAttribute('href', /facebook\.com\/DrCristianaVoinescu/)
    await expect(page.locator('.footer-socials a[aria-label="Instagram"]')).toBeVisible()
    await expect(page.locator('.footer-socials a[aria-label="TikTok"]')).toBeVisible()
  })
})
