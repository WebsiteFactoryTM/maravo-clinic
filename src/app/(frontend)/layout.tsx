import React from 'react'
import { Cormorant_Garamond, DM_Sans } from 'next/font/google'
import '@/styles/globals.css'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { getPayloadClient } from '@/lib/payload'
import type {
  NavCategory,
  NavProcedure,
  NavLink,
  FooterColumn,
  SiteInfo,
} from '@/components/layout/nav-types'
import type { Category, Procedure } from '@/payload-types'

const serif = Cormorant_Garamond({
  subsets: ['latin', 'latin-ext'],
  weight: ['300', '400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-serif',
  display: 'swap',
})

const sans = DM_Sans({
  subsets: ['latin', 'latin-ext'],
  weight: ['300', '400', '500'],
  variable: '--font-sans',
  display: 'swap',
})

export const metadata = {
  description: 'Maravo Clinic — Estetică medicală și dermatologie.',
  title: 'Maravo Clinic',
}

/** Default nav links when CMS navigation global is empty */
const DEFAULT_NAV_LINKS: NavLink[] = [
  { label: 'Proceduri', href: '/proceduri' },
  { label: 'Aparatură', href: '/aparatura' },
  { label: 'Tarife', href: '/tarife' },
  { label: 'Despre noi', href: '/despre' },
  { label: 'Blog', href: '/blog' },
  { label: 'Contact', href: '/contact' },
]

async function fetchNavData() {
  try {
    const payload = await getPayloadClient()

    const [siteSettingsRaw, navigationRaw, categoriesRaw, proceduresRaw] = await Promise.all([
      payload.findGlobal({ slug: 'site-settings' }).catch(() => null),
      payload.findGlobal({ slug: 'navigation' }).catch(() => null),
      payload
        .find({
          collection: 'categories',
          sort: 'order',
          limit: 0,
          select: { name: true, slug: true, icon: true, order: true },
        })
        .catch(() => ({ docs: [] })),
      payload
        .find({
          collection: 'procedures',
          where: { status: { equals: 'published' } },
          limit: 0,
          depth: 1,
          select: { title: true, slug: true, category: true },
        })
        .catch(() => ({ docs: [] })),
    ])

    // ── Site settings ─────────────────────────────────────────────────────
    const siteInfo: SiteInfo = {
      clinicName: siteSettingsRaw?.clinicName || 'Maravo Clinic',
      address: siteSettingsRaw?.address || null,
      phone:
        siteSettingsRaw?.phone ||
        (process.env.CLINIC_PHONE ? process.env.CLINIC_PHONE : null),
      whatsapp:
        siteSettingsRaw?.whatsapp ||
        (process.env.WHATSAPP_NUMBER ? process.env.WHATSAPP_NUMBER : null),
      email: siteSettingsRaw?.email || null,
      hours: (siteSettingsRaw?.hours ?? []).flatMap((h) =>
        h.day && h.value ? [{ day: h.day, value: h.value }] : [],
      ),
      socials: (siteSettingsRaw?.socials ?? []).flatMap((s) =>
        s.platform && s.url ? [{ platform: s.platform, url: s.url }] : [],
      ),
    }

    // ── Categories ────────────────────────────────────────────────────────
    const categories: NavCategory[] = (categoriesRaw.docs as Category[]).flatMap((cat) =>
      cat.slug ? [{ id: cat.id, name: cat.name, slug: cat.slug, icon: cat.icon ?? null }] : [],
    )

    // ── Procedures ────────────────────────────────────────────────────────
    const procedures: NavProcedure[] = (proceduresRaw.docs as Procedure[]).flatMap((proc) => {
      if (!proc.slug) return []
      const cat = proc.category
      const categorySlug =
        typeof cat === 'object' && cat !== null && 'slug' in cat && typeof cat.slug === 'string'
          ? cat.slug
          : null
      if (!categorySlug) return []
      return [{ id: proc.id, title: proc.title, slug: proc.slug, categorySlug }]
    })

    // ── Main nav links ────────────────────────────────────────────────────
    const rawMenu = navigationRaw?.mainMenu ?? []
    // Filter out "Proceduri" from CMS mainMenu — it's always rendered as the mega-menu trigger
    const navLinks: NavLink[] =
      rawMenu.length > 0
        ? rawMenu
            .filter(
              (item) => item.label && item.href && item.label.toLowerCase() !== 'proceduri',
            )
            .map((item) => ({ label: item.label!, href: item.href! }))
        : DEFAULT_NAV_LINKS.filter((l) => l.href !== '/proceduri')

    // ── Footer columns ────────────────────────────────────────────────────
    const footerColumns: FooterColumn[] = (navigationRaw?.footerColumns ?? []).flatMap((col) => {
      if (!col.title) return []
      return [
        {
          title: col.title,
          links: (col.links ?? []).flatMap((l) =>
            l.label && l.href ? [{ label: l.label, href: l.href }] : [],
          ),
        },
      ]
    })

    return { siteInfo, categories, procedures, navLinks, footerColumns }
  } catch (err) {
    console.error('[layout] Failed to fetch nav data from CMS:', err)
    // Graceful fallback — render with env/defaults only
    return {
      siteInfo: {
        clinicName: 'Maravo Clinic',
        address: null,
        phone: process.env.CLINIC_PHONE || null,
        whatsapp: process.env.WHATSAPP_NUMBER || null,
        email: null,
        hours: [],
        socials: [],
      } satisfies SiteInfo,
      categories: [] as NavCategory[],
      procedures: [] as NavProcedure[],
      navLinks: DEFAULT_NAV_LINKS.filter((l) => l.href !== '/proceduri'),
      footerColumns: [] as FooterColumn[],
    }
  }
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props
  const { siteInfo, categories, procedures, navLinks, footerColumns } = await fetchNavData()

  return (
    <html lang="ro" className={`${serif.variable} ${sans.variable}`}>
      <body>
        <Header
          categories={categories}
          procedures={procedures}
          navLinks={navLinks}
        />
        {children}
        <Footer
          siteInfo={siteInfo}
          footerColumns={footerColumns}
        />
      </body>
    </html>
  )
}
