import type { CollectionConfig } from 'payload'

export const Leads: CollectionConfig = {
  slug: 'leads',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'phone', 'procedureInterest', 'createdAt'],
    group: 'Solicitări',
  },
  access: {
    read: ({ req }) => !!req.user,
    create: () => true,
    update: ({ req }) => !!req.user,
    delete: ({ req }) => !!req.user,
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'phone', type: 'text', required: true },
    { name: 'email', type: 'email' },
    { name: 'procedureInterest', type: 'relationship', relationTo: 'procedures' },
    { name: 'message', type: 'textarea' },
    { name: 'source', type: 'text', admin: { readOnly: true } },
  ],
}
