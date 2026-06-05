import React from 'react'
import type { Metadata } from 'next'
import { getPayloadClient } from '@/lib/payload'
import EquipmentCard from '@/components/procedure/EquipmentCard'
import type { Equipment, Media } from '@/payload-types'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Aparatură medicală estetică Timișoara — Maravo Clinic',
  description:
    'Descoperă aparatura medicală de ultimă generație folosită în cadrul Maravo Clinic Timișoara pentru tratamente estetice și dermatologice de înaltă calitate.',
}

export default async function EquipmentListPage() {
  const payload = await getPayloadClient()

  const result = await payload.find({
    collection: 'equipment',
    where: { status: { equals: 'published' } },
    limit: 0,
    depth: 1,
  })

  const items = result.docs as Equipment[]

  return (
    <main className="equip-list-page">
      {/* Hero heading */}
      <section className="equip-list-page__hero">
        <span className="section-tag">Tehnologie medicală</span>
        <h1 className="equip-list-page__title">Aparatură Timișoara</h1>
        <p className="equip-list-page__subtitle">
          Utilizăm echipamente de ultimă generație pentru a oferi rezultate sigure, eficiente și
          de lungă durată în cadrul Maravo Clinic Timișoara.
        </p>
      </section>

      {/* Equipment grid */}
      {items.length === 0 ? (
        <p className="equip-list-page__empty">
          Nu există aparatură publicată momentan. Revino curând.
        </p>
      ) : (
        <section
          className="equip-grid equip-grid--listing"
          aria-label="Aparatură medicală"
        >
          {items.map((eq) => (
            <EquipmentCard
              key={eq.id}
              name={eq.name}
              slug={eq.slug ?? ''}
              manufacturer={eq.manufacturer ?? null}
              purpose={eq.purpose ?? null}
              photo={eq.photo as Media | number | null | undefined}
            />
          ))}
        </section>
      )}
    </main>
  )
}
