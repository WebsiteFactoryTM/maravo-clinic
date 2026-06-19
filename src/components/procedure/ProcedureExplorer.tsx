'use client'

import React, { useState, useMemo } from 'react'
import ProcedureCard from './ProcedureCard'
import CategoryIcon from '@/components/ui/CategoryIcon'
import type { Media } from '@/payload-types'

export interface ProcedureExplorerItem {
  id: number
  title: string
  slug: string
  excerpt: string
  icon?: string | null
  featuredImage?: Media | number | null
  meta?: {
    painLevel?: number | null
  } | null
  category: {
    name: string
    slug: string
  }
}

export interface CategoryPill {
  id: number
  name: string
  slug: string
  icon?: string | null
}

interface ProcedureExplorerProps {
  procedures: ProcedureExplorerItem[]
  categories: CategoryPill[]
}

export default function ProcedureExplorer({ procedures, categories }: ProcedureExplorerProps) {
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return procedures.filter((p) => {
      const matchesCat = !activeCategory || p.category.slug === activeCategory
      const matchesSearch =
        !q ||
        p.title.toLowerCase().includes(q) ||
        p.excerpt.toLowerCase().includes(q) ||
        p.category.name.toLowerCase().includes(q)
      return matchesCat && matchesSearch
    })
  }, [procedures, search, activeCategory])

  return (
    <section className="proc-explorer" aria-label="Caută proceduri">
      {/* Search */}
      <div className="proc-explorer__search-wrap">
        <label htmlFor="proc-search" className="sr-only">
          Caută o procedură
        </label>
        <input
          id="proc-search"
          type="search"
          className="proc-explorer__search"
          placeholder="Caută o procedură…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Caută o procedură"
        />
      </div>

      {/* Category pills */}
      <div className="proc-explorer__pills" role="group" aria-label="Filtrează după categorie">
        <button
          type="button"
          className={`cat-pill${!activeCategory ? ' cat-pill--active' : ''}`}
          onClick={() => setActiveCategory(null)}
          aria-pressed={!activeCategory}
        >
          Toate
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            className={`cat-pill${activeCategory === cat.slug ? ' cat-pill--active' : ''}`}
            onClick={() => setActiveCategory(activeCategory === cat.slug ? null : cat.slug)}
            aria-pressed={activeCategory === cat.slug}
          >
            <span className="cat-pill__icon" aria-hidden="true">
              <CategoryIcon slug={cat.slug} />
            </span>
            {cat.name}
          </button>
        ))}
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <p className="proc-explorer__empty" role="status">
          Nicio procedură găsită. Încearcă alt termen.
        </p>
      ) : (
        <div
          className="proc-grid"
          role="list"
          aria-label={`${filtered.length} procedur${filtered.length === 1 ? 'ă' : 'i'} găsit${filtered.length === 1 ? 'ă' : 'e'}`}
        >
          {filtered.map((p) => (
            <div key={p.id} role="listitem">
              <ProcedureCard
                title={p.title}
                slug={p.slug}
                category={p.category}
                excerpt={p.excerpt}
                featuredImage={p.featuredImage}
                meta={p.meta}
                icon={p.icon}
              />
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
