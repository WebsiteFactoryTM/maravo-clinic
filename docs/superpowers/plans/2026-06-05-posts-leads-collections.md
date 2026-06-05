# Posts and Leads Collections Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Posts (Blog) and Leads Payload collections, register them in payload.config.ts, generate a migration, and write integration tests.

**Architecture:** Two new CollectionConfig files follow the same pattern as Procedures.ts. Posts uses autoSlugField + richText + SEO group. Leads uses access control gates (public create, authenticated read/update/delete). Both are registered in payload.config.ts, then a single migration is generated and run.

**Tech Stack:** Payload 3.85, Next.js 16, Postgres via @payloadcms/db-postgres, Vitest 4 for integration tests.

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `src/collections/Posts.ts` | Blog post CollectionConfig |
| Create | `src/collections/Leads.ts` | Lead capture CollectionConfig |
| Modify | `src/payload.config.ts` | Register Posts + Leads |
| Create | `tests/integration/leads.test.ts` | Access-control + slug integration tests |
| Auto-generated | `src/migrations/<timestamp>_posts_leads.ts` | Drizzle migration |
| Auto-generated | `src/migrations/<timestamp>_posts_leads.json` | Migration snapshot |
| Auto-modified | `src/migrations/index.ts` | Migration registry |
| Auto-generated | `src/payload-types.ts` | TypeScript types for all collections |

---

### Task 1: Create `src/collections/Posts.ts`

**Files:**
- Create: `src/collections/Posts.ts`

- [ ] **Step 1: Write Posts.ts**

```ts
import type { CollectionConfig } from 'payload'
import { autoSlugField } from '../lib/autoSlugField'

export const Posts: CollectionConfig = {
  slug: 'posts',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'category', 'status', 'publishedAt'],
    group: 'Conținut',
  },
  access: { read: () => true },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    autoSlugField('title'),
    {
      name: 'cover',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'category',
      type: 'text',
    },
    {
      name: 'excerpt',
      type: 'textarea',
    },
    {
      name: 'body',
      type: 'richText',
    },
    {
      name: 'relatedProcedures',
      type: 'relationship',
      relationTo: 'procedures',
      hasMany: true,
    },
    {
      name: 'publishedAt',
      type: 'date',
    },
    {
      name: 'status',
      type: 'select',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Published', value: 'published' },
      ],
      defaultValue: 'draft',
    },
    {
      name: 'seo',
      type: 'group',
      fields: [
        { name: 'metaTitle', type: 'text' },
        { name: 'metaDescription', type: 'textarea' },
        { name: 'ogImage', type: 'upload', relationTo: 'media' },
      ],
    },
  ],
}
```

---

### Task 2: Create `src/collections/Leads.ts`

**Files:**
- Create: `src/collections/Leads.ts`

- [ ] **Step 1: Write Leads.ts**

```ts
import type { CollectionConfig } from 'payload'

export const Leads: CollectionConfig = {
  slug: 'leads',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'phone', 'procedureInterest', 'createdAt'],
    group: 'Solicitări',
  },
  access: {
    read: ({ req }) => !!req.user,
    create: () => true,
    update: ({ req }) => !!req.user,
    delete: ({ req }) => !!req.user,
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'phone', type: 'text', required: true },
    { name: 'email', type: 'email' },
    { name: 'procedureInterest', type: 'relationship', relationTo: 'procedures' },
    { name: 'message', type: 'textarea' },
    { name: 'source', type: 'text', admin: { readOnly: true } },
  ],
}
```

---

### Task 3: Register in `src/payload.config.ts`

**Files:**
- Modify: `src/payload.config.ts`

- [ ] **Step 1: Add imports**

Add after `import { Procedures } from './collections/Procedures'`:

```ts
import { Posts } from './collections/Posts'
import { Leads } from './collections/Leads'
```

- [ ] **Step 2: Add to collections array**

Change:
```ts
collections: [Users, Media, Categories, Equipment, Procedures],
```
To:
```ts
collections: [Users, Media, Categories, Equipment, Procedures, Posts, Leads],
```

---

### Task 4: Generate types and migration

