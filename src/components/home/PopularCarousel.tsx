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
  const scrollRef = useRef<HTMLUListElement>(null)

  return (
    <section id="popular">
      <div className="popular-header fade-up">
        <span className="section-tag">Cele mai căutate în Timișoara</span>
        <h2 className="popular-title">
          Proceduri <em>populare</em>
        </h2>
      </div>
      <ul
        className="popular-scroll"
        ref={scrollRef}
        aria-label="Proceduri populare"
        tabIndex={0}
      >
        {items.map((item) => (
          <li key={item.id} className="pop-card-li">
            <Link
              href={`/proceduri/${item.categorySlug}/${item.slug}`}
              className="pop-card"
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
          </li>
        ))}
      </ul>
    </section>
  )
}
