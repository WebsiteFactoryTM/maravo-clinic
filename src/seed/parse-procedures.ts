/**
 * Parser for the Maravo Clinic procedures PDF text.
 * Converts extracted plain text into structured procedure records.
 */

export interface ProcedureMeta {
  duration?: string
  painLevel?: number
  painLabel?: string
  results?: string
  recovery?: string
  invasiveness?: 'non-invaziv' | 'minim-invaziv' | 'invaziv'
  effectDuration?: string
  repeatInterval?: string
}

export interface FaqItem {
  question: string
  answer: string
}

export interface ParsedProcedure {
  title: string
  meta: ProcedureMeta
  whatIsIt?: string
  whoIsItFor?: string
  benefits?: string[]
  howItWorks?: string
  resultsText?: string
  indications?: string
  contraindications?: string
  faq?: FaqItem[]
  complete: boolean
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Parse the "Pictograme" meta line, e.g.:
 * "Durată: 45–60 min Disconfort: minim, 1–3/10 Rezultate: imediate Recuperare: 24–72h"
 */
function parsePictograme(line: string): ProcedureMeta {
  const meta: ProcedureMeta = {}

  // Split on the known keywords that start each field
  // Fields: Durată, Disconfort, Rezultate, Recuperare
  const durataMatch = line.match(/Durată:\s*(.*?)(?=\s+Disconfort:|$)/i)
  if (durataMatch) meta.duration = durataMatch[1].trim()

  const disconfortMatch = line.match(/Disconfort:\s*(.*?)(?=\s+Rezultate:|$)/i)
  if (disconfortMatch) {
    const raw = disconfortMatch[1].trim()
    // Parse label (e.g. "minim", "moderat")
    const labelMatch = raw.match(/^([a-zA-ZăâîșțĂÂÎȘȚ]+)/i)
    if (labelMatch) meta.painLabel = labelMatch[1].toLowerCase()

    // Parse numeric score from "1–3/10" or "3–5/10" or "0" or "1–2/10"
    const numMatch = raw.match(/(\d+)[–\-](\d+)\/10/)
    if (numMatch) {
      // Use the upper bound
      meta.painLevel = parseInt(numMatch[2], 10)
    } else {
      const singleMatch = raw.match(/(\d+)\/10/)
      if (singleMatch) {
        meta.painLevel = parseInt(singleMatch[1], 10)
      } else {
        // Could be "0" or standalone number
        const zeroMatch = raw.match(/^(\d+)\s*$/)
        if (zeroMatch) meta.painLevel = parseInt(zeroMatch[1], 10)
      }
    }
  }

  const rezultateMatch = line.match(/Rezultate:\s*(.*?)(?=\s+Recuperare:|$)/i)
  if (rezultateMatch) meta.results = rezultateMatch[1].trim()

  const recuperareMatch = line.match(/Recuperare:\s*(.+)$/i)
  if (recuperareMatch) meta.recovery = recuperareMatch[1].trim()

  return meta
}

/**
 * Infer invasiveness from meta and title context.
 * - Devices that apply energy externally (laser, RF, HIFU, drenaj, crio) → non-invaziv
 * - Injectable / micro-needle procedures → minim-invaziv
 * - Nothing qualifies as 'invaziv' in this dataset
 */
function inferInvasiveness(
  title: string,
  painLabel: string | undefined,
  painLevel: number | undefined,
): 'non-invaziv' | 'minim-invaziv' | 'invaziv' {
  const t = title.toLowerCase()

  // Device-based non-invasive treatments
  const nonInvasiveKeywords = [
    'laser',
    'epilare',
    'hifu',
    'radiofrecvență',
    'radiofrec',
    'rf',
    'drenaj',
    'presoterapie',
    'lymphastim',
    'hydrafacial',
    'crio',
    'crioterapie',
    'dermapen',
    'microneedling',
    'consultație',
    'consultatie',
  ]
  for (const kw of nonInvasiveKeywords) {
    if (t.includes(kw)) return 'non-invaziv'
  }

  // If pain level is 0 it's non-invasive
  if (painLevel === 0) return 'non-invaziv'

  // Everything else is minim-invaziv (injectables, PRP, filler, etc.)
  return 'minim-invaziv'
}

/**
 * Parse bullet list lines into an array of strings.
 * Lines starting with "•" or "-" or "–" are items.
 */
function parseBullets(text: string): string[] {
  return text
    .split('\n')
    .map((l) => l.replace(/^[•\-–]\s*/, '').trim())
    .filter((l) => l.length > 0 && !l.startsWith('Procedura este potrivită'))
}

/** Text after the last sentence terminator — the question trailing a chunk. */
function tailAfterSentenceEnd(chunk: string): string {
  const idx = Math.max(chunk.lastIndexOf('.'), chunk.lastIndexOf('!'))
  return chunk.slice(idx + 1).trim()
}

/** Text up to the last sentence terminator — the answer leading a chunk. */
function headBeforeSentenceEnd(chunk: string): string {
  const idx = Math.max(chunk.lastIndexOf('.'), chunk.lastIndexOf('!'))
  return idx === -1 ? '' : chunk.slice(0, idx + 1).trim()
}

/**
 * Parse the FAQ block into Q/A pairs.
 *
 * The source packs several pairs onto one physical line:
 *   "Se umflă buzele? Ușor, câteva zile. Când se vede forma finală? 7–28 zile."
 * Splitting on "?" yields chunks that each hold the tail of the previous answer
 * *and* the next question; the boundary between the two is the last sentence
 * terminator in the chunk. Splitting on only the first "?" per line (the old
 * behaviour) let the first answer swallow every question that followed it.
 */
function parseFaq(text: string): FaqItem[] {
  const flat = text.replace(/\s*\n\s*/g, ' ').trim()
  if (!flat.includes('?')) return []

  const chunks = flat.split('?')
  const lastIdx = chunks.length - 1
  const items: FaqItem[] = []

  for (let i = 0; i < lastIdx; i++) {
    const question = tailAfterSentenceEnd(chunks[i])
    if (question.length === 0) continue

    const next = chunks[i + 1]
    const answer = i + 1 === lastIdx ? next.trim() : headBeforeSentenceEnd(next)

    items.push({ question: `${question}?`, answer: answer.trim() })
  }

  return items
}

/**
 * Split "Indicații și contraindicații" section text into
 * separate indications and contraindications strings.
 */
function parseIndicatii(text: string): { indications: string; contraindications: string } {
  // Both labels sit on their own line, so anchor to line starts: an unanchored
  // /Indicații/i also matches the tail of "Contraindicații".
  //
  // The previous capture was `([^C\n]+)` under the /i flag, which excludes
  // lowercase "c" as well — so "buze subțiri, lipsă contur, asimetrii" was cut
  // at "contur", and any value *starting* with "c" captured nothing at all.
  const indMatch = text.match(/^\s*Indicații\s*:\s*(.+)$/im)
  const contrMatch = text.match(/^\s*Contraindicații\s*:\s*(.+)$/im)
  return {
    indications: indMatch ? indMatch[1].trim() : '',
    contraindications: contrMatch ? contrMatch[1].trim() : '',
  }
}

// ── Main parser ───────────────────────────────────────────────────────────────

/**
 * Split raw text into blocks, one per numbered procedure.
 * Each block starts with a line matching /^\d+\. \S/
 */
function splitBlocks(raw: string): Array<{ num: number; text: string }> {
  const lines = raw.split('\n')
  const blocks: Array<{ num: number; startLine: number }> = []

  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^(\d+)\.\s+\S/)
    if (m) {
      const num = parseInt(m[1], 10)
      // Only treat as a top-level procedure if number is 1-40 and it's not
      // a sub-section number (1–9) within a procedure's body.
      // We detect sub-sections by checking if num is 1-9 AND the previous
      // block was also recently opened (i.e., a top-level block num is already active
      // and the found line is a sub-section header).
      // Strategy: a line is a TOP-LEVEL procedure heading if:
      // - num is not 1-9 (definitely top-level if > 9)
      // - OR the line content matches known section labels (Ce este?, Cui i se potrivește?, etc.)
      // We collect all candidates and then filter.
      const isSectionHeader = /^\d+\.\s+(Ce este\?|Cui i se potrivește\?|Beneficii|Cum decurge|Rezultate|Cât durează efectul\?|La cât timp|Indicații|Întrebări frecvente)/i.test(
        lines[i],
      )
      if (!isSectionHeader) {
        blocks.push({ num, startLine: i })
      }
    }
  }

  // Build text for each block
  return blocks.map((b, idx) => {
    const endLine = idx + 1 < blocks.length ? blocks[idx + 1].startLine : lines.length
    return {
      num: b.num,
      text: lines.slice(b.startLine, endLine).join('\n'),
    }
  })
}

