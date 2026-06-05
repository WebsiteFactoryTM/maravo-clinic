/**
 * Image optimization pipeline for Maravo Clinic photos.
 *
 * Reads all JPEG files from the source folder (../selectie-foto relative to repo root),
 * resizes to max 2000px wide (no upscaling), converts to WebP at quality 80,
 * writes to src/seed/optimized/<name>.webp, and emits a manifest.json.
 *
 * Usage: pnpm tsx src/seed/optimize-photos.ts
 * Idempotent: existing files are overwritten (cheap since they're already small).
 */

import sharp from 'sharp'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const SOURCE_DIR = path.resolve(__dirname, '../../..', 'selectie-foto')
const OUTPUT_DIR = path.join(__dirname, 'optimized')
const MANIFEST_PATH = path.join(OUTPUT_DIR, 'manifest.json')

const MAX_WIDTH = 2000
const WEBP_QUALITY = 80

interface ManifestEntry {
  source: string
  output: string
  width: number
  height: number
  bytes: number
  sourceBytes: number
}

async function main(): Promise<void> {
  // Ensure output directory exists
  fs.mkdirSync(OUTPUT_DIR, { recursive: true })

  // Find all JPEG source files
  const files = fs
    .readdirSync(SOURCE_DIR)
    .filter((f) => /\.(jpe?g)$/i.test(f))
    .sort()

  if (files.length === 0) {
    console.error(`No JPEG files found in ${SOURCE_DIR}`)
    process.exit(1)
  }

  console.log(`\n══════════════════════════════════════════`)
  console.log(`  Maravo Clinic — Photo Optimization`)
  console.log(`══════════════════════════════════════════`)
  console.log(`  Source : ${SOURCE_DIR}`)
  console.log(`  Output : ${OUTPUT_DIR}`)
  console.log(`  Files  : ${files.length}`)
  console.log(`══════════════════════════════════════════\n`)

  const manifest: ManifestEntry[] = []
  let totalSourceBytes = 0
  let totalOutputBytes = 0

  for (const file of files) {
    const sourcePath = path.join(SOURCE_DIR, file)
    const baseName = path.basename(file, path.extname(file))
    const outputFile = `${baseName}.webp`
    const outputPath = path.join(OUTPUT_DIR, outputFile)

    const sourceBytes = fs.statSync(sourcePath).size
    totalSourceBytes += sourceBytes

    const img = sharp(sourcePath)
    const meta = await img.metadata()

    // Resize only if wider than MAX_WIDTH
    const pipeline =
      meta.width && meta.width > MAX_WIDTH
        ? img.resize({ width: MAX_WIDTH, withoutEnlargement: true })
        : img

    const { data, info } = await pipeline
      .webp({ quality: WEBP_QUALITY })
      .toBuffer({ resolveWithObject: true })

    fs.writeFileSync(outputPath, data)
    totalOutputBytes += data.length

    manifest.push({
      source: file,
      output: outputFile,
      width: info.width,
      height: info.height,
      bytes: data.length,
      sourceBytes,
    })

    const ratio = ((1 - data.length / sourceBytes) * 100).toFixed(0)
    console.log(
      `  ${file} → ${outputFile}  ${(sourceBytes / 1024 / 1024).toFixed(1)}MB → ${(data.length / 1024).toFixed(0)}KB  (-${ratio}%)`,
    )
  }

  // Write manifest
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2), 'utf8')

  console.log(`\n══════════════════════════════════════════`)
  console.log(`  Summary`)
  console.log(`──────────────────────────────────────────`)
  console.log(`  Files    : ${files.length}`)
  console.log(`  Before   : ${(totalSourceBytes / 1024 / 1024).toFixed(1)} MB`)
  console.log(`  After    : ${(totalOutputBytes / 1024 / 1024).toFixed(1)} MB`)
  const overallRatio = ((1 - totalOutputBytes / totalSourceBytes) * 100).toFixed(0)
  console.log(`  Savings  : ${overallRatio}%`)
  console.log(`  Manifest : ${MANIFEST_PATH}`)
  console.log(`══════════════════════════════════════════\n`)
}

main().catch((err) => {
  console.error('Optimization failed:', err)
  process.exit(1)
})
