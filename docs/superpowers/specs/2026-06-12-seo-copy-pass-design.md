# SEO Copy Pass — Metadata + Despre/Contact (Timișoara-first)

**Date:** 2026-06-12
**Status:** Approved design
**Scope owner:** Maravo Dev

## 1. Context

`maravoclinic.ro` is being rebuilt in Next.js 16 + Payload 3. The rebuild
already has a solid SEO foundation: `metadataBase`, per-page metadata,
site-wide `MedicalClinic` JSON-LD, `MedicalProcedure`/`FAQPage`/`BreadcrumbList`
builders in `lib/seo.ts`, `defaultMetaTitle`/`defaultMetaDescription` helpers,
and dynamic sitemap/robots/llm.txt.

The live site exposes the real business facts this rebuild should rank on:
Dr. Cristiana Voinescu, address **Strada Salcâmilor 14–16, Timișoara, Timiș**,
phone **+40 775 393 323**, email **info@maravoclinic.ro**, hours
**Luni–Vineri 09:00–20:00** (weekend closed), and the high-intent local terms
its copy targets (epilare definitivă / botox / acid hialuronic … Timișoara).

This pass is **code-only** and covers exactly two surfaces (per stakeholder
decision):

1. **Page metadata** — Timișoara-targeted titles + descriptions for every page
   type, plus correct canonicals/OpenGraph.
2. **Static page copy** — visible copy on `/despre` and `/contact`, using the
   verified live-site facts (Dr. Voinescu for E-E-A-T, real NAP, hours).

## 2. Goals / Non-goals

### Goals
- Unique, local-intent `<title>` (≤ ~60 chars, primary keyword front-loaded)
  and `<meta name="description">` (≤155 chars, includes city + a booking CTA)
  on every page type.
- Fix the canonical-tag bug so each page self-canonicalizes (see §3).
- Consistent OpenGraph/Twitter per page (correct per-page `url`, title, desc).
- `/despre` + `/contact` copy upgraded with verified facts: Dr. Cristiana
  Voinescu (E-E-A-T), real NAP, hours, natural neighborhood/treatment keywords.
- One source of truth in code for clinic NAP + per-page keywords.

### Non-goals (explicitly out of scope)
- No homepage **body** copy rewrite (hero/sections) — metadata only for `/`.
- No CMS/seed-data changes; no edits to procedure/category body content.
- No new local-SEO data work beyond NAP in copy (no geo coordinates,
  `openingHoursSpecification`, `AggregateRating`, Google Business — separate
  future workstream).
- No redesign / visual-layout changes. (The only edits to `layout.tsx` and
  `Footer.tsx` are swapping their NAP **fallback values** to `CLINIC` for
  consistency — no markup/structure changes.)

## 3. Key problem: canonical tags point at the homepage

`src/app/(frontend)/layout.tsx` sets:

```ts
alternates: { canonical: BASE_URL }
```

