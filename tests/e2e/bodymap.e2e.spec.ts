import { test, expect } from '@playwright/test'

const BASE = 'http://localhost:3000'

// The Playwright project runs Desktop Chrome (1280×720), so the desktop
// connector labels (`.zflag`) are visible and the mobile zone list is hidden.

test.describe('BodyMap — /proceduri zone navigator', () => {
  test('bodymap renders with default zone (Față) active', async ({ page }) => {
    await page.goto(`${BASE}/proceduri`)

    // The bodymap wrapper + silhouette are present
    await expect(page.locator('.bodymap').first()).toBeVisible()
    await expect(page.locator('.bm-figure').first()).toBeVisible()

    // Default active zone — drawer title shows "Față"
    await expect(page.locator('.bm-drawer__title').first()).toContainText('Față')

    // One connector per zone (6)
    const flags = page.locator('.zflag')
    await expect(flags).toHaveCount(6)

    // "Față" connector is active by default
    const fataFlag = flags.filter({ hasText: 'Față' })
    await expect(fataFlag).toHaveClass(/active/)
  })

  test('clicking the "Abdomen" connector updates the drawer', async ({ page }) => {
    await page.goto(`${BASE}/proceduri`)
    await expect(page.locator('.bodymap').first()).toBeVisible()

    const abdomenFlag = page.locator('.zflag').filter({ hasText: 'Abdomen' })
    await abdomenFlag.click()

    await expect(page.locator('.bm-drawer__title').first()).toContainText('Abdomen')
    await expect(abdomenFlag).toHaveClass(/active/)

    // Față is no longer active
    const fataFlag = page.locator('.zflag').filter({ hasText: 'Față' })
    await expect(fataFlag).not.toHaveClass(/active/)
  })

  test('clicking the "Picioare" connector updates the drawer', async ({ page }) => {
    await page.goto(`${BASE}/proceduri`)
    await expect(page.locator('.bodymap').first()).toBeVisible()

    const picioareFlag = page.locator('.zflag').filter({ hasText: 'Picioare' })
    await picioareFlag.click()

    await expect(page.locator('.bm-drawer__title').first()).toContainText('Picioare')
    await expect(picioareFlag).toHaveClass(/active/)
  })

  test('every connector exposes an accessible label', async ({ page }) => {
    await page.goto(`${BASE}/proceduri`)
    await expect(page.locator('.bodymap').first()).toBeVisible()

    const flags = page.locator('.zflag')
    await expect(flags).toHaveCount(6)

    for (const flag of await flags.all()) {
      const ariaLabel = await flag.getAttribute('aria-label')
      expect(ariaLabel).toBeTruthy()
    }
  })

  test('drawer list region has aria-live for screen readers', async ({ page }) => {
    await page.goto(`${BASE}/proceduri`)
    await expect(page.locator('.bodymap').first()).toBeVisible()

    const list = page.locator('.bm-drawer__list[aria-live="polite"]')
    await expect(list.first()).toBeAttached()
  })

  test('every zone updates the drawer without crashing', async ({ page }) => {
    await page.goto(`${BASE}/proceduri`)
    await expect(page.locator('.bodymap').first()).toBeVisible()

    const flags = page.locator('.zflag')

    for (let i = 0; i < 6; i++) {
      await flags.nth(i).click()

      // Title always reflects the selected zone
      const title = page.locator('.bm-drawer__title').first()
      await expect(title).toBeVisible()
      expect((await title.textContent())?.trim()).toBeTruthy()

      // Either treatment rows OR a graceful empty state — never a crash
      const rows = page.locator('.bm-drawer__row')
      const empty = page.locator('.bm-drawer__empty')
      const hasContent =
        (await rows.count()) > 0 || (await empty.count()) > 0
      expect(hasContent).toBe(true)
    }
  })
})
