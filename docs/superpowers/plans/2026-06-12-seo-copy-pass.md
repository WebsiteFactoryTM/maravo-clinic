# SEO Copy Pass Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every page's metadata Timișoara-targeted and self-canonicalizing, and upgrade `/despre` + `/contact` copy with verified live-site facts (Dr. Cristiana Voinescu, real NAP).

**Architecture:** A new `src/lib/clinic.ts` holds the canonical clinic facts (NAP) in code. A new `buildMetadata()` helper in `src/lib/seo.ts` produces a complete `Metadata` object (title, truncated description, **canonical**, OpenGraph, Twitter) — adopted by the static pages, which currently inherit the homepage canonical. Dynamic pages (already self-canonicalizing) get only description-fallback tweaks. `/despre` + `/contact` copy/NAP use `CLINIC`, and the site-wide JSON-LD/footer fallbacks point at `CLINIC` too.

**Tech Stack:** Next.js 16 App Router (`generateMetadata` / `export const metadata`), TypeScript, Payload 3, Vitest.

**Notes for the engineer:**
- `pnpm lint` is currently broken environment-wide (`eslint-config-next` "circular structure" under Node 24.11). Do **not** rely on lint; verify with `pnpm typecheck` and Vitest.
- Run a single vitest file with: `pnpm exec cross-env NODE_OPTIONS=--no-deprecation vitest run <path>`.
- `defaultMetaTitle(t)` appends `" — Maravo Clinic"` (and `" Timișoara"` when absent). **Never** pass a title that already contains "Maravo Clinic" into it, or the brand doubles. Pass brand-free raw titles.
- The reference spec is `docs/superpowers/specs/2026-06-12-seo-copy-pass-design.md`.

---

### Task 1: Clinic NAP constants

**Files:**
- Create: `src/lib/clinic.ts`
- Test: `tests/unit/clinic.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/unit/clinic.test.ts
import { CLINIC } from '../../src/lib/clinic'
import { test, expect } from 'vitest'

test('CLINIC exposes core NAP fields', () => {
  expect(CLINIC.name).toBe('Maravo Clinic')
  expect(CLINIC.city).toBe('Timișoara')
  expect(CLINIC.email).toBe('info@maravoclinic.ro')
  expect(CLINIC.addressFull).toContain('Salcâmilor')
})

test('CLINIC.phoneHref is dial-safe (starts with + and has no whitespace)', () => {
  expect(CLINIC.phoneHref.startsWith('+')).toBe(true)
  expect(CLINIC.phoneHref).not.toMatch(/\s/)
})

test('CLINIC.hours is a non-empty list of {day,value}', () => {
  expect(CLINIC.hours.length).toBeGreaterThan(0)
  expect(CLINIC.hours[0]).toHaveProperty('day')
  expect(CLINIC.hours[0]).toHaveProperty('value')
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec cross-env NODE_OPTIONS=--no-deprecation vitest run tests/unit/clinic.test.ts`
Expected: FAIL — cannot find module `../../src/lib/clinic`.

- [ ] **Step 3: Create the module**

```ts
// src/lib/clinic.ts
// Single source of truth (in code) for Maravo Clinic's public business facts.
// These are used as FALLBACK DEFAULTS only — CMS `site-settings` overrides them
// at runtime. Sourced from the client's live site (maravoclinic.ro).

export const CLINIC = {
  name: 'Maravo Clinic',
  city: 'Timișoara',
  county: 'Timiș',
  street: 'Strada Salcâmilor 14-16',
  addressFull: 'Strada Salcâmilor 14-16, Timișoara, Timiș',
  phone: '+40 775 393 323',
  phoneHref: '+40775393323',
  whatsapp: '40775393323',
  email: 'info@maravoclinic.ro',
  hours: [
    { day: 'Luni – Vineri', value: '09:00 – 20:00' },
    { day: 'Sâmbătă – Duminică', value: 'Închis' },
  ],
  // Verified (published on the live site). Keep role phrasing conservative in
  // copy — do not assert specific board certifications that aren't verified.
  doctor: { name: 'Dr. Cristiana Voinescu' },
} as const
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec cross-env NODE_OPTIONS=--no-deprecation vitest run tests/unit/clinic.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```
git add src/lib/clinic.ts tests/unit/clinic.test.ts
git commit -m "feat(seo): add CLINIC NAP constants (single source of truth)"
```

---

### Task 2: `buildMetadata()` helper

**Files:**
- Modify: `src/lib/seo.ts`
- Test: `tests/unit/seo.test.ts`

- [ ] **Step 1: Add the failing tests**

First, add `buildMetadata` to the existing `../../src/lib/seo` import on line 1 of `tests/unit/seo.test.ts` (do **not** add a second import statement). Then append:

```ts
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm exec cross-env NODE_OPTIONS=--no-deprecation vitest run tests/unit/seo.test.ts`
Expected: FAIL — `buildMetadata` is not exported.

- [ ] **Step 3: Implement `buildMetadata`**

In `src/lib/seo.ts`, add the `next` type import at the top (after the file's opening comment):

```ts
import type { Metadata } from 'next'
```

Then add near the bottom of the file (after the meta helpers):

```ts
// ── Full page-metadata builder ────────────────────────────────────────────────

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
const OG_IMAGE = `${BASE_URL}/logo-gold.png`

