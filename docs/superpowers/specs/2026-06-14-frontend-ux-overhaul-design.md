# Maravo Clinic — Frontend Design & UX Overhaul

**Date:** 2026-06-14
**Status:** Approved (design) — pending implementation plan
**Author:** UX/UI pass

## Context

Maravo Clinic is a premium aesthetic-medicine clinic in Timișoara. The site is
**Next.js 16 (App Router) + Payload 3 CMS**, with a luxury espresso/gold/cream
design system already established in `src/styles/tokens.css` (~1,750 lines) and a
strong SEO/JSON-LD foundation (`src/lib/seo.ts`, per-page metadata, breadcrumb /
MedicalClinic / Procedure / FAQ schema).

This overhaul addresses seven areas where the frontend looks unfinished, empty,
or unstyled, and raises the whole site to an award-quality, **SEO-first /
mobile-first** standard.

### Confirmed decisions (from brainstorming)

- **Scope:** plan only first — write this spec + an implementation plan, then implement.
- **Hero:** abstract animated **gold-on-espresso** mesh + floating favicon monogram (no photo).
- **`image00018`** (from `/media`) is used as the **Despre / About** imagery (not hero).
- **Content:** premium Romanian copy + chosen images **baked into components as
  defaults** (the existing `despre/page.tsx` + `lib/clinic.ts` pattern), CMS-overridable.
- **Motion:** subtle & tasteful, CSS-driven, always behind `prefers-reduced-motion`.

## Design principles (apply to every area)

1. **Mobile-first** — design at 360px first; enhance at the existing
   `640 / 768 / 1024`px breakpoints. No new breakpoint system.
2. **SEO-first** — preserve all existing metadata/JSON-LD; add semantic headings,
   descriptive `alt` text, and internal links. Reserve image dimensions to avoid
   CLS; keep LCP element (hero copy) lightweight.
3. **Subtle, accessible motion** — extend the existing `FadeUp` / `.fade-up`
   pattern plus CSS hover/parallax. Every animation wrapped in
   `@media (prefers-reduced-motion: reduce)` with a static fallback.
4. **One new dependency** — `react-icons` (tree-shakeable). Used for procedure
   pictograms, equipment specs, value-pillar icons, social icons, WhatsApp.
5. **Content as code defaults** — follow `lib/clinic.ts` + `ABOUT_CONTENT`
   pattern: typed default constants, overridable by CMS where a CMS field exists.
6. **Reuse the design system** — new components consume existing CSS tokens
   (`--gold`, `--charcoal`, `--cream`, etc.) and font variables; no new color/font system.

## Area 1 — Homepage

### 1a. Hero background (`components/home/Hero.tsx`, `.hero-bg-art`)
Replace the flat radial gradient with an **animated gold-on-espresso mesh**:
- 2–3 drifting radial-gradient "blobs" in gold/taupe over `--charcoal`, animated
  via CSS `@keyframes` using GPU-friendly `transform`/`opacity` only.
- A large, faint **favicon-monogram** (`/favicon.webp`) watermark, slowly
  floating/rotating at low opacity as a brand motif.
- Fine gold grain + vignette for depth.
- Copy, CTAs, and the `19+ proceduri` badge keep their current structure/markup.
- `prefers-reduced-motion` → static gradient, no animation, monogram fixed.

### 1b. Fill the empty / CTA-less sections
Homepage sections that currently render blank when CMS globals are empty get
**baked defaults** so the page is never visually empty:
- **`Stats.tsx`** — default animated counters (e.g. ani de experiență, proceduri
  avansate, paciente mulțumite). Counters animate on scroll into view.
- **`Marquee.tsx`** — default brand/technology terms (Lutronic Clarity II, HIFU,
  acid hialuronic, etc.).
- **`AboutTeaser.tsx`** — real "Despre Maravo Clinic" RO copy + **`image00018`**
  framed with gold corner accents.
- **New `TrustStrip.tsx`** — a "De ce Maravo" band of 4 icon pillars (siguranță
  medicală, tehnologie certificată CE, rezultate naturale, medic dedicat),
  inserted between Equipment and Stats, ending with a soft CTA. Fills white space
  with a concrete value proposition.
