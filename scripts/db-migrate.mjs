/**
 * Run Payload migrations against the UNPOOLED (direct) database connection.
 *
 * Why: Payload/Drizzle migrations acquire session-level advisory locks. Over a
 * pgBouncer *pooled* connection (Neon's DATABASE_URL) these locks hang, which
 * makes `payload migrate` stall during the Vercel build (~5 min) and then fail.
 * The Neon integration also exposes an unpooled/direct URL — use it for the
 * migrate step only. The application runtime keeps using the pooled connection
 * (better for serverless concurrency).
 *
 * payload.config.ts reads `DATABASE_URI || DATABASE_URL`, so we set DATABASE_URI
 * to the unpooled URL just for the migrate child process.
 */
import { spawnSync } from 'node:child_process'
import { join, delimiter } from 'node:path'

const unpooled =
  process.env.DATABASE_URL_UNPOOLED ||
  process.env.POSTGRES_URL_NON_POOLING ||
  process.env.DATABASE_URI ||
  process.env.DATABASE_URL

if (!unpooled) {
  console.error('[db-migrate] No database URL found in env — cannot migrate.')
  process.exit(1)
}

const usingUnpooled = Boolean(
  process.env.DATABASE_URL_UNPOOLED || process.env.POSTGRES_URL_NON_POOLING,
)
console.log(
  `[db-migrate] Running payload migrate on ${usingUnpooled ? 'UNPOOLED (direct)' : 'default'} connection…`,
)

// Ensure the local Payload CLI is resolvable whether invoked via the package
// manager (PATH already has node_modules/.bin) or directly with `node`.
const binDir = join(process.cwd(), 'node_modules', '.bin')
const env = {
  ...process.env,
  DATABASE_URI: unpooled,
  PATH: `${binDir}${delimiter}${process.env.PATH ?? ''}`,
}

const res = spawnSync('payload', ['migrate'], {
  stdio: 'inherit',
  env,
  shell: true,
})

process.exit(res.status ?? 1)
