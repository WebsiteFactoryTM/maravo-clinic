import type { GlobalConfig } from 'payload'

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  admin: { group: 'Setări' },
  access: { read: () => true },
  fields: [
    {
      name: 'clinicName',
      type: 'text',
      defaultValue: 'Maravo Clinic',
    },
    {
      name: 'address',
      type: 'textarea',
    },
    {
      name: 'phone',
      type: 'text',
    },
    {
      name: 'whatsapp',
      type: 'text',
      admin: { description: 'Number in international format for wa.me links, e.g. +40712345678' },
    },
    {
      name: 'email',
      type: 'email',
    },
    {
      name: 'hours',
      type: 'array',
      fields: [
        { name: 'day', type: 'text' },
        { name: 'value', type: 'text' },
      ],
    },
    {
      name: 'socials',
      type: 'array',
      fields: [
        {
          name: 'platform',
          type: 'select',
          options: [
            { label: 'Instagram', value: 'instagram' },
            { label: 'Facebook', value: 'facebook' },
            { label: 'TikTok', value: 'tiktok' },
            { label: 'YouTube', value: 'youtube' },
            { label: 'Other', value: 'other' },
          ],
        },
        { name: 'url', type: 'text' },
      ],
    },
    {
      name: 'mapsEmbedUrl',
      type: 'text',
      admin: { description: 'Google Maps embed src URL' },
    },
  ],
}