/**
 * Parse a single procedure block into a ParsedProcedure.
 */
function parseBlock(block: { num: number; text: string }): ParsedProcedure {
  const lines = block.text.split('\n')

  // First non-empty line after removing the number prefix is the title
  const firstLine = lines[0] ?? ''
  const title = firstLine.replace(/^\d+\.\s*/, '').trim()

  // Find the Pictograme line (may have a "Tehnologie..." banner before it)
  let pictogrameLine = ''
  let pictogrameIdx = -1
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i]
    if (/^Pictograme\s*$/i.test(l.trim())) {
      // The next non-empty line is the meta
      for (let j = i + 1; j < lines.length; j++) {
        if (lines[j].trim().length > 0) {
          pictogrameLine = lines[j]
          pictogrameIdx = j
          break
        }
      }
      break
    }
  }

  const rawMeta = parsePictograme(pictogrameLine)

  // Extract numbered sections (1. Ce este? ... 9. Întrebări frecvente)
  // We look for lines matching /^\d\. (section name)/
  const sectionStarts: Array<{ idx: number; num: number }> = []
  for (let i = pictogrameIdx + 1; i < lines.length; i++) {
    const m = lines[i].match(/^(\d)\.\s+(Ce este\?|Cui i se potrivește\?|Beneficii|Cum decurge procedura\?|Rezultate|Cât durează efectul\?|La cât timp se repetă\?|Indicații și contraindicații|Întrebări frecvente)/i)
    if (m) {
      sectionStarts.push({ idx: i, num: parseInt(m[1], 10) })
    }
  }

  // Build a map section_num → text
  function getSectionText(num: number): string {
    const start = sectionStarts.find((s) => s.num === num)
    if (!start) return ''
    const next = sectionStarts.find((s) => s.num > num)
    const endIdx = next ? next.idx : lines.length
    return lines
      .slice(start.idx + 1, endIdx)
      .join('\n')
      .trim()
  }

  const whatIsItRaw = getSectionText(1)
  const whoIsItForRaw = getSectionText(2)
  const benefitsRaw = getSectionText(3)
  const howItWorksRaw = getSectionText(4)
  const resultsRaw = getSectionText(5)
  const effectDurationRaw = getSectionText(6)
  const repeatIntervalRaw = getSectionText(7)
  const indContrRaw = getSectionText(8)
  const faqRaw = getSectionText(9)

  // Fill meta from section texts
  rawMeta.effectDuration = effectDurationRaw.replace(/^6\.\s+Cât.*\n?/i, '').trim() || rawMeta.effectDuration
  rawMeta.repeatInterval = repeatIntervalRaw.replace(/^7\.\s+La.*\n?/i, '').trim() || rawMeta.repeatInterval

  // Infer invasiveness
  rawMeta.invasiveness = inferInvasiveness(title, rawMeta.painLabel, rawMeta.painLevel)

  // Benefits
  const benefits = parseBullets(benefitsRaw).filter((b) => b.length > 0)

  // Indications / contraindications
  const { indications, contraindications } = parseIndicatii(indContrRaw)

  // FAQ
  const faq = parseFaq(faqRaw)

  const complete = !!(
    whatIsItRaw.length > 10 &&
    (rawMeta.duration || rawMeta.painLevel !== undefined) &&
    (benefits.length > 0 || faq.length > 0)
  )

  return {
    title,
    meta: rawMeta,
    whatIsIt: whatIsItRaw || undefined,
    whoIsItFor: whoIsItForRaw || undefined,
    benefits: benefits.length > 0 ? benefits : undefined,
    howItWorks: howItWorksRaw || undefined,
    resultsText: resultsRaw || undefined,
    indications: indications || undefined,
    contraindications: contraindications || undefined,
    faq: faq.length > 0 ? faq : undefined,
    complete,
  }
}

/**
 * Main export: parse the raw text of the procedures PDF into structured records.
 */
export function parseProcedures(raw: string): ParsedProcedure[] {
  const blocks = splitBlocks(raw)
  return blocks.map(parseBlock).filter((p) => p.title.length > 0)
}
