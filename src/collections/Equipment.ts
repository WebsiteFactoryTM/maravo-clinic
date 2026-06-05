import type { CollectionConfig } from 'payload'
import { autoSlugField } from '../lib/autoSlugField'
import { syncRelationship, cleanupRelationshipOnDelete } from '../hooks/syncRelationship'

export const Equipment: CollectionConfig = {
  slug: 'equipment',
  admin: {
    useAsTitle: 'name',
    group: 'Conținut',
  },
  access: { read: () => true },
  hooks: {
    afterChange: [
      syncRelationship({
        thisField: 'relatedProcedures',
        otherCollection: 'procedures',
        otherField: 'relatedEquipment',
      }),
    ],
    afterDelete: [
      cleanupRelationshipOnDelete({
        thisField: 'relatedProcedures',
        otherCollection: 'procedures',
        otherField: 'relatedEquipment',
      }),
    ],
  },
  fields: [
    // ── Core identity ──────────────────────────────────────────────────────────
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    autoSlugField('name'),
    {
      name: 'manufacturer',
      type: 'text',
    },

    // ── Media ─────────────────────────────────────────────────────────────────
    {
      name: 'photo',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'gallery',
      type: 'array',
      fields: [
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          required: true,
        },
      ],
    },

    // ── Content ───────────────────────────────────────────────────────────────
    {
      name: 'purpose',
      type: 'textarea',
      label: 'Pentru ce este',
    },
    {
      name: 'description',
      type: 'richText',
    },

    // ── Relations ─────────────────────────────────────────────────────────────
    {
      name: 'relatedProcedures',
      type: 'relationship',
      relationTo: 'procedures',
      hasMany: true,
    },

    // ── Publishing ────────────────────────────────────────────────────────────
    {
      name: 'status',
      type: 'select',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Published', value: 'published' },
      ],
      defaultValue: 'published',
    },

    // ── SEO ───────────────────────────────────────────────────────────────────
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
