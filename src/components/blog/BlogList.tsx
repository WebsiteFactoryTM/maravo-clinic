'use client'

import React, { useMemo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

export interface BlogListItem {
  id: number
  title: string
  slug: string
  cover: { url: string; alt: string } | null
  category: string | null
  excerpt: string | null
  date: string | null
}

interface BlogListProps {
  posts: BlogListItem[]
}

const BG_CLASSES = ['blog-img-1', 'blog-img-2', 'blog-img-3'] as const

function formatDate(dateStr: string | null): string {
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

export default function BlogList({ posts }: BlogListProps) {
  const categories = useMemo(() => {
    const set = new Set<string>()
    for (const p of posts) {
      if (p.category) set.add(p.category)
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'ro'))
  }, [posts])

  const [active, setActive] = useState<string | null>(null)

  const visible = active ? posts.filter((p) => p.category === active) : posts

  return (
    <>
      {categories.length > 1 && (
        <div className="blog-filter" role="group" aria-label="Filtrează articolele după categorie">
          <button
            type="button"
            className={`blog-filter__btn${active === null ? ' blog-filter__btn--active' : ''}`}
            aria-pressed={active === null}
            onClick={() => setActive(null)}
          >
            Toate
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              className={`blog-filter__btn${active === cat ? ' blog-filter__btn--active' : ''}`}
              aria-pressed={active === cat}
              onClick={() => setActive(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      <div className="blog-grid">
        {visible.map((post, i) => {
          const bgClass = BG_CLASSES[i % BG_CLASSES.length]
          const dateLabel = formatDate(post.date)
          return (
            <article key={post.id} className="blog-card">
              <Link href={`/blog/${post.slug}`}>
                <div className="blog-card-img">
                  {post.cover ? (
                    <Image
                      src={post.cover.url}
                      alt={post.cover.alt}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="blog-card-img-inner"
                      style={{ objectFit: 'cover' }}
                    />
                  ) : (
                    <div className={`blog-card-img-inner ${bgClass}`} aria-hidden="true" />
                  )}
                </div>
                {post.category && <div className="blog-card-cat">{post.category}</div>}
                <h2 className="blog-card-title">{post.title}</h2>
                {post.excerpt && <p className="blog-card-excerpt">{post.excerpt}</p>}
                <div className="blog-card-meta">
                  {dateLabel && <span className="blog-card-date">{dateLabel}</span>}
                  <span className="blog-card-link">Citește →</span>
                </div>
              </Link>
            </article>
          )
        })}
      </div>
    </>
  )
}
