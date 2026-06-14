'use client'

import React, { useEffect, useRef, useState } from 'react'

interface StatItem {
  value?: string | null
  label?: string | null
  id?: string | null
}

interface StatsProps {
  stats: StatItem[]
}

const DEFAULT_STATS: StatItem[] = [
  { value: '19+', label: 'Proceduri avansate' },
  { value: '7', label: 'Tehnologii medicale' },
  { value: '100%', label: 'Aparatură certificată CE' },
  { value: '1:1', label: 'Consultație personalizată' },
]

/**
 * Parses a stat value string like "34+", "1K+", "5★", "#1"
 * Returns { prefix, number, suffix } where number is the numeric part to animate.
 */
function parseStat(raw: string): { prefix: string; num: number | null; suffix: string } {
  // Match optional prefix (#), then digits, then optional suffix (+, K+, ★, etc.)
  const m = raw.match(/^([#]?)(\d+)(.*)$/)
  if (!m) return { prefix: '', num: null, suffix: raw }
  return { prefix: m[1] ?? '', num: parseInt(m[2], 10), suffix: m[3] ?? '' }
}

function AnimatedStat({ value, label }: { value: string; label: string }) {
  const { prefix, num, suffix } = parseStat(value)
  const [displayed, setDisplayed] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const started = useRef(false)

  useEffect(() => {
    if (num === null) return
    const el = ref.current
    if (!el) return

    let rafId: number

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true
          const duration = 1400
          const start = performance.now()
          const target = num

          function tick(now: number) {
            const elapsed = now - start
            const progress = Math.min(elapsed / duration, 1)
            // ease-out quad
            const eased = 1 - (1 - progress) * (1 - progress)
            setDisplayed(Math.round(eased * target))
            if (progress < 1) rafId = requestAnimationFrame(tick)
          }
          rafId = requestAnimationFrame(tick)
          observer.disconnect()
        }
      },
      { threshold: 0.25 },
    )
    observer.observe(el)
    return () => {
      observer.disconnect()
      cancelAnimationFrame(rafId)
    }
  }, [num])

  return (
    <div className="stat-item fade-up" ref={ref}>
      <div className="stat-num" aria-label={value}>
        {prefix}
        {num !== null ? displayed : value}
        {num !== null && <sup>{suffix}</sup>}
      </div>
      <div className="stat-label">{label}</div>
    </div>
  )
}

export default function Stats({ stats }: StatsProps) {
  const resolved = stats.length > 0 ? stats : DEFAULT_STATS
  const items = resolved.flatMap((s) =>
    s.value && s.label ? [{ value: s.value, label: s.label }] : [],
  )

  return (
    <div id="stats" aria-label="Statistici Maravo Clinic">
      {items.map((item, i) => (
        <AnimatedStat key={i} value={item.value} label={item.label} />
      ))}
    </div>
  )
}
