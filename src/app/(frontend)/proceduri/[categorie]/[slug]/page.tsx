import React from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { RichText } from '@payloadcms/richtext-lexical/react'
import { getPayloadClient } from '@/lib/payload'
import PictogramRow from '@/components/procedure/PictogramRow'
import InvasivenessBadge from '@/components/procedure/InvasivenessBadge'
import FaqAccordion from '@/components/procedure/FaqAccordion'
import ProcedureCard from '@/components/procedure/ProcedureCard'
import EquipmentCard from '@/components/procedure/EquipmentCard'
import CtaButtons from '@/components/ui/CtaButtons'
import ProcedureStickyCta from '@/components/procedure/ProcedureStickyCta'
import { CLINIC } from '@/lib/clinic'
import { capitalizeFirst, splitClinicalList } from '@/lib/clinical-text'
import {
  FaCircleInfo,
  FaUserGroup,
  FaListCheck,
  FaArrowsRotate,
  FaStar,
  FaCircleCheck,
  FaCircleXmark,
} from 'react-icons/fa6'
import {
  defaultMetaTitle,
  defaultMetaDescription,
  procedureJsonLd,
  faqJsonLd,
  breadcrumbJsonLd,
  jsonLdHtml,
} from '@/lib/seo'
import { resolveMedia } from '@/lib/media'
import type { Category, Procedure, Equipment, Media, SiteSetting } from '@/payload-types'

export const revalidate = 3600

interface PageProps {
  params: Promise<{ categorie: string; slug: string }>
}

// ── Type helpers ────────────────────────────────────────────────────────────────

function resolveCategory(cat: number | Category): Category | null {
  if (typeof cat === 'number') return null
  return cat
}

function resolveEquipment(eq: number | Equipment): Equipment | null {
  if (typeof eq === 'number') return null
  return eq
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

// ── Static params ────────────────────────────────────────────────────────────────

export async function generateStaticParams() {
  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: 'procedures',
    where: { status: { equals: 'published' } },
    limit: 0,
    depth: 1,
  })
  return result.docs.flatMap((proc) => {
    const cat = resolveCategory(proc.category)
    if (!cat?.slug || !proc.slug) return []
    return [{ categorie: cat.slug, slug: proc.slug }]
  })
}

// ── Metadata ─────────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: 'procedures',
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 1,
  })
  const proc = result.docs[0] as Procedure | undefined
  if (!proc) return {}

  const title = proc.seo?.metaTitle ?? defaultMetaTitle(proc.title)
  const description =
    proc.seo?.metaDescription ??
    defaultMetaDescription(
      proc.excerpt?.trim()
        ? proc.excerpt
        : `${proc.title} la Maravo Clinic Timișoara. Consultație și plan personalizat. Programează-te.`,
    )

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  const cat = resolveCategory(proc.category)
  const canonicalPath = cat?.slug
    ? `${siteUrl}/proceduri/${cat.slug}/${proc.slug}`
    : `${siteUrl}/proceduri`

  const ogImage = resolveMedia(proc.seo?.ogImage) ?? resolveMedia(proc.featuredImage)

  return {
    title,
    description,
    alternates: { canonical: canonicalPath },
    openGraph: {
      title,
      description,
      url: canonicalPath,
      ...(ogImage?.url
        ? {
            images: [{ url: ogImage.url, alt: ogImage.alt ?? title }],
          }
        : {}),
    },
  }
}

// ── Page ─────────────────────────────────────────────────────────────────────────

