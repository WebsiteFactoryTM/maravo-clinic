'use client'

/**
 * MobileMenu — slide-in drawer + overlay.
 * Ported from app.js lines 229-278 and #mobile-menu / .mob-overlay markup in Homepage.html.
 *
 * Body scroll is locked while open.
 * Escape key and overlay click close the menu.
 *
 * Categories and procedures are CMS-driven, passed from layout server component.
 */

import React, { useEffect, useRef, useState } from 'react'
import type { NavCategory, NavProcedure, NavLink } from './nav-types'

interface MobileMenuProps {
  isOpen: boolean
  onClose: () => void
  categories: NavCategory[]
  procedures: NavProcedure[]
  navLinks: NavLink[]
}

export default function MobileMenu({
  isOpen,
  onClose,
  categories,
  procedures,
  navLinks,
}: MobileMenuProps) {
  const [accordionOpen, setAccordionOpen] = useState(false)
  // Ref to the first focusable element inside the drawer (the Proceduri button).
  const firstFocusRef = useRef<HTMLButtonElement>(null)

  // Lock body scroll when open; move focus into drawer on open.
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      // Defer focus so the drawer has finished its CSS transition enter frame.
      const tid = setTimeout(() => firstFocusRef.current?.focus(), 50)
      return () => clearTimeout(tid)
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
        // `inert` (React 19) removes the closed drawer from the tab order and
        // a11y tree, avoiding the "aria-hidden element is focusable" violation.
        inert={!isOpen}
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
            ref={firstFocusRef}
            className={`mob-link${accordionOpen ? ' open' : ''}`}
            id="mob-proceduri-btn"
            aria-expanded={accordionOpen}
            aria-controls="mob-accordion"
            onClick={() => setAccordionOpen((prev) => !prev)}
          >
            Proceduri <span className="mob-arrow" aria-hidden="true">▾</span>
          </button>

          {/* Procedures accordion */}
          <div
            className={`mob-accordion${accordionOpen ? ' open' : ''}`}
            id="mob-accordion"
          >
            <div id="mob-acc-content">
              {categories.map((cat) => {
                const catProcs = procedures.filter((p) => p.categorySlug === cat.slug)
                return (
                  <div key={cat.slug} className="mob-acc-cat">
                    <div className="mob-acc-cat-title">{cat.name}</div>
                    {catProcs.map((proc) => (
                      <a
                        key={proc.id}
                        href={`/proceduri/${proc.categorySlug}/${proc.slug}`}
                        className="mob-acc-item"
                        onClick={onClose}
                      >
                        {proc.title}
                      </a>
                    ))}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Static nav links */}
          {navLinks.map((link) => (
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
