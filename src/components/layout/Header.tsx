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
 *
 * Props are fetched server-side in layout.tsx and passed down.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import Image from 'next/image'
import MegaMenu from './MegaMenu'
import MobileMenu from './MobileMenu'
import SearchModal from '@/components/search/SearchModal'
import SearchIcon from '@/components/ui/SearchIcon'
import type { NavCategory, NavProcedure, NavLink } from './nav-types'

interface HeaderProps {
  categories: NavCategory[]
  procedures: NavProcedure[]
  navLinks: NavLink[]
}

export default function Header({ categories, procedures, navLinks }: HeaderProps) {
  const [scrolled, setScrolled] = useState(false)
  const [megaOpen, setMegaOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)

  // The transparent (white-on-dark) navbar style only works over the homepage's
  // dark hero. Every other page has a light (cream) background directly under the
  // fixed navbar, where white nav text is unreadable (a11y color-contrast). So we
  // force the solid navbar treatment on all non-home routes.
  const pathname = usePathname()
  const isHome = pathname === '/'
  const solid = scrolled || !isHome

  // Ref to the hamburger button — used to return focus when the mobile drawer closes.
  const hamburgerRef = useRef<HTMLButtonElement>(null)

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

  // Snapshot of megaOpen captured at mousedown — used by the click handler to
  // decide toggle direction without being confused by the mouseenter that fires
  // just before the click event during a pointer-click sequence.
  const megaOpenAtMouseDownRef = useRef(false)

  const closeMobile = useCallback(() => {
    setMobileOpen(false)
    // Return focus to the hamburger button when the drawer closes.
    hamburgerRef.current?.focus()
  }, [])

  // Opening search also dismisses the mobile drawer (the trigger lives in the navbar).
  const openSearch = useCallback(() => {
    setSearchOpen(true)
    setMobileOpen(false)
  }, [])
  const closeSearch = useCallback(() => setSearchOpen(false), [])

  return (
    <>
      <nav id="navbar" className={solid ? 'scrolled' : ''}>
        {/* Logo — intrinsic 1959×1980 (≈1:1); display height via inline style */}
        <a href="/" className="nav-logo" aria-label="Maravo Clinic — Acasă">
          <Image
            src="/logo-gold.png"
            alt="Maravo Clinic"
            width={1959}
            height={1980}
            style={{ height: '44px', width: 'auto' }}
            priority
          />
        </a>

        {/* Desktop nav */}
        <ul className="nav-desktop" id="nav-desktop">
          <li>
            <button
              id="nav-proceduri-btn"
              className={`nav-proc-trigger${megaOpen ? ' nav-active' : ''}`}
              aria-expanded={megaOpen}
              aria-controls="mega-menu"
              onMouseDown={() => {
                // Capture the open state *before* any mouseenter side-effects
                // change it; the click handler reads this snapshot.
                megaOpenAtMouseDownRef.current = megaOpen
              }}
              onClick={(e) => {
                e.stopPropagation()
                // Toggle based on what the state was when the button was pressed,
                // not what it is now (which may have been changed by the
                // browser-synthesised mouseenter that fires before click).
                if (megaOpenAtMouseDownRef.current) {
                  closeMega()
                } else {
                  openMega()
                }
              }}
              onMouseEnter={() => {
                triggerHandlersRef.current?.onMouseEnter()
                openMega()
              }}
              onMouseLeave={() => {
                triggerHandlersRef.current?.onMouseLeave()
              }}
            >
              Proceduri <span style={{ fontSize: '9px', opacity: 0.6 }}>▼</span>
            </button>
          </li>
          {navLinks.map((link) => (
            <li key={link.href}>
              <a href={link.href}>{link.label}</a>
            </li>
          ))}
        </ul>

        {/* Right-side actions: search (always), CTA (desktop), hamburger (mobile) */}
        <div className="nav-actions">
          <button
            type="button"
            className="nav-search-btn"
            aria-label="Caută"
            aria-haspopup="dialog"
            aria-expanded={searchOpen}
            onClick={openSearch}
          >
            <SearchIcon className="nav-search-icon" />
          </button>

          {/* CTA */}
          <a href="/contact" className="nav-cta">
            Programează-te
          </a>

          {/* Hamburger */}
          <button
            ref={hamburgerRef}
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
        </div>
      </nav>

      {/* Mega menu (desktop) */}
      <MegaMenu
        isOpen={megaOpen}
        onClose={closeMega}
        registerTriggerHandlers={registerTriggerHandlers}
        categories={categories}
        procedures={procedures}
      />

      {/* Mobile drawer */}
      <MobileMenu
        isOpen={mobileOpen}
        onClose={closeMobile}
        categories={categories}
        procedures={procedures}
        navLinks={navLinks}
      />

      {/* Site-wide search popup */}
      <SearchModal isOpen={searchOpen} onClose={closeSearch} />
    </>
  )
}
