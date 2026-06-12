import React from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getPayloadClient } from '@/lib/payload'
import ProcedureCard from '@/components/procedure/ProcedureCard'
import { defaultMetaTitle, defaultMetaDescription } from '@/lib/seo'
import type { Category, Procedure, Media } from '@/payload-types'

export const revalidate = 3600

interface PageProps {
  params: Promise<{ categorie: string }>
}

export async function generateStaticParams() {
  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: 'categories',
    limit: 0,
  })
  return result.docs
    .filter((cat) => cat.slug)
    .map((cat) => ({ categorie: cat.slug as string }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { categorie } = await params
  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: 'categories',
    where: { slug: { equals: categorie } },
    limit: 1,
  })
  const cat = result.docs[0] as Category | undefined
  if (!cat) return {}

  const title = cat.seo?.metaTitle ?? defaultMetaTitle(`${cat.name} Timișoara`)
  const description =
    cat.seo?.metaDescription ??
    defaultMetaDescription(
      cat.description?.trim()
        ? cat.description
        : `Proceduri de ${cat.name.toLowerCase()} la Maravo Clinic Timișoara — tehnologie certificată și rezultate naturale. Programează o consultație.`,
    )

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

  return {
    title,
    description,
    alternates: { canonical: `${siteUrl}/proceduri/${categorie}` },
    openGraph: {
      title,
      description,
      url: `${siteUrl}/proceduri/${categorie}`,
    },
  }
}

function resolveCategory(cat: number | Category): Category | null {
  if (typeof cat === 'number') return null
  return cat
}

export default async function CategoryPage({ params }: PageProps) {
  const { categorie } = await params
  const payload = await getPayloadClient()

  // Fetch category
  const catResult = await payload.find({
    collection: 'categories',
    where: { slug: { equals: categorie } },
    limit: 1,
  })
  const cat = catResult.docs[0] as Category | undefined
  if (!cat) notFound()

  // Fetch published procedures in this category
  const procsResult = await payload.find({
    collection: 'procedures',
    where: {
      and: [
        { status: { equals: 'published' } },
        { category: { equals: cat.id } },
      ],
    },
    limit: 200,
    depth: 1,
  })
  const procedures = procsResult.docs as Procedure[]

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

  return (
    <main className="cat-page">
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
          <li className="breadcrumb__item breadcrumb__item--current" aria-current="page">
            {cat.name}
          </li>
        </ol>
      </nav>

      {/* Header */}
      <section className="cat-page__hero">
        {cat.icon && (
          <span className="cat-page__icon" aria-hidden="true">
            {cat.icon}
          </span>
        )}
        <h1 className="cat-page__title">{cat.name} Timișoara</h1>
        {cat.description && (
          <p className="cat-page__description">{cat.description}</p>
        )}
      </section>

      {/* Procedure grid */}
      {procedures.length === 0 ? (
        <p className="cat-page__empty">
          Nu există proceduri publicate în această categorie momentan.
        </p>
      ) : (
        <section
          className="proc-grid"
          aria-label={`Proceduri ${cat.name}`}
        >
          {procedures.map((proc) => {
            const procCat = resolveCategory(proc.category)
            if (!procCat || !procCat.slug) return null
            return (
              <ProcedureCard
                key={proc.id}
                title={proc.title}
                slug={proc.slug ?? ''}
                category={{ name: procCat.name, slug: procCat.slug }}
                excerpt={proc.excerpt}
                featuredImage={proc.featuredImage as Media | number | null | undefined}
                meta={proc.meta ?? null}
                icon={proc.icon ?? null}
              />
            )
          })}
        </section>
      )}
    </main>
  )
}
