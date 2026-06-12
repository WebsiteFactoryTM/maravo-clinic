import React from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { RichText } from '@payloadcms/richtext-lexical/react'
import { getPayloadClient } from '@/lib/payload'
import ProcedureCard from '@/components/procedure/ProcedureCard'
import CtaButtons from '@/components/ui/CtaButtons'
import {
  defaultMetaTitle,
  defaultMetaDescription,
  breadcrumbJsonLd,
  jsonLdHtml,
} from '@/lib/seo'
import { resolveMedia } from '@/lib/media'
import type { Equipment, Procedure, Category, Media, SiteSetting } from '@/payload-types'

export const revalidate = 3600

interface PageProps {
  params: Promise<{ slug: string }>
}

// ── Type helpers ─────────────────────────────────────────────────────────────

function resolveCategory(cat: number | Category): Category | null {
  if (typeof cat === 'number') return null
  return cat
}

function resolveProcedure(p: number | Procedure): Procedure | null {
  if (typeof p === 'number') return null
  return p
}

/** Guard: richText root is non-empty if it has at least one child node */
function hasRichTextContent(
  field:
    | { root: { children: unknown[] } }
    | null
    | undefined,
): field is { root: { children: unknown[] } } {
  return (
    field != null &&
    typeof field === 'object' &&
    'root' in field &&
    Array.isArray((field as { root: { children: unknown[] } }).root.children) &&
    (field as { root: { children: unknown[] } }).root.children.length > 0
  )
}

/**
 * Derive a plain-text description from the richText description field.
 * Walks the lexical root.children and collects text from paragraph/heading nodes.
 * Returns up to 200 chars — safe to embed in JSON-LD.
 */
function richTextToPlainText(
  field: { root: { children: unknown[] } } | null | undefined,
): string {
  if (!field?.root?.children) return ''

  const lines: string[] = []

  function walk(nodes: unknown[]) {
    for (const node of nodes) {
      if (!node || typeof node !== 'object') continue
      const n = node as Record<string, unknown>
      if (n['type'] === 'text' && typeof n['text'] === 'string') {
        lines.push(n['text'])
      }
      if (Array.isArray(n['children'])) {
        walk(n['children'] as unknown[])
      }
    }
  }

  walk(field.root.children)
  const text = lines.join(' ').replace(/\s+/g, ' ').trim()
  return text.length > 200 ? text.slice(0, 197).trimEnd() + '…' : text
}

// ── Static params ────────────────────────────────────────────────────────────

export async function generateStaticParams() {
  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: 'equipment',
    where: { status: { equals: 'published' } },
    limit: 0,
    depth: 0,
  })
  return result.docs
    .filter((eq) => eq.slug)
    .map((eq) => ({ slug: eq.slug as string }))
}

