import type { GlobalConfig } from 'payload'

export const Navigation: GlobalConfig = {
  slug: 'navigation',
  admin: { group: 'Setări' },
  access: { read: () => true },
  fields: [
    {
      name: 'mainMenu',
      type: 'array',
      fields: [
        { name: 'label', type: 'text' },
        { name: 'href', type: 'text' },
      ],
    },
    {
      name: 'footerColumns',
      type: 'array',
      fields: [
        { name: 'title', type: 'text' },
        {
          name: 'links',
          type: 'array',
          fields: [
            { name: 'label', type: 'text' },
            { name: 'href', type: 'text' },
          ],
        },
      ],
    },
  ],
}
