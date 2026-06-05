/**
 * Converts a string (including Romanian diacritics) into a URL-safe slug.
 *
 * Handles both Unicode encodings of Romanian ș/ț:
 *   - Comma-below: ș (U+0219), ț (U+021B) — standard Romanian Unicode
 *   - Cedilla:     ş (U+015F), ţ (U+0163) — legacy / MS-Word encoding
 *
 * After NFD normalisation + combining-mark removal, most diacritics decompose
 * to their ASCII base. The explicit replacements below are a safety net for
 * the cedilla variants that do NOT fully decompose to ASCII.
 */
export function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')   // strip combining diacritical marks
    .replace(/[ăâ]/gi, 'a')            // any residual ă/â after NFD
    .replace(/[î]/gi, 'i')             // any residual î
    .replace(/[șş]/gi, 's')            // comma-below (U+0219) + cedilla (U+015F)
    .replace(/[țţ]/gi, 't')            // comma-below (U+021B) + cedilla (U+0163)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')       // non-alphanumeric runs → single hyphen
    .replace(/^-+|-+$/g, '')           // strip leading/trailing hyphens
}
