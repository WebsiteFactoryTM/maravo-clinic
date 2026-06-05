import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import type { Media } from '@/payload-types'

interface ProcedureCardCategory {
  name: string
  slug: string
}

interface ProcedureCardMeta {
  painLevel?: number | null
}

interface ProcedureCardProps {
  title: string
  slug: string
  category: ProcedureCardCategory
  excerpt?: string | null
  featuredImage?: Media | number | null
  meta?: ProcedureCardMeta | null
  icon?: string | null
}

function resolveMedia(img: Media | number | null | undefined): Media | null {
  if (!img || typeof img === 'number') return null
  return img
}

export default function ProcedureCard({
  title,
  slug,
  category,
  excerpt,
  featuredImage,
  meta,
  icon,
}: ProcedureCardProps) {
  const image = resolveMedia(featuredImage)
  const href = `/proceduri/${category.slug}/${slug}`

  return (
    <Link href={href} className="proc-card proc-card--linked" aria-label={`Procedură: ${title}`}>
      <div className="proc-card__media">
        {image?.url ? (
          <Image
            src={image.url}
            alt={image.alt ?? title}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="proc-card__img"
          />
        ) : (
          <div className="proc-card__placeholder" aria-hidden="true">
            {icon ? (
              <span className="proc-card__icon">{icon}</span>
            ) : (
              <span className="proc-card__icon proc-card__icon--default">✦</span>
            )}
          </div>
        )}
      </div>

      <div className="proc-card__body">
        <span className="proc-card-cat">{category.name}</span>
        <span className="proc-card-name">{title}</span>

        {excerpt && <p className="proc-card__excerpt">{excerpt}</p>}

        {meta?.painLevel != null && (
          <span className="proc-card__pain" aria-label={`Disconfort ${meta.painLevel} din 10`}>
            Disconfort {meta.painLevel}/10
          </span>
        )}
      </div>
    </Link>
  )
}
