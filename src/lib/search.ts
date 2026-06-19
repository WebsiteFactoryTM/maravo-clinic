/**
 * Site-wide search — pure, client-safe core.
 *
 * Types plus the matching/grouping helpers used by both the header SearchModal
 * (client, instant) and the /cautare results page (server). This module must
 * stay free of any server-only imports (Payload, etc.) so it can be bundled on
 * the client. The index *builder* lives in ./searchIndex (server-only).
 *
 * Matching is diacritics-insensitive (ș/ț/ă/â/î) and ranks title hits first.
 */

import { normalizeText } from './normalizeText'

export { normalizeText }

export type SearchType = 'procedure' | 'equipment' | 'article'

export interface SearchItem {
  /** Stable, type-prefixed id (e.g. "procedure-12") */
  id: string
  type: SearchType
  title: string
  url: string
  /** Category / manufacturer / blog category — shown as a small label */
  category: string | null
  /** Short summary text, included in the searchable haystack */
  excerpt: string | null
}

/**
 * Filter an index by a query string. Returns matches ordered by relevance:
 * title-prefix matches first, then title-substring, then body-only matches.
 * An empty query returns no results.
 */
export function filterIndex(items: SearchItem[], query: string): SearchItem[] {
  const q = normalizeText(query.trim())
  if (!q) return []

  return items
    .map((item) => {
      const title = normalizeText(item.title)
      const haystack = normalizeText(
        [item.title, item.category ?? '', item.excerpt ?? ''].join(' '),
      )
      if (!haystack.includes(q)) return null
      const score = title.startsWith(q) ? 0 : title.includes(q) ? 1 : 2
      return { item, score }
    })
    .filter((x): x is { item: SearchItem; score: number } => x !== null)
    .sort((a, b) => a.score - b.score)
    .map((x) => x.item)
}

/** Bucket results into the three content groups, preserving relevance order. */
export function groupResults(items: SearchItem[]): Record<SearchType, SearchItem[]> {
  const groups: Record<SearchType, SearchItem[]> = {
    procedure: [],
    equipment: [],
    article: [],
  }
  for (const item of items) groups[item.type].push(item)
  return groups
}
