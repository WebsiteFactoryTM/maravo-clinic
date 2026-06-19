'use client'

/**
 * MegaMenu — desktop procedure mega-menu (≥1024px).
 * Ported from app.js lines 124-227 and #mega-menu markup in Homepage.html.
 *
 * Open/close is controlled by the parent Header via `isOpen` + `onClose`.
 * The 200ms leave-timer hover logic lives here because MegaMenu owns its
 * own mouse events; Header passes the button's mouseenter/leave handlers
 * back via `onTriggerMouseEnter` / `onTriggerMouseLeave`.
 *
 * Categories and procedures are CMS-driven, passed from layout server component.
 */

import React, { useState, useRef, useEffect, useCallback } from 'react'
import CategoryIcon from '@/components/ui/CategoryIcon'
import { normalizeText } from '@/lib/normalizeText'
import type { NavCategory, NavProcedure } from './nav-types'

interface MegaMenuProps {
  isOpen: boolean
  onClose: () => void
  /** Called by Header to hook the trigger button into the leave timer */
  registerTriggerHandlers: (handlers: {
    onMouseEnter: () => void
    onMouseLeave: () => void
  }) => void
  categories: NavCategory[]
  procedures: NavProcedure[]
}

export default function MegaMenu({
  isOpen,
  onClose,
  registerTriggerHandlers,
  categories,
  procedures,
}: MegaMenuProps) {
  // Default active category to the first CMS category (or empty string if none)
  const firstCatSlug = categories[0]?.slug ?? ''
  const [activeCat, setActiveCat] = useState(firstCatSlug)
  const [searchTerm, setSearchTerm] = useState('')
  const leaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  // Keep activeCat in sync if categories load after mount
  useEffect(() => {
    if (!activeCat && firstCatSlug) {
      setActiveCat(firstCatSlug)
    }
  }, [firstCatSlug, activeCat])

  const clearLeaveTimer = useCallback(() => {
    if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current)
  }, [])

  const scheduleClose = useCallback(() => {
    clearLeaveTimer()
    leaveTimerRef.current = setTimeout(onClose, 200)
  }, [clearLeaveTimer, onClose])

  // Register handlers for the trigger button (in Header) so hover works across both elements
  useEffect(() => {
    registerTriggerHandlers({
      onMouseEnter: clearLeaveTimer,
      onMouseLeave: scheduleClose,
    })
  }, [registerTriggerHandlers, clearLeaveTimer, scheduleClose])

  // Close on outside click.
  // We defer adding the listener by one tick so that the triggering click event
  // (which opened the menu) has finished bubbling before we start listening.
  useEffect(() => {
    if (!isOpen) return
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    const tid = setTimeout(() => document.addEventListener('click', handler), 0)
    return () => {
      clearTimeout(tid)
      document.removeEventListener('click', handler)
    }
  }, [isOpen, onClose])

  // Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  // When the user is searching, match across ALL categories (ignoring the active
  // one). With no search term, show only the active category's procedures.
  const isSearching = searchTerm.trim().length > 0
  const normalizedTerm = normalizeText(searchTerm.trim())
  const filtered = procedures.filter((p) =>
    isSearching
      ? normalizeText(p.title).includes(normalizedTerm)
      : p.categorySlug === activeCat,
  )

  // Map category slug → display name, so cross-category search hits can show
  // which category they belong to.
  const catNameBySlug = new Map(categories.map((c) => [c.slug, c.name]))

  // Reset search term whenever the menu closes so reopening shows an unfiltered list.
  useEffect(() => {
    if (!isOpen) setSearchTerm('')
  }, [isOpen])

  return (
    <div
      id="mega-menu"
      ref={menuRef}
      role="region"
      aria-label="Meniu proceduri"
      // `inert` (React 19) removes the subtree from tab order AND the a11y tree
      // when closed — this prevents the "aria-hidden element is focusable"
      // violation that a bare aria-hidden would cause with focusable children.
      inert={!isOpen}
      className={isOpen ? 'visible' : ''}
      onMouseEnter={clearLeaveTimer}
      onMouseLeave={scheduleClose}
    >
      <div className="mega-inner">
        {/* Left column — category list */}
        <div className="mega-cats">
          {categories.map((cat) => (
            <button
              key={cat.slug}
              className={`mega-cat-btn${activeCat === cat.slug ? ' active' : ''}`}
              data-cat={cat.slug}
              onMouseEnter={() => setActiveCat(cat.slug)}
              onClick={() => setActiveCat(cat.slug)}
            >
              <span className="mega-cat-icon">
                <CategoryIcon slug={cat.slug} />
              </span>
              {cat.name}
            </button>
          ))}
        </div>

        {/* Right column — search + procedure grid */}
        <div className="mega-content">
          <div className="mega-search-wrap">
            <input
              className="mega-search"
              id="mega-search-input"
              type="text"
              placeholder="Caută procedură…"
              autoComplete="off"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <span className="mega-search-icon">⌕</span>
          </div>

          <div className="mega-procs">
            {filtered.length === 0 ? (
              <div className="mega-no-results">Nicio procedură găsită.</div>
            ) : (
              filtered.map((proc) => (
                <a
                  key={proc.id}
                  href={`/proceduri/${proc.categorySlug}/${proc.slug}`}
                  className="mega-proc-item"
                  onClick={onClose}
                >
                  {proc.title}
                  {isSearching && (
                    <span className="mega-proc-cat">
                      {catNameBySlug.get(proc.categorySlug)}
                    </span>
                  )}
                </a>
              ))
            )}
          </div>

          <div className="mega-footer">
            <span className="mega-footer-note">
              Timișoara · Clinică estetică certificată medical
            </span>
            <a
              href="/proceduri"
              className="mega-footer-link"
              onClick={(e) => {
                e.preventDefault()
                onClose()
                // Smooth-scroll to #search if it exists on the page
                const searchSection = document.getElementById('search')
                if (searchSection) {
                  searchSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
                } else {
                  window.location.href = '/proceduri'
                }
              }}
            >
              Toate procedurile →
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
