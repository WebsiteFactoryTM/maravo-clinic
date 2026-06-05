import React from 'react'
import Link from 'next/link'
import EquipmentCard from '@/components/procedure/EquipmentCard'
import type { Equipment } from '@/payload-types'
import { resolveMedia } from '@/lib/media'

interface EquipmentGridProps {
  equipment: Equipment[]
}

export default function EquipmentGrid({ equipment }: EquipmentGridProps) {
  if (equipment.length === 0) return null

  return (
    <section id="equipment" aria-labelledby="equipment-heading">
      <div className="about-content" style={{ paddingBottom: 0 }}>
        <span className="section-tag">Tehnologie de ultimă generație</span>
        <h2 className="about-title fade-up" id="equipment-heading">
          Aparatură <em>certificată medical</em>
        </h2>
      </div>
      <div
        className="procedures-grid"
        style={{ padding: '0 24px 64px', gap: 16, background: 'var(--cream)' }}
      >
        {equipment.map((eq) => (
          <EquipmentCard
            key={eq.id}
            name={eq.name}
            slug={eq.slug ?? String(eq.id)}
            manufacturer={eq.manufacturer}
            purpose={eq.purpose}
            photo={resolveMedia(eq.photo)}
          />
        ))}
      </div>
      <div style={{ textAlign: 'center', paddingBottom: '48px' }}>
        <Link
          href="/aparatura"
          className="blog-all"
          aria-label="Vezi toată aparatura"
          style={{ display: 'inline-flex' }}
        >
          Toată aparatura →
        </Link>
      </div>
    </section>
  )
}
