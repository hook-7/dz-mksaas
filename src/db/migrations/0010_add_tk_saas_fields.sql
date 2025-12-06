ALTER TABLE "user" ADD COLUMN "tk_saas_user_id" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "synced" boolean DEFAULT false NOT NULL;--> statement-breakpoint
CREATE INDEX "user_tk_saas_user_id_idx" ON "user" USING btree ("tk_saas_user_id");

