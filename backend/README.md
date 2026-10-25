# landing_CyberSpace backend

Payload CMS v3 is installed as a standalone Next.js app in this folder. It serves the Payload admin at `/admin` and the REST API at `/api`; the existing Vite app remains in `../frontend`.

## Requirements

- Node.js `22.23.4+` (or `24.22.1+`)
- PostgreSQL, including a Neon database
- npm

## Setup

1. Copy `.env.example` to `.env` and set `DATABASE_URL` to the Neon connection string and `PAYLOAD_SECRET` to a long random value. Set `FRONTEND_URL` to the frontend origin; comma-separated origins are supported.
2. Install dependencies with `npm install` from this directory.
3. Start the CMS with `npm run dev`; the development adapter syncs the schema automatically. Open `http://localhost:3000/admin` and create the first user.
4. Once the schema is ready, create a migration with `npm run migrate:create`, follow the Payload CLI prompt, and commit the generated `src/migrations` files.
5. Apply migrations to each production database with `npm run migrate` before starting the production server.

During development, the Postgres adapter keeps the schema synchronized automatically. In production, automatic schema pushing is disabled, so apply migrations before starting or deploying the backend.

## API

- `GET /api/common` returns `{ "header": ..., "footer": ... }` with global document metadata removed.
- `GET /api/page?path=/about` returns the published page fields and its block layout as a flat object. Each layout block uses a `type` property (for example, `hero` or `rich-text`) for frontend rendering. Paths may be passed with or without a leading slash; trailing slashes are normalized.
- Standard Payload endpoints remain available, including `GET /api/pages` and `GET /api/posts`.

The custom read endpoints return public data only, add CORS headers for configured frontend origins, and cache successful responses at the edge for 60 seconds.

## Migrations

- `npm run migrate:create` generates a migration from the Payload schema.
- `npm run migrate` applies pending migrations.
- `npm run migrate:status` shows which migrations have run.

Generate a migration after changing collections, globals, or fields, and apply it in each non-development environment before serving requests. The development database has already been synchronized by Payload, so the generated migrations are intended for other environments.
