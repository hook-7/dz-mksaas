CREATE TABLE "shop" (
	"id" text PRIMARY KEY NOT NULL,
	"shop_code" text NOT NULL,
	"shop_name" text NOT NULL,
	"shop_type" text,
	"region" text,
	"status" text DEFAULT 'initializing' NOT NULL,
	"shop_avatar" text,
	"bound_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "shop_shop_code_unique" UNIQUE("shop_code")
);
--> statement-breakpoint
CREATE UNIQUE INDEX "shop_code_idx" ON "shop" USING btree ("shop_code");--> statement-breakpoint
CREATE INDEX "shop_status_idx" ON "shop" USING btree ("status");--> statement-breakpoint
CREATE INDEX "shop_region_idx" ON "shop" USING btree ("region");--> statement-breakpoint
CREATE INDEX "shop_type_idx" ON "shop" USING btree ("shop_type");