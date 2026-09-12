CREATE EXTENSION IF NOT EXISTS "pgcrypto";
--> statement-breakpoint
CREATE TABLE "airports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(63) NOT NULL,
	"display_name" varchar(100) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "airports_slug_unique" UNIQUE("slug"),
	CONSTRAINT "airports_slug_format_check" CHECK ("airports"."slug" ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
	CONSTRAINT "airports_display_name_nonempty_check" CHECK (char_length(btrim("airports"."display_name")) > 0)
);
--> statement-breakpoint
CREATE TABLE "levels" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"airport_id" uuid NOT NULL,
	"level_type" varchar(32) NOT NULL,
	"level_number" smallint NOT NULL,
	"star_target_revenue" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "levels_airport_type_number_unique" UNIQUE("airport_id","level_type","level_number"),
	CONSTRAINT "levels_type_nonempty_check" CHECK (char_length(btrim("levels"."level_type")) > 0),
	CONSTRAINT "levels_number_positive_check" CHECK ("levels"."level_number" >= 1),
	CONSTRAINT "levels_target_positive_check" CHECK ("levels"."star_target_revenue" > 0)
);
--> statement-breakpoint
CREATE TABLE "food_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"airport_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"name_key" varchar(100) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "food_categories_airport_name_key_unique" UNIQUE("airport_id","name_key"),
	CONSTRAINT "food_categories_id_airport_unique" UNIQUE("id","airport_id"),
	CONSTRAINT "food_categories_name_nonempty_check" CHECK (char_length(btrim("food_categories"."name")) > 0),
	CONSTRAINT "food_categories_name_key_nonempty_check" CHECK (char_length(btrim("food_categories"."name_key")) > 0)
);
--> statement-breakpoint
CREATE TABLE "foods" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"airport_id" uuid NOT NULL,
	"category_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"name_key" varchar(100) NOT NULL,
	"display_order" smallint NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "foods_airport_name_key_unique" UNIQUE("airport_id","name_key"),
	CONSTRAINT "foods_airport_display_order_unique" UNIQUE("airport_id","display_order"),
	CONSTRAINT "foods_name_nonempty_check" CHECK (char_length(btrim("foods"."name")) > 0),
	CONSTRAINT "foods_name_key_nonempty_check" CHECK (char_length(btrim("foods"."name_key")) > 0),
	CONSTRAINT "foods_display_order_positive_check" CHECK ("foods"."display_order" >= 1)
);
--> statement-breakpoint
CREATE TABLE "souvenirs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"airport_id" uuid NOT NULL,
	"slot" smallint NOT NULL,
	"name" varchar(100) NOT NULL,
	"per_item_revenue" integer NOT NULL,
	"package_size" smallint DEFAULT 5 NOT NULL,
	"diamond_package_price" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "souvenirs_airport_slot_unique" UNIQUE("airport_id","slot"),
	CONSTRAINT "souvenirs_slot_check" CHECK ("souvenirs"."slot" in (1, 2)),
	CONSTRAINT "souvenirs_name_nonempty_check" CHECK (char_length(btrim("souvenirs"."name")) > 0),
	CONSTRAINT "souvenirs_revenue_positive_check" CHECK ("souvenirs"."per_item_revenue" > 0),
	CONSTRAINT "souvenirs_package_size_five_check" CHECK ("souvenirs"."package_size" = 5),
	CONSTRAINT "souvenirs_diamond_price_nonnegative_check" CHECK ("souvenirs"."diamond_package_price" >= 0)
);
--> statement-breakpoint
ALTER TABLE "levels" ADD CONSTRAINT "levels_airport_id_airports_id_fk" FOREIGN KEY ("airport_id") REFERENCES "public"."airports"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "food_categories" ADD CONSTRAINT "food_categories_airport_id_airports_id_fk" FOREIGN KEY ("airport_id") REFERENCES "public"."airports"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "foods" ADD CONSTRAINT "foods_airport_id_airports_id_fk" FOREIGN KEY ("airport_id") REFERENCES "public"."airports"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "foods" ADD CONSTRAINT "foods_category_airport_fk" FOREIGN KEY ("category_id","airport_id") REFERENCES "public"."food_categories"("id","airport_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "souvenirs" ADD CONSTRAINT "souvenirs_airport_id_airports_id_fk" FOREIGN KEY ("airport_id") REFERENCES "public"."airports"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "levels_airport_type_number_idx" ON "levels" USING btree ("airport_id","level_type","level_number");--> statement-breakpoint
CREATE INDEX "food_categories_airport_idx" ON "food_categories" USING btree ("airport_id");--> statement-breakpoint
CREATE INDEX "foods_airport_display_order_idx" ON "foods" USING btree ("airport_id","display_order");--> statement-breakpoint
CREATE INDEX "souvenirs_airport_idx" ON "souvenirs" USING btree ("airport_id");
--> statement-breakpoint
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER airports_set_updated_at BEFORE UPDATE ON airports
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
--> statement-breakpoint
CREATE TRIGGER levels_set_updated_at BEFORE UPDATE ON levels
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
--> statement-breakpoint
CREATE TRIGGER food_categories_set_updated_at BEFORE UPDATE ON food_categories
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
--> statement-breakpoint
CREATE TRIGGER foods_set_updated_at BEFORE UPDATE ON foods
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
--> statement-breakpoint
CREATE TRIGGER souvenirs_set_updated_at BEFORE UPDATE ON souvenirs
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
