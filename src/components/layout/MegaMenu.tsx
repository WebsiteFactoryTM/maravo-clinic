'use client'

/**
 * MegaMenu — desktop procedure mega-menu (≥1024px).
 * Ported from app.js lines 124-227 and #mega-menu markup in Homepage.html.
 *
 * Open/close is controlled by the parent Header via `isOpen` + `onClose`.
 * The 200ms leave-timer hover logic lives here because MegaMenu owns its
 * own mouse events; Header passes the button's mouseenter/leave handlers
 * back via `onTriggerMouseEnter` / `onTriggerMouseLeave`.
 */

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { CATEGORIES, PROCEDURES, procedureHref } from './nav-data'

interface MegaMenuProps {
  isOpen: boolean
  onClose: () => void
  /** Called by Header to hook the trigger button into the leave timer */
  registerTriggerHandlers: (handlers: {
    onMouseEnter: () => void
    onMouseLeave: () => void
  }) => void
}

export default function MegaMenu({ isOpen, onClose, registerTriggerHandlers }: MegaMenuProps) {
  const [activeCat, setActiveCat] = useState('fata')
  const [searchTerm, setSearchTerm] = useState('')
  const leaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

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

  const filtered = PROCEDURES.filter((p) => {
    const catMatch = p.cats.includes(activeCat)
    const searchMatch = !searchTerm || p.name.toLowerCase().includes(searchTerm.toLowerCase())
    return catMatch && searchMatch
  })

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
      aria-hidden={!isOpen}
      className={isOpen ? 'visible' : ''}
      onMouseEnter={clearLeaveTimer}
      onMouseLeave={scheduleClose}
    >
      <div className="mega-inner">
        {/* Left column — category list */}
        <div className="mega-cats">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              className={`mega-cat-btn${activeCat === cat.id ? ' active' : ''}`}
              data-cat={cat.id}
              onMouseEnter={() => setActiveCat(cat.id)}
              onClick={() => setActiveCat(cat.id)}
            >
              <span className="mega-cat-icon">{cat.icon}</span>
              {cat.label}
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
                  key={proc.name}
                  href={procedureHref(proc)}
                  className="mega-proc-item"
                  onClick={onClose}
                >
                  {proc.name}
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
