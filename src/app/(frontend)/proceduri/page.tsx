import React from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { getPayloadClient } from '@/lib/payload'
import ProcedureExplorer from '@/components/procedure/ProcedureExplorer'
import type { Category, Procedure, Media } from '@/payload-types'

export const metadata: Metadata = {
  title: 'Proceduri estetice Timișoara — Maravo Clinic',
  description:
    'Descoperă gama completă de proceduri estetice și dermatologice oferite de Maravo Clinic în Timișoara.',
}

function resolveCategory(cat: number | Category): Category | null {
  if (typeof cat === 'number') return null
  return cat
}

export default async function ProcedureHubPage() {
  const payload = await getPayloadClient()

  const [categoriesResult, proceduresResult] = await Promise.all([
    payload.find({
      collection: 'categories',
      limit: 100,
      sort: 'order',
    }),
    payload.find({
      collection: 'procedures',
      where: { status: { equals: 'published' } },
      limit: 300,
      depth: 1,
    }),
  ])

  const categories = categoriesResult.docs as Category[]
  const procedures = proceduresResult.docs as Procedure[]

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
        excerpt: proc.excerpt,
        icon: proc.icon ?? null,
        featuredImage: proc.featuredImage as Media | number | null | undefined,
        meta: proc.meta
          ? { painLevel: proc.meta.painLevel ?? null }
          : null,
        category: { name: cat.name, slug: cat.slug },
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
                {cat.icon && (
                  <span className="cat-tile__icon" aria-hidden="true">
                    {cat.icon}
                  </span>
                )}
                <span className="cat-tile__name">{cat.name}</span>
                {cat.description && (
                  <span className="cat-tile__desc">{cat.description}</span>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Interactive searchable/filterable grid */}
      <section className="proc-hub__explorer">
        <h2 className="proc-hub__section-title">Toate procedurile</h2>
        {/* BODYMAP PLACEHOLDER — Task 19 will mount the interactive BodyMap component here */}
        {/* <BodyMap procedures={explorerItems} /> */}
        <ProcedureExplorer procedures={explorerItems} categories={categoryPills} />
      </section>
    </main>
  )
}
