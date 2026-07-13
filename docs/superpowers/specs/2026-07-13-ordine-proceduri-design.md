# Ordinea procedurilor + flag „Proceduri populare”

Data: 2026-07-13

## Problema

În `/admin` nu se poate seta ordinea în care apar procedurile pe site, iar
mecanismul pentru „Proceduri populare” de pe homepage este dublu și ambiguu.

Starea de fapt, verificată în cod:

1. **Colecția `procedures` nu are niciun câmp de ordine.** Aproape toate
   interogările o cer fără `sort`, iar adaptorul Postgres cade pe `-createdAt`
   (`@payloadcms/drizzle/dist/queries/buildOrderBy.js:9-13`). Deci ordinea din
   mega-menu, `/proceduri`, pagina de categorie, bodymap, căutare, `llm.txt` și
   `sitemap` este „cea mai recent creată prima” — practic arbitrară.
   Excepții: `/tarife` și dropdown-ul de contact sortează `title` A→Z.

2. **Două mecanisme concurente pentru „popular”**, cu precedență, nu merge:
   - checkbox-ul `popular` pe procedură (`Procedures.ts:188`, **fără label**);
   - relația `popularProcedures` pe globalul Homepage (`Homepage.ts:41`).

   Dacă relația are măcar o intrare, checkbox-ul e ignorat la selecție
   (`page.tsx:158-169`) — dar tot decide dacă se afișează badge-ul „Popular”
   (`PopularCarousel.tsx:43`). Se poate deci ajunge cu o procedură în carusel
   fără badge.

3. **Cod mort:** checkbox-ul `featured` de pe procedură și
   `homepage.featuredProcedures` — definite și migrate, citite nicăieri.

`categories` are deja `order` (`Categories.ts:25`), folosit în 4 locuri.

## Decizii

| Decizie | Ales | De ce |
|---|---|---|
| Domeniul ordinii | **În interiorul categoriei** | Procedurile se afișează aproape mereu grupate pe categorie. O ordine globală ar cere ca, pentru a muta o procedură în capul categoriei ei, să te gândești la numerele din alte categorii. |
| Sursa de adevăr pentru „popular” | **Doar checkbox-ul** | Un singur loc de administrat; dispare bug-ul badge-ului. |
| Modelare | **Câmp `number` numit `order`** | Aceeași convenție ca `categories.order`. `orderable: true` din Payload 3.85 dă drag-and-drop, dar e marcat `@experimental`, produce ordine *globală* (contrazice decizia de mai sus) și stochează valori opace de fractional indexing, greu de pus în seed și de așezat în teste. |
| Dropdown contact + căutare | **Neschimbate** | Dropdown-ul rămâne alfabetic (mai ușor de scanat, 34 de intrări); căutarea rămâne pe relevanță, cu ordinea doar ca tie-break. |

## Schema

### `procedures` (`src/collections/Procedures.ts`)

- **ADD** `order`: `number`, **fără `defaultValue`** (gol = NULL), label
  „Ordine afișare (în categorie)”, `admin.position: 'sidebar'`.

  **Gol înseamnă „fără preferință” și sortează ULTIMUL, nu primul.** Un
  `defaultValue: 0` ar fi fost o capcană: un editor care fixează trei proceduri
  1-2-3 se așteaptă ca celelalte treizeci să cadă *sub* ele — dar cu 0 implicit
  toate cele neatinse ar fi sărit deasupra. Postgres sortează nativ `NULLS LAST`
  la `ORDER BY ... ASC`, deci SQL-ul și helper-ul JS sunt de acord fără efort.
- **RELABEL** `popular`: label „Apare în «Proceduri populare» pe homepage”,
  `admin.position: 'sidebar'`.
- **REMOVE** `featured` (mort).
- `admin.defaultColumns` → `['title', 'category', 'order', 'popular', 'status']`,
  ca lista din /admin să fie scanabilă și sortabilă după ordine.

### `homepage` (`src/globals/Homepage.ts`)

- **REMOVE** `popularProcedures` și `featuredProcedures`.

## Migrarea

Fără pierdere de date. **Ordinea operațiilor contează** — conversia trebuie să se
întâmple înainte de ștergere:

```sql
-- 1. alegerile manuale din globalul Homepage devin bife pe procedură
UPDATE procedures SET popular = true
WHERE id IN (
  SELECT procedures_id FROM homepage_rels
  WHERE path = 'popularProcedures' AND procedures_id IS NOT NULL
);

-- 2. abia acum se pot șterge relațiile
DELETE FROM homepage_rels WHERE path IN ('popularProcedures', 'featuredProcedures');

-- 3. schema (fără DEFAULT — vezi nota de mai sus)
ALTER TABLE procedures ADD COLUMN "order" numeric;
ALTER TABLE procedures DROP COLUMN featured;
```