export default async function ProcedureDetailPage({ params }: PageProps) {
  const { categorie, slug } = await params
  const payload = await getPayloadClient()

  // Fetch procedure (depth 2 for relatedEquipment→media)
  const result = await payload.find({
    collection: 'procedures',
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 2,
  })
  const proc = result.docs[0] as Procedure | undefined

  // 404 conditions
  if (!proc) notFound()
  if (proc.status !== 'published') notFound()

  const cat = resolveCategory(proc.category)
  if (!cat) notFound()
  // Slug mismatch guard
  if (cat.slug !== categorie) notFound()

  // Fetch site settings for CTA
  const settings = await payload.findGlobal({
    slug: 'site-settings',
  }) as SiteSetting

  // CMS first, then env, then the in-code business facts. Without the CLINIC
  // fallback an unpopulated `site-settings` global silently hides every CTA.
  const whatsapp =
    settings.whatsapp ?? process.env.WHATSAPP_NUMBER ?? CLINIC.whatsapp
  const phone = settings.phone ?? process.env.CLINIC_PHONE ?? CLINIC.phoneHref

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  const pageUrl = `${siteUrl}/proceduri/${categorie}/${slug}`

  // Build JSON-LD data
  const jsonLdProcedure = procedureJsonLd({
    title: proc.title,
    url: pageUrl,
    description: proc.excerpt,
  })

  const faqItems = (proc.faq ?? []).flatMap((f) =>
    f.question && f.answer
      ? [{ question: capitalizeFirst(f.question), answer: capitalizeFirst(f.answer) }]
      : [],
  )

  // Stored as one comma-separated lowercase run — split into capitalized items.
  const indications = splitClinicalList(proc.indications)
  const contraindications = splitClinicalList(proc.contraindications)
  const jsonLdFaq = faqItems.length > 0 ? faqJsonLd(faqItems) : null

  const jsonLdBreadcrumb = breadcrumbJsonLd([
    { name: 'Acasă', url: `${siteUrl}/` },
    { name: 'Proceduri', url: `${siteUrl}/proceduri` },
    { name: cat.name, url: `${siteUrl}/proceduri/${categorie}` },
    { name: proc.title, url: pageUrl },
  ])

  // Resolve related entities
  const relatedEquipment = (proc.relatedEquipment ?? [])
    .map(resolveEquipment)
    .filter((e): e is Equipment => e !== null)

  const relatedProcedures = (proc.relatedProcedures ?? [])
    .map(resolveProcedure)
    .filter((p): p is Procedure => p !== null && p.status === 'published')

  const invasiveness = proc.meta?.invasiveness ?? null

  return (
    <>
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdHtml(jsonLdProcedure) }}
      />
      {jsonLdFaq && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLdHtml(jsonLdFaq) }}
        />
      )}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdHtml(jsonLdBreadcrumb) }}
      />

      <main className="proc-detail">
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
              <Link href="/proceduri">Proceduri</Link>
            </li>
            <li className="breadcrumb__item breadcrumb__sep" aria-hidden="true">
              /
            </li>
            <li className="breadcrumb__item">
              <Link href={`/proceduri/${categorie}`}>{cat.name}</Link>
            </li>
            <li className="breadcrumb__item breadcrumb__sep" aria-hidden="true">
              /
            </li>
            <li className="breadcrumb__item breadcrumb__item--current" aria-current="page">
              {proc.title}
            </li>
          </ol>
        </nav>

        {/* 2-column layout: sticky rail + scrolling content */}
        <div className="proc-detail__layout">
          {/* Info rail */}
          <div className="proc-rail">
            <h1 className="proc-detail__title">{proc.title} Timișoara</h1>
            {proc.excerpt && (
              <p className="proc-detail__excerpt">{proc.excerpt}</p>
            )}

            {/* Pictograms */}
            {proc.meta && (
              <PictogramRow
                meta={{
                  duration: proc.meta.duration ?? null,
                  painLevel: proc.meta.painLevel ?? null,
                  painLabel: proc.meta.painLabel ?? null,
                  results: proc.meta.results ?? null,
                  recovery: proc.meta.recovery ?? null,
                }}
              />
            )}

            {/* Invasiveness badge */}
            {invasiveness && (
              <InvasivenessBadge invasiveness={invasiveness} />
            )}

            {/* Price */}
            {proc.priceFrom != null && (
              <div className="proc-rail__price">
                <span className="proc-price__label">Preț de la</span>
                <strong className="proc-price__value">{proc.priceFrom} lei</strong>
                {proc.priceNote && (
                  <span className="proc-price__note">{proc.priceNote}</span>
                )}
              </div>
            )}

            {/* CTA — rail */}
            {(whatsapp || phone) && (
              <div className="proc-rail__cta">
                <CtaButtons
                  whatsapp={whatsapp}
                  phone={phone}
                  procedureTitle={proc.title}
                  procedureSlug={proc.slug ?? slug}
                  variant="stacked"
                />
              </div>
            )}
          </div>

          {/* Content sections */}
          <div className="proc-detail__content">
          {/* Ce este? */}
          {hasRichTextContent(proc.whatIsIt) && (
            <section className="proc-section" aria-labelledby="ce-este">
              <h2 id="ce-este" className="proc-section__heading">
                <span className="proc-section__icon" aria-hidden="true"><FaCircleInfo /></span>
                Ce este?
              </h2>
              <div className="proc-section__body richtext">
                <RichText data={proc.whatIsIt} />
              </div>
            </section>
          )}

          {/* Cui i se potriveste? */}
          {hasRichTextContent(proc.whoIsItFor) && (
            <section className="proc-section" aria-labelledby="cui-i-se-potriveste">
              <h2 id="cui-i-se-potriveste" className="proc-section__heading">
                <span className="proc-section__icon" aria-hidden="true"><FaUserGroup /></span>
                Cui i se potrivește?
              </h2>
              <div className="proc-section__body richtext">
                <RichText data={proc.whoIsItFor} />
              </div>
            </section>
          )}

          {/* Beneficii */}
          {proc.benefits && proc.benefits.length > 0 && (
            <section className="proc-section" aria-labelledby="beneficii">
              <h2 id="beneficii" className="proc-section__heading">
                <span className="proc-section__icon" aria-hidden="true"><FaListCheck /></span>
                Beneficii
              </h2>
              <ul className="proc-benefits">
                {proc.benefits.map((b, i) =>
                  b.item ? (
                    <li key={b.id ?? i} className="proc-benefits__item">
                      <span className="proc-benefits__dot" aria-hidden="true">
                        ✦
                      </span>
                      {b.item}
                    </li>
                  ) : null,
                )}
              </ul>
            </section>
          )}

          {/* Cum decurge procedura? */}
          {hasRichTextContent(proc.howItWorks) && (
            <section className="proc-section" aria-labelledby="cum-decurge">
              <h2 id="cum-decurge" className="proc-section__heading">
                <span className="proc-section__icon" aria-hidden="true"><FaArrowsRotate /></span>
                Cum decurge procedura?
              </h2>
              <div className="proc-section__body richtext">
                <RichText data={proc.howItWorks} />
              </div>
            </section>
          )}

          {/* Rezultate */}
          {hasRichTextContent(proc.resultsText) && (
            <section className="proc-section" aria-labelledby="rezultate">
              <h2 id="rezultate" className="proc-section__heading">
                <span className="proc-section__icon" aria-hidden="true"><FaStar /></span>
                Rezultate
              </h2>
              <div className="proc-section__body richtext">
                <RichText data={proc.resultsText} />
              </div>
            </section>
          )}

          {/* Indicatii */}
          {indications.length > 0 && (
            <section className="proc-section" aria-labelledby="indicatii">
              <h2 id="indicatii" className="proc-section__heading">
                <span className="proc-section__icon" aria-hidden="true"><FaCircleCheck /></span>
                Indicații
              </h2>
              <ul className="proc-clinical-list proc-clinical-list--yes">
                {indications.map((item) => (
                  <li key={item} className="proc-clinical-list__item">
                    <span className="proc-clinical-list__icon" aria-hidden="true">
                      <FaCircleCheck />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Contraindicatii */}
          {contraindications.length > 0 && (
            <section className="proc-section" aria-labelledby="contraindicatii">
              <h2 id="contraindicatii" className="proc-section__heading">
                <span className="proc-section__icon" aria-hidden="true"><FaCircleXmark /></span>
                Contraindicații
              </h2>
              <ul className="proc-clinical-list proc-clinical-list--no">
                {contraindications.map((item) => (
                  <li key={item} className="proc-clinical-list__item">
                    <span className="proc-clinical-list__icon" aria-hidden="true">
                      <FaCircleXmark />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* FAQ */}
          {faqItems.length > 0 && (
            <section className="proc-section" aria-labelledby="faq">
              <h2 id="faq" className="proc-section__heading">
                Întrebări frecvente
              </h2>
              <FaqAccordion items={faqItems} />
            </section>
          )}

          {/* Related equipment — proves interlinking */}
          {relatedEquipment.length > 0 && (
            <section className="proc-section" aria-labelledby="aparatura">
              <h2 id="aparatura" className="proc-section__heading">
                Aparatură folosită
              </h2>
              <div className="equip-grid">
                {relatedEquipment.map((eq) => (
                  <EquipmentCard
                    key={eq.id}
                    name={eq.name}
                    slug={eq.slug ?? ''}
                    manufacturer={eq.manufacturer ?? null}
                    purpose={eq.purpose ?? null}
                    photo={eq.photo as Media | number | null | undefined}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Related procedures */}
          {relatedProcedures.length > 0 && (
            <section className="proc-section" aria-labelledby="proceduri-similare">
              <h2 id="proceduri-similare" className="proc-section__heading">
                Proceduri similare
              </h2>
              <div className="proc-grid">
                {relatedProcedures.map((rp) => {
                  const rpCat = resolveCategory(rp.category)
                  if (!rpCat?.slug) return null
                  return (
                    <ProcedureCard
                      key={rp.id}
                      title={rp.title}
                      slug={rp.slug ?? ''}
                      category={{ name: rpCat.name, slug: rpCat.slug }}
                      excerpt={rp.excerpt}
                      featuredImage={rp.featuredImage as Media | number | null | undefined}
                      meta={rp.meta ?? null}
                      icon={rp.icon ?? null}
                    />
                  )
                })}
              </div>
            </section>
          )}
          </div>
        </div>

        {/* CTA — bottom */}
        {(whatsapp || phone) && (
          <section className="proc-detail__cta-bottom" aria-label="Programează-te">
            <h2 className="proc-detail__cta-heading">
              Programează-te pentru {proc.title}
            </h2>
            <CtaButtons
              whatsapp={whatsapp}
              phone={phone}
              procedureTitle={proc.title}
              procedureSlug={proc.slug ?? slug}
              variant="stacked"
            />
          </section>
        )}
      </main>

      {whatsapp && (
        <ProcedureStickyCta
          whatsapp={whatsapp}
          phone={phone}
          procedureTitle={proc.title}
        />
      )}
    </>
  )
}
