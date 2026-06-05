'use client'

/**
 * Header — fixed navbar (#navbar).
 * Ported from #navbar markup in Homepage.html and app.js lines 64-67, 179-227.
 *
 * Responsibilities:
 *  - Logo + wordmark
 *  - Desktop nav with Proceduri trigger (opens MegaMenu) + main links
 *  - "Programează-te" CTA (desktop)
 *  - Hamburger button (mobile)
 *  - Scroll listener → `.scrolled` class at 60px
 *  - Orchestrates MegaMenu and MobileMenu open state
 */

import React, { useState, useEffect, useRef, useCallback } from 'react'
import Image from 'next/image'
import MegaMenu from './MegaMenu'
import MobileMenu from './MobileMenu'
import { NAV_LINKS } from './nav-data'

export default function Header() {
  const [scrolled, setScrolled] = useState(false)
  const [megaOpen, setMegaOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  // Ref to the trigger button — needed so outside-click handler in MegaMenu
  // can exclude it (matching the vanilla: `e.target !== navProcBtn`).
  const triggerBtnRef = useRef<HTMLButtonElement>(null)

  // Handlers registered by MegaMenu for the trigger button's hover events
  const triggerHandlersRef = useRef<{
    onMouseEnter: () => void
    onMouseLeave: () => void
  } | null>(null)

  const registerTriggerHandlers = useCallback(
    (handlers: { onMouseEnter: () => void; onMouseLeave: () => void }) => {
      triggerHandlersRef.current = handlers
    },
    [],
  )

  // Scroll → scrolled class
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const openMega = useCallback(() => setMegaOpen(true), [])
  const closeMega = useCallback(() => setMegaOpen(false), [])
  // Track whether hover opened the menu so the click handler can decide to close vs. leave open.
  const hoverOpenedRef = useRef(false)

  const closeMobile = useCallback(() => setMobileOpen(false), [])

  return (
    <>
      <nav id="navbar" className={scrolled ? 'scrolled' : ''}>
        {/* Logo */}
        <a href="/" className="nav-logo">
          <Image
            src="/logo-gold.png"
            alt="Maravo Clinic"
            width={46}
            height={46}
            style={{ height: '40px', width: 'auto' }}
            priority
          />
          <div className="nav-wordmark">
            MARAVO<small>Clinic · Timișoara</small>
          </div>
        </a>

        {/* Desktop nav */}
        <ul className="nav-desktop" id="nav-desktop">
          <li>
            <button
              ref={triggerBtnRef}
              id="nav-proceduri-btn"
              className={`nav-proc-trigger${megaOpen ? ' nav-active' : ''}`}
              aria-expanded={megaOpen}
              onClick={(e) => {
                e.stopPropagation()
                // If hover already opened the menu, a click should close it
                // (and mark that hover is no longer responsible).
                // If hover didn't open it (keyboard/direct click), toggle normally.
                if (hoverOpenedRef.current) {
                  hoverOpenedRef.current = false
                  closeMega()
                } else {
                  setMegaOpen((prev) => !prev)
                }
              }}
              onMouseEnter={() => {
                triggerHandlersRef.current?.onMouseEnter()
                hoverOpenedRef.current = true
                openMega()
              }}
              onMouseLeave={() => {
                triggerHandlersRef.current?.onMouseLeave()
              }}
            >
              Proceduri <span style={{ fontSize: '9px', opacity: 0.6 }}>▼</span>
            </button>
          </li>
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <a href={link.href}>{link.label}</a>
            </li>
          ))}
        </ul>

        {/* CTA */}
        <a href="/contact" className="nav-cta">
          Programează-te
        </a>

        {/* Hamburger */}
        <button
          className={`hamburger${mobileOpen ? ' open' : ''}`}
          id="hamburger"
          aria-label="Meniu"
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((prev) => !prev)}
        >
          <span />
          <span />
          <span />
        </button>
      </nav>

      {/* Mega menu (desktop) */}
      <MegaMenu
        isOpen={megaOpen}
        onClose={closeMega}
        registerTriggerHandlers={registerTriggerHandlers}
      />

      {/* Mobile drawer */}
      <MobileMenu isOpen={mobileOpen} onClose={closeMobile} />
    </>
  )
}
