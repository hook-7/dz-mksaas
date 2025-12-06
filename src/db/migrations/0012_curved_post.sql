ALTER TABLE "product_price" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "product_price" CASCADE;--> statement-breakpoint
ALTER TABLE "product" ADD COLUMN "stripe_price_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "product" ADD COLUMN "amount" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "product" ADD COLUMN "currency" text DEFAULT 'USD' NOT NULL;--> statement-breakpoint
ALTER TABLE "product" ADD COLUMN "payment_type" text NOT NULL;--> statement-breakpoint
ALTER TABLE "product" ADD COLUMN "interval" text;--> statement-breakpoint
ALTER TABLE "product" ADD COLUMN "trial_period_days" integer;--> statement-breakpoint
ALTER TABLE "product" ADD COLUMN "allow_promotion_code" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "product" ADD COLUMN "original_amount" integer;--> statement-breakpoint
ALTER TABLE "product" ADD COLUMN "discount_rate" integer;--> statement-breakpoint
CREATE UNIQUE INDEX "product_stripe_price_id_idx" ON "product" USING btree ("stripe_price_id");--> statement-breakpoint
ALTER TABLE "product" ADD CONSTRAINT "product_stripe_price_id_unique" UNIQUE("stripe_price_id");