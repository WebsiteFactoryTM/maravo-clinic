'use client'

/**
 * FadeUp — wraps children and adds `.fade-up` / `.visible` via IntersectionObserver.
 * Matches the vanilla-JS observer in app.js lines 383-396.
 * The staggered delay mirrors the original: (siblingIndex % 4) * 0.08s.
 */

import React, { useEffect, useRef, ReactNode } from 'react'

interface FadeUpProps {
  children: ReactNode
  className?: string
}

export default function FadeUp({ children, className }: FadeUpProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Stagger delay: position among siblings with .fade-up, cycling 0-3
            const parent = entry.target.parentElement
            if (parent) {
              const siblings = Array.from(parent.querySelectorAll('.fade-up'))
              const idx = siblings.indexOf(entry.target as Element)
              ;(entry.target as HTMLElement).style.transitionDelay =
                ((idx % 4) * 0.08).toFixed(2) + 's'
            }
            entry.target.classList.add('visible')
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.1 },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={ref} className={['fade-up', className].filter(Boolean).join(' ')}>
      {children}
    </div>
  )
}
