ALTER TABLE "product"
  ADD COLUMN "sku" text,
  ADD COLUMN "target_membership_code" text,
  ADD COLUMN "description2" text,
  ADD COLUMN "stock" integer;

CREATE INDEX "product_sku_idx" ON "product" USING btree ("sku");


