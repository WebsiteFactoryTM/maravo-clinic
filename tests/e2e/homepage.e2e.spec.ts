import { test, expect } from '@playwright/test'

const BASE = 'http://localhost:3000'

test.describe('Homepage sections', () => {
  test('hero h1 is visible and has text', async ({ page }) => {
    await page.goto(BASE)
    const h1 = page.locator('h1.hero-h1')
    await expect(h1).toBeVisible()
    const text = await h1.innerText()
    expect(text.length).toBeGreaterThan(5)
  })

  test('popular-scroll section exists', async ({ page }) => {
    await page.goto(BASE)
    const el = page.locator('#popular .popular-scroll')
    await expect(el).toBeAttached()
  })

  test('marquee strip exists', async ({ page }) => {
    await page.goto(BASE)
    await expect(page.locator('.marquee-strip')).toBeAttached()
  })

  test('body map section exists', async ({ page }) => {
    await page.goto(BASE)
    await expect(page.locator('#search')).toBeAttached()
    await expect(page.locator('.bm-figure')).toBeAttached()
  })

  test('stats section exists', async ({ page }) => {
    await page.goto(BASE)
    await expect(page.locator('#stats')).toBeAttached()
    await expect(page.locator('.stat-num').first()).toBeAttached()
  })

  test('about section exists', async ({ page }) => {
    await page.goto(BASE)
    await expect(page.locator('#about')).toBeAttached()
  })

  test('testimonials section exists', async ({ page }) => {
    await page.goto(BASE)
    await expect(page.locator('#testimonials')).toBeAttached()
  })

  test('booking CTA section exists', async ({ page }) => {
    await page.goto(BASE)
    await expect(page.locator('#booking')).toBeAttached()
    await expect(page.locator('.booking-title')).toBeAttached()
  })

  test('no console errors on load', async ({ page }) => {
    const errors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text())
    })
    await page.goto(BASE)
    // Allow up to 2s for hydration
    await page.waitForTimeout(2000)
    // Filter out known benign browser-extension / third-party errors
    const fatal = errors.filter(
      (e) =>
        !e.includes('extensions') &&
        !e.includes('favicon') &&
        !e.includes('net::ERR'),
    )
    expect(fatal).toHaveLength(0)
  })
})
