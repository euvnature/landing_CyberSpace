import { headersWithCors, type Endpoint } from 'payload'

const responseHeaders = (req: Parameters<NonNullable<Endpoint['handler']>>[0], cache = false) => {
  const headers = new Headers()
  if (cache) {
    headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300')
  }

  return headersWithCors({ headers, req })
}

const stripDocumentMetadata = (value: Record<string, unknown>) =>
  Object.fromEntries(
    Object.entries(value).filter(([key]) => !['id', 'createdAt', 'updatedAt'].includes(key)),
  )

const toFrontendBlock = (value: Record<string, unknown>) => {
  const { blockType, ...fields } = value
  return {
    ...fields,
    type: blockType,
  }
}

const normalizePath = (path: string) => {
  const trimmed = path.trim()
  if (!trimmed) return ''
  const leadingSlash = trimmed.startsWith('/') ? trimmed : `/${trimmed}`
  if (leadingSlash === '/') return leadingSlash
  return leadingSlash.replace(/\/+$/, '')
}

export const endpoints: Endpoint[] = [
  {
    path: '/common',
    method: 'get',
    handler: async (req) => {
      try {
        const [header, footer] = await Promise.all([
          req.payload.findGlobal({ slug: 'header', depth: 1, overrideAccess: false }),
          req.payload.findGlobal({ slug: 'footer', depth: 1, overrideAccess: false }),
        ])

        return Response.json(
          {
            header: stripDocumentMetadata(header as unknown as Record<string, unknown>),
            footer: stripDocumentMetadata(footer as unknown as Record<string, unknown>),
          },
          { headers: responseHeaders(req, true) },
        )
      } catch {
        return Response.json(
          { error: 'Unable to fetch site settings' },
          { status: 500, headers: responseHeaders(req) },
        )
      }
    },
  },
  {
    path: '/page',
    method: 'get',
    handler: async (req) => {
      const pagePath = normalizePath(new URL(req.url ?? '', 'http://localhost').searchParams.get('path') ?? '')
      if (!pagePath) {
        return Response.json(
          { error: 'A non-empty path query parameter is required' },
          { status: 400, headers: responseHeaders(req) },
        )
      }

      try {
        const result = await req.payload.find({
          collection: 'pages',
          where: { path: { equals: pagePath } },
          limit: 1,
          depth: 1,
          pagination: false,
          draft: false,
          overrideAccess: false,
        })
        const page = result.docs[0]

        if (!page) {
          return Response.json(
            { error: 'Page not found' },
            { status: 404, headers: responseHeaders(req) },
          )
        }

        const layout = Array.isArray(page.layout)
          ? page.layout.map((block) => toFrontendBlock(block as unknown as Record<string, unknown>))
          : []

        return Response.json(
          {
            id: page.id,
            path: page.path,
            title: page.title,
            description: page.description,
            seo: page.seo,
            layout,
          },
          { headers: responseHeaders(req, true) },
        )
      } catch {
        return Response.json(
          { error: 'Unable to fetch page' },
          { status: 500, headers: responseHeaders(req) },
        )
      }
    },
  },
]
