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
    // Number comes from CMS/env (siteInfo.whatsapp) — assert a wa.me deep link, not a fixed number.
    await expect(fab).toHaveAttribute('href', /wa\.me\/\d{6,}/)
    await expect(fab).toHaveAttribute('aria-label', /WhatsApp/i)
  })

  test('footer renders social icon links', async ({ page }) => {
    await page.goto('/')
    const fb = page.locator('.footer-socials a[aria-label="Facebook"]')
    await expect(fb).toHaveAttribute('href', /facebook\.com\/DrCristianaVoinescu/)
    await expect(page.locator('.footer-socials a[aria-label="Instagram"]')).toBeVisible()
    await expect(page.locator('.footer-socials a[aria-label="TikTok"]')).toBeVisible()
  })

  test('contact page shows a map embed and socials', async ({ page }) => {
    await page.goto('/contact')
    await expect(page.locator('iframe.contact-map__frame')).toHaveCount(1)
    await expect(page.locator('.contact-socials a[aria-label="Instagram"]')).toBeVisible()
  })
})
