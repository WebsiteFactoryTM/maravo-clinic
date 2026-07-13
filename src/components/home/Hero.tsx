import React from 'react'
import Link from 'next/link'
import ParsedHeading from '@/components/ui/ParsedHeading'

interface HeroProps {
  tag?: string | null
  title?: string | null
  subtitle?: string | null
  primaryCta?: { label?: string | null; href?: string | null }
  secondaryCta?: { label?: string | null; href?: string | null }
  procedureCount: number
}

export default function Hero({
  tag,
  title,
  subtitle,
  primaryCta,
  secondaryCta,
  procedureCount,
}: HeroProps) {
  const resolvedTag = tag ?? 'Clinică estetică · Timișoara'
  const resolvedTitle = title ?? 'Confidence looks\n*Good on You!*'
  const resolvedSubtitle =
    subtitle ??
    'Tratamente estetice premium cu tehnologie de ultimă generație. Rezultate vizibile, îngrijire personalizată, expertiză medicală.'
  const primaryHref = primaryCta?.href ?? '/proceduri'
  const primaryLabel = primaryCta?.label ?? 'Explorează tratamentele'
  const secondaryHref = secondaryCta?.href ?? '/contact'
  const secondaryLabel = secondaryCta?.label ?? 'Rezervă consultație'

  return (
    <section id="hero">
      <div className="hero-bg-art" aria-hidden="true">
        <span className="hero-blob hero-blob--1" />
        <span className="hero-blob hero-blob--2" />
        <span className="hero-blob hero-blob--3" />
        <span
          className="hero-monogram"
          style={{ backgroundImage: 'url(/favicon.webp)' }}
        />
        <span className="hero-grain" />
      </div>
      <div className="hero-left">
        <div className="hero-tag">{resolvedTag}</div>
        <ParsedHeading as="h1" className="hero-h1" raw={resolvedTitle} />
        <p className="hero-sub">{resolvedSubtitle}</p>
        <div className="hero-actions">
          <Link href={primaryHref} className="btn-primary">
            {primaryLabel}
          </Link>
          <Link href={secondaryHref} className="btn-ghost">
            {secondaryLabel}
          </Link>
        </div>
      </div>
      <div className="hero-badge" aria-label={`${procedureCount}+ proceduri avansate`}>
        <div className="hero-badge-num">
          {procedureCount}
          <sup>+</sup>
        </div>
        <div className="hero-badge-label">Proceduri avansate</div>
      </div>
    </section>
  )
}