- Existing `BookingCTA` remains the page closer.

## Area 2 — Header (`components/layout/Header.tsx`)
- Remove the `.nav-wordmark` block (`MARAVO` + `Clinic · Timișoara`) entirely →
  **logo-only** navbar.
- Increase logo display height 40 → 44px for presence; adjust `.nav-logo` spacing
  in `tokens.css`.
- Mirror in the mobile drawer header (`MobileMenu.tsx` / `.mob-header`) so the
  brand treatment is consistent.
- Logo retains `alt="Maravo Clinic"` and links home (accessibility/SEO unaffected).

## Area 3 — Procedure detail template (`proceduri/[categorie]/[slug]/page.tsx`)

This is the largest visual gap: the template renders every admin field
(`whatIsIt`, `whoIsItFor`, `benefits[]`, `howItWorks`, `resultsText`,
`indications`, `contraindications`, `priceFrom/priceNote`, `faq[]`,
`relatedEquipment`, `relatedProcedures`, `meta` pictograms, `invasiveness`) but
`.proc-section`, `.proc-benefits`, `.proc-price`, `.proc-detail__hero/__title`,
`.proc-grid`, and `.equip-grid` have **no CSS** — so it reads as raw full-bleed text.

### Admin → frontend mapping (data already exists, needs presentation)
| Admin field (Procedures collection) | Frontend treatment |
|---|---|
| `title`, `excerpt` | Styled hero header (max-width container) |
| `meta.duration/painLevel/painLabel/results/recovery` | Pictogram row (already styled) in a sticky info rail |
| `meta.invasiveness` | Invasiveness badge (already styled) in info rail |
| `priceFrom`, `priceNote` | "Preț de la" card in info rail |
| `whatIsIt`, `whoIsItFor`, `howItWorks`, `resultsText` | Sectioned rich-text with gold-accent icon headings |
| `benefits[]` | Icon-checklist cards (not a plain `<ul>`) |
| `howItWorks` | Optional numbered step-timeline styling |
| `indications`, `contraindications` | ✓ / ✕ icon-tagged callout cards |
| `faq[]` | Restyled accordion |
| `relatedEquipment`, `relatedProcedures` | Real card grids (`equip-grid` / `proc-grid` styled) |

### Layout
- **Desktop (≥1024px):** two columns — a **sticky info rail** (pictograms,
  invasiveness, price-from, CTA) beside the scrolling content column.
- **Mobile:** single column, info rail collapses to a compact summary card under
  the hero; sticky bottom CTA optional.
- Content constrained to a readable max-width; section headings get a gold
  left-accent + `react-icons` glyph; generous vertical rhythm.

## Area 4 — Equipment detail template (`aparatura/[slug]/page.tsx`)
Already partly styled but flat. Bring to the same standard:
- Hero with a **manufacturer chip**.
- Main photo framed (gold accent); gallery as a tidy responsive grid with
  hover-zoom (no heavy lightbox).
- "Pentru ce este" / description as **icon-tagged cards**.
- "Proceduri asociate" → styled `proc-grid` card grid (interlink for SEO).
- Strong closing CTA.
- **Listing page** (`aparatura/page.tsx`) cards: hover elevation + manufacturer badge.

## Area 5 — Despre noi (`despre/page.tsx`)
Currently text-only, cramped at `max-width: 820px`, no images/icons/motion.
- **Hero** using `image00018` (or another `/media` pick) with the section tag + title.
- **Value cards** (the 4 existing values) get `react-icons` glyphs + `FadeUp` motion.
- **Dr. Cristiana Voinescu E-E-A-T block** — portrait + conservative credential
  phrasing (no fabricated certifications), reinforcing trust/authorship.
- **Technology strip** — visual treatment of the equipment portfolio list.
- **NAP card** styled, with map (shares the contact map embed).
- Editorial rhythm: alternating image/text rows; widen beyond 820px where it reads better.

## Area 6 — Blog (`blog/page.tsx`)
- Wrap `.blog-page__hero` and `.blog-page__body` in the **same max-width
  container** used elsewhere → fixes the width mismatch / "half page" feel.
