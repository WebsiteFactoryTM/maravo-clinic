import React from 'react'
import Link from 'next/link'

interface HeroProps {
  tag?: string | null
  title?: string | null
  subtitle?: string | null
  primaryCta?: { label?: string | null; href?: string | null }
  secondaryCta?: { label?: string | null; href?: string | null }
  procedureCount: number
}

/**
 * Renders the title string allowing \n line breaks and simple <em>…</em> wrapping
 * for italic segments surrounded by single asterisks or kept as-is when the
 * CMS already stores the full string including <em> (we just split on \n).
 */
function HeroTitle({ raw }: { raw: string }) {
  const lines = raw.split('\n')
  return (
    <>
      {lines.map((line, i) => {
        // Detect italic marker: text between *…* → <em>
        const parts = line.split(/(\*[^*]+\*)/)
        return (
          <React.Fragment key={i}>
            {parts.map((part, j) =>
              part.startsWith('*') && part.endsWith('*') ? (
                <em key={j}>{part.slice(1, -1)}</em>
              ) : (
                part
              ),
            )}
            {i < lines.length - 1 && <br />}
          </React.Fragment>
        )
      })}
    </>
  )
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
  const resolvedTitle = title ?? 'Frumusețea ta,\n*redefinită*\nîn Timișoara.'
  const resolvedSubtitle =
    subtitle ??
    'Tratamente estetice premium cu tehnologie de ultimă generație. Rezultate vizibile, îngrijire personalizată, expertiză medicală.'
  const primaryHref = primaryCta?.href ?? '/proceduri'
  const primaryLabel = primaryCta?.label ?? 'Explorează tratamentele'
  const secondaryHref = secondaryCta?.href ?? '/contact'
  const secondaryLabel = secondaryCta?.label ?? 'Rezervă consultație'

  return (
    <section id="hero">
      <div className="hero-bg-art" aria-hidden="true" />
      <div className="hero-left">
        <div className="hero-tag">{resolvedTag}</div>
        <h1 className="hero-h1">
          <HeroTitle raw={resolvedTitle} />
        </h1>
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
