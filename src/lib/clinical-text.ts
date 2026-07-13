// Normalizers for the free-text clinical fields (`indications`,
// `contraindications`) and for FAQ questions.
//
// The CMS stores these as a single plain-text line, carried over from the
// clinic's source document as a lowercase comma-separated run — e.g.
// "buze subțiri, lipsă contur, asimetrii." Normalizing at render time rather
// than only in the seed means content already sitting in the CMS is corrected
// too, and stays corrected when an editor types a new lowercase run in /admin.

/** Upper-case the first letter, leave the rest of the string untouched. */
export function capitalizeFirst(text: string): string {
  const trimmed = text.trim()
  if (!trimmed) return ''
  return trimmed.charAt(0).toLocaleUpperCase('ro-RO') + trimmed.slice(1)
}

/**
 * Split a clinical free-text field into display items.
 *
 * Accepts input that an editor has already structured (newlines or bullets) and
 * otherwise falls back to the comma/semicolon-separated prose the source
 * document uses. Items are stripped of list markers and trailing periods, then
 * capitalized.
 */
export function splitClinicalList(raw: string | null | undefined): string[] {
  if (!raw) return []
  const text = raw.trim()
  if (!text) return []

  const isStructured = /[\n•]/.test(text)
  const parts = isStructured ? text.split(/[\n•]+/) : text.split(/[;,]+/)

  return parts
    .map((part) =>
      part
        .replace(/^[-–—\s]+/, '')
        .replace(/[.\s]+$/, '')
        .trim(),
    )
    .filter((part) => part.length > 0)
    .map(capitalizeFirst)
}
