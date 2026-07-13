import type { GlobalConfig } from 'payload'
import { revalidateHomepage } from '../hooks/revalidate'

export const Homepage: GlobalConfig = {
  slug: 'homepage',
  admin: { group: 'Conținut' },
  access: { read: () => true },
  hooks: {
    afterChange: [revalidateHomepage],
  },
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
    // Procedurile din secțiunea „Proceduri populare” se aleg din pagina fiecărei
    // proceduri (bifa `popular`), nu de aici — o singură sursă de adevăr.
    {
      name: 'stats',
      type: 'array',
      admin: {
        description:
          'Lasă gol pentru valorile automate (nr. proceduri / tehnologii). În „value” poți folosi {proceduri} sau {aparatura} pentru a afișa automat numărul curent din site — ex: „{proceduri}+”.',
      },
      fields: [
        {
          name: 'value',
          type: 'text',
          admin: {
            description: 'Ex: „34+”, „100%” sau token automat „{proceduri}+” / „{aparatura}”.',
          },
        },
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
