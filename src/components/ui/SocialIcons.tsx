import React from 'react'
import { FaFacebookF, FaInstagram, FaTiktok } from 'react-icons/fa6'

export interface SocialLink {
  platform: string
  url: string
}

const ICONS: Record<string, { Icon: React.ComponentType; label: string }> = {
  facebook: { Icon: FaFacebookF, label: 'Facebook' },
  instagram: { Icon: FaInstagram, label: 'Instagram' },
  tiktok: { Icon: FaTiktok, label: 'TikTok' },
}

export default function SocialIcons({
  socials,
  className = '',
}: {
  socials: SocialLink[]
  className?: string
}) {
  if (!socials || socials.length === 0) return null
  return (
    <div className={`social-icons ${className}`.trim()}>
      {socials.map((s) => {
        const entry = ICONS[s.platform.toLowerCase()]
        if (!entry) return null
        const { Icon, label } = entry
        return (
          <a
            key={s.platform}
            href={s.url}
            target="_blank"
            rel="noopener noreferrer"
            className="social-icons__link"
            aria-label={label}
          >
            <Icon />
          </a>
        )
      })}
    </div>
  )
}
