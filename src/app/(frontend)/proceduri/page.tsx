import React from 'react'
import { buildMetadata, defaultMetaTitle } from '@/lib/seo'
import Link from 'next/link'
import { getPayloadClient } from '@/lib/payload'
import { sortProcedures } from '@/lib/procedure-sort'
import ProcedureExplorer from '@/components/procedure/ProcedureExplorer'
import CategoryIcon from '@/components/ui/CategoryIcon'
import BodyMap from '@/components/home/BodyMap'
import type { BodyMapProcedure } from '@/components/home/BodyMap'
import type { Category, Procedure, Media } from '@/payload-types'

export const revalidate = 3600

export const metadata = buildMetadata({
  title: defaultMetaTitle('Proceduri estetice Timișoara'),
  description:
    'Toate procedurile estetice și dermatologice Maravo Clinic Timișoara, pe categorii: față, corp, laser, injectabile. Programează o consultație.',
  path: '/proceduri',
})

function resolveCategory(cat: number | Category): Category | null {
  if (typeof cat === 'number') return null
  return cat
}

export default async function ProcedureHubPage() {
  const payload = await getPayloadClient()

  const [categoriesResult, proceduresResult] = await Promise.all([
    payload.find({
      collection: 'categories',
      limit: 0,
      sort: 'order',
    }),
    payload.find({
      collection: 'procedures',
      where: { status: { equals: 'published' } },
      limit: 0,
      depth: 1,
    }),
  ])

  const categories = categoriesResult.docs as Category[]
  // Flat list spanning every category, so it needs the category-aware JS sort
  // rather than a plain SQL `sort` (Payload can't sort on `category.order`).
  const procedures = sortProcedures(proceduresResult.docs as Procedure[])

  // Build serialisable explorer items — only include procedures whose
  // category resolved (depth 1 means category is populated as an object).
  const explorerItems = procedures.flatMap((proc) => {
    const cat = resolveCategory(proc.category)
    if (!cat || !cat.slug) return []
    return [
      {
        id: proc.id,
        title: proc.title,
        slug: proc.slug ?? '',
        excerpt: proc.excerpt ?? '',
        icon: proc.icon ?? null,
        featuredImage: proc.featuredImage as Media | number | null | undefined,
        meta: proc.meta
          ? { painLevel: proc.meta.painLevel ?? null }
          : null,
        category: { name: cat.name, slug: cat.slug },
      },
    ]
  })

  // Build body-map items — include bodyZones for zone-navigator mapping.
  const bodyMapItems: BodyMapProcedure[] = procedures.flatMap((proc) => {
    const cat = resolveCategory(proc.category)
    if (!cat || !cat.slug) return []
    return [
      {
        id: proc.id,
        title: proc.title,
        slug: proc.slug ?? '',
        categorySlug: cat.slug,
        bodyZones: (proc.bodyZones as BodyMapProcedure['bodyZones']) ?? null,
      },
    ]
  })

  const categoryPills = categories
    .filter((c) => c.slug)
    .map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug as string,
      icon: c.icon ?? null,
    }))

  return (
    <main className="proc-hub">
      {/* Hero heading */}
      <section className="proc-hub__hero">
        <span className="section-tag">Estetică medicală</span>
        <h1 className="proc-hub__title">Proceduri Timișoara</h1>
        <p className="proc-hub__subtitle">
          Tratamente personalizate pentru îngrijirea și frumusețea ta, realizate de specialiști în
          cadrul Maravo Clinic Timișoara.
        </p>
      </section>

      {/* Category tiles */}
      {categories.length > 0 && (
        <section className="proc-hub__cats" aria-label="Categorii de proceduri">
          <h2 className="proc-hub__section-title">Categorii</h2>
          <div className="cat-tiles">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/proceduri/${cat.slug ?? ''}`}
                className="cat-tile"
                aria-label={`Proceduri ${cat.name}`}
              >
                <span className="cat-tile__icon" aria-hidden="true">
                  <CategoryIcon slug={cat.slug} />
                </span>
                <span className="cat-tile__name">{cat.name}</span>
                {cat.description && (
                  <span className="cat-tile__desc">{cat.description}</span>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Interactive body-map zone navigator */}
      <section className="proc-hub__bodymap" aria-labelledby="bodymap-heading">
        <h2 className="proc-hub__section-title" id="bodymap-heading">
          Explorează după zonă
        </h2>
        <BodyMap procedures={bodyMapItems} />
      </section>

      {/* Interactive searchable/filterable grid */}
      <section className="proc-hub__explorer">
        <h2 className="proc-hub__section-title">Toate procedurile</h2>
        <ProcedureExplorer procedures={explorerItems} categories={categoryPills} />
      </section>
    </main>
  )
}
