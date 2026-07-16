/**
 * Applies the July 2026 document drop ("last docs") to an existing database.
 *
 * Two targeted fixes, neither of which `pnpm seed` can safely deliver to
 * production — seed rewrites title/excerpt/whatIsIt/benefits/... on update, so
 * running it would clobber copy edited in /admin (the same reason
 * `fix-content.ts` exists):
 *
 *   1. procedures.order     — backfilled from the clinic's ordering document.
 *   2. procedures.priceNote — the botox complementary treatments, priced in the
 *                             source PDFs but missing from the site entirely.
 *
 * It writes ONLY those two fields, and creates and deletes nothing.
 *
 * ── 1. order ────────────────────────────────────────────────────────────────
 * Migration 20260713_144038 added `order` with no DEFAULT and no backfill, and
 * `seed.ts` writes `order` only on CREATE (so re-seeding never undoes what the
 * clinic arranged in /admin). Every procedure that already existed when the
 * migration ran therefore still has `order = NULL`, which sorts last — in
 * practice the whole site falls back to alphabetical within a category instead
 * of the order the clinic asked for.
 *
 * The order written here follows the same rule as the seed: a procedure's
 * position within its category, in the sequence of `src/seed/proceduri.txt`
 * (verified identical to `proceduri_maravo_ordonate_final.pdf`).
 *
 * Only NULLs are filled. A procedure whose `order` is already set was ranked by
 * a human in /admin, and that beats a document — left alone, reported as [keep].
 *
 * Ordering is per-category by design (see docs/superpowers/specs/
 * 2026-07-13-ordine-proceduri-design.md): the source list interleaves categories,
 * but flat lists sort by (category.order, order, title), so only the relative
 * order *within* each category is reproducible.
 *
 * ── 2. priceNote ────────────────────────────────────────────────────────────
 * `PRICES` in `src/seed/seed.ts` stays the source of truth; this only carries
 * the one changed note across to an existing database.
 *
 * Usage:
 *   tsx scripts/apply-last-docs.ts            # dry run — prints the diff, writes nothing
 *   tsx scripts/apply-last-docs.ts --apply    # actually writes
 */

import 'dotenv/config'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { parseProcedures } from '../src/seed/parse-procedures.js'
import { getMappingForTitle } from '../src/seed/mapping.js'
import { slugify } from '../src/lib/slug.js'
import { getPayloadClient } from '../src/lib/payload.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const APPLY = process.argv.includes('--apply')

/**
 * Price notes to correct, keyed by slug. Must match `PRICES` in seed.ts.
 *
 * `priceFrom` is deliberately NOT touched: the complementary lip lift is 500 lei,
 * but the standard session for this procedure is still 1 zonă / 700 lei, and
 * which number headlines /tarife is the clinic's pricing call, not this script's.
 */
const PRICE_NOTES: Array<{ slug: string; note: string }> = [
  {
    slug: 'injectare-botox-riduri-de-expresie',
    note: '1 zonă 700, 2 zone 1100, 3 zone 1400, 4 zone 1800 lei. Complementar: lip lift 500 lei; lip lift + marionette + nose lift + menton 700 lei; etaj inferior complet 2500 lei.',
  },
]

/** Host of the DB we're about to touch, with any password stripped. */
function dbTarget(): string {
  const uri = process.env.DATABASE_URI
  if (!uri) return '(DATABASE_URI not set!)'
  try {
    const u = new URL(uri)
    return `${u.host}${u.pathname}`
  } catch {
    return '(unparseable DATABASE_URI)'
  }
}

async function main(): Promise<void> {
  // Print the target first: `dotenv/config` falls back to .env (the LOCAL db) when
  // DATABASE_URI isn't exported, and running this against the wrong database is
  // the one mistake worth shouting about.
  console.log(`\n  Baza de date : ${dbTarget()}`)
  console.log(`  Mod          : ${APPLY ? 'APPLY (scrie)' : 'DRY RUN (nu scrie nimic)'}\n`)

  const raw = fs.readFileSync(path.join(__dirname, '../src/seed/proceduri.txt'), 'utf8')
  const parsed = parseProcedures(raw)

  // Same rule as seed.ts: position within the procedure's own category.
  const orderBySlug = new Map<string, number>()
  const nextPerCategory = new Map<string, number>()
  for (const proc of parsed) {
    const category = getMappingForTitle(proc.title).category
    const next = (nextPerCategory.get(category) ?? 0) + 1
    nextPerCategory.set(category, next)
    orderBySlug.set(slugify(proc.title), next)
  }

  const payload = await getPayloadClient()
  let changes = 0
  let kept = 0

  // ── 1. Procedures: order ───────────────────────────────────────────────────
  console.log('── Procedures: order ───────────────────────')

  for (const proc of parsed) {
    const slug = slugify(proc.title)
    const want = orderBySlug.get(slug)
    if (want == null) continue

    const found = await payload.find({
      collection: 'procedures',
      where: { slug: { equals: slug } },
      limit: 1,
    })
    const doc = found.docs[0]
    if (!doc) {
      console.warn(`  [missing] no procedure with slug "${slug}" — skipped`)
      continue
    }

    const current = doc.order ?? null

    // Already ranked in /admin — a human beat the document to it.
    if (current !== null) {
      kept++
      const note = current === want ? '' : `  (documentul spune ${want})`
      console.log(`  [keep]    ${String(current).padStart(2)}  ${doc.title}${note}`)
      continue
    }

    console.log(`  [set]     ${String(want).padStart(2)}  ${doc.title}`)
    changes++

    if (APPLY) {
      await payload.update({
        collection: 'procedures',
        id: doc.id,
        data: { order: want },
      })
    }
  }

  // ── 2. Procedures: priceNote ───────────────────────────────────────────────
  console.log('\n── Procedures: priceNote ───────────────────')

  for (const { slug, note } of PRICE_NOTES) {
    const found = await payload.find({
      collection: 'procedures',
      where: { slug: { equals: slug } },
      limit: 1,
    })
    const doc = found.docs[0]
    if (!doc) {
      console.warn(`  [missing] no procedure with slug "${slug}" — skipped`)
      continue
    }

    if ((doc.priceNote ?? null) === note) {
      console.log(`  [ok]      ${doc.title}`)
      continue
    }

    console.log(`\n  ${doc.title}`)
    console.log(`    priceNote: ${JSON.stringify(doc.priceNote ?? null)}`)
    console.log(`             → ${JSON.stringify(note)}`)
    changes++

    if (APPLY) {
      await payload.update({
        collection: 'procedures',
        id: doc.id,
        data: { priceNote: note },
      })
    }
  }

  console.log('\n═══════════════════════════════════════════')
  console.log(`  ${changes} ${changes === 1 ? 'schimbare' : 'schimbări'} ${APPLY ? 'aplicate' : 'de aplicat'}`)
  if (kept > 0) console.log(`  ${kept} păstrate (ordine setată deja în /admin)`)
  if (!APPLY && changes > 0) console.log('  Rulează cu --apply pentru a scrie.')
  console.log('═══════════════════════════════════════════')

  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
