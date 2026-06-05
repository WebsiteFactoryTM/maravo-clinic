/**
 * Media seed — idempotently uploads optimized WebP photos to the Payload
 * `media` collection, then attaches them to the mapped equipment (`photo`)
 * and procedure (`featuredImage`) documents.
 *
 * Usage:
 *   pnpm seed:media            ← standalone run
 *   (also called by seed.ts via import)
 *
 * Idempotency:
 *   - Media: checked by filename (alt starts with the filename stem).
 *     Skipped if already present.
 *   - Equipment/Procedures: only updated if `photo`/`featuredImage` is
 *     not already pointing at the correct media document.
 *
 * Environment:
 *   DATABASE_URI and PAYLOAD_SECRET must be set (.env or env vars).
 *   BLOB_READ_WRITE_TOKEN is optional — absent means local disk storage.
 */

import 'dotenv/config'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { getPayloadClient } from '../lib/payload.js'
import { EQUIPMENT_PHOTO_MAP, PROCEDURE_PHOTO_MAP, getAllMappedWebPs } from './photo-mapping.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OPTIMIZED_DIR = path.join(__dirname, 'optimized')

// ── Romanian alt-text derivation ─────────────────────────────────────────────

/** Map from webp filename → descriptive Romanian alt text */
const ALT_TEXT: Record<string, string> = {
  // Laser / Clarity II
  'image00001.webp': 'Epilare definitivă laser — aplicare handpiece Clarity II pe picior — Maravo Clinic Timișoara',
  'image00002.webp': 'Epilare definitivă laser pe abdomen cu sistem Lutronic Clarity II — Maravo Clinic Timișoara',
  'image00003.webp': 'Sistem laser Lutronic Clarity II în cabinet — epilare și tratamente laser — Maravo Clinic Timișoara',
  'image00004.webp': 'Tratament epilare laser cu Clarity II — zona axilă — Maravo Clinic Timișoara',
  'image00005.webp': 'Epilare definitivă laser pe braț cu Clarity II — Maravo Clinic Timișoara',
  'image00006.webp': 'Tratament laser Clarity II pe braț — Maravo Clinic Timișoara',
  'image00008.webp': 'Tratament laser pe picior — epilare sau vascular — Clarity II — Maravo Clinic Timișoara',

  // HydraFacial / treatments
  'image00010.webp': 'HydraFacial Syndeo — tratament facial cu panou LED roșu — Maravo Clinic Timișoara',
  'image00011.webp': 'Microneedling medical cu Dermapen 4 — tratament facial rejuvenare — Maravo Clinic Timișoara',
  'image00012.webp': 'HydraFacial Syndeo — tratament hidratare și curățare profundă față — Maravo Clinic Timișoara',
  'image00015.webp': 'Consultație și tratament facial în cabinetul Maravo Clinic Timișoara',

  // Clinic interiors
  'image00013.webp': 'Cabinet tratamente estetice injectabile — Maravo Clinic Timișoara',

  // NuEra Tight / RF
  'image00050.webp': 'Presoterapie BTL Lymphastim — drenaj limfatic — Maravo Clinic Timișoara',
  'image00051.webp': 'Remodelare corporală cu radiofrecvență NuEra Tight Lumenis pe abdomen — Maravo Clinic Timișoara',
  'image00055.webp': 'NuEra Tight Lumenis — radiofrecvență bipolară corporală — Maravo Clinic Timișoara',

  // HIFU
  'image00044.webp': 'HIFU lifting facial cu Liftera Asterasys — tratament gât și maxilar — Maravo Clinic Timișoara',
}

function getAlt(filename: string): string {
  return ALT_TEXT[filename] ?? `Maravo Clinic — ${filename.replace('.webp', '')}`
}

// ── Main seed-media function ──────────────────────────────────────────────────

