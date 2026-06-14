import { test, expect } from '@playwright/test'

const BASE = 'http://localhost:3000'

test.describe('Layout Shell', () => {
  test('desktop (1280px) — header and footer render', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto(BASE)

    // Navbar is present
    await expect(page.locator('#navbar')).toBeVisible()

    // Logo only — wordmark removed (logo-only navbar by design)
    await expect(page.locator('a.nav-logo img')).toBeVisible()
    await expect(page.locator('.nav-wordmark')).toHaveCount(0)

    // Desktop nav is visible
    await expect(page.locator('.nav-desktop')).toBeVisible()

    // CTA button
    await expect(page.locator('.nav-cta')).toBeVisible()

    // Footer
    await expect(page.locator('footer')).toBeVisible()
    await expect(page.locator('.footer-grid-wrap')).toBeVisible()
  })

  test('desktop — mega-menu opens on Proceduri hover', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto(BASE)

    const trigger = page.locator('#nav-proceduri-btn')
    await expect(trigger).toBeVisible()

    // Mega menu starts hidden
    const megaMenu = page.locator('#mega-menu')
    await expect(megaMenu).not.toHaveClass(/visible/)

    // Hover to open (matches the primary UX: hover reveals menu)
    await trigger.hover()
    await expect(megaMenu).toHaveClass(/visible/)
    await expect(trigger).toHaveAttribute('aria-expanded', 'true')

    // Category buttons present (count is CMS-driven, just ensure ≥1)
    const catBtns = megaMenu.locator('.mega-cat-btn')
    await expect(catBtns.first()).toBeVisible()

    // Procedure items visible
    await expect(megaMenu.locator('.mega-proc-item').first()).toBeVisible()

    // Escape closes
    await page.keyboard.press('Escape')
    await expect(megaMenu).not.toHaveClass(/visible/)
    await expect(trigger).toHaveAttribute('aria-expanded', 'false')
  })

  test('mobile (390px) — hamburger toggles mobile menu', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto(BASE)

    const hamburger = page.locator('#hamburger')
    await expect(hamburger).toBeVisible()

    // Desktop nav hidden on mobile
    await expect(page.locator('.nav-desktop')).toBeHidden()

    // Mobile menu closed initially — `inert` (present when closed) removes the
    // drawer from the tab order + a11y tree (replaces the old aria-hidden).
    const mobileMenu = page.locator('#mobile-menu')
    await expect(mobileMenu).not.toHaveClass(/open/)
    await expect(mobileMenu).toHaveAttribute('inert', '')

    // Open
    await hamburger.click()
    await expect(mobileMenu).toHaveClass(/open/)
    await expect(hamburger).toHaveClass(/open/)
    await expect(mobileMenu).not.toHaveAttribute('inert', /.*/)

    // Close via Escape
    await page.keyboard.press('Escape')
    await expect(mobileMenu).not.toHaveClass(/open/)
    await expect(mobileMenu).toHaveAttribute('inert', '')
  })

  test('mobile — Proceduri accordion expands', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto(BASE)

    // Open mobile menu
    await page.locator('#hamburger').click()
    await expect(page.locator('#mobile-menu')).toHaveClass(/open/)

    // Click Proceduri
    const mobProcBtn = page.locator('#mob-proceduri-btn')
    await mobProcBtn.click()

    const accordion = page.locator('#mob-accordion')
    await expect(accordion).toHaveClass(/open/)

    // Categories and procedures rendered (count is CMS-driven, just ensure ≥1)
    const cats = accordion.locator('.mob-acc-cat-title')
    await expect(cats.first()).toBeVisible()
    await expect(accordion.locator('.mob-acc-item').first()).toBeVisible()
  })

  test('mobile — accordion aria-expanded toggles correctly', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto(BASE)

    await page.locator('#hamburger').click()
    await expect(page.locator('#mobile-menu')).toHaveClass(/open/)

    const mobProcBtn = page.locator('#mob-proceduri-btn')

    // Initially collapsed
    await expect(mobProcBtn).toHaveAttribute('aria-expanded', 'false')
    await expect(mobProcBtn).toHaveAttribute('aria-controls', 'mob-accordion')

    // Expand
    await mobProcBtn.click()
    await expect(mobProcBtn).toHaveAttribute('aria-expanded', 'true')
    await expect(page.locator('#mob-accordion')).toHaveClass(/open/)

    // Collapse
    await mobProcBtn.click()
    await expect(mobProcBtn).toHaveAttribute('aria-expanded', 'false')
    await expect(page.locator('#mob-accordion')).not.toHaveClass(/open/)
  })

  test('desktop — hover→leave→click reopens mega-menu on first click', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto(BASE)

    const trigger = page.locator('#nav-proceduri-btn')
    const megaMenu = page.locator('#mega-menu')

    // Hover to open via hover
    await trigger.hover()
    await expect(megaMenu).toHaveClass(/visible/)

    // Move mouse well below the mega-menu panel so both the trigger and menu
    // fire mouseleave, letting the 200ms close timer fire.
    await page.mouse.move(640, 750)
    await page.waitForTimeout(400)
    await expect(megaMenu).not.toHaveClass(/visible/)

    // First click after hover→leave must reopen (not silently no-op)
    await trigger.click()
    await expect(megaMenu).toHaveClass(/visible/)
  })
})
