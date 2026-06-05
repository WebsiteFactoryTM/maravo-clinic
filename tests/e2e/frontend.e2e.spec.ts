import { test, expect } from '@playwright/test'

test.describe('Frontend', () => {
  test('can go on homepage', async ({ page }) => {
    await page.goto('/')

    // Real Maravo Clinic branding (was the Payload blank-template stub).
    await expect(page).toHaveTitle(/Maravo Clinic/)

    const heading = page.locator('h1').first()
    await expect(heading).toBeVisible()
    expect((await heading.innerText()).trim().length).toBeGreaterThan(0)
  })
})
