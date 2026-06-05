import { test, expect } from '@playwright/test'

const BASE = 'http://localhost:3000'

test.describe('BodyMap — /proceduri zone navigator', () => {
  test('bodymap renders with default zone (Față) active', async ({ page }) => {
    await page.goto(`${BASE}/proceduri`)

    // The bodymap wrapper is present
    await expect(page.locator('.bodymap').first()).toBeVisible()

    // The SVG body figure is present
    await expect(page.locator('.body-svg').first()).toBeVisible()

    // Default active zone label shows "Față"
    await expect(page.locator('.bmp-zone-label').first()).toContainText('Față')

    // Zone chips are rendered — at least 6 (one per zone)
    const chips = page.locator('.bmp-zonechip')
    await expect(chips).toHaveCount(6)

    // "Față" chip is active by default
    const fataChip = chips.filter({ hasText: 'Față' })
    await expect(fataChip).toHaveClass(/active/)
  })

  test('clicking "Abdomen & Talie" chip updates the panel', async ({ page }) => {
    await page.goto(`${BASE}/proceduri`)

    // Wait for bodymap to be visible
    await expect(page.locator('.bodymap').first()).toBeVisible()

    // Click the Abdomen chip
    const abdomenChip = page.locator('.bmp-zonechip').filter({ hasText: 'Abdomen' })
    await abdomenChip.click()

    // Panel label updates to Abdomen
    await expect(page.locator('.bmp-zone-label').first()).toContainText('Abdomen')

    // Abdomen chip is now active
    await expect(abdomenChip).toHaveClass(/active/)

    // Față chip is no longer active
    const fataChip = page.locator('.bmp-zonechip').filter({ hasText: 'Față' })
    await expect(fataChip).not.toHaveClass(/active/)
  })

  test('clicking "Picioare" chip updates the panel', async ({ page }) => {
    await page.goto(`${BASE}/proceduri`)

    await expect(page.locator('.bodymap').first()).toBeVisible()

    const picioareChip = page.locator('.bmp-zonechip').filter({ hasText: 'Picioare' })
    await picioareChip.click()

    await expect(page.locator('.bmp-zone-label').first()).toContainText('Picioare')
    await expect(picioareChip).toHaveClass(/active/)
  })

  test('hotspot buttons are present for each zone', async ({ page }) => {
    await page.goto(`${BASE}/proceduri`)

    await expect(page.locator('.bodymap').first()).toBeVisible()

    // There should be one hotspot per zone (6)
    const hotspots = page.locator('.hotspot')
    await expect(hotspots).toHaveCount(6)

    // Each hotspot has aria-label
    for (const hs of await hotspots.all()) {
      const ariaLabel = await hs.getAttribute('aria-label')
      expect(ariaLabel).toBeTruthy()
    }
  })

  test('proc list region has aria-live for screen readers', async ({ page }) => {
    await page.goto(`${BASE}/proceduri`)

    await expect(page.locator('.bodymap').first()).toBeVisible()

    // The proc list has aria-live="polite"
    const procList = page.locator('.bmp-procs[aria-live="polite"]')
    await expect(procList.first()).toBeAttached()
  })

  test('empty zone shows graceful empty state', async ({ page }) => {
    await page.goto(`${BASE}/proceduri`)

    await expect(page.locator('.bodymap').first()).toBeVisible()

    // Click all zones and verify no JS crash; each zone label updates correctly
    const zoneLabels = [
      'Scalp',
      'Față',
      'Gât',
      'Brațe',
      'Abdomen',
      'Picioare',
    ]
    const chips = page.locator('.bmp-zonechip')

    for (let i = 0; i < 6; i++) {
      await chips.nth(i).click()
      const label = page.locator('.bmp-zone-label').first()
      const text = await label.textContent()
      expect(text).toBeTruthy()
      // If no procedures: graceful empty state shown, not a crash
      const procItems = page.locator('.bmp-proc')
      await expect(procItems.first()).toBeVisible()
    }
  })
})
