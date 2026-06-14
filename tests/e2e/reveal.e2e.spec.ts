import { test, expect } from '@playwright/test'

// Guards the scroll-reveal: every `.fade-up` element must become visible
// (opacity 1) once scrolled into view. Regression test for the "empty
// homepage sections" bug where inner .fade-up content stayed at opacity 0.
test.describe('Scroll reveal', () => {
  test('About section content becomes visible after scrolling into view', async ({ page }) => {
    await page.goto('/')
    const aboutBody = page.locator('.about-body').first()
    await aboutBody.scrollIntoViewIfNeeded()
    // Give the reveal observer a moment to fire.
    await expect(aboutBody).toHaveCSS('opacity', '1', { timeout: 4000 })
  })

  test('Booking CTA (last section) content reveals before footer', async ({ page }) => {
    await page.goto('/')
    const bookingTitle = page.locator('.booking-title').first()
    await bookingTitle.scrollIntoViewIfNeeded()
    await expect(bookingTitle).toHaveCSS('opacity', '1', { timeout: 4000 })
  })
})
