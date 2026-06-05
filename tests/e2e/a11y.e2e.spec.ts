import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

/**
 * Accessibility smoke using axe-core.
 *
 * We run axe against the key public routes and fail on any SERIOUS or
 * CRITICAL violation. Moderate/minor findings are reported in the test log
 * but do not fail the build (they are tracked as follow-ups).
 */

const ROUTES = [
  '/',
  '/proceduri',
  '/proceduri/injectabile/injectare-acid-hialuronic-buze',
  '/contact',
] as const

for (const route of ROUTES) {
  test(`a11y: ${route} has no serious/critical violations`, async ({ page }) => {
    await page.goto(route, { waitUntil: 'domcontentloaded' })
    // Let fonts/images settle so color-contrast checks are accurate.
    await page.waitForLoadState('networkidle').catch(() => {})

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze()

    const blocking = results.violations.filter(
      (v) => v.impact === 'serious' || v.impact === 'critical',
    )

    if (blocking.length > 0) {
      const summary = blocking
        .map(
          (v) =>
            `- [${v.impact}] ${v.id}: ${v.help}\n    nodes: ${v.nodes
              .map((n) => n.target.join(' '))
              .join(' | ')}`,
        )
        .join('\n')
      console.error(`Serious/critical a11y violations on ${route}:\n${summary}`)
    }

    expect(blocking, `serious/critical a11y violations on ${route}`).toEqual([])
  })
}
