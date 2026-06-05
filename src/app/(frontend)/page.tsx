import React from 'react'
import type { Metadata } from 'next'
import { getPayloadClient } from '@/lib/payload'
import type { Procedure, Equipment, Post, Category } from '@/payload-types'
import type { BodyMapProcedure } from '@/components/home/BodyMap'
import type { PopularItem } from '@/components/home/PopularCarousel'

// ── Section components ───────────────────────────────────────────────────────
import Hero from '@/components/home/Hero'
import PopularCarousel from '@/components/home/PopularCarousel'
import Marquee from '@/components/home/Marquee'
import BodyMap from '@/components/home/BodyMap'
import EquipmentGrid from '@/components/home/EquipmentGrid'
import Stats from '@/components/home/Stats'
import AboutTeaser from '@/components/home/AboutTeaser'
import BlogCarousel from '@/components/home/BlogCarousel'
import Testimonials from '@/components/home/Testimonials'
import BookingCTA from '@/components/home/BookingCTA'
import FadeUp from '@/components/ui/FadeUp'

// ── ISR: revalidate every hour (publish hooks in Task 14 trigger on-demand) ──
export const revalidate = 3600

// ── SEO metadata ─────────────────────────────────────────────────────────────
export const metadata: Metadata = {
  title: 'Maravo Clinic Timișoara | Clinică Estetică Premium',
  description:
    'Clinica estetică de top din Timișoara. Epilare definitivă, botox, acid hialuronic, HIFU, laser Lutronic Clarity II. Rezervă consultație online.',
  openGraph: {
    title: 'Maravo Clinic Timișoara | Clinică Estetică Premium',
    description:
      'Clinica estetică de top din Timișoara. Epilare definitivă, botox, acid hialuronic, HIFU, laser Lutronic Clarity II. Rezervă consultație online.',
    url: 'https://maravoclinic.ro',
    siteName: 'Maravo Clinic',
    locale: 'ro_RO',
    type: 'website',
  },
}

// ── Data fetching ─────────────────────────────────────────────────────────────

