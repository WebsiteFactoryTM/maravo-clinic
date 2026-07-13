import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  // The `popular` checkbox on each procedure becomes the single source of truth
  // for the homepage carousel, replacing the `homepage.popularProcedures`
  // relationship. Carry the existing hand-picked selection over to the checkbox
  // BEFORE dropping the table that holds it — otherwise the CASCADE below
  // silently discards whatever the clinic curated in /admin.
  await db.execute(sql`
   UPDATE "procedures" SET "popular" = true
   WHERE "id" IN (
     SELECT "procedures_id" FROM "homepage_rels"
     WHERE "path" = 'popularProcedures' AND "procedures_id" IS NOT NULL
   );`)

  await db.execute(sql`
   DROP TABLE "homepage_rels" CASCADE;
  ALTER TABLE "procedures" DROP COLUMN "featured";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "homepage_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"procedures_id" integer
  );
  
  ALTER TABLE "procedures" ADD COLUMN "featured" boolean DEFAULT false;
  ALTER TABLE "homepage_rels" ADD CONSTRAINT "homepage_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_rels" ADD CONSTRAINT "homepage_rels_procedures_fk" FOREIGN KEY ("procedures_id") REFERENCES "public"."procedures"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "homepage_rels_order_idx" ON "homepage_rels" USING btree ("order");
  CREATE INDEX "homepage_rels_parent_idx" ON "homepage_rels" USING btree ("parent_id");
  CREATE INDEX "homepage_rels_path_idx" ON "homepage_rels" USING btree ("path");
  CREATE INDEX "homepage_rels_procedures_id_idx" ON "homepage_rels" USING btree ("procedures_id");`)
}