export async function seedMedia(): Promise<void> {
  const payload = await getPayloadClient()

  console.log('\n── Media Upload ─────────────────────────────')

  // ── 1. Upload all mapped WebP files ──────────────────────────────────────
  const mappedFiles = getAllMappedWebPs()
  const mediaIdByFilename = new Map<string, number>()

  let uploaded = 0
  let skipped = 0

  for (const filename of mappedFiles) {
    const filePath = path.join(OPTIMIZED_DIR, filename)

    if (!fs.existsSync(filePath)) {
      console.warn(`  [warn] Missing optimized file: ${filename} — skipping`)
      continue
    }

    // Check if already uploaded (match by alt text prefix on filename stem)
    const stem = filename.replace('.webp', '')
    const existing = await payload.find({
      collection: 'media',
      where: { filename: { equals: filename } },
      limit: 1,
    })

    if (existing.docs.length > 0) {
      const doc = existing.docs[0]
      mediaIdByFilename.set(filename, doc.id)
      skipped++
      console.log(`  [skip]   ${filename} (id=${doc.id})`)
      continue
    }

    const alt = getAlt(filename)

    try {
      const doc = await payload.create({
        collection: 'media',
        filePath,
        data: { alt },
      })
      mediaIdByFilename.set(filename, doc.id)
      uploaded++
      console.log(`  [upload] ${filename} → id=${doc.id}`)
    } catch (err) {
      console.error(`  [error]  Failed to upload ${filename}:`, err)
    }
  }

  console.log(`\n  Media: ${uploaded} uploaded, ${skipped} already present`)

  // ── 2. Attach photos to Equipment ────────────────────────────────────────
  console.log('\n── Equipment Photo Attach ───────────────────')

  let eqAttached = 0
  let eqSkipped = 0

  for (const [equipSlug, webpFile] of Object.entries(EQUIPMENT_PHOTO_MAP)) {
    const mediaId = mediaIdByFilename.get(webpFile)
    if (!mediaId) {
      console.warn(`  [warn] No media ID for ${webpFile} — skipping equipment ${equipSlug}`)
      continue
    }

    const eqResult = await payload.find({
      collection: 'equipment',
      where: { slug: { equals: equipSlug } },
      limit: 1,
    })

    if (eqResult.docs.length === 0) {
      console.warn(`  [warn] Equipment not found: ${equipSlug}`)
      continue
    }

    const eq = eqResult.docs[0]
    // Check if already correctly assigned
    const currentPhotoId =
      eq.photo && typeof eq.photo === 'object' ? (eq.photo as { id: number }).id : eq.photo

    if (currentPhotoId === mediaId) {
      eqSkipped++
      console.log(`  [skip]   ${equipSlug} (photo already set)`)
      continue
    }

    await payload.update({
      collection: 'equipment',
      id: eq.id,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: { photo: mediaId } as any,
    })
    eqAttached++
    console.log(`  [attach] ${equipSlug} → ${webpFile} (media id=${mediaId})`)
  }

  console.log(`\n  Equipment: ${eqAttached} attached, ${eqSkipped} already correct`)

  // ── 3. Attach featuredImage to Procedures ─────────────────────────────────
  console.log('\n── Procedure Photo Attach ───────────────────')

  let procAttached = 0
  let procSkipped = 0

  for (const [procSlug, webpFile] of Object.entries(PROCEDURE_PHOTO_MAP)) {
    const mediaId = mediaIdByFilename.get(webpFile)
    if (!mediaId) {
      console.warn(`  [warn] No media ID for ${webpFile} — skipping procedure ${procSlug}`)
      continue
    }

    const procResult = await payload.find({
      collection: 'procedures',
      where: { slug: { equals: procSlug } },
      limit: 1,
    })

    if (procResult.docs.length === 0) {
      console.warn(`  [warn] Procedure not found: ${procSlug}`)
      continue
    }

    const proc = procResult.docs[0]
    const currentImageId =
      proc.featuredImage && typeof proc.featuredImage === 'object'
        ? (proc.featuredImage as { id: number }).id
        : proc.featuredImage

    if (currentImageId === mediaId) {
      procSkipped++
      console.log(`  [skip]   ${procSlug} (featuredImage already set)`)
      continue
    }

    await payload.update({
      collection: 'procedures',
      id: proc.id,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: { featuredImage: mediaId } as any,
      context: { skipSync: false },
    })
    procAttached++
    console.log(`  [attach] ${procSlug} → ${webpFile} (media id=${mediaId})`)
  }

  console.log(`\n  Procedures: ${procAttached} attached, ${procSkipped} already correct`)

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log('\n═══════════════════════════════════════════')
  console.log('  Media Seed complete')
  console.log('───────────────────────────────────────────')
  console.log(`  Media docs : ${uploaded} uploaded, ${skipped} skipped`)
  console.log(`  Equipment  : ${eqAttached} attached, ${eqSkipped} skipped`)
  console.log(`  Procedures : ${procAttached} attached, ${procSkipped} skipped`)
  console.log('═══════════════════════════════════════════\n')
}

// ── Entry point (standalone run) ─────────────────────────────────────────────
seedMedia()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Media seed failed:', err)
    process.exit(1)
  })
