'use client'

/**
 * Search input for the /cautare results page. Updates the `q` query param
 * (debounced) so the server component re-renders results. Submitting (Enter)
 * applies immediately.
 */

import React, { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import SearchIcon from '@/components/ui/SearchIcon'

export default function SearchPageInput({ initialQuery }: { initialQuery: string }) {
  const router = useRouter()
  const [value, setValue] = useState(initialQuery)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Keep input in sync if the user navigates (e.g. back/forward).
  useEffect(() => {
    setValue(initialQuery)
  }, [initialQuery])

  const pushQuery = (q: string) => {
    const trimmed = q.trim()
    router.replace(trimmed ? `/cautare?q=${encodeURIComponent(trimmed)}` : '/cautare')
  }

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = e.target.value
    setValue(next)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => pushQuery(next), 300)
  }

  return (
    <form
      className="search-page__bar"
      role="search"
      onSubmit={(e) => {
        e.preventDefault()
        if (debounceRef.current) clearTimeout(debounceRef.current)
        pushQuery(value)
      }}
    >
      <span className="search-page__icon">
        <SearchIcon />
      </span>
      <input
        type="search"
        className="search-page__input"
        placeholder="Caută proceduri, aparatură, articole…"
        autoComplete="off"
        autoFocus
        value={value}
        onChange={onChange}
        aria-label="Caută pe site"
      />
    </form>
  )
}
