import React from 'react'

/**
 * CategoryIcon — one cohesive, thin-line icon per procedure category.
 *
 * Categories are CMS-driven but their visual mark is intentionally NOT taken
 * from the free-text `icon` field (which held a mix of a colour emoji and
 * meaningless geometric glyphs). Instead we key a unified line-icon set off the
 * stable category slug so the same suggestive icon renders identically in the
 * mega menu, tarife/proceduri pills, category headers and tiles.
 *
 * Icons inherit size from the parent's font-size (1em) and colour via
 * `currentColor`, so existing container styles keep working.
 */

interface CategoryIconProps {
  slug?: string | null
  className?: string
}

const ICONS: Record<string, React.ReactNode> = {
  // Față — serene face (facial treatments)
  fata: (
    <>
      <ellipse cx="12" cy="12" rx="6.5" ry="8" />
      <path d="M8.2 10.6c.8.8 1.9.8 2.7 0" />
      <path d="M13.1 10.6c.8.8 1.9.8 2.7 0" />
      <path d="M9.5 14.6c1.5 1.2 3.5 1.2 5 0" />
    </>
  ),
  // Buze — lips
  buze: (
    <>
      <path d="M4 11c2-2.4 4.3-2.4 6-.6.7.7 1.3.7 2 .7s1.3 0 2-.7c1.7-1.8 4-1.8 6 .6" />
      <path d="M4 11c4 4.4 12 4.4 16 0" />
      <path d="M6 11.2h12" />
    </>
  ),
  // Corp — body contour / silhouette
  corp: (
    <>
      <circle cx="12" cy="5" r="2.4" />
      <path d="M8.8 9.5h6.4c.4 0 .7.4.6.8l-1.1 4.2c-.1.3-.1.7 0 1l1.1 4.2c.1.4-.2.8-.6.8H8.8c-.4 0-.7-.4-.6-.8l1.1-4.2c.1-.3.1-.7 0-1L8.2 10.3c-.1-.4.2-.8.6-.8Z" />
    </>
  ),
  // Laser — light pulse / sparkle
  laser: (
    <>
      <path d="M12 3.5 13.3 9.7 19.5 11 13.3 12.3 12 18.5 10.7 12.3 4.5 11 10.7 9.7Z" />
      <path d="M18.4 4 19 6 21 6.6 19 7.2 18.4 9.2 17.8 7.2 15.8 6.6 17.8 6Z" />
    </>
  ),
  // Injectabile — syringe (drawn vertically, tilted 45°)
  injectabile: (
    <g transform="rotate(-45 12 12)">
      <path d="M9.6 5.5h4.8" />
      <path d="M12 5.5v3" />
      <path d="M10 8.5h4v6.5h-4z" />
      <path d="M13.4 10.2h-1.6M13.4 12h-1.6" />
      <path d="M12 15v4.2" />
      <path d="M10.9 19.2h2.2" />
    </g>
  ),
  // Păr — flowing hair strands
  par: (
    <>
      <path d="M8 4.5c1.5 2-1.5 3.5 0 5.5s-1.5 3.5 0 5.5 -1.5 3 0 4.5" />
      <path d="M12 4.5c1.5 2-1.5 3.5 0 5.5s-1.5 3.5 0 5.5 -1.5 3 0 4.5" />
      <path d="M16 4.5c1.5 2-1.5 3.5 0 5.5s-1.5 3.5 0 5.5 -1.5 3 0 4.5" />
    </>
  ),
}

// Neutral botanical fallback for any future/unknown category slug.
const FALLBACK = (
  <>
    <path d="M12 4c-5 3-5 11 0 16 5-5 5-13 0-16Z" />
    <path d="M12 6.5v12" />
  </>
)

export default function CategoryIcon({ slug, className }: CategoryIconProps) {
  const glyph = (slug && ICONS[slug]) || FALLBACK
  return (
    <svg
      className={className ? `cat-icon ${className}` : 'cat-icon'}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {glyph}
    </svg>
  )
}
