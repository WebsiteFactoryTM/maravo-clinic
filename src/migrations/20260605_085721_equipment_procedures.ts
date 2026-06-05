import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_equipment_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_procedures_body_zones" AS ENUM('par', 'fata', 'gat', 'brate', 'abdomen', 'picioare');
  CREATE TYPE "public"."enum_procedures_meta_invasiveness" AS ENUM('non-invaziv', 'minim-invaziv', 'invaziv');
  CREATE TYPE "public"."enum_procedures_status" AS ENUM('draft', 'published');
  CREATE TABLE "equipment_gallery" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer NOT NULL
  );
  
  CREATE TABLE "equipment" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"slug" varchar,
  	"manufacturer" varchar,
  	"photo_id" integer,
  	"purpose" varchar,
  	"description" jsonb,
  	"status" "enum_equipment_status" DEFAULT 'published',
  	"seo_meta_title" varchar,
  	"seo_meta_description" varchar,
  	"seo_og_image_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "equipment_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"procedures_id" integer
  );
  
  CREATE TABLE "procedures_body_zones" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_procedures_body_zones",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "procedures_gallery" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer NOT NULL
  );
  
  CREATE TABLE "procedures_benefits" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"item" varchar
  );
  
  CREATE TABLE "procedures_faq" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"question" varchar,
  	"answer" varchar
  );
  
  CREATE TABLE "procedures" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"slug" varchar,
  	"category_id" integer NOT NULL,
  	"excerpt" varchar NOT NULL,
  	"icon" varchar,
  	"featured_image_id" integer,
  	"meta_duration" varchar,
  	"meta_pain_level" numeric,
  	"meta_pain_label" varchar,
  	"meta_results" varchar,
  	"meta_recovery" varchar,
  	"meta_invasiveness" "enum_procedures_meta_invasiveness",
  	"meta_effect_duration" varchar,
  	"meta_repeat_interval" varchar,
  	"what_is_it" jsonb,
  	"who_is_it_for" jsonb,
  	"how_it_works" jsonb,
  	"results_text" jsonb,
  	"indications" varchar,
  	"contraindications" varchar,
  	"price_from" numeric,
  	"price_note" varchar,
  	"popular" boolean DEFAULT false,
  	"featured" boolean DEFAULT false,
  	"seo_meta_title" varchar,
  	"seo_meta_description" varchar,
  	"seo_og_image_id" integer,
  	"status" "enum_procedures_status" DEFAULT 'draft',
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "procedures_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"equipment_id" integer,
  	"procedures_id" integer
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "equipment_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "procedures_id" integer;
  ALTER TABLE "equipment_gallery" ADD CONSTRAINT "equipment_gallery_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "equipment_gallery" ADD CONSTRAINT "equipment_gallery_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."equipment"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "equipment" ADD CONSTRAINT "equipment_photo_id_media_id_fk" FOREIGN KEY ("photo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "equipment" ADD CONSTRAINT "equipment_seo_og_image_id_media_id_fk" FOREIGN KEY ("seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "equipment_rels" ADD CONSTRAINT "equipment_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."equipment"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "equipment_rels" ADD CONSTRAINT "equipment_rels_procedures_fk" FOREIGN KEY ("procedures_id") REFERENCES "public"."procedures"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "procedures_body_zones" ADD CONSTRAINT "procedures_body_zones_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."procedures"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "procedures_gallery" ADD CONSTRAINT "procedures_gallery_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "procedures_gallery" ADD CONSTRAINT "procedures_gallery_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."procedures"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "procedures_benefits" ADD CONSTRAINT "procedures_benefits_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."procedures"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "procedures_faq" ADD CONSTRAINT "procedures_faq_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."procedures"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "procedures" ADD CONSTRAINT "procedures_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "procedures" ADD CONSTRAINT "procedures_featured_image_id_media_id_fk" FOREIGN KEY ("featured_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "procedures" ADD CONSTRAINT "procedures_seo_og_image_id_media_id_fk" FOREIGN KEY ("seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "procedures_rels" ADD CONSTRAINT "procedures_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."procedures"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "procedures_rels" ADD CONSTRAINT "procedures_rels_equipment_fk" FOREIGN KEY ("equipment_id") REFERENCES "public"."equipment"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "procedures_rels" ADD CONSTRAINT "procedures_rels_procedures_fk" FOREIGN KEY ("procedures_id") REFERENCES "public"."procedures"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "equipment_gallery_order_idx" ON "equipment_gallery" USING btree ("_order");
  CREATE INDEX "equipment_gallery_parent_id_idx" ON "equipment_gallery" USING btree ("_parent_id");
  CREATE INDEX "equipment_gallery_image_idx" ON "equipment_gallery" USING btree ("image_id");
  CREATE UNIQUE INDEX "equipment_slug_idx" ON "equipment" USING btree ("slug");
  CREATE INDEX "equipment_photo_idx" ON "equipment" USING btree ("photo_id");
  CREATE INDEX "equipment_seo_seo_og_image_idx" ON "equipment" USING btree ("seo_og_image_id");
  CREATE INDEX "equipment_updated_at_idx" ON "equipment" USING btree ("updated_at");
  CREATE INDEX "equipment_created_at_idx" ON "equipment" USING btree ("created_at");
  CREATE INDEX "equipment_rels_order_idx" ON "equipment_rels" USING btree ("order");
  CREATE INDEX "equipment_rels_parent_idx" ON "equipment_rels" USING btree ("parent_id");
  CREATE INDEX "equipment_rels_path_idx" ON "equipment_rels" USING btree ("path");
  CREATE INDEX "equipment_rels_procedures_id_idx" ON "equipment_rels" USING btree ("procedures_id");
  CREATE INDEX "procedures_body_zones_order_idx" ON "procedures_body_zones" USING btree ("order");
  CREATE INDEX "procedures_body_zones_parent_idx" ON "procedures_body_zones" USING btree ("parent_id");
  CREATE INDEX "procedures_gallery_order_idx" ON "procedures_gallery" USING btree ("_order");
  CREATE INDEX "procedures_gallery_parent_id_idx" ON "procedures_gallery" USING btree ("_parent_id");
  CREATE INDEX "procedures_gallery_image_idx" ON "procedures_gallery" USING btree ("image_id");
  CREATE INDEX "procedures_benefits_order_idx" ON "procedures_benefits" USING btree ("_order");
  CREATE INDEX "procedures_benefits_parent_id_idx" ON "procedures_benefits" USING btree ("_parent_id");
  CREATE INDEX "procedures_faq_order_idx" ON "procedures_faq" USING btree ("_order");
  CREATE INDEX "procedures_faq_parent_id_idx" ON "procedures_faq" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "procedures_slug_idx" ON "procedures" USING btree ("slug");
  CREATE INDEX "procedures_category_idx" ON "procedures" USING btree ("category_id");
  CREATE INDEX "procedures_featured_image_idx" ON "procedures" USING btree ("featured_image_id");
  CREATE INDEX "procedures_seo_seo_og_image_idx" ON "procedures" USING btree ("seo_og_image_id");
  CREATE INDEX "procedures_updated_at_idx" ON "procedures" USING btree ("updated_at");
  CREATE INDEX "procedures_created_at_idx" ON "procedures" USING btree ("created_at");
  CREATE INDEX "procedures_rels_order_idx" ON "procedures_rels" USING btree ("order");
  CREATE INDEX "procedures_rels_parent_idx" ON "procedures_rels" USING btree ("parent_id");
  CREATE INDEX "procedures_rels_path_idx" ON "procedures_rels" USING btree ("path");
  CREATE INDEX "procedures_rels_equipment_id_idx" ON "procedures_rels" USING btree ("equipment_id");
  CREATE INDEX "procedures_rels_procedures_id_idx" ON "procedures_rels" USING btree ("procedures_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_equipment_fk" FOREIGN KEY ("equipment_id") REFERENCES "public"."equipment"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_procedures_fk" FOREIGN KEY ("procedures_id") REFERENCES "public"."procedures"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_equipment_id_idx" ON "payload_locked_documents_rels" USING btree ("equipment_id");
  CREATE INDEX "payload_locked_documents_rels_procedures_id_idx" ON "payload_locked_documents_rels" USING btree ("procedures_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "equipment_gallery" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "equipment" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "equipment_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "procedures_body_zones" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "procedures_gallery" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "procedures_benefits" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "procedures_faq" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "procedures" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "procedures_rels" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "equipment_gallery" CASCADE;
  DROP TABLE "equipment" CASCADE;
  DROP TABLE "equipment_rels" CASCADE;
  DROP TABLE "procedures_body_zones" CASCADE;
  DROP TABLE "procedures_gallery" CASCADE;
  DROP TABLE "procedures_benefits" CASCADE;
  DROP TABLE "procedures_faq" CASCADE;
  DROP TABLE "procedures" CASCADE;
  DROP TABLE "procedures_rels" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_equipment_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_procedures_fk";
  
  DROP INDEX "payload_locked_documents_rels_equipment_id_idx";
  DROP INDEX "payload_locked_documents_rels_procedures_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "equipment_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "procedures_id";
  DROP TYPE "public"."enum_equipment_status";
  DROP TYPE "public"."enum_procedures_body_zones";
  DROP TYPE "public"."enum_procedures_meta_invasiveness";
  DROP TYPE "public"."enum_procedures_status";`)
}
