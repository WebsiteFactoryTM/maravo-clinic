import type { GlobalConfig } from 'payload'
import { revalidateNavigation } from '../hooks/revalidate'

export const Navigation: GlobalConfig = {
  slug: 'navigation',
  admin: { group: 'Setări' },
  access: { read: () => true },
  hooks: {
    afterChange: [revalidateNavigation],
  },
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
