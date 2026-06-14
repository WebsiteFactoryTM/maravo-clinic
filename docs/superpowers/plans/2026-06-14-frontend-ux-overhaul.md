# Frontend UX Overhaul Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Raise the Maravo Clinic frontend to award-quality, SEO-first / mobile-first standard across 7 areas: animated hero, logo-only header, procedure & equipment detail templates, Despre, Blog width, Contact (NAP/map/socials), and a sitewide floating WhatsApp button.

**Architecture:** Next.js 16 App Router + Payload 3. All visual work consumes the existing espresso/gold/cream token system in `src/styles/tokens.css`. Premium Romanian copy and chosen `/media` images are baked into components as typed defaults (the existing `lib/clinic.ts` + `despre/page.tsx` pattern), CMS-overridable. Motion is CSS-driven and always gated behind `prefers-reduced-motion`. One new dependency: `react-icons`.

**Tech Stack:** Next.js 16, React 19, Payload 3, Tailwind v4 (`@theme` + tokens.css), TypeScript, Playwright (e2e), Vitest (int), `react-icons`.

**Reference spec:** `docs/superpowers/specs/2026-06-14-frontend-ux-overhaul-design.md`

**Conventions:**
- Package manager is **pnpm**. Dev server: `pnpm dev`. Verify: `pnpm typecheck`, `pnpm lint`, `pnpm build`.
- e2e: `pnpm test:e2e`. int: `pnpm test:int`.
- Commit after every task. Work happens on the `master` branch (matches repo history).
- For purely visual CSS, "verification" = `pnpm typecheck && pnpm lint && pnpm build` clean **plus** the targeted Playwright assertion in that task (element presence / no axe regressions). Strict unit-TDD is not meaningful for CSS; presence + build is the contract.

---

## File Structure (decomposition)

**New files**
- `src/components/ui/SocialIcons.tsx` — maps a social platform string → `react-icons` brand icon link. Single responsibility: render one social link list.
- `src/components/ui/WhatsAppFab.tsx` — sitewide fixed bottom-left WhatsApp floating button.
- `src/components/home/TrustStrip.tsx` — homepage "De ce Maravo" 4-pillar icon band.
- `tests/e2e/ux-overhaul.spec.ts` — presence/a11y guards for the new sitewide elements.

**Modified files**
- `src/lib/clinic.ts` — add `socials[]` and `mapsEmbedUrl` defaults.
- `src/app/(frontend)/layout.tsx` — surface `CLINIC.socials` fallback; mount `WhatsAppFab`.
- `src/components/layout/Header.tsx` — remove wordmark (logo only).
- `src/components/layout/MobileMenu.tsx` — drawer header logo-only consistency.
- `src/components/layout/Footer.tsx` — socials via `SocialIcons`.
- `src/components/home/Hero.tsx` — animated mesh + monogram markup hooks.
- `src/components/home/Stats.tsx`, `Marquee.tsx`, `AboutTeaser.tsx` — baked defaults + `image00018`.
- `src/app/(frontend)/page.tsx` — insert `TrustStrip`.
- `src/app/(frontend)/proceduri/[categorie]/[slug]/page.tsx` — sticky info-rail layout wrappers.
- `src/app/(frontend)/aparatura/[slug]/page.tsx`, `aparatura/page.tsx` — polish.
- `src/app/(frontend)/despre/page.tsx` — image hero, icon values, doctor block, motion.
- `src/app/(frontend)/blog/page.tsx` — max-width container.
- `src/app/(frontend)/contact/page.tsx` — map embed fallback + socials.
- `src/styles/tokens.css` — substantial CSS additions (every visual task adds here).

**Media:** ensure `image00018` is available to the app. The frontend reads images via the `/public` folder or CMS media URLs. `image00018.jpeg` currently lives in `/media` (a seed source, not web-served). **Task 0 copies the needed stills into `/public/img/`** so components can reference `/img/about.jpg` etc. (Static import keeps it CMS-independent, matching the "baked defaults" decision.)

---

## Task 0: Foundation — dependency, media, clinic defaults

**Files:**
- Modify: `package.json` (via pnpm add)
- Create: `public/img/about.jpg` (copied from `media/image00018.jpeg`)
- Modify: `src/lib/clinic.ts`

- [ ] **Step 1: Install react-icons**

Run:
```bash
pnpm add react-icons
```
Expected: `react-icons` appears in `package.json` dependencies; install succeeds.

- [ ] **Step 2: Copy the About still into public**

Run (Git Bash):
```bash
mkdir -p public/img
cp media/image00018.jpeg public/img/about.jpg
```
Expected: `public/img/about.jpg` exists.

- [ ] **Step 3: Add socials + map embed default to `clinic.ts`**

In `src/lib/clinic.ts`, inside the `CLINIC` object (after `email`), add:

```ts
  socials: [
    { platform: 'facebook', url: 'https://www.facebook.com/DrCristianaVoinescu/' },
    { platform: 'instagram', url: 'https://www.instagram.com/maravo_clinic' },
    { platform: 'tiktok', url: 'https://www.tiktok.com/@maravoclinic' },
  ],
  // Keyless Google Maps embed for the clinic address (no API key required).
  mapsEmbedUrl:
    'https://www.google.com/maps?q=Strada+Salc%C3%A2milor+14-16,+300756+Timi%C8%99oara&output=embed',
```

- [ ] **Step 4: Verify build still compiles**

Run:
```bash
pnpm typecheck
```
Expected: no errors (the new `CLINIC` fields are typed via `as const`).

- [ ] **Step 5: Commit**

```bash
git add package.json pnpm-lock.yaml public/img/about.jpg src/lib/clinic.ts
git commit -m "chore(ui): add react-icons, About still, clinic socials + map default

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 1: Header — logo only

**Files:**
- Modify: `src/components/layout/Header.tsx:84-97`
- Modify: `src/styles/tokens.css` (`.nav-logo`, remove `.nav-wordmark` reliance)
- Test: `tests/e2e/ux-overhaul.spec.ts`

- [ ] **Step 1: Write the failing e2e test**

Create `tests/e2e/ux-overhaul.spec.ts`:

```ts
import { test, expect } from '@playwright/test'