// ── Metadata ──────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: 'equipment',
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 1,
  })
  const eq = result.docs[0] as Equipment | undefined
  if (!eq) return {}

  const title = eq.seo?.metaTitle ?? defaultMetaTitle(eq.name)
  const description =
    eq.seo?.metaDescription ??
    defaultMetaDescription(
      eq.purpose?.trim()
        ? eq.purpose
        : `${eq.name} la Maravo Clinic Timișoara — tratamente cu aparatură de ultimă generație.`,
    )

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  const canonicalUrl = `${siteUrl}/aparatura/${slug}`

  const ogImage =
    resolveMedia(eq.seo?.ogImage as Media | number | null | undefined) ??
    resolveMedia(eq.photo as Media | number | null | undefined)

  return {
    title,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      ...(ogImage?.url
        ? { images: [{ url: ogImage.url, alt: ogImage.alt ?? title }] }
        : {}),
    },
  }
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function EquipmentDetailPage({ params }: PageProps) {
  const { slug } = await params
  const payload = await getPayloadClient()

  // Fetch equipment at depth 2 (photo, gallery images, relatedProcedures→category)
  const result = await payload.find({
    collection: 'equipment',
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 2,
  })
  const eq = result.docs[0] as Equipment | undefined

  if (!eq) notFound()
  if (eq.status !== 'published') notFound()

  // Fetch site settings for CTA contact details
  const settings = (await payload.findGlobal({ slug: 'site-settings' })) as SiteSetting
  const whatsapp =
    settings.whatsapp ?? process.env.WHATSAPP_NUMBER ?? ''
  const phone =
    settings.phone ?? process.env.CLINIC_PHONE ?? ''

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  const pageUrl = `${siteUrl}/aparatura/${slug}`

  // Resolve media
  const mainPhoto = resolveMedia(eq.photo as Media | number | null | undefined)
  const galleryImages = (eq.gallery ?? []).map((g) =>
    resolveMedia(g.image as Media | number | null | undefined),
  ).filter((img): img is Media => img !== null)

  // Resolve related procedures (filter to published + category resolved)
  const relatedProcedures = (eq.relatedProcedures ?? [])
    .map(resolveProcedure)
    .filter((p): p is Procedure => {
      if (p === null) return false
      if (p.status !== 'published') return false
      const cat = resolveCategory(p.category)
      return cat !== null && !!cat.slug
    })

  // Derive plain-text description for JSON-LD (never dump raw lexical JSON)
  const richDesc = richTextToPlainText(eq.description)
  const descriptionText = eq.purpose ?? (richDesc || eq.name)

  // Build JSON-LD objects
  const jsonLdBreadcrumb = breadcrumbJsonLd([
    { name: 'Acasă', url: `${siteUrl}/` },
    { name: 'Aparatură', url: `${siteUrl}/aparatura` },
    { name: eq.name, url: pageUrl },
  ])

  const jsonLdDevice = {
    '@context': 'https://schema.org',
    '@type': 'MedicalDevice',
    name: eq.name,
    url: pageUrl,
    description: descriptionText,
    ...(eq.manufacturer
      ? {
          manufacturer: {
            '@type': 'Organization',
            name: eq.manufacturer,
          },
        }
      : {}),
    ...(mainPhoto?.url
      ? { image: mainPhoto.url }
      : {}),
    availableAtOrFrom: {
      '@type': 'MedicalClinic',
      name: 'Maravo Clinic',
      address: 'Timișoara, România',
      url: siteUrl,
    },
  }

  return (
    <>
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdHtml(jsonLdBreadcrumb) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdHtml(jsonLdDevice) }}
      />

      <main className="equip-detail">
        {/* Breadcrumb */}
        <nav className="breadcrumb" aria-label="Breadcrumb">
          <ol className="breadcrumb__list">
            <li className="breadcrumb__item">
              <Link href="/">Acasă</Link>
            </li>
            <li className="breadcrumb__item breadcrumb__sep" aria-hidden="true">
              /
            </li>
            <li className="breadcrumb__item">
              <Link href="/aparatura">Aparatură</Link>
            </li>
            <li className="breadcrumb__item breadcrumb__sep" aria-hidden="true">
              /
            </li>
            <li className="breadcrumb__item breadcrumb__item--current" aria-current="page">
              {eq.name}
            </li>
          </ol>
        </nav>

        {/* Hero header */}
        <header className="equip-detail__hero">
          <h1 className="equip-detail__title">{eq.name}</h1>
          {eq.manufacturer && (
            <p className="equip-detail__manufacturer">
              <span className="equip-detail__manufacturer-label">Producător: </span>
              <strong>{eq.manufacturer}</strong>
            </p>
          )}
        </header>

        {/* Main content */}
        <div className="equip-detail__content">
          {/* Main photo */}
          {mainPhoto?.url && (
            <figure className="equip-detail__photo-wrap">
              <Image
                src={mainPhoto.url}
                alt={mainPhoto.alt ?? eq.name}
                width={900}
                height={600}
                className="equip-detail__photo"
                priority
              />
            </figure>
          )}

          {/* Gallery */}
          {galleryImages.length > 0 && (
            <section
              className="equip-detail__gallery"
              aria-label={`Galerie imagini ${eq.name}`}
            >
              {galleryImages.map((img, idx) => (
                <figure key={img.id ?? idx} className="equip-detail__gallery-item">
                  <Image
                    src={img.url ?? ''}
                    alt={img.alt ?? `${eq.name} — imagine ${idx + 1}`}
                    width={600}
                    height={400}
                    className="equip-detail__gallery-img"
                  />
                </figure>
              ))}
            </section>
          )}

          {/* Purpose — "Pentru ce este" */}
          {eq.purpose && (
            <section className="equip-detail__section" aria-labelledby="pentru-ce-este">
              <h2 id="pentru-ce-este" className="equip-detail__section-heading">
                Pentru ce este
              </h2>
              <p className="equip-detail__purpose">{eq.purpose}</p>
            </section>
          )}

          {/* Description (richText) */}
          {hasRichTextContent(eq.description) && (
            <section className="equip-detail__section" aria-labelledby="descriere">
              <h2 id="descriere" className="equip-detail__section-heading">
                Descriere
              </h2>
              <div className="equip-detail__richtext richtext">
                <RichText data={eq.description} />
              </div>
            </section>
          )}

          {/* Related procedures — proves the equipment → procedure interlink */}
          {relatedProcedures.length > 0 && (
            <section className="equip-detail__section" aria-labelledby="proceduri-asociate">
              <h2 id="proceduri-asociate" className="equip-detail__section-heading">
                Proceduri asociate
              </h2>
              <p className="equip-detail__section-lead">
                Această aparatură este utilizată în cadrul următoarelor proceduri la Maravo
                Clinic:
              </p>
              <div className="proc-grid equip-detail__proc-grid">
                {relatedProcedures.map((proc) => {
                  const cat = resolveCategory(proc.category)
                  if (!cat?.slug) return null
                  return (
                    <ProcedureCard
                      key={proc.id}
                      title={proc.title}
                      slug={proc.slug ?? ''}
                      category={{ name: cat.name, slug: cat.slug }}
                      excerpt={proc.excerpt}
                      featuredImage={proc.featuredImage as Media | number | null | undefined}
                      meta={proc.meta ?? null}
                      icon={proc.icon ?? null}
                    />
                  )
                })}
              </div>
            </section>
          )}
        </div>

        {/* CTA */}
        {(whatsapp || phone) && (
          <section className="equip-detail__cta" aria-label="Programează-te">
            <h2 className="equip-detail__cta-heading">
              Programează o consultație la Maravo Clinic
            </h2>
            <CtaButtons
              whatsapp={whatsapp}
              phone={phone}
              variant="stacked"
            />
          </section>
        )}
      </main>
    </>
  )
}
