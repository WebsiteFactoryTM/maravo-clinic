import React from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { RichText } from '@payloadcms/richtext-lexical/react'
import { getPayloadClient } from '@/lib/payload'
import ProcedureCard from '@/components/procedure/ProcedureCard'
import { defaultMetaTitle, defaultMetaDescription, breadcrumbJsonLd, jsonLdHtml } from '@/lib/seo'
import { resolveMedia } from '@/lib/media'
import type { Category, Post, Procedure, Media } from '@/payload-types'

export const revalidate = 3600

interface PageProps {
  params: Promise<{ slug: string }>
}

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
  field: { root: { children: unknown[] } } | null | undefined,
): field is { root: { children: unknown[] } } {
  return (
    field != null &&
    typeof field === 'object' &&
    'root' in field &&
    Array.isArray((field as { root: { children: unknown[] } }).root.children) &&
    (field as { root: { children: unknown[] } }).root.children.length > 0
  )
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return ''
  try {
    return new Intl.DateTimeFormat('ro-RO', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date(dateStr))
  } catch {
    return ''
  }
}

export async function generateStaticParams() {
  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: 'posts',
    where: { status: { equals: 'published' } },
    limit: 0,
    depth: 0,
  })
  return result.docs.flatMap((post) => (post.slug ? [{ slug: post.slug }] : []))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: 'posts',
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 1,
  })
  const post = result.docs[0] as Post | undefined
  if (!post) return {}

  const title = post.seo?.metaTitle ?? defaultMetaTitle(post.title)
  const description =
    post.seo?.metaDescription ??
    defaultMetaDescription(
      post.excerpt?.trim() ? post.excerpt : `${post.title} — Maravo Clinic Timișoara.`,
    )

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  const canonical = `${siteUrl}/blog/${post.slug}`
  const ogImage = resolveMedia(post.seo?.ogImage) ?? resolveMedia(post.cover)

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      type: 'article',
      ...(post.publishedAt ? { publishedTime: post.publishedAt } : {}),
      ...(ogImage?.url ? { images: [{ url: ogImage.url, alt: ogImage.alt ?? title }] } : {}),
    },
  }
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params
  const payload = await getPayloadClient()

  const result = await payload.find({
    collection: 'posts',
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 2,
  })
  const post = result.docs[0] as Post | undefined

  if (!post) notFound()
  if (post.status !== 'published') notFound()

  const cover = resolveMedia(post.cover)
  const dateLabel = formatDate(post.publishedAt ?? post.createdAt)

  const relatedProcedures = (post.relatedProcedures ?? [])
    .map(resolveProcedure)
    .filter((p): p is Procedure => p !== null && p.status === 'published')

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  const pageUrl = `${siteUrl}/blog/${post.slug ?? slug}`

  const description =
    post.seo?.metaDescription ?? post.excerpt ?? `${post.title} — Maravo Clinic Timișoara.`

  const jsonLdPost = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description,
    ...(post.publishedAt ? { datePublished: post.publishedAt } : {}),
    dateModified: post.updatedAt,
    ...(cover?.url ? { image: cover.url } : {}),
    mainEntityOfPage: { '@type': 'WebPage', '@id': pageUrl },
    author: { '@type': 'Organization', name: 'Maravo Clinic' },
    publisher: { '@type': 'Organization', name: 'Maravo Clinic' },
  }

  const jsonLdBreadcrumb = breadcrumbJsonLd([
    { name: 'Acasă', url: `${siteUrl}/` },
    { name: 'Blog', url: `${siteUrl}/blog` },
    { name: post.title, url: pageUrl },
  ])

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdHtml(jsonLdPost) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdHtml(jsonLdBreadcrumb) }}
      />

      <main className="blog-detail">
        <nav className="breadcrumb" aria-label="Breadcrumb">
          <ol className="breadcrumb__list">
            <li className="breadcrumb__item">
              <Link href="/">Acasă</Link>
            </li>
            <li className="breadcrumb__item breadcrumb__sep" aria-hidden="true">
              /
            </li>
            <li className="breadcrumb__item">
              <Link href="/blog">Blog</Link>
            </li>
            <li className="breadcrumb__item breadcrumb__sep" aria-hidden="true">
              /
            </li>
            <li className="breadcrumb__item breadcrumb__item--current" aria-current="page">
              {post.title}
            </li>
          </ol>
        </nav>

        <header className="blog-detail__hero">
          {post.category && <span className="blog-detail__cat">{post.category}</span>}
          <h1 className="blog-detail__title">{post.title}</h1>
          {dateLabel && (
            <time className="blog-detail__date" dateTime={post.publishedAt ?? post.createdAt}>
              {dateLabel}
            </time>
          )}
        </header>

        {cover?.url && (
          <figure className="blog-detail__cover">
            <Image
              src={cover.url}
              alt={cover.alt ?? post.title}
              fill
              sizes="(max-width: 960px) 100vw, 960px"
              className="blog-detail__cover-img"
              priority
            />
          </figure>
        )}

        <div className="blog-detail__content">
          {hasRichTextContent(post.body) ? (
            <div className="blog-detail__richtext richtext">
              <RichText data={post.body} />
            </div>
          ) : (
            post.excerpt && <p className="blog-detail__richtext">{post.excerpt}</p>
          )}
        </div>

        {relatedProcedures.length > 0 && (
          <section className="blog-detail__related" aria-labelledby="blog-related">
            <h2 className="blog-detail__related-title" id="blog-related">
              Proceduri recomandate
            </h2>
            <div className="blog-detail__related-grid">
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
      </main>
    </>
  )
}
