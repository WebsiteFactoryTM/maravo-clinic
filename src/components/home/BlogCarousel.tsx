import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import type { Post } from '@/payload-types'
import { resolveMedia } from '@/lib/media'

interface BlogCarouselProps {
  posts: Post[]
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

// Gradient placeholders cycling through blog-img-* CSS classes
const BG_CLASSES = ['blog-img-1', 'blog-img-2', 'blog-img-3'] as const

export default function BlogCarousel({ posts }: BlogCarouselProps) {
  // Graceful: render nothing when no posts exist
  if (posts.length === 0) return null

  return (
    <section id="blog" aria-labelledby="blog-heading">
      <div className="blog-header">
        <div>
          <span className="section-tag fade-up">Resurse &amp; Inspirație</span>
          <h2 className="blog-title fade-up" id="blog-heading">
            Articole despre
            <br />
            <em>frumusețe &amp; sănătate</em>
          </h2>
        </div>
        <Link href="/blog" className="blog-all fade-up" aria-label="Toate articolele de blog">
          Toate articolele →
        </Link>
      </div>

      <div className="blog-grid">
        {posts.map((post, i) => {
          const cover = resolveMedia(post.cover)
          const bgClass = BG_CLASSES[i % BG_CLASSES.length]
          const href = `/blog/${post.slug ?? post.id}`
          const dateLabel = formatDate(post.publishedAt ?? post.createdAt)

          return (
            <article key={post.id} className="blog-card fade-up">
              <Link href={href}>
                <div className="blog-card-img">
                  {cover?.url ? (
                    <Image
                      src={cover.url}
                      alt={cover.alt ?? post.title}
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
                <h3 className="blog-card-title">{post.title}</h3>
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
    </section>
  )
}