export interface BuildMetadataInput {
  /** Final title (already brand-stamped, e.g. via defaultMetaTitle). */
  title: string
  /** Raw description; truncated to ≤155 via defaultMetaDescription. */
  description: string
  /** Route path, e.g. '/despre' or '/' — canonical is BASE_URL + path. */
  path: string
  ogImage?: { url: string; alt?: string }
  type?: 'website' | 'article'
}

/**
 * Builds a complete Next.js Metadata object with a correct per-page canonical,
 * OpenGraph and Twitter card. Use on pages that would otherwise inherit the
 * root layout's canonical (which points at the homepage).
 */
export function buildMetadata(input: BuildMetadataInput): Metadata {
  const { title, path, type = 'website' } = input
  const description = defaultMetaDescription(input.description)
  const canonical = path === '/' ? BASE_URL : `${BASE_URL}${path}`
  const image = input.ogImage ?? { url: OG_IMAGE }

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type,
      url: canonical,
      siteName: 'Maravo Clinic',
      locale: 'ro_RO',
      title,
      description,
      images: [{ url: image.url, ...(image.alt ? { alt: image.alt } : {}) }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image.url],
    },
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm exec cross-env NODE_OPTIONS=--no-deprecation vitest run tests/unit/seo.test.ts`
Expected: PASS (existing tests + 6 new).

- [ ] **Step 5: Typecheck**

Run: `pnpm typecheck`
Expected: no output (success).

- [ ] **Step 6: Commit**

```
git add src/lib/seo.ts tests/unit/seo.test.ts
git commit -m "feat(seo): add buildMetadata() helper (canonical + OG/Twitter)"
```

---

### Task 3: Static pages → `buildMetadata` (fixes canonical bug)

**Files (modify the `export const metadata` block in each):**
- `src/app/(frontend)/page.tsx`
- `src/app/(frontend)/proceduri/page.tsx`
- `src/app/(frontend)/aparatura/page.tsx`
- `src/app/(frontend)/tarife/page.tsx`
- `src/app/(frontend)/blog/page.tsx`

For each page: ensure the import line includes `buildMetadata` and `defaultMetaTitle` from `@/lib/seo`, then replace the existing `export const metadata = {...}` object with a `buildMetadata(...)` call. Leave all other code (data fetching, default export) unchanged.

- [ ] **Step 1: Homepage** — `src/app/(frontend)/page.tsx`

Add to imports: `import { buildMetadata, defaultMetaTitle } from '@/lib/seo'`. Replace the entire `export const metadata: Metadata = { … }` block with:

```ts
export const metadata = buildMetadata({
  title: defaultMetaTitle('Clinică estetică Timișoara'),
  description:
    'Clinică de estetică medicală premium în Timișoara: epilare definitivă, botox, acid hialuronic, HIFU, laser. Programează o consultație.',
  path: '/',
})
```

(The unused `import type { Metadata } from 'next'` may be removed if nothing else uses it.)

- [ ] **Step 2: Proceduri hub** — `src/app/(frontend)/proceduri/page.tsx`

Add `buildMetadata, defaultMetaTitle` to the `@/lib/seo` import (or add the import). Replace the `export const metadata` block with:

```ts
export const metadata = buildMetadata({
  title: defaultMetaTitle('Proceduri estetice Timișoara'),
  description:
    'Toate procedurile estetice și dermatologice Maravo Clinic Timișoara, pe categorii: față, corp, laser, injectabile. Programează o consultație.',
  path: '/proceduri',
})
```

- [ ] **Step 3: Aparatură list** — `src/app/(frontend)/aparatura/page.tsx`

```ts
export const metadata = buildMetadata({
  title: defaultMetaTitle('Aparatură estetică Timișoara'),
  description:
    'Aparatură medicală de top la Maravo Clinic Timișoara: Lutronic Clarity II, HIFU, radiofrecvență, HydraFacial. Programează o consultație.',
  path: '/aparatura',
})
```

- [ ] **Step 4: Tarife** — `src/app/(frontend)/tarife/page.tsx`

```ts
export const metadata = buildMetadata({
  title: defaultMetaTitle('Tarife proceduri estetice Timișoara'),
  description:
    'Prețuri orientative pentru procedurile estetice Maravo Clinic Timișoara, pe categorii. Programează o consultație pentru o ofertă personalizată.',
  path: '/tarife',
})
```

- [ ] **Step 5: Blog list** — `src/app/(frontend)/blog/page.tsx`

```ts
export const metadata = buildMetadata({
  title: defaultMetaTitle('Blog estetică medicală Timișoara'),
  description:
    'Articole, ghiduri și sfaturi despre tratamente estetice și îngrijirea pielii, de la specialiștii Maravo Clinic Timișoara.',
  path: '/blog',
})
```

- [ ] **Step 6: Typecheck**

Run: `pnpm typecheck`
Expected: no output. (If a page still imports `Metadata` only for the removed annotation, delete that unused import.)

- [ ] **Step 7: Commit**

```
git add "src/app/(frontend)/page.tsx" "src/app/(frontend)/proceduri/page.tsx" "src/app/(frontend)/aparatura/page.tsx" "src/app/(frontend)/tarife/page.tsx" "src/app/(frontend)/blog/page.tsx"
git commit -m "fix(seo): self-canonical + local titles on static pages via buildMetadata"
```

---

### Task 4: Dynamic page description fallbacks (city + CTA)

**Files (modify only the `description` assignment inside `generateMetadata`):**
- `src/app/(frontend)/proceduri/[categorie]/page.tsx`
- `src/app/(frontend)/proceduri/[categorie]/[slug]/page.tsx`
- `src/app/(frontend)/aparatura/[slug]/page.tsx`
- `src/app/(frontend)/blog/[slug]/page.tsx`

These pages already set correct per-page canonical + OG. Only their fallback description (when CMS leaves it blank) needs a local, CTA-bearing default.

- [ ] **Step 1: Category** — in `proceduri/[categorie]/page.tsx`, replace lines that read:

```ts
  const description =
    cat.seo?.metaDescription ??
    defaultMetaDescription(
      cat.description ?? `Proceduri ${cat.name} la Maravo Clinic Timișoara.`,
    )
