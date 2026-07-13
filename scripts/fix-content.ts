/**
 * Targeted production content fix.
 *
 * Unlike `pnpm seed`, this touches ONLY the fields that carry the known bugs:
 *
 *   equipment  → name / manufacturer (brand + device naming), plus create Deka Tetra Pro
 *   procedures → indications / contraindications / faq
 *
 * It deliberately does NOT write title, excerpt, whatIsIt, whoIsItFor, benefits,
 * howItWorks, resultsText, prices, status, category or relatedEquipment, and it
 * never deletes anything — so copy edited in /admin survives.
 *
 * Usage:
 *   tsx scripts/fix-content.ts            # dry run — prints the diff, writes nothing
 *   tsx scripts/fix-content.ts --apply    # actually writes
 */

import 'dotenv/config'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { parseProcedures } from '../src/seed/parse-procedures.js'
import { slugify } from '../src/lib/slug.js'
import { getPayloadClient } from '../src/lib/payload.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const APPLY = process.argv.includes('--apply')

/** Renames only — keyed by the existing slug, which never changes. */
const EQUIPMENT_RENAMES: Array<{ slug: string; name: string; manufacturer: string }> = [
  { slug: 'hifu-liftera-asterasys', name: 'Asterasys Liftera', manufacturer: 'Asterasys' },
  { slug: 'nuera-tight-lumenis', name: 'Lumenis NuEra Tight', manufacturer: 'Lumenis' },
]

const EQUIPMENT_NEW = {
  name: 'Deka Tetra Pro',
  slug: 'deka-tetra-pro',
  manufacturer: 'Deka',
  purpose:
    'Laser CO2 fracționat pentru resurfacing cutanat, reducerea ridurilor fine, a cicatricilor acneice și îmbunătățirea texturii pielii.',
}

type FaqItem = { question: string; answer: string }

function faqEqual(a: FaqItem[], b: FaqItem[]): boolean {
  if (a.length !== b.length) return false
  return a.every((x, i) => x.question === b[i].question && x.answer === b[i].answer)
}

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

  const payload = await getPayloadClient()
  let changes = 0

  // ── Equipment ──────────────────────────────────────────────────────────────
  console.log('── Equipment ───────────────────────────────')

  for (const eq of EQUIPMENT_RENAMES) {
    const found = await payload.find({
      collection: 'equipment',
      where: { slug: { equals: eq.slug } },
      limit: 1,
    })
    const doc = found.docs[0]
    if (!doc) {
      console.warn(`  [missing] no equipment with slug "${eq.slug}" — skipped`)
      continue
    }
    if (doc.name === eq.name && doc.manufacturer === eq.manufacturer) {
      console.log(`  [ok]      ${doc.name}`)
      continue
    }
    console.log(`  [rename]  "${doc.name}" → "${eq.name}"  (manufacturer: ${eq.manufacturer})`)
    changes++
    if (APPLY) {
      await payload.update({
        collection: 'equipment',
        id: doc.id,
        data: { name: eq.name, manufacturer: eq.manufacturer },
      })
    }
  }

  const existingDeka = await payload.find({
    collection: 'equipment',
    where: { slug: { equals: EQUIPMENT_NEW.slug } },
    limit: 1,
  })
  if (existingDeka.docs.length > 0) {
    console.log(`  [ok]      ${EQUIPMENT_NEW.name} (already present)`)
  } else {
    console.log(`  [create]  ${EQUIPMENT_NEW.name}`)
    changes++
    if (APPLY) {
      await payload.create({
        collection: 'equipment',
        data: { ...EQUIPMENT_NEW, status: 'published' },
      })
    }
  }

  // ── Procedures: indications / contraindications / faq only ─────────────────
  console.log('\n── Procedures ──────────────────────────────')

  const raw = fs.readFileSync(path.join(__dirname, '../src/seed/proceduri.txt'), 'utf8')
  const parsed = parseProcedures(raw)

  for (const proc of parsed) {
    const slug = slugify(proc.title)
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

    const nextInd = proc.indications ?? null
    const nextContra = proc.contraindications ?? null
    const nextFaq: FaqItem[] = (proc.faq ?? []).map((f) => ({
      question: f.question,
      answer: f.answer,
    }))
    const currFaq: FaqItem[] = (doc.faq ?? []).map((f) => ({
      question: f.question ?? '',
      answer: f.answer ?? '',
    }))

    const indChanged = (doc.indications ?? null) !== nextInd
    const contraChanged = (doc.contraindications ?? null) !== nextContra
    const faqChanged = !faqEqual(currFaq, nextFaq)

    if (!indChanged && !contraChanged && !faqChanged) continue

    console.log(`\n  ${doc.title}`)
    if (indChanged) {
      console.log(`    indications     : ${JSON.stringify(doc.indications ?? null)}`)
      console.log(`                    → ${JSON.stringify(nextInd)}`)
    }
    if (contraChanged) {
      console.log(`    contraindications: ${JSON.stringify(doc.contraindications ?? null)}`)
      console.log(`                     → ${JSON.stringify(nextContra)}`)
    }
    if (faqChanged) {
      console.log(`    faq             : ${currFaq.length} → ${nextFaq.length} întrebări`)
    }
    changes++

    if (APPLY) {
      await payload.update({
        collection: 'procedures',
        id: doc.id,
        data: {
          indications: nextInd,
          contraindications: nextContra,
          faq: nextFaq,
        },
      })
    }
  }

  console.log('\n═══════════════════════════════════════════')
  console.log(`  ${changes} ${changes === 1 ? 'schimbare' : 'schimbări'} ${APPLY ? 'aplicate' : 'de aplicat'}`)
  if (!APPLY && changes > 0) console.log('  Rulează cu --apply pentru a scrie.')
  console.log('═══════════════════════════════════════════')

  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
