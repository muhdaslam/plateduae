CREATE TABLE IF NOT EXISTS "restaurant" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"legal_name" text NOT NULL,
	"brand_name" text NOT NULL,
	"cuisine_tags" text[] DEFAULT '{}' NOT NULL,
	"claimed_by" uuid,
	"verification_status" text DEFAULT 'unclaimed' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "branch" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"restaurant_id" uuid NOT NULL,
	"geo_point" geometry(Point, 4326) NOT NULL,
	"address" text NOT NULL,
	"community" text NOT NULL,
	"hours" jsonb,
	"licence_ref" text,
	"status" text DEFAULT 'unverified' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "menu" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"branch_id" uuid NOT NULL,
	"channel" text NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"source_artefact_id" text NOT NULL,
	"language" text DEFAULT 'en' NOT NULL,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "menu_item" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"menu_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"base_price" numeric(10, 2) NOT NULL,
	"currency" text DEFAULT 'AED' NOT NULL,
	"section" text,
	"modifier_groups" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"dietary_flags" text[] DEFAULT '{}' NOT NULL,
	"allergen_flags" text[] DEFAULT '{}' NOT NULL,
	"calories" integer,
	"confidence" real,
	"field_provenance" jsonb
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "canonical_dish" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"canonical_name" text NOT NULL,
	"aliases" text[] DEFAULT '{}' NOT NULL,
	"name_ar" text,
	"cuisine" text,
	"category" text,
	"embedding" vector(768),
	"curated_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "dish_mapping" (
	"menu_item_id" uuid NOT NULL,
	"canonical_dish_id" uuid NOT NULL,
	"confidence" real NOT NULL,
	"variant_attrs" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"review_state" text DEFAULT 'pending_review' NOT NULL,
	CONSTRAINT "dish_mapping_menu_item_id_pk" PRIMARY KEY("menu_item_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "price_observation" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"menu_item_id" uuid NOT NULL,
	"channel" text NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"observed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"source" text NOT NULL,
	"verified_by" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "channel_listing" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"menu_item_id" uuid NOT NULL,
	"platform" text NOT NULL,
	"platform_price" numeric(10, 2) NOT NULL,
	"delivery_fee" numeric(10, 2),
	"min_order" numeric(10, 2),
	"last_seen" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "dish_market_stat" (
	"canonical_dish_id" uuid NOT NULL,
	"polygon_id" text NOT NULL,
	"p25" numeric(10, 2) NOT NULL,
	"median" numeric(10, 2) NOT NULL,
	"p75" numeric(10, 2) NOT NULL,
	"sample_size" integer NOT NULL,
	"computed_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "dish_market_stat_canonical_dish_id_polygon_id_pk" PRIMARY KEY("canonical_dish_id","polygon_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "correction_report" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"target_ref" text NOT NULL,
	"field" text NOT NULL,
	"reported_value" text,
	"reporter_type" text NOT NULL,
	"state" text DEFAULT 'open' NOT NULL,
	"resolved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "app_user" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"auth_ref" text NOT NULL,
	"home_geo" text,
	"dietary_prefs" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"saved_dishes" uuid[] DEFAULT '{}' NOT NULL,
	"locale" text DEFAULT 'en' NOT NULL,
	CONSTRAINT "app_user_auth_ref_unique" UNIQUE("auth_ref")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "outbound_click" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_ref" uuid,
	"menu_item_id" uuid NOT NULL,
	"destination" text NOT NULL,
	"partner" text NOT NULL,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	"commission_state" text DEFAULT 'pending' NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "branch" ADD CONSTRAINT "branch_restaurant_id_restaurant_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurant"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "menu" ADD CONSTRAINT "menu_branch_id_branch_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branch"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "menu_item" ADD CONSTRAINT "menu_item_menu_id_menu_id_fk" FOREIGN KEY ("menu_id") REFERENCES "public"."menu"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "dish_mapping" ADD CONSTRAINT "dish_mapping_menu_item_id_menu_item_id_fk" FOREIGN KEY ("menu_item_id") REFERENCES "public"."menu_item"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "dish_mapping" ADD CONSTRAINT "dish_mapping_canonical_dish_id_canonical_dish_id_fk" FOREIGN KEY ("canonical_dish_id") REFERENCES "public"."canonical_dish"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "price_observation" ADD CONSTRAINT "price_observation_menu_item_id_menu_item_id_fk" FOREIGN KEY ("menu_item_id") REFERENCES "public"."menu_item"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "channel_listing" ADD CONSTRAINT "channel_listing_menu_item_id_menu_item_id_fk" FOREIGN KEY ("menu_item_id") REFERENCES "public"."menu_item"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "dish_market_stat" ADD CONSTRAINT "dish_market_stat_canonical_dish_id_canonical_dish_id_fk" FOREIGN KEY ("canonical_dish_id") REFERENCES "public"."canonical_dish"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "outbound_click" ADD CONSTRAINT "outbound_click_user_ref_app_user_id_fk" FOREIGN KEY ("user_ref") REFERENCES "public"."app_user"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "outbound_click" ADD CONSTRAINT "outbound_click_menu_item_id_menu_item_id_fk" FOREIGN KEY ("menu_item_id") REFERENCES "public"."menu_item"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