Payload nu poate genera asta dintr-un singur `migrate:create`: dacă `order` se
adaugă și `featured` se șterge în același diff, drizzle-kit întreabă interactiv
dacă e o redenumire. De aceea sunt **două migrări** — una care adaugă, una care
șterge — iar backfill-ul e adăugat manual în a doua, înaintea `DROP TABLE`.

`order` e cuvânt rezervat SQL — trebuie ghilimelat. Precedentul există:
`categories.order` funcționează deja așa.

`down()` face drumul invers (recreează coloanele și relațiile; alegerile
individuale nu se pot reconstitui, dar bifele rămân).

## Sortarea

`order` singur nu ajunge pentru listele plate: **Payload nu poate sorta după un
câmp dintr-o relație** — `sort: 'category.order'` nu există. Deci două căi, ambele
într-un singur helper `src/lib/procedure-sort.ts`, ca regula să nu fie copiată în
nouă fișiere:

1. **Liste dintr-o singură categorie** — mega-menu, pagina de categorie,
   secțiunile din `/tarife`:
   `sort: ['order', 'title']` direct în `payload.find` (SQL).

2. **Liste plate** — toate procedurile, caruselul popular, bodymap, `sitemap`,
   `llm.txt`: același fetch (cu `depth: 1`, ca `category` să vină populată), apoi
   sortare în JS după `(category.order, procedure.order, title)`.

`title` e tie-break. Consecință utilă: cât timp nicio procedură nu are `order`
(imediat după migrare), site-ul devine **alfabetic** — deja mai bun și, mai ales,
stabil față de `-createdAt` de acum.

### Locuri atinse

| Fișier | Acum | Devine |
|---|---|---|
| `layout.tsx` (nav) | fără sort | `sort: ['order','title']` |
| `proceduri/page.tsx` | fără sort | sort + JS pe listă plată |
| `proceduri/[categorie]/page.tsx` | fără sort | `sort: ['order','title']` |
| `tarife/page.tsx` | `sort: 'title'` | `sort: ['order','title']` |
| `page.tsx` (carusel popular) | relație → flag → primele 8 | `popular === true`, sortate |
| `page.tsx` (bodymap) | fără sort | sortare JS |
| detaliu procedură (similare) | ordinea relației | sortare JS |
| `aparatura/[slug]` (proceduri legate) | ordinea relației | sortare JS |
| `llm.txt`, `sitemap.ts` | fără sort | sortare |
| contact (dropdown) | `sort: 'title'` | **neschimbat** |
| căutare | relevanță | **neschimbat** (ordinea = tie-break) |

Caruselul popular pierde ramurile de fallback: nu mai există „relația CMS” și nici
„primele 8 dacă nu e nimic bifat”. Dacă nimic nu e bifat, secțiunea nu se afișează.

## Seed

**Seed-ul nu are voie să scrie peste `order` și `popular` la update.** Altfel prima
rulare de `pnpm seed` după ce clinica își aranjează ordinea în admin i-o resetează
pe toată — exact clasa de problemă pentru care a fost nevoie de
`scripts/fix-content.ts`.

- La **creare**: `order` = poziția procedurii în `proceduri.txt`, în cadrul
  categoriei ei (1, 2, 3…); `popular` = `false`.
- La **update**: ambele câmpuri sunt excluse din payload-ul scris.

## Teste

- **Unit** (`tests/unit/procedureSort.test.ts`): helper-ul de sortare — ordonare pe
  `(category.order, order, title)`, tie-break când `order` e egal, cazul „toate 0”
  (⇒ alfabetic), proceduri fără categorie populată.
- **Integration**: pagina de categorie și `/tarife` respectă `order`; caruselul
  afișează exact procedurile bifate, în ordine; nimic bifat ⇒ secțiune ascunsă.
- **Migrare**: o procedură prezentă doar în `homepage_rels.popularProcedures`
  ajunge cu `popular = true` după `up()`.

## Ce NU intră

- Drag-and-drop în /admin (`orderable: true`) — se revizuiește când Payload îl
  scoate din `@experimental`.
- Reordonarea categoriilor (`categories.order` există deja și funcționează).
- Vreo schimbare la relevanța căutării.