async function fetchHomeData() {
  try {
    const payload = await getPayloadClient()

    const [homepageRaw, siteSettingsRaw, proceduresRaw, equipmentRaw, postsRaw] =
      await Promise.all([
        payload.findGlobal({ slug: 'homepage', depth: 2 }).catch(() => null),
        payload.findGlobal({ slug: 'site-settings' }).catch(() => null),
        payload
          .find({
            collection: 'procedures',
            where: { status: { equals: 'published' } },
            depth: 2,
            limit: 0,
            select: {
              title: true,
              slug: true,
              category: true,
              bodyZones: true,
              featuredImage: true,
              excerpt: true,
              icon: true,
              popular: true,
              meta: true,
            },
          })
          .catch(() => ({ docs: [] })),
        payload
          .find({
            collection: 'equipment',
            where: { status: { equals: 'published' } },
            depth: 2,
            limit: 0,
          })
          .catch(() => ({ docs: [] })),
        payload
          .find({
            collection: 'posts',
            where: { status: { equals: 'published' } },
            sort: '-publishedAt',
            depth: 1,
            limit: 4,
          })
          .catch(() => ({ docs: [] })),
      ])

    return {
      homepage: homepageRaw,
      siteSettings: siteSettingsRaw,
      procedures: proceduresRaw.docs as Procedure[],
      equipment: equipmentRaw.docs as Equipment[],
      posts: postsRaw.docs as Post[],
    }
  } catch (err) {
    console.error('[homepage] CMS fetch error:', err)
    return {
      homepage: null,
      siteSettings: null,
      procedures: [] as Procedure[],
      equipment: [] as Equipment[],
      posts: [] as Post[],
    }
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function resolveCategory(cat: number | Category): Category | null {
  if (typeof cat === 'object' && cat !== null) return cat
  return null
}

function toBodyMapProcedure(proc: Procedure): BodyMapProcedure | null {
  const cat = resolveCategory(proc.category)
  if (!cat?.slug || !proc.slug) return null
  return {
    id: proc.id,
    title: proc.title,
    slug: proc.slug,
    categorySlug: cat.slug,
    bodyZones: (proc.bodyZones as BodyMapProcedure['bodyZones']) ?? null,
  }
}

function toPopularItem(proc: Procedure): PopularItem | null {
  const cat = resolveCategory(proc.category)
  if (!cat?.slug || !proc.slug) return null
  return {
    id: proc.id,
    title: proc.title,
    slug: proc.slug,
    categorySlug: cat.slug,
    categoryName: cat.name,
    popular: proc.popular,
  }
}

// ── Page component ────────────────────────────────────────────────────────────

export default async function HomePage() {
  const { homepage, siteSettings, procedures, equipment, posts } = await fetchHomeData()

  // ── Contact details (with env fallbacks) ───────────────────────────────────
  const phone =
    siteSettings?.phone ?? process.env.CLINIC_PHONE ?? '+40000000000'
  const whatsapp =
    siteSettings?.whatsapp ?? process.env.WHATSAPP_NUMBER ?? '40000000000'

  // ── BodyMap procedures ─────────────────────────────────────────────────────
  const bodyMapProcedures: BodyMapProcedure[] = procedures.flatMap((p) => {
    const bm = toBodyMapProcedure(p)
    return bm ? [bm] : []
  })

  // ── Popular procedures ─────────────────────────────────────────────────────
  let popularItems: PopularItem[]
  const cmsPop = homepage?.popularProcedures
  if (cmsPop && cmsPop.length > 0) {
    // CMS-selected procedures (may be Procedure objects at depth 2)
    popularItems = (cmsPop as Array<number | Procedure>).flatMap((p) => {
      if (typeof p === 'number') return []
      const item = toPopularItem(p)
      return item ? [item] : []
    })
  } else {
    // Fall back: flag-based → first 8
    const flagged = procedures.filter((p) => p.popular)
    const source = flagged.length > 0 ? flagged : procedures.slice(0, 8)
    popularItems = source.flatMap((p) => {
      const item = toPopularItem(p)
      return item ? [item] : []
    })
  }

  // ── Stats ─────────────────────────────────────────────────────────────────
  const stats = homepage?.stats ?? []

  // ── Marquee items ─────────────────────────────────────────────────────────
  const marqueeItems = homepage?.marqueeItems ?? []

  // ── About teaser ─────────────────────────────────────────────────────────
  const about = homepage?.aboutTeaser

  return (
    <main>
      {/* 1. Hero */}
      <Hero
        tag={homepage?.heroTag}
        title={homepage?.heroTitle}
        subtitle={homepage?.heroSubtitle}
        primaryCta={homepage?.heroPrimaryCta}
        secondaryCta={homepage?.heroSecondaryCta}
        procedureCount={procedures.length > 0 ? procedures.length : 19}
      />

      {/* 2. Popular procedures carousel */}
      {popularItems.length > 0 && (
        <FadeUp>
          <PopularCarousel items={popularItems} />
        </FadeUp>
      )}

      {/* 3. Marquee strip */}
      <Marquee items={marqueeItems} />

      {/* 4. Body map / search hub */}
      <section id="search">
        <div className="search-header fade-up">
          <span className="section-tag">Explorează după zonă · Atinge corpul</span>
          <h2 className="search-title">
            Ce procedură
            <br />
            <em>cauți astăzi?</em>
          </h2>
        </div>
        <FadeUp>
          <BodyMap procedures={bodyMapProcedures} />
        </FadeUp>
      </section>

      {/* 5. Equipment grid */}
      <FadeUp>
        <EquipmentGrid equipment={equipment} />
      </FadeUp>

      {/* 6. Stats (animated counters) */}
      <Stats stats={stats} />

      {/* 7. About teaser */}
      <FadeUp>
        <AboutTeaser
          heading={about?.heading}
          body={about?.body}
          image={about?.image}
        />
      </FadeUp>

      {/* 8. Blog carousel (renders nothing if no posts) */}
      <FadeUp>
        <BlogCarousel posts={posts} />
      </FadeUp>

      {/* 9. Testimonials */}
      <Testimonials />

      {/* 10. Booking CTA */}
      <FadeUp>
        <BookingCTA whatsapp={whatsapp} phone={phone} />
      </FadeUp>
    </main>
  )
}
