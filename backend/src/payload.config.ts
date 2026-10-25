import 'dotenv/config'

import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { buildConfig } from 'payload'

import { Footer } from './globals/Footer'
import { Header } from './globals/Header'
import { endpoints } from './endpoints'
import { Media } from './collections/Media'
import { Pages } from './collections/Pages'
import { Posts } from './collections/Posts'
import { Users } from './collections/Users'

const corsOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)
  .map((origin) => new URL(origin).origin)

export default buildConfig({
  admin: {
    user: Users.slug,
  },
  collections: [Users, Media, Pages, Posts],
  endpoints,
  editor: lexicalEditor(),
  globals: [Header, Footer],
  secret: process.env.PAYLOAD_SECRET ?? '',
  cors: {
    origins: corsOrigins,
    headers: ['Content-Type', 'Authorization'],
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL,
    },
    push: process.env.NODE_ENV === 'development',
  }),
  typescript: {
    outputFile: './src/payload-types.ts',
  },
})
