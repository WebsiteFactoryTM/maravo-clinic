/**
 * Shared types for CMS-driven nav data.
 * Passed from the server layout into client components (Header, MegaMenu, MobileMenu, Footer).
 */

export interface NavCategory {
  id: number
  name: string
  slug: string
  icon: string | null
}

export interface NavProcedure {
  id: number
  title: string
  slug: string
  categorySlug: string
}

export interface NavLink {
  label: string
  href: string
}

export interface FooterColumn {
  title: string
  links: NavLink[]
}

export interface SiteInfo {
  clinicName: string
  address: string | null
  phone: string | null
  whatsapp: string | null
  email: string | null
  hours: { day: string; value: string }[]
  socials: { platform: string; url: string }[]
}