```

with:

```ts
  const description =
    cat.seo?.metaDescription ??
    defaultMetaDescription(
      cat.description?.trim()
        ? cat.description
        : `Proceduri de ${cat.name.toLowerCase()} la Maravo Clinic Timișoara — tehnologie certificată și rezultate naturale. Programează o consultație.`,
    )
```

- [ ] **Step 2: Procedure** — in `proceduri/[categorie]/[slug]/page.tsx`, replace:

```ts
  const description =
    proc.seo?.metaDescription ?? defaultMetaDescription(proc.excerpt)
```

with:

```ts
  const description =
    proc.seo?.metaDescription ??
    defaultMetaDescription(
      proc.excerpt?.trim()
        ? proc.excerpt
        : `${proc.title} la Maravo Clinic Timișoara. Consultație și plan personalizat. Programează-te.`,
    )
```

- [ ] **Step 3: Equipment** — in `aparatura/[slug]/page.tsx`, replace:

```ts
  const description =
    eq.seo?.metaDescription ?? defaultMetaDescription(eq.purpose ?? eq.name)
```

with:

```ts
  const description =
    eq.seo?.metaDescription ??
    defaultMetaDescription(
      eq.purpose?.trim()
        ? eq.purpose
        : `${eq.name} la Maravo Clinic Timișoara — tratamente cu aparatură de ultimă generație.`,
    )
