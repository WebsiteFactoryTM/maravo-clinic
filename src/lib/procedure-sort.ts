// Ordering rules for procedure lists.
//
// Editors set `procedures.order` in /admin to rank a procedure WITHIN its
// category (mirroring the existing `categories.order`). Two mechanisms are
// needed because Payload cannot sort by a field on a related document —
// `sort: 'category.order'` does not exist:
//
//   • single-category lists (mega-menu, category page, /tarife sections)
//     → PROCEDURE_SORT, applied in SQL by payload.find
//   • flat lists (all procedures, popular carousel, bodymap, sitemap, llm.txt)
//     → sortProcedures(), applied in JS with `category` populated at depth ≥ 1
//
// An empty `order` means "no preference" and sorts LAST, not first: an editor who
// ranks three procedures 1-2-3 expects the other thirty to fall below them, not to
// leapfrog above on a default of 0. Postgres already sorts NULLs last on ASC, so
// PROCEDURE_SORT and sortProcedures() agree without extra SQL.
//
// `title` is the tie-break, so an unranked category reads alphabetically — stable,
// unlike the `-createdAt` fallback Postgres would otherwise apply.

/** Sort argument for `payload.find` on a list already scoped to one category. */
export const PROCEDURE_SORT = ['order', 'title']

/** Minimum shape sortProcedures needs. Satisfied by the generated Procedure type. */
interface SortableProcedure {
  title: string
  order?: number | null
  category: number | { order?: number | null } | null
}

/** Unranked sorts last — mirrors Postgres NULLS LAST. */
const UNRANKED = Number.MAX_SAFE_INTEGER

function categoryOrder(category: SortableProcedure['category']): number {
  // An unpopulated relationship (depth 0) is just an id — it carries no order,
  // so those docs sort after the populated ones rather than jumping to the top.
  if (typeof category !== 'object' || category === null) return UNRANKED
  return category.order ?? UNRANKED
}

/**
 * Sort a flat list of procedures by (category order, procedure order, title).
 * Returns a new array; the input is not mutated.
 */
export function sortProcedures<T extends SortableProcedure>(procedures: T[]): T[] {
  return [...procedures].sort((a, b) => {
    const byCategory = categoryOrder(a.category) - categoryOrder(b.category)
    if (byCategory !== 0) return byCategory

    const byOrder = (a.order ?? UNRANKED) - (b.order ?? UNRANKED)
    if (byOrder !== 0) return byOrder

    return a.title.localeCompare(b.title, 'ro')
  })
}
