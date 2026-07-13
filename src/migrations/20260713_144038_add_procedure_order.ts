import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  // Deliberately NO default: an empty `order` means "no preference", and Postgres
  // sorts NULLs last on ASC — so unranked procedures fall to the bottom of their
  // category (alphabetically) instead of jumping above the ones an editor pinned.
  // A DEFAULT of 0 would put every untouched procedure *first*.
  await db.execute(sql`
   ALTER TABLE "procedures" ADD COLUMN "order" numeric;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "procedures" DROP COLUMN "order";`)
}
