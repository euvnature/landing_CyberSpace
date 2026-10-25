import type { CollectionConfig } from 'payload'

import { contentBlocks } from '../blocks/ContentBlocks'

export const Pages: CollectionConfig = {
  slug: 'pages',
  access: {
    read: ({ req }) => (req.user ? true : { _status: { equals: 'published' } }),
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'path', 'updatedAt'],
  },
  defaultSort: 'path',
  versions: {
    drafts: true,
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    {
      name: 'path',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        description: 'URL path, such as / or /about. Use a leading slash.',
      },
    },
    { name: 'description', type: 'textarea' },
    {
      name: 'seo',
      type: 'group',
      fields: [
        { name: 'title', type: 'text' },
        { name: 'description', type: 'textarea' },
        { name: 'image', type: 'relationship', relationTo: 'media' },
      ],
    },
    {
      name: 'layout',
      type: 'blocks',
      blocks: contentBlocks,
      admin: {
        initCollapsed: true,
      },
    },
  ],
}
