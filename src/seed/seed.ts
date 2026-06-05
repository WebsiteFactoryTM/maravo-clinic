/**
 * Idempotent seed script for Maravo Clinic CMS.
 * Populates: 5 categories, 7 equipment items, and ~34 procedures.
 *
 * Usage: pnpm seed
 * Re-runnable: uses upsert-by-slug; no duplicates.
 */

import 'dotenv/config'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { parseProcedures } from './parse-procedures.js'
import { getMappingForTitle } from './mapping.js'
import { slugify } from '../lib/slug.js'
import { getPayloadClient } from '../lib/payload.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// ── Lexical helper ────────────────────────────────────────────────────────────

interface LexicalRoot {
  root: {
    type: 'root'
    children: LexicalParagraph[]
    direction: 'ltr' | null
    format: ''
    indent: 0
    version: 1
  }
}

interface LexicalParagraph {
  type: 'paragraph'
  children: LexicalText[]
  direction: 'ltr' | null
  format: ''
  indent: 0
  version: 1
}

interface LexicalText {
  type: 'text'
  detail: 0
  format: 0
  mode: 'normal'
  style: ''
  text: string
  version: 1
}

/**
 * Convert a plain string to a minimal Payload Lexical JSON value.
 * Each non-empty line becomes a paragraph node.
 */
