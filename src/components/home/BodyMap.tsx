'use client'

import React, { useCallback, useRef, useState } from 'react'
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
  hotspot: { top: string; left: string }
}

// ── Static zone configuration (ported from maravo-ux-ui/app.js) ──────────

const ZONE_ORDER: BodyZoneId[] = ['par', 'fata', 'gat', 'brate', 'abdomen', 'picioare']

const ZONES: Record<BodyZoneId, ZoneConfig> = {
  par: {
    num: '01',
    label: 'Scalp & Păr',
    desc: 'Regenerare capilară',
    ariaLabel: 'Scalp și păr',
    hotspot: { top: '3.5%', left: '50%' },
  },
  fata: {
    num: '02',
    label: 'Față',
    desc: 'Rejuvenare & îngrijirea tenului',
    ariaLabel: 'Față',
    hotspot: { top: '9.5%', left: '50%' },
  },
  gat: {
    num: '03',
    label: 'Gât & Décolteu',
    desc: 'Lifting & fermitate',
    ariaLabel: 'Gât și décolteu',
    hotspot: { top: '18.5%', left: '50%' },
  },
  brate: {
    num: '04',
    label: 'Brațe',
    desc: 'Epilare & remodelare',
    ariaLabel: 'Brațe',
    hotspot: { top: '41%', left: '29%' },
  },
  abdomen: {
    num: '05',
    label: 'Abdomen & Talie',
    desc: 'Remodelare corporală',
    ariaLabel: 'Abdomen și talie',
    hotspot: { top: '50%', left: '50%' },
  },
  picioare: {
    num: '06',
    label: 'Picioare',
    desc: 'Epilare & tratament vascular',
    ariaLabel: 'Picioare',
    hotspot: { top: '80%', left: '58%' },
  },
}

// ── Props ──────────────────────────────────────────────────────────────────

interface BodyMapProps {
  procedures: BodyMapProcedure[]
}

// ── Component ──────────────────────────────────────────────────────────────

