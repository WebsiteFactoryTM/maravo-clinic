import type { CollectionConfig } from 'payload'
import { autoSlugField } from '../lib/autoSlugField'
import { syncRelationship } from '../hooks/syncRelationship'

const ZONES = ['par', 'fata', 'gat', 'brate', 'abdomen', 'picioare'] as const

export const Procedures: CollectionConfig = {
  slug: 'procedures',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'category', 'status'],
    group: 'Conținut',
  },
  access: { read: () => true },
  hooks: {
    afterChange: [
      syncRelationship({
        thisField: 'relatedEquipment',
        otherCollection: 'equipment',
        otherField: 'relatedProcedures',
      }),
    ],
  },
  fields: [
    // ── Core identity ──────────────────────────────────────────────────────────
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    autoSlugField('title'),

    {
      name: 'category',
      type: 'relationship',
      relationTo: 'categories',
      required: true,
    },

    {
      name: 'bodyZones',
      type: 'select',
      hasMany: true,
      options: ZONES.map((z) => ({ label: z, value: z })),
    },

    {
      name: 'excerpt',
      type: 'textarea',
      required: true,
    },

    {
      name: 'icon',
      type: 'text',
    },

    // ── Media ─────────────────────────────────────────────────────────────────
    {
      name: 'featuredImage',
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

    // ── Pictograme & caracteristici ────────────────────────────────────────────
    {
      name: 'meta',
      type: 'group',
      label: 'Pictograme & caracteristici',
      fields: [
        { name: 'duration', type: 'text', label: 'Durată' },
        {
          name: 'painLevel',
          type: 'number',
          label: 'Disconfort (0-10)',
          min: 0,
          max: 10,
        },
        { name: 'painLabel', type: 'text' },
        { name: 'results', type: 'text', label: 'Rezultate' },
        { name: 'recovery', type: 'text', label: 'Recuperare' },
        {
          name: 'invasiveness',
          type: 'select',
          options: [
            { label: 'Non-invaziv', value: 'non-invaziv' },
            { label: 'Minim-invaziv', value: 'minim-invaziv' },
            { label: 'Invaziv', value: 'invaziv' },
          ],
        },
        { name: 'effectDuration', type: 'text', label: 'Cât durează efectul' },
        { name: 'repeatInterval', type: 'text', label: 'La cât timp se repetă' },
      ],
    },

    // ── Rich content sections ─────────────────────────────────────────────────
    {
      name: 'whatIsIt',
      type: 'richText',
      label: 'Ce este?',
    },
    {
      name: 'whoIsItFor',
      type: 'richText',
      label: 'Cui i se potrivește?',
    },
    {
      name: 'benefits',
      type: 'array',
      label: 'Beneficii',
      fields: [{ name: 'item', type: 'text' }],
    },
    {
      name: 'howItWorks',
      type: 'richText',
      label: 'Cum decurge procedura?',
    },
    {
      name: 'resultsText',
      type: 'richText',
      label: 'Rezultate',
    },
    {
      name: 'indications',
      type: 'textarea',
    },
    {
      name: 'contraindications',
      type: 'textarea',
    },
    {
      name: 'faq',
      type: 'array',
      label: 'Întrebări frecvente',
      fields: [
        { name: 'question', type: 'text' },
        { name: 'answer', type: 'textarea' },
      ],
    },

    // ── Pricing ───────────────────────────────────────────────────────────────
    {
      name: 'priceFrom',
      type: 'number',
      label: 'Preț de la (lei)',
    },
    {
      name: 'priceNote',
      type: 'text',
    },

    // ── Relations ─────────────────────────────────────────────────────────────
    {
      name: 'relatedEquipment',
      type: 'relationship',
      relationTo: 'equipment',
      hasMany: true,
    },
    {
      name: 'relatedProcedures',
      type: 'relationship',
      relationTo: 'procedures',
      hasMany: true,
    },

    // ── Flags ─────────────────────────────────────────────────────────────────
    {
      name: 'popular',
      type: 'checkbox',
      defaultValue: false,
    },
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
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

    // ── Publishing ────────────────────────────────────────────────────────────
    {
      name: 'status',
      type: 'select',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Published', value: 'published' },
      ],
      defaultValue: 'draft',
    },
  ],
}
