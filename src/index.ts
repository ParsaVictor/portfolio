import { getAssetFromKV, MethodNotAllowedError, NotFoundError } from '@cloudflare/kv-asset-handler'

interface Env {
  __STATIC_CONTENT: KVNamespace
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    try {
      return await getAssetFromKV(
        {
          request,
          waitUntil: ctx.waitUntil.bind(ctx),
        },
        {
          ASSET_NAMESPACE: env.__STATIC_CONTENT,
          ASSET_MANIFEST: JSON.stringify(manifest),
        }
      )
    } catch (e) {
      // Serve index.html for SPA routing (404 → index.html)
      if (e instanceof NotFoundError) {
        try {
          return await getAssetFromKV(
            {
              request: new Request(`${new URL(request.url).origin}/index.html`, request),
              waitUntil: ctx.waitUntil.bind(ctx),
            },
            {
              ASSET_NAMESPACE: env.__STATIC_CONTENT,
              ASSET_MANIFEST: JSON.stringify(manifest),
            }
          )
        } catch {
          return new Response('Not Found', { status: 404 })
        }
      } else if (e instanceof MethodNotAllowedError) {
        return new Response('Method Not Allowed', { status: 405 })
      }
      return new Response('Internal Server Error', { status: 500 })
    }
  },
} as ExportedHandler<Env>

// Asset manifest - will be generated during build
const manifest = {}
