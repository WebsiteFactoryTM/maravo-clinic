import React from 'react'
import type { Metadata, Viewport } from 'next'
import { Cormorant_Garamond, DM_Sans } from 'next/font/google'
import '@/styles/globals.css'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import WhatsAppFab from '@/components/ui/WhatsAppFab'
import Reveal from '@/components/ui/Reveal'
import { getPayloadClient } from '@/lib/payload'
import { jsonLdHtml, BASE_URL, OG_IMAGE } from '@/lib/seo'
import { CLINIC } from '@/lib/clinic'
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

const DEFAULT_DESCRIPTION =
  'Maravo Clinic Timișoara — clinică de estetică medicală și dermatologie premium. Proceduri injectabile, tratamente faciale, aparatură de ultimă generație. Programează o consultație.'

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  // NOTE: a plain string title (no `title.template`) on purpose — per-page titles
  // already include the "Maravo Clinic" brand (via defaultMetaTitle or explicit
  // titles), so a global template would double the brand. A plain string here acts
  // purely as the fallback for pages that don't set their own title.
  title: 'Maravo Clinic Timișoara | Clinică Estetică Premium',
  description: DEFAULT_DESCRIPTION,
  alternates: {
    canonical: BASE_URL,
  },
  icons: {
    icon: '/favicon.webp',
    shortcut: '/favicon.webp',
    apple: '/logo-gold.png',
  },
  openGraph: {
    type: 'website',
    siteName: 'Maravo Clinic',
    locale: 'ro_RO',
    url: BASE_URL,
    title: 'Maravo Clinic Timișoara | Clinică Estetică Premium',
    description: DEFAULT_DESCRIPTION,
    images: [{ url: OG_IMAGE }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Maravo Clinic Timișoara | Clinică Estetică Premium',
    description: DEFAULT_DESCRIPTION,
    images: [OG_IMAGE],
  },
}

export const viewport: Viewport = {
  themeColor: '#2E2018',
}

/**
 * Builds the site-wide MedicalClinic schema.org JSON-LD object from site settings.
 * Empty fields are omitted rather than emitted as null.
 */
function buildClinicJsonLd(site: SiteInfo): Record<string, unknown> {
  const address: Record<string, unknown> = {
    '@type': 'PostalAddress',
    addressLocality: 'Timișoara',
    addressCountry: 'RO',
  }
  if (site.address) address.streetAddress = site.address

  const obj: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'MedicalClinic',
    name: site.clinicName || 'Maravo Clinic',
    url: BASE_URL,
    image: OG_IMAGE,
    logo: OG_IMAGE,
    medicalSpecialty: 'Dermatology',
    areaServed: 'Timișoara',
    address,
  }

  const telephone = site.phone || process.env.CLINIC_PHONE
  if (telephone) obj.telephone = telephone
  if (site.email) obj.email = site.email

  if (site.hours.length > 0) {
    obj.openingHours = site.hours.map((h) => `${h.day} ${h.value}`.trim())
  }

  if (site.socials.length > 0) {
    obj.sameAs = site.socials.map((s) => s.url)
  }

  return obj
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
    const cmsHours = (siteSettingsRaw?.hours ?? []).flatMap((h) =>
      h.day && h.value ? [{ day: h.day, value: h.value }] : [],
    )

    const cmsSocials = (siteSettingsRaw?.socials ?? []).flatMap((s) =>
      s.platform && s.url ? [{ platform: s.platform, url: s.url }] : [],
    )

    const siteInfo: SiteInfo = {
      clinicName: siteSettingsRaw?.clinicName || CLINIC.name,
      address: siteSettingsRaw?.address || CLINIC.addressFull,
      phone: siteSettingsRaw?.phone || process.env.CLINIC_PHONE || CLINIC.phone,
      whatsapp: siteSettingsRaw?.whatsapp || process.env.WHATSAPP_NUMBER || CLINIC.whatsapp,
      email: siteSettingsRaw?.email || CLINIC.email,
      hours: cmsHours.length > 0 ? cmsHours : CLINIC.hours.map((h) => ({ day: h.day, value: h.value })),
      socials: cmsSocials.length > 0 ? cmsSocials : CLINIC.socials.map((s) => ({ platform: s.platform, url: s.url })),
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
        clinicName: CLINIC.name,
        address: CLINIC.addressFull,
        phone: process.env.CLINIC_PHONE || CLINIC.phone,
        whatsapp: process.env.WHATSAPP_NUMBER || CLINIC.whatsapp,
        email: CLINIC.email,
        hours: CLINIC.hours.map((h) => ({ day: h.day, value: h.value })),
        socials: CLINIC.socials.map((s) => ({ platform: s.platform, url: s.url })),
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
  const clinicJsonLd = buildClinicJsonLd(siteInfo)

  return (
    <html lang="ro" className={`${serif.variable} ${sans.variable}`}>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLdHtml(clinicJsonLd) }}
        />
        <Header
          categories={categories}
          procedures={procedures}
          navLinks={navLinks}
        />
        <Reveal />
        {children}
        <WhatsAppFab whatsapp={siteInfo.whatsapp} />
        <Footer
          siteInfo={siteInfo}
          footerColumns={footerColumns}
        />
      </body>
    </html>
  )
}
