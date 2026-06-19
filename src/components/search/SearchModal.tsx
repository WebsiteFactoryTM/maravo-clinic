'use client'

/**
 * SearchModal — site-wide search popup (shared by desktop + mobile).
 *
 * Opens over a blurred backdrop. Lazily fetches the slim search index from
 * /api/search the first time it's opened, then filters client-side for instant
 * results. Results are grouped (Proceduri / Aparatură / Articole), capped per
 * group, with a "Vezi toate rezultatele" link to the full /cautare page.
 *
 * Open/close state is owned by the Header.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import SearchIcon from '@/components/ui/SearchIcon'
import { filterIndex, groupResults, type SearchItem, type SearchType } from '@/lib/search'

interface SearchModalProps {
  isOpen: boolean
  onClose: () => void
}

const GROUP_ORDER: SearchType[] = ['procedure', 'equipment', 'article']
const GROUP_LABELS: Record<SearchType, string> = {
  procedure: 'Proceduri',
  equipment: 'Aparatură',
  article: 'Articole',
}
const PER_GROUP = 5

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const router = useRouter()
  const [index, setIndex] = useState<SearchItem[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  // Lazily fetch the index the first time the modal is opened.
  useEffect(() => {
    if (!isOpen || index !== null || loading) return
    setLoading(true)
    fetch('/api/search')
      .then((r) => r.json())
      .then((d: { items?: SearchItem[] }) => setIndex(d.items ?? []))
      .catch(() => setIndex([]))
      .finally(() => setLoading(false))
  }, [isOpen, index, loading])

  // Focus the input, lock body scroll, and wire Escape while open.
  useEffect(() => {
    if (!isOpen) return
    document.body.style.overflow = 'hidden'
    const tid = setTimeout(() => inputRef.current?.focus(), 50)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      clearTimeout(tid)
      document.removeEventListener('keydown', onKey)
    }
  }, [isOpen, onClose])

  // Reset the query whenever the modal closes so it reopens clean.
  useEffect(() => {
    if (!isOpen) setQuery('')
  }, [isOpen])

  const results = useMemo(
    () => (index ? filterIndex(index, query) : []),
    [index, query],
  )
  const grouped = useMemo(() => groupResults(results), [results])
  const trimmed = query.trim()

  const goToResults = () => {
    if (!trimmed) return
    onClose()
    router.push(`/cautare?q=${encodeURIComponent(trimmed)}`)
  }

  if (!isOpen) return null

  return (
    <div className="search-overlay" onClick={onClose}>
      <div
        className="search-panel"
        role="dialog"
        aria-modal="true"
        aria-label="Căutare"
        onClick={(e) => e.stopPropagation()}
      >
        <form
          className="search-bar"
          role="search"
          onSubmit={(e) => {
            e.preventDefault()
            goToResults()
          }}
        >
          <span className="search-bar__icon">
            <SearchIcon />
          </span>
          <input
            ref={inputRef}
            type="search"
            className="search-bar__input"
            placeholder="Caută proceduri, aparatură, articole…"
            autoComplete="off"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Caută pe site"
          />
          <button
            type="button"
            className="search-bar__close"
            onClick={onClose}
            aria-label="Închide căutarea"
          >
            ✕
          </button>
        </form>

        <div className="search-results">
          {!trimmed ? (
            <p className="search-hint">Caută printre proceduri, aparatură și articole.</p>
          ) : loading && index === null ? (
            <p className="search-hint">Se încarcă…</p>
          ) : results.length === 0 ? (
            <p className="search-hint">
              Niciun rezultat pentru „{trimmed}”.
            </p>
          ) : (
            GROUP_ORDER.map((type) => {
              const items = grouped[type]
              if (items.length === 0) return null
              return (
                <div key={type} className="search-group">
                  <div className="search-group__title">{GROUP_LABELS[type]}</div>
                  {items.slice(0, PER_GROUP).map((item) => (
                    <Link
                      key={item.id}
                      href={item.url}
                      className="search-item"
                      onClick={onClose}
                    >
                      <span className="search-item__title">{item.title}</span>
                      {item.category && (
                        <span className="search-item__cat">{item.category}</span>
                      )}
                    </Link>
                  ))}
                </div>
              )
            })
          )}
        </div>

        {trimmed && results.length > 0 && (
          <div className="search-footer">
            <button type="button" className="search-all-link" onClick={goToResults}>
              Vezi toate rezultatele ({results.length}) →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
