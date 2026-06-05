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
      <div className="about-content about-content--no-pb">
        <span className="section-tag">Tehnologie de ultimă generație</span>
        <h2 className="about-title fade-up" id="equipment-heading">
          Aparatură <em>certificată medical</em>
        </h2>
      </div>
      <div className="procedures-grid equipment-grid">
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
      <div className="equipment-cta">
        <Link
          href="/aparatura"
          className="blog-all"
          aria-label="Vezi toată aparatura"
        >
          Toată aparatura →
        </Link>
      </div>
    </section>
  )
}
