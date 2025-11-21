CREATE TABLE "invite_link" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"link" text NOT NULL,
	"expires_at" timestamp DEFAULT now() + interval '24 hours' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "invite_link" ADD CONSTRAINT "invite_link_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "invite_link_user_id_idx" ON "invite_link" USING btree ("user_id");
--> statement-breakpoint
CREATE INDEX "invite_link_expires_at_idx" ON "invite_link" USING btree ("expires_at");
--> statement-breakpoint
CREATE UNIQUE INDEX "invite_link_link_idx" ON "invite_link" USING btree ("link");
