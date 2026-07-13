import { getPayloadClient } from '@/lib/payload'
import { PROCEDURE_SORT } from '@/lib/procedure-sort'
import type { Category } from '@/payload-types'

export const revalidate = 3600

function baseUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
}

function resolveCategory(cat: number | Category): Category | null {
  return typeof cat === 'number' ? null : cat
}

/** Collapse whitespace and clamp a string to a bounded length. */
function oneLine(value: string | null | undefined, max = 160): string {
  if (!value) return ''
  const flat = value.replace(/\s+/g, ' ').trim()
  return flat.length > max ? `${flat.slice(0, max - 1)}…` : flat
}

export async function GET(): Promise<Response> {
  const base = baseUrl()
  const payload = await getPayloadClient()

  const settings = await payload.findGlobal({ slug: 'site-settings' })
  const clinicName = settings.clinicName ?? 'Maravo'
  const address = settings.address ?? 'Timișoara, România'
  const phone = settings.phone ?? '—'
  const email = settings.email ?? 'office@maravo.ro'

  const categories = await payload.find({
    collection: 'categories',
    limit: 0,
    depth: 0,
    sort: 'order',
  })

  const procedures = await payload.find({
    collection: 'procedures',
    where: { status: { equals: 'published' } },
    sort: PROCEDURE_SORT,
    limit: 0,
    depth: 1,
  })

  const equipment = await payload.find({
    collection: 'equipment',
    where: { status: { equals: 'published' } },
    limit: 0,
    depth: 0,
  })

  // Group published procedures by category slug.
  const byCategory = new Map<number, typeof procedures.docs>()
  for (const proc of procedures.docs) {
    const cat = resolveCategory(proc.category)
    if (!cat?.slug || !proc.slug) continue
    const list = byCategory.get(cat.id) ?? []
    list.push(proc)
    byCategory.set(cat.id, list)
  }

  const lines: string[] = []

  lines.push(`# ${clinicName}`)
  lines.push('')
  lines.push(
    `${clinicName} este o clinică premium de medicină estetică din Timișoara, ` +
      `oferind tratamente injectabile, terapii laser, HIFU, radiofrecvență (RF), ` +
      `medicină regenerativă, tratamente pentru păr și remodelare corporală. ` +
      `Procedurile sunt realizate de o echipă medicală specializată, cu aparatură de ultimă generație.`,
  )
  lines.push('')
  lines.push('## Informații de contact')
  lines.push(`- Locație: ${address}`)
  lines.push(`- Telefon: ${phone}`)
  lines.push(`- Email: ${email}`)
  lines.push(`- Website: ${base}`)
  lines.push('')

  lines.push('## Proceduri')
  for (const cat of categories.docs) {
    if (!cat.slug) continue
    const procs = byCategory.get(cat.id)
    if (!procs || procs.length === 0) continue
    lines.push('')
    lines.push(`### ${cat.name}`)
    for (const proc of procs) {
      const url = `${base}/proceduri/${cat.slug}/${proc.slug}`
      const excerpt = oneLine(proc.excerpt)
      lines.push(`- ${proc.title}: ${url}${excerpt ? ` — ${excerpt}` : ''}`)
    }
  }

  lines.push('')
  lines.push('## Aparatură')
  for (const eq of equipment.docs) {
    if (!eq.slug) continue
    const url = `${base}/aparatura/${eq.slug}`
    const purpose = oneLine(eq.purpose)
    lines.push(`- ${eq.name}: ${url}${purpose ? ` — ${purpose}` : ''}`)
  }

  lines.push('')

  return new Response(lines.join('\n'), {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  })
}