- [ ] **Step 1: Generate TypeScript types**

```bash
cd C:\PixelFactory\Maravo\new-site\repo && pnpm payload generate:types
```

Expected: `src/payload-types.ts` updated, no errors.

- [ ] **Step 2: Create migration**

```bash
cd C:\PixelFactory\Maravo\new-site\repo && pnpm payload migrate:create posts_leads
```

Expected: Two new files created in `src/migrations/` — `<timestamp>_posts_leads.ts` and `<timestamp>_posts_leads.json`. `src/migrations/index.ts` updated.

- [ ] **Step 3: Run the migration**

```bash
cd C:\PixelFactory\Maravo\new-site\repo && echo y | pnpm payload migrate
```

Expected: Migration applied successfully, `posts` and `leads` tables created in Postgres.

---

### Task 5: Write integration tests `tests/integration/leads.test.ts`

**Files:**
- Create: `tests/integration/leads.test.ts`

- [ ] **Step 1: Write leads.test.ts**

```ts
import { getPayloadClient } from '../../src/lib/payload'
import { test, expect, afterAll, beforeAll } from 'vitest'

const RUN = Date.now()
let leadId: number | undefined
let postId: number | undefined

// ── Leads access control ───────────────────────────────────────────────────────

test('public (no user) can create a lead', async () => {
  const p = await getPayloadClient()
  const lead = await p.create({
    collection: 'leads',
    data: { name: `Ana-${RUN}`, phone: '0700', source: '/contact' },
    overrideAccess: false,
    // no req.user → create: () => true should allow this
  })
  leadId = lead.id
  expect(lead.name).toBe(`Ana-${RUN}`)
}, 30000)

test('reading leads without a user is denied', async () => {
  const p = await getPayloadClient()
  // Payload 3.x with overrideAccess:false and no user: read: ({ req }) => !!req.user
  // returns false → Payload throws a Forbidden error
  await expect(
    p.find({ collection: 'leads', overrideAccess: false }),
  ).rejects.toMatchObject({ status: 403 })
}, 30000)

// ── Posts slug auto-generation ────────────────────────────────────────────────

test('creating a post auto-generates slug from title', async () => {
  const p = await getPayloadClient()
  const post = await p.create({
    collection: 'posts',
    data: { title: `Test Post ${RUN}` },
  })
  postId = post.id
  expect(post.slug).toBe(`test-post-${RUN}`)
}, 30000)

test('post explicit slug is kept as-is', async () => {
  const p = await getPayloadClient()
  const post = await p.create({
    collection: 'posts',
    data: { title: `Another Post ${RUN}`, slug: `custom-slug-${RUN}` },
  })
  expect(post.slug).toBe(`custom-slug-${RUN}`)
  await p.delete({ collection: 'posts', id: post.id })
}, 30000)

// ── Cleanup ───────────────────────────────────────────────────────────────────

afterAll(async () => {
  const p = await getPayloadClient()
  if (leadId) await p.delete({ collection: 'leads', id: leadId }).catch(() => undefined)
  if (postId) await p.delete({ collection: 'posts', id: postId }).catch(() => undefined)
}, 30000)
```

---

### Task 6: Run tests and typecheck

- [ ] **Step 1: Run new leads/posts tests**

```bash
cd C:\PixelFactory\Maravo\new-site\repo && pnpm vitest run tests/integration/leads.test.ts
```

Expected: All 4 tests pass.

- [ ] **Step 2: Run full integration suite**

```bash
cd C:\PixelFactory\Maravo\new-site\repo && pnpm vitest run tests/integration
```

Expected: All tests pass, no regressions.

- [ ] **Step 3: Typecheck**

```bash
cd C:\PixelFactory\Maravo\new-site\repo && pnpm typecheck
```

Expected: No TypeScript errors.

---

### Task 7: Commit

- [ ] **Step 1: Stage and commit**

```bash
cd C:\PixelFactory\Maravo\new-site\repo && git add src/collections/Posts.ts src/collections/Leads.ts src/payload.config.ts src/payload-types.ts src/migrations/ tests/integration/leads.test.ts
git commit -m "feat: Posts and Leads collections"
```
