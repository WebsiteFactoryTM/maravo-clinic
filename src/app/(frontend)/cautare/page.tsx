import React from 'react'
import Link from 'next/link'
import type { Metadata } from 'next'
import { buildMetadata, defaultMetaTitle } from '@/lib/seo'
import { filterIndex, groupResults, type SearchType } from '@/lib/search'
import { buildSearchIndex } from '@/lib/searchIndex'
import SearchPageInput from '@/components/search/SearchPageInput'

// Results depend on the ?q query param, so this page is always dynamic.
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  ...buildMetadata({
    title: defaultMetaTitle('Căutare'),
    description: 'Caută proceduri, aparatură și articole pe site-ul Maravo Clinic Timișoara.',
    path: '/cautare',
  }),
  // Search results pages add no SEO value and shouldn't be indexed.
  robots: { index: false, follow: true },
}

const GROUP_ORDER: SearchType[] = ['procedure', 'equipment', 'article']
const GROUP_LABELS: Record<SearchType, string> = {
  procedure: 'Proceduri',
  equipment: 'Aparatură',
  article: 'Articole',
}

function plural(n: number): string {
  return n === 1 ? 'rezultat' : 'rezultate'
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q = '' } = await searchParams
  const query = q.trim()
  const index = query ? await buildSearchIndex() : []
  const results = filterIndex(index, query)
  const grouped = groupResults(results)

  return (
    <main className="search-page">
      <section className="search-page__head">
        <span className="section-tag">Căutare</span>
        <h1 className="search-page__title">Caută pe site</h1>
        <SearchPageInput initialQuery={query} />
      </section>

      <section className="search-page__results" aria-live="polite">
        {!query ? (
          <p className="search-page__hint">
            Introdu un termen pentru a căuta printre proceduri, aparatură și articole.
          </p>
        ) : results.length === 0 ? (
          <p className="search-page__hint">Niciun rezultat pentru „{query}”.</p>
        ) : (
          <>
            <p className="search-page__count">
              {results.length} {plural(results.length)} pentru „{query}”
            </p>
            {GROUP_ORDER.map((type) => {
              const items = grouped[type]
              if (items.length === 0) return null
              return (
                <div key={type} className="search-page__group">
                  <h2 className="search-page__group-title">
                    {GROUP_LABELS[type]} <span>({items.length})</span>
                  </h2>
                  <ul className="search-page__list">
                    {items.map((item) => (
                      <li key={item.id}>
                        <Link href={item.url} className="search-page__item">
                          <span className="search-page__item-title">{item.title}</span>
                          {item.excerpt && (
                            <span className="search-page__item-excerpt">{item.excerpt}</span>
                          )}
                          {item.category && (
                            <span className="search-page__item-cat">{item.category}</span>
                          )}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })}
          </>
        )}
      </section>
    </main>
  )
}
