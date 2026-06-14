'use client'

/**
 * Reveal — global scroll-reveal for every `.fade-up` element on the page.
 *
 * The original prototype used a single document-wide IntersectionObserver
 * (app.js) to add `.visible` to all `.fade-up` nodes. The React port only
 * shipped the <FadeUp> wrapper, which reveals its own wrapper div but NOT the
 * many inner `.fade-up` elements (About, Testimonials, Blog, Booking, section
 * headers) — leaving their content stuck at opacity:0. This component restores
 * the global behaviour so no `.fade-up` content is ever left invisible.
 *
 * Accessibility: respects prefers-reduced-motion (reveals immediately, no
 * animation). Safety net: anything still hidden after 2.5s is force-revealed,
 * so content is never permanently lost even if the observer misses an element.
 */

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

export default function Reveal() {
  const pathname = usePathname()

  useEffect(() => {
    const revealAll = () =>
      document
        .querySelectorAll<HTMLElement>('.fade-up:not(.visible)')
        .forEach((el) => el.classList.add('visible'))

    const els = Array.from(document.querySelectorAll<HTMLElement>('.fade-up:not(.visible)'))
    if (els.length === 0) return

    const prefersReduced =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (prefersReduced || typeof IntersectionObserver === 'undefined') {
      revealAll()
      return
    }

    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible')
            obs.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.12, rootMargin: '0px 0px -5% 0px' },
    )
    els.forEach((el) => observer.observe(el))

    // Safety net: never leave content hidden if the observer somehow misses it.
    const safety = window.setTimeout(revealAll, 2500)

    return () => {
      observer.disconnect()
      window.clearTimeout(safety)
    }
  }, [pathname])

  return null
}