test.describe('UX overhaul — sitewide', () => {
  test('header shows logo only, no wordmark text', async ({ page }) => {
    await page.goto('/')
    const logo = page.locator('a.nav-logo img')
    await expect(logo).toBeVisible()
    // The "Clinic · Timișoara" wordmark must be gone.
    await expect(page.locator('.nav-wordmark')).toHaveCount(0)
  })
})
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm test:e2e -- ux-overhaul.spec.ts`
Expected: FAIL — `.nav-wordmark` still has count 1.

- [ ] **Step 3: Remove the wordmark in Header.tsx**

Replace the logo block (`Header.tsx` lines ~84-97) with:

```tsx
        {/* Logo — intrinsic 1959×1980 (≈1:1); display height via inline style */}
        <a href="/" className="nav-logo" aria-label="Maravo Clinic — Acasă">
          <Image
            src="/logo-gold.png"
            alt="Maravo Clinic"
            width={1959}
            height={1980}
            style={{ height: '44px', width: 'auto' }}
            priority
          />
        </a>
```

- [ ] **Step 4: Tidy the logo spacing in tokens.css**

In `src/styles/tokens.css`, update `.nav-logo` (line ~64) — drop the wordmark gap:

```css
.nav-logo { display: flex; align-items: center; z-index: 201; }
.nav-logo img { height: 44px; }
```

(Leave the now-unused `.nav-wordmark*` rules in place or delete them — they no longer render. Deleting is preferred: remove the `.nav-wordmark`, `#navbar.scrolled .nav-wordmark`, and `#navbar.scrolled .nav-wordmark small` rules.)

- [ ] **Step 5: Run the test to verify it passes**

Run: `pnpm test:e2e -- ux-overhaul.spec.ts`
Expected: PASS.

- [ ] **Step 6: Verify build**

Run: `pnpm typecheck && pnpm lint`
Expected: clean.

- [ ] **Step 7: Commit**

```bash
git add src/components/layout/Header.tsx src/styles/tokens.css tests/e2e/ux-overhaul.spec.ts
git commit -m "feat(header): logo-only navbar, remove wordmark

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 2: Social icons + sitewide floating WhatsApp button

**Files:**
- Create: `src/components/ui/SocialIcons.tsx`
- Create: `src/components/ui/WhatsAppFab.tsx`
- Modify: `src/components/layout/Footer.tsx:103-119`
- Modify: `src/app/(frontend)/layout.tsx` (surface socials fallback + mount FAB)
- Modify: `src/styles/tokens.css` (`.social-icons`, `.wa-fab`)
- Test: `tests/e2e/ux-overhaul.spec.ts`

- [ ] **Step 1: Create `SocialIcons.tsx`**

```tsx
import React from 'react'
import { FaFacebookF, FaInstagram, FaTiktok } from 'react-icons/fa6'

export interface SocialLink {
  platform: string
  url: string
}

const ICONS: Record<string, { Icon: React.ComponentType; label: string }> = {
  facebook: { Icon: FaFacebookF, label: 'Facebook' },
  instagram: { Icon: FaInstagram, label: 'Instagram' },
  tiktok: { Icon: FaTiktok, label: 'TikTok' },
}