export default function BodyMap({ procedures }: BodyMapProps) {
  const [activeZone, setActiveZone] = useState<BodyZoneId>('fata')
  const panelRef = useRef<HTMLDivElement>(null)

  const selectZone = useCallback(
    (zone: BodyZoneId, scrollPanel = false) => {
      if (!ZONES[zone]) return
      setActiveZone(zone)
      if (scrollPanel && panelRef.current && typeof window !== 'undefined' && window.innerWidth < 768) {
        panelRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    },
    [],
  )

  const zoneData = ZONES[activeZone]
  const zoneProcs = procedures.filter((p) => p.bodyZones?.includes(activeZone))

  return (
    <div className="bodymap">
      {/* ── Body figure with SVG + hotspots ─── */}
      <div className="bodymap-figure">
        <svg
          viewBox="0 0 240 600"
          className="body-svg"
          id="body-svg"
          aria-label="Hartă corporală interactivă — selectează o zonă"
          // role="group" (not "img"): this SVG is an interactive widget whose
          // body parts are focusable buttons. An "img" role must not contain
          // interactive descendants (axe: nested-interactive); "group" may.
          role="group"
          data-active={activeZone}
        >
          <defs>
            <linearGradient id="bodyGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#e9d9c2" />
              <stop offset="100%" stopColor="#cdb295" />
            </linearGradient>
          </defs>
          <g
            className="body-group"
            fill="url(#bodyGrad)"
            stroke="rgba(201,169,110,0.55)"
            strokeWidth="1"
          >
            {/* head */}
            <ellipse
              className={`bp${activeZone === 'fata' ? ' zone-active' : ''}`}
              data-zone="fata"
              cx="120"
              cy="56"
              rx="33"
              ry="37"
              onClick={() => selectZone('fata')}
              role="button"
              aria-label="Față"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' || e.key === ' ' ? selectZone('fata') : undefined}
            />
            {/* scalp cap — a subtle arc above head for the "par" zone */}
            <ellipse
              className={`bp${activeZone === 'par' ? ' zone-active' : ''}`}
              data-zone="par"
              cx="120"
              cy="28"
              rx="26"
              ry="16"
              onClick={() => selectZone('par')}
              role="button"
              aria-label="Scalp și păr"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' || e.key === ' ' ? selectZone('par') : undefined}
            />
            {/* neck */}
            <path
              className={`bp${activeZone === 'gat' ? ' zone-active' : ''}`}
              data-zone="gat"
              d="M108,88 L108,118 Q120,126 132,118 L132,88 Z"
              onClick={() => selectZone('gat')}
              role="button"
              aria-label="Gât și décolteu"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' || e.key === ' ' ? selectZone('gat') : undefined}
            />
            {/* torso */}
            <path
              className={`bp${activeZone === 'abdomen' ? ' zone-active' : ''}`}
              data-zone="abdomen"
              d="M80,134 C92,120 148,120 160,134 L150,300 C140,313 100,313 90,300 Z"
              onClick={() => selectZone('abdomen')}
              role="button"
              aria-label="Abdomen și talie"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' || e.key === ' ' ? selectZone('abdomen') : undefined}
            />
            {/* pelvis */}
            <path
              className={`bp${activeZone === 'abdomen' ? ' zone-active' : ''}`}
              data-zone="abdomen"
              d="M90,296 L150,296 L156,362 C150,378 90,378 84,362 Z"
              onClick={() => selectZone('abdomen')}
              role="button"
              aria-label="Abdomen și talie"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' || e.key === ' ' ? selectZone('abdomen') : undefined}
            />
            {/* right arm */}
            <path
              className={`bp${activeZone === 'brate' ? ' zone-active' : ''}`}
              data-zone="brate"
              d="M156,140 C173,150 181,212 173,300 C171,313 160,313 158,300 C150,222 148,170 148,148 Z"
              onClick={() => selectZone('brate')}
              role="button"
              aria-label="Brațe"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' || e.key === ' ' ? selectZone('brate') : undefined}
            />
            {/* left arm */}
            <path
              className={`bp${activeZone === 'brate' ? ' zone-active' : ''}`}
              data-zone="brate"
              d="M84,140 C67,150 59,212 67,300 C69,313 80,313 82,300 C90,222 92,170 92,148 Z"
              onClick={() => selectZone('brate')}
              role="button"
              aria-label="Brațe"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' || e.key === ' ' ? selectZone('brate') : undefined}
            />
            {/* right leg */}
            <path
              className={`bp${activeZone === 'picioare' ? ' zone-active' : ''}`}
              data-zone="picioare"
              d="M122,362 L154,362 C157,424 151,502 147,578 C146,587 134,587 133,578 C130,502 124,432 120,378 Z"
              onClick={() => selectZone('picioare')}
              role="button"
              aria-label="Picioare"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' || e.key === ' ' ? selectZone('picioare') : undefined}
            />
            {/* left leg */}
            <path
              className={`bp${activeZone === 'picioare' ? ' zone-active' : ''}`}
              data-zone="picioare"
              d="M118,362 L86,362 C83,424 89,502 93,578 C94,587 106,587 107,578 C110,502 116,432 120,378 Z"
              onClick={() => selectZone('picioare')}
              role="button"
              aria-label="Picioare"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' || e.key === ' ' ? selectZone('picioare') : undefined}
            />
          </g>
        </svg>

        {/* Hotspot buttons — positioned over the figure */}
        {ZONE_ORDER.map((zone) => {
          const z = ZONES[zone]
          return (
            <button
              key={zone}
              className={`hotspot${activeZone === zone ? ' active' : ''}`}
              data-zone={zone}
              style={{ top: z.hotspot.top, left: z.hotspot.left }}
              aria-label={z.ariaLabel}
              aria-pressed={activeZone === zone}
              onClick={() => selectZone(zone)}
            >
              <span className="hs-dot" />
            </button>
          )
        })}
      </div>

      {/* ── Info panel ─── */}
      <div className="bodymap-panel" id="bodymap-panel" ref={panelRef}>
        <div className="bmp-head">
          <div className="bmp-zone-num">{zoneData.num}</div>
          <div>
            <div className="bmp-zone-label">{zoneData.label}</div>
            <div className="bmp-zone-desc">{zoneData.desc}</div>
          </div>
          <div className="bmp-count">
            <span>{zoneProcs.length}</span>
            {zoneProcs.length === 1 ? 'procedură' : 'proceduri'}
          </div>
        </div>

        {/* Procedure list */}
        <div
          className="bmp-procs"
          aria-live="polite"
          aria-label={`Proceduri pentru zona ${zoneData.label}`}
        >
          {zoneProcs.length > 0 ? (
            zoneProcs.map((proc) => (
              <Link
                key={proc.id}
                href={`/proceduri/${proc.categorySlug}/${proc.slug}`}
                className="bmp-proc"
              >
                <span className="bmp-proc-name">{proc.title}</span>
                <span className="bmp-proc-arrow" aria-hidden="true">
                  →
                </span>
              </Link>
            ))
          ) : (
            <div className="bmp-proc" style={{ cursor: 'default' }}>
              <span className="bmp-proc-name" style={{ fontStyle: 'italic', opacity: 0.6 }}>
                Proceduri în curând pentru această zonă
              </span>
            </div>
          )}
        </div>

        {/* Zone navigation chips */}
        <nav className="bmp-zonenav" aria-label="Navigare zone corp">
          {ZONE_ORDER.map((zone) => (
            <button
              key={zone}
              className={`bmp-zonechip${activeZone === zone ? ' active' : ''}`}
              data-zone={zone}
              aria-pressed={activeZone === zone}
              onClick={() => selectZone(zone, true)}
            >
              {ZONES[zone].label}
            </button>
          ))}
        </nav>
      </div>
    </div>
  )
}
