import React from 'react'

const DEFAULT_ITEMS = [
  'Lutronic Clarity II',
  'Asterasys Liftera',
  'Lumenis NuEra Tight',
  'HydraFacial Syndeo',
  'BTL Lymphastim',
  'Deka Tetra Pro',
  'Acid hialuronic',
  'Toxină botulinică',
]

interface MarqueeProps {
  items?: Array<{ item?: string | null; id?: string | null }>
}

export default function Marquee({ items }: MarqueeProps) {
  // Resolve to plain string array, falling back to defaults
  const resolved: string[] =
    items && items.length > 0
      ? items.flatMap((i) => (i.item ? [i.item] : []))
      : DEFAULT_ITEMS

  // Double the list to create seamless infinite scroll
  const doubled = [...resolved, ...resolved]

  return (
    <div className="marquee-strip" aria-hidden="true">
      <div className="marquee-inner">
        {doubled.map((text, i) => (
          <span key={i} className="marquee-item">
            {text}
          </span>
        ))}
      </div>
    </div>
  )
}
