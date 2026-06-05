import type { Field, FieldHook } from 'payload'
import { slugify } from './slug'

/**
 * Returns a FieldHook that auto-generates a slug from the given source field.
 * If an explicit slug was already provided it is kept as-is.
 */
export function makeAutoSlugHook(sourceField: string): FieldHook {
  return ({ value, data }) =>
    (value as string | undefined) ||
    slugify(((data as Record<string, unknown>)?.[sourceField] as string) ?? '')
}

/**
 * Convenience factory: returns a complete Payload `slug` field definition
 * that auto-populates from `sourceField` on beforeValidate.
 */
export function autoSlugField(sourceField: string): Field {
  return {
    name: 'slug',
    type: 'text',
    unique: true,
    index: true,
    hooks: { beforeValidate: [makeAutoSlugHook(sourceField)] },
  }
}
