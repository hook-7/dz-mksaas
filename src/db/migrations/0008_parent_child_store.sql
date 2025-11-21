CREATE TABLE "store_user_relationship" (
	"id" text PRIMARY KEY NOT NULL,
	"store_id" text NOT NULL,
	"parent_user_id" text NOT NULL,
	"child_user_id" text NOT NULL,
	"relationship_role" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "store_user_relationship" ADD CONSTRAINT "store_user_relationship_parent_user_id_user_id_fk" FOREIGN KEY ("parent_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "store_user_relationship" ADD CONSTRAINT "store_user_relationship_child_user_id_user_id_fk" FOREIGN KEY ("child_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "store_user_relationship_parent_idx" ON "store_user_relationship" USING btree ("parent_user_id");
--> statement-breakpoint
CREATE INDEX "store_user_relationship_child_idx" ON "store_user_relationship" USING btree ("child_user_id");
--> statement-breakpoint
CREATE INDEX "store_user_relationship_store_idx" ON "store_user_relationship" USING btree ("store_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "store_user_relationship_store_parent_child_idx" ON "store_user_relationship" USING btree ("store_id","parent_user_id","child_user_id");

