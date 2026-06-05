import type { GlobalConfig } from 'payload'

export const Homepage: GlobalConfig = {
  slug: 'homepage',
  admin: { group: 'Conținut' },
  access: { read: () => true },
  fields: [
    {
      name: 'heroTag',
      type: 'text',
    },
    {
      name: 'heroTitle',
      type: 'text',
      admin: { description: 'Editorial headline — use \\n for line breaks if needed' },
    },
    {
      name: 'heroSubtitle',
      type: 'textarea',
    },
    {
      name: 'heroPrimaryCta',
      type: 'group',
      fields: [
        { name: 'label', type: 'text' },
        { name: 'href', type: 'text' },
      ],
    },
    {
      name: 'heroSecondaryCta',
      type: 'group',
      fields: [
        { name: 'label', type: 'text' },
        { name: 'href', type: 'text' },
      ],
    },
    {
      name: 'popularProcedures',
      type: 'relationship',
      relationTo: 'procedures',
      hasMany: true,
    },
    {
      name: 'featuredProcedures',
      type: 'relationship',
      relationTo: 'procedures',
      hasMany: true,
    },
    {
      name: 'stats',
      type: 'array',
      fields: [
        { name: 'value', type: 'text' },
        { name: 'label', type: 'text' },
      ],
    },
    {
      name: 'aboutTeaser',
      type: 'group',
      fields: [
        { name: 'heading', type: 'text' },
        { name: 'body', type: 'textarea' },
        { name: 'image', type: 'upload', relationTo: 'media' },
      ],
    },
    {
      name: 'marqueeItems',
      type: 'array',
      fields: [
        { name: 'item', type: 'text' },
      ],
    },
  ],
}
