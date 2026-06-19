'use client'

import React, { useCallback, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

// ── Types ──────────────────────────────────────────────────────────────────

export type BodyZoneId = 'par' | 'fata' | 'gat' | 'brate' | 'abdomen' | 'picioare'

export interface BodyMapProcedure {
  id: number
  title: string
  slug: string
  categorySlug: string
  bodyZones: BodyZoneId[] | null
}

interface ZoneConfig {
  num: string
  label: string
  desc: string
  ariaLabel: string
  /** Side the connector label sits on (desktop). */
  side: 'left' | 'right'
  /** Vertical position (% of the silhouette height) of the connector + dot. */
  top: number
  /**
   * Horizontal position (% of the figure box width) of the MOBILE dot.
   * Mirrors the desktop layout: dots sit just beside the relevant body part
   * (alternating left/right) instead of on the centreline, so they never cover
   * the face or torso. Desktop connectors ignore this — they position via `side`.
   */
  mobileLeft: number
}

// ── Static zone configuration ───────────────────────────────────────────────
// `top` values are calibrated for the 550×1855 silhouette: the dots fall on
// the head / face / neck / arm / waist / legs. Recalibrate if the image changes.

const ZONE_ORDER: BodyZoneId[] = ['par', 'fata', 'gat', 'brate', 'abdomen', 'picioare']

const ZONES: Record<BodyZoneId, ZoneConfig> = {
  par: {
    num: '01',
    label: 'Păr & Scalp',
    desc: 'Regenerare capilară, anti-cădere',
    ariaLabel: 'Păr și scalp',
    side: 'left',
    top: 4,
    mobileLeft: 30,
  },
  fata: {
    num: '02',
    label: 'Față',
    desc: 'Rejuvenare, lifting, injectabile',
    ariaLabel: 'Față',
    side: 'right',
    top: 11,
    mobileLeft: 76,
  },
  gat: {
    num: '03',
    label: 'Gât & Décolteu',
    desc: 'Lifting & fermitate',
    ariaLabel: 'Gât și décolteu',
    side: 'left',
    top: 19,
    mobileLeft: 24,
  },
  brate: {
    num: '04',
    label: 'Brațe',
    desc: 'Tonifiere, epilare, redefinire',
    ariaLabel: 'Brațe',
    side: 'right',
    top: 33,
    mobileLeft: 78,
  },
  abdomen: {
    num: '05',
    label: 'Abdomen',
    desc: 'Remodelare, lipoliză, tonifiere',
    ariaLabel: 'Abdomen',
    side: 'left',
    top: 42,
    mobileLeft: 22,
  },
  picioare: {
    num: '06',
    label: 'Picioare',
    desc: 'Epilare, vascular, remodelare',
    ariaLabel: 'Picioare',
    side: 'right',
    top: 80,
    mobileLeft: 72,
  },
}

// ── Props ──────────────────────────────────────────────────────────────────

interface BodyMapProps {
  procedures: BodyMapProcedure[]
}

// ── Component ──────────────────────────────────────────────────────────────

export default function BodyMap({ procedures }: BodyMapProps) {
  const [activeZone, setActiveZone] = useState<BodyZoneId>('fata')
  const drawerRef = useRef<HTMLDivElement>(null)

  const selectZone = useCallback((id: BodyZoneId) => {
    setActiveZone(id)
    // Selecting a zone (on the body or a connector) brings the filtered
    // treatments list into view — on both mobile and desktop.
    if (drawerRef.current && typeof window !== 'undefined') {
      drawerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [])

  const zone = ZONES[activeZone]
  const zoneProcs = procedures.filter((p) => p.bodyZones?.includes(activeZone))
  const count = zoneProcs.length

  return (
    <div className="bodymap">
      {/* ── Stage: silhouette + decorative oval + desktop connectors ── */}
      <div className="bm-stage">
        <span className="bm-oval" aria-hidden="true" />

        <div className="bm-figure">
          <Image
            src="/body-figure.png"
            alt="Siluetă feminină indicând zonele corpului pentru tratamente"
            fill
            sizes="(min-width: 768px) 320px, 240px"
            draggable={false}
            priority={false}
          />

          {/* Tappable zone dots ON the silhouette — primary selector on mobile
              (CSS-hidden ≥768px, where the connector labels take over). */}
          <div className="bm-dots">
            {ZONE_ORDER.map((id) => {
              const z = ZONES[id]
              const active = id === activeZone
              return (
                <button
                  key={id}
                  type="button"
                  className={`bm-dot${active ? ' active' : ''}`}
                  style={{ top: `${z.top}%`, left: `${z.mobileLeft}%` }}
                  aria-label={z.ariaLabel}
                  aria-pressed={active}
                  onClick={() => selectZone(id)}
                >
                  <span className="bm-dot__num">{z.num}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Connector labels — visible on desktop (CSS-hidden < 768px). The dot
            DOM order stays PUNCT → LINIE → TEXT on the right side (no
            flex-direction: row-reverse) to avoid the text overlapping the figure. */}
        <div className="bm-connectors">
          {ZONE_ORDER.map((id) => {
            const z = ZONES[id]
            const active = id === activeZone
            const text = (
              <span className="zf-text">
                <span className="zf-title">{z.label}</span>
                <span className="zf-desc">{z.desc}</span>
              </span>
            )
            return (
              <button
                key={id}
                type="button"
                className={`zflag zflag--${z.side}${active ? ' active' : ''}`}
                style={{ top: `${z.top}%` }}
                aria-label={z.ariaLabel}
                aria-pressed={active}
                onClick={() => selectZone(id)}
              >
                {z.side === 'left' ? (
                  <>
                    {text}
                    <span className="zf-line" aria-hidden="true" />
                    <span className="zf-dot" aria-hidden="true" />
                  </>
                ) : (
                  <>
                    <span className="zf-dot" aria-hidden="true" />
                    <span className="zf-line" aria-hidden="true" />
                    {text}
                  </>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Mobile zone list (CSS-hidden ≥ 768px) ── */}
      <div className="bm-zonelist">
        {ZONE_ORDER.map((id) => {
          const z = ZONES[id]
          const active = id === activeZone
          return (
            <button
              key={id}
              type="button"
              className={`bm-zoneitem${active ? ' active' : ''}`}
              aria-label={z.ariaLabel}
              aria-pressed={active}
              onClick={() => selectZone(id)}
            >
              <span className="bm-zoneitem__num">{z.num}</span>
              <span className="bm-zoneitem__text">
                <span className="bm-zoneitem__title">{z.label}</span>
                <span className="bm-zoneitem__desc">{z.desc}</span>
              </span>
            </button>
          )
        })}
      </div>

      {/* ── Drawer ── */}
      <div className="bm-drawer" ref={drawerRef}>
        <div className="bm-drawer__head">
          <div>
            <div className="bm-drawer__title">{zone.label}</div>
            <div className="bm-drawer__desc">{zone.desc}</div>
          </div>
          <div className="bm-drawer__badge">
            <span>{count}</span>
            {count === 1 ? 'tratament' : 'tratamente'}
          </div>
        </div>

        <div
          className="bm-drawer__list"
          aria-live="polite"
          aria-label={`Tratamente pentru zona ${zone.label}`}
        >
          {count > 0 ? (
            zoneProcs.map((proc) => (
              <Link
                key={proc.id}
                href={`/proceduri/${proc.categorySlug}/${proc.slug}`}
                className="bm-drawer__row"
              >
                <span className="bm-drawer__name">{proc.title}</span>
                <span className="bm-drawer__arrow" aria-hidden="true">
                  →
                </span>
              </Link>
            ))
          ) : (
            <p className="bm-drawer__empty">Tratamente în curând pentru această zonă.</p>
          )}
        </div>
      </div>
    </div>
  )
}
