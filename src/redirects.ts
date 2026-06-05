/**
 * Legacy WordPress -> new site 301 redirect map.
 *
 * Populate from the live WordPress URL inventory at launch (301s preserve SEO).
 * Each entry: old path -> new path, permanent: true.
 *
 * Obtain the inventory by crawling the current site / Google Search Console /
 * the WP sitemap before DNS cutover, then append every old URL below.
 *
 * NOTE: The COMPLETE old-URL inventory is a pending client / launch-time input.
 * The entries below are inferred defaults only — they cover common WordPress
 * paths whose destination is a REAL route in this app. Verify and extend them
 * against the real inventory before go-live. Do NOT add a redirect whose
 * destination route does not exist (it would 404 the redirect target).
 *
 * Next.js emits HTTP 308 for `permanent: true` (SEO-equivalent to a 301).
 */
export const redirects: { source: string; destination: string; permanent: boolean }[] = [
  // --- Inferred defaults — verify against the real WordPress inventory ---
  { source: '/servicii', destination: '/proceduri', permanent: true },
  { source: '/tratamente', destination: '/proceduri', permanent: true },
  { source: '/programare', destination: '/contact', permanent: true },
  { source: '/contact-2', destination: '/contact', permanent: true },
  { source: '/despre-noi', destination: '/despre', permanent: true },
  { source: '/preturi', destination: '/tarife', permanent: true },
  { source: '/aparatura-2', destination: '/aparatura', permanent: true },
  { source: '/blog-2', destination: '/blog', permanent: true },

  // --- TODO (launch): append the full live WordPress URL inventory here ---
]
