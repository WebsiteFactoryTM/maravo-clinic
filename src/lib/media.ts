import type { Media } from '../payload-types'

/**
 * Returns the populated Media object, or null when the field holds only a
 * numeric id (not yet populated) or is absent.
 */
export function resolveMedia(img: Media | number | null | undefined): Media | null {
  if (!img || typeof img === 'number') return null
  return img
}
