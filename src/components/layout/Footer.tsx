/**
 * Footer — server/plain component.
 * CMS-driven: receives siteInfo and footerColumns from layout.tsx.
 * Graceful fallbacks when globals are empty or not yet seeded.
 */

import React from 'react'
import type { SiteInfo, FooterColumn } from './nav-types'
import SocialIcons from '@/components/ui/SocialIcons'

interface FooterProps {
  siteInfo: SiteInfo
  footerColumns: FooterColumn[]
}

/** Default footer columns when the navigation global has no footerColumns */
const DEFAULT_FOOTER_COLUMNS: FooterColumn[] = [
  {
    title: 'Tratamente',
    links: [
      { label: 'Epilare definitivă', href: '/proceduri' },
      { label: 'HIFU', href: '/proceduri' },
      { label: 'Acid hialuronic', href: '/proceduri' },
      { label: 'Botox', href: '/proceduri' },
      { label: 'HydraFacial', href: '/proceduri' },
      { label: 'Mezoterapie', href: '/proceduri' },
    ],
  },
  {
    title: 'Clinică',
    links: [
      { label: 'Despre noi', href: '/despre' },
      { label: 'Aparatură', href: '/aparatura' },
      { label: 'Tarife', href: '/tarife' },
      { label: 'Blog', href: '/blog' },
      { label: 'GDPR', href: '/gdpr' },
    ],
  },
]

export default function Footer({ siteInfo, footerColumns }: FooterProps) {
  const cols = footerColumns.length > 0 ? footerColumns : DEFAULT_FOOTER_COLUMNS

  const phone = siteInfo.phone ?? process.env.CLINIC_PHONE ?? null

  return (
    <footer>
      <div className="footer-grid-wrap">
        {/* Brand */}
        <div className="footer-brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-gold.png" className="footer-logo" alt={siteInfo.clinicName} />
          <p className="footer-tagline">
            Clinică estetică premium în Timișoara. Frumusețe și sănătate prin tehnologie medicală
            certificată.
          </p>
        </div>

        {/* Link columns */}
        <div className="footer-cols">
          {cols.map((col) => (
            <div key={col.title}>
              <div className="footer-col-title">{col.title}</div>
              <ul className="footer-links">
                {col.links.map((link) => (
                  <li key={link.href + link.label}>
                    <a href={link.href}>{link.label}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Contact (NAP) — always rendered */}
          <div>
            <div className="footer-col-title">Contact</div>
            {siteInfo.address && (
              <div className="footer-contact-item">{siteInfo.address}</div>
            )}
            {!siteInfo.address && (
              <div className="footer-contact-item">Timișoara, România</div>
            )}
            {phone && (
              <div className="footer-contact-item">
                <a href={`tel:${phone.replace(/\s/g, '')}`}>{phone}</a>
              </div>
            )}
            {siteInfo.email && (
              <div className="footer-contact-item">
                <a href={`mailto:${siteInfo.email}`}>{siteInfo.email}</a>
              </div>
            )}
            {siteInfo.hours.length > 0
              ? siteInfo.hours.map((h) => (
                  <div key={h.day} className="footer-contact-item">
                    {h.day}: {h.value}
                  </div>
                ))
              : null}
          </div>
        </div>

        {/* Socials */}
        <SocialIcons socials={siteInfo.socials} className="footer-socials" />
      </div>

      {/* Bottom bar */}
      <div className="footer-bottom">
        <div className="footer-copy">
          © {new Date().getFullYear()} {siteInfo.clinicName}. Toate drepturile rezervate.
        </div>
        <div className="footer-seo">
          Clinică estetică Timișoara · Epilare definitivă Timișoara · HIFU Timișoara · Botox
          Timișoara · Acid hialuronic Timișoara
        </div>
        <div className="footer-credit">
          Made with <span aria-hidden="true">🤍</span> by{' '}
          <a href="https://websitefactory.ro" target="_blank" rel="noopener noreferrer">
            Website Factory
          </a>
        </div>
      </div>
    </footer>
  )
}
