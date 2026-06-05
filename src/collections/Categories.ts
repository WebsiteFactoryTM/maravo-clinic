import type { CollectionConfig, FieldHook } from 'payload'
import { slugify } from '../lib/slug'

const autoSlug: FieldHook = ({ value, data }) =>
  (value as string | undefined) || slugify((data as { name?: string })?.name ?? '')

export const Categories: CollectionConfig = {
  slug: 'categories',
  admin: { useAsTitle: 'name', defaultColumns: ['name', 'order'], group: 'Conținut' },
  access: { read: () => true },
  fields: [
    { name: 'name', type: 'text', required: true },
    {
      name: 'slug',
      type: 'text',
      unique: true,
      index: true,
      hooks: { beforeValidate: [autoSlug] },
    },
    { name: 'icon', type: 'text', admin: { description: 'Glyph/emoji, e.g. ✦' } },
    { name: 'order', type: 'number', defaultValue: 0 },
    { name: 'description', type: 'textarea' },
    {
      name: 'seo',
      type: 'group',
      fields: [
        { name: 'metaTitle', type: 'text' },
        { name: 'metaDescription', type: 'textarea' },
      ],
    },
  ],
}
