ALTER TABLE "product" DROP CONSTRAINT "product_stripe_price_id_unique";--> statement-breakpoint
DROP INDEX "product_stripe_price_id_idx";--> statement-breakpoint
ALTER TABLE "product" ALTER COLUMN "stripe_price_id" DROP NOT NULL;--> statement-breakpoint
CREATE INDEX "product_stripe_price_id_idx" ON "product" USING btree ("stripe_price_id");