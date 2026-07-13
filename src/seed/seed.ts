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
    name: 'Asterasys Liftera',
    slug: 'hifu-liftera-asterasys',
    manufacturer: 'Asterasys',
    purpose:
      'Sistem HIFU cu ultrasunete microfocalizate care acționează la nivel SMAS pentru lifting facial și corporal non-invaziv.',
  },
  {
    name: 'Lumenis NuEra Tight',
    slug: 'nuera-tight-lumenis',
    manufacturer: 'Lumenis',
    purpose:
      'Dispozitiv de radiofrecvență bipolară controlată pentru remodelare corporală, reducere celulită și îmbunătățirea fermității cutanate.',
  },
  {
    name: 'Deka Tetra Pro',
    slug: 'deka-tetra-pro',
    manufacturer: 'Deka',
    purpose:
      'Laser CO2 fracționat pentru resurfacing cutanat, reducerea ridurilor fine, a cicatricilor acneice și îmbunătățirea texturii pielii.',
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

// ── Price data (source: PREȚURI PROCEDURI 2/3.pdf) ──────────────────────────────
// `from` = prețul orientativ „de la" (ședință standard); `note` = detalii pe variante.
// Keyed by procedure slug (slugify(title)).

const PRICES: Record<string, { from: number; note?: string }> = {
  'injectare-acid-hialuronic-buze': {
    from: 800,
    note: 'Preț/seringă, în funcție de produs (0,55–1 ml): 800–1500 lei.',
  },
  'fire-pdo-contur-buze': {
    from: 1000,
    note: '10 fire. Lip lift botox + contur fire PDO, 10 fire: 1250 lei.',
  },
  'injectare-botox-riduri-de-expresie': {
    from: 700,
    note: '1 zonă 700, 2 zone 1100, 3 zone 1400, 4 zone 1800 lei.',
  },
  'injectare-botox-maseteri-bruxism': {
    from: 1500,
    note: 'Bruxism 1500 lei; slimming facial / contur mandibular 1700 lei.',
  },
  'injectare-botox-gummy-smile-zambet-gingival': { from: 500 },
  'injectare-botox-transpiratie-excesiva-hiperhidroza': {
    from: 2000,
    note: 'Axile 2000, palme 2200, tălpi 2700 lei.',
  },
  'volumetrie-faciala-cu-acid-hialuronic-pometi-mandibula-menton-tample': {
    from: 1400,
    note: '1 ml 1400 lei; 1,2 ml 1500 lei.',
  },
  'corectie-cearcane-cu-acid-hialuronic': {
    from: 1000,
    note: '0,5 ml 1000 lei; 1 ml 1500 lei.',
  },
  'injectare-acid-hialuronic-santuri-nazo-labiale-nazo-geniene': {
    from: 900,
    note: '0,55 ml 900, 1 ml 1300, 1,2 ml 1450 lei.',
  },
  'rinocorectie-acid-hialuronic': {
    from: 1750,
    note: '1 ml 1750 lei; 1,2 ml 1800 lei.',
  },
  'dizolvare-acid-hialuronic-hialuronidaza': { from: 1250 },
  'prp-terapia-vampir': {
    from: 750,
    note: 'În funcție de kit: New Plasmogel 750 lei, Arthrex 1000 lei/ședință.',
  },
  'injectare-colagen-pentru-regenerare-si-fermitate': {
    from: 1500,
    note: 'Karisma. Pachet 3 ședințe: 3750 lei.',
  },
  'mezoterapie-faciala': {
    from: 750,
    note: 'În funcție de produs: 750–2000 lei/ședință.',
  },
  polinucleotide: { from: 1250, note: '2 ml. Pachet 3 ședințe: 3000 lei.' },
  'sculptra-biostimulator-de-colagen': { from: 2500, note: 'Preț/flacon.' },
  'harmonyca-lifting-si-biostimulare': { from: 1750, note: 'Preț/flacon.' },
  'radiesse-volum-si-biostimulare': { from: 2000, note: 'Preț/fiolă.' },
  'lanluma-x-volum-corporal-si-biostimulare': {
    from: 6000,
    note: '1 flacon 6000 lei; 2 flacoane 10500 lei.',
  },
  'lipoliza-injectabila': {
    from: 750,
    note: 'În funcție de produs: 750–2000 lei/ședință.',
  },
  'tratament-regenerare-par': {
    from: 750,
    note: 'Fără Dermapen 750 lei; cu Dermapen 950 lei.',
  },
  'dermapen-4-microneedling-medical': {
    from: 600,
    note: 'Mâini 600, față 750, față+gât 800, +decolteu 900 lei/ședință.',
  },
  'hydrafacial-syndeo': {
    from: 500,
    note: 'Signature 500, Deluxe 650, Platinum 750 lei.',
  },
  'epilare-definitiva-laser': {
    from: 100,
    note: 'În funcție de zonă. Full Body 1500 lei/ședință.',
  },
  'tratament-vascular-laser-cuperoza-vase-sparte': {
    from: 250,
    note: 'Cuperoză de la 250 lei; rozacee față 700 lei.',
  },
  'tratament-onicomicoza-laser-ciuperca-unghiei': { from: 150, note: 'Preț/unghie.' },
  'tratament-veruci-plantare-laser': { from: 250 },
  'rejuvenare-faciala-laser': {
    from: 800,
    note: 'Gât 800, față 1000, față+gât 1400, +decolteu 1600 lei.',
  },
  'tratament-pete-pigmentare-laser': {
    from: 200,
    note: 'În funcție de zonă: 200–600 lei.',
  },
  'hifu-lifting-facial-si-corporal': {
    from: 1000,
    note: '1 zonă 1000 lei; pachete până la 6 zone. Corporal 2000 lei/zonă.',
  },
  'remodelare-corporala-radiofrecventa-rf': {
    from: 300,
    note: 'Preț/ședință, în funcție de mărimea zonei (300–600 lei).',
  },
  'drenaj-limfatic-presoterapie': {
    from: 150,
    note: 'Preț/ședință; 10 ședințe 1000 lei.',
  },
  'crioterapie-leziuni-cutanate': {
    from: 200,
    note: '1 leziune 200, 2–3 leziuni 350, 4–10 leziuni 600, peste 10 leziuni 800 lei.',
  },
  consultatie: { from: 200 },
}

// Proceduri rămase în DB care NU există în PDF-urile sursă → se scot din publicare.
const STRAY_SLUGS = ['fotorejuvenare']

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
    const price = PRICES[slug]
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
      priceFrom: price?.from ?? null,
      priceNote: price?.note ?? null,
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

  // ── 4. Delete stray categories (not in seed set, only if empty) ──────────────
  let strayCatsDeleted = 0
  const validCategorySlugs = new Set<string>(CATEGORIES.map((c) => c.slug))
  const allCategories = await payload.find({ collection: 'categories', limit: 0 })
  for (const cat of allCategories.docs) {
    if (cat.slug && validCategorySlugs.has(cat.slug)) continue
    const used = await payload.find({
      collection: 'procedures',
      where: { category: { equals: cat.id } },
      limit: 0,
    })
    if (used.totalDocs > 0) {
      console.warn(`\n  [skip] Category "${cat.name}" not in seed but has ${used.totalDocs} procedures — left untouched`)
      continue
    }
    await payload.delete({ collection: 'categories', id: cat.id })
    strayCatsDeleted++
    console.log(`\n  [deleted] Stray empty category "${cat.name}" (${cat.slug})`)
  }

  // ── 5. Unpublish stray procedures (not in source PDFs) ───────────────────────
  let strayUnpublished = 0
  for (const straySlug of STRAY_SLUGS) {
    const existing = await payload.find({
      collection: 'procedures',
      where: { slug: { equals: straySlug } },
      limit: 1,
    })
    if (existing.docs.length > 0 && existing.docs[0].status === 'published') {
      await payload.update({
        collection: 'procedures',
        id: existing.docs[0].id,
        data: { status: 'draft' },
      })
      strayUnpublished++
      console.log(`\n  [unpublished] ${existing.docs[0].title} (not in source PDFs)`)
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
  console.log(`  Stray      : ${strayUnpublished} procs unpublished, ${strayCatsDeleted} empty categories deleted`)
  console.log('═══════════════════════════════════════════\n')
}

// ── Entry point ───────────────────────────────────────────────────────────────
seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Seed failed:', err)
    process.exit(1)
  })
