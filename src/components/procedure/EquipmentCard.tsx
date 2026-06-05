import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import type { Media } from '@/payload-types'

interface EquipmentCardProps {
  name: string
  slug: string
  manufacturer?: string | null
  purpose?: string | null
  photo?: Media | number | null
}

function resolveMedia(img: Media | number | null | undefined): Media | null {
  if (!img || typeof img === 'number') return null
  return img
}

export default function EquipmentCard({
  name,
  slug,
  manufacturer,
  purpose,
  photo,
}: EquipmentCardProps) {
  const image = resolveMedia(photo)
  const href = `/aparatura/${slug}`

  return (
    <Link href={href} className="equip-card" aria-label={`Aparatură: ${name}`}>
      <div className="equip-card__media">
        {image?.url ? (
          <Image
            src={image.url}
            alt={image.alt ?? name}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="equip-card__img"
          />
        ) : (
          <div className="equip-card__placeholder" aria-hidden="true">
            <span className="equip-card__icon">⚙</span>
          </div>
        )}
      </div>

      <div className="equip-card__body">
        <span className="equip-card__name">{name}</span>
        {manufacturer && (
          <span className="equip-card__manufacturer">{manufacturer}</span>
        )}
        {purpose && <p className="equip-card__purpose">{purpose}</p>}
      </div>
    </Link>
  )
}
