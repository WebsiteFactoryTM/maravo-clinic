'use client'

import React, { useRef } from 'react'
import Link from 'next/link'

export interface PopularItem {
  id: number
  title: string
  slug: string
  categorySlug: string
  categoryName: string
  popular?: boolean | null
}

interface PopularCarouselProps {
  items: PopularItem[]
}

export default function PopularCarousel({ items }: PopularCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  return (
    <section id="popular">
      <div className="popular-header fade-up">
        <span className="section-tag">Cele mai căutate în Timișoara</span>
        <h2 className="popular-title">
          Proceduri <em>populare</em>
        </h2>
      </div>
      <div
        className="popular-scroll"
        ref={scrollRef}
        role="list"
        aria-label="Proceduri populare"
      >
        {items.map((item) => (
          <Link
            key={item.id}
            href={`/proceduri/${item.categorySlug}/${item.slug}`}
            className="pop-card"
            role="listitem"
            aria-label={`${item.title} — ${item.categoryName}`}
          >
            {item.popular && (
              <span className="pop-badge" aria-label="Popular">
                Popular
              </span>
            )}
            <div className="pop-name">{item.title}</div>
            <div className="pop-tag">{item.categoryName}</div>
          </Link>
        ))}
      </div>
    </section>
  )
}
