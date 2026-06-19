'use client'

import React, { useMemo, useState } from 'react'
import Link from 'next/link'
import CategoryIcon from '@/components/ui/CategoryIcon'

export interface TarifeRowItem {
  id: number
  title: string
  /** Full procedure URL, or null when not linkable. */
  href: string | null
  priceFrom: number | null
  priceNote: string | null
}

export interface TarifeSection {
  id: number
  name: string
  slug: string | null
  icon?: string | null
  procs: TarifeRowItem[]
}

interface TarifeExplorerProps {
  sections: TarifeSection[]
}

/** Diacritic- and case-insensitive normalization (ă â î ș ț → a a i s t). */
function norm(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
}

function formatLei(value: number): string {
  return new Intl.NumberFormat('ro-RO').format(value)
}

function countLabel(n: number): string {
  return n === 1 ? '1 procedură' : `${n} proceduri`
}

export default function TarifeExplorer({ sections }: TarifeExplorerProps) {
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState<number | null>(null)

  const filtered = useMemo(() => {
    const q = norm(search.trim())
    return sections
      .map((section) => {
        if (activeCategory != null && section.id !== activeCategory) {
          return { ...section, procs: [] as TarifeRowItem[] }
        }
        if (!q) return section
        const catMatches = norm(section.name).includes(q)
        const procs = catMatches
          ? section.procs
          : section.procs.filter((p) => norm(p.title).includes(q))
        return { ...section, procs }
      })
      .filter((section) => section.procs.length > 0)
  }, [sections, search, activeCategory])

  const total = useMemo(
    () => filtered.reduce((sum, s) => sum + s.procs.length, 0),
    [filtered],
  )

  const hasQuery = search.trim().length > 0 || activeCategory != null

  return (
    <div className="tarife-explorer">
      <div className="tarife-toolbar">
        <div className="tarife-search">
          <svg
            className="tarife-search__icon"
            viewBox="0 0 24 24"
            aria-hidden="true"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.2-3.2" />
          </svg>
          <label htmlFor="tarife-search" className="sr-only">
            Caută o procedură sau o categorie
          </label>
          <input
            id="tarife-search"
            type="search"
            className="tarife-search__input"
            placeholder="Caută o procedură…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoComplete="off"
          />
          {search && (
            <button
              type="button"
              className="tarife-search__clear"
              onClick={() => setSearch('')}
              aria-label="Șterge căutarea"
            >
              ×
            </button>
          )}
        </div>

        <div
          className="tarife-pills"
          role="group"
          aria-label="Filtrează după categorie"
        >
          <button
            type="button"
            className={`cat-pill${activeCategory == null ? ' cat-pill--active' : ''}`}
            onClick={() => setActiveCategory(null)}
            aria-pressed={activeCategory == null}
          >
            Toate
          </button>
          {sections.map((section) => (
            <button
              key={section.id}
              type="button"
              className={`cat-pill${activeCategory === section.id ? ' cat-pill--active' : ''}`}
              onClick={() =>
                setActiveCategory(activeCategory === section.id ? null : section.id)
              }
              aria-pressed={activeCategory === section.id}
            >
              <span className="cat-pill__icon" aria-hidden="true">
                <CategoryIcon slug={section.slug} />
              </span>
              {section.name}
            </button>
          ))}
        </div>

        <p className="tarife-count" role="status" aria-live="polite">
          {countLabel(total)}
          {hasQuery && total > 0 ? ' afișate' : ''}
        </p>
      </div>

      <div className="tarife-results">
        {filtered.length === 0 ? (
          <p className="tarife-empty" role="status">
            Nicio procedură găsită pentru „{search.trim()}”. Încearcă alt termen sau
            <button
              type="button"
              className="tarife-empty__reset"
              onClick={() => {
                setSearch('')
                setActiveCategory(null)
              }}
            >
              resetează filtrele
            </button>
            .
          </p>
        ) : (
          filtered.map((section) => (
            <section
              key={section.id}
              className="tarife-cat"
              aria-labelledby={`tarife-cat-${section.id}`}
            >
              <div className="tarife-cat__head">
                <span className="tarife-cat__icon" aria-hidden="true">
                  <CategoryIcon slug={section.slug} />
                </span>
                <h2 className="tarife-cat__title" id={`tarife-cat-${section.id}`}>
                  {section.name}
                </h2>
                <span className="tarife-cat__count">{countLabel(section.procs.length)}</span>
              </div>

              <ul className="tarife-rows">
                {section.procs.map((proc) => (
                  <li key={proc.id} className="tarife-row">
                    {proc.href ? (
                      <Link href={proc.href} className="tarife-row__name">
                        {proc.title}
                      </Link>
                    ) : (
                      <span className="tarife-row__name">{proc.title}</span>
                    )}

                    <span className="tarife-row__leader" aria-hidden="true" />

                    <span className="tarife-row__price">
                      {proc.priceFrom != null ? (
                        <>
                          <span className="tarife-row__amount">
                            de la {formatLei(proc.priceFrom)} lei
                          </span>
                          {proc.priceNote && (
                            <span className="tarife-row__note">{proc.priceNote}</span>
                          )}
                        </>
                      ) : (
                        <span className="tarife-row__amount tarife-row__amount--soft">
                          Preț la consultație
                        </span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ))
        )}
      </div>
    </div>
  )
}