- Consistent card gutters; improved empty state.
- Optional: feature the most recent post larger at the top of the grid.

## Area 7 — Contact (`contact/page.tsx`) + sitewide

### Real data (into `lib/clinic.ts` defaults, CMS-overridable)
- Address: **Strada Salcâmilor 14-16, 300756 Timișoara** (already present).
- Phone: **0775 393 323** (already `+40 775 393 323`).
- **Socials** (add to `CLINIC` defaults + surface in layout `siteInfo.socials`):
  - Facebook: `https://www.facebook.com/DrCristianaVoinescu/`
  - Instagram: `https://www.instagram.com/maravo_clinic`
  - TikTok: `https://www.tiktok.com/@maravoclinic`

### Map
- Add a **Google Maps embed fallback** for the clinic address so the map renders
  even when `site-settings.mapsEmbedUrl` is empty (currently shows a placeholder).
- Embed appears on both Contact and the Despre NAP card.

### Socials rendering
- Replace plain-text platform labels in `Footer.tsx` (and add to Contact) with
  real **`react-icons`** brand icons (`FaFacebookF`, `FaInstagram`, `FaTiktok`),
  each with `aria-label`, `target="_blank"`, `rel="noopener noreferrer"`.

### Floating WhatsApp button (sitewide)
- **New `components/ui/WhatsAppFab.tsx`**, mounted in `(frontend)/layout.tsx`.
- **Bottom-left**, fixed, above content; `react-icons` `FaWhatsapp`.
- `wa.me` deep link using the clinic WhatsApp number; `aria-label`.
- Subtle pulse, disabled under `prefers-reduced-motion`.
- Does not overlap the mobile menu / sticky CTA; safe-area-inset aware.

## New / changed files (high level)

**New components**
- `components/home/TrustStrip.tsx`
- `components/ui/WhatsAppFab.tsx`
- `components/ui/SocialIcons.tsx`

**Modified components/pages**
- `components/home/Hero.tsx`, `Stats.tsx`, `Marquee.tsx`, `AboutTeaser.tsx`
- `components/layout/Header.tsx`, `MobileMenu.tsx`, `Footer.tsx`
- `components/procedure/*` cards (ProcedureCard, EquipmentCard, FaqAccordion, PictogramRow as needed)
- `app/(frontend)/layout.tsx` (mount WhatsAppFab)
- `app/(frontend)/proceduri/[categorie]/[slug]/page.tsx`
- `app/(frontend)/aparatura/[slug]/page.tsx`, `aparatura/page.tsx`
- `app/(frontend)/despre/page.tsx`
- `app/(frontend)/blog/page.tsx`
- `app/(frontend)/contact/page.tsx`
- `app/(frontend)/page.tsx` (insert TrustStrip)

**Lib / data**
- `lib/clinic.ts` — add `socials`, add `mapsEmbedUrl` default.

**Styles**
- `styles/tokens.css` — substantial additions: procedure detail layout + sections,
  equipment detail polish, despre editorial layout, blog container, hero mesh
  animation, trust strip, WhatsApp FAB, social icons, header logo-only adjustments.

**Dependencies**
- Add `react-icons`.

## Out of scope
- No CMS schema changes beyond optional convenience (content is baked as code defaults).
- No new color palette or font system.
- No redesign of the admin (`/admin`) UI itself.
- No new blog/post content authoring (layout only).

## Risks & mitigations
- **CWV / LCP** — hero animation is CSS-only and GPU-friendly; monogram is a small
  webp; counters/parallax are passive. Verify Lighthouse after build.
- **Accessibility** — all motion behind `prefers-reduced-motion`; icons get labels;
  color contrast uses the existing AA-safe tokens (`--text-muted-light`,
  `--gold-light-bg`, etc.).
- **react-icons bundle** — import individual icons only; verify no large barrel imports.
- **Map embed** — use a privacy-respectful embed; `loading="lazy"`.

## Verification (when implemented)
- `pnpm typecheck`, `pnpm lint`, `pnpm build` clean.
- Existing Playwright/Vitest suites pass (canonical/SEO e2e guards remain green).
- Manual mobile (360px) + desktop pass per area.
- Lighthouse: performance/SEO/accessibility not regressed.
