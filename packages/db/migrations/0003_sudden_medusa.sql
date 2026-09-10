ALTER TABLE "canonical_dish" ALTER COLUMN "embedding" SET DATA TYPE vector(384);--> statement-breakpoint
ALTER TABLE "dish_mapping" ALTER COLUMN "canonical_dish_id" DROP NOT NULL;