```

- [ ] **Step 4: Blog post** — in `blog/[slug]/page.tsx`, replace:

```ts
  const description =
    post.seo?.metaDescription ??
    defaultMetaDescription(post.excerpt ?? `${post.title} — Maravo Clinic Timișoara.`)
```

with:

```ts
  const description =
    post.seo?.metaDescription ??
    defaultMetaDescription(
      post.excerpt?.trim() ? post.excerpt : `${post.title} — Maravo Clinic Timișoara.`,
    )
```

- [ ] **Step 5: Typecheck**

Run: `pnpm typecheck`
Expected: no output.

- [ ] **Step 6: Commit**

```
git add "src/app/(frontend)/proceduri/[categorie]/page.tsx" "src/app/(frontend)/proceduri/[categorie]/[slug]/page.tsx" "src/app/(frontend)/aparatura/[slug]/page.tsx" "src/app/(frontend)/blog/[slug]/page.tsx"
git commit -m "feat(seo): local, CTA-bearing fallback descriptions on dynamic pages"
```

---

### Task 5: `/despre` — metadata + Dr. Voinescu copy + NAP

**Files:**
- Modify: `src/app/(frontend)/despre/page.tsx`

- [ ] **Step 1: Imports + metadata**

Add imports near the top:

```ts
import { buildMetadata, defaultMetaTitle } from '@/lib/seo'
import { CLINIC } from '@/lib/clinic'
```

Replace the existing `export const metadata: Metadata = { … }` block with:

```ts
export const metadata = buildMetadata({
  title: defaultMetaTitle('Despre — clinică estetică premium Timișoara'),
  description:
    'Maravo Clinic, clinică de estetică medicală premium în Timișoara. Echipă coordonată de Dr. Cristiana Voinescu, tehnologie certificată CE.',
  path: '/despre',
})
```

Remove the now-unused `import type { Metadata } from 'next'` if nothing else needs it.

- [ ] **Step 2: Update the disclaimer comment block**

Replace the comment block (currently starting `EDITABLE STATIC CONTENT (v1)` … ending before `const ABOUT_CONTENT`) with:

```ts
/* ──────────────────────────────────────────────────────────────────────────
 * EDITABLE STATIC CONTENT (v2)
 * Premium copy for Maravo Clinic. Verified facts published on the client's live
 * site (maravoclinic.ro) are used: Dr. Cristiana Voinescu and the clinic NAP
 * (see src/lib/clinic.ts). Doctor credentials are phrased conservatively — no
 * specific certifications are asserted. CMS site-settings still override NAP.
 * ────────────────────────────────────────────────────────────────────────── */
```

- [ ] **Step 3: NAP fallback defaults**

Replace the five `const` NAP lines inside `DesprePage` (`clinicName`…`email`) with:

```ts
  const clinicName = settings?.clinicName ?? CLINIC.name
  const address = settings?.address ?? CLINIC.addressFull
  const phone = settings?.phone ?? process.env.CLINIC_PHONE ?? CLINIC.phone
  const whatsapp = settings?.whatsapp ?? process.env.WHATSAPP_NUMBER ?? CLINIC.whatsapp
  const email = settings?.email ?? CLINIC.email
```

- [ ] **Step 4: Name the doctor (E-E-A-T)**

In the "Echipa medicală" section, replace the existing `<p>…</p>` and the `{/* CLIENT TODO … */}` comment with:

```tsx
        <p>
          Echipa medicală {clinicName} este coordonată de{' '}
          <strong>Dr. Cristiana Voinescu</strong>, alături de personal medical instruit pentru
          fiecare tehnologie pe care o folosim. Fiecare tratament este efectuat sau supervizat de
          medic, după o consultație în care stabilim împreună abordarea potrivită pentru tine.
          Investim constant în formare și în participarea la cursuri și conferințe de profil, pentru
          a aduce cele mai actuale protocoale de estetică medicală în Timișoara.
        </p>
