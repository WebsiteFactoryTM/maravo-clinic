'use client'

/**
 * MobileMenu — slide-in drawer + overlay.
 * Ported from app.js lines 229-278 and #mobile-menu / .mob-overlay markup in Homepage.html.
 *
 * Body scroll is locked while open.
 * Escape key and overlay click close the menu.
 */

import React, { useEffect, useState } from 'react'
import { CATEGORIES, PROCEDURES, NAV_LINKS, procedureHref } from './nav-data'

interface MobileMenuProps {
  isOpen: boolean
  onClose: () => void
}

export default function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const [accordionOpen, setAccordionOpen] = useState(false)

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
      // Reset accordion on close
      setAccordionOpen(false)
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  return (
    <>
      {/* Overlay */}
      <div
        className={`mob-overlay${isOpen ? ' open' : ''}`}
        id="mob-overlay"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        id="mobile-menu"
        aria-hidden={!isOpen}
        className={isOpen ? 'open' : ''}
      >
        {/* Header */}
        <div className="mob-header">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-gold.png" className="mob-logo" alt="Maravo Clinic" />
          <div className="mob-tagline">Clinică estetică premium · Timișoara</div>
        </div>

        {/* Navigation */}
        <nav className="mob-links">
          {/* Proceduri accordion trigger */}
          <button
            className={`mob-link${accordionOpen ? ' open' : ''}`}
            id="mob-proceduri-btn"
            onClick={() => setAccordionOpen((prev) => !prev)}
          >
            Proceduri <span className="mob-arrow">›</span>
          </button>

          {/* Procedures accordion */}
          <div
            className={`mob-accordion${accordionOpen ? ' open' : ''}`}
            id="mob-accordion"
          >
            <div id="mob-acc-content">
              {CATEGORIES.map((cat) => {
                const procs = PROCEDURES.filter((p) => p.cats.includes(cat.id))
                return (
                  <div key={cat.id} className="mob-acc-cat">
                    <div className="mob-acc-cat-title">{cat.label}</div>
                    {procs.map((proc) => (
                      <a
                        key={proc.name}
                        href={procedureHref(proc)}
                        className="mob-acc-item"
                        onClick={onClose}
                      >
                        {proc.name}
                      </a>
                    ))}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Static nav links */}
          {NAV_LINKS.map((link) => (
            <a key={link.href} href={link.href} className="mob-link" onClick={onClose}>
              {link.label}
            </a>
          ))}
        </nav>

        {/* CTA */}
        <div className="mob-cta">
          <a href="/contact" onClick={onClose}>
            Programează-te acum
          </a>
        </div>
      </div>
    </>
  )
}
