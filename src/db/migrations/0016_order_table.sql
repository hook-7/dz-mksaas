CREATE TABLE IF NOT EXISTS "order" (
  "id" text PRIMARY KEY,
  "order_no" text NOT NULL,
  "user_id" text NOT NULL,
  "product_id" text,
  "product_type" text,
  "product_name" text,
  "quantity" integer NOT NULL DEFAULT 1,
  "original_amount" integer NOT NULL,
  "discount_amount" integer NOT NULL DEFAULT 0,
  "other_discount_amount" integer DEFAULT 0,
  "final_amount" integer NOT NULL,
  "paid_amount" integer,
  "currency" text NOT NULL DEFAULT 'USD',
  "payment_method" text,
  "payment_channel" text DEFAULT 'stripe',
  "payment_status" text NOT NULL DEFAULT 'pending',
  "payment_id" text,
  "invoice_id" text,
  "stripe_session_id" text,
  "stripe_payment_intent_id" text,
  "metadata" text,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "paid_at" timestamp,
  "updated_at" timestamp NOT NULL DEFAULT now()
);

ALTER TABLE "order"
  ADD CONSTRAINT "order_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "user"("id")
  ON DELETE CASCADE;

CREATE INDEX "order_user_id_idx" ON "order" USING btree ("user_id");
CREATE INDEX "order_status_idx" ON "order" USING btree ("payment_status");
CREATE INDEX "order_created_at_idx" ON "order" USING btree ("created_at");
CREATE UNIQUE INDEX "order_invoice_id_idx" ON "order" USING btree ("invoice_id");
CREATE UNIQUE INDEX "order_order_no_idx" ON "order" USING btree ("order_no");
CREATE INDEX "order_payment_id_idx" ON "order" USING btree ("payment_id");


