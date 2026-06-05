import type { CollectionConfig } from 'payload'
import { autoSlugField } from '../lib/autoSlugField'
import { revalidatePost } from '../hooks/revalidate'

export const Posts: CollectionConfig = {
  slug: 'posts',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'category', 'status', 'publishedAt'],
    group: 'Conținut',
  },
  access: { read: () => true },
  hooks: {
    afterChange: [revalidatePost],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    autoSlugField('title'),
    {
      name: 'cover',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'category',
      type: 'text',
    },
    {
      name: 'excerpt',
      type: 'textarea',
    },
    {
      name: 'body',
      type: 'richText',
    },
    {
      name: 'relatedProcedures',
      type: 'relationship',
      relationTo: 'procedures',
      hasMany: true,
    },
    {
      name: 'publishedAt',
      type: 'date',
    },
    {
      name: 'status',
      type: 'select',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Published', value: 'published' },
      ],
      defaultValue: 'draft',
    },
    {
      name: 'seo',
      type: 'group',
      fields: [
        { name: 'metaTitle', type: 'text' },
        { name: 'metaDescription', type: 'textarea' },
        { name: 'ogImage', type: 'upload', relationTo: 'media' },
      ],
    },
  ],
}
