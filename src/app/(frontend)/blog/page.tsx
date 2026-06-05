import React from 'react'
import type { Metadata } from 'next'
import { getPayloadClient } from '@/lib/payload'
import { resolveMedia } from '@/lib/media'
import BlogList from '@/components/blog/BlogList'
import type { BlogListItem } from '@/components/blog/BlogList'
import type { Post } from '@/payload-types'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Blog estetică medicală Timișoara — Maravo Clinic',
  description:
    'Articole, ghiduri și sfaturi despre tratamente estetice, îngrijirea pielii și frumusețe, de la specialiștii Maravo Clinic Timișoara.',
}

export default async function BlogPage() {
  const payload = await getPayloadClient()

  const result = await payload.find({
    collection: 'posts',
    where: { status: { equals: 'published' } },
    limit: 0,
    depth: 1,
    sort: '-publishedAt',
  })

  const posts = result.docs as Post[]

  const items: BlogListItem[] = posts.map((post) => {
    const cover = resolveMedia(post.cover)
    return {
      id: post.id,
      title: post.title,
      slug: post.slug ?? String(post.id),
      cover: cover?.url ? { url: cover.url, alt: cover.alt ?? post.title } : null,
      category: post.category ?? null,
      excerpt: post.excerpt ?? null,
      date: post.publishedAt ?? post.createdAt ?? null,
    }
  })

  return (
    <main className="blog-page">
      <header className="blog-page__hero">
        <span className="section-tag">Resurse &amp; inspirație</span>
        <h1 className="blog-page__title">Blog Timișoara</h1>
        <p className="blog-page__intro">
          Ghiduri, noutăți și sfaturi despre estetica medicală, îngrijirea pielii și frumusețe, de la
          echipa Maravo Clinic.
        </p>
      </header>

      <div className="blog-page__body">
        {items.length === 0 ? (
          <div className="blog-empty">
            <span className="blog-empty__icon" aria-hidden="true">
              ✦
            </span>
            <h2 className="blog-empty__title">Articole în curând</h2>
            <p className="blog-empty__text">
              Pregătim conținut despre tratamentele și tehnologiile noastre. Revino în curând pentru
              primele articole.
            </p>
          </div>
        ) : (
          <BlogList posts={items} />
        )}
      </div>
    </main>
  )
}
