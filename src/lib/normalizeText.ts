/**
 * Lowercase a string and strip combining diacritical marks (NFD decomposition)
 * so search/matching is accent-blind for Romanian text (ș, ț, ă, â, î).
 * Pure and client-safe — kept separate from search.ts (which imports Payload).
 */
export function normalizeText(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
}