In the App Router, a page that does not set its own `alternates` inherits the
parent's. The **dynamic** pages (`proceduri/[categorie]`,
`proceduri/[categorie]/[slug]`, `aparatura/[slug]`, `blog/[slug]`) already set
their own canonical and are fine. The **static** pages — `/proceduri`,
`/aparatura`, `/tarife`, `/blog`, `/despre`, `/contact` — do **not**, so they
currently emit `<link rel="canonical" href="<homepage>">`, telling search
engines they are duplicates of the homepage. This must be fixed for every
static page (the homepage's inherited `canonical: BASE_URL` is correct for `/`).

## 4. Architecture

### 4.1 `src/lib/clinic.ts` (new) — single source of truth in code

Exports a `CLINIC` constant and a `PAGE_KEYWORDS` map. Pure data, no deps.

```ts
export const CLINIC = {
  name: 'Maravo Clinic',
  city: 'Timișoara',
  county: 'Timiș',
  street: 'Strada Salcâmilor 14-16',
  // postalCode intentionally omitted — not verified, do not fabricate.
  phone: '+40 775 393 323',
  phoneHref: '+40775393323',
  email: 'info@maravoclinic.ro',
  hours: [
    { day: 'Luni – Vineri', value: '09:00 – 20:00' },
    { day: 'Sâmbătă – Duminică', value: 'Închis' },
  ],
  doctor: { name: 'Dr. Cristiana Voinescu' }, // role described conservatively in copy
} as const
```

These become **fallback defaults** only; CMS `site-settings` still overrides at
runtime (existing `settings?.x ?? …` chains gain a real default instead of
`'Timișoara, România'` / `+40000000000`). Used by `/despre`, `/contact`, and —
for NAP consistency — the layout `MedicalClinic` JSON-LD and the footer.

> **Conservative E-E-A-T:** name Dr. Cristiana Voinescu (verified, published on
> the live site) but do **not** assert specific board certifications or a
> specialty title that isn't verified. Copy describes her as coordinating the
> medical team.

### 4.2 `src/lib/seo.ts` — add `buildMetadata()`

Keep `defaultMetaTitle`, `defaultMetaDescription`, and the JSON-LD builders
unchanged (existing unit tests must stay green). Add:

```ts
interface BuildMetadataInput {
  title: string          // raw page title; city/brand appended via defaultMetaTitle
  description: string     // raw; truncated via defaultMetaDescription
  path: string            // e.g. '/despre' — canonical + OG url derived from BASE_URL
  ogImage?: string        // defaults to the site OG image
  type?: 'website' | 'article'
}
export function buildMetadata(input: BuildMetadataInput): Metadata
```

Returns a complete `Metadata` with: `title` (via `defaultMetaTitle`),
`description` (via `defaultMetaDescription`), `alternates.canonical`
(`BASE_URL + path`), and matching `openGraph` (type, url, title, description,
images, siteName, locale) + `twitter`. This removes ~11× duplicated
canonical/OG boilerplate and makes the canonical fix structural.

Dynamic pages adopt `buildMetadata` too, passing their derived title/description
and computed `path`, so all canonicals/OG flow through one place.

### 4.3 Description localization for dynamic pages

Category/procedure/equipment descriptions derive from CMS `excerpt`/`description`.
The page composes a description that **guarantees** the city + a CTA: if the CMS
text is empty, use the templated fallback (see §5); otherwise pass the CMS text
through `defaultMetaDescription`. (Implementation detail; titles use
`defaultMetaTitle` which already dedupes "Timișoara".)

## 5. Per-page title + description strings

Static pages use these literal strings (Romanian). `— Maravo Clinic` is added by
`defaultMetaTitle`; the `title` column below is the raw input to it.

| Route | Title (raw → rendered adds "— Maravo Clinic") | Description (≤155) |
|---|---|---|
| `/` | `Clinică estetică Timișoara` | `Clinică de estetică medicală premium în Timișoara: epilare definitivă, botox, acid hialuronic, HIFU, laser. Programează o consultație.` |
| `/proceduri` | `Proceduri estetice Timișoara` | `Toate procedurile estetice și dermatologice Maravo Clinic Timișoara, pe categorii: față, corp, laser, injectabile. Programează o consultație.` |
| `/aparatura` | `Aparatură estetică Timișoara` | `Aparatură medicală de top la Maravo Clinic Timișoara: Lutronic Clarity II, HIFU, radiofrecvență, HydraFacial. Programează o consultație.` |
| `/tarife` | `Tarife proceduri estetice Timișoara` | `Prețuri orientative pentru procedurile estetice Maravo Clinic Timișoara, pe categorii. Programează o consultație pentru o ofertă personalizată.` |
| `/despre` | `Despre — clinică estetică premium Timișoara` | `Maravo Clinic, clinică de estetică medicală premium în Timișoara. Echipă coordonată de Dr. Cristiana Voinescu, tehnologie certificată CE.` |
| `/contact` | `Contact Timișoara` | `Programări și informații Maravo Clinic: Str. Salcâmilor 14–16, Timișoara, +40 775 393 323. Sună, scrie pe WhatsApp sau completează formularul.` |
| `/blog` | `Blog estetică medicală Timișoara` | `Articole, ghiduri și sfaturi despre tratamente estetice și îngrijirea pielii, de la specialiștii Maravo Clinic Timișoara.` |

Dynamic page patterns (title is raw input to `defaultMetaTitle`):

| Route | Title pattern | Description |
|---|---|---|
| `/proceduri/[categorie]` | `{categoryName}` | CMS category description, else `Proceduri de {categorie} la Maravo Clinic Timișoara — tehnologie certificată și rezultate naturale. Programează o consultație.` |
| `/proceduri/[categorie]/[slug]` | `{procedureTitle}` | CMS excerpt (localized), else `{procedureTitle} la Maravo Clinic Timișoara. Consultație și plan personalizat. Programează-te.` |
| `/aparatura/[slug]` | `{equipmentName}` | CMS purpose/excerpt (localized), else `{equipmentName} la Maravo Clinic Timișoara — tratamente cu aparatură de ultimă generație.` |
| `/blog/[slug]` | `{postTitle}` (no city forced) | CMS SEO desc, else post excerpt via `defaultMetaDescription`. |

> Lengths above are authored ≤155; the description helper enforces the cap as a
> safety net. Titles are authored so that `raw + " Timișoara — Maravo Clinic"`
> (when city absent) stays ≤ ~60 where practical; long CMS procedure names are
> accepted as-is (unavoidable, still unique + local).

## 6. `/despre` + `/contact` copy changes

### `/despre`
- Replace the role-only "Echipa medicală" placeholder + remove the `CLIENT TODO`:
  name **Dr. Cristiana Voinescu** as coordinator of the medical team
  (conservative phrasing, no fabricated credentials).
- NAP block defaults pull from `CLINIC` (real street/phone/email) instead of the
  `'Timișoara, România'` placeholder, still CMS-overridable.
- Light local-intent enrichment in hero lead + story (neighborhood / "în
  Timișoara" / treatment families) without keyword stuffing; premium tone kept.
- Metadata via `buildMetadata` with §5 strings.

### `/contact`
- NAP defaults from `CLINIC`; hours fallback from `CLINIC.hours` when CMS empty.
- Hero lead keeps booking-focused copy, adds the city explicitly.
- Metadata via `buildMetadata` with §5 strings.

## 7. Testing

- `tests/unit/seo.test.ts`: keep existing tests; add `buildMetadata` tests —
  canonical equals `BASE_URL + path`, OG `url` matches canonical, OG
  title/description mirror the rendered values, description ≤155, `type`
  defaults to `website`.
- Optional e2e: assert `/despre` `<link rel="canonical">` ends with `/despre`
  (not the bare origin) to lock the canonical fix.

## 8. Risks & mitigations

- **Wrong/owner-sensitive facts.** All facts sourced from the client's own live
  site; doctor credentials kept conservative. NAP remains CMS-overridable.
- **Title truncation** for long CMS procedure names — accepted; uniqueness +
  locality preserved.
- **Broad mechanical diff** (every page file) — mitigated by the shared
  `buildMetadata` helper and unit tests; no behavior change beyond metadata.

## 9. Affected files

- New: `src/lib/clinic.ts`
- Edit: `src/lib/seo.ts` (+ `tests/unit/seo.test.ts`)
- Edit metadata: `src/app/(frontend)/page.tsx`, `proceduri/page.tsx`,
  `proceduri/[categorie]/page.tsx`, `proceduri/[categorie]/[slug]/page.tsx`,
  `aparatura/page.tsx`, `aparatura/[slug]/page.tsx`, `tarife/page.tsx`,
  `blog/page.tsx`, `blog/[slug]/page.tsx`, `despre/page.tsx`, `contact/page.tsx`
- Edit copy + NAP: `despre/page.tsx`, `contact/page.tsx`
- Edit NAP consistency: `layout.tsx` (JSON-LD fallback), `components/layout/Footer.tsx`