export default function SocialIcons({
  socials,
  className = '',
}: {
  socials: SocialLink[]
  className?: string
}) {
  if (!socials || socials.length === 0) return null
  return (
    <div className={`social-icons ${className}`.trim()}>
      {socials.map((s) => {
        const entry = ICONS[s.platform.toLowerCase()]
        if (!entry) return null
        const { Icon, label } = entry
        return (
          <a
            key={s.platform}
            href={s.url}
            target="_blank"
            rel="noopener noreferrer"
            className="social-icons__link"
            aria-label={label}
          >
            <Icon />
          </a>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 2: Create `WhatsAppFab.tsx`**

```tsx
import React from 'react'
import { FaWhatsapp } from 'react-icons/fa6'

export default function WhatsAppFab({
  whatsapp,
  message = 'Bună ziua! Aș dori o programare la Maravo Clinic.',
}: {
  whatsapp?: string | null
  message?: string
}) {
  if (!whatsapp) return null
  const number = whatsapp.replace(/[^\d]/g, '')
  if (!number) return null
  const href = `https://wa.me/${number}?text=${encodeURIComponent(message)}`
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="wa-fab"
      aria-label="Scrie-ne pe WhatsApp"
    >
      <FaWhatsapp aria-hidden="true" />
    </a>
  )
}
```

- [ ] **Step 3: Add CSS for both to `tokens.css`**

Append to `src/styles/tokens.css`:

```css
/* ── SOCIAL ICONS ── */
.social-icons { display: flex; gap: 14px; align-items: center; }
.social-icons__link {
  display: inline-flex; align-items: center; justify-content: center;
  width: 38px; height: 38px; border-radius: 50%;
  border: 1px solid var(--taupe); color: var(--charcoal);
  font-size: 16px; transition: color 0.25s, border-color 0.25s, background 0.25s, transform 0.25s;
}
.social-icons__link:hover { color: var(--cream); background: var(--gold); border-color: var(--gold); transform: translateY(-2px); }

/* ── FLOATING WHATSAPP BUTTON (bottom-left, sitewide) ── */
.wa-fab {
  position: fixed; left: 18px; bottom: calc(18px + env(safe-area-inset-bottom, 0px));
  z-index: 195; width: 56px; height: 56px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  background: #25D366; color: #fff; font-size: 30px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.22);
  transition: transform 0.25s, box-shadow 0.25s;
}
.wa-fab:hover { transform: scale(1.06); box-shadow: 0 10px 30px rgba(0,0,0,0.28); }
.wa-fab::before {
  content: ''; position: absolute; inset: 0; border-radius: 50%;
  border: 2px solid #25D366; animation: wa-pulse 2.4s ease-out infinite;
}
@keyframes wa-pulse {
  0% { transform: scale(1); opacity: 0.6; }
  100% { transform: scale(1.6); opacity: 0; }
}
@media (prefers-reduced-motion: reduce) {
  .wa-fab::before { animation: none; display: none; }
  .wa-fab { transition: none; }
}
@media (min-width: 768px) { .wa-fab { width: 60px; height: 60px; font-size: 33px; left: 24px; bottom: 24px; } }
```

- [ ] **Step 4: Wire Footer to use `SocialIcons`**

In `src/components/layout/Footer.tsx`, replace the socials block (lines ~103-119) with:

```tsx
        {/* Socials */}
        <SocialIcons socials={siteInfo.socials} className="footer-socials" />
```

And add the import at the top:
```tsx
import SocialIcons from '@/components/ui/SocialIcons'
```

- [ ] **Step 5: Surface socials fallback + mount FAB in layout**

In `src/app/(frontend)/layout.tsx`:

(a) In `fetchNavData`, change the `socials` line in the success `siteInfo` (line ~161) so it falls back to clinic defaults when CMS is empty:

```tsx
      socials:
        (siteSettingsRaw?.socials ?? []).flatMap((s) =>
          s.platform && s.url ? [{ platform: s.platform, url: s.url }] : [],
        ).length > 0
          ? (siteSettingsRaw!.socials ?? []).flatMap((s) =>
              s.platform && s.url ? [{ platform: s.platform, url: s.url }] : [],
            )
          : CLINIC.socials.map((s) => ({ platform: s.platform, url: s.url })),
```

(b) In the error-fallback `siteInfo` (line ~220), change `socials: []` to:
```tsx
        socials: CLINIC.socials.map((s) => ({ platform: s.platform, url: s.url })),
```

(c) Import and mount the FAB. Add import:
```tsx
import WhatsAppFab from '@/components/ui/WhatsAppFab'
```
and render it just before `<Footer ... />`:
```tsx
        <WhatsAppFab whatsapp={siteInfo.whatsapp} />
```

- [ ] **Step 6: Add the e2e assertions**

Append to `tests/e2e/ux-overhaul.spec.ts` inside the describe block:

```ts
  test('floating WhatsApp button is present and links to wa.me', async ({ page }) => {
    await page.goto('/')
    const fab = page.locator('a.wa-fab')
    await expect(fab).toBeVisible()
    await expect(fab).toHaveAttribute('href', /wa\.me\/40775393323/)
    await expect(fab).toHaveAttribute('aria-label', /WhatsApp/i)
  })

  test('footer renders social icon links', async ({ page }) => {
    await page.goto('/')
    const fb = page.locator('.footer-socials a[aria-label="Facebook"]')
    await expect(fb).toHaveAttribute('href', /facebook\.com\/DrCristianaVoinescu/)
    await expect(page.locator('.footer-socials a[aria-label="Instagram"]')).toBeVisible()
    await expect(page.locator('.footer-socials a[aria-label="TikTok"]')).toBeVisible()
  })
```

- [ ] **Step 7: Run e2e**

Run: `pnpm test:e2e -- ux-overhaul.spec.ts`
Expected: PASS (all 3+ tests).

- [ ] **Step 8: Verify build**

Run: `pnpm typecheck && pnpm lint`
Expected: clean.

- [ ] **Step 9: Commit**

```bash
git add src/components/ui/SocialIcons.tsx src/components/ui/WhatsAppFab.tsx src/components/layout/Footer.tsx src/app/\(frontend\)/layout.tsx src/styles/tokens.css tests/e2e/ux-overhaul.spec.ts
git commit -m "feat(ui): social icon links + sitewide floating WhatsApp button

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 3: Contact — map embed fallback + socials

**Files:**
- Modify: `src/app/(frontend)/contact/page.tsx:39,154-169`
- Modify: `src/styles/tokens.css` (`.contact-socials`)
- Test: `tests/e2e/ux-overhaul.spec.ts`

- [ ] **Step 1: Map fallback + socials in contact page**

In `src/app/(frontend)/contact/page.tsx`:

(a) Import clinic + SocialIcons at top:
```tsx
import SocialIcons from '@/components/ui/SocialIcons'
```
(`CLINIC` is already imported.)

(b) Change the `mapsEmbedUrl` resolution (line ~39) to fall back to the clinic default:
```tsx
  const mapsEmbedUrl = settings?.mapsEmbedUrl ?? CLINIC.mapsEmbedUrl
```

(c) Add a socials block inside `.contact-info`, right after the hours `</div>` and before the `.contact-cta` block (~line 147):
```tsx
          <div className="contact-socials">
            <h3 className="contact-hours__title">Urmărește-ne</h3>
            <SocialIcons socials={CLINIC.socials.map((s) => ({ platform: s.platform, url: s.url }))} />
          </div>
```

(The `mapsEmbedUrl` is now always truthy, so the existing `mapsEmbedUrl ? <iframe> : <placeholder>` will always render the iframe.)

- [ ] **Step 2: Add `.contact-socials` spacing CSS**

Append to `tokens.css`:
```css
.contact-socials { margin-top: 24px; }
```

- [ ] **Step 3: Add e2e assertion**

Append to `tests/e2e/ux-overhaul.spec.ts`:
```ts
  test('contact page shows a map embed and socials', async ({ page }) => {
    await page.goto('/contact')
    await expect(page.locator('iframe.contact-map__frame')).toHaveCount(1)
    await expect(page.locator('.contact-socials a[aria-label="Instagram"]')).toBeVisible()
  })
```

- [ ] **Step 4: Run e2e + build**

Run: `pnpm test:e2e -- ux-overhaul.spec.ts && pnpm typecheck && pnpm lint`
Expected: PASS / clean.

- [ ] **Step 5: Commit**

```bash
git add src/app/\(frontend\)/contact/page.tsx src/styles/tokens.css tests/e2e/ux-overhaul.spec.ts
git commit -m "feat(contact): map embed fallback + social icon links

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 4: Hero — animated gold-on-espresso mesh + monogram

**Files:**
- Modify: `src/components/home/Hero.tsx:33-35`
- Modify: `src/styles/tokens.css` (`.hero-bg-art` and new mesh/monogram rules)

- [ ] **Step 1: Add monogram + mesh layers to Hero markup**

In `src/components/home/Hero.tsx`, replace the single `hero-bg-art` div (line ~34) with:

```tsx
      <div className="hero-bg-art" aria-hidden="true">
        <span className="hero-blob hero-blob--1" />
        <span className="hero-blob hero-blob--2" />
        <span className="hero-blob hero-blob--3" />
        <span
          className="hero-monogram"
          style={{ backgroundImage: 'url(/favicon.webp)' }}
        />
        <span className="hero-grain" />
      </div>
```

- [ ] **Step 2: Replace `.hero-bg-art` CSS with the animated mesh**

In `src/styles/tokens.css`, replace the `.hero-bg-art { ... }` rule (lines ~197-201) with:

```css
.hero-bg-art { position: absolute; inset: 0; overflow: hidden; }
.hero-blob {
  position: absolute; border-radius: 50%; filter: blur(60px); opacity: 0.5;
  will-change: transform;
}
.hero-blob--1 {
  width: 56vw; height: 56vw; top: -10%; right: -6%;
  background: radial-gradient(circle, rgba(201,169,110,0.30), transparent 70%);
  animation: hero-drift-1 18s ease-in-out infinite alternate;
}
.hero-blob--2 {
  width: 48vw; height: 48vw; bottom: -12%; left: -10%;
  background: radial-gradient(circle, rgba(210,187,163,0.20), transparent 70%);
  animation: hero-drift-2 22s ease-in-out infinite alternate;
}
.hero-blob--3 {
  width: 30vw; height: 30vw; top: 30%; left: 35%;
  background: radial-gradient(circle, rgba(168,133,74,0.18), transparent 70%);
  animation: hero-drift-3 26s ease-in-out infinite alternate;
}
.hero-monogram {
  position: absolute; top: 50%; left: 60%; transform: translate(-50%, -50%);
  width: min(70vw, 560px); aspect-ratio: 1; opacity: 0.05;
  background-size: contain; background-repeat: no-repeat; background-position: center;
  animation: hero-mono 40s linear infinite; will-change: transform;
}
.hero-grain {
  position: absolute; inset: 0;
  background: radial-gradient(ellipse at 50% 120%, rgba(0,0,0,0.45), transparent 60%);
  mix-blend-mode: multiply;
}
@keyframes hero-drift-1 { from { transform: translate(0,0); } to { transform: translate(-6%, 5%); } }
@keyframes hero-drift-2 { from { transform: translate(0,0); } to { transform: translate(7%, -4%); } }
@keyframes hero-drift-3 { from { transform: translate(0,0) scale(1); } to { transform: translate(-4%, -6%) scale(1.1); } }
@keyframes hero-mono { from { transform: translate(-50%,-50%) rotate(0deg); } to { transform: translate(-50%,-50%) rotate(360deg); } }
@media (prefers-reduced-motion: reduce) {
  .hero-blob, .hero-monogram { animation: none; }
}
```

- [ ] **Step 3: Verify build + dev visual**

Run: `pnpm build`
Expected: build succeeds. Then `pnpm dev`, open `/`, confirm the hero shows a warm animated gold mesh + faint rotating monogram, copy remains crisp/readable. Toggle OS "reduce motion" → animation stops.

- [ ] **Step 4: Commit**

```bash
git add src/components/home/Hero.tsx src/styles/tokens.css
git commit -m "feat(home): animated gold-on-espresso hero mesh + monogram motif

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 5: Homepage — fill empty sections (defaults, image, TrustStrip)

**Files:**
- Modify: `src/components/home/Stats.tsx`, `Marquee.tsx`, `AboutTeaser.tsx`
- Create: `src/components/home/TrustStrip.tsx`
- Modify: `src/app/(frontend)/page.tsx`
- Modify: `src/styles/tokens.css` (`.trust-strip`)

> **Pre-step:** read the current `Stats.tsx`, `Marquee.tsx`, `AboutTeaser.tsx` to learn their prop shapes before editing (they accept CMS props that may be empty). Apply defaults with the same `??` fallback style used in `Hero.tsx`.

- [ ] **Step 1: Add baked defaults to Stats, Marquee, AboutTeaser**

For each component, when the incoming prop array/field is empty, fall back to a typed default constant. Concretely:

`Stats.tsx` — when `stats` is empty, use:
```tsx
const DEFAULT_STATS = [
  { value: '19+', label: 'Proceduri avansate' },
  { value: '7', label: 'Tehnologii medicale' },
  { value: '100%', label: 'Aparatură certificată CE' },
  { value: '1:1', label: 'Consultație personalizată' },
]
```
Use `const data = stats && stats.length > 0 ? stats : DEFAULT_STATS`. (Match the existing field names the component reads — adjust `value`/`label` keys to whatever the component already destructures.)

`Marquee.tsx` — when `items` is empty, use:
```tsx
const DEFAULT_MARQUEE = [
  'Lutronic Clarity II', 'HIFU Lifting', 'Acid hialuronic', 'Toxină botulinică',
  'Radiofrecvență', 'Mezoterapie', 'HydraFacial', 'Epilare definitivă',
]
```

`AboutTeaser.tsx` — when `heading`/`body`/`image` are empty, fall back to:
```tsx
const heading = props.heading ?? 'O clinică unde medicina întâlnește estetica'
const body = props.body ??
  'La Maravo Clinic îmbinăm rigoarea medicală cu un simț estetic rafinat. ' +
  'Fiecare tratament pornește de la o consultație atentă și un plan construit pentru tine — ' +
  'rezultate naturale, siguranță și o experiență discretă, premium.'
```
For the image, if no CMS image, render `next/image` with `src="/img/about.jpg"`, `width={720} height={900}`, `alt="Interior Maravo Clinic Timișoara"`. Wrap it in the existing about-visual frame class and add gold corner accents (CSS already supports `.about-visual`; if not, add a `.about-visual__frame` with `::before/::after` gold corners).

- [ ] **Step 2: Create `TrustStrip.tsx`**

```tsx
import React from 'react'
import { FaShieldHeart, FaCertificate, FaWandMagicSparkles, FaUserDoctor } from 'react-icons/fa6'

const PILLARS = [
  { Icon: FaShieldHeart, title: 'Siguranță medicală', text: 'Protocoale stricte și produse de la branduri recunoscute internațional.' },
  { Icon: FaCertificate, title: 'Tehnologie certificată CE', text: 'Aparatură medicală de ultimă generație, certificată și întreținută.' },
  { Icon: FaWandMagicSparkles, title: 'Rezultate naturale', text: 'Estetică subtilă și echilibrată — armonie, nu exagerare.' },
  { Icon: FaUserDoctor, title: 'Medic dedicat', text: 'Fiecare tratament e efectuat sau supervizat de medic, după consultație.' },
]

export default function TrustStrip() {
  return (
    <section className="trust-strip" aria-labelledby="trust-title">
      <div className="trust-strip__inner">
        <span className="section-tag">De ce Maravo</span>
        <h2 id="trust-title" className="trust-strip__title">
          Estetică medicală în care poți avea <em>încredere</em>
        </h2>
        <div className="trust-strip__grid">
          {PILLARS.map(({ Icon, title, text }) => (
            <article className="trust-pillar" key={title}>
              <span className="trust-pillar__icon" aria-hidden="true"><Icon /></span>
              <h3 className="trust-pillar__title">{title}</h3>
              <p className="trust-pillar__text">{text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 3: Add `.trust-strip` CSS**

Append to `tokens.css`:
```css
/* ── TRUST STRIP ── */
.trust-strip { background: var(--cream-dark); padding: 64px 24px; }
.trust-strip__inner { max-width: 1100px; margin: 0 auto; }
.trust-strip__title { font-family: var(--serif); font-size: clamp(26px, 5vw, 42px); font-weight: 300; color: var(--black); line-height: 1.15; margin-bottom: 36px; }
.trust-strip__title em { font-style: italic; color: var(--text-muted); }
.trust-strip__grid { display: grid; grid-template-columns: 1fr; gap: 28px; }
.trust-pillar { padding: 4px 0; }
.trust-pillar__icon { display: inline-flex; font-size: 28px; color: var(--gold); margin-bottom: 14px; }
.trust-pillar__title { font-family: var(--serif); font-size: 19px; font-weight: 500; color: var(--charcoal); margin-bottom: 8px; }
.trust-pillar__text { font-family: var(--sans); font-size: 14px; font-weight: 300; color: var(--text-muted-light); line-height: 1.7; }
@media (min-width: 640px) { .trust-strip__grid { grid-template-columns: repeat(2, 1fr); gap: 32px 40px; } }
@media (min-width: 1024px) { .trust-strip__grid { grid-template-columns: repeat(4, 1fr); } }
```

- [ ] **Step 4: Insert TrustStrip into the homepage**

In `src/app/(frontend)/page.tsx`, add the import:
```tsx
import TrustStrip from '@/components/home/TrustStrip'
```
and render it between the Equipment grid (section 5) and Stats (section 6):
```tsx
      {/* 5b. Trust strip */}
      <FadeUp>
        <TrustStrip />
      </FadeUp>
```

- [ ] **Step 5: Verify build + visual**

Run: `pnpm typecheck && pnpm lint && pnpm build`
Expected: clean. `pnpm dev` → `/` shows: animated counters, marquee terms, About block with `image00018`, and the 4-pillar trust strip. No blank sections remain.

- [ ] **Step 6: Commit**

```bash
git add src/components/home/Stats.tsx src/components/home/Marquee.tsx src/components/home/AboutTeaser.tsx src/components/home/TrustStrip.tsx src/app/\(frontend\)/page.tsx src/styles/tokens.css
git commit -m "feat(home): baked defaults for stats/marquee/about + trust strip

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 6: Procedure detail — sticky info rail + sectioned layout (largest gap)

**Files:**
- Modify: `src/app/(frontend)/proceduri/[categorie]/[slug]/page.tsx` (wrap hero/content into a 2-col layout)
- Modify: `src/components/procedure/PictogramRow.tsx` (optional icon swap — keep markup classes)
- Modify: `src/styles/tokens.css` (all the missing `.proc-*` rules)

> The page already renders every admin field; this task is **layout + CSS**, not data. The key change is wrapping the existing hero + content in a 2-column grid where the meta/price/CTA form a sticky rail on desktop.

- [ ] **Step 1: Restructure the page into a layout grid**

In `proceduri/[categorie]/[slug]/page.tsx`, change the `<main className="proc-detail">` body so the hero meta (pictograms, invasiveness, price, top CTA) and the content live in a 2-column wrapper. Replace the current `<header className="proc-detail__hero">…</header>` + `<div className="proc-detail__content">…</div>` with:

```tsx
        <div className="proc-detail__layout">
          {/* Sticky info rail */}
          <aside className="proc-rail">
            <h1 className="proc-detail__title">{proc.title} Timișoara</h1>
            {proc.excerpt && <p className="proc-detail__excerpt">{proc.excerpt}</p>}
            {proc.meta && (
              <PictogramRow
                meta={{
                  duration: proc.meta.duration ?? null,
                  painLevel: proc.meta.painLevel ?? null,
                  painLabel: proc.meta.painLabel ?? null,
                  results: proc.meta.results ?? null,
                  recovery: proc.meta.recovery ?? null,
                }}
              />
            )}
            {invasiveness && <InvasivenessBadge invasiveness={invasiveness} />}
            {proc.priceFrom != null && (
              <div className="proc-rail__price">
                <span className="proc-price__label">Preț de la</span>
                <strong className="proc-price__value">{proc.priceFrom} lei</strong>
                {proc.priceNote && <span className="proc-price__note">{proc.priceNote}</span>}
              </div>
            )}
            {(whatsapp || phone) && (
              <div className="proc-rail__cta">
                <CtaButtons
                  whatsapp={whatsapp}
                  phone={phone}
                  procedureTitle={proc.title}
                  procedureSlug={proc.slug ?? slug}
                  variant="stacked"
                />
              </div>
            )}
          </aside>

          {/* Scrolling content column */}
          <div className="proc-detail__content">
            {/* …KEEP the existing sections: whatIsIt, whoIsItFor, benefits,
                howItWorks, resultsText, indications, contraindications, faq,
                relatedEquipment, relatedProcedures — UNCHANGED markup… */}
          </div>
        </div>
```

Notes for the engineer:
- Move the existing per-section JSX (Ce este / Cui i se potrivește / Beneficii / etc.) verbatim inside the new `.proc-detail__content` div.
- The standalone `.proc-price` section inside content is now redundant (price lives in the rail) — delete the old `{proc.priceFrom != null && (<section className="proc-price">…)}` block from the content column.
- Keep the breadcrumb above the layout and the bottom CTA section below it, unchanged.

- [ ] **Step 2: Add icon-tagged section headings via a small helper**

Add a section-icon map near the top of the file:
```tsx
import { FaCircleInfo, FaUserGroup, FaListCheck, FaArrowsRotate, FaStar, FaCircleCheck, FaCircleXmark } from 'react-icons/fa6'
```
For each `<h2 className="proc-section__heading">`, prefix an icon span, e.g.:
```tsx
<h2 id="ce-este" className="proc-section__heading">
  <span className="proc-section__icon" aria-hidden="true"><FaCircleInfo /></span>
  Ce este?
</h2>
```
Use: Ce este → `FaCircleInfo`; Cui i se potrivește → `FaUserGroup`; Beneficii → `FaListCheck`; Cum decurge → `FaArrowsRotate`; Rezultate → `FaStar`; Indicații → `FaCircleCheck`; Contraindicații → `FaCircleXmark`; FAQ keep as-is.

- [ ] **Step 3: Add the missing `.proc-*` CSS**

Append to `tokens.css`:
```css
/* ══ PROCEDURE DETAIL ══ */
.proc-detail__layout { max-width: 1180px; margin: 0 auto; padding: 8px 24px 24px; display: grid; grid-template-columns: 1fr; gap: 36px; }
.proc-detail__title { font-family: var(--serif); font-size: clamp(30px, 7vw, 52px); font-weight: 300; color: var(--black); line-height: 1.1; margin-bottom: 16px; }
.proc-detail__excerpt { font-family: var(--sans); font-size: 15px; font-weight: 300; color: var(--text-muted-light); line-height: 1.8; margin-bottom: 24px; }
.proc-rail__price { margin-top: 24px; padding: 18px 20px; background: var(--cream-dark); border: 1px solid var(--taupe); display: flex; flex-direction: column; gap: 4px; }
.proc-price__label { font-family: var(--sans); font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase; color: var(--gold-light-bg); }
.proc-price__value { font-family: var(--serif); font-size: 28px; font-weight: 400; color: var(--charcoal); }
.proc-price__note { font-family: var(--sans); font-size: 12px; color: var(--text-muted-light); }
.proc-rail__cta { margin-top: 24px; }

.proc-detail__content { display: flex; flex-direction: column; gap: 40px; }
.proc-section { scroll-margin-top: calc(var(--nav-h) + 12px); }
.proc-section__heading { display: flex; align-items: center; gap: 12px; font-family: var(--serif); font-size: clamp(22px, 4.5vw, 30px); font-weight: 400; color: var(--charcoal); line-height: 1.2; margin-bottom: 16px; padding-left: 14px; border-left: 3px solid var(--gold); }
.proc-section__icon { display: inline-flex; font-size: 0.8em; color: var(--gold); }
.proc-section__body { font-family: var(--sans); font-size: 15px; font-weight: 300; color: var(--text); line-height: 1.8; }

.proc-benefits { list-style: none; display: grid; grid-template-columns: 1fr; gap: 12px; }
.proc-benefits__item { display: flex; align-items: flex-start; gap: 12px; padding: 14px 16px; background: var(--white); border: 1px solid var(--cream-dark); font-family: var(--sans); font-size: 14px; color: var(--text); line-height: 1.6; }
.proc-benefits__dot { color: var(--gold); flex-shrink: 0; }

.equip-grid, .proc-grid { display: grid; grid-template-columns: 1fr; gap: 16px; }
@media (min-width: 640px) { .proc-benefits { grid-template-columns: repeat(2, 1fr); } .equip-grid, .proc-grid { grid-template-columns: repeat(2, 1fr); } }

@media (min-width: 1024px) {
  .proc-detail__layout { grid-template-columns: 320px 1fr; gap: 56px; align-items: start; }
  .proc-rail { position: sticky; top: calc(var(--nav-h) + 20px); }
  .equip-grid, .proc-grid { grid-template-columns: repeat(3, 1fr); }
}
```

- [ ] **Step 4: Verify build + visual on a real procedure**

Run: `pnpm typecheck && pnpm lint && pnpm build`
Then `pnpm dev`, open any procedure URL (e.g. one listed at `/proceduri`). Confirm: title hero, sticky rail with pictograms/price/CTA on desktop, sectioned content with gold-accent icon headings, benefit cards, related grids. On mobile the rail stacks above content.

- [ ] **Step 5: e2e smoke — sections render**

Append to `tests/e2e/ux-overhaul.spec.ts` (resolve a real slug first by visiting `/proceduri` and clicking the first card, OR hardcode a known seeded slug):
```ts
  test('procedure detail renders rail + sectioned content', async ({ page }) => {
    await page.goto('/proceduri')
    const firstCard = page.locator('a[href^="/proceduri/"]').first()
    await firstCard.click()
    await expect(page.locator('.proc-detail__layout')).toHaveCount(1)
    await expect(page.locator('.proc-detail__title')).toBeVisible()
  })
```

Run: `pnpm test:e2e -- ux-overhaul.spec.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add "src/app/(frontend)/proceduri/[categorie]/[slug]/page.tsx" src/components/procedure/PictogramRow.tsx src/styles/tokens.css tests/e2e/ux-overhaul.spec.ts
git commit -m "feat(proceduri): sticky info-rail layout + sectioned detail styling

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 7: Equipment detail + listing polish

**Files:**
- Modify: `src/app/(frontend)/aparatura/[slug]/page.tsx:258-266` (manufacturer chip)
- Modify: `src/components/procedure/EquipmentCard.tsx` (hover/badge — read first)
- Modify: `src/styles/tokens.css` (`.equip-detail__*` refinements, listing card hover)

- [ ] **Step 1: Manufacturer chip in the equipment hero**

In `aparatura/[slug]/page.tsx`, replace the `<p className="equip-detail__manufacturer">` block (~lines 260-265) with a chip:
```tsx
          {eq.manufacturer && (
            <span className="equip-chip">{eq.manufacturer}</span>
          )}
```

- [ ] **Step 2: Refine equipment detail + listing CSS**

Append to `tokens.css`:
```css
/* ══ EQUIPMENT POLISH ══ */
.equip-detail__content { max-width: 980px; margin: 0 auto; }
.equip-chip { display: inline-block; margin-top: 12px; padding: 6px 14px; background: var(--cream-dark); border: 1px solid var(--taupe); border-radius: 999px; font-family: var(--sans); font-size: 12px; letter-spacing: 0.06em; color: var(--charcoal); }
.equip-detail__photo-wrap { border: 1px solid var(--cream-dark); position: relative; }
.equip-detail__photo-wrap::after { content: ''; position: absolute; top: 10px; right: 10px; width: 22px; height: 22px; border-top: 2px solid var(--gold); border-right: 2px solid var(--gold); }
.equip-detail__gallery-img { transition: transform 0.5s ease; }
.equip-detail__gallery-item:hover .equip-detail__gallery-img { transform: scale(1.05); }
/* listing cards */
.equip-grid--listing .equip-card { transition: transform 0.25s, box-shadow 0.25s, border-color 0.25s; }
.equip-grid--listing .equip-card:hover { transform: translateY(-3px); box-shadow: 0 10px 30px rgba(201,169,110,0.14); border-color: var(--gold); }
```

> **Pre-step:** read `EquipmentCard.tsx` to confirm the root class name. If it is not `.equip-card`, adjust the selectors above to match the actual class. If a manufacturer badge is desired on the card and not present, add a `<span className="equip-card__badge">{manufacturer}</span>` and a matching rule.

- [ ] **Step 3: Verify build + visual**

Run: `pnpm typecheck && pnpm lint && pnpm build`
Then `pnpm dev` → `/aparatura` and one equipment page. Confirm chip, framed photo with gold corner, gallery hover-zoom, listing hover elevation.

- [ ] **Step 4: Commit**

```bash
git add "src/app/(frontend)/aparatura/[slug]/page.tsx" src/components/procedure/EquipmentCard.tsx src/styles/tokens.css
git commit -m "feat(aparatura): manufacturer chip, framed photo, gallery + listing polish

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 8: Despre — image hero, icon values, doctor block, motion

**Files:**
- Modify: `src/app/(frontend)/despre/page.tsx`
- Modify: `src/styles/tokens.css` (`.despre-*` additions)

- [ ] **Step 1: Add icons + image to despre**

In `despre/page.tsx`:

(a) Imports:
```tsx
import Image from 'next/image'
import FadeUp from '@/components/ui/FadeUp'
import { FaShieldHeart, FaLeaf, FaUserGroup, FaSpa } from 'react-icons/fa6'
```

(b) Map an icon to each of the 4 values. Add an icon array aligned to `ABOUT_CONTENT.values`:
```tsx
const VALUE_ICONS = [FaShieldHeart, FaLeaf, FaUserGroup, FaSpa]
```
and in the values map, render the icon:
```tsx
{ABOUT_CONTENT.values.map((v, i) => {
  const Icon = VALUE_ICONS[i] ?? FaShieldHeart
  return (
    <article className="despre-value" key={v.title}>
      <span className="despre-value__icon" aria-hidden="true"><Icon /></span>
      <h3 className="despre-value__title">{v.title}</h3>
      <p className="despre-value__text">{v.text}</p>
    </article>
  )
})}
```
(Keep or remove the numeric `despre-value__num` — prefer replacing it with the icon.)

(c) Add an image to the hero. Replace the `<header className="despre-hero">` content with a 2-col hero:
```tsx
      <header className="despre-hero despre-hero--split">
        <div className="despre-hero__copy">
          <span className="section-tag">Despre noi</span>
          <h1 className="despre-hero__title">
            Estetică medicală <em>premium</em> în inima Timișoarei
          </h1>
          <p className="despre-hero__lead">{ABOUT_CONTENT.heroLead}</p>
        </div>
        <div className="despre-hero__media">
          <Image src="/img/about.jpg" alt="Interior Maravo Clinic Timișoara" width={720} height={900} className="despre-hero__img" priority />
        </div>
      </header>
```

(d) Wrap each `<section className="despre-section">` in `<FadeUp>…</FadeUp>` for motion.

(e) Add a doctor E-E-A-T block before "Tehnologie & certificări":
```tsx
      <FadeUp>
        <section className="despre-doctor" aria-labelledby="despre-doctor">
          <div className="despre-doctor__media" aria-hidden="true">
            <span className="despre-doctor__monogram">MV</span>
          </div>
          <div className="despre-doctor__body">
            <span className="section-tag">Coordonator medical</span>
            <h2 className="despre-section__title" id="despre-doctor">Dr. Cristiana Voinescu</h2>
            <p>
              Echipa medicală {clinicName} este coordonată de Dr. Cristiana Voinescu. Fiecare
              tratament este efectuat sau supervizat de medic, în urma unei consultații în care
              stabilim împreună abordarea potrivită. Investim constant în formare și în participarea
              la cursuri și conferințe de profil, pentru a aduce cele mai actuale protocoale de
              estetică medicală în Timișoara.
            </p>
          </div>
        </section>
      </FadeUp>
```
(Remove the old plain "Echipa medicală" section that this replaces, to avoid duplication.)

- [ ] **Step 2: Add despre CSS**

Append to `tokens.css`:
```css
/* ══ DESPRE additions ══ */
.despre-hero--split { display: grid; grid-template-columns: 1fr; gap: 28px; max-width: 1100px; margin: 0 auto; padding: 32px 24px; align-items: center; }
.despre-hero__media { position: relative; }
.despre-hero__img { width: 100%; height: auto; object-fit: cover; border: 1px solid var(--cream-dark); }
.despre-hero__media::after { content: ''; position: absolute; bottom: 12px; left: 12px; width: 26px; height: 26px; border-bottom: 2px solid var(--gold); border-left: 2px solid var(--gold); }
.despre-value__icon { display: inline-flex; font-size: 26px; color: var(--gold); margin-bottom: 12px; }
.despre-doctor { display: grid; grid-template-columns: 1fr; gap: 24px; max-width: 1000px; margin: 0 auto; padding: 40px 24px; align-items: center; }
.despre-doctor__media { aspect-ratio: 1; max-width: 260px; background: linear-gradient(135deg, var(--charcoal), var(--charcoal2)); display: flex; align-items: center; justify-content: center; }
.despre-doctor__monogram { font-family: var(--serif); font-size: 64px; color: var(--gold); letter-spacing: 0.05em; }
.despre-doctor__body p { font-family: var(--sans); font-size: 15px; font-weight: 300; color: var(--text); line-height: 1.85; }
@media (min-width: 768px) {
  .despre-hero--split { grid-template-columns: 1.2fr 1fr; gap: 48px; padding: 56px 40px; }
  .despre-doctor { grid-template-columns: 260px 1fr; gap: 40px; }
}
```

- [ ] **Step 3: Verify build + visual**

Run: `pnpm typecheck && pnpm lint && pnpm build`
Then `pnpm dev` → `/despre`. Confirm: split hero with `image00018`, value cards with gold icons, doctor block, fade-up motion on scroll. No half-empty feel.

- [ ] **Step 4: Commit**

```bash
git add "src/app/(frontend)/despre/page.tsx" src/styles/tokens.css
git commit -m "feat(despre): image hero, icon value cards, doctor E-E-A-T block, motion

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 9: Blog — width container fix

**Files:**
- Modify: `src/styles/tokens.css` (`.blog-page__hero`, `.blog-page__body`, `.blog-grid`)

- [ ] **Step 1: Constrain blog to the site container width**

In `tokens.css`, update the blog rules so hero and body share a centered max-width consistent with other pages (the site uses ~1100-1180px content widths):
```css
.blog-page__hero { padding: 56px 24px 24px; max-width: 1100px; margin: 0 auto; }
.blog-page__body { padding: 24px 24px 64px; max-width: 1100px; margin: 0 auto; }
```
(Change from the current `max-width: 880px` hero / unbounded body so the grid fills the same column as the rest of the site.)

- [ ] **Step 2: Verify build + visual**

Run: `pnpm build`
Then `pnpm dev` → `/blog`. Confirm hero + grid align to the same width as homepage sections; no narrow/half-page look. (If no posts, the empty state is centered in the same container.)

- [ ] **Step 3: Commit**

```bash
git add src/styles/tokens.css
git commit -m "fix(blog): align hero + grid to site content width

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 10: Final verification pass

**Files:** none (verification only)

- [ ] **Step 1: Full static checks**

Run:
```bash
pnpm typecheck && pnpm lint && pnpm build
```
Expected: all clean.

- [ ] **Step 2: Full test suites**

Run:
```bash
pnpm test:int && pnpm test:e2e
```
Expected: existing canonical/SEO guards still green; new `ux-overhaul.spec.ts` green.

- [ ] **Step 3: Manual mobile + desktop sweep**

`pnpm dev`, then at 360px and ≥1024px verify each: `/`, `/proceduri/<cat>/<slug>`, `/aparatura/<slug>`, `/aparatura`, `/despre`, `/blog`, `/contact`. Confirm: logo-only header, animated hero (and reduced-motion off state), no empty homepage sections, styled procedure/equipment templates, despre imagery+motion, blog width, contact map+socials, WhatsApp FAB bottom-left on every page not overlapping content.

- [ ] **Step 4: Lighthouse spot check**

Run Lighthouse (Chrome DevTools) on `/` and one procedure page. Confirm Performance, SEO, and Accessibility are not regressed versus pre-overhaul (target ≥90 SEO/A11y). Note any LCP regression from the hero; if present, lower blob blur or monogram size.

- [ ] **Step 5: Final commit (if any tweaks)**

```bash
git add -A
git commit -m "chore(ui): final verification tweaks for UX overhaul

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Self-review notes (coverage map)

| Spec area | Task(s) |
|---|---|
| Hero animated mesh + monogram | Task 4 |
| Homepage empty sections / CTA / image00018 / trust | Task 5 |
| Header logo-only | Task 1 |
| Procedure detail template | Task 6 |
| Equipment detail + listing | Task 7 |
| Despre redesign | Task 8 |
| Blog width | Task 9 |
| Contact NAP/map/socials | Task 0 (data) + Task 3 |
| Floating WhatsApp | Task 2 |
| react-icons dependency | Task 0 |
| Verification | Task 10 |

All spec sections map to a task; no placeholders; component/class names are consistent across tasks (`.proc-detail__layout`, `.proc-rail`, `.trust-strip`, `.wa-fab`, `.social-icons`, `SocialIcons`, `WhatsAppFab`, `TrustStrip`). Tasks 5, 6, 7 include a **pre-step to read the existing component** before editing, because exact prop/class names must be confirmed against the current source.
