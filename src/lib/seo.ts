// SEO helpers: default meta generators and schema.org JSON-LD builders.
// Pure functions, no external dependencies.
import type { Metadata } from 'next'

// ── Types ────────────────────────────────────────────────────────────────────

export interface ProcedureJsonLdInput {
  title: string
  url: string
  description: string
}

export interface FaqItem {
  question: string
  answer: string
}

export interface BreadcrumbItem {
  name: string
  url: string
}

// ── Meta helpers ─────────────────────────────────────────────────────────────

/**
 * Returns a page title suffixed with "Timișoara — Maravo Clinic".
 * If the title already contains "Timișoara" (case-insensitive) the city is
 * not appended a second time.
 */
export const defaultMetaTitle = (t: string): string =>
  /timișoara/i.test(t) ? `${t} — Maravo Clinic` : `${t} Timișoara — Maravo Clinic`

/**
 * Truncates a meta description to ≤ 155 characters.
 * When truncation is needed the string is cut at 152 chars (trimmed) and
 * the single-char ellipsis "…" (U+2026) is appended, keeping total ≤ 155.
 */
export const defaultMetaDescription = (excerpt: string): string =>
  excerpt.length <= 155 ? excerpt : excerpt.slice(0, 152).trimEnd() + '…'

// ── JSON-LD safe serialiser ───────────────────────────────────────────────────

/**
 * Serialize an object for safe embedding inside a <script type="application/ld+json"> tag.
 * Escaping `<` to the valid JSON unicode escape `<` prevents `</script>` and
 * `<!--` from terminating or altering the script element while remaining valid JSON-LD.
 */
export const jsonLdHtml = (obj: unknown): string =>
  JSON.stringify(obj).replace(/</g, '\\u003c')

// ── JSON-LD builders ──────────────────────────────────────────────────────────

/**
 * Builds a schema.org MedicalProcedure JSON-LD object.
 */
export function procedureJsonLd(p: ProcedureJsonLdInput) {
  return {
    '@context': 'https://schema.org',
    '@type': 'MedicalProcedure',
    name: p.title,
    url: p.url,
    description: p.description,
    location: {
      '@type': 'MedicalClinic',
      name: 'Maravo Clinic',
      address: 'Timișoara, România',
    },
  }
}

/**
 * Builds a schema.org FAQPage JSON-LD object.
 */
export function faqJsonLd(items: FaqItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((i) => ({
      '@type': 'Question',
      name: i.question,
      acceptedAnswer: { '@type': 'Answer', text: i.answer },
    })),
  }
}

/**
 * Builds a schema.org BreadcrumbList JSON-LD object.
 */
export function breadcrumbJsonLd(crumbs: BreadcrumbItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      item: c.url,
    })),
  }
}

// ── Full page-metadata builder ────────────────────────────────────────────────

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
const OG_IMAGE = `${BASE_URL}/logo-gold.png`

export interface BuildMetadataInput {
  /** Final title (already brand-stamped, e.g. via defaultMetaTitle). */
  title: string
  /** Raw description; truncated to ≤155 via defaultMetaDescription. */
  description: string
  /** Route path, e.g. '/despre' or '/' — canonical is BASE_URL + path. */
  path: string
  ogImage?: { url: string; alt?: string }
  type?: 'website' | 'article'
}

/**
 * Builds a complete Next.js Metadata object with a correct per-page canonical,
 * OpenGraph and Twitter card. Use on pages that would otherwise inherit the
 * root layout's canonical (which points at the homepage).
 */
export function buildMetadata(input: BuildMetadataInput): Metadata {
  const { title, path, type = 'website' } = input
  const description = defaultMetaDescription(input.description)
  const canonical = path === '/' ? BASE_URL : `${BASE_URL}${path}`
  const image = input.ogImage ?? { url: OG_IMAGE }

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type,
      url: canonical,
      siteName: 'Maravo Clinic',
      locale: 'ro_RO',
      title,
      description,
      images: [{ url: image.url, ...(image.alt ? { alt: image.alt } : {}) }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image.url],
    },
  }
}