```

- [ ] **Step 5: Typecheck**

Run: `pnpm typecheck`
Expected: no output.

- [ ] **Step 6: Commit**

```
git add "src/app/(frontend)/despre/page.tsx"
git commit -m "feat(seo): /despre — Dr. Voinescu E-E-A-T, real NAP, local metadata"
```

---

### Task 6: `/contact` — metadata + NAP/hours defaults + local lead

**Files:**
- Modify: `src/app/(frontend)/contact/page.tsx`

- [ ] **Step 1: Imports + metadata**

Add imports:

```ts
import { buildMetadata, defaultMetaTitle } from '@/lib/seo'
import { CLINIC } from '@/lib/clinic'
```

Replace the `export const metadata: Metadata = { … }` block with:

```ts
export const metadata = buildMetadata({
  title: defaultMetaTitle('Contact Timișoara'),
  description:
    'Programări și informații Maravo Clinic: Str. Salcâmilor 14–16, Timișoara, +40 775 393 323. Sună, scrie pe WhatsApp sau completează formularul.',
  path: '/contact',
})
```

Keep `import type { Metadata } from 'next'` only if still used elsewhere; otherwise remove.

- [ ] **Step 2: NAP + hours fallback defaults**

Replace the NAP/`hours` `const` block (`clinicName`…`mapsEmbedUrl`) with:

```ts
  const clinicName = settings?.clinicName ?? CLINIC.name
  const address = settings?.address ?? CLINIC.addressFull
  const phone = settings?.phone ?? process.env.CLINIC_PHONE ?? CLINIC.phone
  const whatsapp = settings?.whatsapp ?? process.env.WHATSAPP_NUMBER ?? CLINIC.whatsapp
  const email = settings?.email ?? CLINIC.email
  const hours =
    settings?.hours && settings.hours.length > 0
      ? settings.hours.map((h) => ({ day: h.day ?? '', value: h.value ?? '' }))
      : CLINIC.hours.map((h) => ({ day: h.day, value: h.value }))
  const mapsEmbedUrl = settings?.mapsEmbedUrl ?? ''
```

- [ ] **Step 3: Hours render uses index key**

`CLINIC.hours` items have no `id`. In the hours `.map(...)`, change the row key from `h.id ?? i` to `i`:

```tsx
                {hours.map((h, i) => (
                  <div className="contact-hours__row" key={i}>
                    <dt>{h.day}</dt>
                    <dd>{h.value}</dd>
                  </div>
                ))}
```

- [ ] **Step 4: Add the city to the hero lead**

Replace the hero lead `<p>` text with:

```tsx
        <p className="contact-hero__lead">
          Programări, întrebări sau consultații la Maravo Clinic Timișoara — suntem aici pentru
          tine. Sună-ne, scrie-ne pe WhatsApp sau completează formularul de mai jos.
        </p>
```

- [ ] **Step 5: Typecheck**

Run: `pnpm typecheck`
Expected: no output.

- [ ] **Step 6: Commit**

```
git add "src/app/(frontend)/contact/page.tsx"
git commit -m "feat(seo): /contact — real NAP/hours defaults + local metadata"
```

---

### Task 7: Site-wide NAP fallback (JSON-LD + footer consistency)

**Files:**
- Modify: `src/app/(frontend)/layout.tsx`

The site-wide `MedicalClinic` JSON-LD and the `Footer` both render from the `siteInfo` built in `fetchNavData`. Point its fallbacks at `CLINIC` so the structured data and footer carry the real NAP even before CMS site-settings are populated. No `Footer.tsx` edit is needed (it consumes `siteInfo`).

- [ ] **Step 1: Import CLINIC**

Add to `layout.tsx` imports:

```ts
import { CLINIC } from '@/lib/clinic'
```

- [ ] **Step 2: Real defaults in the success-path `siteInfo`**

In `fetchNavData`, replace the whole `const siteInfo: SiteInfo = { … }` block with the version below. It computes the CMS hours once into `cmsHours`, then falls back to `CLINIC.hours`:

```ts
    const cmsHours = (siteSettingsRaw?.hours ?? []).flatMap((h) =>
      h.day && h.value ? [{ day: h.day, value: h.value }] : [],
    )

    const siteInfo: SiteInfo = {
      clinicName: siteSettingsRaw?.clinicName || CLINIC.name,
      address: siteSettingsRaw?.address || CLINIC.addressFull,
      phone: siteSettingsRaw?.phone || process.env.CLINIC_PHONE || CLINIC.phone,
      whatsapp: siteSettingsRaw?.whatsapp || process.env.WHATSAPP_NUMBER || CLINIC.whatsapp,
      email: siteSettingsRaw?.email || CLINIC.email,
      hours: cmsHours.length > 0 ? cmsHours : CLINIC.hours.map((h) => ({ day: h.day, value: h.value })),
      socials: (siteSettingsRaw?.socials ?? []).flatMap((s) =>
        s.platform && s.url ? [{ platform: s.platform, url: s.url }] : [],
      ),
    }
