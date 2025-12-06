CREATE TABLE "membership_tier" (
	"id" text PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"name" text,
	"level" integer NOT NULL,
	"discount_rate" integer NOT NULL,
	"disabled" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "membership_tier_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE UNIQUE INDEX "membership_tier_code_idx" ON "membership_tier" USING btree ("code");--> statement-breakpoint
CREATE INDEX "membership_tier_level_idx" ON "membership_tier" USING btree ("level");--> statement-breakpoint
CREATE INDEX "membership_tier_disabled_idx" ON "membership_tier" USING btree ("disabled");--> statement-breakpoint
CREATE INDEX "membership_tier_sort_order_idx" ON "membership_tier" USING btree ("sort_order");--> statement-breakpoint

-- Seed default membership tiers
INSERT INTO "membership_tier"
  ("id", "code", "name", "level", "discount_rate", "disabled", "sort_order")
VALUES
  ('free', 'free', '免费版', 1, 100, false, 1),
  ('personal', 'personal', '个人版', 2, 95, false, 2),
  ('business', 'business', '商家版', 3, 90, false, 3),
  ('pro-seller', 'pro-seller', '大卖版', 4, 85, false, 4);