function textToLexical(str: string): LexicalRoot {
  const paragraphs: LexicalParagraph[] = str
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map(
      (line): LexicalParagraph => ({
        type: 'paragraph',
        children: [
          {
            type: 'text',
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: line,
            version: 1,
          },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        version: 1,
      }),
    )

  // If no paragraphs, add one empty paragraph so Lexical doesn't complain
  if (paragraphs.length === 0) {
    paragraphs.push({
      type: 'paragraph',
      children: [{ type: 'text', detail: 0, format: 0, mode: 'normal', style: '', text: '', version: 1 }],
      direction: null,
      format: '',
      indent: 0,
      version: 1,
    })
  }

  return {
    root: {
      type: 'root',
      children: paragraphs,
      direction: 'ltr',
      format: '',
      indent: 0,
      version: 1,
    },
  }
}

// ── Category seed data ─────────────────────────────────────────────────────────

const CATEGORIES = [
  { name: 'Față', slug: 'fata', icon: '✦', order: 1 },
  { name: 'Corp', slug: 'corp', icon: '◈', order: 2 },
  { name: 'Laser', slug: 'laser', icon: '◉', order: 3 },
  { name: 'Injectabile', slug: 'injectabile', icon: '◎', order: 4 },
  { name: 'Păr', slug: 'par', icon: '◇', order: 5 },
] as const

// ── Equipment seed data ────────────────────────────────────────────────────────

const EQUIPMENT = [
  {
    name: 'Lutronic Clarity II',
    slug: 'clarity-ii',
    manufacturer: 'Lutronic',
    purpose:
      'Sistem laser medical cu două lungimi de undă (Alexandrite 755 nm + Nd:YAG 1064 nm) pentru epilare definitivă, tratamente vasculare, rejuvenare și leziuni pigmentare.',
  },
  {
    name: 'HIFU Liftera (Asterasys)',
    slug: 'hifu-liftera-asterasys',
    manufacturer: 'Asterasys',
    purpose:
      'Sistem HIFU cu ultrasunete microfocalizate care acționează la nivel SMAS pentru lifting facial și corporal non-invaziv.',
  },
  {
    name: 'NuEra Tight (Lumenis)',
    slug: 'nuera-tight-lumenis',
    manufacturer: 'Lumenis',
    purpose:
      'Dispozitiv de radiofrecvență bipolară controlată pentru remodelare corporală, reducere celulită și îmbunătățirea fermității cutanate.',
  },
  {
    name: 'BTL Lymphastim',
    slug: 'btl-lymphastim',
    manufacturer: 'BTL',
    purpose:
      'Echipament de presoterapie secvențială pentru stimularea drenajului limfatic, reducerea edemelor și recuperarea post-proceduri.',
  },
  {
    name: 'CryoPen O+',
    slug: 'cryopen-o',
    manufacturer: 'CryoPen',
    purpose:
      'Dispozitiv de crioterapie de precizie pentru eliminarea leziunilor cutanate benigne (negi, papiloame, keratoze) prin înghețare controlată.',
  },
  {
    name: 'Dermapen 4',
    slug: 'dermapen-4',
    manufacturer: 'Dermapen World',
    purpose:
      'Dispozitiv de microneedling medical pentru stimularea regenerării pielii, reducerea cicatricilor acneice și îmbunătățirea texturii.',
  },
  {
    name: 'HydraFacial Syndeo',
    slug: 'hydrafacial-syndeo',
    manufacturer: 'HydraFacial',
    purpose:
      'Sistem de tratament facial în mai multe etape pentru curățare profundă, exfoliere, extracție și hidratare intensă.',
  },
] as const

// ── Main seed function ─────────────────────────────────────────────────────────

export async function seed(): Promise<void> {
  const payload = await getPayloadClient()

  console.log('\n═══════════════════════════════════════════')
  console.log('  Maravo Clinic — Seed Script')
  console.log('═══════════════════════════════════════════\n')

  // ── 1. Categories ────────────────────────────────────────────────────────────
  console.log('── Categories ──────────────────────────────')
  const categoryIdBySlug = new Map<string, number>()
  let catCreated = 0
  let catUpdated = 0

  for (const cat of CATEGORIES) {
    const existing = await payload.find({
      collection: 'categories',
      where: { slug: { equals: cat.slug } },
      limit: 1,
    })

    if (existing.docs.length > 0) {
      const doc = existing.docs[0]
      await payload.update({
        collection: 'categories',
        id: doc.id,
        data: { name: cat.name, icon: cat.icon, order: cat.order },
      })
      categoryIdBySlug.set(cat.slug, doc.id)
      catUpdated++
      console.log(`  [updated] ${cat.name} (${cat.slug})`)
    } else {
      const doc = await payload.create({
        collection: 'categories',
        data: { name: cat.name, slug: cat.slug, icon: cat.icon, order: cat.order },
      })
      categoryIdBySlug.set(cat.slug, doc.id)
      catCreated++
      console.log(`  [created] ${cat.name} (${cat.slug})`)
    }
  }

  // ── 2. Equipment ──────────────────────────────────────────────────────────────
  console.log('\n── Equipment ───────────────────────────────')
  const equipmentIdBySlug = new Map<string, number>()
  let eqCreated = 0
  let eqUpdated = 0

  for (const eq of EQUIPMENT) {
    const existing = await payload.find({
      collection: 'equipment',
      where: { slug: { equals: eq.slug } },
      limit: 1,
    })

    if (existing.docs.length > 0) {
      const doc = existing.docs[0]
      await payload.update({
        collection: 'equipment',
        id: doc.id,
        data: { name: eq.name, manufacturer: eq.manufacturer, purpose: eq.purpose, status: 'published' },
      })
      equipmentIdBySlug.set(eq.slug, doc.id)
      eqUpdated++
      console.log(`  [updated] ${eq.name}`)
    } else {
      const doc = await payload.create({
        collection: 'equipment',
        data: {
          name: eq.name,
          slug: eq.slug,
          manufacturer: eq.manufacturer,
          purpose: eq.purpose,
          status: 'published',
        },
      })
      equipmentIdBySlug.set(eq.slug, doc.id)
      eqCreated++
      console.log(`  [created] ${eq.name}`)
    }
  }

  // ── 3. Procedures ─────────────────────────────────────────────────────────────
  console.log('\n── Procedures ──────────────────────────────')
  const rawPath = path.join(__dirname, 'proceduri.txt')
  const raw = fs.readFileSync(rawPath, 'utf8')
  const procedures = parseProcedures(raw)

  let procCreated = 0
  let procUpdated = 0
  let pubCount = 0
  let draftCount = 0

  for (const proc of procedures) {
    const slug = slugify(proc.title)
    const mapping = getMappingForTitle(proc.title)
    const categoryId = categoryIdBySlug.get(mapping.category)

    if (!categoryId) {
      console.warn(`  [warn] No category ID for slug "${mapping.category}" — skipping "${proc.title}"`)
      continue
    }

    const equipmentIds: number[] = []
    if (mapping.equipmentSlug) {
      const eqId = equipmentIdBySlug.get(mapping.equipmentSlug)
      if (eqId) equipmentIds.push(eqId)
    }

    // Build excerpt from whatIsIt first sentence
    const excerpt = proc.whatIsIt
      ? proc.whatIsIt.split(/[.!?]/)[0].trim() + '.'
      : proc.title

    const status = proc.complete ? 'published' : 'draft'
    if (status === 'published') pubCount++
    else draftCount++

    const procData = {
      title: proc.title,
      slug,
      category: categoryId,
      bodyZones: mapping.bodyZones as string[],
      excerpt,
      meta: {
        duration: proc.meta.duration ?? null,
        painLevel: proc.meta.painLevel ?? null,
        painLabel: proc.meta.painLabel ?? null,
        results: proc.meta.results ?? null,
        recovery: proc.meta.recovery ?? null,
        invasiveness: proc.meta.invasiveness ?? null,
        effectDuration: proc.meta.effectDuration ?? null,
        repeatInterval: proc.meta.repeatInterval ?? null,
      },
      whatIsIt: proc.whatIsIt ? textToLexical(proc.whatIsIt) : undefined,
      whoIsItFor: proc.whoIsItFor ? textToLexical(proc.whoIsItFor) : undefined,
      benefits: proc.benefits ? proc.benefits.map((item) => ({ item })) : undefined,
      howItWorks: proc.howItWorks ? textToLexical(proc.howItWorks) : undefined,
      resultsText: proc.resultsText ? textToLexical(proc.resultsText) : undefined,
      indications: proc.indications ?? null,
      contraindications: proc.contraindications ?? null,
      faq: proc.faq ? proc.faq.map((f) => ({ question: f.question, answer: f.answer })) : undefined,
      relatedEquipment: equipmentIds.length > 0 ? equipmentIds : undefined,
      status,
    }

    const existing = await payload.find({
      collection: 'procedures',
      where: { slug: { equals: slug } },
      limit: 1,
    })

    if (existing.docs.length > 0) {
      const doc = existing.docs[0]
      await payload.update({
        collection: 'procedures',
        id: doc.id,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: procData as any,
        context: { skipSync: false },
      })
      procUpdated++
      console.log(`  [updated] ${proc.title} → ${status}`)
    } else {
      await payload.create({
        collection: 'procedures',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: procData as any,
        context: { skipSync: false },
      })
      procCreated++
      console.log(`  [created] ${proc.title} → ${status}`)
    }
  }

  // ── Summary ──────────────────────────────────────────────────────────────────
  console.log('\n═══════════════════════════════════════════')
  console.log('  Seed complete')
  console.log('───────────────────────────────────────────')
  console.log(`  Categories : ${catCreated} created, ${catUpdated} updated (total ${CATEGORIES.length})`)
  console.log(`  Equipment  : ${eqCreated} created, ${eqUpdated} updated (total ${EQUIPMENT.length})`)
  console.log(
    `  Procedures : ${procCreated} created, ${procUpdated} updated (total ${procedures.length})`,
  )
  console.log(`             : ${pubCount} published, ${draftCount} draft`)
  console.log('═══════════════════════════════════════════\n')
}

// ── Entry point ───────────────────────────────────────────────────────────────
seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Seed failed:', err)
    process.exit(1)
  })