```

- [ ] **Step 3: Real defaults in the catch-path `siteInfo`**

In the `catch (err)` fallback `return`, replace the `siteInfo` object with:

```ts
      siteInfo: {
        clinicName: CLINIC.name,
        address: CLINIC.addressFull,
        phone: process.env.CLINIC_PHONE || CLINIC.phone,
        whatsapp: process.env.WHATSAPP_NUMBER || CLINIC.whatsapp,
        email: CLINIC.email,
        hours: CLINIC.hours.map((h) => ({ day: h.day, value: h.value })),
        socials: [],
      } satisfies SiteInfo,
```

- [ ] **Step 4: Typecheck**

Run: `pnpm typecheck`
Expected: no output.

- [ ] **Step 5: Commit**

```
git add "src/app/(frontend)/layout.tsx"
git commit -m "feat(seo): real clinic NAP fallback in site-wide JSON-LD + footer"
```

---

### Task 8: E2E guard for the canonical fix (requires running server)

**Files:**
- Create: `tests/e2e/canonical.e2e.spec.ts`

> Prerequisite: the dev server must be reachable (`docker compose up -d db` then `pnpm dev`). Playwright's `webServer` reuses an existing server. If the environment can't run the server, this task may be skipped — the `buildMetadata` unit tests already lock the canonical logic.

- [ ] **Step 1: Write the test**

```ts
// tests/e2e/canonical.e2e.spec.ts
import { test, expect } from '@playwright/test'

const BASE = 'http://localhost:3000'

// Locks the fix for the bug where static pages inherited the homepage canonical.
const STATIC_PAGES = ['/despre', '/contact', '/proceduri', '/aparatura', '/tarife', '/blog']

for (const path of STATIC_PAGES) {
  test(`canonical for ${path} is self-referential, not the homepage`, async ({ page }) => {
    await page.goto(`${BASE}${path}`)
    const href = await page.locator('link[rel="canonical"]').getAttribute('href')
    expect(href, `canonical missing on ${path}`).toBeTruthy()
    expect(href!.endsWith(path), `canonical for ${path} was ${href}`).toBe(true)
  })
}
```

- [ ] **Step 2: Run it**

Run: `pnpm test:e2e -- canonical.e2e.spec.ts`
Expected: PASS (6 tests). If pages 500 due to DB, start the DB first.

- [ ] **Step 3: Commit**

```
git add tests/e2e/canonical.e2e.spec.ts
git commit -m "test(seo): e2e canonical guard for static pages"
```

---

## Final verification

- [ ] `pnpm typecheck` — clean.
- [ ] `pnpm exec cross-env NODE_OPTIONS=--no-deprecation vitest run tests/unit` — all unit tests pass.
- [ ] (If server available) `pnpm test:e2e` — homepage, bodymap, and canonical specs pass.
- [ ] Spot-check rendered `<head>` on `/despre` and `/contact`: unique title, ≤155 description, `link[rel=canonical]` self-referential, OG url matches.

## Spec coverage map

- Canonical bug (spec §3) → Task 3 (+ Task 8 guard).
- `clinic.ts` (spec §4.1) → Task 1; consumed in Tasks 5, 6, 7.
- `buildMetadata` (spec §4.2) → Task 2; used in Tasks 3, 5, 6.
- Dynamic description localization (spec §4.3, §5) → Task 4.
- Per-page strings (spec §5) → Tasks 3 (static), 4 (dynamic), 5, 6.
- Despre/Contact copy + NAP (spec §6) → Tasks 5, 6.
- NAP consistency in JSON-LD/footer (spec §4.1, §9) → Task 7.
- Testing (spec §7) → Tasks 1, 2 (unit), Task 8 (e2e).
