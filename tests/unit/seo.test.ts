import { defaultMetaTitle, defaultMetaDescription, procedureJsonLd, faqJsonLd, breadcrumbJsonLd, jsonLdHtml, buildMetadata } from '../../src/lib/seo'
import { test, expect } from 'vitest'

// --- defaultMetaTitle ---

test('default meta title appends Timișoara + brand', () => {
  expect(defaultMetaTitle('Injectare botox')).toBe('Injectare botox Timișoara — Maravo Clinic')
})

test('default meta title does NOT double Timișoara when already present', () => {
  expect(defaultMetaTitle('Botox Timișoara')).toBe('Botox Timișoara — Maravo Clinic')
})

// --- defaultMetaDescription ---

test('default meta description truncates long input to <=155 chars', () => {
  const long = 'x'.repeat(300)
  expect(defaultMetaDescription(long).length).toBeLessThanOrEqual(155)
})

test('default meta description returns input unchanged if already short', () => {
  const short = 'Clinica Maravo oferă tratamente estetice în Timișoara.'
  expect(defaultMetaDescription(short)).toBe(short)
})

test('default meta description truncated result ends with ellipsis character', () => {
  const long = 'y'.repeat(300)
  const result = defaultMetaDescription(long)
  expect(result.endsWith('…')).toBe(true)
})

// --- procedureJsonLd ---

test('procedure JSON-LD has MedicalProcedure type, name, url, description', () => {
  const ld = procedureJsonLd({ title: 'Botox', url: 'https://maravo/p', description: 'd' })
  expect(ld['@type']).toBe('MedicalProcedure')
  expect(ld['@context']).toBe('https://schema.org')
  expect(ld.name).toBe('Botox')
  expect(ld.url).toBe('https://maravo/p')
  expect(ld.description).toBe('d')
})

test('procedure JSON-LD includes Timișoara clinic location', () => {
  const ld = procedureJsonLd({ title: 'Filler', url: 'https://maravo/f', description: 'desc' })
  expect(ld.location['@type']).toBe('MedicalClinic')
  expect(ld.location.address).toContain('Timișoara')
})

// --- faqJsonLd ---

test('faq JSON-LD builds FAQPage with Question/Answer entities', () => {
  const ld = faqJsonLd([{ question: 'Doare?', answer: 'Minim.' }])
  expect(ld['@type']).toBe('FAQPage')
  expect(ld.mainEntity).toHaveLength(1)
  expect(ld.mainEntity[0]['@type']).toBe('Question')
  expect(ld.mainEntity[0].name).toBe('Doare?')
  expect(ld.mainEntity[0].acceptedAnswer.text).toBe('Minim.')
})

test('faq JSON-LD with empty array produces empty mainEntity', () => {
  const ld = faqJsonLd([])
  expect(ld['@type']).toBe('FAQPage')
  expect(ld.mainEntity).toHaveLength(0)
})

test('faq JSON-LD acceptedAnswer has Answer type', () => {
  const ld = faqJsonLd([{ question: 'Q', answer: 'A' }])
  expect(ld.mainEntity[0].acceptedAnswer['@type']).toBe('Answer')
})

// --- breadcrumbJsonLd ---

test('breadcrumb JSON-LD builds ordered ListItems', () => {
  const ld = breadcrumbJsonLd([
    { name: 'Acasă', url: 'https://m/' },
    { name: 'Proceduri', url: 'https://m/proceduri' },
  ])
  expect(ld['@type']).toBe('BreadcrumbList')
  expect(ld.itemListElement[0].position).toBe(1)
  expect(ld.itemListElement[1].position).toBe(2)
  expect(ld.itemListElement[1].name).toBe('Proceduri')
  expect(ld.itemListElement[1].item).toBe('https://m/proceduri')
})

test('breadcrumb JSON-LD ListItem has ListItem type', () => {
  const ld = breadcrumbJsonLd([{ name: 'Acasă', url: 'https://m/' }])
  expect(ld.itemListElement[0]['@type']).toBe('ListItem')
})

test('breadcrumb JSON-LD with single crumb has position 1', () => {
  const ld = breadcrumbJsonLd([{ name: 'Home', url: 'https://m/' }])
  expect(ld.itemListElement).toHaveLength(1)
  expect(ld.itemListElement[0].position).toBe(1)
})

// --- jsonLdHtml ---

test('jsonLdHtml does not contain literal </script> when input has <', () => {
  const result = jsonLdHtml({ name: 'a</script><b' })
  expect(result).not.toContain('</script>')
})

test('jsonLdHtml escapes < to \\u003c', () => {
  const result = jsonLdHtml({ name: 'a</script><b' })
  expect(result).toContain('\\u003c')
})

test('jsonLdHtml output is valid JSON that round-trips to original object', () => {
  const original = { name: 'a</script><b' }
  const result = jsonLdHtml(original)
  expect(JSON.parse(result)).toEqual(original)
})

// --- buildMetadata ---
test('buildMetadata canonical is absolute and ends with the path', () => {
  const md = buildMetadata({ title: 'T', description: 'D', path: '/despre' })
  const canonical = md.alternates?.canonical as string
  expect(canonical).toMatch(/^https?:\/\//)
  expect(canonical.endsWith('/despre')).toBe(true)
})

test('buildMetadata home path has no trailing slash', () => {
  const canonical = buildMetadata({ title: 'T', description: 'D', path: '/' })
    .alternates?.canonical as string
  expect(canonical.endsWith('/')).toBe(false)
})

test('buildMetadata OpenGraph url mirrors canonical', () => {
  const md = buildMetadata({ title: 'T', description: 'D', path: '/contact' })
  expect((md.openGraph as { url?: string }).url).toBe(md.alternates?.canonical)
})

test('buildMetadata truncates description to <=155', () => {
  const md = buildMetadata({ title: 'T', description: 'x'.repeat(300), path: '/' })
  expect((md.description as string).length).toBeLessThanOrEqual(155)
})

test('buildMetadata mirrors title/description into OG and Twitter', () => {
  const md = buildMetadata({ title: 'Hello', description: 'World', path: '/' })
  expect((md.openGraph as { title?: string }).title).toBe('Hello')
  expect((md.twitter as { description?: string }).description).toBe('World')
})

test('buildMetadata type defaults to website and passes article through', () => {
  const web = buildMetadata({ title: 't', description: 'd', path: '/' })
  const art = buildMetadata({ title: 't', description: 'd', path: '/b', type: 'article' })
  expect((web.openGraph as { type?: string }).type).toBe('website')
  expect((art.openGraph as { type?: string }).type).toBe('article')
})
